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
        initApp();
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
    const tabProgress = document.getElementById('tab-progress');
    const tabStep1 = document.getElementById('tab-step1');
    const tabStep2 = document.getElementById('tab-step2');
    const tabCompetitions = document.getElementById('tab-competitions');
    const tabManagement = document.getElementById('tab-management');
    const tabTeachers = document.getElementById('tab-teachers');
    const viewStudents = document.getElementById('teacher-students-view');
    const viewProgress = document.getElementById('teacher-progress-view');
    const viewStep1 = document.getElementById('teacher-step1-view');
    const viewStep2 = document.getElementById('teacher-step2-view');
    const viewCompetitions = document.getElementById('teacher-competitions-view');
    const viewManagement = document.getElementById('teacher-management-view');
    const viewTeachers = document.getElementById('teacher-permissions-view');
    
    const switchTab = (activeTab, activeView) => {
        // Reset all nav items
        [tabStudents, tabProgress, tabManagement, tabStep1, tabStep2, tabCompetitions, tabTeachers].forEach(t => t.classList.remove('active'));
        // Hide all views
        [viewStudents, viewProgress, viewManagement, viewStep1, viewStep2, viewCompetitions, viewTeachers].forEach(v => v.style.display = 'none');
        
        // Activate current
        activeTab.classList.add('active');
        activeView.style.display = 'block';
    };
    
    tabStudents.onclick = () => {
        switchTab(tabStudents, viewStudents);
    };
    
    tabProgress.onclick = async () => {
        switchTab(tabProgress, viewProgress);
        const progressList = viewProgress.querySelector('#teacher-progress-list');
        if (progressList) progressList.innerHTML = '<div style="text-align:center;padding:40px;"><p class="text-muted">데이터를 불러오는 중입니다...</p></div>';
        const { data } = await fetchStudentProgressSnapshot();
        UI.renderStudentProgress(data, onViewStudentDetail);
    };

    tabStep1.onclick = async () => {
        switchTab(tabStep1, viewStep1);
        const step1List = viewStep1.querySelector('#teacher-step1-list');
        if (step1List) step1List.innerHTML = '<div style="text-align:center;padding:40px;"><p class="text-muted">데이터를 불러오는 중입니다...</p></div>';
        const { data } = await fetchAllProblemDefinitionsForTeacher();
        UI.renderTeacherProblemDefinitions(data || [], 'teacher-step1-list');
    };

    tabStep2.onclick = async () => {
        switchTab(tabStep2, viewStep2);
        const step2Content = viewStep2.querySelector('#teacher-step2-content');
        if (step2Content) step2Content.innerHTML = '<div style="text-align:center;padding:40px;"><p class="text-muted">데이터를 불러오는 중입니다...</p></div>';
        const { data } = await fetchAllProblemDefinitionsForTeacher();
        UI.renderTeacherPreprocessing(data || [], 'teacher-step2-content');
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

    tabManagement.onclick = async () => {
        switchTab(tabManagement, viewManagement);
        const datasetList = viewManagement.querySelector('#teacher-dataset-list');
        if (datasetList) datasetList.innerHTML = '<div style="text-align:center;padding:40px;"><p class="text-muted">데이터를 불러오는 중입니다...</p></div>';
        const { data, error } = await fetchAllDatasetsForTeacher();
        if (!error) {
            UI.renderTeacherDataManagement(data, onTeacherToggleShare, onTeacherToggleResearch);
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
window.onDataSelected = (cat, dataInfo) => {
    state.selectedTopic = { cat, dataInfo };
    
    // Update nav to show selected topic
    const topicBox = document.getElementById('selected-topic-box');
    const topicText = document.getElementById('current-topic-text');
    if (topicBox && topicText) {
        topicBox.style.display = 'block';
        topicText.innerText = `[${cat.title}] ${dataInfo.name}`;
    }

    alert(`'${dataInfo.name}' 데이터가 분석 목록에 추가되었습니다! \n[데이터 관리] 단계에서 확인할 수 있습니다.`);
    
    // Move to management step
    changeStep(2);
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

// Start
checkSession();
