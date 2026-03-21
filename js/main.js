import { categories } from './data.js';
import { handleLogin, handleSignup } from './auth.js';
import * as UI from './ui.js';

lucide.createIcons();

let state = {
    user: null,
    currentStep: 0,
    selectedTopic: null,
    onSaveRecord: async (stepId, content) => {
        if (!state.user || state.user.student_id === 'Guest') {
            return alert('게스트 모드에서는 기록을 저장할 수 없습니다. 로그인이 필요합니다.');
        }
        if (!content.trim()) return alert('내용을 입력해주세요.');
        
        const { saveActivityLog } = await import('./auth.js');
        const { error } = await saveActivityLog(state.user.student_id, stepId, content);
        if (!error) alert('성공적으로 저장되었습니다!');
        else alert('저장 실패: ' + error.message);
    }
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

// Auth Submit
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('student-id').value;
    const pw = document.getElementById('password').value;
    const name = document.getElementById('student-name').value;

    // Special Teacher Login (Demo ID: teacher, PW: 0)
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
        document.getElementById('user-display').innerText = `학번: ${state.user.student_id} (${state.user.name})`;
        loginScreen.style.display = 'none';
        appContent.style.display = 'block';
        initApp();
    }
});

document.getElementById('teacher-login-link').addEventListener('click', (e) => {
    e.preventDefault();
    const pw = prompt('관리자 비밀번호를 입력하세요:');
    if (pw === 'admin') {
        showTeacherDashboard();
    } else {
        alert('비밀번호가 올바르지 않습니다.');
    }
});

async function showTeacherDashboard() {
    loginScreen.style.display = 'none';
    const teacherSection = document.getElementById('teacher-section');
    teacherSection.style.display = 'block';
    
    const { data, error } = await handleRequest(import('./auth.js').then(m => m.fetchAllStudents()));
    if (data) UI.renderTeacherDashboard(data, onResetPin);
}

async function onResetPin(studentId) {
    if (!confirm(`${studentId} 학생의 PIN을 0000으로 초기화할까요?`)) return;
    const { resetStudentPin } = await import('./auth.js');
    const { error } = await resetStudentPin(studentId);
    if (!error) {
        alert('초기화 완료!');
        showTeacherDashboard();
    } else {
        alert('초기화 실패');
    }
}

document.getElementById('guest-login-btn').addEventListener('click', (e) => {
    e.preventDefault();
    state.user = { student_id: 'Guest', name: '비회원' };
    document.getElementById('user-display').innerText = '게스트: 비회원';
    loginScreen.style.display = 'none';
    appContent.style.display = 'block';
    initApp();
});

// Helper for dynamic imports or static logic
async function handleRequest(promise) {
    return await promise;
}

document.getElementById('logout-btn').addEventListener('click', () => location.reload());

