import { renderProblemDefinitionView } from './ui-problem-def.js';
import { renderPreprocessingView } from './ui-preprocessing.js';

export function renderStepContent(stepId, state, onStepChange, containerId = 'step-canvas') {
    const canvas = document.getElementById(containerId);
    if (!canvas) return;
    let content = '';
    const topic = state.selectedTopic;

    switch(stepId) {
            case 0:
                content = `<div style="text-align:center; padding: 40px;"><h2>데이터 탐색 단계입니다.</h2><p>왼쪽 메뉴를 이용하거나 홈으로 가세요.</p></div>`;
                break;
            case 9: // 1.5단계: 주제 탐색
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
                                    <h2>1.5단계: 연구 주제 탐색</h2>
                                    ${cat ? `<button id="back-to-categories" class="btn-secondary" style="font-size:0.85rem;">← 전체 분야 보기</button>` : ''}
                                </div>

                                ${!cat ? `
                                <!-- 카테고리 목록 -->
                                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:25px;">
                                    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 18px;">
                                        <div style="font-size:0.75rem;font-weight:700;color:#16a34a;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">1.5단계 역할</div>
                                        <div style="font-size:0.88rem;color:#166534;line-height:1.55;">분야를 클릭해 <strong>교육과의 접점</strong>과 연구 아이디어를 먼저 탐색하세요. 주제가 정해지면 1단계로 돌아가 데이터를 찾으면 됩니다.</div>
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
            case 10: // 3.5단계: 데이터 미리보기
                content = `
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                        <h2>📋 3.5단계: 데이터 내용 미리보기</h2>
                        <span class="text-muted" style="font-size:0.9rem;">연구 활용으로 선택된 데이터의 실제 내용을 확인하고 복사합니다.</span>
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:25px;">
                        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 18px;">
                            <div style="font-size:0.75rem;font-weight:700;color:#16a34a;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">3.5단계 역할</div>
                            <div style="font-size:0.88rem;color:#166534;line-height:1.55;">4단계 AI 프롬프트에 실제로 들어가는 데이터 내용을 미리 확인합니다. 데이터가 올바른지 검토한 뒤 4단계로 넘어가세요.</div>
                        </div>
                        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px 18px;">
                            <div style="font-size:0.75rem;font-weight:700;color:#1d4ed8;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">변수정보 파일</div>
                            <div style="font-size:0.88rem;color:#1e3a8a;line-height:1.55;">파일명에 <strong>변수정보</strong>가 포함된 파일은 모든 변수 코드와 레이블을 전체 목록으로 표시합니다.</div>
                        </div>
                        <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;padding:16px 18px;">
                            <div style="font-size:0.75rem;font-weight:700;color:#7c3aed;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">복사 방법</div>
                            <div style="font-size:0.88rem;color:#4c1d95;line-height:1.55;">각 데이터셋 오른쪽 상단의 <strong>복사</strong> 버튼으로 해당 내용을 클립보드에 복사할 수 있습니다.</div>
                        </div>
                    </div>
                    <div id="step-3half-root" style="min-height:300px;"></div>
                `;
                setTimeout(async () => {
                    const { fetchAllResearchDatasets } = await import('./auth.js');
                    const { renderDatasetSampleViewer } = await import('./ui-datasets.js');
                    const { data, error } = await fetchAllResearchDatasets(state.user.student_id);
                    if (error) {
                        const el = document.getElementById('step-3half-root');
                        if (el) el.innerHTML = `<p class="text-muted">데이터 로딩 실패: ${error.message}</p>`;
                        return;
                    }
                    await renderDatasetSampleViewer(data || [], 'step-3half-root');
                }, 50);
                break;

            case 3: // 4단계: 문제 정의 (Step 1)
                content = '<div id="step-inner-content" style="min-height: 400px; padding: 20px;"></div>';
                setTimeout(async () => {
                    const { fetchAllResearchDatasets } = await import('./auth.js');
                    await renderProblemDefinitionView(
                        'step-inner-content',
                        () => fetchAllResearchDatasets(state.user.student_id),
                        async (data) => {
                            const { onSaveRecord } = await import('./research.js');
                            await onSaveRecord(3, data, state);
                        },
                        () => window.changeStep && window.changeStep(2)
                    );
                }, 50);
                break;
            case 4: // 5단계: 데이터 전처리 (Step 2)
                content = '<div id="step-inner-content" style="min-height: 400px; padding: 20px;"></div>';
                setTimeout(async () => {
                    const { fetchActivityLogs, fetchTeamActivityLogs, fetchAllResearchDatasets } = await import('./auth.js');
                    await renderPreprocessingView('step-inner-content', {
                        getOwnLogsFn: () => fetchActivityLogs(state.user.student_id, 3),
                        getTeamLogsFn: () => fetchTeamActivityLogs(state.user.student_id, 3),
                        getDatasetsFn: () => fetchAllResearchDatasets(state.user.student_id),
                        getSelectedId: () => state.selectedResearchId,
                        setSelectedIdAndRerender: (id) => {
                            state.selectedResearchId = id;
                            onStepChange(stepId);
                        },
                        onDelete: async (id) => {
                            const { deleteActivityLog } = await import('./auth.js');
                            const { data, error, status, statusText } = await deleteActivityLog(id, state.user.student_id);
                            if (!error) {
                                if (data && data.length > 0) {
                                    alert('연구 기록이 삭제되었습니다.');
                                } else {
                                    alert(`삭제할 기록을 찾지 못했거나 권한이 없습니다.\n(상태: ${status} ${statusText})`);
                                }
                            } else {
                                alert('삭제 실패: ' + error.message);
                                throw new Error(error.message);
                            }
                        },
                        onGoToStep4: () => window.changeStep && window.changeStep(3),
                        isTeacherMode: false,
                    });
                }, 50);
                break;
            case 5: // 6단계: AI 분석
                content = '<div id="step-inner-content" style="min-height: 400px; padding: 20px;"></div>';
                setTimeout(async () => {
                    const canvasInner = document.getElementById('step-inner-content');
                    if (!canvasInner) return;
                    canvasInner.innerHTML = '<div style="text-align:center;padding:40px;"><p class="text-muted">4단계 연구 기록을 불러오는 중입니다...</p></div>';

                    const { fetchActivityLogs, fetchAllResearchDatasets } = await import('./auth.js');
                    const { data: logs, error } = await fetchActivityLogs(state.user.student_id, 3);

                    if (error || !logs || logs.length === 0) {
                        canvasInner.innerHTML = `
                            <div style="text-align:center;padding:50px 20px;">
                                <div style="font-size:3rem;margin-bottom:20px;">🔬</div>
                                <h3 style="margin-bottom:10px;">4단계에서 저장된 연구 주제가 없습니다.</h3>
                                <p class="text-muted">먼저 [4단계: 문제 정의]에서 AI 프롬프트를 생성하고<br>답변 내용을 저장해 주세요.</p>
                                <button class="btn-secondary" style="margin-top:20px;" onclick="window.changeStep(3)">4단계로 가기</button>
                            </div>`;
                        return;
                    }

                    if (state.step6ResearchId) {
                        const selectedLog = logs.find(l => String(l.id) === String(state.step6ResearchId));
                        if (selectedLog) {
                            let resData;
                            try { resData = JSON.parse(selectedLog.content); } catch(e) { resData = { answer: selectedLog.content }; }

                            canvasInner.innerHTML = `
                                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                                    <h2>6단계: AI 데이터 분석</h2>
                                    <button id="reset-step6-btn" class="btn-secondary" style="font-size:0.85rem;">다른 주제 선택</button>
                                </div>

                                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:25px;">
                                    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 18px;">
                                        <div style="font-size:0.75rem;font-weight:700;color:#16a34a;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">6단계 역할</div>
                                        <div style="font-size:0.88rem;color:#166534;line-height:1.55;">5단계에서 전처리된 데이터를 바탕으로 <strong>분석 코드를 생성</strong>하고, 결과를 해석해 가설을 검증합니다. 8단계 정책 제안의 근거가 됩니다.</div>
                                    </div>
                                    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px 18px;">
                                        <div style="font-size:0.75rem;font-weight:700;color:#1d4ed8;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">파트 A: 분석 코드</div>
                                        <div style="font-size:0.88rem;color:#1e3a8a;line-height:1.55;">① 분석 유형 선택 → ② <strong>분석 코드 프롬프트 생성</strong> → ③ ChatGPT에 붙여넣어 코드 받기 → ④ 코랩에서 실행</div>
                                    </div>
                                    <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;padding:16px 18px;">
                                        <div style="font-size:0.75rem;font-weight:700;color:#7c3aed;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">파트 B: 결과 해석</div>
                                        <div style="font-size:0.88rem;color:#4c1d95;line-height:1.55;">코랩 분석 후 결과 수치·내용을 입력하면 AI가 <strong>가설 지지/기각 여부</strong>와 정책 시사점을 해석해 줍니다.</div>
                                    </div>
                                </div>

                                <div class="glass" style="padding:20px;border-left:4px solid var(--primary);margin-bottom:25px;">
                                    <h4 style="color:var(--secondary);margin-bottom:8px;font-size:0.95rem;">📌 선택된 연구 주제</h4>
                                    <p style="font-size:0.9rem;color:#475569;line-height:1.5;margin:0;">${resData.opinion || resData.answer?.slice(0, 150) + '...'}</p>
                                </div>

                                <!-- 파트 A: 분석 코드 생성 -->
                                <div style="border:2px dashed #cbd5e1;border-radius:15px;padding:30px;background:rgba(255,255,255,0.4);margin-bottom:25px;">
                                    <h3 style="margin-bottom:6px;color:var(--secondary);">🧪 파트 A: 분석 코드 생성</h3>
                                    <p class="text-muted" style="margin-bottom:20px;font-size:0.88rem;">분석 유형을 선택하고 코랩용 분석 코드 프롬프트를 생성하세요.</p>
                                    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
                                        ${['상관관계','집계·비교','회귀분석','군집분석'].map(t => `
                                            <label style="display:flex;align-items:center;gap:6px;padding:8px 16px;border:2px solid #e2e8f0;border-radius:8px;cursor:pointer;font-size:0.9rem;font-weight:500;transition:all 0.15s;" class="analysis-type-label">
                                                <input type="radio" name="analysis-type" value="${t}" style="accent-color:var(--primary);"> ${t}
                                            </label>`).join('')}
                                    </div>
                                    <button id="gen-analysis-btn" class="btn-primary" style="background:#059669;border-color:#059669;padding:10px 22px;">
                                        <i data-lucide="code" style="vertical-align:middle;margin-right:8px;"></i> 분석 코드 프롬프트 생성
                                    </button>
                                </div>

                                <div id="analysis-prompt-result" style="display:none;background:#0f172a;border-radius:12px;padding:25px;margin-bottom:25px;position:relative;">
                                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                                        <h4 style="color:#f8fafc;margin:0;font-size:1rem;">💻 분석 코드 생성 프롬프트</h4>
                                        <button id="copy-analysis-btn" class="btn-secondary" style="font-size:0.75rem;padding:5px 12px;background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.2);color:white;">복사하기</button>
                                    </div>
                                    <textarea id="analysis-prompt-text" readonly style="width:100%;height:300px;background:rgba(0,0,0,0.3);color:#e2e8f0;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:15px;font-family:'Consolas',monospace;font-size:0.85rem;line-height:1.6;box-sizing:border-box;"></textarea>
                                    <p style="color:#94a3b8;font-size:0.8rem;margin-top:10px;"><i data-lucide="info" size="13" style="vertical-align:middle;margin-right:4px;"></i> 복사 후 ChatGPT 등에 붙여넣으면 분석 코드를 받을 수 있습니다.</p>
                                </div>

                                <!-- 파트 B: 결과 해석 & 가설 검증 -->
                                <div style="border:2px dashed #c4b5fd;border-radius:15px;padding:30px;background:rgba(250,245,255,0.4);margin-bottom:25px;">
                                    <h3 style="margin-bottom:6px;color:#7c3aed;">🔍 파트 B: 결과 해석 & 가설 검증</h3>
                                    <p class="text-muted" style="margin-bottom:18px;font-size:0.88rem;">코랩에서 분석을 실행한 후, 결과(수치·패턴·그래프 설명 등)를 아래에 입력하세요.</p>
                                    <textarea id="analysis-result-input" placeholder="예: 상관계수 0.72로 강한 양의 상관관계 확인. 버스 정류장 수가 많을수록 혼잡도가 높게 나타남. 군집 3개 중 2번 군집이 가장 혼잡..." style="width:100%;height:120px;background:#ffffff;border:1.5px solid #e2e8f0;border-radius:8px;padding:14px;font-size:0.95rem;line-height:1.5;box-sizing:border-box;"></textarea>
                                    <button id="gen-interp-btn" class="btn-primary" style="margin-top:14px;background:#7c3aed;border-color:#7c3aed;padding:10px 22px;">
                                        <i data-lucide="sparkles" style="vertical-align:middle;margin-right:8px;"></i> 결과 해석 & 가설 검증 프롬프트 생성
                                    </button>
                                </div>

                                <div id="interp-prompt-result" style="display:none;background:#0f172a;border-radius:12px;padding:25px;margin-bottom:25px;">
                                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                                        <h4 style="color:#f8fafc;margin:0;font-size:1rem;">✨ 결과 해석 프롬프트</h4>
                                        <button id="copy-interp-btn" class="btn-secondary" style="font-size:0.75rem;padding:5px 12px;background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.2);color:white;">복사하기</button>
                                    </div>
                                    <textarea id="interp-prompt-text" readonly style="width:100%;height:280px;background:rgba(0,0,0,0.3);color:#e2e8f0;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:15px;font-family:'Consolas',monospace;font-size:0.85rem;line-height:1.6;box-sizing:border-box;"></textarea>
                                    <p style="color:#94a3b8;font-size:0.8rem;margin-top:10px;"><i data-lucide="info" size="13" style="vertical-align:middle;margin-right:4px;"></i> 복사 후 ChatGPT에 붙여넣어 가설 검증 해석을 받으세요.</p>
                                </div>

                                <div id="step6-save-area" style="display:none;background:white;border:1px solid #e2e8f0;border-radius:12px;padding:22px;margin-bottom:10px;">
                                    <h4 style="margin-bottom:12px;font-size:0.95rem;color:var(--secondary);">📝 AI 해석 결과 저장</h4>
                                    <textarea id="step6-interp-answer" placeholder="ChatGPT 등에서 받은 해석 결과를 여기에 붙여넣어 저장하세요..." style="width:100%;height:140px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;padding:14px;font-size:0.93rem;line-height:1.5;box-sizing:border-box;"></textarea>
                                    <div style="text-align:right;margin-top:12px;">
                                        <button id="save-step6-btn" class="btn-primary" style="font-size:0.85rem;padding:8px 28px;background:#7c3aed;border-color:#7c3aed;">기록 저장하기</button>
                                    </div>
                                </div>
                            `;

                            lucide.createIcons();

                            document.getElementById('reset-step6-btn').onclick = () => {
                                state.step6ResearchId = null;
                                onStepChange(stepId);
                            };

                            // 라디오 버튼 스타일
                            canvasInner.querySelectorAll('.analysis-type-label').forEach(label => {
                                label.querySelector('input').addEventListener('change', () => {
                                    canvasInner.querySelectorAll('.analysis-type-label').forEach(l => l.style.borderColor = '#e2e8f0');
                                    label.style.borderColor = 'var(--primary)';
                                    label.style.background = 'var(--primary-glow)';
                                });
                            });

                            // 파트 A: 분석 코드 프롬프트 생성
                            document.getElementById('gen-analysis-btn').onclick = async () => {
                                const typeInput = canvasInner.querySelector('input[name="analysis-type"]:checked');
                                if (!typeInput) { alert('분석 유형을 선택해 주세요.'); return; }
                                const btn = document.getElementById('gen-analysis-btn');
                                btn.disabled = true; btn.innerHTML = '<i class="spinner-sm"></i> 생성 중...';
                                try {
                                    const { fetchAllResearchDatasets } = await import('./auth.js');
                                    const { generateAnalysisCodePrompt } = await import('./research_prompts.js');
                                    const { data: datasets } = await fetchAllResearchDatasets(state.user.student_id);
                                    const prompt = await generateAnalysisCodePrompt(selectedLog, datasets || [], typeInput.value);
                                    const resultEl = document.getElementById('analysis-prompt-result');
                                    resultEl.style.display = 'block';
                                    document.getElementById('analysis-prompt-text').value = prompt;
                                    resultEl.scrollIntoView({ behavior: 'smooth' });
                                    lucide.createIcons();
                                } catch(err) {
                                    alert('프롬프트 생성 오류: ' + err.message);
                                } finally {
                                    btn.disabled = false;
                                    btn.innerHTML = '<i data-lucide="code" style="vertical-align:middle;margin-right:8px;"></i> 분석 코드 프롬프트 생성';
                                    lucide.createIcons();
                                }
                            };

                            document.getElementById('copy-analysis-btn').onclick = () => {
                                navigator.clipboard.writeText(document.getElementById('analysis-prompt-text').value).then(() => {
                                    const btn = document.getElementById('copy-analysis-btn');
                                    btn.innerText = '복사 완료!';
                                    setTimeout(() => btn.innerText = '복사하기', 2000);
                                });
                            };

                            // 파트 B: 결과 해석 프롬프트 생성
                            document.getElementById('gen-interp-btn').onclick = async () => {
                                const result = document.getElementById('analysis-result-input').value.trim();
                                if (!result) { alert('분석 결과를 먼저 입력해 주세요.'); return; }
                                const btn = document.getElementById('gen-interp-btn');
                                btn.disabled = true; btn.innerHTML = '<i class="spinner-sm"></i> 생성 중...';
                                try {
                                    const { generateInterpretationPrompt } = await import('./research_prompts.js');
                                    const prompt = generateInterpretationPrompt(selectedLog, result);
                                    const resultEl = document.getElementById('interp-prompt-result');
                                    resultEl.style.display = 'block';
                                    document.getElementById('interp-prompt-text').value = prompt;
                                    document.getElementById('step6-save-area').style.display = 'block';
                                    resultEl.scrollIntoView({ behavior: 'smooth' });
                                    lucide.createIcons();
                                } catch(err) {
                                    alert('프롬프트 생성 오류: ' + err.message);
                                } finally {
                                    btn.disabled = false;
                                    btn.innerHTML = '<i data-lucide="sparkles" style="vertical-align:middle;margin-right:8px;"></i> 결과 해석 & 가설 검증 프롬프트 생성';
                                    lucide.createIcons();
                                }
                            };

                            document.getElementById('copy-interp-btn').onclick = () => {
                                navigator.clipboard.writeText(document.getElementById('interp-prompt-text').value).then(() => {
                                    const btn = document.getElementById('copy-interp-btn');
                                    btn.innerText = '복사 완료!';
                                    setTimeout(() => btn.innerText = '복사하기', 2000);
                                });
                            };

                            // 저장
                            document.getElementById('save-step6-btn').onclick = () => {
                                const answer = document.getElementById('step6-interp-answer').value.trim();
                                const analysisResult = document.getElementById('analysis-result-input').value.trim();
                                const typeInput = canvasInner.querySelector('input[name="analysis-type"]:checked');
                                if (!answer) { alert('저장할 내용을 입력해 주세요.'); return; }
                                state.onSaveRecord(stepId, JSON.stringify({
                                    researchLogId: state.step6ResearchId,
                                    analysisType: typeInput?.value || '',
                                    analysisResult,
                                    interpretationAnswer: answer
                                }));
                            };

                            return;
                        }
                    }

                    // 목록 화면
                    canvasInner.innerHTML = `
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                            <h2>6단계: AI 데이터 분석</h2>
                        </div>
                        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:25px;">
                            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 18px;">
                                <div style="font-size:0.75rem;font-weight:700;color:#16a34a;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">6단계 역할</div>
                                <div style="font-size:0.88rem;color:#166534;line-height:1.55;">5단계의 전처리 데이터를 분석하고 결과를 해석해 <strong>가설을 검증</strong>합니다. 8단계 정책 제안의 핵심 근거가 됩니다.</div>
                            </div>
                            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px 18px;">
                                <div style="font-size:0.75rem;font-weight:700;color:#1d4ed8;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">파트 A</div>
                                <div style="font-size:0.88rem;color:#1e3a8a;line-height:1.55;">분석 유형(상관관계/집계·비교/회귀/군집) 선택 → <strong>코랩 분석 코드 프롬프트</strong> 생성</div>
                            </div>
                            <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;padding:16px 18px;">
                                <div style="font-size:0.75rem;font-weight:700;color:#7c3aed;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">파트 B</div>
                                <div style="font-size:0.88rem;color:#4c1d95;line-height:1.55;">분석 결과 입력 → AI가 <strong>가설 지지/기각</strong> 및 정책 시사점 해석 프롬프트 생성</div>
                            </div>
                        </div>
                        <div style="margin-bottom:20px;">
                            <h4 style="margin-bottom:15px;display:flex;align-items:center;gap:8px;">
                                <i data-lucide="list-checks" size="18"></i> 분석할 연구 주제 선택
                            </h4>
                            <div style="display:grid;gap:15px;">
                                ${logs.map(log => {
                                    let d; try { d = JSON.parse(log.content); } catch(e) { d = { answer: log.content }; }
                                    const dateStr = new Date(log.created_at).toLocaleString();
                                    return `
                                        <div class="glass card" data-id="${log.id}" style="padding:20px;cursor:pointer;border-left:4px solid var(--glass-border);transition:all 0.2s;">
                                            <span style="font-size:0.8rem;color:var(--primary);font-weight:500;">
                                                <i data-lucide="clock" size="12" style="vertical-align:middle;"></i> ${dateStr}
                                            </span>
                                            <div style="margin:10px 0 8px;">
                                                <strong style="font-size:0.9rem;color:var(--secondary);">분석 관점:</strong>
                                                <p style="font-size:0.95rem;margin:4px 0 0;color:var(--text);">${d.opinion || '의견 없음'}</p>
                                            </div>
                                            <p style="font-size:0.88rem;color:#64748b;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin:0;">${d.answer}</p>
                                            <div style="text-align:right;margin-top:14px;">
                                                <button class="btn-primary step6-select-btn" data-id="${log.id}" style="font-size:0.8rem;padding:6px 15px;">선택하기</button>
                                            </div>
                                        </div>`;
                                }).join('')}
                            </div>
                        </div>`;

                    lucide.createIcons();

                    canvasInner.querySelectorAll('.step6-select-btn').forEach(btn => {
                        btn.onclick = (e) => {
                            e.stopPropagation();
                            state.step6ResearchId = btn.dataset.id;
                            onStepChange(stepId);
                        };
                    });
                }, 50);
                break;
            case 6: // 7단계: 시각화
                content = `<h2>7단계: 시각화</h2><div class="glass" style="padding:30px;"><p>분석 데이터의 시각적 요약 단계입니다.</p></div>`;
                break;
            case 7: // 8단계: 정책 제안
                content = `<h2>8단계: 정책 및 인사이트 제안</h2><div class="glass" style="padding:30px;"><p>최종 제안서 작성 단계입니다.</p></div>`;
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

                    const renderViewMode = (app, isMemberView = false) => {
                        const team = app.team_data || [];
                        const isCompleted = app.status === 'completed';

                        root.innerHTML = `
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                                <div>
                                    <h2>${isMemberView ? '👥 우리 팀 참가 신청 현황' : isCompleted ? '🔒 접수 완료 (수정 불가)' : '✅ 대회 참가 신청 완료'}</h2>
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

                        if (!isMemberView && !isCompleted) {
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
                    else if (memberApp) renderViewMode(memberApp, true);
                    else renderApplyMode();
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
                                                                                <span style="font-size:0.7rem; color:#94a3b8;">(${(file.file_size/1024).toFixed(1)} KB)</span>
                                                                            </div>
                                                                        </button>
                                                                    `).join('')}
                                                                </div>
                                                            </div>

                                                            ${(() => {
                                                                const userStr = localStorage.getItem('currentUser');
                                                                const user = userStr ? JSON.parse(userStr) : {};
                                                                
                                                                // 1. 작성자 본인 확인
                                                                const isAuthor = user.student_id && user.student_id === post.author_id;
                                                                
                                                                // 2. 교사 권한 확인 (데이터 구조 또는 현재 화면이 교사용 섹션인지 확인)
                                                                const teacherSection = document.getElementById('teacher-section');
                                                                const isTeacherView = teacherSection && teacherSection.style.display !== 'none';
                                                                const isTeacherUser = (user.email && !user.student_id) || user.role === 'teacher';
                                                                
                                                                if (isAuthor || isTeacherView || isTeacherUser) {
                                                                    return `
                                                                        <div style="margin-top:25px; padding-top:20px; border-top:1px solid #e2e8f0; text-align:right;">
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
                                    }
                                };
                                row.onmouseover = () => { if(document.getElementById(`detail-${row.dataset.id}`).style.display === 'none') row.style.background = '#f8fafc'; };
                                row.onmouseout = () => { if(document.getElementById(`detail-${row.dataset.id}`).style.display === 'none') row.style.background = 'white'; };
                            });
                        }
                        if (window.lucide) lucide.createIcons();
                    };

                    await loadBoard();

                    // [자료 공유하기] 버튼 클릭 시 모달 열기
                    document.getElementById('create-share-post-btn').onclick = () => {
                        const modal = document.createElement('div');
                        modal.className = 'modal-overlay';
                        modal.innerHTML = `
                            <div class="modal-content" style="max-width:600px;">
                                <div class="modal-header">
                                    <h2>✨ 새로운 연구 자료 공유</h2>
                                    <button class="close-modal" style="background:none;border:none;cursor:pointer;"><i data-lucide="x"></i></button>
                                </div>
                                <div class="modal-body"> <!-- 스크롤 가능 구역 추가 -->
                                    <div class="modal-body-inner">
                                        <div style="display:flex;flex-direction:column;gap:20px;">
                                            <div>
                                                <label style="display:block;font-size:0.9rem;font-weight:700;margin-bottom:8px;">공유 제목</label>
                                                <input type="text" id="share-title" placeholder="연구 주제나 핵심 결과물을 한 줄로 설명해주세요." style="width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:8px;">
                                            </div>
                                            <div>
                                                <label style="display:block;font-size:0.9rem;font-weight:700;margin-bottom:8px;">설명 (선택)</label>
                                                <textarea id="share-content" placeholder="어떤 파일인지, 어떻게 활용하면 좋은지 설명해주세요." style="width:100%;height:100px;padding:12px;border:1px solid #cbd5e1;border-radius:8px;resize:none;"></textarea>
                                            </div>
                                            <div>
                                                <label style="display:block;font-size:0.9rem;font-weight:700;margin-bottom:8px;">파일 첨부 (여러 개 선택 가능)</label>
                                                <div id="drop-zone" style="border:2px dashed #cbd5e1;border-radius:12px;padding:30px;text-align:center;background:#f8fafc;cursor:pointer;transition:all 0.2s;">
                                                    <i data-lucide="upload-cloud" size="32" style="color:#94a3b8;margin-bottom:10px;"></i>
                                                    <p style="font-size:0.85rem;color:#64748b;">여기에 파일을 끌어다 놓거나 클릭하여 선택하세요.</p>
                                                    <input type="file" id="share-files" multiple style="display:none;">
                                                </div>
                                                <div id="file-list-preview" style="margin-top:12px;display:flex;flex-direction:column;gap:5px;"></div>
                                            </div>
                                        </div>
                                        <div style="margin-top:30px;display:flex;gap:10px;padding-bottom:10px;">
                                            <button id="cancel-share-btn" class="btn-secondary" style="flex:1;">취소</button>
                                            <button id="submit-share-btn" class="btn-primary" style="flex:2;">📤 자료 업로드 및 공유하기</button>
                                        </div>
                                    </div>
                                </div>
                            </div>`;
                        document.body.appendChild(modal);
                        if (window.lucide) lucide.createIcons();

                        const fileInput = modal.querySelector('#share-files');
                        const dropZone = modal.querySelector('#drop-zone');
                        const preview = modal.querySelector('#file-list-preview');
                        let selectedFiles = [];

                        const updatePreview = () => {
                            preview.innerHTML = selectedFiles.map((f, i) => `
                                <div style="display:flex;justify-content:space-between;align-items:center;background:white;padding:8px 12px;border-radius:6px;border:1px solid #e2e8f0;font-size:0.85rem;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <i data-lucide="file" size="14"></i>
                                        <span>${f.name} <small style="color:#94a3b8;">(${(f.size/1024).toFixed(1)} KB)</small></span>
                                    </div>
                                    <button class="remove-file" data-index="${i}" style="background:none;border:none;color:#ef4444;cursor:pointer;"><i data-lucide="trash-2" size="14"></i></button>
                                </div>`).join('');
                            if (window.lucide) lucide.createIcons();
                            
                            preview.querySelectorAll('.remove-file').forEach(btn => {
                                btn.onclick = () => {
                                    selectedFiles.splice(parseInt(btn.dataset.index), 1);
                                    updatePreview();
                                };
                            });
                        };

                        dropZone.onclick = () => fileInput.click();
                        fileInput.onchange = (e) => {
                            selectedFiles = [...selectedFiles, ...Array.from(e.target.files)];
                            updatePreview();
                        };

                        modal.querySelector('.close-modal').onclick = () => modal.remove();
                        modal.querySelector('#cancel-share-btn').onclick = () => modal.remove();
                        
                        modal.querySelector('#submit-share-btn').onclick = async (e) => {
                            const title = modal.querySelector('#share-title').value.trim();
                            const content = modal.querySelector('#share-content').value.trim();
                            
                            if (!title) { alert('제목을 입력해주세요.'); return; }
                            if (selectedFiles.length === 0) { alert('최소 하나 이상의 파일을 첨부해야 합니다.'); return; }

                            const btn = e.target;
                            const origText = btn.innerHTML;
                            btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;"></div> 업로드 중...';
                            btn.disabled = true;

                            const { createSharedPost } = await import('./auth.js');
                            const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
                            
                            const { success, error } = await createSharedPost(
                                title, 
                                content, 
                                user.student_id || 'teacher', 
                                user.name || '선생님', 
                                selectedFiles
                            );

                            if (success) {
                                alert('성공적으로 자료를 공유했습니다!');
                                modal.remove();
                                await loadBoard();
                            } else {
                                alert('업로드 실패: ' + (error.message || '알 수 없는 오류'));
                                btn.innerHTML = origText;
                                btn.disabled = false;
                            }
                        };
                    };

                }, 0);
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

    canvas.innerHTML = `
        <div style="display: flex; flex-direction: column; height: 100%;">
            <div style="flex: 1;">${content}</div>
        </div>
    `;

    if (window.lucide) lucide.createIcons();

    const saveBtn = document.getElementById('save-memo-btn');
    if (saveBtn) {
        saveBtn.onclick = () => {
            const memo = document.getElementById('step-memo').value;
            if (stepId === 3) {
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
