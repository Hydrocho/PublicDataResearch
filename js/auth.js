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
    if (!/^\d{4}$/.test(pw)) return { error: '鍮꾨?踰덊샇??4?먮━ ?レ옄?ъ빞 ?⑸땲??' };
    
    const hashedPw = await hashPin(pw);
    const { data, error } = await supabaseClient
        .from('students')
        .select('*')
        .eq('student_id', id)
        .eq('password', hashedPw)
        .single();
    
    if (error || !data) return { error: '?숇쾲 ?먮뒗 鍮꾨?踰덊샇瑜??뺤씤?댁＜?몄슂.' };
    return { success: true, user: data };
}

export async function handleSignup(id, pw, name) {
    if (!/^\d{4}$/.test(pw)) return { error: '鍮꾨?踰덊샇??4?먮━ ?レ옄?ъ빞 ?⑸땲??' };
    
    const hashedPw = await hashPin(pw);
    const { error } = await supabaseClient.from('students').insert([
        { student_id: id, password: hashedPw, name: name }
    ]);
    
    if (error) return { error: '?대? 議댁옱?섎뒗 ?숇쾲?낅땲??' };
    return { success: true };
}

export async function fetchAllStudents() {
    const { data, error } = await supabaseClient
        .from('students')
        .select('student_id, name, created_at')
        .order('student_id', { ascending: true });
    return { data, error };
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
 * 팀원 전체(나 포함)의 로그 중 가장 최신 내용을 하나 가져옴 (공동 작업용)
 */
export async function fetchLatestTeamJournal(currentStudentId, stepId) {
    // 1. 내가 속한 승인된 팀 찾기
    const { data: allApps } = await supabaseClient
        .from('competition_applications')
        .select('*')
        .eq('status', 'completed');

    const myApp = (allApps || []).find(app => {
        if (app.created_by === currentStudentId) return true;
        const members = Array.isArray(app.team_data) ? app.team_data : [];
        return members.some(m => m.student_id === currentStudentId);
    });

    // 팀이 없으면 내 로그만 검색
    const targetIds = myApp 
        ? [myApp.created_by, ...(Array.isArray(myApp.team_data) ? myApp.team_data.map(m => m.student_id) : [])]
        : [currentStudentId];

    const { data, error } = await supabaseClient
        .from('activity_log')
        .select('*')
        .in('student_id', targetIds)
        .eq('step_id', stepId)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1);

    return { data: data || [], error, isTeam: !!myApp, teamName: myApp?.team_name };
}

/**
 * Teacher View: Fetch ALL Step 1 (Problem Definition) logs from all students
 */
export async function fetchAllProblemDefinitionsForTeacher() {
    // 1. Get all logs for step_id = 3 (Research Journal)
    const { data: logs, error: logsError } = await supabaseClient
        .from('activity_log')
        .select('*')
        .eq('step_id', 3)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false });

    if (logsError || !logs) return { data: logs, error: logsError };

    // 2. Fetch student names
    const studentIds = [...new Set(logs.map(l => l.student_id).filter(id => id))];
    let nameMap = {};
    if (studentIds.length > 0) {
        const { data: students } = await supabaseClient
            .from('students')
            .select('student_id, name')
            .in('student_id', studentIds);
        if (students) students.forEach(s => { nameMap[s.student_id] = s.name; });
    }

    // 3. Fetch approved team applications
    const { data: apps } = await supabaseClient
        .from('competition_applications')
        .select('*')
        .eq('status', 'completed');

    // 4. Map students to teams
    const studentToTeam = {};
    (apps || []).forEach(app => {
        const members = Array.isArray(app.team_data) ? app.team_data : [];
        const allIds = [app.created_by, ...members.map(m => m.student_id)].filter(id => id);
        allIds.forEach(id => {
            studentToTeam[id] = { team_name: app.team_name, appId: app.id };
        });
    });

    // 5. Group by team (appId) or individual student_id
    const logMap = new Map();
    logs.forEach(log => {
        const teamInfo = studentToTeam[log.student_id];
        const groupKey = teamInfo ? `team_${teamInfo.appId}` : `indiv_${log.student_id}`;
        
        if (!logMap.has(groupKey)) {
            logMap.set(groupKey, {
                ...log,
                student_name: nameMap[log.student_id] || log.student_id,
                team_name: teamInfo?.team_name || null,
                _isTeam: !!teamInfo
            });
        }
    });

    return { data: Array.from(logMap.values()), error: null };
}

