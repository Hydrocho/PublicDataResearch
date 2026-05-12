export function renderMethodologyGuide(containerId, state) {
    const root = document.getElementById(containerId);
    if (!root) return;

    root.innerHTML = `
        <div style="max-width: 950px; margin: 0 auto; padding: 20px; animation: fadeIn 0.5s ease-out;">
            <div style="text-align: center; margin-bottom: 50px;">
                <h1 style="font-size: 2.8rem; color: var(--secondary); margin-bottom: 15px; font-weight: 800; letter-spacing: -0.02em;">💡 데이터 연구 분석 방법 안내</h1>
                <p style="font-size: 1.2rem; color: #64748b; max-width: 700px; margin: 0 auto; line-height: 1.7;">공공데이터를 활용한 성공적인 연구를 위해 일반적으로 권장되는 분석 프로세스를 안내합니다.</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr; gap: 30px; margin-bottom: 60px;">
                <!-- Step 1 -->
                <div class="method-card glass" style="width: 98%; margin: 0 auto; display: flex; gap: 30px; padding: 35px; border-radius: 24px; border: 1px solid #e2e8f0; transition: all 0.3s ease;">
                    <div style="flex-shrink: 0; background: #6366f1; color: white; width: 60px; height: 60px; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; font-weight: 900; box-shadow: 0 10px 20px rgba(99, 102, 241, 0.2);">1</div>
                    <div>
                        <h3 style="font-size: 1.4rem; color: #1e293b; margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
                            <i data-lucide="target" size="24" style="color: #6366f1;"></i>
                            연구 문제 정의 및 가설 설정
                        </h3>
                        <p style="color: #475569; line-height: 1.7; margin-bottom: 15px; font-size: 1.05rem;">실생활에서 발견한 궁금증을 구체적인 연구 질문으로 만들고, 데이터 분석을 통해 확인하고 싶은 <strong>가설(Hypothesis)</strong>을 세웁니다.</p>
                        <div style="background: #f8fafc; padding: 15px 20px; border-radius: 12px; border-left: 4px solid #6366f1;">
                            <span style="font-size: 0.9rem; color: #6366f1; font-weight: 700; display: block; margin-bottom: 5px;">Key Activity</span>
                            <span style="font-size: 0.92rem; color: #64748b;">"○○일수록 △△할 것이다" 형태의 검증 가능한 문장을 만들어보세요.</span>
                        </div>
                    </div>
                </div>

                <!-- Step 2 -->
                <div class="method-card glass" style="width: 98%; margin: 0 auto; display: flex; gap: 30px; padding: 35px; border-radius: 24px; border: 1px solid #e2e8f0; transition: all 0.3s ease;">
                    <div style="flex-shrink: 0; background: #06b6d4; color: white; width: 60px; height: 60px; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; font-weight: 900; box-shadow: 0 10px 20px rgba(6, 182, 212, 0.2);">2</div>
                    <div>
                        <h3 style="font-size: 1.4rem; color: #1e293b; margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
                            <i data-lucide="download-cloud" size="24" style="color: #06b6d4;"></i>
                            공공데이터 수집 및 적합성 검토
                        </h3>
                        <p style="color: #475569; line-height: 1.7; margin-bottom: 15px; font-size: 1.05rem;">가설 검증에 필요한 변수들이 포함된 공공데이터셋을 찾습니다. 데이터의 기간, 지역 범위, 단위 등이 연구 목적에 맞는지 확인합니다.</p>
                        <div style="background: #f8fafc; padding: 15px 20px; border-radius: 12px; border-left: 4px solid #06b6d4;">
                            <span style="font-size: 0.9rem; color: #06b6d4; font-weight: 700; display: block; margin-bottom: 5px;">Key Activity</span>
                            <span style="font-size: 0.92rem; color: #64748b;">공공데이터포털(data.go.kr)이나 KOSIS에서 CSV 파일 형식으로 수집하세요.</span>
                        </div>
                    </div>
                </div>

                <!-- Step 3 -->
                <div class="method-card glass" style="width: 98%; margin: 0 auto; display: flex; gap: 30px; padding: 35px; border-radius: 24px; border: 1px solid #e2e8f0; transition: all 0.3s ease;">
                    <div style="flex-shrink: 0; background: #f59e0b; color: white; width: 60px; height: 60px; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; font-weight: 900; box-shadow: 0 10px 20px rgba(245, 158, 11, 0.2);">3</div>
                    <div>
                        <h3 style="font-size: 1.4rem; color: #1e293b; margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
                            <i data-lucide="layers" size="24" style="color: #f59e0b;"></i>
                            데이터 전처리 (Data Preprocessing)
                        </h3>
                        <p style="color: #475569; line-height: 1.7; margin-bottom: 15px; font-size: 1.05rem;">수집한 데이터에서 분석에 불필요한 열을 삭제하고, 비어있는 값(결측치)이나 잘못된 값(이상치)을 정리합니다. 필요 시 여러 데이터를 하나로 결합합니다.</p>
                        <div style="background: #f8fafc; padding: 15px 20px; border-radius: 12px; border-left: 4px solid #f59e0b;">
                            <span style="font-size: 0.9rem; color: #f59e0b; font-weight: 700; display: block; margin-bottom: 5px;">Key Activity</span>
                            <span style="font-size: 0.92rem; color: #64748b;">'Garbage In, Garbage Out' - 깨끗한 데이터가 정확한 분석 결과를 만듭니다.</span>
                        </div>
                    </div>
                </div>

                <!-- Step 4 -->
                <div class="method-card glass" style="width: 98%; margin: 0 auto; display: flex; gap: 30px; padding: 35px; border-radius: 24px; border: 1px solid #e2e8f0; transition: all 0.3s ease;">
                    <div style="flex-shrink: 0; background: #10b981; color: white; width: 60px; height: 60px; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; font-weight: 900; box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2);">4</div>
                    <div>
                        <h3 style="font-size: 1.4rem; color: #1e293b; margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
                            <i data-lucide="bar-chart-3" size="24" style="color: #10b981;"></i>
                            데이터 분석 및 시각화
                        </h3>
                        <p style="color: #475569; line-height: 1.7; margin-bottom: 15px; font-size: 1.05rem;">상관분석, 비교분석 등 통계적 방법을 통해 가설을 검증합니다. 분석 결과를 막대그래프, 선그래프, 산점도 등으로 시각화하여 한눈에 알아보기 쉽게 표현합니다.</p>
                        <div style="background: #f8fafc; padding: 15px 20px; border-radius: 12px; border-left: 4px solid #10b981;">
                            <span style="font-size: 0.9rem; color: #10b981; font-weight: 700; display: block; margin-bottom: 5px;">Key Activity</span>
                            <span style="font-size: 0.92rem; color: #64748b;">수치로만 보던 데이터 속에서 유의미한 패턴과 추세를 발견하세요.</span>
                        </div>
                    </div>
                </div>

                <!-- Step 5 -->
                <div class="method-card glass" style="width: 98%; margin: 0 auto; display: flex; gap: 30px; padding: 35px; border-radius: 24px; border: 1px solid #e2e8f0; transition: all 0.3s ease;">
                    <div style="flex-shrink: 0; background: #8b5cf6; color: white; width: 60px; height: 60px; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; font-weight: 900; box-shadow: 0 10px 20px rgba(139, 92, 246, 0.2);">5</div>
                    <div>
                        <h3 style="font-size: 1.4rem; color: #1e293b; margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
                            <i data-lucide="file-check-2" size="24" style="color: #8b5cf6;"></i>
                            결론 도출 및 제언
                        </h3>
                        <p style="color: #475569; line-height: 1.7; margin-bottom: 15px; font-size: 1.05rem;">분석 결과를 토대로 가설의 채택 여부를 결정하고, 연구의 의의와 한계점을 정리합니다. 발견된 문제에 대한 실질적인 정책 제안이나 해결 방안을 제시합니다.</p>
                        <div style="background: #f8fafc; padding: 15px 20px; border-radius: 12px; border-left: 4px solid #8b5cf6;">
                            <span style="font-size: 0.9rem; color: #8b5cf6; font-weight: 700; display: block; margin-bottom: 5px;">Key Activity</span>
                            <span style="font-size: 0.92rem; color: #64748b;">데이터가 말해주는 객관적인 결론을 바탕으로 나만의 생각을 덧붙이세요.</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <style>
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
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
