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

export async function getTeacherRecord(email) {
    const { data, error } = await supabaseClient
        .from('authorized_teachers')
        .select('*')
        .eq('email', email)
        .single();
    
    if (error) return null;
    return data;
}

export async function requestTeacherAccess(email, name, school, reason) {
    const { error } = await supabaseClient
        .from('authorized_teachers')
        .insert([{ email, name, school, reason, status: 'pending' }]);
    return { error };
}

export async function fetchAllTeachers() {
    const { data, error } = await supabaseClient
        .from('authorized_teachers')
        .select('*')
        .order('status', { ascending: true }) // pending first
        .order('created_at', { ascending: false });
    return { data, error };
}

export async function updateTeacherStatus(id, newStatus) {
    const { data, error } = await supabaseClient
        .from('authorized_teachers')
        .update({ 
            status: newStatus,
            updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select();
    return { data, error };
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

/** Teacher-only: fetch a quick progress snapshot for all students */
export async function fetchStudentProgressSnapshot() {
    // 1. Get all students
    const { data: students, error: sErr } = await supabaseClient
        .from('students')
        .select('student_id, name, created_at')
        .order('student_id', { ascending: true });
    if (sErr) return { error: sErr };

    // 2. Get all activity log entries (just student_id and step_id)
    const { data: logs } = await supabaseClient
        .from('activity_log')
        .select('student_id, step_id, created_at');

    // 3. Get dataset counts per student
    const { data: datasets } = await supabaseClient
        .from('student_datasets')
        .select('student_id, id');

    // 4. Merge: compute max step_id and dataset count per student
    const logMap = {};
    (logs || []).forEach(l => {
        if (!logMap[l.student_id] || l.step_id > logMap[l.student_id].maxStep) {
            logMap[l.student_id] = { maxStep: l.step_id, lastActivity: l.created_at };
        }
    });

    const dsCountMap = {};
    (datasets || []).forEach(d => {
        dsCountMap[d.student_id] = (dsCountMap[d.student_id] || 0) + 1;
    });

    const merged = (students || []).map(s => ({
        ...s,
        maxStep: logMap[s.student_id]?.maxStep ?? -1,
        lastActivity: logMap[s.student_id]?.lastActivity ?? null,
        datasetCount: dsCountMap[s.student_id] ?? 0,
    }));

    return { data: merged };
}

/** Teacher-only: fetch all data for a specific student to show detail view */
export async function fetchStudentDetail(studentId) {
    const [logsRes, datasetsRes] = await Promise.all([
        supabaseClient
            .from('activity_log')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false }),
        supabaseClient
            .from('student_datasets')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false }),
    ]);
    return {
        logs: logsRes.data || [],
        datasets: datasetsRes.data || [],
        error: logsRes.error || datasetsRes.error,
    };
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

