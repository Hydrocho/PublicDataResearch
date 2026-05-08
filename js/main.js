import { 
    handleLogin, 
    handleSignup, 
    fetchAllStudents, 
    resetStudentPin, 
    signInWithGoogle, 
    signOut, 
    getTeacherRecord, 
    requestTeacherAccess, 
    fetchAllTeachers, 
    updateTeacherStatus, 
    fetchStudentProgressSnapshot, 
    fetchStudentDetail, 
    deleteStudentAccount,
    fetchAllDatasetsForTeacher,
    toggleDatasetShare,
    toggleResearchUse,
    fetchAllProblemDefinitionsForTeacher
} from './auth.js';
import { supabaseClient } from './config.js';
import * as UI from './ui.js';
import { showCategoryDetails } from './discovery.js';
import { onLoadDatasets } from './management.js';
import { onSaveRecord } from './research.js';

lucide.createIcons();

let state = {
    user: null,
    currentStep: 8,
    selectedTopic: null,
    onSaveRecord: (stepId, content) => onSaveRecord(stepId, content, state),
    onLoadDatasets: () => onLoadDatasets(state, changeStep)
};

// DOM Elements
const loginForm = document.getElementById('login-form');
const loginScreen = document.getElementById('login-screen');
const appContent = document.getElementById('app-content');
const errorMsg = document.getElementById('error-msg');
const toggleBtn = document.getElementById('toggle-auth');
const authTitle = document.getElementById('auth-title');
const authSubmitBtn = document.getElementById('auth-submit-btn');

let isSignup = false;

// Auth Switching
toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isSignup = !isSignup;
    const card = document.querySelector('.login-card');
    const icon = card.querySelector('[data-lucide]');
    const nameGroup = document.getElementById('name-group');
    
    if (isSignup) {
        card.classList.add('signup-mode');
        loginScreen.classList.add('signup-mode-active');
        icon.setAttribute('data-lucide', 'user-plus');
    } else {
        card.classList.remove('signup-mode');
        loginScreen.classList.remove('signup-mode-active');
        icon.setAttribute('data-lucide', 'log-in');
    }
    
    nameGroup.style.display = isSignup ? 'flex' : 'none';
    const confirmGroup = document.getElementById('confirm-password-group');
    if (confirmGroup) confirmGroup.style.display = isSignup ? 'flex' : 'none';
    
    const consentGroup = document.getElementById('consent-group');
    if (consentGroup) consentGroup.style.display = isSignup ? 'block' : 'none';
    
    authTitle.innerText = isSignup ? '회원가입' : '로그인';
    authSubmitBtn.innerText = isSignup ? '가입하기' : '시작하기';
    toggleBtn.innerText = isSignup ? '이미 계정이 있나요? 로그인' : '처음이신가요? 회원가입';
    errorMsg.style.display = 'none';
    lucide.createIcons();
});

// Local Session Check
async function checkSession() {
    // 1. Check for Student Session (PIN)
    const savedUser = localStorage.getItem('app_user');
    if (savedUser) {
        state.user = JSON.parse(savedUser);
        document.getElementById('user-display').innerText = `학번: ${state.user.student_id} (${state.user.name})`;
        loginScreen.style.display = 'none';
        appContent.style.display = 'block';
        initApp();
        return;
    }

    // 2. Check for Teacher Session (Supabase Auth)
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        const email = session.user.email;
        const record = await getTeacherRecord(email);
        
        if (record && record.status === 'approved') {
            showTeacherDashboard(email);
        } else if (record && record.status === 'pending') {
            showTeacherPendingUI(email);
        } else if (record && record.status === 'rejected') {
            showTeacherRejectedUI(email);
        } else {
            showTeacherRegistrationUI(email);
        }
    }
}

function hideAllSections() {
    loginScreen.style.display = 'none';
    appContent.style.display = 'none';
    document.getElementById('teacher-section').style.display = 'none';
    document.getElementById('teacher-registration-section').style.display = 'none';
    document.getElementById('teacher-pending-section').style.display = 'none';
    document.getElementById('teacher-rejected-section').style.display = 'none';
}

function showTeacherRegistrationUI(email) {
    hideAllSections();
    document.getElementById('teacher-registration-section').style.display = 'block';
    document.getElementById('reg-email-display').innerText = email;
    
    const form = document.getElementById('teacher-reg-form');
    form.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const school = document.getElementById('reg-school').value;
        const reason = document.getElementById('reg-reason').value;
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerText = '요청 중...';
        
        const { error } = await requestTeacherAccess(email, name, school, reason);
        if (error) {
            alert('요청 중 오류가 발생했습니다: ' + error.message);
            submitBtn.disabled = false;
            submitBtn.innerText = '승인 요청하기';
        } else {
            alert('요청이 제출되었습니다. 관리자 승인을 기다려주세요.');
            showTeacherPendingUI(email);
        }
    };
    
    document.getElementById('cancel-reg-btn').onclick = async () => {
        await signOut();
        location.reload();
    };
}

function showTeacherPendingUI(email) {
    hideAllSections();
    document.getElementById('teacher-pending-section').style.display = 'block';
    document.getElementById('pending-email-display').innerText = email;
}

function showTeacherRejectedUI(email) {
    hideAllSections();
    document.getElementById('teacher-rejected-section').style.display = 'block';
}

document.querySelectorAll('.teacher-status-logout-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        await signOut();
        location.reload();
    });
});

// Auth Submit
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('student-id').value;
    const pw = document.getElementById('password').value;
    const name = document.getElementById('student-name').value;

    if (id === 'teacher' && pw === '0000') {
        showTeacherDashboard();
        return;
    }

    if (isSignup) {
        const confirmPw = document.getElementById('confirm-password').value;
        if (pw !== confirmPw) {
            errorMsg.style.display = 'block';
            errorMsg.innerText = '비밀번호(PIN)가 일치하지 않습니다.';
            return;
        }

        const consentCheckbox = document.getElementById('privacy-consent');
        if (consentCheckbox && !consentCheckbox.checked) {
            errorMsg.style.display = 'block';
            errorMsg.innerText = '개인정보 처리방침에 동의해야 회원가입이 가능합니다.';
            return;
        }
    }

    const result = isSignup ? await handleSignup(id, pw, name) : await handleLogin(id, pw);

    if (result.error) {
        errorMsg.style.display = 'block';
        errorMsg.innerText = result.error;
    } else if (isSignup) {
        alert('회원가입 완료! 로그인해주세요.');
        toggleBtn.click();
    } else {
        state.user = result.user;
        localStorage.setItem('app_user', JSON.stringify(state.user)); // Save Session
        document.getElementById('user-display').innerText = `학번: ${state.user.student_id} (${state.user.name})`;
        loginScreen.style.display = 'none';
        appContent.style.display = 'block';

        if (pw === '0000') {
            showChangePinModal(state.user.student_id);
        } else {
            initApp();
        }
    }
});

document.getElementById('teacher-login-link').addEventListener('click', async (e) => {
    e.preventDefault();
    const { error } = await signInWithGoogle();
    if (error) alert('구글 로그인 중 오류가 발생했습니다: ' + error.message);
});

