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


export function renderTeacherJournalMonitoring(logs, onOpenJournal) {
    const container = document.getElementById('teacher-step1-root'); // STEP 4 container in main.js
    if (!container) return;

    if (!logs || logs.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:60px 20px; background:rgba(255,255,255,0.4); border-radius:15px; border:1px dashed #cbd5e1;">
                <i data-lucide="file-text" size="48" style="color:#94a3b8; margin-bottom:15px; opacity:0.5;"></i>
                <h3 style="color:#64748b; margin-bottom:8px;">작성된 연구 일지가 없습니다.</h3>
                <p class="text-muted" style="font-size:0.9rem;">학생들이 4단계 연구 일지를 작성하면 이곳에 표시됩니다.</p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    // Sort by updated_at or created_at
    const sortedLogs = [...logs].sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

    container.innerHTML = `
        <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="display:flex; align-items:center; gap:10px; margin:0; font-size:1.1rem;">
                <i data-lucide="monitor" style="color:var(--primary);"></i> 연구 일지 모니터링
            </h3>
            <span class="text-muted" style="font-size:0.85rem;">총 ${logs.length}개의 일지 발견</span>
        </div>
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: separate; border-spacing: 0 8px;">
                <thead>
                    <tr style="text-align: left; color: #64748b; font-size: 0.85rem;">
                        <th style="padding: 10px 15px; font-weight: 600;">작성자 / 팀</th>
                        <th style="padding: 10px 15px; font-weight: 600;">연구 가설 (요약)</th>
                        <th style="padding: 10px 15px; font-weight: 600;">마지막 업데이트</th>
                        <th style="padding: 10px 15px; font-weight: 600; text-align: center;">작업</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedLogs.map(log => {
                        let journalData = {};
                        try { journalData = JSON.parse(log.content || '{}'); } catch(e) {}
                        
                        const hypothesis = journalData.step4_q2 || '<span style="color:#cbd5e1; font-weight:normal;">미작성</span>';
                        const time = new Date(log.updated_at || log.created_at).toLocaleString();
                        const isTeam = log._isTeam || false;
                        
                        return `
                            <tr style="background: white; transition: transform 0.2s, box-shadow 0.2s;" 
                                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.05)'"
                                onmouseout="this.style.transform='none'; this.style.boxShadow='none'">
                                <td style="padding: 15px; border-radius: 10px 0 0 10px; border: 1px solid #e2e8f0; border-right: none;">
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <div style="width: 32px; height: 32px; border-radius: 50%; background: ${isTeam ? '#eff6ff' : '#f8fafc'}; display: flex; align-items: center; justify-content: center;">
                                            <i data-lucide="${isTeam ? 'users' : 'user'}" size="16" style="color: ${isTeam ? '#3b82f6' : '#64748b'};"></i>
                                        </div>
                                        <div>
                                            <div style="font-weight: 700; font-size: 0.95rem; color: #1e293b;">${log.team_name || log.student_name}</div>
                                            ${isTeam ? `<div style="font-size: 0.75rem; color: #64748b;">작성자: ${log.student_name}</div>` : ''}
                                        </div>
                                    </div>
                                </td>
                                <td style="padding: 15px; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
                                    <div style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.88rem; color: #475569;">
                                        ${hypothesis}
                                    </div>
                                </td>
                                <td style="padding: 15px; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; font-size: 0.85rem; color: #94a3b8;">
                                    ${time}
                                </td>
                                <td style="padding: 15px; border-radius: 0 10px 10px 0; border: 1px solid #e2e8f0; border-left: none; text-align: center;">
                                    <button class="open-journal-btn btn-primary" data-sid="${log.student_id}" 
                                            style="padding: 6px 16px; font-size: 0.82rem; border-radius: 8px;">
                                        일지 열기
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    if (window.lucide) lucide.createIcons();

    container.querySelectorAll('.open-journal-btn').forEach(btn => {
        btn.onclick = () => {
            onOpenJournal(btn.dataset.sid);
        };
    });
}

export function renderTeacherKnowledgeMonitoring(logs, onOpenKnowledge) {
    const container = document.getElementById('teacher-step0-root');
    if (!container) return;

    if (!logs || logs.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:60px 20px; background:rgba(255,255,255,0.4); border-radius:15px; border:1px dashed #cbd5e1;">
                <i data-lucide="clipboard-list" size="48" style="color:#94a3b8; margin-bottom:15px; opacity:0.5;"></i>
                <h3 style="color:#64748b; margin-bottom:8px;">기초 지식 조사 내역이 없습니다.</h3>
                <p class="text-muted" style="font-size:0.9rem;">학생들이 0단계를 완료하면 이곳에 표시됩니다.</p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    const sortedLogs = [...logs].sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

    container.innerHTML = `
        <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="display:flex; align-items:center; gap:10px; margin:0; font-size:1.1rem;">
                <i data-lucide="clipboard-list" style="color:var(--primary);"></i> 기초 지식 조사 확인
            </h3>
            <span class="text-muted" style="font-size:0.85rem;">총 ${logs.length}명 참여</span>
        </div>
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: separate; border-spacing: 0 8px;">
                <thead>
                    <tr style="text-align: left; color: #64748b; font-size: 0.85rem;">
                        <th style="padding: 10px 15px; font-weight: 600;">학생</th>
                        <th style="padding: 10px 15px; font-weight: 600;">답변 요약 (Q1)</th>
                        <th style="padding: 10px 15px; font-weight: 600;">완료 일시</th>
                        <th style="padding: 10px 15px; font-weight: 600; text-align: center;">작업</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedLogs.map(log => {
                        let data = {};
                        try { data = JSON.parse(log.content || '{}'); } catch(e) {}
                        
                        const summary = data.q1 || '<span style="color:#cbd5e1; font-weight:normal;">미작성</span>';
                        const time = new Date(log.updated_at || log.created_at).toLocaleString();
                        
                        return `
                            <tr style="background: white; transition: transform 0.2s, box-shadow 0.2s;" 
                                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.05)'"
                                onmouseout="this.style.transform='none'; this.style.boxShadow='none'">
                                <td style="padding: 15px; border-radius: 10px 0 0 10px; border: 1px solid #e2e8f0; border-right: none;">
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <div style="width: 32px; height: 32px; border-radius: 50%; background: #f8fafc; display: flex; align-items: center; justify-content: center;">
                                            <i data-lucide="user" size="16" style="color: #64748b;"></i>
                                        </div>
                                        <div style="font-weight: 700; font-size: 0.95rem; color: #1e293b;">${log.student_name}</div>
                                    </div>
                                </td>
                                <td style="padding: 15px; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
                                    <div style="max-width: 350px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.88rem; color: #475569;">
                                        ${summary}
                                    </div>
                                </td>
                                <td style="padding: 15px; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; font-size: 0.85rem; color: #94a3b8;">
                                    ${time}
                                </td>
                                <td style="padding: 15px; border-radius: 0 10px 10px 0; border: 1px solid #e2e8f0; border-left: none; text-align: center;">
                                    <button class="open-knowledge-btn btn-primary" data-sid="${log.student_id}" 
                                            style="padding: 6px 16px; font-size: 0.82rem; border-radius: 8px;">
                                        내용 보기
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    if (window.lucide) lucide.createIcons();

    container.querySelectorAll('.open-knowledge-btn').forEach(btn => {
        btn.onclick = () => {
            onOpenKnowledge(btn.dataset.sid);
        };
    });
}
