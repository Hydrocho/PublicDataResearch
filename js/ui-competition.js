export function renderTeacherCompetitionApplications(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="text-muted" style="text-align:center; padding: 40px;">아직 접수된 대회 참가 신청이 없습니다.</div>';
        return;
    }

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(450px, 1fr)); gap: 20px;">
            ${data.map(app => {
                const team = app.team_data || [];
                const dateStr = new Date(app.created_at).toLocaleString();
                const isCompleted = app.status === 'completed';
                
                return `
                    <div class="glass card" style="padding: 25px; border-top: 4px solid ${isCompleted ? '#059669' : 'var(--accent)'}; transition: all 0.3s ease;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                            <div>
                                <h4 style="margin: 0; color: var(--secondary); display: flex; align-items: center; gap: 8px;">
                                    <i data-lucide="users" size="18"></i> 참가 팀 명단 (${team.length}명)
                                </h4>
                                <small class="text-muted">${dateStr}</small>
                            </div>
                            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 5px;">
                                <span class="tag" style="background: ${isCompleted ? 'rgba(5, 150, 105, 0.1)' : 'rgba(225, 29, 72, 0.1)'}; color: ${isCompleted ? '#059669' : 'var(--accent)'}; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700;">
                                    ${isCompleted ? '접수 완료' : '대기 중'}
                                </span>
                                <button class="btn-status-toggle" data-id="${app.id}" data-status="${app.status || 'pending'}" style="font-size: 0.7rem; background: none; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px 8px; cursor: pointer; color: #475569;">
                                    ${isCompleted ? '접수 취소하기' : '접수 완료하기'}
                                </button>
                            </div>
                        </div>
                        
                        <div style="display: flex; flex-direction: column; gap: 15px; opacity: ${isCompleted ? '0.7' : '1'};">
                            ${team.map((member, idx) => `
                                <div style="display: flex; align-items: center; gap: 15px; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                                    <div style="width: 32px; height: 32px; background: ${idx === 0 ? 'var(--secondary)' : '#cbd5e1'}; color: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: 700; font-size: 0.8rem;">
                                        ${idx + 1}
                                    </div>
                                    <div style="flex: 1;">
                                        <div style="font-weight: 700; color: var(--text); font-size: 0.95rem;">${member.name} <span style="font-weight: 400; color: #64748b; font-size: 0.8rem;">(${member.student_id})</span></div>
                                        <div style="font-size: 0.85rem; color: #475569; display: flex; align-items: center; gap: 5px;">
                                            <i data-lucide="mail" size="12"></i> ${member.email}
                                        </div>
                                    </div>
                                    ${idx === 0 ? '<span style="font-size: 0.7rem; background: var(--secondary); color: white; padding: 2px 6px; border-radius: 4px;">대표</span>' : ''}
                                </div>
                            `).join('')}
                        </div>
                        
                        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px dashed #e2e8f0; text-align: right;">
                            <span style="font-size: 0.75rem; color: #94a3b8;">신청 ID: ${app.id.substring(0, 8)}...</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    container.querySelectorAll('.btn-status-toggle').forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.id;
            const currentStatus = btn.dataset.status;
            const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
            
            if (!confirm(`신청 상태를 [${newStatus === 'completed' ? '접수 완료' : '대기 중'}]으로 변경하시겠습니까?`)) return;
            
            btn.disabled = true;
            btn.innerText = '처리 중...';
            
            const { updateApplicationStatus, fetchAllCompetitionApplications } = await import('./auth.js');
            const { error } = await updateApplicationStatus(id, newStatus);
            
            if (error) {
                alert('상태 변경 실패: ' + error.message);
                btn.disabled = false;
                btn.innerText = currentStatus === 'completed' ? '접수 취소하기' : '접수 완료하기';
            } else {
                const { data: updatedData } = await fetchAllCompetitionApplications();
                renderTeacherCompetitionApplications(updatedData, containerId);
            }
        };
    });

    if (window.lucide) lucide.createIcons();
}
