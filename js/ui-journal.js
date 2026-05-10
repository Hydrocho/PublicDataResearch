export async function renderResearchJournal(containerId, state, options = {}) {
    const root = document.getElementById(containerId);
    if (!root) return;

    const isReadOnly = options.readOnly || false;
    const targetId = options.targetStudentId || state.user?.student_id;

    // 질문 목록
    const questions = [
        { id: 'q1', label: '1. 공공데이터란 무엇일까요?', placeholder: '공공기관이 개방한 데이터의 개념을 적어보세요.' },
        { id: 'q_pre', label: '2. 다른 사람의 연구 결과(논문, 보고서)나 보도 자료를 사전에 찾아봐야 하는 이유는 무엇일까요?', placeholder: '기존 연구를 통해 얻을 수 있는 힌트나 중복 방지 등의 이유를 적어보세요.' },
        { id: 'q3', label: '3. 데이터 전처리가 연구에서 왜 중요한가요?', placeholder: '데이터를 바로 사용하지 않고 정리해야 하는 이유를 적어보세요.' },
        { id: 'q4', label: '4. 결측치(Missing Value)란 무엇이며, 어떻게 처리해야 할까요?', placeholder: '빈 칸이 생기는 이유와 이를 채우거나 제거하는 방법을 적어보세요.' },
        { id: 'q5', label: '5. 가설이란 무엇이며, 좋은 가설은 어떤 조건을 갖추어야 할까요?', placeholder: '가설의 개념과 검증 가능성, 인과관계 등의 조건을 함께 적어보세요.' },
        { id: 'q6', label: '6. 가설 검증이란 무엇을 증명하는 과정인가요?', placeholder: '가설이 맞는지 틀리는지 확인하는 과정에 대해 적어보세요.' },
        { id: 'q7', label: '7. 통계적 가설 검증 방법(T-검정, 상관분석 등)에는 무엇이 있나요?', placeholder: '데이터의 특성에 따른 분석 방법들을 적어보세요.' },
        { id: 'q8', label: '8. 데이터 시각화의 최종 목적은 무엇일까요?', placeholder: '분석 결과를 왜 그래프나 차트로 보여주어야 할까요?' }
    ];

    root.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
            <div>
                <h2 style="margin-bottom:5px;">📝 0단계: 기초 지식 작성 ${isReadOnly ? '(조회 모드)' : ''}</h2>
                <p class="text-muted" style="margin:0; font-size:0.9rem;">질문에 답하며 데이터 연구의 기초를 다져보세요. ${!isReadOnly ? '<span id="auto-save-status" style="margin-left:10px; color:var(--primary); font-weight:600; opacity:0.7;">(자동 저장 활성화)</span>' : ''}</p>
            </div>
            <div id="save-indicator" style="font-size:0.85rem; color:#94a3b8; display:flex; align-items:center; gap:6px;">
                <i data-lucide="${isReadOnly ? 'eye' : 'cloud-check'}" size="16"></i>
                <span id="last-saved-time">불러오는 중...</span>
            </div>
        </div>

        <!-- 학습지 본문 (상하형 초밀착 레이아웃) -->
        <div id="worksheet-container" style="display:grid; grid-template-columns: 1fr; gap:10px; width: 98%; margin: 0 auto;">
            ${questions.map(q => `
                <div class="glass" style="padding:12px 18px; border-radius:10px; border-left:3px solid #e2e8f0;">
                    <label style="display:block; font-weight:700; color:var(--secondary); font-size:0.9rem; margin-bottom:6px;">${q.label}</label>
                    <textarea id="${q.id}" class="journal-input" placeholder="${q.placeholder}" 
                        ${isReadOnly ? 'readonly' : ''}
                        style="width:100%; min-height:50px; background:transparent; border:1px solid #f1f5f9; border-radius:8px; padding:10px; font-size:0.88rem; line-height:1.5; resize:vertical; outline:none;"></textarea>
                </div>
            `).join('')}
        </div>
    `;

    if (window.lucide) lucide.createIcons();

    // 데이터 로드
    const loadJournalData = async () => {
        try {
            const { fetchActivityLogs } = await import('./auth.js');
            const { data: logs } = await fetchActivityLogs(targetId, 0);
            if (logs && logs.length > 0) {
                let savedData = {};
                try {
                    savedData = JSON.parse(logs[0].content || '{}');
                } catch(e) {
                    // Fallback for old string content
                    savedData = { q1: logs[0].content };
                }
                
                questions.forEach(q => {
                    const el = document.getElementById(q.id);
                    if (el && savedData[q.id]) el.value = savedData[q.id];
                });
                document.getElementById('last-saved-time').innerText = `${isReadOnly ? '데이터 로드됨' : '마지막 저장'}: ${new Date(logs[0].updated_at || logs[0].created_at).toLocaleTimeString()}`;
            } else {
                document.getElementById('last-saved-time').innerText = '저장된 내용 없음';
            }
        } catch (err) {
            console.error('Load fail:', err);
            document.getElementById('last-saved-time').innerText = '로드 실패';
        }
    };

    // 자동 저장 함수 (Debounce)
    const triggerAutoSave = () => {
        if (isReadOnly) return;
        const statusEl = document.getElementById('auto-save-status');
        if (statusEl) {
            statusEl.innerText = '(저장 중...)';
            statusEl.style.opacity = '1';
        }

        if (autoSaveTimer) clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(async () => {
            const journalData = {};
            questions.forEach(q => {
                journalData[q.id] = document.getElementById(q.id).value;
            });

            try {
                await state.onSaveRecord(0, JSON.stringify(journalData));
                document.getElementById('last-saved-time').innerText = `자동 저장됨 (${new Date().toLocaleTimeString()})`;
                if (statusEl) {
                    statusEl.innerText = '(자동 저장됨)';
                    statusEl.style.opacity = '0.5';
                }
            } catch (err) {
                console.error('Auto-save fail:', err);
                if (statusEl) statusEl.innerText = '(저장 실패!)';
            }
        }, 2000); 
    };

    // 입력 이벤트 연결
    if (!isReadOnly) {
        document.querySelectorAll('.journal-input').forEach(input => {
            input.addEventListener('input', triggerAutoSave);
        });
    }

    // 초기 로드 실행
    if (targetId) await loadJournalData();
}