async function showTeacherDashboard(email) {
    hideAllSections();
    document.getElementById('teacher-section').style.display = 'block';
    if (email) document.getElementById('teacher-email-display').innerText = email;
    
    // Setup sidebar navigation
    const tabStudents = document.getElementById('tab-students');
    const tabAttendance = document.getElementById('tab-attendance');
    const tabStepHalf = document.getElementById('tab-step-half');
    const tabProgress = document.getElementById('tab-progress');
    const tabTeacherStep1 = document.getElementById('tab-teacher-step1');
    const tabTeacherStep2 = document.getElementById('tab-teacher-step2');
    const tabTeacherStep3 = document.getElementById('tab-teacher-step3');
    const tabStep3Half = document.getElementById('tab-step-3half');
    const tabStep1 = document.getElementById('tab-step1');
    const tabStep2 = document.getElementById('tab-step2');
    const tabCompetitions = document.getElementById('tab-competitions');
    const tabTeachers = document.getElementById('tab-teachers');

    const viewStudents = document.getElementById('teacher-students-view');
    const viewAttendance = document.getElementById('teacher-attendance-view');
    const viewStepHalf = document.getElementById('teacher-step-half-view');
    const viewProgress = document.getElementById('teacher-progress-view');
    const viewTeacherStep1 = document.getElementById('teacher-step1-test-explore-view');
    const viewTeacherStep2 = document.getElementById('teacher-step2-test-save-view');
    const viewStep1 = document.getElementById('teacher-step1-view');
    const viewStep2 = document.getElementById('teacher-step2-view');
    const viewCompetitions = document.getElementById('teacher-competitions-view');
    const viewManagement = document.getElementById('teacher-management-view');
    const viewStep3Half = document.getElementById('teacher-step-3half-view');
    const viewTeachers = document.getElementById('teacher-permissions-view');

    const switchTab = (activeTab, activeView) => {
        [tabStudents, tabAttendance, tabStepHalf, tabProgress, tabTeacherStep1, tabTeacherStep2, tabTeacherStep3, tabStep3Half, tabStep1, tabStep2, tabCompetitions, tabTeachers].forEach(t => t?.classList.remove('active'));
        [viewStudents, viewAttendance, viewStepHalf, viewProgress, viewTeacherStep1, viewTeacherStep2, viewManagement, viewStep3Half, viewStep1, viewStep2, viewCompetitions, viewTeachers].forEach(v => { if(v) v.style.display = 'none'; });
        activeTab.classList.add('active');
        activeView.style.display = 'block';
    };
    
    // ── 출석 체크 ───────────────────────────────────────────
    const statLabel = { present: '출석', late: '지각', absent: '결석', etc: '기타' };
    const statColor = { present: '#16a34a', late: '#b45309', absent: '#dc2626', etc: '#6366f1' };
    const statSymbol = { present: '○', late: '△', absent: '✕', etc: '-' };
    let calState = { year: new Date().getFullYear(), month: new Date().getMonth() + 1, summary: {} };

    // ── 전체 현황표 ──
    const renderOverviewTable = async () => {
        const container = document.getElementById('att-overview-container');
        if (!container) return;
        container.innerHTML = '<p class="text-muted" style="text-align:center;padding:40px;">데이터를 불러오는 중...</p>';

        const { fetchAllAttendanceOverview, fetchAllStudents: fetchStudents } = await import('./auth.js');
        const [{ data: allRecords }, { data: students }] = await Promise.all([
            fetchAllAttendanceOverview(),
            fetchStudents()
        ]);

        // 날짜 목록 (오름차순, 중복 제거)
        const dates = [...new Set((allRecords || []).map(r => r.date))].sort();
        if (dates.length === 0) {
            container.innerHTML = '<p class="text-muted" style="text-align:center;padding:40px;">저장된 출결 자료가 없습니다.</p>';
            return;
        }

        // 조회 맵: { student_id: { date: {status, note} } }
        const recMap = {};
        (allRecords || []).forEach(r => {
            if (!recMap[r.student_id]) recMap[r.student_id] = {};
            recMap[r.student_id][r.date] = r;
        });

        // 날짜 → 월/일 표시
        const fmtDate = d => { const [,m,dd] = d.split('-'); return `${parseInt(m)}/${parseInt(dd)}`; };

        // 학생별 결석/지각 합계
        const totals = (sid) => {
            let absent = 0, late = 0;
            dates.forEach(d => {
                const s = recMap[sid]?.[d]?.status;
                if (s === 'absent') absent++;
                if (s === 'late') late++;
            });
            return { absent, late };
        };

        const thBase = 'padding:8px 10px;border:1px solid #d1c89a;background:#f5f0d8;font-size:0.78rem;text-align:center;white-space:nowrap;font-weight:700;color:#5a4e2e;';
        const tdBase = 'padding:7px 8px;border:1px solid #e2d9b8;font-size:0.82rem;text-align:center;white-space:nowrap;';

        let html = `<div style="overflow-x:auto;"><table style="border-collapse:collapse;min-width:100%;">
            <thead>
                <tr>
                    <th rowspan="2" style="${thBase}width:32px;">연번</th>
                    <th rowspan="2" style="${thBase}">학번</th>
                    <th rowspan="2" style="${thBase}">학생</th>
                    <th colspan="${dates.length}" style="${thBase}background:#ede8c8;">차시 / 날짜</th>
                    <th rowspan="2" style="${thBase}background:#fde8e8;color:#b91c1c;">계<br><span style="font-weight:400;font-size:0.7rem;">결/지</span></th>
                </tr>
                <tr>
                    ${dates.map((d, i) => `<th style="${thBase}background:#ede8c8;min-width:38px;">
                        <div style="font-size:0.7rem;color:#7c6d3a;">${i+1}차</div>
                        <div style="font-size:0.75rem;">${fmtDate(d)}</div>
                    </th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${(students || []).map((s, i) => {
                    const t = totals(s.student_id);
                    const rowBg = i % 2 === 0 ? 'white' : '#fafaf5';
                    return `<tr style="background:${rowBg};">
                        <td style="${tdBase}color:#94a3b8;">${i+1}</td>
                        <td style="${tdBase}color:#64748b;font-size:0.75rem;">${s.student_id}</td>
                        <td style="${tdBase}font-weight:600;text-align:left;padding-left:12px;">${s.name}</td>
                        ${dates.map(d => {
                            const rec = recMap[s.student_id]?.[d];
                            if (!rec) return `<td style="${tdBase}color:#cbd5e1;font-size:0.7rem;">-</td>`;
                            const sym = statSymbol[rec.status] || rec.status;
                            const col = statColor[rec.status] || '#334155';
                            const bg = rec.status === 'absent' ? '#fff1f2' : rec.status === 'late' ? '#fffbeb' : 'inherit';
                            const title = rec.note ? `title="${rec.note}"` : '';
                            return `<td style="${tdBase}color:${col};font-weight:700;background:${bg};" ${title}>${sym}</td>`;
                        }).join('')}
                        <td style="${tdBase}background:#fff5f5;font-weight:700;">
                            ${t.absent > 0 ? `<span style="color:#dc2626;">결${t.absent}</span>` : ''}
                            ${t.late > 0 ? `<span style="color:#b45309;margin-left:2px;">지${t.late}</span>` : ''}
                            ${t.absent === 0 && t.late === 0 ? '<span style="color:#16a34a;">○</span>' : ''}
                        </td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table></div>
        <p style="margin-top:10px;font-size:0.75rem;color:#94a3b8;">※ 셀에 마우스를 올리면 메모를 확인할 수 있습니다. 날짜 클릭 시 해당 날 입력 화면으로 이동합니다.</p>`;

        container.innerHTML = html;

        // 날짜 헤더 클릭 → 날별 입력 탭으로 이동
        container.querySelectorAll('th[data-att-date]').forEach(th => {
            th.style.cursor = 'pointer';
            th.addEventListener('click', () => {
                document.getElementById('att-tab-daily-btn').click();
                const picker = document.getElementById('attendance-date-picker');
                if (picker) { picker.value = th.dataset.attDate; }
                document.getElementById('attendance-load-btn').click();
            });
        });
        // 날짜 th에 data-att-date 주입
        const thEls = container.querySelectorAll('thead tr:nth-child(2) th');
        thEls.forEach((th, i) => { if (dates[i]) th.dataset.attDate = dates[i]; });
    };

    // ── 캘린더 (날별 입력 탭 내) ──
    const renderCalendar = async () => {
        const { fetchAttendanceSummaryByMonth } = await import('./auth.js');
        const { data } = await fetchAttendanceSummaryByMonth(calState.year, calState.month);
        calState.summary = data || {};

        const label = document.getElementById('cal-month-label');
        if (label) label.textContent = `${calState.year}년 ${calState.month}월`;
        const cal = document.getElementById('attendance-calendar');
        if (!cal) return;

        const today = new Date().toISOString().slice(0, 10);
        const firstDay = new Date(calState.year, calState.month - 1, 1).getDay();
        const daysInMonth = new Date(calState.year, calState.month, 0).getDate();
        const weeks = ['일','월','화','수','목','금','토'];

        let html = `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;">`;
        weeks.forEach((w, i) => {
            const c = i===0 ? '#ef4444' : i===6 ? '#3b82f6' : '#64748b';
            html += `<div style="text-align:center;font-size:0.72rem;font-weight:700;color:${c};padding:3px 0;">${w}</div>`;
        });
        for (let i = 0; i < firstDay; i++) html += `<div></div>`;
        for (let d = 1; d <= daysInMonth; d++) {
            const ds = `${calState.year}-${String(calState.month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const hasData = !!calState.summary[ds];
            const isToday = ds === today;
            const dow = new Date(calState.year, calState.month - 1, d).getDay();
            const nc = dow===0 ? '#ef4444' : dow===6 ? '#3b82f6' : '#334155';
            const s = calState.summary[ds];
            const tooltip = s ? `출석${s.present} 지각${s.late} 결석${s.absent} 기타${s.etc}` : '';
            html += `<div class="cal-day" data-date="${ds}" title="${tooltip}"
                style="border-radius:7px;padding:5px 3px;text-align:center;cursor:${hasData?'pointer':'default'};
                       background:${hasData?'#eff6ff':'white'};
                       border:${isToday?'2px solid var(--primary)':hasData?'1px solid #bfdbfe':'1px solid #f1f5f9'};
                       min-height:44px;transition:box-shadow 0.15s;">
                <div style="font-size:0.8rem;font-weight:${isToday?'800':'500'};color:${hasData?'#1d4ed8':nc};">${d}</div>
                ${hasData ? `<div style="width:6px;height:6px;border-radius:50%;background:#3b82f6;margin:2px auto 0;"></div>` : ''}
            </div>`;
        }
        html += `</div>`;
        cal.innerHTML = html;

        cal.querySelectorAll('.cal-day[data-date]').forEach(cell => {
            cell.addEventListener('mouseenter', () => { if (calState.summary[cell.dataset.date]) cell.style.boxShadow='var(--shadow)'; });
            cell.addEventListener('mouseleave', () => { cell.style.boxShadow=''; });
            cell.addEventListener('click', () => {
                const picker = document.getElementById('attendance-date-picker');
                if (picker) picker.value = cell.dataset.date;
                document.getElementById('attendance-load-btn').click();
            });
        });
    };

    // ── 서브탭 전환 ──
    const showAttOverview = () => {
        document.getElementById('att-overview-section').style.display = 'block';
        document.getElementById('att-daily-section').style.display = 'none';
        document.getElementById('att-tab-overview-btn').className = 'btn-primary';
        document.getElementById('att-tab-daily-btn').className = 'btn-secondary';
    };
    const showAttDaily = () => {
        document.getElementById('att-overview-section').style.display = 'none';
        document.getElementById('att-daily-section').style.display = 'block';
        document.getElementById('att-tab-overview-btn').className = 'btn-secondary';
        document.getElementById('att-tab-daily-btn').className = 'btn-primary';
    };

    document.getElementById('att-tab-overview-btn').onclick = () => { showAttOverview(); };
    document.getElementById('att-tab-daily-btn').onclick = async () => {
        showAttDaily();
        const picker = document.getElementById('attendance-date-picker');
        if (picker && !picker.value) picker.value = new Date().toISOString().slice(0, 10);
        if (window.lucide) window.lucide.createIcons();
        await renderCalendar();
        document.getElementById('cal-prev-btn').onclick = async () => {
            calState.month--; if (calState.month < 1) { calState.month=12; calState.year--; } await renderCalendar();
        };
        document.getElementById('cal-next-btn').onclick = async () => {
            calState.month++; if (calState.month > 12) { calState.month=1; calState.year++; } await renderCalendar();
        };
        document.getElementById('cal-today-btn').onclick = async () => {
            calState.year=new Date().getFullYear(); calState.month=new Date().getMonth()+1; await renderCalendar();
        };
    };
    document.getElementById('att-overview-refresh-btn').onclick = renderOverviewTable;

    tabAttendance.onclick = async () => {
        switchTab(tabAttendance, viewAttendance);
        showAttOverview();
        if (window.lucide) window.lucide.createIcons();
        await renderOverviewTable();
    };

    document.getElementById('attendance-load-btn').addEventListener('click', async () => {
        const date = document.getElementById('attendance-date-picker').value;
        if (!date) { alert('날짜를 선택해주세요.'); return; }

        const container = document.getElementById('attendance-table-container');
        container.innerHTML = '<p class="text-muted" style="text-align:center;padding:40px;">불러오는 중...</p>';

        const { fetchAttendanceByDate, fetchAllStudents: fetchStudents } = await import('./auth.js');
        const [{ data: students }, { data: logs }] = await Promise.all([
            fetchStudents(),
            fetchAttendanceByDate(date)
        ]);

        const logMap = {};
        (logs || []).forEach(r => { logMap[r.student_id] = r; });

        const saveBtn = document.getElementById('attendance-save-btn');
        const allPresentBtn = document.getElementById('attendance-all-present-btn');
        saveBtn.style.display = 'inline-flex';
        allPresentBtn.style.display = 'inline-flex';

        allPresentBtn.onclick = () => {
            container.querySelectorAll('select.att-status').forEach(sel => { sel.value='present'; sel.style.color=statColor.present; });
        };

        container.innerHTML = `
            <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                    <thead>
                        <tr style="background:#f1f5f9;text-align:left;">
                            <th style="padding:10px 14px;border-bottom:1px solid #e2e8f0;width:40px;">#</th>
                            <th style="padding:10px 14px;border-bottom:1px solid #e2e8f0;">학번</th>
                            <th style="padding:10px 14px;border-bottom:1px solid #e2e8f0;">이름</th>
                            <th style="padding:10px 14px;border-bottom:1px solid #e2e8f0;">출결</th>
                            <th style="padding:10px 14px;border-bottom:1px solid #e2e8f0;">메모</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(students || []).map((s, i) => {
                            const log = logMap[s.student_id];
                            const status = log?.status || 'present';
                            return `
                            <tr style="border-bottom:1px solid #f1f5f9;" class="att-row" data-id="${s.student_id}">
                                <td style="padding:10px 14px;color:#94a3b8;">${i+1}</td>
                                <td style="padding:10px 14px;color:#475569;font-size:0.85rem;">${s.student_id}</td>
                                <td style="padding:10px 14px;font-weight:600;">${s.name}</td>
                                <td style="padding:10px 14px;">
                                    <select class="att-status" style="border:1px solid #e2e8f0;border-radius:6px;padding:5px 10px;font-size:0.85rem;font-family:inherit;color:${statColor[status]};font-weight:600;background:white;">
                                        ${Object.entries(statLabel).map(entry => {
                                            const [val, lab] = entry;
                                            return `<option value="${val}" ${status === val ? 'selected' : ''} style="color:${statColor[val]};">${lab}</option>`;
                                        }).join('')}
                                    </select>
                                </td>
                                <td style="padding:10px 14px;">
                                    <input type="text" class="att-note" value="${(log && log.note) ? log.note : ''}"
                                        placeholder="메모 (선택)"
                                        style="border:1px solid #e2e8f0;border-radius:6px;padding:5px 10px;font-size:0.85rem;font-family:inherit;width:100%;max-width:200px;"/>
                                </td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>`;

        container.querySelectorAll('select.att-status').forEach(sel => {
            sel.addEventListener('change', () => { sel.style.color = statColor[sel.value]; });
        });

        const updateSummary = () => {
            const counts = { present:0, late:0, absent:0, etc:0 };
            container.querySelectorAll('select.att-status').forEach(sel => counts[sel.value]++);
            document.getElementById('attendance-summary').style.display = 'flex';
            document.getElementById('attendance-summary').innerHTML =
                `<div style="display:flex;gap:14px;flex-wrap:wrap;font-size:0.88rem;">
                    ${Object.entries(statLabel).map(([v,l]) =>
                        `<span style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:6px 14px;">
                            <span style="color:${statColor[v]};font-weight:700;">${l}</span>
                            <span style="color:#475569;margin-left:4px;">${counts[v]}명</span>
                        </span>`).join('')}
                    <span style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:6px 14px;color:#64748b;">전체 ${(students||[]).length}명</span>
                </div>`;
        };
        updateSummary();
        container.querySelectorAll('select.att-status').forEach(sel => sel.addEventListener('change', updateSummary));
        if (window.lucide) window.lucide.createIcons();
    });

    document.getElementById('attendance-save-btn').addEventListener('click', async () => {
        const date = document.getElementById('attendance-date-picker').value;
        if (!date) return;

        const rows = document.querySelectorAll('.att-row');
        const records = [];
        rows.forEach(row => {
            records.push({
                date,
                student_id: row.dataset.id,
                status: row.querySelector('.att-status').value,
                note: row.querySelector('.att-note').value.trim() || null
            });
        });

        const { upsertAttendance } = await import('./auth.js');
        const { error } = await upsertAttendance(records);
        if (error) {
            alert('저장 중 오류가 발생했습니다: ' + error.message);
        } else {
            const saveBtn = document.getElementById('attendance-save-btn');
            const orig = saveBtn.innerHTML;
            saveBtn.innerHTML = '✅ 저장 완료';
            saveBtn.disabled = true;
            setTimeout(() => { saveBtn.innerHTML = orig; saveBtn.disabled = false; }, 2000);
            await renderCalendar();
        }
    });
    // ────────────────────────────────────────────────────────

    tabStudents.onclick = async () => {
        switchTab(tabStudents, viewStudents);
        const list = viewStudents.querySelector('#teacher-student-list');
        if (list) list.innerHTML = '<div style="text-align:center;padding:40px;"><p class="text-muted">데이터를 불러오는 중입니다...</p></div>';
        const { data } = await fetchAllStudents();
        UI.renderTeacherDashboard(data || [], onResetPin, onDeleteStudent);
    };
    
    tabProgress.onclick = async () => {
        switchTab(tabProgress, viewProgress);
        const progressList = viewProgress.querySelector('#teacher-progress-list');
        if (progressList) progressList.innerHTML = '<div style="text-align:center;padding:40px;"><p class="text-muted">데이터를 불러오는 중입니다...</p></div>';
        const { data } = await fetchStudentProgressSnapshot();
        UI.renderStudentProgress(data, onViewStudentDetail);
    };

    // ── 1.5단계: 주제 탐색 ──────────────────────────────────
    tabStepHalf.onclick = async () => {
        switchTab(tabStepHalf, viewStepHalf);
        if (window.lucide) window.lucide.createIcons();

        const root = document.getElementById('teacher-step-half-root');
        if (!root || root.dataset.rendered === 'true') return; // 이미 렌더된 경우 재렌더 생략
        root.dataset.rendered = 'true';

        const { categories } = await import('./data.js');
        const diffColor = { '초급': { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' }, '중급': { bg: '#fffbeb', border: '#fde68a', text: '#b45309' }, '심화': { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' } };
        let selectedCatId = null;

        const renderTopics = () => {
            const cat = selectedCatId ? categories.find(c => c.id === selectedCatId) : null;
            root.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                    <h2>1.5단계: 연구 주제 탐색</h2>
                    ${cat ? `<button id="teacher-back-btn" class="btn-secondary" style="font-size:0.85rem;">← 전체 분야 보기</button>` : ''}
                </div>

                ${!cat ? `
                <!-- 카테고리 목록 -->
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:25px;">
                    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 18px;">
                        <div style="font-size:0.75rem;font-weight:700;color:#16a34a;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">1.5단계 역할</div>
                        <div style="font-size:0.88rem;color:#166534;line-height:1.55;">분야를 클릭해 <strong>교육과의 접점</strong>과 연구 아이디어를 먼저 탐색하세요. 주제가 정해지면 1단계로 돌아가 데이터를 찾으면 됩니다.</div>
                    </div>
                    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px 18px;">
                        <div style="font-size:0.75rem;font-weight:700;color:#1d4ed8;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">난이도 기준</div>
                        <div style="font-size:0.88rem;color:#1e3a8a;line-height:1.55;"><span style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:4px;padding:1px 7px;font-weight:600;color:#16a34a;">초급</span> 데이터 구조 단순 &nbsp;<span style="background:#fffbeb;border:1px solid #fde68a;border-radius:4px;padding:1px 7px;font-weight:600;color:#b45309;">중급</span> 2개 이상 결합 &nbsp;<span style="background:#fef2f2;border:1px solid #fecaca;border-radius:4px;padding:1px 7px;font-weight:600;color:#dc2626;">심화</span> 통계 모델 필요</div>
                    </div>
                    <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;padding:16px 18px;">
                        <div style="font-size:0.75rem;font-weight:700;color:#7c3aed;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">활용 방법</div>
                        <div style="font-size:0.88rem;color:#4c1d95;line-height:1.55;">마음에 드는 분야를 클릭 → 교육 접점 질문과 아이디어 확인 → <strong>1단계 데이터 탐색</strong>으로 이동해 실제 데이터 수집</div>
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;">
                    ${categories.map(c => {
                        const dc = diffColor[c.difficulty] || diffColor['초급'];
                        return `
                        <div class="cat-card glass" data-id="${c.id}" style="padding:20px;cursor:pointer;border-radius:12px;border:1px solid #e2e8f0;transition:box-shadow 0.2s;display:flex;flex-direction:column;gap:10px;">
                            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                                <div style="display:flex;align-items:center;gap:10px;">
                                    <i data-lucide="${c.icon}" size="20" style="color:var(--primary);flex-shrink:0;"></i>
                                    <strong style="font-size:1rem;color:var(--secondary);">${c.title}</strong>
                                </div>
                                <span style="font-size:0.72rem;font-weight:700;background:${dc.bg};border:1px solid ${dc.border};color:${dc.text};border-radius:6px;padding:2px 9px;white-space:nowrap;">${c.difficulty}</span>
                            </div>
                            <p style="font-size:0.83rem;color:#64748b;margin:0;line-height:1.5;">🎓 ${c.educationLinks[0]}</p>
                            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:2px;">
                                ${c.keywords.slice(0,3).map(k => `<span style="font-size:0.72rem;background:#f1f5f9;border-radius:4px;padding:2px 8px;color:#475569;">#${k}</span>`).join('')}
                            </div>
                        </div>`;
                    }).join('')}
                </div>` : `
                <div style="display:flex;flex-direction:column;gap:18px;">
                    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:20px;">
                        <h4 style="color:#0369a1;margin:0 0 14px;font-size:0.95rem;display:flex;align-items:center;gap:8px;">
                            <i data-lucide="graduation-cap" size="16"></i> 교육과 이렇게 연결돼요
                        </h4>
                        <div style="display:flex;flex-direction:column;gap:10px;">
                            ${cat.educationLinks.map(q => `
                            <div style="display:flex;align-items:flex-start;gap:10px;padding:12px 14px;background:white;border-radius:8px;border:1px solid #e0f2fe;">
                                <span style="font-size:1rem;flex-shrink:0;">💡</span>
                                <p style="margin:0;font-size:0.92rem;color:#0c4a6e;line-height:1.55;">${q}</p>
                            </div>`).join('')}
                        </div>
                    </div>
                    <div style="background:white;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
                        <h4 style="color:var(--secondary);margin:0 0 14px;font-size:0.95rem;display:flex;align-items:center;gap:8px;">
                            <i data-lucide="lightbulb" size="16"></i> 이런 연구를 할 수 있어요
                        </h4>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                            ${cat.ideas.map(idea => `
                            <div style="padding:14px 16px;background:#f8fafc;border-radius:8px;border-left:3px solid var(--primary);">
                                <span style="font-size:0.72rem;font-weight:700;background:var(--primary-glow);color:var(--primary);border-radius:4px;padding:2px 8px;">${idea.tag}</span>
                                <p style="margin:8px 0 0;font-size:0.88rem;color:#334155;line-height:1.5;">${idea.content}</p>
                            </div>`).join('')}
                        </div>
                    </div>

                    <!-- 키워드 & 데이터 -->
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;">
                        <div style="background:white;border:1px solid #e2e8f0;border-radius:12px;padding:18px;">
                            <h4 style="color:var(--secondary);margin:0 0 12px;font-size:0.9rem;">🔑 핵심 키워드 <span style="font-size:0.72rem;font-weight:400;color:#94a3b8;">(클릭 시 데이터 포털 검색)</span></h4>
                            <div style="display:flex;flex-wrap:wrap;gap:7px;">
                                ${cat.keywords.map(k => `<a href="https://data.go.kr/tcs/dss/selectDataSetList.do?keyword=${encodeURIComponent(k)}" target="_blank" rel="noopener noreferrer" style="font-size:0.8rem;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:4px 10px;color:#475569;font-weight:500;text-decoration:none;transition:background 0.15s;" onmouseover="this.style.background='#e0e7ef'" onmouseout="this.style.background='#f1f5f9'">#${k}</a>`).join('')}
                            </div>
                        </div>
                        <div style="background:white;border:1px solid #e2e8f0;border-radius:12px;padding:18px;">
                            <h4 style="color:var(--secondary);margin:0 0 12px;font-size:0.9rem;">📂 활용 가능한 데이터 <span style="font-size:0.72rem;font-weight:400;color:#94a3b8;">(클릭 시 데이터 포털 검색)</span></h4>
                            <div style="margin-bottom:8px;">
                                <strong style="font-size:0.78rem;color:#64748b;">주요</strong>
                                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">
                                    ${cat.mainData.split(',').map(d => d.trim()).filter(Boolean).map(d => `<a href="https://data.go.kr/tcs/dss/selectDataSetList.do?keyword=${encodeURIComponent(d)}" target="_blank" rel="noopener noreferrer" style="font-size:0.78rem;background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;padding:3px 9px;color:#0369a1;text-decoration:none;" onmouseover="this.style.background='#e0f2fe'" onmouseout="this.style.background='#f0f9ff'">${d}</a>`).join('')}
                                </div>
                            </div>
                            <div>
                                <strong style="font-size:0.78rem;color:#94a3b8;">추가</strong>
                                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">
                                    ${cat.subData.split(',').map(d => d.trim()).filter(Boolean).map(d => `<a href="https://data.go.kr/tcs/dss/selectDataSetList.do?keyword=${encodeURIComponent(d)}" target="_blank" rel="noopener noreferrer" style="font-size:0.78rem;background:#faf5ff;border:1px solid #e9d5ff;border-radius:6px;padding:3px 9px;color:#7c3aed;text-decoration:none;" onmouseover="this.style.background='#f3e8ff'" onmouseout="this.style.background='#faf5ff'">${d}</a>`).join('')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 교육분야 공공데이터 -->
                    ${(() => {
                        const eduKeywords = [
                            "학교시설정보", "급식식단정보", "학원 및 교습소 현황",
                            "폐교학교현황", "학교건강표본결과조사", "대학학과정보",
                            "교육통계자료", "학구도정보"
                        ];
                        return `
                        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:18px;margin-bottom:20px;">
                            <h4 style="color:#92400e;margin:0 0 12px;font-size:0.9rem;display:flex;align-items:center;gap:8px;">
                                <i data-lucide="graduation-cap" size="16"></i>
                                교육분야 공공데이터
                                <span style="font-size:0.72rem;font-weight:400;color:#b45309;">(클릭 시 데이터 포털 검색)</span>
                            </h4>
                            <div style="display:flex;flex-wrap:wrap;gap:7px;">
                                ${eduKeywords.map(k => `<a href="https://data.go.kr/tcs/dss/selectDataSetList.do?keyword=${encodeURIComponent(k)}" target="_blank" rel="noopener noreferrer" style="font-size:0.8rem;background:#fef9c3;border:1px solid #fde68a;border-radius:6px;padding:4px 11px;color:#92400e;text-decoration:none;font-weight:500;" onmouseover="this.style.background='#fef08a'" onmouseout="this.style.background='#fef9c3'">${k}</a>`).join('')}
                            </div>
                        </div>`;
                })()}
                `}
            `;
            if (window.lucide) window.lucide.createIcons();
            if (!cat) {
                root.querySelectorAll('.cat-card').forEach(card => {
                    card.addEventListener('mouseenter', () => card.style.boxShadow = 'var(--shadow)');
                    card.addEventListener('mouseleave', () => card.style.boxShadow = '');
                    card.addEventListener('click', () => { selectedCatId = card.dataset.id; renderTopics(); });
                });
            } else {
                const backBtn = document.getElementById('teacher-back-btn');
                if (backBtn) backBtn.onclick = () => { selectedCatId = null; renderTopics(); };
            }
        };
        renderTopics();
    };

    // ── 1단계: 데이터 탐색 (교사 테스트) ────────────────────────────────
    tabTeacherStep1.onclick = () => {
        switchTab(tabTeacherStep1, viewTeacherStep1);
        const root = document.getElementById('teacher-step1-test-root');
        if (root) {
            import('./discovery.js').then(m => m.renderDataExplorer(root, {
                user: { student_id: email, name: `${email.split('@')[0]} (교사)` },
                currentStep: 0
            }, (cat, dataInfo) => {
                alert(`'${dataInfo.name}' 데이터가 분석 목록에 추가되었습니다! \n[2단계: 데이터 저장] 단계에서 시스템에 등록할 수 있습니다.`);
                tabTeacherStep2.click();
            }));
        }
    };

    // ── 2단계: 데이터 저장 (교사 테스트) ────────────────────────────────
    tabTeacherStep2.onclick = () => {
        switchTab(tabTeacherStep2, viewTeacherStep2);
        const rootId = 'teacher-step2-test-root';
        const teacherUser = { student_id: email, name: `${email.split('@')[0]} (교사)` };
        UI.renderStepContent(1, { user: teacherUser }, (nextStep) => {
            if (nextStep === 2) tabTeacherStep3.click();
        }, rootId);
    };

    // ── 3단계: 전체 데이터 관리 (교사 테스트+모니터링) ──────────────────
    tabTeacherStep3.onclick = async () => {
        switchTab(tabTeacherStep3, viewManagement);
        await loadManagementTab();
    };

    // ── 3.5단계: 데이터 내용 미리보기 ──────────────────────────────────
    const loadStep3Half = async () => {
        const content = viewStep3Half?.querySelector('#teacher-step-3half-content');
        if (!content) return;
        content.innerHTML = '<div style="text-align:center;padding:40px;"><p class="text-muted">데이터를 불러오는 중입니다...</p></div>';

        const { renderDatasetSampleViewer } = await import('./ui-datasets.js');
        const { fetchTeacherTestDatasets } = await import('./auth.js');

        const { data: previewDs } = await fetchTeacherTestDatasets();

        content.innerHTML = `
            <div style="margin-bottom:20px; padding:15px 20px; background:#eef2ff; border:1px solid #c7d2fe; border-radius:12px; display:flex; align-items:center; gap:12px;">
                <div style="background:#4f46e5; color:white; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <i data-lucide="info" size="18"></i>
                </div>
                <div style="font-size:0.92rem; color:#3730a3; line-height:1.5;">
                    <strong>3단계(데이터 관리)</strong>에서 '연구 활용'으로 체크한 자료들의 샘플입니다.<br>
                    AI에게 데이터 구조를 설명할 때 아래의 <strong>[복사]</strong> 버튼을 활용해 보세요.
                </div>
            </div>
            <div id="step3half-preview-area" style="min-height:200px;"></div>
        `;

        if (window.lucide) lucide.createIcons();
        await renderDatasetSampleViewer(previewDs || [], 'step3half-preview-area');
    };

    if (tabStep3Half) {
        tabStep3Half.onclick = async () => {
            switchTab(tabStep3Half, viewStep3Half);
            await loadStep3Half();
        };
    }

    const refreshStep3HalfBtn = document.getElementById('refresh-step-3half-btn');
    if (refreshStep3HalfBtn) refreshStep3HalfBtn.onclick = loadStep3Half;

    const showStep1Monitor = () => {
        document.getElementById('step1-monitor-section').style.display = 'block';
        document.getElementById('step1-test-section').style.display = 'none';
        document.getElementById('step1-tab-monitor-btn').className = 'btn-primary';
        document.getElementById('step1-tab-test-btn').className = 'btn-secondary';
    };
    const showStep1Test = () => {
        document.getElementById('step1-monitor-section').style.display = 'none';
        document.getElementById('step1-test-section').style.display = 'block';
        document.getElementById('step1-tab-monitor-btn').className = 'btn-secondary';
        document.getElementById('step1-tab-test-btn').className = 'btn-primary';
    };

    const loadStep1Data = async () => {
        const step1List = viewStep1.querySelector('#teacher-step1-list');
        if (step1List) step1List.innerHTML = '<div style="text-align:center;padding:40px;"><p class="text-muted">데이터를 불러오는 중입니다...</p></div>';
        const { data } = await fetchAllProblemDefinitionsForTeacher();
        UI.renderTeacherProblemDefinitions(data || [], 'teacher-step1-list');
        if (window.lucide) window.lucide.createIcons();
    };

    const loadStep1Test = async () => {
        const { fetchTeacherTestDatasets } = await import('./auth.js');
        await UI.renderProblemDefinitionView(
            'teacher-step1-test-container',
            () => fetchTeacherTestDatasets(),
            null, // 교사 테스트 모드 — 저장 없음
            () => { tabTeacherStep3.click(); }
        );
    };

    tabStep1.onclick = async () => {
        switchTab(tabStep1, viewStep1);
        showStep1Monitor();
        await loadStep1Data();
        if (window.lucide) window.lucide.createIcons();
    };

    document.getElementById('step1-tab-monitor-btn').onclick = async () => {
        showStep1Monitor();
        await loadStep1Data();
    };
    document.getElementById('step1-tab-test-btn').onclick = async () => {
        showStep1Test();
        try { await loadStep1Test(); } catch(err) { console.error('loadStep1Test error:', err); }
    };

    const refreshStep1Btn = document.getElementById('refresh-step1-btn');
    if (refreshStep1Btn) refreshStep1Btn.onclick = loadStep1Data;

    const showStep2Monitor = () => {
        document.getElementById('step2-monitor-section').style.display = 'block';
        document.getElementById('step2-test-section').style.display = 'none';
        document.getElementById('step2-tab-monitor-btn').className = 'btn-primary';
        document.getElementById('step2-tab-test-btn').className = 'btn-secondary';
    };
    const showStep2Test = () => {
        document.getElementById('step2-monitor-section').style.display = 'none';
        document.getElementById('step2-test-section').style.display = 'block';
        document.getElementById('step2-tab-monitor-btn').className = 'btn-secondary';
        document.getElementById('step2-tab-test-btn').className = 'btn-primary';
    };

    const loadStep2Data = async () => {
        const step2Content = viewStep2.querySelector('#teacher-step2-content');
        if (step2Content) step2Content.innerHTML = '<div style="text-align:center;padding:40px;"><p class="text-muted">데이터를 불러오는 중입니다...</p></div>';
        const { data } = await fetchAllProblemDefinitionsForTeacher();
        UI.renderTeacherPreprocessing(data || [], 'teacher-step2-content');
    };

    const loadStep2Test = async () => {
        const {
            fetchTeacherTestActivityLogs,
            fetchTeacherTestDatasets,
            getTeacherSelectedResearchId,
            setTeacherSelectedResearchId,
            deleteTeacherTestActivityLog,
        } = await import('./auth.js');
        await UI.renderPreprocessingView('teacher-step2-test-container', {
            getOwnLogsFn: () => fetchTeacherTestActivityLogs(),
            getTeamLogsFn: null,
            getDatasetsFn: () => fetchTeacherTestDatasets(),
            getSelectedId: () => getTeacherSelectedResearchId(),
            setSelectedIdAndRerender: (id) => {
                setTeacherSelectedResearchId(id);
                loadStep2Test();
            },
            onDelete: async (id) => {
                const { error } = await deleteTeacherTestActivityLog(id);
                if (error) alert('삭제 중 오류가 발생했습니다: ' + error.message);
                else await loadStep2Test();
            },
            onGoToStep4: () => {
                tabStep1.click();
                setTimeout(() => document.getElementById('step1-tab-test-btn')?.click(), 100);
            },
            isTeacherMode: true,
        });
    };

    tabStep2.onclick = async () => {
        switchTab(tabStep2, viewStep2);
        showStep2Monitor();
        await loadStep2Data();
        if (window.lucide) window.lucide.createIcons();
    };

    document.getElementById('step2-tab-monitor-btn').onclick = async () => {
        showStep2Monitor();
        await loadStep2Data();
    };
    document.getElementById('step2-tab-test-btn').onclick = async () => {
        showStep2Test();
        try { await loadStep2Test(); } catch(err) { console.error('loadStep2Test error:', err); }
    };

    const loadCompetitions = async () => {
        const list = viewCompetitions.querySelector('#teacher-competitions-list');
        if (list) list.innerHTML = '<div style="text-align:center;padding:40px;"><p class="text-muted">데이터를 불러오는 중입니다...</p></div>';
        const { fetchAllCompetitionApplications } = await import('./auth.js');
        const { data } = await fetchAllCompetitionApplications();
        UI.renderTeacherCompetitionApplications(data || [], 'teacher-competitions-list');
    };

    tabCompetitions.onclick = async () => {
        switchTab(tabCompetitions, viewCompetitions);
        await loadCompetitions();
    };

    const refreshCompBtn = document.getElementById('refresh-competitions-btn');
    if (refreshCompBtn) refreshCompBtn.onclick = loadCompetitions;

    const loadManagementTab = async () => {
        const datasetList = viewManagement.querySelector('#teacher-dataset-list');
        if (datasetList) datasetList.innerHTML = '<div style="text-align:center;padding:40px;"><p class="text-muted">데이터를 불러오는 중입니다...</p></div>';
        const { getTeacherResearchIds } = await import('./auth.js');
        const [{ data, error }, teacherIds, { data: { user } }] = await Promise.all([
            fetchAllDatasetsForTeacher(),
            getTeacherResearchIds(),
            supabaseClient.auth.getUser(),
        ]);
        if (!error) {
            UI.renderTeacherDataManagement(
                data, onTeacherToggleShare, onTeacherToggleResearch, teacherIds,
                user?.email, 
                false,        
                () => loadManagementTab()
            );
        }
    };


    
    tabTeachers.onclick = async () => {
        switchTab(tabTeachers, viewTeachers);
        const { data } = await fetchAllTeachers();
        UI.renderTeacherPermissions(data, onTeacherStatusUpdate);
    };
    
    // Initial Load: Competitions Tab (New Default)
    if (tabCompetitions) tabCompetitions.click();

    // Render icons for sidebar
    if (window.lucide) window.lucide.createIcons();
}

async function onDeleteStudent(studentId, studentName) {
    if (!confirm(`정말로 ${studentName} (${studentId}) 학생의 계정을 삭제하시겠습니까?\n\n* 공유된 데이터셋을 제외한 모든 활동 기록과 개인 데이터가 영구 삭제됩니다.`)) {
        return;
    }

    const { success, error } = await deleteStudentAccount(studentId);
    if (success) {
        alert('학생 계정이 삭제되었습니다.');
        // Refresh the list
        const { data } = await fetchAllStudents();
        if (data) UI.renderTeacherDashboard(data, onResetPin, onDeleteStudent);
    } else {
        console.error('Delete Student failed for ID:', studentId, error);
        let errorMsg = error?.message || '알 수 없는 오류';
        if (errorMsg.includes('foreign key constraint')) {
            errorMsg = '데이터 무결성 제약 조건으로 인해 삭제할 수 없습니다. (학생의 보존 대상 데이터가 남아있을 수 있습니다)';
        }
        alert('삭제 중 오류가 발생했습니다: ' + errorMsg);
    }
}

async function onViewStudentDetail(studentId, studentName) {
    // If no studentId, just refresh the progress list
    if (!studentId) {
        document.getElementById('tab-progress').click();
        return;
    }
    const detail = await fetchStudentDetail(studentId);
    await UI.showStudentDetailModal(studentName, detail);
}

document.getElementById('teacher-logout-btn').addEventListener('click', async () => {
    await signOut();
    location.reload();
});

async function onTeacherToggleShare(id, isShared) {
    const { error } = await toggleDatasetShare(id, isShared, null, true);
    if (error) alert('오류: ' + error.message);
}

async function onTeacherToggleResearch(id, isUse) {
    const { error } = await toggleResearchUse(id, isUse, null, false, true);
    if (error) alert('오류: ' + error.message);
}

async function onResetPin(studentId) {
    if (!confirm(`${studentId} 학생의 PIN을 0000으로 초기화할까요?`)) return;
    const { error } = await resetStudentPin(studentId);
    if (!error) {
        alert('초기화 완료!');
        // Refresh dashboard (pass the current email to retain display)
        const currentEmail = document.getElementById('teacher-email-display').innerText;
        showTeacherDashboard(currentEmail);
    } else alert('초기화 실패');
}

async function onTeacherStatusUpdate(id, newStatus) {
    const action = newStatus === 'approved' ? '승인' : '거절';
    if (!confirm(`해당 가입 요청을 ${action} 처리하시겠습니까?`)) return;
    
    const { data, error } = await updateTeacherStatus(id, newStatus);
    if (error) {
        alert('처리 중 오류가 발생했습니다: ' + error.message);
    } else if (!data || data.length === 0) {
        alert('권한이 없거나 대상을 찾을 수 없어 처리에 실패했습니다. (DB 보안 정책 확인 필요)');
    } else {
        alert(`요청이 ${action}되었습니다.`);
        const tabTeachers = document.getElementById('tab-teachers');
        if (tabTeachers) tabTeachers.click();
    }
}

document.getElementById('guest-login-btn').addEventListener('click', (e) => {
    e.preventDefault();
    state.user = { student_id: 'Guest', name: '비회원' };
    localStorage.setItem('app_user', JSON.stringify(state.user)); // Save Session (optional for guest)
    document.getElementById('user-display').innerText = '게스트: 비회원';
    loginScreen.style.display = 'none';
    appContent.style.display = 'block';
    initApp();
});

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('app_user'); // Clear Session
    location.reload();
});

// Navigation Logic
window.changeStep = changeStep;

function initApp() {
    changeStep(state.currentStep);
}

// Global callback for data selection
window.onDataSelected = (cat, dataInfo, stayOnPage = false) => {
    state.selectedTopic = { cat, dataInfo };
    
    // Update nav to show selected topic
    const topicBox = document.getElementById('selected-topic-box');
    const topicText = document.getElementById('current-topic-text');
    if (topicBox && topicText) {
        topicBox.style.display = 'block';
        topicText.innerText = `[${cat.title}] ${dataInfo.name}`;
    }

    if (!stayOnPage) {
        alert(`'${dataInfo.name}' 데이터가 분석 목록에 추가되었습니다! \n[데이터 관리] 단계에서 확인할 수 있습니다.`);
        // Move to management step
        changeStep(2);
    }
};

function changeStep(id) {
    if (window.innerWidth <= 768 && id !== 8) {
        id = 8; // Force Step 8 on mobile
    }
    state.currentStep = id;
    
    const s0 = document.getElementById('step-0');
    const sContent = document.getElementById('step-content-section');
    if (s0) s0.classList.remove('active');
    if (sContent) sContent.classList.remove('active');
    
    if (id === 0) {
        if (s0) s0.classList.add('active');
        const root = document.getElementById('explorer-root');
        if (root) {
            import('./discovery.js').then(m => m.renderDataExplorer(root, state, window.onDataSelected));
        }
    } else {
        if (sContent) sContent.classList.add('active');
        UI.renderStepContent(id, state, changeStep);
    }
    UI.renderStepsNav(id, state, changeStep);
}

function showChangePinModal(studentId) {
    const overlay = document.createElement('div');
    overlay.id = 'change-pin-overlay';
    overlay.style.cssText = `
        position: fixed; inset: 0; background: rgba(15,23,42,0.6);
        display: flex; align-items: center; justify-content: center; z-index: 9999;
    `;
    overlay.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 36px 32px; width: 360px; box-shadow: 0 20px 60px rgba(0,0,0,0.25);">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 2.2rem; margin-bottom: 10px;">🔐</div>
                <h3 style="margin: 0 0 8px; font-size: 1.15rem; color: #0f172a;">PIN 번호를 변경해 주세요</h3>
                <p style="margin: 0; font-size: 0.88rem; color: #64748b; line-height: 1.5;">현재 PIN이 초기값(0000)입니다.<br>새로운 4자리 PIN을 설정해 주세요.</p>
            </div>
            <div style="margin-bottom: 14px;">
                <label style="display: block; font-size: 0.82rem; font-weight: 600; color: #475569; margin-bottom: 6px;">새 PIN (4자리 숫자)</label>
                <input id="new-pin-input" type="password" inputmode="numeric" maxlength="4" pattern="\\d{4}"
                    style="width: 100%; box-sizing: border-box; padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 1.1rem; letter-spacing: 0.3em; text-align: center; outline: none;"
                    placeholder="••••">
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display: block; font-size: 0.82rem; font-weight: 600; color: #475569; margin-bottom: 6px;">새 PIN 확인</label>
                <input id="new-pin-confirm" type="password" inputmode="numeric" maxlength="4" pattern="\\d{4}"
                    style="width: 100%; box-sizing: border-box; padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 1.1rem; letter-spacing: 0.3em; text-align: center; outline: none;"
                    placeholder="••••">
            </div>
            <p id="pin-change-error" style="display:none; color:#dc2626; font-size:0.83rem; margin-bottom:14px; text-align:center;"></p>
            <button id="confirm-pin-change-btn"
                style="width: 100%; padding: 12px; background: var(--primary, #6366f1); color: white; border: none; border-radius: 8px; font-size: 0.95rem; font-weight: 600; cursor: pointer;">
                PIN 변경하기
            </button>
        </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('confirm-pin-change-btn').onclick = async () => {
        const newPin = document.getElementById('new-pin-input').value;
        const confirmPin = document.getElementById('new-pin-confirm').value;
        const errEl = document.getElementById('pin-change-error');

        if (!/^\d{4}$/.test(newPin)) {
            errEl.textContent = '4자리 숫자로 입력해 주세요.';
            errEl.style.display = 'block';
            return;
        }
        if (newPin === '0000') {
            errEl.textContent = '0000은 사용할 수 없습니다. 다른 번호를 입력해 주세요.';
            errEl.style.display = 'block';
            return;
        }
        if (newPin !== confirmPin) {
            errEl.textContent = 'PIN이 일치하지 않습니다.';
            errEl.style.display = 'block';
            return;
        }

        const btn = document.getElementById('confirm-pin-change-btn');
        btn.disabled = true;
        btn.textContent = '변경 중...';

        const { updateStudentPin } = await import('./auth.js');
        const { error } = await updateStudentPin(studentId, newPin);

        if (error) {
            errEl.textContent = 'PIN 변경 중 오류가 발생했습니다. 다시 시도해 주세요.';
            errEl.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'PIN 변경하기';
            return;
        }

        overlay.remove();
        alert('PIN이 변경되었습니다. 새 PIN으로 다시 로그인해 주세요.');
        localStorage.removeItem('app_user');
        location.reload();
    };
}

// Start
checkSession();
