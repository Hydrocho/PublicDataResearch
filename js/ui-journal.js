export async function renderResearchJournal(containerId, state, options = {}) {
    const root = document.getElementById(containerId);
    if (!root) return;

    root.innerHTML = `
        <div style="max-width: 900px; margin: 0 auto; padding: 20px; animation: fadeIn 0.5s ease-out;">
            <div style="text-align: center; margin-bottom: 45px;">
                <h1 style="font-size: 2.5rem; color: var(--secondary); margin-bottom: 12px; font-weight: 800;">📊 데이터 연구 프로젝트 안내</h1>
                <p style="font-size: 1.15rem; color: #64748b; max-width: 600px; margin: 0 auto; line-height: 1.6;">공공데이터를 활용하여 실생활의 문제를 발견하고 데이터 기반의 해결책을 제안하는 창의적인 연구를 시작합니다.</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr; gap: 28px; margin-bottom: 45px;">
                <div class="glass card" style="width: 98%; margin: 0 auto; padding: 28px; border-top: 4px solid var(--primary);">
                    <div style="background: var(--primary-glow); color: var(--primary); width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                        <i data-lucide="search" size="26"></i>
                    </div>
                    <h3 style="margin-bottom: 14px; font-size: 1.25rem;">1. 무엇을 연구하나요?</h3>
                    <p style="font-size: 1rem; color: #475569; line-height: 1.7; margin: 0;">우리 주변의 불편함이나 궁금증을 공공데이터를 통해 확인하고, 분석 결과를 바탕으로 해결책을 제안하거나 새로운 사실을 발견합니다.</p>
                </div>

                <div class="glass card" style="width: 98%; margin: 0 auto; padding: 28px; border-top: 4px solid #10b981;">
                    <div style="background: #ecfdf5; color: #10b981; width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                        <i data-lucide="database" size="26"></i>
                    </div>
                    <h3 style="margin-bottom: 14px; font-size: 1.25rem;">2. 공공데이터란?</h3>
                    <p style="font-size: 1rem; color: #475569; line-height: 1.7; margin: 0;">국가나 지방자치단체, 공공기관이 보유하고 있는 정보입니다. 교통량, 날씨, 미세먼지, 학교 현황 등 방대한 자료들이 개방되어 있습니다.</p>
                </div>
            </div>

            <!-- Detailed Methodology Integration -->
            <div style="margin-bottom: 50px;">
                <h3 style="text-align: center; font-size: 1.6rem; color: var(--secondary); margin-bottom: 30px; font-weight: 700;">💡 데이터 연구 분석 프로세스</h3>
                <div style="display: grid; grid-template-columns: 1fr; gap: 25px;">
                    <!-- Step 1 -->
                    <div class="method-card glass" style="width: 98%; margin: 0 auto; display: flex; gap: 25px; padding: 25px; border-radius: 20px; border: 1px solid #e2e8f0; transition: all 0.3s ease;">
                        <div style="flex-shrink: 0; background: #6366f1; color: white; width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 900;">1</div>
                        <div>
                            <h4 style="font-size: 1.2rem; color: #1e293b; margin-bottom: 8px;">연구 문제 정의 및 가설 설정</h4>
                            <p style="color: #475569; line-height: 1.6; margin-bottom: 10px; font-size: 0.95rem;">궁금증을 구체적인 질문으로 만들고, 확인하고 싶은 <strong>가설</strong>을 세웁니다.</p>
                            <div style="background: #f8fafc; padding: 10px 15px; border-radius: 8px; border-left: 3px solid #6366f1; font-size: 0.88rem; color: #64748b;">
                                "○○일수록 △△할 것이다" 형태의 문장을 만들어보세요.
                            </div>
                        </div>
                    </div>
                    <!-- Step 2 -->
                    <div class="method-card glass" style="width: 98%; margin: 0 auto; display: flex; gap: 25px; padding: 25px; border-radius: 20px; border: 1px solid #e2e8f0; transition: all 0.3s ease;">
                        <div style="flex-shrink: 0; background: #06b6d4; color: white; width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 900;">2</div>
                        <div>
                            <h4 style="font-size: 1.2rem; color: #1e293b; margin-bottom: 8px;">공공데이터 수집 및 적합성 검토</h4>
                            <p style="color: #475569; line-height: 1.6; margin-bottom: 10px; font-size: 0.95rem;">연구 목적에 맞는 데이터셋을 찾고 기간, 지역 범위 등을 확인합니다.</p>
                            <div style="background: #f8fafc; padding: 10px 15px; border-radius: 8px; border-left: 3px solid #06b6d4; font-size: 0.88rem; color: #64748b;">
                                공공데이터포털 등에서 CSV 형식으로 수집하세요.
                            </div>
                        </div>
                    </div>
                    <!-- Step 3 -->
                    <div class="method-card glass" style="width: 98%; margin: 0 auto; display: flex; gap: 25px; padding: 25px; border-radius: 20px; border: 1px solid #e2e8f0; transition: all 0.3s ease;">
                        <div style="flex-shrink: 0; background: #f59e0b; color: white; width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 900;">3</div>
                        <div>
                            <h4 style="font-size: 1.2rem; color: #1e293b; margin-bottom: 8px;">데이터 전처리 (Preprocessing)</h4>
                            <p style="color: #475569; line-height: 1.6; margin-bottom: 10px; font-size: 0.95rem;">불필요한 열 삭제, 결측치 정리 등 데이터를 깨끗하게 정제합니다.</p>
                            <div style="background: #f8fafc; padding: 10px 15px; border-radius: 8px; border-left: 3px solid #f59e0b; font-size: 0.88rem; color: #64748b;">
                                깨끗한 데이터가 정확한 분석 결과를 만듭니다.
                            </div>
                        </div>
                    </div>
                    <!-- Step 4 -->
                    <div class="method-card glass" style="width: 98%; margin: 0 auto; display: flex; gap: 25px; padding: 25px; border-radius: 20px; border: 1px solid #e2e8f0; transition: all 0.3s ease;">
                        <div style="flex-shrink: 0; background: #10b981; color: white; width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 900;">4</div>
                        <div>
                            <h4 style="font-size: 1.2rem; color: #1e293b; margin-bottom: 8px;">데이터 분석 및 시각화</h4>
                            <p style="color: #475569; line-height: 1.6; margin-bottom: 10px; font-size: 0.95rem;">통계적 방법으로 가설을 검증하고 차트로 시각화합니다.</p>
                            <div style="background: #f8fafc; padding: 10px 15px; border-radius: 8px; border-left: 3px solid #10b981; font-size: 0.88rem; color: #64748b;">
                                데이터 속에서 유의미한 패턴을 발견하세요.
                            </div>
                        </div>
                    </div>
                    <!-- Step 5 -->
                    <div class="method-card glass" style="width: 98%; margin: 0 auto; display: flex; gap: 25px; padding: 25px; border-radius: 20px; border: 1px solid #e2e8f0; transition: all 0.3s ease;">
                        <div style="flex-shrink: 0; background: #8b5cf6; color: white; width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 900;">5</div>
                        <div>
                            <h4 style="font-size: 1.2rem; color: #1e293b; margin-bottom: 8px;">결론 도출 및 제언</h4>
                            <p style="color: #475569; line-height: 1.6; margin-bottom: 10px; font-size: 0.95rem;">가설 채택 여부를 결정하고 해결 방안을 제시합니다.</p>
                            <div style="background: #f8fafc; padding: 10px 15px; border-radius: 8px; border-left: 3px solid #8b5cf6; font-size: 0.88rem; color: #64748b;">
                                객관적인 결론에 나만의 생각을 덧붙이세요.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="glass card" style="width: 98%; margin: 0 auto; padding: 35px; margin-bottom: 50px; border-left: 6px solid var(--primary); position: relative; overflow: hidden;">
                <div style="position: absolute; right: -20px; top: -20px; opacity: 0.05;">
                    <i data-lucide="map" size="150"></i>
                </div>
                <h3 style="margin-bottom: 25px; display: flex; align-items: center; gap: 12px; font-size: 1.35rem;">
                    <i data-lucide="map" size="26" style="color: var(--primary);"></i>
                    연구 진행 단계 (Workflow)
                </h3>
                <div style="display: flex; flex-direction: column; gap: 20px; position: relative; z-index: 1;">
                    <div style="display: flex; gap: 20px; align-items: flex-start;">
                        <div style="background: var(--primary); color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.9rem; font-weight: 900; margin-top: 2px; box-shadow: 0 4px 10px var(--primary-glow);">1</div>
                        <div>
                            <strong style="display: block; margin-bottom: 5px; font-size: 1.05rem;">데이터 탐색</strong>
                            <span style="font-size: 0.92rem; color: #64748b; line-height: 1.5;">다양한 분야의 데이터 아이디어를 살펴보고 나만의 연구 주제를 정합니다.</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 20px; align-items: flex-start;">
                        <div style="background: var(--primary); color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.9rem; font-weight: 900; margin-top: 2px; box-shadow: 0 4px 10px var(--primary-glow);">2</div>
                        <div>
                            <strong style="display: block; margin-bottom: 5px; font-size: 1.05rem;">데이터 수집 및 관리</strong>
                            <span style="font-size: 0.92rem; color: #64748b; line-height: 1.5;">분석에 필요한 공공데이터 파일을 찾아서 수집하고 체계적으로 관리합니다.</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 20px; align-items: flex-start;">
                        <div style="background: var(--primary); color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.9rem; font-weight: 900; margin-top: 2px; box-shadow: 0 4px 10px var(--primary-glow);">3</div>
                        <div>
                            <strong style="display: block; margin-bottom: 5px; font-size: 1.05rem;">연구 일지 작성</strong>
                            <span style="font-size: 0.92rem; color: #64748b; line-height: 1.5;">가설을 세우고 데이터를 정제·분석하는 모든 과정을 기록으로 남깁니다.</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 20px; align-items: flex-start;">
                        <div style="background: var(--primary); color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.9rem; font-weight: 900; margin-top: 2px; box-shadow: 0 4px 10px var(--primary-glow);">4</div>
                        <div>
                            <strong style="display: block; margin-bottom: 5px; font-size: 1.05rem;">결과 공유</strong>
                            <span style="font-size: 0.92rem; color: #64748b; line-height: 1.5;">분석 결과 파일과 유용한 참고 사이트를 다른 연구자들과 자유롭게 공유합니다.</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <style>
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .btn-primary:hover { transform: translateY(-3px); }
            .method-card:hover {
                transform: translateX(10px);
                border-color: #cbd5e1;
                box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                background: white;
            }
        </style>
    `;

    if (window.lucide) lucide.createIcons();
}
