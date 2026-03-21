import { supabaseClient } from './config.js';

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

export async function saveStudentDataset(studentId, dataName, fileUrl, metadata, sizeKb = null) {
    const { data, error } = await supabaseClient
        .from('student_datasets')
        .insert([{ 
            student_id: studentId, 
            data_name: dataName, 
            file_url: fileUrl, 
            metadata: metadata,
            size_kb: sizeKb
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
                // We don't fail the whole operation if storage deletion fails, 
                // but we should log it.
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
export async function toggleDatasetShare(id, isShared) {
    const { data, error } = await supabaseClient
        .from('student_datasets')
        .update({ is_shared: isShared })
        .eq('id', id)
        .select();
    return { data, error };
}

/**
 * Fetch all shared datasets from OTHER students
 */
export async function fetchSharedDatasets(currentStudentId) {
    const { data, error } = await supabaseClient
        .from('student_datasets')
        .select('*')
        .eq('is_shared', true)
        .neq('student_id', currentStudentId) // Exclude own shared datasets
        .order('created_at', { ascending: false });
    return { data, error };
}

/**
 * Update the name of a dataset
 */
export async function updateDatasetName(id, newName) {
    const { data, error } = await supabaseClient
        .from('student_datasets')
        .update({ data_name: newName })
        .eq('id', id)
        .select();
    return { data, error };
}