/**
 * Teacher View: Fetch ALL Step 0 (Basic Knowledge Survey) logs from all students
 */
export async function fetchAllKnowledgeSurveysForTeacher() {
    // 1. Get all logs for step_id = 0
    const { data: logs, error: logsError } = await supabaseClient
        .from('activity_log')
        .select('*')
        .eq('step_id', 0)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false });

    if (logsError || !logs) return { data: logs, error: logsError };

    // 2. Fetch student names
    const studentIds = [...new Set(logs.map(l => l.student_id).filter(id => id))];
    let nameMap = {};
    if (studentIds.length > 0) {
        const { data: students } = await supabaseClient
            .from('students')
            .select('student_id, name')
            .in('student_id', studentIds);
        if (students) students.forEach(s => { nameMap[s.student_id] = s.name; });
    }

    // 3. Deduplicate by student_id (Keep latest)
    const logMap = new Map();
    logs.forEach(log => {
        if (!logMap.has(log.student_id)) {
            logMap.set(log.student_id, {
                ...log,
                student_name: nameMap[log.student_id] || log.student_id
            });
        }
    });

    return { data: Array.from(logMap.values()), error: null };
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

/** 援먯궗媛 吏곸젒 ?깅줉???곗씠?곗뀑 ?????metadata.teacher_email濡??먯옉?깆옄 湲곕줉 */
export async function saveTeacherDataset(teacherEmail, dataName, fileUrl, metadata = {}, sizeKb = null, totalRows = null) {
    const enrichedMetadata = {
        ...(metadata || {}),
        teacher_email: teacherEmail,   // ?щ같???꾩뿉???먯옉?깆옄 異붿쟻??
        ...(totalRows !== null ? { row_count: totalRows } : {}),
        ...(sizeKb !== null ? { size_kb: sizeKb } : {})
    };
    const { data, error } = await supabaseClient
        .from('student_datasets')
        .insert([{
            student_id: teacherEmail,
            data_name: dataName,
            file_url: fileUrl,
            metadata: enrichedMetadata,
            is_shared: true,
            is_research_use: true,
        }])
        .select();
    return { data, error };
}

export async function updateDatasetDetails(id, updates) {
    const { data, error } = await supabaseClient
        .from('student_datasets')
        .update(updates)
        .eq('id', id)
        .select();
    return { data, error };
}

/** 援먯궗媛 吏곸젒 ?깅줉???곗씠?곗뀑 ??젣 ???숈깮 ?щ같???꾩뿉??援먯궗媛 ??젣 媛??*/
export async function deleteTeacherDataset(id) {
    // student_id媛 ?щ같?뺣릺???덉쓣 ???덉쑝誘濡?id濡쒕쭔 議고쉶
    const { data: ds } = await supabaseClient
        .from('student_datasets')
        .select('file_url')
        .eq('id', id)
        .single();

    if (ds?.file_url) {
        let storagePath = ds.file_url;
        if (storagePath.startsWith('datasets/')) storagePath = storagePath.replace('datasets/', '');
        await supabaseClient.storage.from('datasets').remove([storagePath]);
    }

    const { error } = await supabaseClient
        .from('student_datasets')
        .delete()
        .eq('id', id);
    return { error };
}

/** 援먯궗 ?낅줈???먮즺???묒꽦??student_id)瑜??뱀젙 ?숈깮?쇰줈 蹂寃?*/
export async function reassignDatasetToStudent(datasetId, newStudentId, teacherEmail = null) {
    // To ensure teacher ownership is preserved even after reassignment,
    // we fetch and update the metadata with the teacher's email.
    const { data: current } = await supabaseClient
        .from('student_datasets')
        .select('metadata')
        .eq('id', datasetId)
        .single();
    
    const newMetadata = { ...(current?.metadata || {}) };
    if (teacherEmail) newMetadata.teacher_email = teacherEmail;

    const { error } = await supabaseClient
        .from('student_datasets')
        .update({ 
            student_id: newStudentId,
            metadata: newMetadata 
        })
        .eq('id', datasetId);
    return { error };
}

