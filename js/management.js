import { supabaseClient } from './config.js';
import { fetchStudentDatasets, deleteStudentDataset, toggleDatasetShare, fetchSharedDatasets, fetchTeamDatasets, updateDatasetName } from './auth.js';
import { openDatasetModal } from './ui.js';

export async function onLoadDatasets(state, changeStep) {
    if (!state.user || state.user.student_id === 'Guest') {
        const container = document.getElementById('datasets-list-container');
        if (container) container.innerHTML = '<p class="text-muted">게스트 모드에서는 불러올 데이터가 없습니다.</p>';
        return;
    }

    // Fetch own, team, and shared datasets
    const [ownRes, teamRes, sharedRes] = await Promise.all([
        fetchStudentDatasets(state.user.student_id),
        fetchTeamDatasets(state.user.student_id),
        fetchSharedDatasets(state.user.student_id)
    ]);

    const container = document.getElementById('datasets-list-container');
    if (!container) return;

    if (ownRes.error) {
        container.innerHTML = `<p class="text-muted">데이터를 불러오는 중 오류가 발생했습니다: ${ownRes.error.message}</p>`;
        return;
    }

    const ownData = ownRes.data || [];
    const teamData = teamRes.data || [];
    const teamMemberIds = teamRes.teamMemberIds || [];
    // Exclude team member datasets from the friends section to avoid duplicates
    const sharedData = (sharedRes.data || []).filter(ds => !teamMemberIds.includes(ds.student_id));

    let html = `
        <!-- Bulk Action Bar -->
        <div id="student-bulk-action-bar" style="display:none; position:sticky; top:0; z-index:100; margin-bottom:20px; padding:12px 20px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; align-items:center; justify-content:space-between; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1); animation:slideDown 0.2s ease-out; flex-wrap:wrap; gap:12px;">
            <div style="font-size:0.95rem; color:#1e40af; font-weight:700; display:flex; align-items:center; gap:8px;">
                <i data-lucide="check-circle" size="20"></i>
                <span id="student-bulk-count">0</span>개의 자료 선택됨
            </div>
            <div style="display:flex; gap:10px;">
                <button id="student-bulk-download-btn" class="btn-primary" style="background:#0284c7; border-color:#0284c7; font-size:0.85rem; padding:8px 18px; font-weight:700; display:flex; align-items:center; gap:8px;">
                    <i data-lucide="download" size="16"></i> 선택 자료 다운로드 (ZIP)
                </button>
                <button id="student-bulk-cancel-btn" class="btn-secondary" style="font-size:0.85rem; padding:8px 15px;">선택 해제</button>
            </div>
        </div>

        <div class="management-section">
            <h3 style="font-size: 1.1rem; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="user" size="20"></i> 내 데이터 자료실
            </h3>
            <div id="own-datasets-list-root"></div>
        </div>

        ${teamData.length > 0 ? `
        <div class="management-section" style="margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1;">
            <h3 style="font-size: 1.1rem; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; color: #0369a1;">
                <i data-lucide="users-round" size="20"></i> 팀원의 공유 자료실
            </h3>
            <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 15px;">같은 팀 팀원의 데이터를 공유 여부에 관계없이 모두 확인하고 연구에 활용할 수 있습니다.</p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                <thead>
                    <tr style="text-align: left; border-bottom: 2px solid #bae6fd;">
                        <th style="padding: 12px; text-align: center; width: 40px;">
                            <input type="checkbox" class="team-bulk-all-chk" title="전체 선택" style="width: 16px; height: 16px; cursor: pointer;">
                        </th>
                        <th style="padding: 12px; font-size: 0.85rem;">데이터셋 이름</th>
                        <th style="padding: 12px; font-size: 0.85rem;">팀원</th>
                        <th style="padding: 12px; font-size: 0.85rem; text-align: center;">행 수</th>
                    </tr>
                </thead>
                <tbody>
                    ${teamData.map(ds => {
                        const meta = ds.metadata || {};
                        const rowCount = meta.row_count;
                        const sizeKb = meta.size_kb || ds.size_kb;
                        const rowStr = rowCount != null ? `${Number(rowCount).toLocaleString()}행` : '-';
                        const sizeStr = sizeKb ? (sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${Number(sizeKb).toLocaleString()} KB`) : '';
                        const memberName = ds.students?.name || ds.student_id;
                        return `
                        <tr class="clickable-row managed-ds-row team-row" data-id="${ds.id}" style="border-bottom: 1px solid #e0f2fe; background: #f0f9ff;">
                            <td style="padding: 12px; text-align: center;" onclick="event.stopPropagation()">
                                <input type="checkbox" class="ds-row-chk" data-id="${ds.id}" style="width: 16px; height: 16px; cursor: pointer;">
                            </td>
                            <td style="padding: 12px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <i data-lucide="file-spreadsheet" size="18" style="color: #0284c7;"></i>
                                    <div>
                                        <strong>${ds.data_name}</strong>
                                        ${sizeStr ? `<div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">${sizeStr}</div>` : ''}
                                    </div>
                                </div>
                            </td>
                            <td style="padding: 12px; font-size: 0.85rem; color: #0369a1; font-weight: 600;">${memberName}</td>
                            <td style="padding: 12px; text-align: center; font-size: 0.9rem; font-weight: 600; color: ${rowCount != null ? '#0284c7' : '#94a3b8'};">${rowStr}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <div class="management-section" style="margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1;">
            <h3 style="font-size: 1.1rem; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; color: var(--primary);">
                <i data-lucide="users" size="20"></i> 친구들의 공유 자료실
            </h3>
            <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 15px;">다른 친구들이 공유한 자료를 내 연구에 활용할 수 있습니다.</p>
            ${(!sharedData || sharedData.length === 0) ? '<p class="text-muted" style="padding: 20px; background: #f8fafc; border-radius: 8px; text-align: center;">현재 공유된 친구들의 자료가 없습니다.</p>' : `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="text-align: left; border-bottom: 2px solid var(--glass-border);">
                        <th style="padding: 12px; text-align: center; width: 40px;">
                            <input type="checkbox" class="shared-bulk-all-chk" title="전체 선택" style="width: 16px; height: 16px; cursor: pointer;">
                        </th>
                        <th style="padding: 12px; font-size: 0.85rem;">데이터셋 이름</th>
                        <th style="padding: 12px; font-size: 0.85rem;">공유자</th>
                    </tr>
                </thead>
                <tbody>
                    ${sharedData.map(ds => {
                        const ownerName = ds.students?.name || (ds.student_id ? `${ds.student_id}` : '탈퇴한 사용자');
                        return `
                        <tr class="clickable-row managed-ds-row shared-row" data-id="${ds.id}" style="border-bottom: 1px solid var(--glass-border); background: #f8fafc;">
                            <td style="padding: 12px; text-align: center;" onclick="event.stopPropagation()">
                                <input type="checkbox" class="ds-row-chk" data-id="${ds.id}" style="width: 16px; height: 16px; cursor: pointer;">
                            </td>
                            <td style="padding: 12px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <i data-lucide="share-2" size="18" style="color: #6366f1;"></i>
                                    <strong>${ds.data_name}</strong>
                                </div>
                            </td>
                            <td style="padding: 12px; font-size: 0.85rem; color: #4338ca; font-weight: 600;">${ownerName}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            `}
        </div>
    `;

    container.innerHTML = html;
    lucide.createIcons();

    // ── 내 데이터 리스트 렌더링 (UI 컴포넌트 사용) ─────────────────────────
    // Sort: teacher-uploaded first (data_name asc), then student's own (original order)
    const isTeacherUploaded = (ds) => !!(ds.metadata?.teacher_email);
    const teacherItems = [...ownData].filter(isTeacherUploaded).sort((a, b) => (a.data_name || '').localeCompare(b.data_name || '', 'ko'));
    const studentItems = ownData.filter(ds => !isTeacherUploaded(ds));
    const sortedOwnData = [...teacherItems, ...studentItems];

    const { renderDatasetsList } = await import('./ui.js');
    const { toggleDatasetResearch } = await import('./auth.js');
    renderDatasetsList(sortedOwnData, 'own-datasets-list-root',
        async (id) => { // onDelete
            if (!confirm('정말로 이 데이터셋을 삭제하시겠습니까?')) return;
            const { error } = await deleteStudentDataset(id, state.user.student_id);
            if (!error) onLoadDatasets(state, changeStep);
            else alert('삭제 실패: ' + error.message);
        },
        async (id, isShared) => { // onToggleShare
            const { error } = await toggleDatasetShare(id, isShared, state.user.student_id);
            if (error) alert('공유 상태 변경 실패: ' + error.message);
        },
        async (id, currentName) => { // onEditName
            const newName = prompt('수정할 데이터셋 이름을 입력하세요:', currentName);
            if (newName && newName.trim() !== '' && newName !== currentName) {
                const { error } = await updateDatasetName(id, newName.trim(), state.user.student_id);
                if (!error) onLoadDatasets(state, changeStep);
                else alert('이름 수정 실패: ' + error.message);
            }
        },
        async (id, isResearch) => { // onToggleResearch
            const { error } = await toggleDatasetResearch(id, isResearch, state.user.student_id);
            if (error) alert('연구 활용 상태 변경 실패: ' + error.message);
        }
    );

    // ── Bulk Download Sync Logic ──────────────────────────────────────────
    const bulkBar = container.querySelector('#student-bulk-action-bar');
    const bulkCount = container.querySelector('#student-bulk-count');
    const bulkCancelBtn = container.querySelector('#student-bulk-cancel-btn');
    const bulkDownloadBtn = container.querySelector('#student-bulk-download-btn');

    const syncBulkUI = () => {
        const checked = container.querySelectorAll('.ds-row-chk:checked');
        if (checked.length > 0) {
            bulkBar.style.display = 'flex';
            bulkCount.innerText = checked.length;
        } else {
            bulkBar.style.display = 'none';
        }
    };

    // Listen to selection changes in sub-components and local tables
    container.addEventListener('dsSelectionChange', syncBulkUI);
    container.querySelectorAll('.ds-row-chk').forEach(chk => {
        chk.addEventListener('change', syncBulkUI);
    });

    // Select All for Local Tables
    const teamAllChk = container.querySelector('.team-bulk-all-chk');
    if (teamAllChk) {
        teamAllChk.onchange = () => {
            container.querySelectorAll('#team-datasets-table-body .ds-row-chk').forEach(c => c.checked = teamAllChk.checked);
            syncBulkUI();
        };
    }
    const sharedAllChk = container.querySelector('.shared-bulk-all-chk');
    if (sharedAllChk) {
        sharedAllChk.onchange = () => {
            container.querySelectorAll('#shared-datasets-table-body .ds-row-chk').forEach(c => c.checked = sharedAllChk.checked);
            syncBulkUI();
        };
    }

    if (bulkCancelBtn) {
        bulkCancelBtn.onclick = () => {
            container.querySelectorAll('.ds-row-chk, .ds-bulk-all-chk, .team-bulk-all-chk, .shared-bulk-all-chk').forEach(c => {
                c.checked = false;
                if (c.indeterminate) c.indeterminate = false;
            });
            syncBulkUI();
        };
    }

    if (bulkDownloadBtn) {
        bulkDownloadBtn.onclick = async () => {
            const checkedIds = Array.from(container.querySelectorAll('.ds-row-chk:checked')).map(c => c.dataset.id);
            if (checkedIds.length === 0) return;

            bulkDownloadBtn.disabled = true;
            const originalHTML = bulkDownloadBtn.innerHTML;
            bulkDownloadBtn.innerHTML = `<i data-lucide="loader-2" class="spin" size="16"></i> 준비 중...`;
            if (window.lucide) lucide.createIcons();

            try {
                // Ensure JSZip is loaded
                if (typeof JSZip === 'undefined') {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
                    document.head.appendChild(script);
                    await new Promise(resolve => script.onload = resolve);
                }

                const zip = new JSZip();
                const allDs = [...ownData, ...teamData, ...sharedData];
                const selectedDs = allDs.filter(d => checkedIds.includes(String(d.id)));

                for (let i = 0; i < selectedDs.length; i++) {
                    const ds = selectedDs[i];
                    bulkDownloadBtn.innerHTML = `<i data-lucide="loader-2" class="spin" size="16"></i> 받는 중 (${i + 1}/${selectedDs.length})`;
                    if (window.lucide) lucide.createIcons();

                    let finalUrl = ds.file_url;
                    if (finalUrl && !finalUrl.startsWith('http')) {
                        const { data } = supabaseClient.storage.from('datasets').getPublicUrl(ds.file_url);
                        finalUrl = data.publicUrl;
                    }

                    try {
                        const response = await fetch(finalUrl);
                        if (!response.ok) throw new Error(`${ds.data_name} 실패`);
                        const blob = await response.blob();
                        
                        let fileName = ds.data_name || `dataset_${ds.id}`;
                        fileName = fileName.replace(/[\\\\/:*?"<>|]/g, '_');
                        
                        const ext = ds.file_url.split('.').pop().toLowerCase() || 'csv';
                        if (!fileName.toLowerCase().endsWith('.' + ext)) fileName += '.' + ext;
                        
                        let finalFileName = fileName;
                        let counter = 1;
                        while (zip.file(finalFileName)) {
                            const nameParts = fileName.split('.');
                            const base = nameParts.slice(0, -1).join('.');
                            const extension = nameParts.slice(-1)[0];
                            finalFileName = `${base}_(${counter}).${extension}`;
                            counter++;
                        }
                        zip.file(finalFileName, blob);
                    } catch (e) {
                        console.error(`Failed to download ${ds.data_name}:`, e);
                    }
                }

                bulkDownloadBtn.innerHTML = `<i data-lucide="loader-2" class="spin" size="16"></i> 압축 생성 중...`;
                if (window.lucide) lucide.createIcons();

                const content = await zip.generateAsync({ type: "blob" });
                const url = window.URL.createObjectURL(content);
                const a = document.createElement('a');
                const dateStr = new Date().toISOString().slice(0, 10);
                a.href = url;
                a.download = `PublicData_Research_${dateStr}.zip`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => { window.URL.revokeObjectURL(url); a.remove(); }, 100);

            } catch (err) {
                console.error(err);
                alert('다운로드 중 오류 발생: ' + err.message);
            } finally {
                bulkDownloadBtn.disabled = false;
                bulkDownloadBtn.innerHTML = originalHTML;
                if (window.lucide) lucide.createIcons();
            }
        };
    }

    // ── Row Click Listener (팀/친구 공유 자료 상세 모달용) ───────────────
    container.querySelectorAll('.clickable-row').forEach(row => {
        row.addEventListener('click', (e) => {
            if (e.target.closest('button') || e.target.closest('.switch') || e.target.closest('input[type="checkbox"]')) return;
            const ds = [...teamData, ...sharedData].find(d => String(d.id) === row.dataset.id);
            if (ds) {
                import('./ui.js').then(m => m.openDatasetModal(ds));
            }
        });
    });

}



