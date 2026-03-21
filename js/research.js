export async function onSaveRecord(stepId, content, state) {
    if (!state.user || state.user.student_id === 'Guest') {
        return alert('게스트 모드에서는 기록을 저장할 수 없습니다. 로그인이 필요합니다.');
    }

    let finalContent = content;
    if (typeof content === 'object') {
        if (!content.answer || !content.answer.trim()) {
            return alert('답변 기록 내용을 입력해주세요.');
        }
        finalContent = JSON.stringify(content);
    } else {
        if (!content.trim()) return alert('내용을 입력해주세요.');
    }
    
    const { saveActivityLog } = await import('./auth.js');
    const { error } = await saveActivityLog(state.user.student_id, stepId, finalContent);
    if (!error) alert('성공적으로 저장되었습니다!');
    else alert('저장 실패: ' + error.message);
}
