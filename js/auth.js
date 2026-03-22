import { supabaseClient } from './config.js';

export async function signInWithGoogle() {
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + window.location.pathname
        }
    });
    return { data, error };
}

export async function signOut() {
    const { error } = await supabaseClient.auth.signOut();
    return { error };
}

export async function isTeacherAuthorized(email) {
    const { data, error } = await supabaseClient
        .from('authorized_teachers')
        .select('email')
        .eq('email', email)
        .single();
    
    if (error || !data) return false;
    return true;
}

export async function hashPin(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function handleLogin(id, pw) {
    if (!/^\d{4}$/.test(pw)) return { error: '비밀번호는 4자리 숫자여야 합니다.' };
    
    const hashedPw = await hashPin(pw);
    const { data, error } = await supabaseClient
        .from('students')
        .select('*')
        .eq('student_id', id)
        .eq('password', hashedPw)
        .single();
    
    if (error || !data) return { error: '학번 또는 비밀번호를 확인해주세요.' };
    return { success: true, user: data };
}

export async function handleSignup(id, pw, name) {
    if (!/^\d{4}$/.test(pw)) return { error: '비밀번호는 4자리 숫자여야 합니다.' };
    
    const hashedPw = await hashPin(pw);
    const { error } = await supabaseClient.from('students').insert([
        { student_id: id, password: hashedPw, name: name }
    ]);
    
    if (error) return { error: '이미 존재하는 학번입니다.' };
    return { success: true };
}

export async function fetchAllStudents() {
    const { data, error } = await supabaseClient
        .from('students')
        .select('student_id, name, created_at')
        .order('student_id', { ascending: true });
    return { data, error };
}

export async function resetStudentPin(studentId) {
    const defaultPin = '0000';
    const hashedPw = await hashPin(defaultPin);
    const { error } = await supabaseClient
        .from('students')
        .update({ password: hashedPw })
        .eq('student_id', studentId);
    return { error };
}

export async function saveTopicSelection(studentId, topicId) {
    const { error } = await supabaseClient
        .from('topic_selections')
        .insert([{ student_id: studentId, topic_id: topicId }]);
    return { error };
}

export async function saveActivityLog(studentId, stepId, content) {
    const { error } = await supabaseClient
        .from('activity_log')
        .insert([{ student_id: studentId, step_id: stepId, content: content }]);
    return { error };
}

export async function fetchActivityLogs(studentId, stepId) {
    const { data, error } = await supabaseClient
        .from('activity_log')
        .select('*')
        .eq('student_id', studentId)
        .eq('step_id', stepId)
        .order('created_at', { ascending: false });
    return { data, error };
}

export async function deleteActivityLog(logId, studentId) {
    console.log('auth.js: Attempting to delete log ID (UUID):', logId, 'for student:', studentId);
    
    // Check if exists first
    const check = await supabaseClient
        .from('activity_log')
        .select('id')
        .eq('id', logId)
        .eq('student_id', studentId);
    console.log('auth.js: Pre-delete check result:', check.data, 'check error:', check.error);

    const response = await supabaseClient
        .from('activity_log')
        .delete()
        .eq('id', logId)
        .eq('student_id', studentId)
        .select();
    
    console.log('auth.js: Full delete response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        error: response.error
    });
    
    return response;
}

export async function saveStudentDataset(studentId, dataName, fileUrl, metadata = {}, sizeKb = null, totalRows = null) {
    // Store row_count and size_kb inside the metadata JSON.
    // This avoids needing new DB columns while still persisting the data.
    const enrichedMetadata = {
        ...(metadata || {}),
        ...(totalRows !== null ? { row_count: totalRows } : {}),
        ...(sizeKb !== null ? { size_kb: sizeKb } : {})
    };

    const { data, error } = await supabaseClient
        .from('student_datasets')
        .insert([{ 
            student_id: studentId, 
            data_name: dataName, 
            file_url: fileUrl, 
            metadata: enrichedMetadata
        }])
        .select();
    return { data, error };
}

export async function fetchStudentDatasets(studentId) {
    const { data, error } = await supabaseClient
        .from('student_datasets')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
    return { data, error };
}

export async function deleteStudentDataset(id, studentId) {
    console.log(`auth.js: deleteStudentDataset called with id: ${id}, studentId: ${studentId}`);
    
    // 0. Safety Check: Is anyone else using this for research?
    const { data: usage, error: checkError } = await supabaseClient
        .from('shared_research_use')
        .select('student_id')
        .eq('dataset_id', id)
        .eq('is_research_use', true);

    if (usage && usage.length > 0) {
        return { 
            error: { message: '다른 사용자가 연구에 활용 중인 데이터는 삭제할 수 없습니다. 공유를 먼저 해제해 주세요.' },
            status: 403 
        };
    }

    // 1. Delete from DB and get the deleted row's data to find the file_url
    const { data, error, status, statusText } = await supabaseClient
        .from('student_datasets')
        .delete()
        .eq('id', id)
        .eq('student_id', studentId)
        .select();
    
    if (error) {
        console.error('Supabase DB error:', error);
        return { data, error, status, statusText };
    }

    // 2. If DB deletion was successful, also delete the file from Storage
    if (data && data.length > 0) {
        const deletedDs = data[0];
        const fileUrl = deletedDs.file_url;

        // Only attempt storage deletion if it's a internal storage path (not an external URL)
        if (fileUrl && !fileUrl.startsWith('http')) {
            console.log(`auth.js: Attempting to delete storage file: ${fileUrl}`);
            const { error: storageError } = await supabaseClient.storage
                .from('datasets')
                .remove([fileUrl]);
            
            if (storageError) {
                console.error('Supabase Storage deletion error:', storageError);
            } else {
                console.log('auth.js: Storage file deleted successfully.');
            }
        }
    }
    
    console.log('auth.js: deletion result data:', data);
    return { data, error, status, statusText };
}

