import { handleLogin, handleSignup, fetchAllStudents, resetStudentPin } from './auth.js';
import * as UI from './ui.js';
import { showCategoryDetails } from './discovery.js';
import { onLoadDatasets } from './management.js';
import { onSaveRecord } from './research.js';

lucide.createIcons();

let state = {
    user: null,
    currentStep: 0,
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
        nameGroup.style.display = 'flex';
    } else {
        card.classList.remove('signup-mode');
        loginScreen.classList.remove('signup-mode-active');
        icon.setAttribute('data-lucide', 'log-in');
        nameGroup.style.display = 'none';
    }
    
    authTitle.innerText = isSignup ? '회원가입' : '로그인';
    authSubmitBtn.innerText = isSignup ? '가입하기' : '시작하기';
    toggleBtn.innerText = isSignup ? '이미 계정이 있나요? 로그인' : '처음이신가요? 회원가입';
    errorMsg.style.display = 'none';
    lucide.createIcons();
});

// Local Session Check
function checkSession() {
    const savedUser = localStorage.getItem('app_user');
    if (savedUser) {
        state.user = JSON.parse(savedUser);
        document.getElementById('user-display').innerText = `학번: ${state.user.student_id} (${state.user.name})`;
        loginScreen.style.display = 'none';
        appContent.style.display = 'block';
        initApp();
    }
}

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

document.getElementById('teacher-login-link').addEventListener('click', (e) => {
    e.preventDefault();
    const pw = prompt('관리자 비밀번호를 입력하세요:');
    if (pw === 'admin') showTeacherDashboard();
    else alert('비밀번호가 올바르지 않습니다.');
});

async function showTeacherDashboard() {
    loginScreen.style.display = 'none';
    document.getElementById('teacher-section').style.display = 'block';
    const { data } = await fetchAllStudents();
    if (data) UI.renderTeacherDashboard(data, onResetPin);
}

async function onResetPin(studentId) {
    if (!confirm(`${studentId} 학생의 PIN을 0000으로 초기화할까요?`)) return;
    const { error } = await resetStudentPin(studentId);
    if (!error) {
        alert('초기화 완료!');
        showTeacherDashboard();
    } else alert('초기화 실패');
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

function initApp() {
    UI.renderStepsNav(state.currentStep, state.selectedTopic, changeStep);
    UI.renderCategories((catId) => showCategoryDetails(catId, state, window.onDataSelected));
}

function changeStep(id) {
    state.currentStep = id;
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    if (id === 0) {
        document.getElementById('step-0').classList.add('active');
    } else {
        document.getElementById('step-content-section').classList.add('active');
        UI.renderStepContent(id, state, changeStep);
    }
    UI.renderStepsNav(id, state.selectedTopic, changeStep);
}

window.onDataSelected = async (cat, dataInfo) => {
    state.selectedTopic = { cat, dataInfo };
    document.getElementById('selected-topic-box').style.display = 'block';
    document.getElementById('current-topic-text').innerText = `[${cat.title}] ${dataInfo.name}`;
    
    if (state.user && state.user.student_id !== 'Guest') {
        const { saveActivityLog, saveStudentDataset } = await import('./auth.js');
        await saveActivityLog(state.user.student_id, 0, JSON.stringify(dataInfo));
        await saveStudentDataset(
            state.user.student_id, 
            dataInfo.name, 
            dataInfo.file_url, 
            { ...dataInfo.metadata, url: dataInfo.url },
            dataInfo.size_kb
        );
    }
    changeStep(1); 
};

// Start
checkSession();
