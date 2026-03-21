import { supabaseClient } from './config.js';
import { fetchStudentDatasets, deleteStudentDataset } from './auth.js';

export async function onLoadDatasets(state, changeStep) {
    if (!state.user || state.user.student_id === 'Guest') {
        const container = document.getElementById('datasets-list-container');
        if (container) container.innerHTML = '<p class="text-muted">게스트 모드에서는 불러올 데이터가 없습니다.</p>';
        return;
    }
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
                    <tr class="clickable-row" data-id="${ds.id}" style="border-bottom: 1px solid var(--glass-border);">
                        <td style="padding: 12px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <i data-lucide="file-spreadsheet" size="18" style="color: var(--primary);"></i>
                                <strong>${ds.data_name}</strong>
                            </div>
                        </td>
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
    lucide.createIcons();

    // Row Click Listener (for details)
    container.querySelectorAll('.clickable-row').forEach(row => {
        row.addEventListener('click', (e) => {
            if (e.target.closest('button')) return; // Ignore if button was clicked
            const ds = data.find(d => String(d.id) === row.dataset.id);
            if (ds) openDatasetModal(ds);
        });
    });

    // Action Listeners
    container.querySelectorAll('.select-ds-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const ds = data.find(d => String(d.id) === btn.dataset.id);
            if (ds) {
                state.selectedTopic = { cat: { title: '관리데이터', id: 'managed' }, dataInfo: { name: ds.data_name, url: ds.metadata?.url || '#' } };
                document.getElementById('selected-topic-box').style.display = 'block';
                document.getElementById('current-topic-text').innerText = `[관리] ${ds.data_name}`;
                changeStep(2); // Jump to Problem Definition
            }
        });
    });

    container.querySelectorAll('.delete-ds-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!confirm('정말로 이 데이터셋을 삭제하시겠습니까?\n관련 연구 기록은 유지되지만 수집 정보는 사라집니다.')) return;
            
            const targetId = btn.dataset.id;
            console.log('Attempting to delete dataset with ID:', targetId);

            try {
                const { data, error, status } = await deleteStudentDataset(targetId, state.user.student_id);
                console.log('Supabase Delete Response - Status:', status, 'Data:', data, 'Error:', error);

                if (error) {
                    alert('삭제 중 오류가 발생했습니다: ' + error.message);
                } else if (!data || data.length === 0) {
                    alert('삭제 작업은 완료되었으나, 실제로 삭제된 행이 없습니다.\n(이미 삭제되었거나 권한이 부족할 수 있습니다)');
                    onLoadDatasets(state, changeStep); 
                } else {
                    console.log('Delete successful, deleted row:', data[0]);
                    onLoadDatasets(state, changeStep); // Refresh list
                }
            } catch (err) {
                console.error('Catch Error during delete:', err);
                alert('삭제 중 시스템 오류가 발생했습니다.');
            }
        });
    });
}

async function openDatasetModal(dataset) {
    const modal = document.getElementById('dataset-modal');
    const nameEl = document.getElementById('modal-data-name');
    const metaEl = document.getElementById('modal-meta-content');
    const previewEl = document.getElementById('modal-data-preview');
    const closeBtn = document.getElementById('close-modal');

    nameEl.innerText = dataset.data_name;
    
    // Render Meta Info
    const meta = dataset.metadata || {};
    const metaItems = [
        { label: '데이터 이름', value: dataset.data_name },
        { label: '제공 기관', value: meta.provider || '-' },
        { label: '수집 일시', value: new Date(dataset.created_at).toLocaleString() },
        { label: '데이터 형식', value: dataset.data_name.split('.').pop().toUpperCase() },
        { label: '파일 크기', value: dataset.size_kb ? `${dataset.size_kb} KB` : '확인 불가' },
        { label: '원본 출처', value: meta.url ? `<a href="${meta.url}" target="_blank" style="color: var(--primary);">바로가기</a>` : '-' }
    ];

    metaEl.innerHTML = metaItems.map(item => `
        <div class="meta-item">
            <span class="meta-label">${item.label}</span>
            <span class="meta-value">${item.value}</span>
        </div>
    `).join('');

    previewEl.innerHTML = '<p class="text-muted">파일 내용을 읽어오는 중입니다...</p>';
    modal.style.display = 'flex';

    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    // Close on overlay click
    modal.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
    };

    // Fetch and Parse Content
    try {
        let fileUrl = dataset.file_url;
        if (!fileUrl.startsWith('http')) {
            const { data } = supabaseClient.storage.from('datasets').getPublicUrl(fileUrl);
            fileUrl = data.publicUrl;
        }

        Papa.parse(fileUrl, {
            download: true,
            header: true,
            preview: 20,
            complete: (results) => {
                if (results.data && results.data.length > 0) {
                    renderPreviewTable(results.data, results.meta.fields);
                } else {
                    previewEl.innerHTML = '<p class="text-muted">내용을 표시할 수 없거나 비어있는 파일입니다.</p>';
                }
            },
            error: (err) => {
                console.error('File Parse Error:', err);
                previewEl.innerHTML = `<p style="color: var(--accent);">파일을 읽는 중 오류가 발생했습니다: ${err.message || 'CORS 제한 또는 파일 형식 오류'}</p>`;
            }
        });
    } catch (err) {
        previewEl.innerHTML = '<p style="color: var(--accent);">파일 경로를 확인할 수 없습니다.</p>';
    }
}

function renderPreviewTable(data, headers) {
    const previewEl = document.getElementById('modal-data-preview');
    
    if (!headers || headers.length === 0) {
        headers = Object.keys(data[0]);
    }

    previewEl.innerHTML = `
        <table class="preview-table">
            <thead>
                <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${data.map(row => `
                    <tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>
                `).join('')}
            </tbody>
        </table>
    `;
}
