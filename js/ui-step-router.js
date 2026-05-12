import { renderPreprocessingView } from './ui-preprocessing.js';
import { renderResearchJournal } from './ui-journal.js';
import { renderResearchJournalStep4 } from './ui-research-journal.js';

export function renderStepContent(stepId, state, onStepChange, containerId = 'step-canvas') {
    const canvas = document.getElementById(containerId);
    if (!canvas) return;
    let content = '';
    const topic = state.selectedTopic;

    switch(stepId) {
            case 0: // 0단계: 연구 프로젝트 안내
                content = '<div id="journal-root" style="min-height: 400px; padding: 20px;"></div>';
                setTimeout(() => {
                    renderResearchJournal('journal-root', state);
                }, 50);
                break;
            case 3: // 4단계: 연구 일지 (기존 문제 정의 대체)
                content = '<div id="research-journal-root" style="min-height: 400px; padding: 20px;"></div>';
                setTimeout(() => {
                    renderResearchJournalStep4('research-journal-root', state);
                }, 50);
                break;
            case 9: // 1.5단계: 데이터 탐색
                content = '<div id="topic-explore-root" style="min-height: 400px; padding: 20px;"></div>';
                setTimeout(() => {
                    const root = document.getElementById('topic-explore-root');
                    if (!root) return;

                    import('./data.js').then(({ categories }) => {
                        const diffColor = { '초급': { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' }, '중급': { bg: '#fffbeb', border: '#fde68a', text: '#b45309' }, '심화': { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' } };

                        let selectedCatId = state.selectedCategoryId || null;

                        const render = () => {
                            const cat = selectedCatId ? categories.find(c => c.id === selectedCatId) : null;

                            root.innerHTML = `
                                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                                    <h2>1단계: 데이터 탐색</h2>
                                    ${cat ? `<button id="back-to-categories" class="btn-secondary" style="font-size:0.85rem;">← 전체 분야 보기</button>` : ''}
                                </div>

                                ${!cat ? `
                                <!-- 카테고리 목록 -->
                                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:25px;">
                                    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 18px;">
                                        <div style="font-size:0.75rem;font-weight:700;color:#16a34a;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">1단계 역할</div>
                                        <div style="font-size:0.88rem;color:#166534;line-height:1.55;">분야를 클릭해 <strong>교육과의 접점</strong>과 연구 아이디어를 먼저 탐색하세요. 데이터가 정해지면 다음 단계로 이동하여 데이터를 저장하면 됩니다.</div>
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
                                
                                <!-- KOSIS 추천 링크 추가 -->
                                <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 15px 20px; margin-bottom: 25px; display: flex; align-items: center; gap: 15px;">
                                    <div style="background: #3b82f6; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                        <i data-lucide="external-link" size="18"></i>
                                    </div>
                                    <div style="flex: 1;">
                                        <h4 style="margin: 0; font-size: 0.95rem; color: #0369a1;">🔍 더 많은 데이터를 찾고 싶나요?</h4>
                                        <p style="margin: 3px 0 0 0; font-size: 0.85rem; color: #0ea5e9;">
                                            <a href="https://kosis.kr/statisticsList/statisticsListIndex.do?vwcd=MT_ZTITLE&menuId=M_01_01#H1_12.2" target="_blank" style="color: #0369a1; font-weight: 700; text-decoration: underline;">KOSIS 국가통계포털</a>에서 주제별 다양한 통계 자료를 탐색해보세요.
                                        </p>
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
                                </div>
                                ` : `
                                <!-- 분야 상세 -->
                                ${(() => {
                                    const dc = diffColor[cat.difficulty] || diffColor['초급'];
                                    return `
                                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
                                        <i data-lucide="${cat.icon}" size="24" style="color:var(--primary);"></i>
                                        <h3 style="margin:0;font-size:1.2rem;">${cat.title}</h3>
                                        <span style="font-size:0.78rem;font-weight:700;background:${dc.bg};border:1px solid ${dc.border};color:${dc.text};border-radius:6px;padding:3px 12px;">${cat.difficulty}</span>
                                    </div>

                                    <!-- 교육 접점 -->
                                    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:20px;margin-bottom:20px;">
                                        <h4 style="color:#0369a1;margin:0 0 14px;font-size:0.95rem;display:flex;align-items:center;gap:8px;">
                                            <i data-lucide="graduation-cap" size="16"></i> 교육과 이렇게 연결돼요
                                        </h4>
                                        <div style="display:flex;flex-direction:column;gap:10px;">
                                            ${cat.educationLinks.map((q, i) => `
                                                <div style="display:flex;align-items:flex-start;gap:10px;padding:12px 14px;background:white;border-radius:8px;border:1px solid #e0f2fe;">
                                                    <span style="font-size:1rem;flex-shrink:0;">💡</span>
                                                    <p style="margin:0;font-size:0.92rem;color:#0c4a6e;line-height:1.55;">${q}</p>
                                                </div>`).join('')}
                                        </div>
                                    </div>

                                    <!-- 연구 아이디어 -->
                                    <div style="background:white;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:20px;">
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

                                    `;
                                })()}
                                `}
                            `;

                            if (window.lucide) lucide.createIcons();

                            if (!cat) {
                                root.querySelectorAll('.cat-card').forEach(card => {
                                    card.addEventListener('mouseenter', () => card.style.boxShadow = 'var(--shadow)');
                                    card.addEventListener('mouseleave', () => card.style.boxShadow = '');
                                    card.addEventListener('click', () => {
                                        selectedCatId = card.dataset.id;
                                        state.selectedCategoryId = card.dataset.id;
                                        render();
                                    });
                                });
                            } else {
                                const backBtn = document.getElementById('back-to-categories');
                                if (backBtn) backBtn.onclick = () => { selectedCatId = null; state.selectedCategoryId = null; render(); };
                                // keyword links are plain <a> tags, no JS handler needed
                            }
                        };

                        render();
                    });
                }, 50);
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
                    import('./discovery.js').then(m => {
                        const cb = (cat, dataInfo, stayOnPage = false) => {
                            const isNonStandardCtx = typeof onStepChange === 'function' && onStepChange !== window.changeStep;
                            if (isNonStandardCtx) {
                                // 교사 컨텍스트
                                if (state) state.selectedTopic = { cat, dataInfo };
                                if (!stayOnPage) {
                                    alert(`'${dataInfo.name}' 데이터가 분석 목록에 추가되었습니다!\n[데이터 관리] 단계에서 확인할 수 있습니다.`);
                                    onStepChange(2);
                                }
                            } else {
                                window.onDataSelected(cat, dataInfo, stayOnPage);
                            }
                        };
                        m.showSaveInstructions(initialName, state, cb);
                    });
                }, 50);
                break;
            case 2: // 3단계: 데이터 관리
                content = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2>📋 3단계: 데이터 관리</h2>
                        <span class="text-muted" style="font-size: 0.9rem;">수집한 데이터셋을 확인하고 관리할 수 있습니다.</span>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 25px;">
                        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px 18px;">
                            <div style="font-size: 0.75rem; font-weight: 700; color: #16a34a; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">3단계 역할</div>
                            <div style="font-size: 0.88rem; color: #166534; line-height: 1.55;">저장된 데이터셋을 한눈에 확인하고, 연구에 쓸 파일을 선택하거나 공유 여부를 설정합니다. 4단계(문제 정의)로 넘어가기 전에 반드시 완료하세요.</div>
                        </div>
                        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 16px 18px;">
                            <div style="font-size: 0.75rem; font-weight: 700; color: #1d4ed8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">연구 활용 체크박스</div>
                            <div style="font-size: 0.88rem; color: #1e3a8a; line-height: 1.55;">체크하면 해당 데이터셋이 <strong>4단계 문제 정의</strong>의 AI 분석 대상으로 포함됩니다. 연구에 필요한 파일만 선택하세요. 체크하지 않은 파일은 AI가 참고하지 않습니다.</div>
                        </div>
                        <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 10px; padding: 16px 18px;">
                            <div style="font-size: 0.75rem; font-weight: 700; color: #7c3aed; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">공유 토글</div>
                            <div style="font-size: 0.88rem; color: #4c1d95; line-height: 1.55;"><strong>켜짐(파란색)</strong>: 같은 반 친구들도 이 데이터를 내려받아 활용할 수 있습니다.<br><strong>꺼짐(회색)</strong>: 나만 볼 수 있는 비공개 상태가 됩니다.</div>
                        </div>
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

            case 8: // Competition Application
                content = '<div id="competition-root" style="min-height: 400px;"></div>';
                setTimeout(async () => {
                    const root = document.getElementById('competition-root');
                    if (!root) return;

                    root.innerHTML = '<div style="text-align: center; padding: 40px;"><p class="text-muted">신청 내역을 확인하는 중입니다...</p></div>';

                    const { fetchCompetitionApplicationByStudent, fetchCompetitionApplicationAsMember, submitCompetitionApplication, updateCompetitionApplication, deleteCompetitionApplication } = await import('./auth.js');
                    const { data: existingApp } = await fetchCompetitionApplicationByStudent(state.user.student_id);
                    const { data: memberApp } = existingApp ? { data: null } : await fetchCompetitionApplicationAsMember(state.user.student_id);

                    const renderApplyMode = (initialData = null) => {
                        const isEdit = !!initialData;
                        const initialTeam = initialData ? initialData.team_data : [];
                        const initialTeamName = initialData ? (initialData.team_name || '') : '';

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
                                    <div style="margin-bottom: 25px; background: #fffbeb; padding: 20px; border-radius: 10px; border: 1px solid #fde68a;">
                                        <label style="display: block; font-weight: 700; color: #92400e; font-size: 0.95rem; margin-bottom: 10px;">
                                            <i data-lucide="award" size="18" style="vertical-align: middle; margin-right: 5px;"></i> 팀 이름 (대회 활동명)
                                        </label>
                                        <input type="text" id="comp-team-name" placeholder="멋진 팀 이름을 입력해주세요 (예: 데이터 마스터)" value="${initialTeamName}" 
                                               style="width: 100%; padding: 12px 15px; border: 2px solid #fcd34d; border-radius: 8px; font-size: 1rem; font-weight: 600; outline: none; transition: border-color 0.2s;">
                                        <p style="margin: 8px 0 0; font-size: 0.8rem; color: #b45309;">※ 팀 이름은 연구 일지 협업 및 대회 심사 시 활용됩니다.</p>
                                    </div>

                                    <div id="team-members-container" style="display: flex; flex-direction: column; gap: 20px;"></div>
                                    <div style="margin-top: 20px; display: flex; flex-direction: ${window.innerWidth <= 768 ? 'column' : 'row'}; gap: 10px;">
                                        <button type="button" id="add-member-btn" class="btn-secondary" style="font-size: 0.9rem; padding: 8px 15px; width: ${window.innerWidth <= 768 ? '100%' : 'auto'}; justify-content: center;">
                                            <i data-lucide="plus" style="vertical-align: middle; margin-right: 5px;"></i> 팀원 추가
                                        </button>
                                        <button type="submit" id="submit-comp-btn" class="btn-primary" style="font-size: 0.9rem; padding: 8px 30px; width: ${window.innerWidth <= 768 ? '100%' : 'auto'}; justify-content: center;" disabled>
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
                            const teamName = document.getElementById('comp-team-name').value.trim();
                            submitBtn.disabled = !teamName; // 팀 이름이 있어야 활성화

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
                                <div style="display: grid; grid-template-columns: ${window.innerWidth <= 768 ? '1fr' : '1fr 1fr 2fr'}; gap: 15px;">
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

                        document.getElementById('comp-team-name').addEventListener('input', validateForm);

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

                            let errors = [];
                            const teamName = document.getElementById('comp-team-name').value.trim();
                            if (!teamName) errors.push('팀 이름을 입력해주세요.');

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
                                    ? await updateCompetitionApplication(initialData.id, teamData, teamName)
                                    : await submitCompetitionApplication(teamData, state.user.student_id, teamName);
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

                    const renderViewMode = (app, isMemberView = false) => {
                        const team = app.team_data || [];
                        const isCompleted = app.status === 'completed';
                        const teamName = app.team_name || '이름 없음';

                        root.innerHTML = `
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                                <div>
                                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                        <h2 style="margin: 0;">🏆 ${teamName}</h2>
                                        ${!isMemberView ? `
                                            <button id="quick-edit-name-btn" style="background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px; display: flex; align-items: center; transition: color 0.2s;" title="팀 이름/정보 수정">
                                                <i data-lucide="edit-3" size="18"></i>
                                            </button>
                                        ` : ''}
                                    </div>
                                    <p class="text-muted" style="margin-top: 5px;">
                                        ${isMemberView
                                            ? '<span style="color: #0369a1; font-weight: 600;">팀 대표가 신청한 팀 정보입니다. 수정이나 취소는 팀 대표만 가능합니다.</span>'
                                            : isCompleted
                                                ? '<span style="color: var(--secondary); font-weight: 700;">선생님께서 접수를 완료 처리하셨습니다. 이제 수정이나 삭제가 불가능합니다.</span>'
                                                : '현재 신청하신 팀 정보입니다. 수정이나 삭제를 하려면 아래 버튼을 이용하세요.'}
                                    </p>
                                </div>
                                ${!isMemberView ? `
                                <div style="display: flex; gap: 10px;">
                                    <button id="edit-app-btn" class="btn-primary" style="font-size: 0.85rem; padding: 8px 20px; ${isCompleted ? 'opacity: 0.5; cursor: not-allowed;' : ''}" ${isCompleted ? 'disabled' : ''}>수정하기</button>
                                    <button id="delete-app-btn" class="btn-secondary" style="font-size: 0.85rem; padding: 8px 20px; color: var(--accent); border-color: var(--accent); ${isCompleted ? 'opacity: 0.5; cursor: not-allowed;' : ''}" ${isCompleted ? 'disabled' : ''}>신청 취소</button>
                                </div>` : ''}
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

                        if (!isMemberView) {
                            const quickEditBtn = document.getElementById('quick-edit-name-btn');
                            if (quickEditBtn) quickEditBtn.onclick = () => renderApplyMode(app);

                            if (!isCompleted) {
                                const editBtn = document.getElementById('edit-app-btn');
                                if (editBtn) editBtn.onclick = () => renderApplyMode(app);

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
                        }
                        if (window.lucide) lucide.createIcons();
                    };

                    if (existingApp) renderViewMode(existingApp);
                    else if (memberApp) renderViewMode(memberApp, true);
                    else renderApplyMode();
                }, 50);
                break;
            case 12: // 6단계: 추천 사이트 공유
                content = `
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
                        <div>
                            <h2 style="margin:0;font-size:1.5rem;color:var(--secondary);">🔗 6단계: 추천 사이트 공유</h2>
                            <p class="text-muted" style="margin:5px 0 0;font-size:0.9rem;">공공데이터 연구에 도움이 되는 사이트를 공유하고 다른 친구들의 추천을 확인하세요.</p>
                        </div>
                        <button id="add-site-btn" class="btn-primary" style="padding:10px 20px;font-weight:600;display:flex;align-items:center;gap:8px;">
                            <i data-lucide="plus-circle" size="18"></i> 사이트 추천하기
                        </button>
                    </div>
                    
                    <div id="site-form-container" class="glass" style="display:none; padding:25px; margin-bottom:25px; border-top:4px solid var(--primary);">
                        <h3 id="form-title" style="margin-top:0; margin-bottom:15px; font-size:1.1rem;">✨ 새로운 사이트 추천</h3>
                        <input type="hidden" id="site-id-edit">
                        <div style="display:flex; flex-direction:column; gap:15px;">
                            <div>
                                <label style="display:block; font-size:0.85rem; font-weight:600; color:#475569; margin-bottom:5px;">URL 주소</label>
                                <input type="url" id="site-url" placeholder="https://..." style="width:100%; padding:10px; border:1px solid #cbd5e1; border-radius:6px;">
                            </div>
                            <div>
                                <label style="display:block; font-size:0.85rem; font-weight:600; color:#475569; margin-bottom:5px;">사이트 설명</label>
                                <textarea id="site-desc" placeholder="이 사이트가 왜 유용한지 설명해 주세요." style="width:100%; height:80px; padding:10px; border:1px solid #cbd5e1; border-radius:6px;"></textarea>
                            </div>
                            <div style="display:flex; gap:10px; justify-content:flex-end;">
                                <button id="cancel-site-btn" class="btn-secondary">취소</button>
                                <button id="save-site-btn" class="btn-primary" style="padding:8px 25px;">공유하기</button>
                            </div>
                        </div>
                    </div>

                    <div id="sites-list-container" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:20px;">
                        <!-- Sites will be rendered here -->
                    </div>
                `;
                
                setTimeout(async () => {
                    const { fetchRecommendedSites, createRecommendedSite, updateRecommendedSite, deleteRecommendedSite } = await import('./auth.js');
                    const container = document.getElementById('sites-list-container');
                    const formContainer = document.getElementById('site-form-container');
                    const addBtn = document.getElementById('add-site-btn');
                    
                    const loadSites = async () => {
                        container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:50px;"><div class="spinner"></div></div>';
                        const { fetchRecommendedSites, updateRecommendedSitesOrder, deleteRecommendedSite, updateRecommendedSite, createRecommendedSite } = await import('./auth.js');
                        const { data, error } = await fetchRecommendedSites();
                        if (error) {
                            container.innerHTML = `<p style="color:red; grid-column:1/-1;">오류: ${error.message}</p>`;
                            return;
                        }
                        
                        if (!data || data.length === 0) {
                            container.innerHTML = `
                                <div style="grid-column:1/-1; text-align:center; padding:60px; background:#f8fafc; border-radius:12px; border:1px dashed #cbd5e1;">
                                    <p style="color:#64748b;">아직 공유된 사이트가 없습니다. 첫 번째 추천을 남겨보세요!</p>
                                </div>`;
                        } else {
                            container.innerHTML = data.map(site => `
                                <div class="glass card" style="padding:20px; display:flex; flex-direction:column; gap:12px; transition:transform 0.2s; border-top:3px solid var(--primary-glow);">
                                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                        <div style="background:var(--primary-glow); color:var(--primary); width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center;">
                                            <i data-lucide="link" size="16"></i>
                                        </div>
                                        <div style="display:flex; gap:5px; align-items:center;">
                                            ${(state.user && state.user.role === 'teacher') ? `
                                                <div style="display:flex; gap:2px; margin-right:8px; background:#f1f5f9; padding:2px; border-radius:6px;">
                                                    <button class="move-up-btn" data-index="${data.indexOf(site)}" style="background:white; border:1px solid #e2e8f0; color:#64748b; cursor:pointer; width:28px; height:28px; border-radius:4px; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">
                                                        <i data-lucide="chevron-up" size="16"></i>
                                                    </button>
                                                    <button class="move-down-btn" data-index="${data.indexOf(site)}" style="background:white; border:1px solid #e2e8f0; color:#64748b; cursor:pointer; width:28px; height:28px; border-radius:4px; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">
                                                        <i data-lucide="chevron-down" size="16"></i>
                                                    </button>
                                                </div>
                                            ` : ''}
                                            ${(state.user && (state.user.student_id === site.author_id || state.user.role === 'teacher')) ? `
                                                <button class="edit-site-btn" data-id="${site.id}" data-url="${site.url}" data-desc="${site.description.replace(/"/g, '&quot;')}" style="background:none; border:none; color:var(--primary); cursor:pointer; padding:4px;">
                                                    <i data-lucide="edit-3" size="14"></i>
                                                </button>
                                                <button class="delete-site-btn" data-id="${site.id}" style="background:none; border:none; color:#ef4444; cursor:pointer; padding:4px;">
                                                    <i data-lucide="trash-2" size="14"></i>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                    <div style="flex:1;">
                                        <p style="margin:0; font-size:0.92rem; color:#334155; line-height:1.5; font-weight:500; word-break:break-all;">
                                            ${site.description}
                                        </p>
                                        <a href="${site.url}" target="_blank" style="margin-top:10px; display:inline-block; font-size:0.8rem; color:var(--primary); text-decoration:underline; word-break:break-all;">
                                            ${site.url}
                                        </a>
                                    </div>
                                    <div style="margin-top:10px; padding-top:10px; border-top:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:#94a3b8;">
                                        <span>👤 ${site.author_name}</span>
                                        <span>📅 ${new Date(site.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            `).join('');
                            
                            container.querySelectorAll('.delete-site-btn').forEach(btn => {
                                btn.onclick = async () => {
                                    if (!confirm('정말로 이 추천을 삭제하시겠습니까?')) return;
                                    await deleteRecommendedSite(btn.dataset.id);
                                    loadSites();
                                };
                            });

                            container.querySelectorAll('.edit-site-btn').forEach(btn => {
                                btn.onclick = () => {
                                    const { id, url, desc } = btn.dataset;
                                    document.getElementById('site-id-edit').value = id;
                                    document.getElementById('site-url').value = url;
                                    document.getElementById('site-desc').value = desc;
                                    document.getElementById('form-title').innerText = '✏️ 추천 사이트 수정';
                                    document.getElementById('save-site-btn').innerText = '수정 완료';
                                    formContainer.style.display = 'block';
                                    addBtn.style.display = 'none';
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                };
                            });

                            const moveItems = async (fromIdx, toIdx) => {
                                if (toIdx < 0 || toIdx >= data.length) return;
                                container.style.opacity = '0.5';
                                container.style.pointerEvents = 'none';
                                
                                const tempData = [...data];
                                const item = tempData.splice(fromIdx, 1)[0];
                                tempData.splice(toIdx, 0, item);
                                
                                const updates = tempData.map((s, i) => ({ id: s.id, sort_order: i }));
                                const { updateRecommendedSitesOrder } = await import('./auth.js');
                                const { error } = await updateRecommendedSitesOrder(updates);
                                
                                if (error) {
                                    alert('순서 저장 중 오류가 발생했습니다: ' + (error.message || error.details || '권한이 없거나 데이터베이스 오류입니다.'));
                                    container.style.opacity = '1';
                                    container.style.pointerEvents = 'auto';
                                    await loadSites(); // 원복
                                } else {
                                    await loadSites();
                                    container.style.opacity = '1';
                                    container.style.pointerEvents = 'auto';
                                }
                            };

                            container.querySelectorAll('.move-up-btn').forEach(btn => {
                                btn.onclick = () => moveItems(parseInt(btn.dataset.index), parseInt(btn.dataset.index) - 1);
                            });

                            container.querySelectorAll('.move-down-btn').forEach(btn => {
                                btn.onclick = () => moveItems(parseInt(btn.dataset.index), parseInt(btn.dataset.index) + 1);
                            });
                        }
                        if (window.lucide) lucide.createIcons();
                    };
                    
                    addBtn.onclick = () => {
                        document.getElementById('site-id-edit').value = '';
                        document.getElementById('site-url').value = '';
                        document.getElementById('site-desc').value = '';
                        document.getElementById('form-title').innerText = '✨ 새로운 사이트 추천';
                        document.getElementById('save-site-btn').innerText = '공유하기';
                        formContainer.style.display = 'block';
                        addBtn.style.display = 'none';
                    };
                    
                    const cancelBtn = document.getElementById('cancel-site-btn');
                    if (cancelBtn) {
                        cancelBtn.onclick = () => {
                            formContainer.style.display = 'none';
                            addBtn.style.display = 'flex';
                        };
                    }
                    
                    const saveBtn = document.getElementById('save-site-btn');
                    if (saveBtn) {
                        saveBtn.onclick = async () => {
                            const url = document.getElementById('site-url').value.trim();
                            const desc = document.getElementById('site-desc').value.trim();
                            const editId = document.getElementById('site-id-edit').value;
                            
                            if (!url || !desc) { alert('URL과 설명을 모두 입력해 주세요.'); return; }
                            
                            let result;
                            if (editId) {
                                result = await updateRecommendedSite(editId, url, desc);
                            } else {
                                result = await createRecommendedSite(url, desc, state.user.student_id, state.user.name);
                            }
                            
                            if (result.error) alert('저장 실패: ' + result.error.message);
                            else {
                                document.getElementById('site-id-edit').value = '';
                                document.getElementById('site-url').value = '';
                                document.getElementById('site-desc').value = '';
                                formContainer.style.display = 'none';
                                addBtn.style.display = 'flex';
                                loadSites();
                            }
                        };
                    }
                    
                    loadSites();
                    if (window.lucide) lucide.createIcons();
                }, 50);
                break;
            case 11: // 6단계: 작업 파일 공유
                content = `
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
                        <div>
                            <h2 style="margin:0;font-size:1.5rem;color:var(--secondary);">📤 6단계: 작업 파일 공유</h2>
                            <p class="text-muted" style="margin:5px 0 0;font-size:0.9rem;">자신의 연구 결과물을 공유하고 다른 학생들의 자료를 참고할 수 있습니다.</p>
                        </div>
                        <button id="create-share-post-btn" class="btn-primary" style="padding:10px 20px;font-weight:600;display:flex;align-items:center;gap:8px;">
                            <i data-lucide="plus-circle" size="18"></i> 자료 공유하기
                        </button>
                    </div>
                    <div id="shared-posts-container" style="min-height:300px;">
                        <div style="text-align:center;padding:100px 0;color:#94a3b8;">
                            <div class="spinner" style="margin-bottom:15px;"></div>
                            <p>공유된 자료를 불러오는 중입니다...</p>
                        </div>
                    </div>`;

                // 게시판 초기 로딩
                setTimeout(async () => {
                    const { fetchSharedPosts } = await import('./auth.js');
                    const boardContainer = document.getElementById('shared-posts-container');
                    
                    const loadBoard = async () => {
                        const { data, error } = await fetchSharedPosts();
                        if (error) {
                            boardContainer.innerHTML = `<p style="color:red;text-align:center;padding:40px;">데이터 로딩 오류: ${error.message}</p>`;
                            return;
                        }
                        
                        if (!data || data.length === 0) {
                            boardContainer.innerHTML = `
                                <div style="text-align:center;padding:100px 0;background:#f8fafc;border-radius:16px;border:1px dashed #cbd5e1;">
                                    <i data-lucide="inbox" size="48" style="margin-bottom:12px;opacity:0.3;"></i>
                                    <p style="color:#64748b;">아직 공유된 자료가 없습니다.<br>첫 번째 공유글을 남겨보세요!</p>
                                </div>`;
                        } else {
                            boardContainer.innerHTML = `
                                <div style="background:white; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
                                    <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem;">
                                        <thead>
                                            <tr style="background:#f1f5f9; border-bottom:2px solid #e2e8f0;">
                                                <th style="padding:15px 20px; width:60px; color:#64748b; font-weight:700;">번호</th>
                                                <th style="padding:15px 20px; color:#64748b; font-weight:700;">제목</th>
                                                <th style="padding:15px 20px; width:120px; color:#64748b; font-weight:700;">작성자</th>
                                                <th style="padding:15px 20px; width:180px; color:#64748b; font-weight:700;">등록 일시</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${data.map((post, idx) => {
                                                const dateStr = new Date(post.created_at).toLocaleString('ko-KR', {
                                                    year: 'numeric', month: '2-digit', day: '2-digit',
                                                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                                                    hour12: false
                                                });
                                                return `
                                                    <tr class="post-row" data-id="${post.id}" style="border-bottom:1px solid #f1f5f9; cursor:pointer; transition:background 0.2s;">
                                                        <td style="padding:15px 20px; color:#94a3b8;">${data.length - idx}</td>
                                                        <td style="padding:15px 20px; font-weight:600; color:var(--secondary);">
                                                            <div style="display:flex; align-items:center; gap:8px;">
                                                                ${post.title}
                                                                <span style="font-size:0.75rem; color:#94a3b8; font-weight:400;">[${post.shared_files?.length || 0}]</span>
                                                            </div>
                                                        </td>
                                                        <td style="padding:15px 20px;">
                                                            <span style="background:#f1f5f9; padding:4px 8px; border-radius:4px; font-size:0.8rem; font-weight:600;">${post.author_name}</span>
                                                        </td>
                                                        <td style="padding:15px 20px; color:#64748b; font-size:0.85rem;">${dateStr}</td>
                                                    </tr>
                                                    <tr id="detail-${post.id}" style="display:none; background:#f8fafc;">
                                                        <td colspan="4" style="padding:25px 40px; border-bottom:1px solid #f1f5f9;">
                                                            <div style="margin-bottom:20px;">
                                                                <h4 style="margin:0 0 10px 0; font-size:0.95rem; color:#475569;">📝 자료 설명</h4>
                                                                <p style="margin:0; font-size:0.9rem; color:#64748b; line-height:1.6; white-space:pre-wrap;">${post.content || '등록된 설명이 없습니다.'}</p>
                                                            </div>
                                                            <div>
                                                                <h4 style="margin:0 0 10px 0; font-size:0.95rem; color:#475569; display:flex; align-items:center; gap:8px; justify-content:space-between;">
                                                                    <span style="display:flex; align-items:center; gap:8px;"><i data-lucide="paperclip" size="16"></i> 첨부 파일</span>
                                                                    ${post.shared_files && post.shared_files.length > 1 ? `
                                                                        <button class="download-all-btn btn-primary" 
                                                                                data-id="${post.id}" 
                                                                                data-title="${post.title}"
                                                                                data-author="${post.author_name}"
                                                                                data-files='${JSON.stringify(post.shared_files)}'
                                                                                style="font-size:0.75rem; padding:5px 12px; border-radius:6px; cursor:pointer; display:flex; align-items:center; gap:5px;">
                                                                            <i data-lucide="archive" size="14"></i> 모든 파일 한번에 받기 (.zip)
                                                                        </button>
                                                                    ` : ''}
                                                                </h4>
                                                                <div style="display:flex; flex-wrap:wrap; gap:10px;">
                                                                    ${(post.shared_files || []).map(file => `
                                                                        <button class="download-btn btn-secondary" 
                                                                                data-url="${file.file_url}" 
                                                                                data-name="${file.file_name}"
                                                                                style="font-size:0.8rem; padding:8px 15px; cursor:pointer; display:flex; align-items:center; gap:8px; background:white; border:1px solid #e2e8f0; border-radius:8px;">
                                                                            <i data-lucide="download" size="14"></i>
                                                                            <div style="display:flex; flex-direction:column; align-items:flex-start;">
                                                                                <span style="font-weight:600;">${file.file_name}</span>
                                                                                <span style="font-size:0.72rem; color:#94a3b8;">(${(file.file_size/1024).toFixed(1)} KB)</span>
                                                                            </div>
                                                                        </button>
                                                                    `).join('')}
                                                                </div>
                                                            </div>

                                                            ${(() => {
                                                                const user = state.user || {};
                                                                
                                                                // 1. 작성자 본인 확인
                                                                const isAuthor = user.student_id && user.student_id === post.author_id;
                                                                
                                                                // 2. 교사 권한 확인 (데이터 구조 또는 현재 화면이 교사용 섹션인지 확인)
                                                                const teacherSection = document.getElementById('teacher-section');
                                                                const isTeacherView = teacherSection && teacherSection.style.display !== 'none';
                                                                const isTeacherUser = user.role === 'teacher' || (!user.student_id && user.email);
                                                                
                                                                if (isAuthor || isTeacherView || isTeacherUser) {
                                                                    return `
                                                                        <div style="margin-top:25px; padding-top:20px; border-top:1px solid #e2e8f0; display:flex; justify-content:flex-end; gap:10px;">
                                                                            <button class="edit-post-btn btn-secondary" 
                                                                                    data-id="${post.id}" 
                                                                                    data-post='${JSON.stringify(post).replace(/'/g, "&apos;")}'
                                                                                    style="font-size:0.85rem; padding:8px 18px; cursor:pointer; border-radius:8px; font-weight:600; display:inline-flex; align-items:center; gap:5px;">
                                                                                <i data-lucide="edit-3" size="14"></i> 수정하기
                                                                            </button>
                                                                            <button class="delete-post-btn btn-secondary" 
                                                                                    data-id="${post.id}" 
                                                                                    data-files='${JSON.stringify(post.shared_files || [])}'
                                                                                    style="color:#ef4444; border-color:#fee2e2; background:#fff1f1; font-size:0.85rem; padding:8px 15px; cursor:pointer; border-radius:8px; font-weight:600; display:inline-flex; align-items:center; gap:5px;">
                                                                                <i data-lucide="trash-2" size="14"></i> 게시글 삭제하기
                                                                            </button>
                                                                        </div>`;
                                                                }
                                                                return '';
                                                            })()}
                                                        </td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>`;
                            
                            // 수정 버튼 기능 연결
                            boardContainer.querySelectorAll('.edit-post-btn').forEach(btn => {
                                btn.onclick = async (e) => {
                                    e.stopPropagation();
                                    const postData = JSON.parse(btn.dataset.post);
                                    
                                    const { showBoardEditor } = await import('./ui-board-editor.js');
                                    showBoardEditor(state, async (updatedData) => {
                                        const { updateSharedPost, addFilesToSharedPost, deleteFileFromSharedPost } = await import('./auth.js');
                                        
                                        // 1. 게시글 기본 정보 수정
                                        const updateRes = await updateSharedPost(postData.id, updatedData.title, updatedData.content);
                                        if (!updateRes.success) throw updateRes.error;
                                        
                                        // 2. 파일 삭제 처리
                                        if (updatedData.deletedFileIds.length > 0) {
                                            for (const fileId of updatedData.deletedFileIds) {
                                                const file = postData.shared_files.find(f => String(f.id) === String(fileId));
                                                if (file) {
                                                    await deleteFileFromSharedPost(file.id, file.file_path);
                                                }
                                            }
                                        }
                                        
                                        // 3. 새 파일 추가 업로드
                                        if (updatedData.files.length > 0) {
                                            const addRes = await addFilesToSharedPost(postData.id, updatedData.files);
                                            if (!addRes.success) throw addRes.error;
                                        }
                                        
                                        alert('게시글이 수정되었습니다.');
                                        await loadBoard();
                                    }, postData);
                                };
                            });

                            // 삭제 버튼 기능 연결
                            boardContainer.querySelectorAll('.delete-post-btn').forEach(btn => {
                                btn.onclick = async (e) => {
                                    e.stopPropagation();
                                    if (!confirm('정말로 이 게시글과 첨부 파일을 모두 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.')) return;
                                    
                                    const { id, files } = btn.dataset;
                                    const parsedFiles = JSON.parse(files);
                                    const { deleteSharedPost } = await import('./auth.js');
                                    
                                    btn.disabled = true;
                                    btn.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> 삭제 중...';
                                    
                                    const { success, error } = await deleteSharedPost(id, parsedFiles);
                                    if (success) {
                                        alert('게시글이 삭제되었습니다.');
                                        await loadBoard();
                                    } else {
                                        alert('삭제 오류: ' + (error.message || '알 수 없는 오류'));
                                        btn.disabled = false;
                                        btn.innerHTML = '<i data-lucide="trash-2" size="14"></i> 게시글 삭제하기';
                                        if (window.lucide) lucide.createIcons();
                                    }
                                };
                            });

                            // 전체 다운로드 버튼 기능 연결
                            boardContainer.querySelectorAll('.download-all-btn').forEach(btn => {
                                btn.onclick = async (e) => {
                                    e.stopPropagation();
                                    const { title, author, files } = btn.dataset;
                                    const parsedFiles = JSON.parse(files);
                                    const origInner = btn.innerHTML;
                                    
                                    try {
                                        btn.disabled = true;
                                        btn.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> 압축 중...';
                                        
                                        // JSZip이 로드되어 있는지 확인
                                        if (typeof JSZip === 'undefined') {
                                            const script = document.createElement('script');
                                            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
                                            document.head.appendChild(script);
                                            await new Promise(resolve => script.onload = resolve);
                                        }

                                        const zip = new JSZip();
                                        
                                        // 모든 파일을 순차적으로 fetch하여 zip에 추가
                                        const fetchPromises = parsedFiles.map(async (file) => {
                                            const response = await fetch(file.file_url);
                                            const blob = await response.blob();
                                            zip.file(file.file_name, blob); // 폴더 없이 바로 루트에 추가
                                        });
                                        
                                        await Promise.all(fetchPromises);
                                        
                                        const content = await zip.generateAsync({type: "blob"});
                                        const zipUrl = window.URL.createObjectURL(content);
                                        
                                        const a = document.createElement('a');
                                        a.href = zipUrl;
                                        a.download = `${title}.zip`;
                                        document.body.appendChild(a);
                                        a.click();
                                        window.URL.revokeObjectURL(zipUrl);
                                        a.remove();
                                    } catch (err) {
                                        console.error('Bulk download failed:', err);
                                        alert('전체 다운로드 중 오류가 발생했습니다.');
                                    } finally {
                                        btn.disabled = false;
                                        btn.innerHTML = origInner;
                                        if (window.lucide) lucide.createIcons();
                                    }
                                };
                            });

                            // 다운로드 버튼 기능 연결
                            boardContainer.querySelectorAll('.download-btn').forEach(btn => {
                                btn.onclick = async (e) => {
                                    e.stopPropagation(); // 행 클릭 이벤트 방지
                                    const { url, name } = btn.dataset;
                                    const icon = btn.querySelector('i');
                                    const origInner = btn.innerHTML;
                                    
                                    try {
                                        btn.disabled = true;
                                        btn.style.opacity = '0.7';
                                        btn.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> 다운로드 중...';
                                        
                                        const response = await fetch(url);
                                        const blob = await response.blob();
                                        const blobUrl = window.URL.createObjectURL(blob);
                                        
                                        const a = document.createElement('a');
                                        a.href = blobUrl;
                                        a.download = name; // 여기서 원본 파일명 지정
                                        document.body.appendChild(a);
                                        a.click();
                                        window.URL.revokeObjectURL(blobUrl);
                                        a.remove();
                                    } catch (err) {
                                        console.error('Download failed:', err);
                                        alert('파일 다운로드에 실패했습니다.');
                                    } finally {
                                        btn.disabled = false;
                                        btn.style.opacity = '1';
                                        btn.innerHTML = origInner;
                                        if (window.lucide) lucide.createIcons();
                                    }
                                };
                            });

                            // 행 클릭 시 상세 내용 토글
                            boardContainer.querySelectorAll('.post-row').forEach(row => {
                                row.onclick = () => {
                                    const detailRow = document.getElementById(`detail-${row.dataset.id}`);
                                    const isVisible = detailRow.style.display !== 'none';
                                    
                                    // [추가] 다른 모든 열려있는 상세창 닫기 및 스타일 초기화
                                    if (!isVisible) {
                                        boardContainer.querySelectorAll('[id^="detail-"]').forEach(d => {
                                            d.style.display = 'none';
                                            d.style.border = 'none';
                                        });
                                        boardContainer.querySelectorAll('.post-row').forEach(r => {
                                            r.style.background = 'white';
                                            r.style.border = 'none';
                                            r.style.borderBottom = '1px solid #f1f5f9';
                                            r.querySelector('td:nth-child(2)').style.color = 'var(--secondary)';
                                        });
                                    }

                                    if (isVisible) {
                                        detailRow.style.display = 'none';
                                        row.style.background = 'white';
                                        row.style.border = 'none';
                                        row.style.borderBottom = '1px solid #f1f5f9';
                                        row.querySelector('td:nth-child(2)').style.color = 'var(--secondary)';
                                    } else {
                                        detailRow.style.display = 'table-row';
                                        
                                        // 제목 행 스타일: 위, 좌, 우 굵은 테두리
                                        row.style.background = '#fff1f2';
                                        row.style.border = '2px solid #fb7185';
                                        row.style.borderBottom = 'none';
                                        row.querySelector('td:nth-child(2)').style.color = '#9f1239';
                                        
                                        // 상세 행 스타일: 아래, 좌, 우 굵은 테두리
                                        detailRow.style.background = '#fffafb';
                                        detailRow.style.border = '2px solid #fb7185';
                                        detailRow.style.borderTop = 'none';

                                        if (window.lucide) lucide.createIcons();
                                    }
                                };
                            });
                        }
                    };
                    
                    loadBoard();

                    const createBtn = document.getElementById('create-share-post-btn');
                    if (createBtn) {
                        createBtn.onclick = () => {
                            import('./ui-board-editor.js').then(m => {
                                m.showBoardEditor(state, async (postData) => {
                                    const { createSharedPost } = await import('./auth.js');
                                    const { success, error } = await createSharedPost(
                                        postData.title, 
                                        postData.content, 
                                        state.user.student_id, 
                                        state.user.name, 
                                        postData.files
                                    );
                                    if (success) {
                                        alert('자료가 공유되었습니다.');
                                        await loadBoard();
                                    } else {
                                        alert('공유 실패: ' + (error.message || '알 수 없는 오류'));
                                    }
                                });
                            });
                        };
                    }

                    if (window.lucide) lucide.createIcons();
                }, 50);
                break;
            default:
                content = `<h2>Step ${stepId}</h2><p>준비 중인 기능입니다.</p>`;
    }

    canvas.innerHTML = content;
    if (window.lucide) lucide.createIcons();
}