export async function updateStudentPin(studentId, newPin) {
    const hashedPw = await hashPin(newPin);
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

export async function fetchTeamActivityLogs(currentStudentId, stepId) {
    // 1. Find approved team
    const { data: allApps, error: appError } = await supabaseClient
        .from('competition_applications')
        .select('*')
        .eq('status', 'completed');

    if (appError || !allApps) return { data: [], error: appError };

    const myApp = allApps.find(app => {
        if (app.created_by === currentStudentId) return true;
        const members = Array.isArray(app.team_data) ? app.team_data : [];
        return members.some(m => m.student_id === currentStudentId);
    });

    if (!myApp) return { data: [], error: null };

    const members = Array.isArray(myApp.team_data) ? myApp.team_data : [];
    const allMemberIds = [myApp.created_by, ...members.map(m => m.student_id)]
        .filter(id => id && id !== currentStudentId);
    const uniqueMemberIds = [...new Set(allMemberIds)];
    if (uniqueMemberIds.length === 0) return { data: [], error: null };

    // 2. Fetch activity logs from team members
    const { data: logs, error } = await supabaseClient
        .from('activity_log')
        .select('*')
        .in('student_id', uniqueMemberIds)
        .eq('step_id', stepId)
        .order('created_at', { ascending: false });

    if (error || !logs) return { data: [], error };

    // 3. Fetch member names
    const { data: students } = await supabaseClient
        .from('students')
        .select('student_id, name')
        .in('student_id', uniqueMemberIds);

    const nameMap = {};
    (students || []).forEach(s => { nameMap[s.student_id] = s.name; });

    return {
        data: logs.map(log => ({
            ...log,
            _memberName: nameMap[log.student_id] || log.student_id,
            _isTeam: true
        })),
        error: null
    };
}

/**
 * Teacher View: Fetch ALL Step 1 (Problem Definition) logs from all students
 */
export async function fetchAllProblemDefinitionsForTeacher() {
    // 1. Get all logs for step_id = 3 (Step 1 internal ID)
    const { data: logs, error: logsError } = await supabaseClient
        .from('activity_log')
        .select('*')
        .eq('step_id', 3)
        .order('created_at', { ascending: false });

    if (logsError || !logs) return { data: logs, error: logsError };

    // 2. Fetch student names separately
    const studentIds = [...new Set(logs.map(l => l.student_id).filter(id => id))];
    let nameMap = {};
    if (studentIds.length > 0) {
        const { data: students } = await supabaseClient
            .from('students')
            .select('student_id, name')
            .in('student_id', studentIds);
        
        if (students) {
            students.forEach(s => {
                nameMap[s.student_id] = s.name;
            });
        }
    }

    const mergedData = logs.map(log => ({
        ...log,
        student_name: nameMap[log.student_id] || log.student_id
    }));

    return { data: mergedData, error: null };
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
export async function toggleDatasetShare(id, isShared, studentId, isTeacher = false) {
    console.log(`auth.js: toggleDatasetShare called with id: ${id}, isShared: ${isShared}, studentId: ${studentId}, isTeacher: ${isTeacher}`);
    
    // 0. Safety Check: If unsharing, is anyone else using this for research?
    // (We'll still check this even for teachers as a data integrity measure)
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
    
    let query = supabaseClient
        .from('student_datasets')
        .update({ is_shared: isShared })
        .eq('id', id);

    // If NOT a teacher, enforce student ownership
    if (!isTeacher) {
        if (!studentId || studentId === 'Guest') {
            return { error: { message: '수정 권한이 없습니다.' }, status: 403 };
        }
        query = query.eq('student_id', studentId);
    }
        
    const { data, error } = await query.select();
        
    if (!error && (!data || data.length === 0)) {
        return { error: { message: 'DB 업데이트에 실패했습니다. (권한 또는 ID 확인 필요)' } };
    }
    
    return { data, error };
}

/**
 * Fetch ALL datasets for teacher dashboard, including student names
 */
export async function fetchAllDatasetsForTeacher() {
    // 1. Get all datasets
    const { data: allDs, error: dsError } = await supabaseClient
        .from('student_datasets')
        .select('*')
        .order('created_at', { ascending: false });

    if (dsError || !allDs) return { data: allDs, error: dsError };

    // 2. Fetch student names separately
    const studentIds = [...new Set(allDs.map(d => d.student_id).filter(id => id))];
    let nameMap = {};
    if (studentIds.length > 0) {
        const { data: students } = await supabaseClient
            .from('students')
            .select('student_id, name')
            .in('student_id', studentIds);
        
        if (students) {
            students.forEach(s => {
                nameMap[s.student_id] = s.name;
            });
        }
    }

    const mergedData = allDs.map(ds => ({
        ...ds,
        students: nameMap[ds.student_id] ? { name: nameMap[ds.student_id] } : null
    }));

    return { data: mergedData, error: null };
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

    // 2. Fetch student names separately to avoid join relationship errors
    const studentIds = [...new Set(sharedDs.map(d => d.student_id).filter(id => id))];
    let nameMap = {};
    if (studentIds.length > 0) {
        const { data: students } = await supabaseClient
            .from('students')
            .select('student_id, name')
            .in('student_id', studentIds);
        
        if (students) {
            students.forEach(s => {
                nameMap[s.student_id] = s.name;
            });
        }
    }

    // 3. Get current student's research usage for these datasets
    const { data: usageData, error: usageError } = await supabaseClient
        .from('shared_research_use')
        .select('dataset_id, is_research_use')
        .eq('student_id', currentStudentId);

    // 4. Merge usage data and owner names into shared datasets
    const mergedData = sharedDs.map(ds => {
        const usage = usageData?.find(u => u.dataset_id === ds.id);
        return {
            ...ds,
            students: nameMap[ds.student_id] ? { name: nameMap[ds.student_id] } : null,
            is_research_use: usage ? usage.is_research_use : false
        };
    });

    return { data: mergedData, error: null };
}

/**
 * Update 'Use for Research' status immediately
 */
export async function toggleResearchUse(datasetId, isUse, studentId, isOwner, isTeacher = false) {
    if (isOwner || isTeacher) {
        // Owner or Teacher updates the dataset record directly
        let query = supabaseClient
            .from('student_datasets')
            .update({ is_research_use: isUse })
            .eq('id', datasetId);
        
        if (!isTeacher) {
            query = query.eq('student_id', studentId);
        }

        const { data, error } = await query.select();
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
 * Fetch team member datasets that are relevant for research (4단계):
 * Includes team member datasets where the member set is_research_use=true,
 * OR where the current student checked them via shared_research_use.
 */
export async function fetchTeamResearchDatasets(studentId) {
    // 1. Find the approved team
    const { data: allApps, error: appError } = await supabaseClient
        .from('competition_applications')
        .select('*')
        .eq('status', 'completed');

    if (appError || !allApps) return { data: [], error: appError };

    const myApp = allApps.find(app => {
        if (app.created_by === studentId) return true;
        const members = Array.isArray(app.team_data) ? app.team_data : [];
        return members.some(m => m.student_id === studentId);
    });

    if (!myApp) return { data: [], error: null };

    const members = Array.isArray(myApp.team_data) ? myApp.team_data : [];
    const allMemberIds = [myApp.created_by, ...members.map(m => m.student_id)]
        .filter(id => id && id !== studentId);
    const uniqueMemberIds = [...new Set(allMemberIds)];
    if (uniqueMemberIds.length === 0) return { data: [], error: null };

    // 2. Team member datasets where the member marked is_research_use=true
    const { data: ownerMarked, error: dsError } = await supabaseClient
        .from('student_datasets')
        .select('*')
        .in('student_id', uniqueMemberIds)
        .eq('is_research_use', true);

    if (dsError) return { data: [], error: dsError };

    // 3. Team member datasets the current student explicitly marked via shared_research_use
    const { data: usageData } = await supabaseClient
        .from('shared_research_use')
        .select('dataset_id')
        .eq('student_id', studentId)
        .eq('is_research_use', true);

    let studentMarked = [];
    if (usageData && usageData.length > 0) {
        const markedIds = usageData.map(u => u.dataset_id);
        const { data: sDs } = await supabaseClient
            .from('student_datasets')
            .select('*')
            .in('id', markedIds)
            .in('student_id', uniqueMemberIds);
        studentMarked = sDs || [];
    }

    // 4. Merge and deduplicate
    const merged = [...(ownerMarked || [])];
    const seen = new Set(merged.map(d => d.id));
    for (const ds of studentMarked) {
        if (!seen.has(ds.id)) { merged.push(ds); seen.add(ds.id); }
    }
    if (merged.length === 0) return { data: [], error: null };

    // 5. Fetch member names
    const { data: students } = await supabaseClient
        .from('students').select('student_id, name').in('student_id', uniqueMemberIds);
    const nameMap = {};
    (students || []).forEach(s => { nameMap[s.student_id] = s.name; });

    return {
        data: merged.map(ds => ({
            ...ds,
            students: nameMap[ds.student_id] ? { name: nameMap[ds.student_id] } : null,
            _isTeam: true
        })),
        error: null
    };
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

/**
 * Deletes a student account and associated private data.
 * Shared datasets (is_shared = true) are preserved by nullifying (or marker) the owner ID.
 */
export async function deleteStudentAccount(studentId) {
    console.log(`auth.js: deleteStudentAccount START for ${studentId}`);

    try {
        // 1. Handle datasets: Identify private vs shared
        const { data: datasets, error: dsError } = await supabaseClient
            .from('student_datasets')
            .select('id, file_url, is_shared')
            .eq('student_id', studentId);

        if (dsError) {
            console.error('auth.js: Failed to fetch student datasets:', dsError);
            return { success: false, error: dsError };
        }

        const sharedDs = datasets?.filter(d => d.is_shared) || [];
        const privateDs = datasets?.filter(d => !d.is_shared) || [];
        console.log(`auth.js: Found ${datasets?.length || 0} datasets (${sharedDs.length} shared, ${privateDs.length} private)`);

        // 2. Preserve Shared Datasets: Reassign to NULL
        if (sharedDs.length > 0) {
            console.log(`auth.js: Attempting to reassign ${sharedDs.length} shared datasets to NULL owner...`);
            const { error: updError } = await supabaseClient
                .from('student_datasets')
                .update({ student_id: null }) 
                .in('id', sharedDs.map(d => d.id));
            
            if (updError) {
                console.error('auth.js: Error preserving shared datasets (likely NOT NULL constraint or RLS):', updError);
                // If this fails and there's a FK constraint on students, the final delete WILL fail.
            } else {
                console.log('auth.js: Shared datasets reassigned successfully.');
            }
        }

        // 3. Delete Private Datasets and their Storage files
        if (privateDs.length > 0) {
            console.log(`auth.js: Deleting ${privateDs.length} private datasets...`);
            
            // Fix: Collect FULL storage paths (studentId/filename)
            const filePaths = privateDs
                .map(d => d.file_url)
                .filter(url => url && !url.startsWith('http'));
            
            console.log('auth.js: Storage files to remove:', filePaths);
                
            // Delete records from DB first
            const { error: delDbError } = await supabaseClient
                .from('student_datasets')
                .delete()
                .in('id', privateDs.map(d => d.id));

            if (delDbError) {
                console.error('auth.js: Error deleting private dataset records:', delDbError);
                return { success: false, error: delDbError };
            }

            // Delete from Storage
            if (filePaths.length > 0) {
                const { error: delStorageError } = await supabaseClient.storage
                    .from('datasets')
                    .remove(filePaths);
                if (delStorageError) console.error('auth.js: Error deleting private dataset files:', delStorageError);
                else console.log('auth.js: Private dataset files removed from storage.');
            }
        }

        // 4. Delete Activity Logs, Topic Selections, and Research Usage
        console.log('auth.js: Deleting activity logs and other related records...');
        const delResults = await Promise.all([
            supabaseClient.from('activity_log').delete().eq('student_id', studentId),
            supabaseClient.from('topic_selections').delete().eq('student_id', studentId),
            supabaseClient.from('shared_research_use').delete().eq('student_id', studentId),
        ]);

        delResults.forEach((res, idx) => {
            if (res.error) console.error(`auth.js: Error in Step 4 index ${idx}:`, res.error);
        });

        // 5. Finally delete the student record from students table
        console.log(`auth.js: FINAL STEP - Deleting student record ${studentId} from students table...`);
        const { error: finalError } = await supabaseClient
            .from('students')
            .delete()
            .eq('student_id', studentId);

        if (finalError) {
            console.error('auth.js: FINAL DELETE FAILED:', finalError);
            return { success: false, error: finalError };
        }

        console.log('auth.js: deleteStudentAccount COMPLETED SUCCESSFULLY.');
        return { success: true };
    } catch (err) {
        console.error('auth.js: Unexpected error in deleteStudentAccount:', err);
        return { success: false, error: err };
    }
}

export async function submitCompetitionApplication(teamData, studentId) {
    const { data, error } = await supabaseClient
        .from('competition_applications')
        .insert([{
            team_data: teamData,
            created_by: studentId
        }])
        .select();
    return { data, error };
}

export async function fetchCompetitionApplicationByStudent(studentId) {
    const { data, error } = await supabaseClient
        .from('competition_applications')
        .select('*')
        .eq('created_by', studentId)
        .maybeSingle();
    return { data, error };
}

export async function fetchCompetitionApplicationAsMember(studentId) {
    // Fetch all applications and find one where studentId appears in team_data
    const { data: allApps, error } = await supabaseClient
        .from('competition_applications')
        .select('*')
        .order('created_at', { ascending: false });

    if (error || !allApps) return { data: null, error };

    const found = allApps.find(app => {
        if (app.created_by === studentId) return false; // skip own apps
        const members = Array.isArray(app.team_data) ? app.team_data : [];
        return members.some(m => m.student_id === studentId);
    });

    return { data: found || null, error: null };
}

export async function updateCompetitionApplication(id, teamData) {
    const { data, error } = await supabaseClient
        .from('competition_applications')
        .update({ team_data: teamData })
        .eq('id', id)
        .select();
    return { data, error };
}

export async function deleteCompetitionApplication(id) {
    const { error } = await supabaseClient
        .from('competition_applications')
        .delete()
        .eq('id', id);
    return { error };
}

export async function updateApplicationStatus(id, status) {
    const { data, error } = await supabaseClient
        .from('competition_applications')
        .update({ status: status })
        .eq('id', id)
        .select();
    return { data, error };
}

export async function fetchAllCompetitionApplications() {
    const { data, error } = await supabaseClient
        .from('competition_applications')
        .select('*')
        .order('created_at', { ascending: false });
    return { data, error };
}

export async function fetchTeamDatasets(currentStudentId) {
    // 1. Find the approved team that includes this student
    const { data: allApps, error: appError } = await supabaseClient
        .from('competition_applications')
        .select('*')
        .eq('status', 'completed');

    if (appError || !allApps) return { data: [], error: appError };

    const myApp = allApps.find(app => {
        if (app.created_by === currentStudentId) return true;
        const members = Array.isArray(app.team_data) ? app.team_data : [];
        return members.some(m => m.student_id === currentStudentId);
    });

    if (!myApp) return { data: [], error: null };

    // 2. Collect team member IDs (excluding self)
    const members = Array.isArray(myApp.team_data) ? myApp.team_data : [];
    const allMemberIds = [myApp.created_by, ...members.map(m => m.student_id)]
        .filter(id => id && id !== currentStudentId);
    const uniqueMemberIds = [...new Set(allMemberIds)];

    if (uniqueMemberIds.length === 0) return { data: [], error: null };

    // 3. Fetch all datasets from team members regardless of is_shared
    const { data: teamDs, error: dsError } = await supabaseClient
        .from('student_datasets')
        .select('*')
        .in('student_id', uniqueMemberIds)
        .order('created_at', { ascending: false });

    if (dsError || !teamDs) return { data: [], error: dsError };

    // 4. Fetch member names
    const { data: students } = await supabaseClient
        .from('students')
        .select('student_id, name')
        .in('student_id', uniqueMemberIds);

    const nameMap = {};
    (students || []).forEach(s => { nameMap[s.student_id] = s.name; });

    // 5. Get current student's research usage for these datasets
    const { data: usageData } = await supabaseClient
        .from('shared_research_use')
        .select('dataset_id, is_research_use')
        .eq('student_id', currentStudentId);

    // 6. Merge
    const mergedData = teamDs.map(ds => {
        const usage = usageData?.find(u => u.dataset_id === ds.id);
        return {
            ...ds,
            students: nameMap[ds.student_id] ? { name: nameMap[ds.student_id] } : null,
            is_research_use: usage ? usage.is_research_use : false,
            _isTeam: true
        };
    });

    return { data: mergedData, teamMemberIds: uniqueMemberIds, error: null };
}
