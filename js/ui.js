import { categories, searchMethods, cautions } from './data.js';
import { supabaseClient } from './config.js';

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

export function renderStepsNav(currentStep, state, onStepChange) {
    const selectedTopic = state?.selectedTopic;
    const steps = [
        { id: 8, title: "대회 참가 신청", icon: "users" },
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
    navItems.innerHTML = steps.map(step => {
        const isActive = currentStep === step.id;
        const isComp = step.id === 8;
        let styleStr = '';
        if (isComp) {
            styleStr = isActive 
                ? 'background: var(--accent); color: white;' 
                : 'background: #fff1f2; color: var(--accent); border: 1px solid #fecaca; margin-bottom: 12px; font-weight: 700;';
        }
        return `
            <div class="nav-item ${isActive ? 'active' : ''}" 
                 data-id="${step.id}" 
                 ${styleStr ? `style="${styleStr}"` : ''}>
                <i data-lucide="${step.icon}" size="18"></i>
                <span>${step.title}</span>
            </div>
        `;
    }).join('');
    if (window.lucide) lucide.createIcons();

    document.querySelectorAll('.nav-item').forEach(item => {
        item.onclick = () => {
            const stepId = parseInt(item.dataset.id);
            // reset selected research when navigating to step 4 via menu
            if (stepId === 4) state.selectedResearchId = null;
            onStepChange(stepId);
        };
    });
}

export function renderStepContent(stepId, state, onStepChange) {
    const canvas = document.getElementById('step-canvas');
    if (!canvas) return;
    let content = '';
    const topic = state.selectedTopic;

    // Steps 3+ require a selected topic (Step IDs 5, 6, 7)
    if (!topic && stepId >= 5 && stepId <= 7) {
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
                                <div style="display: flex; gap: 8px;">
                                    <button id="save-step1-btn" class="btn-primary" style="font-size: 0.75rem; padding: 5px 12px; background: #059669; border-color: #059669;">기록 저장하기</button>
                                    <button id="copy-prompt-btn" class="btn-secondary" style="font-size: 0.75rem; padding: 5px 12px;">클립보드 복사</button>
                                </div>
                            </div>
                            <textarea id="ai-prompt-text" readonly style="width: 100%; height: 280px; background: #0f172a; color: #f8fafc; border: 1px solid var(--glass-border); border-radius: 8px; padding: 18px; font-family: 'Consolas', monospace; font-size: 0.9rem; line-height: 1.6; font-weight: 500;"></textarea>
                            <p style="font-size: 0.8rem; color: var(--primary); margin-top: 10px;">
                                <i data-lucide="info" size="14" style="vertical-align: middle;"></i> 생성된 내용을 복사하여 ChatGPT나 Claude 등 생성형 AI에게 질문해 보세요.
                            </p>
                        </div>
                    `;
                    
                    lucide.createIcons();

                    const makeBtn = document.getElementById('make-prompt-btn');
                    if (makeBtn) {
                        makeBtn.onclick = async () => {
                            const opinionField = document.getElementById('researcher-opinion-text');
                            const opinion = opinionField ? opinionField.value : '';
                            const originalHtml = makeBtn.innerHTML;
                            makeBtn.disabled = true;
                            makeBtn.innerHTML = '<i class="spinner-sm"></i> 프롬프트 생성 중...';
                            
                            const prompt = await generateProblemDefinitionPrompt(datasets, opinion);
                            
                            const promptSection = document.getElementById('prompt-generator-section');
                            if (promptSection) promptSection.style.display = 'none';

                            const resultArea = document.getElementById('ai-prompt-result');
                            if (resultArea) {
                                resultArea.style.display = 'block';
                                const promptText = document.getElementById('ai-prompt-text');
                                if (promptText) promptText.value = prompt;
                            }
                            lucide.createIcons();
                        };
                    }

                    const copyBtn = document.getElementById('copy-prompt-btn');
                    if (copyBtn) {
                        copyBtn.onclick = () => {
                            const textElem = document.getElementById('ai-prompt-text');
                            const text = textElem ? textElem.value : '';
                            navigator.clipboard.writeText(text).then(() => {
                                const originalText = copyBtn.innerText;
                                copyBtn.innerText = '복사 완료!';
                                setTimeout(() => copyBtn.innerText = originalText, 2000);
                            });
                        };
                    }

                    const saveBtn = document.getElementById('save-step1-btn');
                    if (saveBtn) {
                        saveBtn.onclick = async () => {
                            const promptArea = document.getElementById('ai-prompt-text');
                            const opinionArea = document.getElementById('researcher-opinion-text');
                            const prompt = promptArea ? promptArea.value : '';
                            const opinion = opinionArea ? opinionArea.value : '';
                            
                            if (!prompt) return alert('생성된 프롬프트가 없습니다.');
                            
                            const originalHtml = saveBtn.innerHTML;
                            saveBtn.disabled = true;
                            saveBtn.innerHTML = '<i class="spinner-sm"></i> 저장 중...';
                            
                            try {
                                const { onSaveRecord } = await import('./research.js');
                                await onSaveRecord(3, { answer: prompt, opinion: opinion }, state);
                            } catch (err) {
                                alert('저장 중 오류가 발생했습니다: ' + err.message);
                            } finally {
                                saveBtn.disabled = false;
                                saveBtn.innerHTML = originalHtml;
                            }
                        };
                    }
                }, 50);
                break;
            case 4: // 2단계: 데이터 전처리 (Step 2)
                content = '<div id="step-inner-content" style="min-height: 400px; padding: 20px;"></div>';
                setTimeout(async () => {
                    const canvasInner = document.getElementById('step-inner-content');
                    if (!canvasInner) return;
                    
                    canvasInner.innerHTML = '<div style="text-align: center; padding: 40px;"><p class="text-muted">1단계 연구 기록을 불러오는 중입니다...</p></div>';
                    
                    const { fetchActivityLogs } = await import('./auth.js');
                    console.log('Step 2: Fetching logs for student:', state.user.student_id);
                    const { data: logs, error } = await fetchActivityLogs(state.user.student_id, 3);
                    console.log('Step 2: Fetched logs:', logs);
                    
                    if (error || !logs || logs.length === 0) {
                        canvasInner.innerHTML = `
                            <div style="text-align: center; padding: 50px 20px;">
                                <div style="font-size: 3rem; margin-bottom: 20px;">📝</div>
                                <h3 style="margin-bottom: 10px;">1단계에서 저장된 연구 주제가 없습니다.</h3>
                                <p class="text-muted">먼저 [1단계: 문제 정의]에서 AI 프롬프트를 생성하고<br>답변 내용을 저장해 주세요.</p>
                                <button class="btn-secondary" style="margin-top: 20px;" onclick="window.changeStep(3)">1단계로 가기</button>
                            </div>
                        `;
                        return;
                    }

                        console.log('Step 2: Checking selectedResearchId:', state.selectedResearchId);
                        if (state.selectedResearchId) {
                            const selectedLog = logs.find(l => String(l.id) === String(state.selectedResearchId));
                            console.log('Step 2: Found selectedLog:', selectedLog);
                            if (selectedLog) {
                                let data;
                                try {
                                    data = JSON.parse(selectedLog.content);
                                } catch(e) {
                                    data = { answer: selectedLog.content };
                                }
                                
                                canvasInner.innerHTML = `
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                                        <div>
                                            <h2 style="display: flex; align-items: center; gap: 10px;">
                                                <i data-lucide="check-circle-2" style="color: var(--primary);"></i> 2단계: 데이터 전처리
                                            </h2>
                                            <p class="text-muted">선택하신 연구 주제의 상세 내용을 확인하고 전처리를 준비합니다.</p>
                                        </div>
                                        <button id="reset-selection-btn" class="btn-secondary" style="font-size: 0.85rem;">다른 주제 선택</button>
                                    </div>

                                    <div class="glass" style="padding: 25px; margin-bottom: 25px; border-left: 4px solid var(--primary);">
                                        <div style="margin-bottom: 20px;">
                                            <h4 style="color: var(--secondary); margin-bottom: 10px; font-size: 1rem;">📝 연구자의 분석 관점 및 아이디어</h4>
                                            <div style="padding: 15px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.95rem; line-height: 1.5; color: var(--text);">
                                                ${data.opinion || '의견 없음'}
                                            </div>
                                        </div>

                                        <div style="margin-bottom: 20px;">
                                            <h4 style="color: var(--secondary); margin-bottom: 10px; font-size: 1rem;">🤖 생성된 연구 가이드 프롬프트</h4>
                                            <div style="padding: 15px; background: #0f172a; color: #f8fafc; border-radius: 8px; font-family: 'Consolas', monospace; font-size: 0.85rem; line-height: 1.4; max-height: 150px; overflow-y: auto;">
                                               ${data.prompt || '프롬프트 내역 없음'}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 style="color: var(--secondary); margin-bottom: 10px; font-size: 1rem;">✨ 인공지능 답변 기록 (상세 원문)</h4>
                                            <div style="padding: 20px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 1rem; line-height: 1.7; color: var(--text); min-height: 200px; white-space: pre-wrap;">${data.answer}</div>
                                        </div>
                                    </div>

                                    <div style="text-align: center; padding: 40px; border: 2px dashed #cbd5e1; border-radius: 15px; background: rgba(255,255,255,0.4); margin-bottom: 25px;">
                                        <h3 style="margin-bottom: 10px; color: var(--secondary);">🛠️ 데이터 전처리 가이드</h3>
                                        <p class="text-muted" style="margin-bottom: 20px;">이 연구를 수행하기 위한 Python(Pandas) 전처리 코드를 생성합니다.</p>
                                        <button id="generate-colab-prompt-btn" class="btn-primary" style="background: #059669; border-color: #059669; padding: 12px 25px;">
                                            <i data-lucide="code" style="vertical-align: middle; margin-right: 8px;"></i> 구글 코랩(Colab) 전처리 프롬프트 생성
                                        </button>
                                    </div>

                                    <div id="colab-prompt-result" style="display: none; background: #0f172a; border-radius: 12px; padding: 25px; margin-bottom: 25px; position: relative;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                            <h4 style="color: #f8fafc; margin: 0; font-size: 1rem;">💻 구글 코랩용 AI 요청 프롬프트</h4>
                                            <button id="copy-colab-btn" class="btn-secondary" style="font-size: 0.75rem; padding: 5px 12px; background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); color: white;">복사하기</button>
                                        </div>
                                        <textarea id="colab-prompt-text" readonly style="width: 100%; height: 350px; background: rgba(0,0,0,0.3); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 15px; font-family: 'Consolas', monospace; font-size: 0.85rem; line-height: 1.6;"></textarea>
                                        <div style="margin-top: 15px; color: #94a3b8; font-size: 0.8rem;">
                                            <i data-lucide="info" size="14" style="vertical-align: middle; margin-right: 5px;"></i> 이 내용을 복사하여 ChatGPT 등에 입력하면 전처리 코드를 얻을 수 있습니다.
                                        </div>
                                    </div>

                                    <!-- Download Center -->
                                    <div id="research-download-center" style="display: none; background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 25px; margin-bottom: 25px; box-shadow: var(--shadow-sm);">
                                        <h3 style="margin: 0 0 20px 0; color: var(--secondary); font-size: 1.15rem;">
                                            <i data-lucide="download-cloud" style="vertical-align: middle; margin-right: 8px;"></i> 분석 데이터 파일 다운로드
                                        </h3>
                                        <div id="research-files-list" style="display: grid; gap: 12px;">
                                            <!-- Download items appear here -->
                                        </div>
                                        <p style="font-size: 0.8rem; color: #64748b; margin-top: 15px;">
                                            <i data-lucide="alert-circle" size="14" style="vertical-align: middle;"></i> 다운로드한 파일을 구글 코랩(Colab)에 그대로 업로드하여 사용하세요.
                                        </p>
                                    </div>
                                `;
                                lucide.createIcons();

                                // Event Handlers
                                document.getElementById('reset-selection-btn').onclick = () => {
                                    state.selectedResearchId = null;
                                    onStepChange(stepId);
                                };

                                const colabBtn = document.getElementById('generate-colab-prompt-btn');
                                if (colabBtn) {
                                    colabBtn.onclick = async () => {
                                        colabBtn.disabled = true;
                                        colabBtn.innerHTML = '<i class="spinner-sm"></i> 프롬프트 생성 중...';
                                        
                                        const { fetchAllResearchDatasets } = await import('./auth.js');
                                        const { generateColabPreprocessingPrompt } = await import('./research_prompts.js');
                                        
                                        try {
                                            const { data: allDatasets, error: fetchErr } = await fetchAllResearchDatasets(state.user.student_id);
                                            if (fetchErr) throw fetchErr;
                                            
                                            // [Smart Filter] Only show datasets mentioned in the AI research guide
                                            const researchText = data.answer || "";
                                            const datasets = (allDatasets || []).filter(ds => {
                                                const baseName = ds.data_name.replace(/\.(csv|xlsx|xls|json)$/i, "").trim();
                                                const lowerText = researchText.toLowerCase();
                                                // Check if AI mentioned the filename or the name without extension
                                                return lowerText.includes(baseName.toLowerCase()) || 
                                                       lowerText.includes(ds.data_name.toLowerCase());
                                            });

                                            console.log('Step 2: Filtered datasets for download:', datasets);
                                            
                                            const colabPrompt = await generateColabPreprocessingPrompt(selectedLog, datasets);
                                            
                                            const resultArea = document.getElementById('colab-prompt-result');
                                            const promptTextArea = document.getElementById('colab-prompt-text');
                                            
                                            resultArea.style.display = 'block';
                                            promptTextArea.value = colabPrompt;
                                            resultArea.scrollIntoView({ behavior: 'smooth' });

                                            // Render Downloads
                                            const downloadCenter = document.getElementById('research-download-center');
                                            const filesList = document.getElementById('research-files-list');
                                            if (downloadCenter && filesList) {
                                                downloadCenter.style.display = 'block';
                                                
                                                if (datasets.length === 0) {
                                                    filesList.innerHTML = `
                                                        <div style="text-align: center; padding: 20px; color: #64748b; font-size: 0.9rem; background: #f1f5f9; border-radius: 8px;">
                                                            내려받을 수 있는 데이터셋이 없습니다. 먼저 0단계 또는 데이터를 저장해 주세요.
                                                        </div>
                                                    `;
                                                } else {
                                                    filesList.innerHTML = datasets.map(ds => {
                                                        const meta = ds.metadata || {};
                                                        const sizeKb = meta.size_kb || ds.size_kb;
                                                         const sizeStr = sizeKb ? (sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB (${Number(sizeKb).toLocaleString()} KB)` : `${Number(sizeKb).toLocaleString()} KB`) : '';
                                                        const rowCount = meta.row_count;
                                                        const rowStr = rowCount != null ? `${Number(rowCount).toLocaleString()}행` : '';
                                                        const infoStr = [rowStr, sizeStr].filter(Boolean).join(' · ');
                                                        let fileName = ds.data_name.trim();
                                                        if (!fileName.toLowerCase().endsWith('.csv')) fileName += '.csv';
                                                        
                                                        // Ensure we handle both portal URLs and storage paths
                                                        let downloadUrl = ds.file_url;
                                                        if (downloadUrl && !downloadUrl.startsWith('http')) {
                                                            let storagePath = downloadUrl;
                                                            if (storagePath.startsWith('datasets/')) {
                                                                storagePath = storagePath.replace('datasets/', '');
                                                            }
                                                            const { data: { publicUrl } } = supabaseClient.storage.from('datasets').getPublicUrl(storagePath);
                                                            // Append ?download=filename per Supabase official docs.
                                                            // This forces the server to set Content-Disposition header with our Korean name.
                                                            // This bypasses the browser's cross-origin restriction on the HTML 'download' attribute.
                                                            downloadUrl = `${publicUrl}?download=${encodeURIComponent(fileName)}`;
                                                        }
                                                        
                                                        console.log(`Download Link for ${fileName}:`, downloadUrl);

                                                        return `
                                                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                                                                <div style="display: flex; align-items: center; gap: 12px;">
                                                                    <i data-lucide="file-spreadsheet" style="color: #059669;"></i>
                                                                    <div>
                                                                        <div style="font-weight: 600; font-size: 0.95rem; color: #1e293b;">${fileName}</div>
                                                                        <div style="font-size: 0.75rem; color: #64748b;">${infoStr || '정보 없음'}</div>
                                                                    </div>
                                                                </div>
                                                                <a href="${downloadUrl}" class="btn-secondary" style="font-size: 0.8rem; padding: 6px 15px; background: white; text-decoration: none; display: flex; align-items: center; gap: 5px; color: #475569; border: 1px solid #cbd5e1;">
                                                                    <i data-lucide="download" size="14"></i> 다운로드
                                                                </a>
                                                            </div>
                                                        `;
                                                    }).join('');
                                                }
                                            }
                                            
                                            lucide.createIcons();
                                        } catch (err) {
                                            alert('프롬프트 생성 중 오류가 발생했습니다: ' + err.message);
                                        } finally {
                                            colabBtn.disabled = false;
                                            colabBtn.innerHTML = '<i data-lucide="code" style="vertical-align: middle; margin-right: 8px;"></i> 구글 코랩(Colab) 전처리 프롬프트 생성';
                                            lucide.createIcons();
                                        }
                                    };
                                }

                                const copyColabBtn = document.getElementById('copy-colab-btn');
                                if (copyColabBtn) {
                                    copyColabBtn.onclick = () => {
                                        const text = document.getElementById('colab-prompt-text').value;
                                        navigator.clipboard.writeText(text).then(() => {
                                            copyColabBtn.innerText = '복사 완료!';
                                            setTimeout(() => copyColabBtn.innerText = '복사하기', 2000);
                                        });
                                    };
                                }

                                return;
                            }
                        }

                        canvasInner.innerHTML = `
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                                <div>
                                    <h2>2단계: 데이터 전처리 및 정제</h2>
                                    <p class="text-muted" style="font-size: 0.9rem; margin-top: 5px;">선택한 연구 주제에 맞춰 데이터를 분석 가능한 형태로 가공합니다.</p>
                                </div>
                            </div>

                            <div style="margin-bottom: 20px;">
                                <h4 style="margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                                    <i data-lucide="list-checks" size="18"></i> 분석할 연구 주제 선택
                                </h4>
                                <div style="display: grid; gap: 15px;">
                                    ${logs.map(log => {
                                        console.log('Step 2: Rendering Log Object:', log, 'Current Student:', state.user.student_id);
                                        let data;
                                        try {
                                            data = JSON.parse(log.content);
                                        } catch(e) {
                                            data = { answer: log.content };
                                        }
                                        const dateStr = new Date(log.created_at).toLocaleString();
                                        const isSelected = state.selectedResearchId === log.id;
                                        
                                        return `
                                            <div class="glass card research-log-card ${isSelected ? 'active' : ''}" 
                                                 data-id="${log.id}" 
                                                 style="padding: 20px; cursor: pointer; border-left: 4px solid ${isSelected ? 'var(--primary)' : 'var(--glass-border)'}; transition: all 0.2s;">
                                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                                                    <span style="font-size: 0.8rem; color: var(--primary); font-weight: 500;">
                                                        <i data-lucide="clock" size="12" style="vertical-align: middle;"></i> ${dateStr}
                                                    </span>
                                                    ${isSelected ? '<span class="tag" style="background: var(--primary); color: white; scale: 0.8;">선택됨</span>' : ''}
                                                </div>
                                                <div style="margin-bottom: 12px;">
                                                    <strong style="display: block; font-size: 0.9rem; color: var(--secondary); margin-bottom: 5px;">분석 관점:</strong>
                                                    <p style="font-size: 0.95rem; line-height: 1.4; color: var(--text); margin:0;">
                                                        ${data.opinion || '의견 없음'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <strong style="display: block; font-size: 0.9rem; color: var(--secondary); margin-bottom: 5px;">AI 제안 요약:</strong>
                                                    <p style="font-size: 0.9rem; color: #64748b; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5; margin:0;">
                                                        ${data.answer}
                                                    </p>
                                                </div>
                                                <div style="text-align: right; margin-top: 15px;">
                                                    <button class="btn-secondary delete-research-btn" data-id="${log.id}" style="font-size: 0.8rem; padding: 6px 15px; background: #fee2e2; color: #dc2626; border-color: #fecaca; margin-right: 8px;">삭제</button>
                                                    <button class="btn-primary select-research-btn" data-id="${log.id}" style="font-size: 0.8rem; padding: 6px 15px;">
                                                        ${isSelected ? '현재 선택됨' : '선택하기'}
                                                    </button>
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    
                    lucide.createIcons();

                    document.querySelectorAll('.delete-research-btn').forEach(btn => {
                        btn.onclick = async (e) => {
                            e.stopPropagation();
                            if (!confirm('정말로 이 연구 기록을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.')) return;
                            
                            const id = btn.dataset.id;
                            const { deleteActivityLog } = await import('./auth.js');
                            const { data, error, status, statusText } = await deleteActivityLog(id, state.user.student_id);
                            
                            if (!error) {
                                if (data && data.length > 0) {
                                    console.log('Step 2: Successfully deleted log:', data[0]);
                                    alert('연구 기록이 삭제되었습니다.');
                                } else {
                                    console.warn('Step 2: Delete completed but no rows returned. Status:', status, statusText);
                                    alert(`삭제할 기록을 찾지 못했거나 권한이 없습니다.\n(상태: ${status} ${statusText})`);
                                }
                                if (String(state.selectedResearchId) === String(id)) {
                                    state.selectedResearchId = null;
                                }
                                onStepChange(stepId);
                            } else {
                                console.error('Step 2: Delete failed:', error);
                                alert('삭제 실패: ' + error.message);
                            }
                        };
                    });

                    document.querySelectorAll('.select-research-btn').forEach(btn => {
                        btn.onclick = (e) => {
                            e.stopPropagation();
                            const id = btn.dataset.id;
                            console.log('Step 2: Selecting research (BTN):', id);
                            state.selectedResearchId = id;
                            onStepChange(stepId);
                        };
                    });

                    document.querySelectorAll('.research-log-card').forEach(card => {
                        card.onclick = () => {
                            const id = card.dataset.id;
                            console.log('Step 2: Selecting research (CARD):', id);
                            state.selectedResearchId = id;
                            onStepChange(stepId);
                        };
                    });
                }, 50);
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
            case 8: // Competition Application
                content = '<div id="competition-root" style="min-height: 400px;"></div>';
                setTimeout(async () => {
                    const root = document.getElementById('competition-root');
                    if (!root) return;
                    
                    root.innerHTML = '<div style="text-align: center; padding: 40px;"><p class="text-muted">신청 내역을 확인하는 중입니다...</p></div>';
                    
                    const { fetchCompetitionApplicationByStudent, submitCompetitionApplication, updateCompetitionApplication, deleteCompetitionApplication } = await import('./auth.js');
                    const { data: existingApp } = await fetchCompetitionApplicationByStudent(state.user.student_id);
                    
                    const renderApplyMode = (initialData = null) => {
                        const isEdit = !!initialData;
                        const initialTeam = initialData ? initialData.team_data : [];
                        
                        root.innerHTML = `
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                                <div>
                                    <h2>🏆 대회 참가 신청 ${isEdit ? '(수정)' : ''}</h2>
                                    <p class="text-muted" style="margin-top: 5px;">최대 3명까지 한 팀으로 신청할 수 있습니다. 각 학생의 정확한 학번, 이름, 이메일 주소(~~@goedu.kr)를 입력해주세요.</p>
                                </div>
                                ${isEdit ? `<button id="cancel-edit-btn" class="btn-secondary" style="font-size: 0.85rem;">취소</button>` : ''}
                            </div>
                            <div class="glass" style="padding: 30px; border-left: 4px solid var(--accent);">
                                <form id="competition-form">
                                    <div id="team-members-container" style="display: flex; flex-direction: column; gap: 20px;"></div>
                                    <div style="margin-top: 20px; display: flex; gap: 10px;">
                                        <button type="button" id="add-member-btn" class="btn-secondary" style="font-size: 0.9rem; padding: 8px 15px;">
                                            <i data-lucide="plus" style="vertical-align: middle; margin-right: 5px;"></i> 팀원 추가
                                        </button>
                                        <button type="submit" id="submit-comp-btn" class="btn-primary" style="font-size: 0.9rem; padding: 8px 30px;" disabled>
                                            ${isEdit ? '수정 내용 저장' : '신청서 제출'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        `;
                        
                        let rows = [];
                        const container = document.getElementById('team-members-container');
                        const addBtn = document.getElementById('add-member-btn');
                        const submitBtn = document.getElementById('submit-comp-btn');
                        const cancelBtn = document.getElementById('cancel-edit-btn');
                        
                        const validateForm = () => {
                            // Keep the button enabled so we can show alerts on click
                            submitBtn.disabled = false;
                            
                            rows.forEach(row => {
                                const emailVal = document.getElementById('comp-email-' + row.id).value.trim();
                                const warning = document.getElementById('email-warning-' + row.id);
                                if (warning) {
                                    if (emailVal && !emailVal.endsWith('@goedu.kr')) {
                                        warning.style.display = 'block';
                                    } else {
                                        warning.style.display = 'none';
                                    }
                                }
                            });
                        };

                        const createMemberRow = (isFirst = false, preData = null) => {
                            const rowId = Math.random().toString(36).substr(2, 9);
                            rows.push({ id: rowId });
                            const div = document.createElement('div');
                            div.className = 'member-row';
                            div.style = 'padding: 20px; background: rgba(255, 255, 255, 0.5); border: 1px solid #e2e8f0; border-radius: 8px;';
                            div.innerHTML = `
                                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                                    <h4 style="color: var(--secondary); margin: 0; font-size: 0.95rem;">학생 ${rows.length} ${isFirst ? '(대표)' : ''}</h4>
                                    ${!isFirst ? `<button type="button" class="btn-remove-member" style="background: none; border: none; color: var(--accent); cursor: pointer; font-size: 0.8rem; font-weight: 600;">삭제</button>` : ''}
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 15px;">
                                    <div>
                                        <label style="font-size: 0.8rem; font-weight: 600; color: #475569; display: block; margin-bottom: 5px;">학번</label>
                                        <input type="text" id="comp-id-${rowId}" placeholder="학번" value="${preData?.student_id || (isFirst ? state.user?.student_id : '')}" ${isFirst ? 'readonly' : ''} style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px;">
                                    </div>
                                    <div>
                                        <label style="font-size: 0.8rem; font-weight: 600; color: #475569; display: block; margin-bottom: 5px;">이름</label>
                                        <input type="text" id="comp-name-${rowId}" placeholder="이름" value="${preData?.name || (isFirst ? state.user?.name : '')}" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px;">
                                    </div>
                                    <div>
                                        <label style="font-size: 0.8rem; font-weight: 600; color: #475569; display: block; margin-bottom: 5px;">이메일</label>
                                        <input type="email" id="comp-email-${rowId}" placeholder="~~@goedu.kr" value="${preData?.email || ''}" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px;">
                                        <small id="email-warning-${rowId}" style="color: var(--accent); display: none; margin-top: 4px;">@goedu.kr 이메일이 필요합니다.</small>
                                    </div>
                                </div>
                            `;
                            div.querySelectorAll('input').forEach(inp => inp.addEventListener('input', validateForm));
                            if (!isFirst) {
                                div.querySelector('.btn-remove-member').onclick = () => {
                                    div.remove();
                                    rows = rows.filter(r => r.id !== rowId);
                                    addBtn.style.display = 'inline-block';
                                    validateForm();
                                };
                            }
                            return div;
                        };

                        if (isEdit && initialTeam.length > 0) {
                            initialTeam.forEach((m, i) => container.appendChild(createMemberRow(i === 0, m)));
                            if (initialTeam.length >= 3) addBtn.style.display = 'none';
                        } else {
                            container.appendChild(createMemberRow(true));
                        }
                        
                        addBtn.onclick = () => {
                            if (rows.length < 3) {
                                container.appendChild(createMemberRow(false));
                                if (rows.length >= 3) addBtn.style.display = 'none';
                                validateForm();
                            }
                        };
                        
                        if (cancelBtn) cancelBtn.onclick = () => onStepChange(stepId);
                        
                        document.getElementById('competition-form').onsubmit = async (e) => {
                            e.preventDefault();
                            
                            // Check for missing data
                            let errors = [];
                            const teamData = rows.map((r, i) => {
                                const stId = document.getElementById('comp-id-' + r.id).value.trim();
                                const name = document.getElementById('comp-name-' + r.id).value.trim();
                                const email = document.getElementById('comp-email-' + r.id).value.trim();
                                
                                if (!stId) errors.push(`학생 ${i + 1}의 학번을 입력해주세요.`);
                                if (!name) errors.push(`학생 ${i + 1}의 이름을 입력해주세요.`);
                                if (!email) errors.push(`학생 ${i + 1}의 이메일을 입력해주세요.`);
                                else if (!email.endsWith('@goedu.kr')) errors.push(`학생 ${i + 1}의 이메일은 반드시 @goedu.kr 로 끝나야 합니다.`);
                                
                                return { student_id: stId, name, email };
                            });

                            if (errors.length > 0) {
                                alert('신청서를 제출할 수 없습니다.\n\n' + errors.join('\n'));
                                return;
                            }

                            submitBtn.disabled = true;
                            submitBtn.innerHTML = '<i class="spinner-sm"></i> 처리 중...';
                            
                            try {
                                const { error } = isEdit 
                                    ? await updateCompetitionApplication(initialData.id, teamData) 
                                    : await submitCompetitionApplication(teamData, state.user.student_id);
                                if (error) throw error;
                                alert(isEdit ? '신청 내용이 수정되었습니다.' : '대회 참가 신청이 완료되었습니다!');
                                onStepChange(stepId);
                            } catch (err) {
                                alert('오류: ' + err.message);
                                submitBtn.disabled = false;
                                submitBtn.innerHTML = isEdit ? '수정 내용 저장' : '신청서 제출';
                            }
                        };
                        
                        validateForm();
                        if (window.lucide) lucide.createIcons();
                    };

                    const renderViewMode = (app) => {
                        const team = app.team_data || [];
                        const isCompleted = app.status === 'completed';
                        
                        root.innerHTML = `
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                                <div>
                                    <h2>${isCompleted ? '🔒 접수 완료 (수정 불가)' : '✅ 대회 참가 신청 완료'}</h2>
                                    <p class="text-muted" style="margin-top: 5px;">
                                        ${isCompleted 
                                            ? '<span style="color: var(--secondary); font-weight: 700;">선생님께서 접수를 완료 처리하셨습니다. 이제 수정이나 삭제가 불가능합니다.</span>' 
                                            : '현재 신청하신 팀 정보입니다. 수정이나 삭제를 하려면 아래 버튼을 이용하세요.'}
                                    </p>
                                </div>
                                <div style="display: flex; gap: 10px;">
                                    <button id="edit-app-btn" class="btn-primary" style="font-size: 0.85rem; padding: 8px 20px; ${isCompleted ? 'opacity: 0.5; cursor: not-allowed;' : ''}" ${isCompleted ? 'disabled' : ''}>수정하기</button>
                                    <button id="delete-app-btn" class="btn-secondary" style="font-size: 0.85rem; padding: 8px 20px; color: var(--accent); border-color: var(--accent); ${isCompleted ? 'opacity: 0.5; cursor: not-allowed;' : ''}" ${isCompleted ? 'disabled' : ''}>신청 취소</button>
                                </div>
                            </div>
                            <div class="glass" style="padding: 30px; border-top: 4px solid ${isCompleted ? 'var(--secondary)' : 'var(--accent)'}; opacity: ${isCompleted ? '0.8' : '1'};">
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                                    ${team.map((m, i) => `
                                        <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; position: relative; overflow: hidden;">
                                            <div style="position: absolute; top:0; left:0; width:4px; height:100%; background: ${i === 0 ? (isCompleted ? 'var(--secondary)' : 'var(--accent)') : '#cbd5e1'};"></div>
                                            <h4 style="margin: 0 0 15px 0; color: var(--secondary); font-size: 0.9rem;">학생 ${i + 1} ${i === 0 ? '(대표)' : ''}</h4>
                                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                                <div style="font-weight: 700; font-size: 1.1rem;">${m.name}</div>
                                                <div style="color: #64748b; font-size: 0.85rem;">학번: ${m.student_id}</div>
                                                <div style="color: #64748b; font-size: 0.85rem; display: flex; align-items: center; gap: 5px;">
                                                    <i data-lucide="mail" size="14"></i> ${m.email}
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                                <div style="margin-top: 25px; padding-top: 20px; border-top: 1px dashed #e2e8f0; font-size: 0.85rem; color: #94a3b8; text-align: right; display: flex; justify-content: space-between; align-items: center;">
                                    <span>상태: <strong style="color: ${isCompleted ? 'var(--secondary)' : 'var(--accent)'}">${isCompleted ? '접수 완료 (잠김)' : '대기 중'}</strong></span>
                                    <span>신청 일시: ${new Date(app.created_at).toLocaleString()}</span>
                                </div>
                            </div>
                        `;
                        
                        if (!isCompleted) {
                            document.getElementById('edit-app-btn').onclick = () => renderApplyMode(app);
                            document.getElementById('delete-app-btn').onclick = async () => {
                                if (!confirm('신청을 정말로 취소하시겠습니까? 신청 내역이 즉시 삭제됩니다.')) return;
                                const { error } = await deleteCompetitionApplication(app.id);
                                if (error) alert('삭제 실패: ' + error.message);
                                else {
                                    alert('신청이 취소되었습니다.');
                                    onStepChange(stepId);
                                }
                            };
                        }
                        if (window.lucide) lucide.createIcons();
                    };

                    if (existingApp) renderViewMode(existingApp);
                    else renderApplyMode();
                }, 50);
                break;
            default:
                content = `<h2>개발 준비 중인 단계입니다.</h2>`;
        }

        if (stepId >= 3 && stepId !== 8) {
            const isStep1 = stepId === 3;
            content += `
                <div class="glass" style="margin-top: 40px; padding: 25px; border-top: 1px solid var(--glass-border);">
                    <h4 style="margin-bottom: 15px;">${isStep1 ? '✨ 인공지능 답변 기록' : '📝 연구 기록 및 메모'}</h4>
                    <textarea id="step-memo" placeholder="${isStep1 ? 'AI가 제안한 주제 중 마음에 드는 내용이나 보완할 점을 기록하세요...' : '이 단계에서 찾아낸 데이터나 아이디어를 기록하세요...'}" 
                               style="width: 100%; height: 120px; background: #ffffff; border: 1px solid #cbd5e1; color: var(--text); padding: 15px; border-radius: 8px; margin-bottom: 15px; font-size: 0.95rem; line-height: 1.5; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);"></textarea>
                    <div style="text-align: right;">
                        <button id="save-memo-btn" class="btn-primary" style="font-size: 0.85rem; padding: 8px 30px; font-weight: 600;">
                            ${isStep1 ? '저장하기' : '기록 저장하기'}
                        </button>
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
    
    // Determine the next and prev step IDs based on the visual order
    const orderedStepIds = [8, 0, 1, 2, 3, 4, 5, 6, 7];
    const currentIndex = orderedStepIds.indexOf(stepId);
    
    if (prevBtn) {
        if (currentIndex > 0) {
            prevBtn.onclick = () => onStepChange(orderedStepIds[currentIndex - 1]);
        } else {
            prevBtn.style.display = 'none'; // hide previous button on first step
        }
    }
    
    if (nextBtn) {
        if (currentIndex < orderedStepIds.length - 1) {
            nextBtn.onclick = () => onStepChange(orderedStepIds[currentIndex + 1]);
        } else {
            nextBtn.onclick = () => onStepChange(orderedStepIds[0]);
        }
    }

    const saveBtn = document.getElementById('save-memo-btn');
    if (saveBtn) {
        saveBtn.onclick = () => {
            const memo = document.getElementById('step-memo').value;
            if (stepId === 3) {
                // For Step 1, collect all AI integration fields
                const opinion = document.getElementById('researcher-opinion-text')?.value || '';
                const prompt = document.getElementById('ai-prompt-text')?.value || '';
                state.onSaveRecord(stepId, {
                    opinion,
                    prompt,
                    answer: memo
                });
            } else {
                state.onSaveRecord(stepId, memo);
            }
        };
    }
}

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

/**
 * Teacher View: Render ALL datasets from ALL students
 */
export function renderTeacherDataManagement(datasets, onToggleShare, onToggleResearch) {
    const container = document.getElementById('teacher-dataset-list');
    if (!container) return;
    
    if (!datasets || datasets.length === 0) {
        container.innerHTML = '<p class="text-muted" style="text-align:center; padding: 40px;">수집된 데이터셋이 없습니다.</p>';
        return;
    }

    container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
                <tr style="text-align: left; border-bottom: 2px solid var(--glass-border);">
                    <th style="padding: 12px;">데이터셋 이름</th>
                    <th style="padding: 12px;">작성 학생</th>
                    <th style="padding: 12px; text-align: center;">연구 활용</th>
                    <th style="padding: 12px; text-align: center;">공유</th>
                </tr>
            </thead>
            <tbody>
                ${datasets.map(ds => {
                    const ownerName = ds.students?.name || (ds.student_id ? `${ds.student_id}` : '탈퇴한 사용자');
                    return `
                    <tr class="clickable-row" data-id="${ds.id}" style="border-bottom: 1px solid var(--glass-border); cursor: pointer;">
                        <td style="padding: 12px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <i data-lucide="file-spreadsheet" size="18" style="color: var(--primary);"></i>
                                <strong>${ds.data_name}</strong>
                            </div>
                        </td>
                        <td style="padding: 12px; font-size: 0.85rem; color: #4b5563;">${ownerName}</td>
                        <td style="padding: 12px; text-align: center;">
                            <input type="checkbox" class="teacher-research-toggle" data-id="${ds.id}" ${ds.is_research_use ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                        </td>
                        <td style="padding: 12px; text-align: center;">
                            <label class="switch">
                                <input type="checkbox" class="teacher-share-toggle" data-id="${ds.id}" ${ds.is_shared ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                        </td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    // Add row click listener (for details)
    container.querySelectorAll('.clickable-row').forEach(row => {
        row.onclick = (e) => {
            // Don't trigger if clicking toggle/switch
            if (e.target.closest('input') || e.target.closest('.switch')) return;
            const ds = datasets.find(d => String(d.id) === row.dataset.id);
            if (ds) openDatasetModal(ds);
        };
    });

    // Add event listeners for toggles
    container.querySelectorAll('.teacher-research-toggle').forEach(chk => {
        chk.onchange = (e) => onToggleResearch(chk.dataset.id, chk.checked);
    });
    container.querySelectorAll('.teacher-share-toggle').forEach(chk => {
        chk.onchange = (e) => onToggleShare(chk.dataset.id, chk.checked);
    });
    
    if (window.lucide) window.lucide.createIcons();
}

/**
 * Common: Open dataset details modal with metadata and preview
 */
export async function openDatasetModal(dataset) {
    const modal = document.getElementById('dataset-modal');
    if (!modal) return;
    
    const nameEl = document.getElementById('modal-data-name');
    const bodyInner = document.getElementById('modal-body-inner');
    const closeBtn = document.getElementById('close-modal');

    if (nameEl) nameEl.innerText = dataset.data_name;
    
    // Core Meta Mapping
    const rawMeta = dataset.metadata || {};
    const getVal = (path, obj = rawMeta) => {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    // Pairs for 2x2 grid (Label-Value-Label-Value)
    const metaPairs = [
        [
            { label: '제공 기관', value: getVal('creator.name') || getVal('provider') || '-' },
            { label: '분류 체계', value: getVal('additionalType') || '-' }
        ],
        [
            { label: '관리부서', value: getVal('creator.contactPoint.contactType') || '-' },
            { label: '문의처', value: getVal('creator.contactPoint.telephone') || '-' }
        ],
        [
            { label: '업데이트 주기', value: getVal('datasetTimeInterval') || getVal('cycle') || '-' },
            { label: '보유근거', value: getVal('source') || '-' }
        ],
        [
            { label: '등록일', value: getVal('dateCreated') || '-' },
            { label: '수정일', value: getVal('dateModified') || '-' }
        ]
    ];

    const desc = getVal('description');
    const keywords = getVal('keywords');
    const format = getVal('encodingFormat') || dataset.data_name.split('.').pop().toUpperCase();
    const sizeVal = Number(dataset.size_kb);
    const size = sizeVal ? (sizeVal >= 1024 ? `${(sizeVal / 1024).toFixed(1)} MB (${sizeVal.toLocaleString()} KB)` : `${sizeVal.toLocaleString()} KB`) : '-';

    if (bodyInner) {
        bodyInner.innerHTML = `
            <table class="portal-meta-table">
                <tbody>
                    <tr>
                        <th class="portal-label">데이터명</th>
                        <td class="portal-value" colspan="3" style="font-weight: 800; color: var(--primary); font-size: 1.1rem;">
                            ${dataset.data_name}
                        </td>
                    </tr>
                    ${metaPairs.map(pair => `
                        <tr>
                            <th class="portal-label">${pair[0].label}</th>
                            <td class="portal-value">${pair[0].value}</td>
                            <th class="portal-label">${pair[1].label}</th>
                            <td class="portal-value">${pair[1].value}</td>
                        </tr>
                    `).join('')}
                    <tr>
                        <th class="portal-label">확장자</th>
                        <td class="portal-value">${format}</td>
                        <th class="portal-label">파일 크기</th>
                        <td class="portal-value">${size}</td>
                    </tr>
                    <tr>
                        <th class="portal-label">데이터 설명</th>
                        <td class="portal-value portal-value-full" colspan="3">
                            ${desc || '설명이 표시되지 않았습니다.'}
                        </td>
                    </tr>
                    ${keywords ? `
                    <tr>
                        <th class="portal-label">키워드</th>
                        <td class="portal-value" colspan="3">
                            <div class="portal-keywords-wrapper">
                                ${(typeof keywords === 'string' ? keywords.split(',') : keywords).map(kw => 
                                    `<span class="badge-portal"># ${kw.trim()}</span>`
                                ).join('')}
                            </div>
                        </td>
                    </tr>
                    ` : ''}
                    <tr>
                        <th class="portal-label">원본 출처</th>
                        <td class="portal-value" colspan="3">
                            ${(() => {
                                const url = getVal('url');
                                const sourceLinks = rawMeta.source_links || [];
                                if (url && url !== '#') {
                                    return `<a href="${url}" target="_blank" style="color: var(--primary); font-weight: bold;">[원본 사이트 바로가기]</a>`;
                                } else if (sourceLinks.length > 0) {
                                    return sourceLinks.map((link, idx) => 
                                        `<a href="${link}" target="_blank" style="color: var(--primary); font-weight: bold; margin-right: 15px;">[출처 ${idx + 1}]</a>`
                                    ).join('');
                                }
                                return '-';
                            })()}
                        </td>
                    </tr>
                </tbody>
            </table>
            <div class="preview-table-card">
                <div class="preview-table-header">
                    📄 데이터 미리보기 (상위 20개 행)
                    <span class="badge-outline" style="background: #fee2e2; color: #b91c1c; border: none; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">CSV 전용</span>
                </div>
                <div id="modal-data-preview" class="data-preview-table-container">
                    <div style="padding: 40px; text-align: center; color: var(--text-muted);">
                        데이터를 읽어오는 중입니다...
                    </div>
                </div>
            </div>
        `;
    }

    modal.style.display = 'flex';
    
    // Preview Loading Logic
    const previewEl = document.getElementById('modal-data-preview');
    if (previewEl) {
        if (dataset.file_url) {
            try {
                const previewData = await fetchDatasetPreview(dataset.file_url, dataset.data_name);
                renderPreviewTable(previewData, previewEl);
            } catch (err) {
                previewEl.innerHTML = `<div style="padding: 30px; text-align: center; color: #ef4444;">❌ 데이터를 불러오지 못했습니다: ${err.message}</div>`;
            }
        } else {
            previewEl.innerHTML = `<div style="padding: 30px; text-align: center; color: var(--text-muted);">연동된 파일이 없습니다.</div>`;
        }
    }

    // Close logic
    if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
}

/**
 * Fetches and parses CSV or Excel data
 */
export async function fetchDatasetPreview(fileUrl, fileName = '') {
    let finalUrl = fileUrl;
    if (!fileUrl.startsWith('http')) {
        const { data } = supabaseClient.storage.from('datasets').getPublicUrl(fileUrl);
        finalUrl = data.publicUrl;
    }

    const isExcel = fileName.toLowerCase().endsWith('.xlsx') || fileName.toLowerCase().endsWith('.xls') || 
                  fileUrl.toLowerCase().endsWith('.xlsx') || fileUrl.toLowerCase().endsWith('.xls');

    try {
        const response = await fetch(finalUrl);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        const buffer = await response.arrayBuffer();
        
        if (isExcel) {
            // Handle Excel via SheetJS
            const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
            
            if (jsonData.length > 0) {
                const fields = jsonData[0]; // Header row
                const dataRows = jsonData.slice(1, 21).map(row => {
                    const obj = {};
                    fields.forEach((f, i) => obj[f] = row[i]);
                    return obj;
                });
                return { data: dataRows, fields: fields };
            } else {
                throw new Error('엑셀 파일에 데이터가 없습니다.');
            }
        } else {
            // Handle CSV via PapaParse
            let text;
            try {
                const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
                text = utf8Decoder.decode(buffer);
            } catch (e) {
                const euckrDecoder = new TextDecoder('euc-kr');
                text = euckrDecoder.decode(buffer);
            }

            return new Promise((resolve, reject) => {
                Papa.parse(text, {
                    header: true,
                    preview: 20,
                    skipEmptyLines: true,
                    complete: (results) => {
                        if (results.data && results.data.length > 0) {
                            resolve({ data: results.data, fields: results.meta.fields });
                        } else {
                            reject(new Error('데이터가 비어있거나 읽을 수 없는 형식입니다.'));
                        }
                    },
                    error: (err) => reject(new Error(err.message || '파일 파킹 실패'))
                });
            });
        }
    } catch (err) {
        throw new Error(`파일을 가져오는 중 오류 발생: ${err.message}`);
    }
}

/**
 * Renders the parsed data into a stylish table
 */
function renderPreviewTable(previewResult, container) {
    const { data, fields } = previewResult;
    const headers = fields || (data.length > 0 ? Object.keys(data[0]) : []);

    if (headers.length === 0) {
        container.innerHTML = '<div style="padding: 30px; text-align: center;">표시할 데이터 컬럼이 없습니다.</div>';
        return;
    }

    container.innerHTML = `
        <table class="preview-table">
            <thead>
                <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${data.map(row => `
                    <tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>
                `).join('')}
            </tbody>
        </table>
    `;
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

/** Renders the student progress monitoring view */
export function renderStudentProgress(students, onViewDetail) {
    const container = document.getElementById('teacher-progress-list');
    if (!container) return;

    if (!students || students.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;"><p class="text-muted">가입된 학생이 없습니다.</p></div>';
        return;
    }

    // step_id 3=Step1, 4=Step2, 5=Step3, 6=Step4, 7=Step5
    const STEPS = [
        { id: -1, label: '미시작',   color: '#94a3b8', bg: '#f1f5f9' },
        { id: 3,  label: '1단계 완료', color: '#6366f1', bg: '#ede9fe' },
        { id: 4,  label: '2단계 완료', color: '#0ea5e9', bg: '#e0f2fe' },
        { id: 5,  label: '3단계 완료', color: '#10b981', bg: '#dcfce7' },
        { id: 6,  label: '4단계 완료', color: '#f59e0b', bg: '#fef9c3' },
        { id: 7,  label: '5단계 완료', color: '#ef4444', bg: '#fee2e2' },
    ];

    const getStepInfo = (maxStep) => {
        const match = [...STEPS].reverse().find(s => maxStep >= s.id);
        return match || STEPS[0];
    };

    const getProgressPct = (maxStep) => {
        if (maxStep < 3) return 0;
        // Steps go 3,4,5,6,7 => map to 1-5 out of 5
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

/** Shows a modal with detailed student data */
export async function showStudentDetailModal(studentName, detail) {
    const modal = document.getElementById('student-detail-modal');
    const title = document.getElementById('student-detail-title');
    const body  = document.getElementById('student-detail-body');
    const close = document.getElementById('close-student-modal');

    title.innerText = `🔍 ${studentName} 학생 상세 기록`;

    const { logs, datasets } = detail;
    const step1Logs = logs.filter(l => l.step_id === 3);

    // Datasets section
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

    // Research logs section (step 1)
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

/**
 * Teacher View: Renders all Step 1 (Problem Definition) logs
 */
export function renderTeacherProblemDefinitions(logs, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!logs || logs.length === 0) {
        container.innerHTML = '<div class="text-muted" style="text-align:center; padding: 40px;">아직 작성된 1단계 기록이 없습니다.</div>';
        return;
    }

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px;">
            ${logs.map(log => {
                let data = { answer: '', opinion: '' };
                try {
                    data = JSON.parse(log.content);
                } catch (e) {
                    data.answer = log.content;
                }

                return `
                <div class="glass card clickable-card step1-log-card" data-id="${log.id}" 
                     style="padding: 20px; transition: all 0.2s; cursor: pointer; border-left: 4px solid #f59e0b;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                        <span style="font-size: 0.8rem; color: var(--primary); font-weight: 500;">
                            <i data-lucide="clock" size="12" style="vertical-align: middle;"></i> ${new Date(log.created_at).toLocaleString()}
                        </span>
                        <span class="badge" style="background: #fef3c7; color: #92400e; font-size: 0.7rem;">${log.student_name}</span>
                    </div>
                    
                    <div style="margin-bottom: 12px;">
                        <strong style="display: block; font-size: 0.9rem; color: var(--secondary); margin-bottom: 5px;">분석 관점:</strong>
                        <p style="font-size: 0.95rem; line-height: 1.4; color: var(--text); margin:0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                            ${data.opinion || '의견 없음'}
                        </p>
                    </div>

                    <div>
                        <strong style="display: block; font-size: 0.9rem; color: var(--secondary); margin-bottom: 5px;">AI 제안 요약:</strong>
                        <p style="font-size: 0.9rem; color: #64748b; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5; margin:0;">
                            ${data.answer.replace(/#|<br>|---/g, '')}
                        </p>
                    </div>
                    
                    <div style="text-align: right; margin-top: 15px;">
                        <button class="btn-primary" style="font-size: 0.8rem; padding: 6px 15px;">상세보기</button>
                    </div>
                </div>
                `;
            }).join('')}
        </div>
    `;

    // Click listener for details
    container.querySelectorAll('.step1-log-card').forEach(card => {
        card.onclick = () => {
            const log = logs.find(l => String(l.id) === card.dataset.id);
            if (log) showProblemDefinitionDetailModal(log);
        };
    });
}

/**
 * Shows the full detail of a student's Step 1 record
 */
export function showProblemDefinitionDetailModal(log) {
    const modal = document.getElementById('step1-detail-modal');
    const studentEl = document.getElementById('step1-modal-student');
    const titleEl = document.getElementById('step1-modal-title');
    const bodyEl = document.getElementById('step1-modal-body');
    const closeBtn = document.getElementById('close-step1-modal');

    studentEl.innerText = `${log.student_name} 학생 | ${new Date(log.created_at).toLocaleString()}`;
    
    let data = { answer: '', opinion: '' };
    try {
        data = JSON.parse(log.content);
    } catch (e) {
        data.answer = log.content;
    }

    titleEl.innerText = data.opinion || '연구 주제 상세 보기';

    bodyEl.innerHTML = `
        <div style="margin-bottom: 30px;">
            <h4 style="color: var(--primary); margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="message-square" size="18"></i> 연구자의 핵심 의견 (Student Opinion)
            </h4>
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 0.95rem; line-height: 1.6; color: #1e293b; font-weight: 500;">
                ${data.opinion || '<span class="text-muted">입력된 의견이 없습니다.</span>'}
            </div>
        </div>

        <div style="border-top: 1px dashed #cbd5e1; padding-top: 30px;">
            <h4 style="color: #f59e0b; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="bot" size="18"></i> AI 제안 내용 (AI Response)
            </h4>
            <div style="font-size: 0.95rem; line-height: 1.7; color: #334155; white-space: pre-wrap;">
                ${data.answer}
            </div>
        </div>
    `;

    if (window.lucide) lucide.createIcons();
    modal.style.display = 'flex';

    closeBtn.onclick = () => modal.style.display = 'none';
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
}

/**
 * Teacher View: Renders the initial list of all student Step 1 logs for Step 2 Preprocessing monitoring
 */
export function renderTeacherPreprocessing(logs, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!logs || logs.length === 0) {
        container.innerHTML = '<div class="text-muted" style="text-align:center; padding: 40px;">아직 작성된 1단계 기록이 없습니다.</div>';
        return;
    }

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px;">
            ${logs.map(log => {
                let data = { answer: '', opinion: '' };
                try {
                    data = JSON.parse(log.content);
                } catch (e) {
                    data.answer = log.content;
                }

                return `
                <div class="glass card clickable-card teacher-step2-card" data-id="${log.id}" 
                     style="padding: 20px; transition: all 0.2s; cursor: pointer; border-left: 4px solid #0ea5e9;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                        <span style="font-size: 0.8rem; color: var(--primary); font-weight: 500;">
                            <i data-lucide="clock" size="12" style="vertical-align: middle;"></i> ${new Date(log.created_at).toLocaleString()}
                        </span>
                        <span class="badge" style="background: #e0f2fe; color: #0369a1; font-size: 0.7rem;">${log.student_name}</span>
                    </div>
                    
                    <div style="margin-bottom: 12px;">
                        <strong style="display: block; font-size: 0.85rem; color: var(--secondary); margin-bottom: 5px;">연구 주제:</strong>
                        <p style="font-size: 0.95rem; font-weight: 600; line-height: 1.4; color: var(--text); margin:0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                            ${data.opinion || '연구 주제'}
                        </p>
                    </div>

                    <div style="text-align: right; margin-top: 15px;">
                        <button class="btn-primary" style="font-size: 0.8rem; padding: 6px 15px; background: #0ea5e9; border-color: #0ea5e9;">전처리 가이드 보기</button>
                    </div>
                </div>
                `;
            }).join('')}
        </div>
    `;

    if (window.lucide) lucide.createIcons();

    // Click listener to drill down
    container.querySelectorAll('.teacher-step2-card').forEach(card => {
        card.onclick = () => {
            const log = logs.find(l => String(l.id) === card.dataset.id);
            if (log) renderTeacherPreprocessingDetail(log, containerId, logs);
        };
    });
}

/**
 * Teacher View: Renders the detailed Step 2 (Preprocessing) dashboard for a specific student log
 */
export async function renderTeacherPreprocessingDetail(selectedLog, containerId, allLogs) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let data;
    try {
        data = JSON.parse(selectedLog.content);
    } catch(e) {
        data = { answer: selectedLog.content };
    }

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
            <div>
                <h2 style="display: flex; align-items: center; gap: 10px; font-size: 1.25rem;">
                    <i data-lucide="user" style="color: var(--primary);"></i> ${selectedLog.student_name} 학생의 2단계 전처리
                </h2>
                <p class="text-muted" style="font-size: 0.9rem;">선택된 연구 주제에 최적화된 전처리 가이드를 확인합니다.</p>
            </div>
            <button id="back-to-step2-list-btn" class="btn-secondary" style="font-size: 0.85rem;">전체 목록으로</button>
        </div>

        <div class="glass" style="padding: 25px; margin-bottom: 25px; border-left: 4px solid #0ea5e9; background: white;">
            <div style="margin-bottom: 20px;">
                <h4 style="color: var(--secondary); margin-bottom: 15px; font-size: 1rem; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="lightbulb" size="18"></i> 연구자의 핵심 의견
                </h4>
                <div style="padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.95rem; line-height: 1.5; color: var(--text);">
                    ${data.opinion || '의견 없음'}
                </div>
            </div>

            <div>
                <h4 style="color: var(--secondary); margin-bottom: 15px; font-size: 1rem; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="bot" size="18"></i> AI 제안 내용 요약
                </h4>
                <div style="padding: 20px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 1rem; line-height: 1.7; color: var(--text); min-height: 150px; white-space: pre-wrap;">${data.answer}</div>
            </div>
        </div>

        <div style="text-align: center; padding: 40px; border: 2px dashed #cbd5e1; border-radius: 15px; background: rgba(14, 165, 233, 0.05); margin-bottom: 25px;">
            <h3 style="margin-bottom: 10px; color: var(--secondary);">🛠️ 데이터 전처리 가이드 생성</h3>
            <p class="text-muted" style="margin-bottom: 20px;">학생과 동일하게 Python(Pandas) 전처리 코드를 생성해 볼 수 있습니다.</p>
            <button id="teacher-generate-colab-btn" class="btn-primary" style="background: #059669; border-color: #059669; padding: 12px 25px;">
                <i data-lucide="code" style="vertical-align: middle; margin-right: 8px;"></i> 구글 코랩(Colab) 전처리 프롬프트 생성 (테스트)
            </button>
        </div>

        <div id="teacher-colab-result" style="display: none; background: #0f172a; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="color: #f8fafc; margin: 0; font-size: 1rem;">💻 생성된 구글 코랩용 프롬프트</h4>
                <button id="teacher-copy-colab-btn" class="btn-secondary" style="font-size: 0.75rem; padding: 5px 12px; background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); color: white;">복사하기</button>
            </div>
            <textarea id="teacher-colab-text" readonly style="width: 100%; height: 300px; background: rgba(0,0,0,0.3); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 15px; font-family: 'Consolas', monospace; font-size: 0.85rem; line-height: 1.6;"></textarea>
        </div>

        <div id="teacher-download-center" style="display: none; background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 25px; box-shadow: var(--shadow-sm);">
            <h3 style="margin: 0 0 20px 0; color: var(--secondary); font-size: 1.15rem;">
                <i data-lucide="download-cloud" style="vertical-align: middle; margin-right: 8px;"></i> 학생이 가공해야 할 원본 데이터
            </h3>
            <div id="teacher-files-list" style="display: grid; gap: 12px;"></div>
        </div>
    `;

    lucide.createIcons();

    // Back listener
    document.getElementById('back-to-step2-list-btn').onclick = () => renderTeacherPreprocessing(allLogs, containerId);

    // Generator logic
    const genBtn = document.getElementById('teacher-generate-colab-btn');
    if (genBtn) {
        genBtn.onclick = async () => {
            genBtn.disabled = true;
            genBtn.innerHTML = '<i class="spinner-sm"></i> 가이드 생성 중...';
            
            const { fetchAllResearchDatasets } = await import('./auth.js');
            const { generateColabPreprocessingPrompt } = await import('./research_prompts.js');
            
            try {
                // Fetch datasets for THIS SPECIFIC student
                const { data: allDatasets, error: fetchErr } = await fetchAllResearchDatasets(selectedLog.student_id);
                if (fetchErr) throw fetchErr;
                
                const researchText = data.answer || "";
                const datasets = (allDatasets || []).filter(ds => {
                    const baseName = ds.data_name.replace(/\.(csv|xlsx|xls|json)$/i, "").trim();
                    const lowerText = researchText.toLowerCase();
                    return lowerText.includes(baseName.toLowerCase()) || 
                           lowerText.includes(ds.data_name.toLowerCase());
                });

                const colabPrompt = await generateColabPreprocessingPrompt(selectedLog, datasets);
                
                const resultArea = document.getElementById('teacher-colab-result');
                const promptTextArea = document.getElementById('teacher-colab-text');
                resultArea.style.display = 'block';
                promptTextArea.value = colabPrompt;

                // Render Downloads
                const downloadCenter = document.getElementById('teacher-download-center');
                const filesList = document.getElementById('teacher-files-list');
                if (downloadCenter && filesList) {
                    downloadCenter.style.display = 'block';
                    if (datasets.length === 0) {
                        filesList.innerHTML = '<div style="text-align: center; padding: 20px; color: #64748b;">(이 연구를 위해 선택된 데이터셋이 없습니다.)</div>';
                    } else {
                        filesList.innerHTML = datasets.map(ds => {
                            let fileName = ds.data_name.trim();
                            if (!fileName.toLowerCase().endsWith('.csv')) fileName += '.csv';
                            return `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <i data-lucide="file-spreadsheet" style="color: #059669;"></i>
                                        <div style="font-weight: 600; font-size: 0.95rem; color: #1e293b;">${fileName}</div>
                                    </div>
                                    <button class="btn-secondary" disabled style="font-size: 0.75rem; padding: 4px 10px; opacity: 0.6;">교사용 미리보기 전용</button>
                                </div>
                            `;
                        }).join('');
                    }
                    lucide.createIcons();
                }
            } catch (err) {
                alert('가이드 생성 중 오류: ' + err.message);
            } finally {
                genBtn.disabled = false;
                genBtn.innerHTML = '<i data-lucide="code" style="vertical-align: middle; margin-right: 8px;"></i> 구글 코랩(Colab) 전처리 프롬프트 생성 (테스트)';
                lucide.createIcons();
            }
        };
    }

    // Copy listener
    const copyBtn = document.getElementById('teacher-copy-colab-btn');
    if (copyBtn) {
        copyBtn.onclick = () => {
            const text = document.getElementById('teacher-colab-text').value;
            navigator.clipboard.writeText(text).then(() => {
                const originalText = copyBtn.innerText;
                copyBtn.innerText = '복사 완료!';
                setTimeout(() => copyBtn.innerText = originalText, 2000);
            });
        };
    }
}

/**
 * Teacher View: Renders all competition applications
 */
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

    // Add status toggle events
    container.querySelectorAll('.btn-status-toggle').forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.id;
            const currentStatus = btn.dataset.status;
            const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
            
            if (!confirm(`신청 상태를 [${newStatus === 'completed' ? '접수 완료' : '대기 중'}]으로 변경하시겠습니까?`)) return;
            
            btn.disabled = true;
            btn.innerText = '처리 중...';
            
            const { updateApplicationStatus } = await import('./auth.js');
            const { error } = await updateApplicationStatus(id, newStatus);
            
            if (error) {
                alert('상태 변경 실패: ' + error.message);
                btn.disabled = false;
                btn.innerText = currentStatus === 'completed' ? '접수 취소하기' : '접수 완료하기';
            } else {
                // Refresh the entire teacher view
                const { fetchAllCompetitionApplications } = await import('./auth.js');
                const { data: updatedData } = await fetchAllCompetitionApplications();
                renderTeacherCompetitionApplications(updatedData, containerId);
            }
        };
    });

    if (window.lucide) lucide.createIcons();
}