/**
 * Toggle the is_shared status of a dataset
 */
export async function toggleDatasetShare(id, isShared, studentId) {
    // 0. Safety Check: If unsharing, is anyone else using this for research?
    if (isShared === false) {
        const { data: usage, error: checkError } = await supabaseClient
            .from('shared_research_use')
            .select('student_id')
            .eq('dataset_id', id)
            .eq('is_research_use', true);

        if (usage && usage.length > 0) {
            return { 
                error: { message: '다른 사용자가 이미 연구에 활용 중인 데이터는 공유를 해제할 수 없습니다.' },
                status: 403 
            };
        }
    }
    
    const { data, error } = await supabaseClient
        .from('student_datasets')
        .update({ is_shared: isShared })
        .eq('id', id)
        .eq('student_id', studentId)
        .select();
        
    if (!error && (!data || data.length === 0)) {
        return { error: { message: 'DB 업데이트에 실패했습니다. (권한 또는 ID 확인 필요)' } };
    }
    
    return { data, error };
}

/**
 * Fetch all shared datasets from OTHER students 
 * AND include current student's research usage flag for those shared datasets
 */
export async function fetchSharedDatasets(currentStudentId) {
    // 1. Get all shared datasets
    const { data: sharedDs, error: dsError } = await supabaseClient
        .from('student_datasets')
        .select('*')
        .eq('is_shared', true)
        .neq('student_id', currentStudentId)
        .order('created_at', { ascending: false });

    if (dsError || !sharedDs) return { data: sharedDs, error: dsError };

    // 2. Get current student's research usage for these datasets
    const { data: usageData, error: usageError } = await supabaseClient
        .from('shared_research_use')
        .select('dataset_id, is_research_use')
        .eq('student_id', currentStudentId);

    // 3. Merge usage data into shared datasets
    const mergedData = sharedDs.map(ds => {
        const usage = usageData?.find(u => u.dataset_id === ds.id);
        return {
            ...ds,
            is_research_use: usage ? usage.is_research_use : false
        };
    });

    return { data: mergedData, error: null };
}

/**
 * Update 'Use for Research' status immediately
 */
export async function toggleResearchUse(datasetId, isUse, studentId, isOwner) {
    if (isOwner) {
        // Owner updates their own dataset record
        const { data, error } = await supabaseClient
            .from('student_datasets')
            .update({ is_research_use: isUse })
            .eq('id', datasetId)
            .eq('student_id', studentId)
            .select();
        return { data, error };
    } else {
        // Shared user updates their preference in a separate table
        const { data, error } = await supabaseClient
            .from('shared_research_use')
            .upsert({ 
                student_id: studentId, 
                dataset_id: datasetId, 
                is_research_use: isUse 
            }, { onConflict: 'student_id,dataset_id' })
            .select();
        return { data, error };
    }
}

/**
 * Fetch ALL datasets marked for 'Research Use' by the current student
 * (Both own datasets and shared datasets from others)
 */
export async function fetchAllResearchDatasets(studentId) {
    // 1. Fetch OWN research datasets
    const { data: ownData, error: ownError } = await supabaseClient
        .from('student_datasets')
        .select('*')
        .eq('student_id', studentId)
        .eq('is_research_use', true);

    if (ownError) return { error: ownError };

    // 2. Fetch SHARED research datasets
    const { data: usageData, error: usageError } = await supabaseClient
        .from('shared_research_use')
        .select('dataset_id')
        .eq('student_id', studentId)
        .eq('is_research_use', true);

    if (usageError) return { error: usageError };

    let sharedData = [];
    if (usageData && usageData.length > 0) {
        const sharedIds = usageData.map(u => u.dataset_id);
        const { data: sharedRes, error: sharedError } = await supabaseClient
            .from('student_datasets')
            .select('*')
            .in('id', sharedIds);
        
        if (!sharedError) sharedData = sharedRes;
    }

    const allDatasets = [...ownData, ...sharedData];

    // 4. Get exact row counts for EACH research dataset to enrich the AI prompt
    for (let ds of allDatasets) {
        const { count, error: countError } = await supabaseClient
            .from('student_datasets')
            .select('*', { count: 'exact', head: true })
            .eq('id', ds.id);
        
        if (!countError) ds.total_rows = count;
        else ds.total_rows = '조회 불가';
    }
    
    return { data: allDatasets, error: null };
}

/**
 * Update the name of a dataset
 */
export async function updateDatasetName(id, newName, studentId) {
    const { data, error } = await supabaseClient
        .from('student_datasets')
        .update({ data_name: newName })
        .eq('id', id)
        .eq('student_id', studentId)
        .select();
    return { data, error };
}