function initApp() {
    UI.renderStepsNav(state.currentStep, state.selectedTopic, changeStep);
    UI.renderCategories(showCategoryDetails);
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

function showCategoryDetails(catId) {
    const cat = categories.find(c => c.id === catId);
    const details = document.getElementById('category-details');
    details.style.display = 'block';
    details.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3>🔍 ${cat.title} 데이터 탐색 키워드</h3>
            <button id="close-details" class="btn-secondary">닫기</button>
        </div>
        
        <div style="margin-bottom: 30px;">
            <p class="text-muted" style="margin-bottom: 15px;">아래 키워드를 클릭하면 공공데이터포털 검색 결과로 연결됩니다.</p>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                ${cat.keywords.map(kw => `
                    <button class="glass keyword-btn" data-kw="${kw}" style="padding: 10px 15px; border-radius: 20px; font-size: 0.9rem; border: 1px solid var(--primary-glow);">
                        # ${kw}
                    </button>
                `).join('')}
            </div>
        </div>

        <div class="glass" style="padding: 25px; border-top: 2px solid var(--primary);">
            <h4 style="margin-bottom: 20px;">📥 발견한 데이터 정보 저장 및 연동</h4>
            <div style="display: grid; gap: 15px;">
                <div style="display: flex; gap: 10px; align-items: flex-end;">
                    <div style="flex: 1;">
                        <label style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 5px;">공공데이터포털 상세페이지 URL</label>
                        <input type="text" id="found-data-url" placeholder="https://www.data.go.kr/data/..." style="width: 100%; background: rgba(0,0,0,0.1); border: 1px solid var(--glass-border); color: var(--text); padding: 10px; border-radius: 5px;">
                    </div>
                    <button id="fetch-meta-btn" class="btn-secondary" style="height: 42px; padding: 0 15px; font-size: 0.8rem;">✨ 정보 불러오기</button>
                </div>

                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 5px;">데이터셋 이름</label>
                    <input type="text" id="found-data-name" placeholder="자동 완성 대기 중..." style="width: 100%; background: rgba(0,0,0,0.1); border: 1px solid var(--glass-border); color: var(--text); padding: 10px; border-radius: 5px;">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 5px;">제공기관</label>
                        <input type="text" id="found-data-provider" placeholder="자동 완성 대기 중..." style="width: 100%; background: rgba(0,0,0,0.1); border: 1px solid var(--glass-border); color: var(--text); padding: 10px; border-radius: 5px;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 5px;">업데이트 주기</label>
                        <input type="text" id="found-data-cycle" placeholder="자동 완성 대기 중..." style="width: 100%; background: rgba(0,0,0,0.1); border: 1px solid var(--glass-border); color: var(--text); padding: 10px; border-radius: 5px;">
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 5px;">
                    <button id="auto-link-btn" class="btn-secondary" style="flex: 1; font-size: 0.8rem; padding: 12px;">🔗 서버 자동 연동 (준비중)</button>
                    <button id="manual-upload-btn" class="btn-secondary" style="flex: 1; font-size: 0.8rem; padding: 12px;">📁 파일 직접 업로드</button>
                    <input type="file" id="file-input" style="display: none;" accept=".csv,.xlsx,.xls,.json">
                </div>

                <div id="upload-status" style="font-size: 0.75rem; color: var(--primary); display: none;">파일이 선택되었습니다.</div>

                <div style="text-align: right; margin-top: 10px;">
                    <button id="save-data-info" class="btn-primary">데이터 저장 및 단계 시작</button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('close-details').onclick = () => details.style.display = 'none';

    // File Upload Logic
    const fileInput = document.getElementById('file-input');
    const uploadStatus = document.getElementById('upload-status');
    let selectedFile = null;

    document.getElementById('manual-upload-btn').onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
        if (e.target.files.length > 0) {
            selectedFile = e.target.files[0];
            uploadStatus.innerText = `📄 ${selectedFile.name} (${Math.round(selectedFile.size/1024)}KB) 선택됨`;
            uploadStatus.style.display = 'block';
            document.getElementById('found-data-name').value = selectedFile.name.split('.')[0];
        }
    };

    document.getElementById('fetch-meta-btn').onclick = async () => {
        const url = document.getElementById('found-data-url').value;
        if (!url || !url.includes('data.go.kr')) return alert('올바른 공공데이터포털 URL을 입력해 주세요.');
        
        document.getElementById('fetch-meta-btn').innerText = '⌛ 추출 중...';
        
        try {
            // Updated Project ID and Function Path
            const EDGE_FUNCTION_URL = 'https://yfmstwhnqxrucbxjmmsd.supabase.co/functions/v1/data-fetcher';
            const ANON_KEY = 'sb_publishable_PD9suAY61uPmtavkjkPIJQ_aIos3uxL';
            
            const response = await fetch(EDGE_FUNCTION_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'apikey': ANON_KEY
                },
                body: JSON.stringify({ url })
            });
            
            if (!response.ok) throw new Error('서버 응답 오류');
            
            const result = await response.json();
            
            if (result.error) throw new Error(result.error);

            document.getElementById('found-data-name').value = result.name;
            document.getElementById('found-data-provider').value = result.provider;
            document.getElementById('found-data-cycle').value = result.cycle;

            alert('정보를 성공적으로 불러왔습니다! 🎊');
        } catch (err) {
            console.error('Meta Fetch Error:', err);
            alert('정보를 자동으로 가져오지 못했습니다. 상세 페이지 주소가 정확한지 확인해 주세요.');
        } finally {
            document.getElementById('fetch-meta-btn').innerText = '✨ 정보 불러오기';
        }
    };

    document.getElementById('auto-link-btn').onclick = () => {
        const url = document.getElementById('found-data-url').value;
        if (!url.includes('data.go.kr')) return alert('올바른 공공데이터포털 URL을 입력해주세요.');
        alert('이 기능은 수파베이스 Edge Functions 설정이 필요합니다. 개발자 모드에서 복사한 정보를 바탕으로 연동 로직을 구성 중입니다.');
    };
    
    document.querySelectorAll('.keyword-btn').forEach(btn => {
        btn.onclick = () => {
            const kw = btn.dataset.kw;
            window.open(`https://www.data.go.kr/tcs/dss/selectDataSetList.do?dType=FILE&keyword=${encodeURIComponent(kw)}`, '_blank');
        };
    });

    document.getElementById('save-data-info').onclick = async () => {
        const dataInfo = {
            name: document.getElementById('found-data-name').value,
            url: document.getElementById('found-data-url').value,
            metadata: {
                provider: document.getElementById('found-data-provider').value,
                cycle: document.getElementById('found-data-cycle').value
            },
            file_url: null
        };
        
        if (!dataInfo.name || !dataInfo.url) return alert('데이터 이름과 URL을 입력해주세요!');

        // If a file was selected, upload it first
        if (selectedFile && state.user && state.user.student_id !== 'Guest') {
            const { uploadManualFile } = await import('./downloader.js');
            const result = await uploadManualFile(state.user.student_id, selectedFile, selectedFile.name);
            if (result.success) {
                dataInfo.file_url = result.path;
                alert('파일이 수파베이스 스토리지에 업로드되었습니다!');
            } else {
                alert('파일 업로드 실패: ' + result.error);
            }
        }
        
        window.onDataSelected(cat, dataInfo);
    };

    window.scrollTo({ top: details.offsetTop - 100, behavior: 'smooth' });
}

window.onDataSelected = async (cat, dataInfo) => {
    state.selectedTopic = { cat, dataInfo };
    document.getElementById('selected-topic-box').style.display = 'block';
    document.getElementById('current-topic-text').innerText = `[${cat.title}] ${dataInfo.name}`;
    
    // Save to Supabase (Activity log + Topic Selection)
    if (state.user && state.user.student_id !== 'Guest') {
        const { saveTopicSelection, saveActivityLog } = await import('./auth.js');
        await saveTopicSelection(state.user.student_id, `${cat.id}-data`);
        await saveActivityLog(state.user.student_id, 0, JSON.stringify(dataInfo));
    }
    
    changeStep(1);
};
