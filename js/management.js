export async function onLoadDatasets(state, changeStep) {
    if (!state.user || state.user.student_id === 'Guest') {
        const container = document.getElementById('datasets-list-container');
        if (container) container.innerHTML = '<p class="text-muted">게스트 모드에서는 불러올 데이터가 없습니다.</p>';
        return;
    }
    const { fetchStudentDatasets } = await import('./auth.js');
    const { data, error } = await fetchStudentDatasets(state.user.student_id);
    
    const container = document.getElementById('datasets-list-container');
    if (!container) return;

    if (error || !data || data.length === 0) {
        container.innerHTML = '<p class="text-muted">아직 수집한 데이터가 없습니다. [데이터 탐색]에서 데이터를 찾아보세요!</p>';
        return;
    }

    container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="text-align: left; border-bottom: 2px solid var(--glass-border);">
                    <th style="padding: 12px; font-size: 0.85rem;">데이터셋 이름</th>
                    <th style="padding: 12px; font-size: 0.85rem;">제공기관</th>
                    <th style="padding: 12px; font-size: 0.85rem;">수집일</th>
                    <th style="padding: 12px; font-size: 0.85rem; text-align: right;">관리</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(ds => `
                    <tr style="border-bottom: 1px solid var(--glass-border);">
                        <td style="padding: 12px;"><strong>${ds.data_name}</strong></td>
                        <td style="padding: 12px; font-size: 0.85rem; color: var(--text-muted);">${ds.metadata?.provider || '-'}</td>
                        <td style="padding: 12px; font-size: 0.8rem;">${new Date(ds.created_at).toLocaleDateString()}</td>
                        <td style="padding: 12px; text-align: right; display: flex; gap: 5px; justify-content: flex-end;">
                            <button class="btn-secondary select-ds-btn" data-id="${ds.id}" style="font-size: 0.75rem; padding: 5px 10px;">연구하기</button>
                            <button class="btn-secondary delete-ds-btn" data-id="${ds.id}" style="font-size: 0.75rem; padding: 5px 10px; color: var(--accent);">삭제</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    // Action Listeners
    container.querySelectorAll('.select-ds-btn').forEach(btn => {
        btn.onclick = () => {
            const ds = data.find(d => d.id === btn.dataset.id);
            state.selectedTopic = { cat: { title: '관리데이터', id: 'managed' }, dataInfo: { name: ds.data_name, url: ds.metadata?.url || '#' } };
            document.getElementById('selected-topic-box').style.display = 'block';
            document.getElementById('current-topic-text').innerText = `[관리] ${ds.data_name}`;
            changeStep(2); // Jump to Problem Definition
        };
    });

    container.querySelectorAll('.delete-ds-btn').forEach(btn => {
        btn.onclick = async () => {
            if (!confirm('정말로 이 데이터셋을 삭제하시겠습니까? 관련 연구 기록은 유지되지만 수집 정보는 사라집니다.')) return;
            const { deleteStudentDataset } = await import('./auth.js');
            await deleteStudentDataset(btn.dataset.id);
            onLoadDatasets(state, changeStep); // Refresh list
        };
    });
}
