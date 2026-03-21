import { categories, searchMethods, cautions } from './data.js';

export function renderCategories(onCategoryClick, selectedId) {
    const grid = document.getElementById('categories-grid');
    if (!grid) return;
    grid.innerHTML = categories.map(cat => `
        <div class="category-card glass card ${cat.id === selectedId ? 'active' : ''}" data-id="${cat.id}" 
             style="padding: 12px 20px; text-align: center; min-height: auto;">
            <h4 style="margin: 0; font-size: 0.95rem; font-weight: 500;">${cat.title}</h4>
        </div>
    `).join('');
    
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            onCategoryClick(card.dataset.id);
            renderCategories(onCategoryClick, card.dataset.id); 
        });
    });
}

export function renderStepsNav(currentStep, selectedTopic, onStepChange) {
    const steps = [
        { id: 0, title: "데이터 탐색", icon: "search" },
        { id: 1, title: "데이터 저장", icon: "download" },
        { id: 2, title: "데이터 관리", icon: "list" },
        { id: 3, title: "1단계: 문제 정의", icon: "database" },
        { id: 4, title: "2단계: 전처리", icon: "map" },
        { id: 5, title: "3단계: AI 분석", icon: "brain" },
        { id: 6, title: "4단계: 시각화", icon: "bar-chart" },
        { id: 7, title: "5단계: 정책 제안", icon: "file-text" },
    ];
    
    const navItems = document.getElementById('nav-items');
    if (!navItems) return;
    navItems.innerHTML = steps.map(step => `
        <div class="nav-item ${currentStep === step.id ? 'active' : ''}" 
             data-id="${step.id}">
            <i data-lucide="${step.icon}" size="18"></i>
            <span>${step.title}</span>
        </div>
    `).join('');
    if (window.lucide) lucide.createIcons();

    document.querySelectorAll('.nav-item').forEach(item => {
        item.onclick = () => {
            onStepChange(parseInt(item.dataset.id));
        };
    });
}

