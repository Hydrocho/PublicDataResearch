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
    const steps = [
        { id: 8, title: "대회 참가 신청", icon: "users", group: "HOME" },
        { id: 0, title: "연구 프로젝트 안내", icon: "info", group: "준비 및 탐색", stepNum: "0" },
        { id: 9, title: "데이터 탐색", icon: "compass", group: "준비 및 탐색", stepNum: "1" },
        { id: 1, title: "데이터 저장", icon: "download", group: "데이터 분석", stepNum: "2" },
        { id: 2, title: "데이터 관리", icon: "list", group: "데이터 분석", stepNum: "3" },
        { id: 3, title: "연구 일지", icon: "file-text", group: "데이터 분석", stepNum: "4" },
        { id: 11, title: "작업 파일 공유", icon: "share-2", group: "결과 공유", stepNum: "5" },
        { id: 12, title: "추천 사이트 공유", icon: "external-link", group: "결과 공유", stepNum: "6" },
    ];

    const isMobile = window.innerWidth <= 768;
    const finalSteps = isMobile ? steps.filter(s => s.id === 8) : steps;

    const navItems = document.getElementById('nav-items');
    if (!navItems) return;

    let html = '';
    let currentGroup = '';

    finalSteps.forEach(step => {
        if (step.group && step.group !== currentGroup) {
            currentGroup = step.group;
            if (!isMobile) {
                html += `<div class="nav-section-title">${currentGroup}</div>`;
            }
        }

        const isActive = currentStep === step.id;
        const isComp = step.id === 8;
        let styleStr = '';
        if (isComp) {
            styleStr = isActive
                ? 'background: white; color: var(--accent); border: 1px solid var(--accent);'
                : 'background: #fff1f2; color: var(--accent); border: 1px solid #fecaca; margin-bottom: 12px; font-weight: 700;';
        }

        html += `
            <div class="nav-item ${isActive ? 'active' : ''}"
                 data-id="${step.id}"
                 ${styleStr ? `style="${styleStr}"` : ''}>
                <i data-lucide="${step.icon}" size="18"></i>
                <div style="display:flex;flex-direction:column;line-height:1.2;">
                    ${step.stepNum ? `<span style="font-size:0.68rem;opacity:0.7;font-weight:700;">STEP ${step.stepNum}</span>` : ''}
                    <span style="font-size:0.92rem;">${step.title}</span>
                </div>
            </div>
        `;
    });

    navItems.innerHTML = html;
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