export async function saveStudentDataset(studentId, dataName, fileUrl, metadata = {}, sizeKb = null, totalRows = null) {
    // Store row_count and size_kb inside the metadata JSON.
    const enrichedMetadata = {
        ...(metadata || {}),
        ...(totalRows !== null ? { row_count: totalRows } : {}),
        ...(sizeKb !== null ? { size_kb: sizeKb } : {})
    };

    // Auto-tag teacher ownership if the uploader is a teacher (identified by email)
    if (studentId && studentId.includes('@')) {
        enrichedMetadata.teacher_email = studentId;
    }

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
            error: { message: '?ㅻⅨ ?ъ슜?먭? ?곌뎄???쒖슜 以묒씤 ?곗씠?곕뒗 ??젣?????놁뒿?덈떎. 怨듭쑀瑜?癒쇱? ?댁젣??二쇱꽭??' },
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
                error: { message: '?ㅻⅨ ?ъ슜?먭? ?대? ?곌뎄???쒖슜 以묒씤 ?곗씠?곕뒗 怨듭쑀瑜??댁젣?????놁뒿?덈떎.' },
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
            return { error: { message: '?섏젙 沅뚰븳???놁뒿?덈떎.' }, status: 403 };
        }
        query = query.eq('student_id', studentId);
    }
        
    const { data, error } = await query.select();
        
    if (!error && (!data || data.length === 0)) {
        return { error: { message: 'DB ?낅뜲?댄듃???ㅽ뙣?덉뒿?덈떎. (沅뚰븳 ?먮뒗 ID ?뺤씤 ?꾩슂)' } };
    }
    
    return { data, error };
}

/**
 * 추천 사이트 공유 (Step 6) 관련 기능
 */
export async function fetchRecommendedSites() {
    const { data, error } = await supabaseClient
        .from('recommended_sites')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
    return { data, error };
}

export async function updateRecommendedSitesOrder(updates) {
    const promises = updates.map(u => 
        supabaseClient.from('recommended_sites').update({ sort_order: u.sort_order }).eq('id', u.id)
    );
    const results = await Promise.all(promises);
    return { error: results.find(r => r.error)?.error };
}

export async function createRecommendedSite(url, description, authorId, authorName) {
    const { data, error } = await supabaseClient
        .from('recommended_sites')
        .insert([{
            url,
            description,
            author_id: authorId,
            author_name: authorName
        }])
        .select();
    return { data, error };
}

export async function updateRecommendedSite(id, url, description) {
    const { data, error } = await supabaseClient
        .from('recommended_sites')
        .update({ url, description })
        .eq('id', id)
        .select();
    return { data, error };
}

export async function deleteRecommendedSite(id) {
    const { error } = await supabaseClient
        .from('recommended_sites')
        .delete()
        .eq('id', id);
    return { error };
}

/**
 * Toggle the is_research_use status of a dataset
 */
