import { supabaseClient } from './config.js';

export async function autoLinkData(studentId, publicDataPk, publicDataDetailPk) {
    // 1. Construct the download URL provided by the user
    const downloadUrl = `https://www.data.go.kr/tcs/dss/selectFileDataDownload.do?publicDataDetailPk=${encodeURIComponent(publicDataDetailPk)}&publicDataPk=${publicDataPk}&atchFileId=&fileDetailSn=1&url=%2Ftcs%2Fdss%2FselectFileDataDownload.do`;
    
    try {
        // [IMPORTANT] In a real browser environment, this will hit a CORS error.
        // To solve this, we usually use a Supabase Edge Function as a proxy.
        // For this MVP, we will simulate the process and provide instructions for the proxy.
        
        console.log('연동 시도:', downloadUrl);
        
        // This is where we would call the Supabase Edge Function:
        // const { data, error } = await supabaseClient.functions.invoke('download-proxy', {
        //     body: { url: downloadUrl, studentId }
        // });

        // Let's assume the user has the file now or we are recording the intent.
        const { error } = await supabaseClient
            .from('student_datasets')
            .insert([{
                student_id: studentId,
                data_name: `데이터세트_${publicDataPk}`,
                file_url: downloadUrl
            }]);

        if (error) throw error;
        return { success: true, message: '데이터 연동 정보가 수파베이스에 기록되었습니다.' };
    } catch (err) {
        console.error('Data Link Error:', err);
        return { success: false, error: err.message };
    }
}

export async function uploadManualFile(studentId, file, fileName) {
    // 1. Storage Path: Use a safe ASCII-only path (TIMESTAMP.EXT) to avoid 'Invalid key' issues.
    // The descriptive name is stored in the Database, so we don't need it in the physical path.
    const ext = fileName.split('.').pop() || 'csv';
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

    // 3. Save descriptive metadata to Database (Korean/Spaces work fine here)
    const { error: dbError } = await supabaseClient
        .from('student_datasets')
        .insert([{
            student_id: studentId,
            data_name: fileName, // This is what the user sees in 'Data Management'
            file_url: storageData.path, // Path to the file in storage
            size_kb: Math.round(file.size / 1024)
        }]);

    if (dbError) {
        console.error('Database Save Error:', dbError);
        return { success: false, error: dbError.message };
    }
    
    return { success: true };
}
