import { categories } from './data.js';

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
        { id: 0, title: "1단계: 데이터 탐색", icon: "search" },
        { id: 9, title: "1.5단계: 주제 탐색", icon: "compass" },
        { id: 1, title: "2단계: 데이터 저장", icon: "download" },
        { id: 2, title: "3단계: 데이터 관리", icon: "list" },
        { id: 3, title: "4단계: 문제 정의", icon: "database" },
        { id: 4, title: "5단계: 전처리", icon: "map" },
        { id: 5, title: "6단계: AI 분석", icon: "brain" },
        { id: 6, title: "7단계: 시각화", icon: "bar-chart" },
        { id: 7, title: "8단계: 정책 제안", icon: "file-text" },
    ];

    const isMobile = window.innerWidth <= 768;
    const finalSteps = isMobile ? steps.filter(s => s.id === 8) : steps;

    const navItems = document.getElementById('nav-items');
    if (!navItems) return;
    navItems.innerHTML = finalSteps.map(step => {
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