export async function toggleDatasetResearch(id, isResearchUse, studentId) {
    if (!studentId || studentId === 'Guest') {
        return { error: { message: '수정 권한이 없습니다.' }, status: 403 };
    }
    
    const { data, error } = await supabaseClient
        .from('student_datasets')
        .update({ is_research_use: isResearchUse })
        .eq('id', id)
        .eq('student_id', studentId)
        .select();
        
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
 * Fetch specific datasets with their full data content for bulk download
 */
export async function fetchDatasetContentBulk(ids) {
    const { data, error } = await supabaseClient
        .from('student_datasets')
        .select('id, data_name, file_url, student_id')
        .in('id', ids);
    
    if (error) throw error;
    return data || [];
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
 * Fetch team member datasets that are relevant for research (4?④퀎):
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
        else ds.total_rows = '議고쉶 遺덇?';
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

export async function submitCompetitionApplication(teamData, studentId, teamName = '') {
    const { data, error } = await supabaseClient
        .from('competition_applications')
        .insert([{
            team_data: teamData,
            created_by: studentId,
            team_name: teamName
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

export async function updateCompetitionApplication(id, teamData, teamName = '') {
    const { data, error } = await supabaseClient
        .from('competition_applications')
        .update({ 
            team_data: teamData,
            team_name: teamName
        })
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

// ?? 異쒖꽍 泥댄겕 ??????????????????????????????????????????????
export async function fetchAttendanceDates() {
    const { data, error } = await supabaseClient
        .from('attendance')
        .select('date')
        .order('date', { ascending: false });
    if (error) return { data: [], error };
    const unique = [...new Set((data || []).map(r => r.date))];
    return { data: unique, error: null };
}

export async function fetchAttendanceByDate(date) {
    const { data, error } = await supabaseClient
        .from('attendance')
        .select('student_id, status, note')
        .eq('date', date);
    return { data: data || [], error };
}

export async function upsertAttendance(records) {
    // records: [{ date, student_id, status, note }]
    const { error } = await supabaseClient
        .from('attendance')
        .upsert(records, { onConflict: 'date,student_id' });
    return { error };
}

// ?? 援먯궗 ?뚯뒪????Supabase 湲곕컲 ??????????????????????????????

/** ?꾩옱 濡쒓렇?명븳 援먯궗???대찓??諛섑솚 */
async function getTeacherEmail() {
    try {
        const { data } = await supabaseClient.auth.getUser();
        return data?.user?.email || null;
    } catch {
        return null;
    }
}

/** 援먯궗媛 ?좏깮???뚯뒪???곗씠?곗뀑 ID 紐⑸줉 議고쉶 */
export async function getTeacherResearchIds() {
    const email = await getTeacherEmail();
    if (!email) return [];
    const { data, error } = await supabaseClient
        .from('teacher_test_datasets')
        .select('dataset_id')
        .eq('teacher_email', email);

    if (error) {
        console.error('getTeacherResearchIds error:', error);
        return [];
    }
    return (data || []).map(r => String(r.dataset_id));
}

/** 援먯궗 ?뚯뒪???곗씠?곗뀑 ?좏깮/?댁젣 */
export async function setTeacherResearchId(id, checked) {
    const email = await getTeacherEmail();
    if (!email) return;
    if (checked) {
        const { error } = await supabaseClient
            .from('teacher_test_datasets')
            .upsert({ teacher_email: email, dataset_id: id },
                    { onConflict: 'teacher_email,dataset_id' });
        if (error) console.error('setTeacherResearchId insert error:', error);
    } else {
        const { error } = await supabaseClient
            .from('teacher_test_datasets')
            .delete()
            .eq('teacher_email', email)
            .eq('dataset_id', id);
        if (error) console.error('setTeacherResearchId delete error:', error);
    }
}

/** 援먯궗 ?뚯뒪???곗씠?곗뀑 ?쇨큵 ?좏깮/?댁젣 (?꾩껜 泥댄겕????DB ?붿껌 1?? */
export async function setTeacherResearchIdBulk(ids, checked) {
    if (!ids || ids.length === 0) return;
    const email = await getTeacherEmail();
    if (!email) return;
    if (checked) {
        const rows = ids.map(id => ({ teacher_email: email, dataset_id: id }));
        const { error } = await supabaseClient
            .from('teacher_test_datasets')
            .upsert(rows, { onConflict: 'teacher_email,dataset_id' });
        if (error) console.error('setTeacherResearchIdBulk insert error:', error);
    } else {
        const { error } = await supabaseClient
            .from('teacher_test_datasets')
            .delete()
            .eq('teacher_email', email)
            .in('dataset_id', ids);
        if (error) console.error('setTeacherResearchIdBulk delete error:', error);
    }
}


/** 紐⑤뱺 ?곗씠?곗뀑??is_research_use瑜??쇨큵 ?ㅼ젙 (援먯궗 ?꾩슜) */
export async function bulkSetResearchUseForTeacher(isUse) {
    const { data, error } = await supabaseClient
        .from('student_datasets')
        .update({ is_research_use: isUse })
        .not('id', 'is', null);
    return { data, error };
}

/** ?좏깮???뚯뒪???곗씠?곗뀑 紐⑸줉 議고쉶 (?숈깮 ?대쫫 ?ы븿) */
export async function fetchTeacherTestDatasets() {
    const storedIds = await getTeacherResearchIds();
    if (storedIds.length === 0) return { data: [], error: null };

    const { data: allDs, error } = await fetchAllDatasetsForTeacher();

    if (error || !allDs) return { data: [], error };

    const matched = allDs.filter(ds => storedIds.includes(String(ds.id)));
    if (matched.length === 0) return { data: [], error: null };

    const studentIds = [...new Set(matched.map(d => d.student_id).filter(Boolean))];
    const { data: students } = await supabaseClient
        .from('students')
        .select('student_id, name')
        .in('student_id', studentIds);

    const nameMap = {};
    (students || []).forEach(s => { nameMap[s.student_id] = s.name; });

    const result = matched.map(ds => ({
        ...ds,
        students: nameMap[ds.student_id] ? { name: nameMap[ds.student_id] } : null
    }));

    return { data: result, error: null };
}
// ?????????????????????????????????????????????????????????????

export async function fetchAllAttendanceOverview() {
    const { data, error } = await supabaseClient
        .from('attendance')
        .select('date, student_id, status, note')
        .order('date', { ascending: true });
    return { data: data || [], error };
}

// ?? 援먯궗 4?④퀎 ?뚯뒪??濡쒓렇 ??Supabase 湲곕컲 ???????????????????

/** 援먯궗 4?④퀎 ?뚯뒪??AI ?듬? ???(援먯궗??1媛??좎?) */
export async function setTeacherTestLog(log) {
    const email = await getTeacherEmail();
    if (!email) return;

    // PostgreSQL??jsonb?먯꽌 吏?먰븯吏 ?딅뒗 NULL (\u0000) 臾몄옄 ?쒓굅 濡쒖쭅 異붽?
    const sanitize = (val) => {
        if (typeof val === 'string') return val.replace(/\0/g, '');
        if (val && typeof val === 'object') {
            const copy = Array.isArray(val) ? [] : {};
            for (const k in val) copy[k] = sanitize(val[k]);
            return copy;
        }
        return val;
    };

    let contentObj;
    try { 
        contentObj = typeof log.content === 'string' ? JSON.parse(log.content) : log.content; 
    } catch { 
        contentObj = { answer: String(log.content) }; 
    }

    // ?곗씠???뺤젣 ?ㅽ뻾
    contentObj = sanitize(contentObj);

    // 湲곕줉 ?꾩쟻???꾪빐 ??젣 濡쒖쭅 ?쒓굅
    const { error } = await supabaseClient
        .from('teacher_test_logs')
        .insert({ teacher_email: email, content: contentObj });
    
    if (error) console.error('setTeacherTestLog error:', error);
    else console.log('setTeacherTestLog: success with sanitized content');
}



/** 援먯궗 4?④퀎 ?뚯뒪??濡쒓렇 議고쉶 (ID 誘몄?????理쒖떊 1媛? */
export async function getTeacherTestLog(logId = null) {
    const email = await getTeacherEmail();
    if (!email) return null;

    let query = supabaseClient
        .from('teacher_test_logs')
        .select('*')
        .eq('teacher_email', email);
    
    if (logId && logId !== 'teacher-test') {
        query = query.eq('id', logId);
    } else {
        query = query.order('created_at', { ascending: false }).limit(1);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) return null;

    const row = data[0];
    const contentStr = typeof row.content === 'object' ? JSON.stringify(row.content) : row.content;

    return {
        id: row.id, 
        content: contentStr,
        created_at: row.created_at,
    };
}

/** 5?④퀎?먯꽌 ?ъ슜: 紐⑤뱺 援먯궗???뚯뒪??湲곕줉 諛섑솚 */
export async function fetchTeacherTestActivityLogs() {
    const email = await getTeacherEmail();
    if (!email) return { data: [], error: null };

    const { data, error } = await supabaseClient
        .from('teacher_test_logs')
        .select('*')
        .eq('teacher_email', email)
        .order('created_at', { ascending: false });

    if (error) return { data: [], error };

    const logs = (data || []).map(row => ({
        id: row.id,
        content: typeof row.content === 'object' ? JSON.stringify(row.content) : row.content,
        created_at: row.created_at
    }));

    return { data: logs, error: null };
}

/** 援먯궗 4?④퀎 ?뚯뒪??濡쒓렇 ??젣 */
export async function deleteTeacherTestActivityLog(logId) {
    const email = await getTeacherEmail();
    if (!email) return { error: '濡쒓렇?몄씠 ?꾩슂?⑸땲??' };

    const { error } = await supabaseClient
        .from('teacher_test_logs')
        .delete()
        .eq('teacher_email', email)
        .eq('id', logId);

    return { error };
}

/** 5?④퀎 ?좏깮 ?곹깭 ??UI ?몄뀡 ???곹깭?대?濡?localStorage ?좎? */
export function getTeacherSelectedResearchId() {
    return localStorage.getItem('teacher_selected_research_id') || null;
}
export function setTeacherSelectedResearchId(id) {
    if (id == null) localStorage.removeItem('teacher_selected_research_id');
    else localStorage.setItem('teacher_selected_research_id', String(id));
}
// ?????????????????????????????????????????????????????????????

export async function fetchAttendanceSummaryByMonth(year, month) {
    // month: 1-based
    const from = `${year}-${String(month).padStart(2,'0')}-01`;
    const to   = `${year}-${String(month).padStart(2,'0')}-31`;
    const { data, error } = await supabaseClient
        .from('attendance')
        .select('date, status')
        .gte('date', from)
        .lte('date', to);
    if (error) return { data: {}, error };

    // { '2026-04-07': { present:5, late:1, absent:0, etc:0 }, ... }
    const summary = {};
    (data || []).forEach(r => {
        if (!summary[r.date]) summary[r.date] = { present:0, late:0, absent:0, etc:0 };
        summary[r.date][r.status] = (summary[r.date][r.status] || 0) + 1;
    });
    return { data: summary, error: null };
}

/**
 * 6단계: 작업 파일 공유 기능 관련 API
 */

// 게시글 및 파일 업로드
export async function createSharedPost(title, content, authorId, authorName, files = []) {
    try {
        // 1. 게시글 데이터 삽입
        const { data: post, error: postError } = await supabaseClient
            .from("shared_posts")
            .insert([{ title, content, author_id: authorId, author_name: authorName }])
            .select()
            .single();

        if (postError) throw postError;

        // 2. 파일 업로드 로직 (파일이 있는 경우)
        if (files.length > 0) {
            const uploadPromises = files.map(async (file) => {
                // 확장자만 안전하게 추출 (특수문자 제거)
                const parts = file.name.split(".");
                const fileExt = parts.length > 1 ? parts.pop().toLowerCase() : "";
                
                // 스토리지 경로는 영어/숫자 위주의 안전한 고유 ID로 생성
                const safeFileName = `${Math.random().toString(36).substring(2)}_${Date.now()}${fileExt ? "." + fileExt : ""}`;
                const filePath = `uploads/${post.id}/${safeFileName}`;

                const { error: uploadError } = await supabaseClient.storage
                    .from("shared-work-files")
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabaseClient.storage
                    .from("shared-work-files")
                    .getPublicUrl(filePath);

                return supabaseClient
                    .from("shared_files")
                    .insert([{ 
                        post_id: post.id, 
                        file_name: file.name, 
                        file_url: publicUrl, 
                        file_path: filePath,
                        file_size: file.size 
                    }]);
            });

            await Promise.all(uploadPromises);
        }

        return { success: true, post };
    } catch (error) {
        console.error("Error in createSharedPost:", error);
        return { error };
    }
}

// 게시글 목록 가져오기 (파일 및 댓글 포함)
export async function fetchSharedPosts() {
    const { data, error } = await supabaseClient
        .from("shared_posts")
        .select(`
            *,
            shared_files (*),
            shared_comments (*)
        `)
        .order("created_at", { ascending: false });
    
    return { data, error };
}

// 게시글 삭제
export async function deleteSharedPost(postId, files = []) {
    try {
        if (files.length > 0) {
            const paths = files.map(f => f.file_path).filter(p => p);
            if (paths.length > 0) {
                await supabaseClient.storage
                    .from("shared-work-files")
                    .remove(paths);
            }
        }

        const { error } = await supabaseClient
            .from("shared_posts")
            .delete()
            .eq("id", postId);

        return { success: !error, error };
    } catch (error) {
        return { error };
    }
}

// 게시글 제목/내용 수정
export async function updateSharedPost(postId, title, content) {
    const { error } = await supabaseClient
        .from("shared_posts")
        .update({ title, content })
        .eq("id", postId);
    return { success: !error, error };
}

// 개별 파일 추가
export async function addFilesToSharedPost(postId, files = []) {
    try {
        const uploadPromises = files.map(async (file) => {
            const parts = file.name.split(".");
            const fileExt = parts.length > 1 ? parts.pop().toLowerCase() : "";
            const safeFileName = `${Math.random().toString(36).substring(2)}_${Date.now()}${fileExt ? "." + fileExt : ""}`;
            const filePath = `uploads/${postId}/${safeFileName}`;

            const { error: uploadError } = await supabaseClient.storage
                .from("shared-work-files")
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabaseClient.storage
                .from("shared-work-files")
                .getPublicUrl(filePath);

            return supabaseClient
                .from("shared_files")
                .insert([{ 
                    post_id: postId, 
                    file_name: file.name, 
                    file_url: publicUrl, 
                    file_path: filePath,
                    file_size: file.size 
                }]);
        });

        await Promise.all(uploadPromises);
        return { success: true };
    } catch (error) {
        console.error("Error in addFilesToSharedPost:", error);
        return { error };
    }
}

// 개별 파일 삭제
export async function deleteFileFromSharedPost(fileId, filePath) {
    try {
        // 1. 스토리지에서 삭제
        if (filePath) {
            await supabaseClient.storage
                .from("shared-work-files")
                .remove([filePath]);
        }

        // 2. DB에서 삭제
        const { error } = await supabaseClient
            .from("shared_files")
            .delete()
            .eq("id", fileId);

        return { success: !error, error };
    } catch (error) {
        return { error };
    }
}

// 댓글 목록 가져오기
export async function fetchSharedComments(postId) {
    try {
        const { data, error } = await supabaseClient
            .from("shared_comments")
            .select("*")
            .eq("post_id", postId)
            .order("created_at", { ascending: true });
        
        return { data, error };
    } catch (error) {
        return { error };
    }
}

// 댓글 작성 (여러 파일 업로드 지원)
export async function createSharedComment(postId, authorId, authorName, content, files = []) {
    try {
        const uploadedFiles = [];
        
        if (files.length > 0) {
            const uploadPromises = files.map(async (file) => {
                const parts = file.name.split(".");
                const fileExt = parts.length > 1 ? parts.pop().toLowerCase() : "";
                const safeFileName = `${Math.random().toString(36).substring(2)}_${Date.now()}${fileExt ? "." + fileExt : ""}`;
                const filePath = `comments/${postId}/${safeFileName}`;

                const { error: uploadError } = await supabaseClient.storage
                    .from("shared-work-files")
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabaseClient.storage
                    .from("shared-work-files")
                    .getPublicUrl(filePath);

                uploadedFiles.push({
                    file_name: file.name,
                    file_url: publicUrl,
                    file_path: filePath,
                    file_size: file.size
                });
            });

            await Promise.all(uploadPromises);
        }

        const { data, error } = await supabaseClient
            .from("shared_comments")
            .insert([{ 
                post_id: postId, 
                author_id: authorId, 
                author_name: authorName, 
                content,
                files: uploadedFiles 
            }])
            .select()
            .single();
        
        return { data, error };
    } catch (error) {
        console.error("Error in createSharedComment:", error);
        return { error };
    }
}

// 댓글 삭제 (스토리지 첨부파일 자동 정리 포함)
export async function deleteSharedComment(commentId) {
    try {
        // 1. 첨부파일 조회 및 스토리지에서 선제 삭제
        const { data: comment, error: fetchError } = await supabaseClient
            .from("shared_comments")
            .select("files")
            .eq("id", commentId)
            .single();

        if (!fetchError && comment && comment.files && comment.files.length > 0) {
            const paths = comment.files.map(f => f.file_path).filter(p => p);
            if (paths.length > 0) {
                await supabaseClient.storage
                    .from("shared-work-files")
                    .remove(paths);
            }
        }

        // 2. DB에서 댓글 삭제
        const { error } = await supabaseClient
            .from("shared_comments")
            .delete()
            .eq("id", commentId);
        
        return { success: !error, error };
    } catch (error) {
        console.error("Error in deleteSharedComment:", error);
        return { error };
    }
}

// 댓글 수정
export async function updateSharedComment(commentId, content) {
    try {
        const { error } = await supabaseClient
            .from("shared_comments")
            .update({ content })
            .eq("id", commentId);
        
        return { success: !error, error };
    } catch (error) {
        console.error("Error in updateSharedComment:", error);
        return { error };
    }
}


