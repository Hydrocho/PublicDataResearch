import { categories, searchMethods, cautions } from './data.js';

export function renderCategories(onCategoryClick, selectedId) {
    const grid = document.getElementById('categories-grid');
    grid.innerHTML = categories.map(cat => `
        <div class="category-card glass card ${cat.id === selectedId ? 'active' : ''}" data-id="${cat.id}">
            <i data-lucide="${cat.icon}"></i>
            <h3>${cat.title}</h3>
        </div>
    `).join('');
    lucide.createIcons();
    
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            onCategoryClick(card.dataset.id);
            renderCategories(onCategoryClick, card.dataset.id); // Re-render to update highlight
        });
    });
}

export function renderStepsNav(currentStep, selectedTopic, onStepChange) {
    const steps = [
        { id: 0, title: "데이터 탐색", icon: "search" },
        { id: 1, title: "문제 정의 & 가설", icon: "database" },
        { id: 2, title: "데이터 전처리", icon: "map" },
        { id: 3, title: "AI 분석", icon: "brain" },
        { id: 4, title: "데이터 시각화", icon: "bar-chart" },
        { id: 5, title: "정책 제안", icon: "file-text" },
    ];
    
    const navItems = document.getElementById('nav-items');
    navItems.innerHTML = steps.map(step => `
        <div class="nav-item ${currentStep === step.id ? 'active' : ''}" 
             data-id="${step.id}">
            <i data-lucide="${step.icon}" size="18"></i>
            <span>${step.title}</span>
        </div>
    `).join('');
    lucide.createIcons();

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            onStepChange(parseInt(item.dataset.id));
        });
    });
}

export function renderStepContent(stepId, state, onStepChange) {
    const canvas = document.getElementById('step-canvas');
    let content = '';
    const topic = state.selectedTopic;

    if (!topic && stepId > 0) {
        content = `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 4rem; margin-bottom: 20px;">🔍</div>
                <h3 style="font-size: 1.5rem; margin-bottom: 10px;">프로젝트 주제를 먼저 선택해주세요!</h3>
                <p class="text-muted">왼쪽 메뉴의 [아이디어 탐색] 단계에서 관심 있는 주제를 고르면<br>해당 주제에 맞춤화된 단계별 가이드와 코드 템플릿이 나타납니다.</p>
                <button class="btn-primary" style="margin-top: 30px;" onclick="location.reload()">아이디어 탐색으로 가기</button>
            </div>
        `;
    } else {
        switch(stepId) {
            case 1:
                content = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <h2>1단계: 문제 정의 및 가설 설정</h2>
                    <span class="tag" style="background: var(--primary-glow); padding: 5px 12px; border-radius: 20px; font-size: 0.8rem;">${topic ? topic.cat.title : '분야'}</span>
                </div>
                <div class="glass" style="padding: 25px; border-left: 4px solid var(--primary); margin-bottom: 20px;">
                    <h4 style="color: var(--secondary); margin-bottom: 15px;">📥 선택한 데이터셋 및 연동 가이드</h4>
                    <p style="font-size: 1.1rem; font-weight: 500; margin-bottom: 15px;">${topic ? topic.dataInfo.name : '아직 선택된 데이터가 없습니다.'}</p>
                    
                    <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                        <button onclick="window.open('${topic ? topic.dataInfo.url : '#'}', '_blank')" class="btn-secondary" style="font-size: 0.8rem; flex: 1;">데이터 상세페이지/다운로드 바로가기</button>
                    </div>

                    <div class="glass" style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <span style="font-size: 0.75rem; color: var(--text-muted);">🐍 Python (Pandas) 로딩 코드</span>
                            <button onclick="navigator.clipboard.writeText('dataset = pd.read_csv(\\'파일_경로.csv\\', encoding=\\'cp949\\')\\nprint(dataset.head())'); alert('코드가 복사되었습니다! Colab에 붙여넣으세요.');" 
                                    style="background: none; border: none; color: var(--primary); cursor: pointer; font-size: 0.75rem;">코드 복사</button>
                        </div>
                        <pre style="color: #a5b4fc; font-size: 0.8rem; overflow-x: auto;">dataset = pd.read_csv('파일_경로.csv', encoding='cp949')
print(dataset.head())</pre>
                        <p style="font-size: 0.7rem; color: #94a3b8; margin-top: 10px;">* 공공데이터포털에서 다운로드 받은 파일을 Colab에 업로드한 후 위 코드를 실행하세요.</p>
                    </div>
                </div>

                <div class="glass" style="padding: 25px; background: rgba(79, 70, 229, 0.1);">
                    <p>📋 <strong>가이드:</strong> 위의 데이터를 분석하여 해결하고 싶은 '사회 문제'를 정의하고, '가설(만약 ~한다면 어떻게 될 것이다)'을 세워보세요.</p>
                </div>
            `;
                break;
            case 2:
                content = `
                    <h2>2단계: 데이터 전처리</h2>
                    <div class="glass" style="padding: 30px;">
                        <pre style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; font-family: monospace; color: #a5b4fc;">
    import pandas as pd
    df = pd.read_csv('data.csv')
    df = df.fillna(0)
                        </pre>
                    </div>
                `;
                break;
            case 3:
                content = `<h2>3단계: AI 분석</h2><div class="glass" style="padding:30px;"><p>패턴 찾기(Clustering) 및 미래 예측(Prediction)을 통해 인사이트를 도출합니다.</p></div>`;
                break;
            case 4:
                content = `<h2>4단계: 데이터 시각화</h2><div class="glass" style="padding:30px;"><p>Seaborn과 Folium을 활용하여 데이터의 특징을 시각적으로 표현합니다.</p></div>`;
                break;
            case 5:
                content = `<h2>5단계: 정책 제안</h2><div class="glass" style="padding:30px;"><p>분석 결과를 바탕으로 구체적인 해결 방안을 피칭합니다.</p></div>`;
                break;
            default:
                content = `<h2>${stepId}단계 구현 중</h2>`;
        }
        
        // Add Memo Area
        content += `
            <div class="glass" style="margin-top: 40px; padding: 25px; border-top: 1px solid var(--glass-border);">
                <h4 style="margin-bottom: 15px;">📝 연구 기록 및 메모</h4>
                <textarea id="step-memo" placeholder="이 단계에서 찾아낸 데이터나 아이디어를 기록하세요..." 
                          style="width: 100%; height: 100px; background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); color: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;"></textarea>
                <div style="text-align: right;">
                    <button id="save-memo-btn" class="btn-primary" style="font-size: 0.85rem; padding: 8px 20px;">기록 저장하기</button>
                </div>
            </div>
        `;
    }

    canvas.innerHTML = `
        <div style="flex: 1;">${content}</div>
        <div class="step-footer">
            <button class="btn-secondary" id="prev-step">이전 단계</button>
            <button class="btn-primary" id="next-step">${stepId === 5 ? '처음으로' : '다음 단계로'}</button>
        </div>
    `;
    lucide.createIcons();
    
    document.getElementById('prev-step').onclick = () => onStepChange(stepId - 1);
    document.getElementById('next-step').onclick = () => onStepChange(stepId === 5 ? 0 : stepId + 1);

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