export function renderStepContent(stepId, state, onStepChange) {
    const canvas = document.getElementById('step-canvas');
    if (!canvas) return;
    let content = '';
    const topic = state.selectedTopic;

    // Steps 4+ require a selected topic (Step IDs 4, 5, 6, 7)
    if (!topic && stepId > 3) {
        content = `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 4rem; margin-bottom: 20px;">🔍</div>
                <h3 style="font-size: 1.5rem; margin-bottom: 10px;">프로젝트 주제를 먼저 선택해주세요!</h3>
                <p class="text-muted">왼쪽 메뉴의 [데이터 탐색] 단계에서 관심 있는 주제를 고르면<br>해당 주제에 맞춤화된 단계별 가이드와 코드 템플릿이 나타납니다.</p>
                <button class="btn-primary" style="margin-top: 30px;" onclick="window.changeStep(0)">데이터 탐색으로 가기</button>
            </div>
        `;
    } else {
        switch(stepId) {
            case 0:
                content = `<div style="text-align:center; padding: 40px;"><h2>데이터 탐색 단계입니다.</h2><p>왼쪽 메뉴를 이용하거나 홈으로 가세요.</p></div>`;
                break;
            case 1: // NEW: Data Saving
                content = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                        <div>
                            <h2>📥 데이터 저장 및 연동</h2>
                            <p class="text-muted" style="font-size: 0.9rem; margin-top: 5px;">포털에서 찾은 데이터의 메타정보와 파일을 시스템에 등록합니다.</p>
                        </div>
                    </div>
                    <div id="save-form-container" class="glass" style="padding: 30px; min-height: 400px; border-top: 3px solid var(--primary);">
                        <!-- The save instructions will be injected here by discovery.js -->
                    </div>
                `;
                const initialName = state.pendingDataName || '';
                setTimeout(() => {
                    import('./discovery.js').then(m => m.showSaveInstructions(initialName, state, window.onDataSelected));
                }, 50);
                break;
            case 2: // Old 1: Management
                content = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                        <h2>📋 데이터 관리</h2>
                        <span class="text-muted" style="font-size: 0.9rem;">수집한 데이터셋을 확인하고 관리할 수 있습니다.</span>
                    </div>
                    <div id="datasets-list-container" class="glass" style="padding: 20px; min-height: 300px;">
                        <div style="text-align: center; padding: 40px;">
                            <p class="text-muted">데이터를 불러오는 중입니다...</p>
                        </div>
                    </div>
                `;
                if (state.onLoadDatasets) {
                    setTimeout(() => state.onLoadDatasets(), 100);
                }
                break;
            case 3: // 1단계: 프로젝트 기획 (Step 1)
                content = '<div id="step-inner-content" style="min-height: 400px; padding: 20px;"></div>';
                setTimeout(async () => {
                    const canvasInner = document.getElementById('step-inner-content');
                    if (!canvasInner) return;
                    
                    canvasInner.innerHTML = '<div style="text-align: center; padding: 40px;"><p class="text-muted">연구용 데이터를 불러오는 중입니다...</p></div>';
                    
                    const { fetchAllResearchDatasets } = await import('./auth.js');
                    const { generateProblemDefinitionPrompt } = await import('./research_prompts.js');
                    
                    const { data: datasets, error } = await fetchAllResearchDatasets(state.user.student_id);
                    
                    if (error || !datasets || datasets.length === 0) {
                        canvasInner.innerHTML = `
                            <div style="text-align: center; padding: 50px 20px;">
                                <div style="font-size: 3rem; margin-bottom: 20px;">📋</div>
                                <h3 style="margin-bottom: 10px;">연구 활용으로 선택된 데이터가 없습니다.</h3>
                                <p class="text-muted">먼저 [데이터 관리] 단계에서 연구에 활용할 데이터셋들을<br>체크박스로 선택해 주세요.</p>
                                <button class="btn-secondary" style="margin-top: 20px;" onclick="window.changeStep(2)">데이터 관리로 가기</button>
                            </div>
                        `;
                        return;
                    }

                    canvasInner.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                            <h2>1단계: 문제 정의 및 가설 설정</h2>
                            <span class="tag" style="background: var(--primary-glow); padding: 5px 12px; border-radius: 20px; font-size: 0.8rem;">분석 준비 완료</span>
                        </div>
                        
                        <div class="glass" style="padding: 25px; border-left: 4px solid var(--primary); margin-bottom: 25px;">
                            <h4 style="color: var(--secondary); margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                                <i data-lucide="database" size="18"></i> 선택된 연구 데이터 (${datasets.length}건)
                            </h4>
                            <ul style="list-style: none; padding: 0; margin-bottom: 15px;">
                                ${datasets.map(ds => `
                                    <li style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 0.95rem;">
                                        <i data-lucide="check-circle" size="14" style="color: #10b981;"></i>
                                        <strong>${ds.data_name}</strong>
                                    </li>
                                `).join('')}
                            </ul>
                            <p style="font-size: 0.85rem; color: #64748b;">위 데이터들의 샘플과 메타정보를 분석하여 AI용 프롬프트를 생성합니다.</p>
                        </div>

                        <div class="glass" style="padding: 25px; margin-bottom: 25px; border-top: 2px solid var(--secondary);">
                            <h4 style="color: var(--secondary); margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                                <i data-lucide="lightbulb" size="18"></i> 연구자의 분석 관점 및 아이디어 (선택)
                            </h4>
                            <textarea id="researcher-opinion-text" placeholder="예: '청소년 자살률과 정신건강 인프라의 상관관계를 중심으로 분석하고 싶음', '약국 접근성이 낮은 지역의 특징을 도출하고 싶음' 등..." 
                                       style="width: 100%; height: 100px; background: #ffffff; border: 1px solid #cbd5e1; color: var(--text); padding: 15px; border-radius: 8px; font-size: 0.95rem; line-height: 1.5; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);"></textarea>
                            <p style="font-size: 0.8rem; color: #94a3b8; margin-top: 8px;">데이터에 대한 본인의 가설이나 특히 궁금한 점을 적어주시면 AI가 이를 반영하여 주제를 제안합니다.</p>
                        </div>

                        <div id="prompt-generator-section" style="text-align: center; padding: 30px; background: rgba(79, 70, 229, 0.05); border-radius: 12px; border: 1px dashed var(--primary);">
                            <button id="make-prompt-btn" class="btn-primary" style="padding: 12px 30px; font-weight: 600;">
                                <i data-lucide="sparkles" size="18" style="vertical-align: middle; margin-right: 5px;"></i> AI 분석용 프롬프트 생성하기
                            </button>
                            <p style="font-size: 0.8rem; color: #64748b; margin-top: 10px;">* 실시간 데이터 샘플링을 진행하므로 약 2~3초가 소요될 수 있습니다.</p>
                        </div>

                        <div id="ai-prompt-result" style="display: none; margin-top: 25px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <h4 style="margin: 0;">✨ 생성된 연구 가이드 프롬프트</h4>
                                <button id="copy-prompt-btn" class="btn-secondary" style="font-size: 0.75rem; padding: 5px 12px;">클립보드 복사</button>
                            </div>
                            <textarea id="ai-prompt-text" readonly style="width: 100%; height: 280px; background: #0f172a; color: #f8fafc; border: 1px solid var(--glass-border); border-radius: 8px; padding: 18px; font-family: 'Consolas', monospace; font-size: 0.9rem; line-height: 1.6; font-weight: 500;"></textarea>
                            <p style="font-size: 0.8rem; color: var(--primary); margin-top: 10px;">
                                <i data-lucide="info" size="14" style="vertical-align: middle;"></i> 생성된 내용을 복사하여 ChatGPT나 Claude 등 생성형 AI에게 질문해 보세요.
                            </p>
                        </div>
                    `;
                    
                    lucide.createIcons();

                    const makeBtn = document.getElementById('make-prompt-btn');
                    makeBtn.onclick = async () => {
                        const opinion = document.getElementById('researcher-opinion-text').value;
                        const originalHtml = makeBtn.innerHTML;
                        makeBtn.disabled = true;
                        makeBtn.innerHTML = '<i class="spinner-sm"></i> 프롬프트 생성 중...';
                        
                        const prompt = await generateProblemDefinitionPrompt(datasets, opinion);
                        
                        document.getElementById('prompt-generator-section').style.display = 'none';
                        const resultArea = document.getElementById('ai-prompt-result');
                        resultArea.style.display = 'block';
                        document.getElementById('ai-prompt-text').value = prompt;
                        lucide.createIcons();
                    };

                    const copyBtn = document.getElementById('copy-prompt-btn');
                    copyBtn.onclick = () => {
                        const text = document.getElementById('ai-prompt-text').value;
                        navigator.clipboard.writeText(text).then(() => {
                            copyBtn.innerText = '복사 완료!';
                            setTimeout(() => copyBtn.innerText = '클립보드 복사', 2000);
                        });
                    };
                }, 50);
                break;
            case 4: // Old 3: Step 2
                content = `<h2>2단계: 데이터 전처리</h2><div class="glass" style="padding:30px;"><p>데이터 정제 및 분석 준비 단계입니다.</p></div>`;
                break;
            case 5: // Old 4: Step 3
                content = `<h2>3단계: AI 데이터 분석</h2><div class="glass" style="padding:30px;"><p>패턴 탐색 및 예측 모델링 단계입니다.</p></div>`;
                break;
            case 6: // Old 5: Step 4
                content = `<h2>4단계: 시각화</h2><div class="glass" style="padding:30px;"><p>분석 데이터의 시각적 요약 단계입니다.</p></div>`;
                break;
            case 7: // Old 6: Step 5
                content = `<h2>5단계: 정책 및 인사이트 제안</h2><div class="glass" style="padding:30px;"><p>최종 제안서 작성 단계입니다.</p></div>`;
                break;
            default:
                content = `<h2>개발 준비 중인 단계입니다.</h2>`;
        }

        if (stepId >= 3) {
            content += `
                <div class="glass" style="margin-top: 40px; padding: 25px; border-top: 1px solid var(--glass-border);">
                    <h4 style="margin-bottom: 15px;">📝 연구 기록 및 메모</h4>
                    <textarea id="step-memo" placeholder="이 단계에서 찾아낸 데이터나 아이디어를 기록하세요..." 
                               style="width: 100%; height: 120px; background: #ffffff; border: 1px solid #cbd5e1; color: var(--text); padding: 15px; border-radius: 8px; margin-bottom: 15px; font-size: 0.95rem; line-height: 1.5; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);"></textarea>
                    <div style="text-align: right;">
                        <button id="save-memo-btn" class="btn-primary" style="font-size: 0.85rem; padding: 8px 20px;">기록 저장하기</button>
                    </div>
                </div>
            `;
        }
    }

    canvas.innerHTML = `
        <div style="display: flex; flex-direction: column; height: 100%;">
            <div style="flex: 1;">${content}</div>
            <div class="step-footer" style="margin-top: 30px; display: flex; justify-content: space-between;">
                <button class="btn-secondary" id="prev-step">이전 단계</button>
                <button class="btn-primary" id="next-step">${stepId === 7 ? '처음으로' : '다음 단계로'}</button>
            </div>
        </div>
    `;
    
    if (window.lucide) lucide.createIcons();
    
    const prevBtn = document.getElementById('prev-step');
    const nextBtn = document.getElementById('next-step');
    
    if (prevBtn) prevBtn.onclick = () => onStepChange(stepId - 1);
    if (nextBtn) nextBtn.onclick = () => onStepChange(stepId === 7 ? 0 : stepId + 1);

    const saveBtn = document.getElementById('save-memo-btn');
    if (saveBtn) {
        saveBtn.onclick = () => {
            const memo = document.getElementById('step-memo').value;
            state.onSaveRecord(stepId, memo);
        };
    }
}

export function renderTeacherDashboard(students, onReset) {
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
                        <td style="padding: 12px; text-align: right;">
                            <button class="btn-secondary reset-pin-btn" data-id="${s.student_id}" style="font-size: 0.8rem; padding: 5px 10px;">PIN 초기화(0000)</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    document.querySelectorAll('.reset-pin-btn').forEach(btn => {
        btn.onclick = () => onReset(btn.dataset.id);
    });
}
