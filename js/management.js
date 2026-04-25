import { supabaseClient } from './config.js';
import { fetchStudentDatasets, deleteStudentDataset, toggleDatasetShare, fetchSharedDatasets, fetchTeamDatasets, updateDatasetName, toggleResearchUse } from './auth.js';
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
                        <th style="padding: 12px; font-size: 0.85rem;">데이터셋 이름</th>
                        <th style="padding: 12px; font-size: 0.85rem;">팀원</th>
                        <th style="padding: 12px; font-size: 0.85rem; text-align: center;">행 수</th>
                        <th style="padding: 12px; font-size: 0.85rem; text-align: center;">연구 활용</th>
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
                        <tr class="clickable-row team-row" data-id="${ds.id}" style="border-bottom: 1px solid #e0f2fe; background: #f0f9ff;">
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
                            <td style="padding: 12px; text-align: center;">
                                <input type="checkbox" class="research-use-check" data-id="${ds.id}" data-owner="false" ${ds.is_research_use ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                            </td>
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
                        <th style="padding: 12px; font-size: 0.85rem;">데이터셋 이름</th>
                        <th style="padding: 12px; font-size: 0.85rem;">공유자</th>
                        <th style="padding: 12px; font-size: 0.85rem; text-align: center;">연구 활용</th>
                    </tr>
                </thead>
                <tbody>
                    ${sharedData.map(ds => {
                        const ownerName = ds.students?.name || (ds.student_id ? `${ds.student_id}` : '탈퇴한 사용자');
                        return `
                        <tr class="clickable-row shared-row" data-id="${ds.id}" style="border-bottom: 1px solid var(--glass-border); background: #f8fafc;">
                            <td style="padding: 12px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <i data-lucide="share-2" size="18" style="color: #6366f1;"></i>
                                    <strong>${ds.data_name}</strong>
                                </div>
                            </td>
                            <td style="padding: 12px; font-size: 0.85rem; color: #4338ca; font-weight: 600;">${ownerName}</td>
                            <td style="padding: 12px; text-align: center;">
                                <input type="checkbox" class="research-use-check" data-id="${ds.id}" data-owner="false" ${ds.is_research_use ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                            </td>
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
        async (id, isUse) => { // onToggleResearch
            const { error } = await toggleResearchUse(id, isUse, state.user.student_id, true);
            if (error) alert('연구 활용 상태 저장 실패: ' + error.message);
        },
        async (id, currentName) => { // onEditName
            const newName = prompt('수정할 데이터셋 이름을 입력하세요:', currentName);
            if (newName && newName.trim() !== '' && newName !== currentName) {
                const { error } = await updateDatasetName(id, newName.trim(), state.user.student_id);
                if (!error) onLoadDatasets(state, changeStep);
                else alert('이름 수정 실패: ' + error.message);
            }
        }
    );

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

    // ── 연구 활용 체크 (팀/친구 공유 자료용) ────────────────────────────
    container.querySelectorAll('.research-use-check').forEach(chk => {
        chk.addEventListener('change', async () => {
            const id = chk.dataset.id;
            const isUse = chk.checked;
            const isOwner = chk.dataset.owner === 'true'; // 팀/친구는 false가 명시되어 있음
            
            chk.disabled = true;
            const { error } = await toggleResearchUse(id, isUse, state.user.student_id, isOwner);
            if (error) {
                alert('연구 활용 상태 저장 실패: ' + error.message);
                chk.checked = !isUse;
            }
            chk.disabled = false;
        });
    });
}



