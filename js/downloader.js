import { supabaseClient } from './config.js';

/**
 * [Optional] Feature to directly link a portal URL to the researcher's lab
 * Now correctly uses the descriptive dataName instead of numeric PKs.
 */
export async function autoLinkData(studentId, dataName, downloadUrl) {
    if (!studentId || studentId === 'Guest') return { error: '로그인 후 이용 가능합니다.' };

    const { data, error } = await supabaseClient
        .from('student_datasets')
        .insert([{
            student_id: studentId,
            data_name: dataName || '연동 데이터셋',
            file_url: downloadUrl
        }]);

    return { data, error };
}

export async function uploadManualFile(studentId, file, datasetName) {
    // 1. Storage Path: Use datasetName (Korean allowed). 
    // We remove the timestamp as requested, but keep the studentId folder for namespace.
    const ext = (file?.name ?? '').split('.').pop() || 'csv';
    // [Final Decision] Use timestamp-only (ASCII-safe) for the physical storage key. 
    // Supabase Storage in this project strictly rejects non-ASCII (Korean) keys with 'Invalid key'.
    // The descriptive Korean name is preserved in the database for UI display and browser download labels.
    const filePath = `${studentId}/${Date.now()}.${ext}`;
    
    console.log(`Uploading to storage: datasets/${filePath}`);

    // 2. Upload to Supabase Storage (Assumes 'datasets' bucket exists)
    const { data: storageData, error: storageError } = await supabaseClient.storage
        .from('datasets')
        .upload(filePath, file);

    if (storageError) {
        console.error('Storage Upload Error:', storageError);
        return { success: false, error: storageError.message };
    }

    // [New] Return only the uploaded path and size. 
    // The Database record will be created centrally in main.js.
    return { 
        success: true, 
        path: storageData.path, 
        size_kb: Math.round(file.size / 1024) 
    };
}
