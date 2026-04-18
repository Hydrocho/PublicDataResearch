export function renderTeacherDashboard(students, onReset, onDelete) {
    const listDiv = document.getElementById('teacher-student-list');
    if (!listDiv) return;
    if (!students || students.length === 0) {
        listDiv.innerHTML = '<p class="text-muted">가입된 학생이 없습니다.</p>';
        return;
    }

    listDiv.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
                <tr style="text-align: left; border-bottom: 2px solid var(--glass-border);">
                    <th style="padding: 12px;">학번</th>
                    <th style="padding: 12px;">이름</th>
                    <th style="padding: 12px;">가입일</th>
                    <th style="padding: 12px; text-align: right;">관리</th>
                </tr>
            </thead>
            <tbody>
                ${students.map(s => `
                    <tr style="border-bottom: 1px solid var(--glass-border);">
                        <td style="padding: 12px;">${s.student_id}</td>
                        <td style="padding: 12px;">${s.name || '-'}</td>
                        <td style="padding: 12px; font-size: 0.8rem;">${new Date(s.created_at).toLocaleDateString()}</td>
                        <td style="padding: 12px; text-align: right; display: flex; gap: 8px; justify-content: flex-end;">
                            <button class="btn-secondary reset-pin-btn" data-id="${s.student_id}" style="font-size: 0.8rem; padding: 5px 12px;">PIN 초기화(0000)</button>
                            <button class="btn-secondary delete-student-btn" data-id="${s.student_id}" data-name="${s.name || s.student_id}" style="font-size: 0.8rem; padding: 5px 12px; color: #dc2626; border-color: #fecaca; background: #fff1f2;">삭제</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    document.querySelectorAll('.reset-pin-btn').forEach(btn => {
        btn.onclick = () => onReset(btn.dataset.id);
    });
    document.querySelectorAll('.delete-student-btn').forEach(btn => {
        btn.onclick = () => onDelete(btn.dataset.id, btn.dataset.name);
    });
}

export function renderTeacherPermissions(teachers, onStatusUpdate) {
    const listDiv = document.getElementById('teacher-pending-list');
    if (!listDiv) return;

    if (!teachers || teachers.length === 0) {
        listDiv.innerHTML = '<div style="text-align: center; padding: 40px;"><p class="text-muted">등록된 교사 계정이 없습니다.</p></div>';
        return;
    }

    const statusBadge = (status) => {
        const map = {
            approved:  { bg: '#dcfce7', color: '#166534', icon: 'check-circle', label: '승인 완료' },
            pending:   { bg: '#fef9c3', color: '#854d0e', icon: 'clock',        label: '대기 중' },
            rejected:  { bg: '#fee2e2', color: '#991b1b', icon: 'x-circle',     label: '거절됨' },
        };
        const s = map[status] || map.pending;
        return `<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;background:${s.bg};color:${s.color};font-size:0.8rem;font-weight:600;">
                    <i data-lucide="${s.icon}" size="13"></i> ${s.label}
                </span>`;
    };

    const actionBtns = (t) => {
        if (t.status === 'approved') {
            return `<button class="reject-teacher-btn btn-secondary" data-id="${t.id}" style="font-size:0.8rem;padding:5px 10px;background:#fee2e2;color:#dc2626;border-color:#fecaca;">권한 취소</button>`;
        }
        if (t.status === 'pending') {
            return `
                <button class="approve-teacher-btn btn-primary" data-id="${t.id}" style="font-size:0.8rem;padding:5px 10px;margin-right:5px;">승인</button>
                <button class="reject-teacher-btn btn-secondary" data-id="${t.id}" style="font-size:0.8rem;padding:5px 10px;background:#fee2e2;color:#dc2626;border-color:#fecaca;">거절</button>
            `;
        }
        // rejected: only re-approve
        return `<button class="approve-teacher-btn btn-secondary" data-id="${t.id}" style="font-size:0.8rem;padding:5px 10px;">다시 승인</button>`;
    };

    listDiv.innerHTML = `
        <table style="width:100%;border-collapse:collapse;margin-top:10px;">
            <thead>
                <tr style="text-align:left;border-bottom:2px solid var(--glass-border);">
                    <th style="padding:12px;">이메일</th>
                    <th style="padding:12px;">이름</th>
                    <th style="padding:12px;">학교 / 소속</th>
                    <th style="padding:12px;">상태</th>
                    <th style="padding:12px;">신청일</th>
                    <th style="padding:12px; text-align:center;">관리</th>
                </tr>
            </thead>
            <tbody>
                ${teachers.map(t => `
                    <tr style="border-bottom:1px solid var(--glass-border);">
                        <td style="padding:12px;font-weight:500;">${t.email}</td>
                        <td style="padding:12px;">${t.name || '-'}</td>
                        <td style="padding:12px;">${t.school || '-'}</td>
                        <td style="padding:12px;">${statusBadge(t.status)}</td>
                        <td style="padding:12px;font-size:0.8rem;">${new Date(t.created_at).toLocaleDateString()}</td>
                        <td style="padding:12px;text-align:center;white-space:nowrap;">${actionBtns(t)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    if (window.lucide) lucide.createIcons();

    document.querySelectorAll('.approve-teacher-btn').forEach(btn => {
        btn.onclick = () => onStatusUpdate(btn.dataset.id, 'approved');
    });
    document.querySelectorAll('.reject-teacher-btn').forEach(btn => {
        btn.onclick = () => onStatusUpdate(btn.dataset.id, 'rejected');
    });
}

export function renderStudentProgress(students, onViewDetail) {
    const container = document.getElementById('teacher-progress-list');
    if (!container) return;

    if (!students || students.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;"><p class="text-muted">가입된 학생이 없습니다.</p></div>';
        return;
    }

    const STEPS = [
        { id: -1, label: '미시작',   color: '#94a3b8', bg: '#f1f5f9' },
        { id: 3,  label: '4단계 완료', color: '#6366f1', bg: '#ede9fe' },
        { id: 4,  label: '5단계 완료', color: '#0ea5e9', bg: '#e0f2fe' },
        { id: 5,  label: '6단계 완료', color: '#10b981', bg: '#dcfce7' },
        { id: 6,  label: '7단계 완료', color: '#f59e0b', bg: '#fef9c3' },
        { id: 7,  label: '8단계 완료', color: '#ef4444', bg: '#fee2e2' },
    ];

    const getStepInfo = (maxStep) => {
        const match = [...STEPS].reverse().find(s => maxStep >= s.id);
        return match || STEPS[0];
    };

    const getProgressPct = (maxStep) => {
        if (maxStep < 3) return 0;
        return Math.min(100, ((maxStep - 2) / 5) * 100);
    };

    container.innerHTML = `
        <div style="display: grid; gap: 15px;">
            ${students.map(s => {
                const step = getStepInfo(s.maxStep);
                const pct = getProgressPct(s.maxStep);
                const lastAct = s.lastActivity ? new Date(s.lastActivity).toLocaleDateString() : '-';
                return `
                    <div class="student-progress-card" data-id="${s.student_id}"
                         style="background:white;border:1px solid #e2e8f0;border-left:4px solid ${step.color};border-radius:10px;padding:18px 22px;cursor:pointer;transition:box-shadow 0.2s;display:flex;align-items:center;gap:20px;"
                         onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,0.1)'"
                         onmouseout="this.style.boxShadow='none'">
                        <div style="flex:0 0 48px;height:48px;border-radius:50%;background:${step.bg};display:flex;align-items:center;justify-content:center;">
                            <i data-lucide="user" size="22" style="color:${step.color};"></i>
                        </div>
                        <div style="flex:1;min-width:0;">
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                                <strong style="font-size:1rem;">${s.name || '(이름없음)'}</strong>
                                <span style="font-size:0.8rem;color:#64748b;">학번: ${s.student_id}</span>
                                <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:20px;background:${step.bg};color:${step.color};font-size:0.75rem;font-weight:700;">${step.label}</span>
                            </div>
                            <div style="display:flex;align-items:center;gap:8px;">
                                <div style="flex:1;height:6px;background:#e2e8f0;border-radius:99px;overflow:hidden;">
                                    <div style="height:100%;width:${pct}%;background:${step.color};border-radius:99px;transition:width 0.5s ease;"></div>
                                </div>
                                <span style="font-size:0.75rem;color:#64748b;white-space:nowrap;">${Math.round(pct)}%</span>
                            </div>
                        </div>
                        <div style="flex:0 0 auto;text-align:right;">
                            <div style="display:flex;align-items:center;gap:12px;">
                                <div style="text-align:center;">
                                    <div style="font-size:1.1rem;font-weight:700;color:var(--primary);">${s.datasetCount}</div>
                                    <div style="font-size:0.7rem;color:#94a3b8;">데이터셋</div>
                                </div>
                                <div style="text-align:center;">
                                    <div style="font-size:0.75rem;color:#94a3b8;">${lastAct}</div>
                                    <div style="font-size:0.7rem;color:#cbd5e1;">마지막 활동</div>
                                </div>
                                <button class="view-detail-btn btn-secondary" data-id="${s.student_id}" data-name="${s.name || s.student_id}" style="padding:6px 14px;font-size:0.8rem;">
                                    <i data-lucide="chevron-right" size="14"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    if (window.lucide) lucide.createIcons();

    container.querySelectorAll('.view-detail-btn, .student-progress-card').forEach(el => {
        el.onclick = (e) => {
            const btn = e.target.closest('[data-id]');
            if (!btn) return;
            onViewDetail(btn.dataset.id, btn.dataset.name || btn.closest('[data-name]')?.dataset.name || btn.dataset.id);
        };
    });

    document.getElementById('refresh-progress-btn').onclick = () => onViewDetail(null, null);
}

export async function showStudentDetailModal(studentName, detail) {
    const modal = document.getElementById('student-detail-modal');
    const title = document.getElementById('student-detail-title');
    const body  = document.getElementById('student-detail-body');
    const close = document.getElementById('close-student-modal');

    title.innerText = `🔍 ${studentName} 학생 상세 기록`;

    const { logs, datasets } = detail;
    const step1Logs = logs.filter(l => l.step_id === 3);

    const datasetsHtml = datasets.length === 0
        ? '<p class="text-muted">저장된 데이터셋이 없습니다.</p>'
        : `<div style="display:grid;gap:8px;">
            ${datasets.map(ds => `
                <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                    <i data-lucide="file-spreadsheet" size="18" style="color:#059669;flex-shrink:0;"></i>
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:600;font-size:0.9rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${ds.data_name}</div>
                        <div style="font-size:0.75rem;color:#94a3b8;">${new Date(ds.created_at).toLocaleDateString()} 저장 · ${ds.is_research_use ? '✅ 연구 활용 중' : '미활용'}</div>
                    </div>
                </div>
            `).join('')}
        </div>`;

    const logsHtml = step1Logs.length === 0
        ? '<p class="text-muted">저장된 AI 연구 기록이 없습니다.</p>'
        : step1Logs.map(log => {
            let data;
            try { data = JSON.parse(log.content); } catch(e) { data = { answer: log.content }; }
            const date = new Date(log.created_at).toLocaleString();
            return `
                <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:12px;">
                    <div style="background:#f1f5f9;padding:10px 16px;font-size:0.8rem;color:#475569;font-weight:600;">📅 ${date}</div>
                    ${data.opinion ? `<div style="padding:12px 16px;border-bottom:1px solid #f1f5f9;"><small style="color:#6366f1;font-weight:700;">연구자 아이디어:</small><p style="margin:5px 0 0;font-size:0.9rem;">${data.opinion}</p></div>` : ''}
                    <div style="padding:12px 16px;"><small style="color:#10b981;font-weight:700;">AI 분석 결과 요약:</small><p style="margin:5px 0 0;font-size:0.9rem;color:#334155;line-height:1.6;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;">${data.answer || ''}</p></div>
                </div>
            `;
        }).join('');

    body.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:25px;">
            <div>
                <h4 style="display:flex;align-items:center;gap:8px;margin-bottom:15px;color:var(--secondary);">
                    <i data-lucide="database" size="18"></i> 저장된 데이터셋 (${datasets.length}건)
                </h4>
                ${datasetsHtml}
            </div>
            <div>
                <h4 style="display:flex;align-items:center;gap:8px;margin-bottom:15px;color:var(--secondary);">
                    <i data-lucide="file-text" size="18"></i> AI 연구 기록 (${step1Logs.length}건)
                </h4>
                ${logsHtml}
            </div>
        </div>
    `;

    modal.style.display = 'flex';
    if (window.lucide) lucide.createIcons();

    close.onclick = () => modal.style.display = 'none';
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
}
