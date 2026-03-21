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

export async function saveStudentDataset(studentId, dataName, fileUrl, metadata) {
    const { data, error } = await supabaseClient
        .from('student_datasets')
        .insert([{ 
            student_id: studentId, 
            data_name: dataName, 
            file_url: fileUrl, 
            metadata: metadata 
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

export async function deleteStudentDataset(id) {
    const { error } = await supabaseClient
        .from('student_datasets')
        .delete()
        .eq('id', id);
    return { error };
}
