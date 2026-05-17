import os

filepath = r"c:\POS_printer_Project\POS_Printer_Edu\my-praise-land\public\Ext_App\PublicDataResearch\projectInfo.html"

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Keep lines 1-1074 (0-indexed: 0-1073), replace from line 1075 onward
keep = lines[:1074]

new_content = r'''
                <div class="loop-group">
                    <div class="loop-group-desc">필요 시 아래 두 단계를 반복하며 분석을 완성하세요.</div>

                    <div class="timeline-item">
                        <div class="timeline-number">9</div>
                        <div class="timeline-content">
                            <div class="timeline-title-row">
                                <h3>분석 지표 정교화하기</h3>
                                <a class="small-link" href="https://colab.research.google.com/?hl=ko" target="_blank"
                                    rel="noopener noreferrer">Google Colab 바로가기</a>
                            </div>
                            <p>시각화 결과를 바탕으로 지표의 한계를 보완하고, 데이터의 편중이나 왜곡을 줄이기 위해 가중치를 조정하거나 새로운 파생 변수를 추가하여 분석의 정확도를 높입니다.</p>
                            <div class="prompt-examples">
                                <div class="prompt-header">
                                    <strong>Colab Gemini 명령어</strong>
                                    <button class="copy-btn" onclick="copyPrompt(this)">복사하기</button>
                                </div>
                                <p>시각화 결과를 분석하여, 현재 지표의 한계점을 찾아줘. 그리고 가중치 조정이나 새로운 파생 변수 추가 등을 통해 지표를 정교화하는 코드를 작성해줘.</p>
                            </div>
                            <div class="tag-list">
                                <span class="tag">가중치 조정</span>
                                <span class="tag">파생 변수</span>
                                <span class="tag">지표 보완</span>
                            </div>
                        </div>
                    </div>

                    <div class="timeline-item">
                        <div class="timeline-number">10</div>
                        <div class="timeline-content">
                            <div class="timeline-title-row">
                                <h3>정교화된 지표 시각화하기</h3>
                                <a class="small-link" href="https://colab.research.google.com/?hl=ko" target="_blank"
                                    rel="noopener noreferrer">Google Colab 바로가기</a>
                            </div>
                            <p>정교화된 분석 지표의 통계적 유의성을 다시 한번 확인하고, 가장 명확한 증거를 보여줄 수 있는 시각화 자료를 만듭니다.</p>
                            <div class="prompt-examples">
                                <div class="prompt-header">
                                    <strong>Colab Gemini 명령어</strong>
                                    <button class="copy-btn" onclick="copyPrompt(this)">복사하기</button>
                                </div>
                                <p>나눔(Nanum) 폰트 설치 및 한글 깨짐 방지를 적용하여, 정교화된 분석 지표를 시각화하는 코드를 작성해줘. 초기 시각화와 비교할 수 있도록 해줘.</p>
                            </div>
                            <div class="tag-list">
                                <span class="tag">정교화 시각화</span>
                                <span class="tag">비교 분석</span>
                                <span class="tag">최종 그래프</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="timeline-item">
                    <div class="timeline-number">11</div>
                    <div class="timeline-content">
                        <div class="timeline-title-row">
                            <h3>분석 지표 변화 비교·서술하기</h3>
                            <a class="small-link" href="https://notebooklm.google.com/" target="_blank"
                                rel="noopener noreferrer">NotebookLM 바로가기</a>
                        </div>
                        <p>초기 지표부터 최종 정교화된 지표까지의 변화 과정을 비교하고, 각 단계에서 수정한 이유와 분석 결과가 어떻게 고도화되었는지를 정리합니다.</p>
                        <div class="prompt-examples">
                            <div class="prompt-header">
                                <strong>NotebookLM 예시 질문</strong>
                                <button class="copy-btn" onclick="copyPrompt(this)">복사하기</button>
                            </div>
                            <p>초기 분석 지표부터 최종 정교화된 지표까지의 단계별 변화 과정을 비교해줘. 각 단계에서 지표를 수정한 이유(근거)와 그에 따라 분석 결과가 어떻게 고도화되었는지를 정리하여 보고서 초안을 작성해줘. 그리고 작성한 내용을 노트북 셀에 작성해줘.</p>
                        </div>
                        <div class="tag-list">
                            <span class="tag">지표 비교</span>
                            <span class="tag">변화 근거</span>
                            <span class="tag">보고서 초안</span>
                        </div>
                    </div>
                </div>

                <div class="timeline-item">
                    <div class="timeline-number">12</div>
                    <div class="timeline-content">
                        <div class="timeline-title-row">
                            <h3>결과 해석하기</h3>
                            <a class="small-link" href="https://colab.research.google.com/?hl=ko" target="_blank"
                                rel="noopener noreferrer">Google Colab 바로가기</a>
                        </div>
                        <p>그래프와 통계 분석 결과가 무엇을 의미하는지 해석하고, 탐구 질문이나 가설에 대한 답을 정리합니다.</p>
                        <div class="prompt-examples">
                            <div class="prompt-header">
                                <strong>Colab Gemini 명령어</strong>
                                <button class="copy-btn" onclick="copyPrompt(this)">복사하기</button>
                            </div>
                            <p>분석 결과와 시각화 자료를 바탕으로 탐구 질문(가설)에 대한 답을 이해하기 쉽도록 해석해줘. 그리고 작성한 내용을 노트북 셀에 작성해줘.</p>
                        </div>
                        <div class="tag-list">
                            <span class="tag">결과 요약</span>
                            <span class="tag">의미 해석</span>
                            <span class="tag">가설 판단</span>
                        </div>
                    </div>
                </div>

                <div class="timeline-item">
                    <div class="timeline-number">13</div>
                    <div class="timeline-content">
                        <div class="timeline-title-row">
                            <h3>정책 또는 앱 기획하기</h3>
                            <a class="small-link" href="https://colab.research.google.com/?hl=ko" target="_blank"
                                rel="noopener noreferrer">Google Colab 바로가기</a>
                        </div>
                        <p>분석 결과를 바탕으로 실제 문제 해결을 위한 정책 방안을 수립하고, 이 정책을 실생활에서 구현하거나 시민들이 체감할 수 있도록 돕는 웹앱 서비스 아이디어를 제안합니다.</p>
                        <div class="prompt-examples">
                            <div class="prompt-header">
                                <strong>Colab Gemini 명령어</strong>
                                <button class="copy-btn" onclick="copyPrompt(this)">복사하기</button>
                            </div>
                            <p>분석 결과와 기존 연구 비교 내용을 바탕으로 정책 또는 앱 아이디어를 제안해줘. 제안 내용은 제안 배경, 주요 내용, 기대 효과로 나누어 정리해줘. 그리고 작성한 내용을 노트북 셀에 작성해줘.</p>
                        </div>
                        <div class="tag-list">
                            <span class="tag">정책 제안</span>
                            <span class="tag">앱 아이디어</span>
                            <span class="tag">기대 효과</span>
                            <span class="tag">실행 방안</span>
                        </div>
                    </div>
                </div>

                <div class="timeline-item">
                    <div class="timeline-number">14</div>
                    <div class="timeline-content">
                        <div class="timeline-title-row">
                            <h3>웹앱 기획 및 데이터 자산 패키징</h3>
                            <a class="small-link" href="https://colab.research.google.com/?hl=ko" target="_blank"
                                rel="noopener noreferrer">Google Colab 바로가기</a>
                        </div>
                        <p>외부 AI(Claude, ChatGPT 등)에게 웹 개발을 의뢰하기 위한 '전문가용 지시서(guide.txt)'와 '분석 데이터(data.json)'를 생성하여 webapp 폴더에 패키징합니다.</p>
                        <div class="prompt-examples">
                            <div class="prompt-header">
                                <strong>Colab Gemini 명령어</strong>
                                <button class="copy-btn" onclick="copyPrompt(this)">복사하기</button>
                            </div>
                            <p>앞서 수행한 분석 결과와 정책 제안 내용을 바탕으로, 웹앱 개발자에게 전달할 '기술 구현 명세서(guide.txt)'를 작성해줘. 그리고 시각화에 필요한 핵심 데이터를 JSON 형식(data.json)으로 추출하여, Python 코드를 사용해 'webapp' 폴더를 생성하고 두 파일을 저장해줘.</p>
                        </div>
                        <div class="tag-list">
                            <span class="tag">guide.txt</span>
                            <span class="tag">data.json</span>
                            <span class="tag">webapp 폴더</span>
                            <span class="tag">데이터 패키징</span>
                        </div>
                    </div>
                </div>

                <div class="timeline-item">
                    <div class="timeline-number">15</div>
                    <div class="timeline-content">
                        <div class="timeline-title-row">
                            <h3>전문 AI를 활용한 웹앱 구현 및 완성</h3>
                            <div class="small-link-group" style="display:flex;gap:8px;">
                                <a class="small-link" href="https://claude.ai/" target="_blank" rel="noopener noreferrer">Claude 바로가기</a>
                                <a class="small-link" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">ChatGPT 바로가기</a>
                            </div>
                        </div>
                        <p>패키징된 guide.txt와 data.json을 Claude 또는 ChatGPT에 업로드하고, 아래 명령어를 사용하여 고품질 웹앱(index.html)을 완성합니다.</p>
                        <div class="prompt-examples">
                            <div class="prompt-header">
                                <strong>외부 AI용 명령어</strong>
                                <button class="copy-btn" onclick="copyPrompt(this)">복사하기</button>
                            </div>
                            <p>첨부한 guide.txt(기획서)와 data.json(데이터)을 읽고, 단일 index.html 파일로 구동되는 인터랙티브 데이터 대시보드를 만들어줘. Chart.js를 CDN으로 로드하고, data.json 내용을 JS 변수로 임베드해줘. 반응형 디자인, 다크모드 지원, 부드러운 애니메이션을 적용하고 세련된 UI로 만들어줘.</p>
                        </div>
                        <div class="tag-list">
                            <span class="tag">Claude</span>
                            <span class="tag">ChatGPT</span>
                            <span class="tag">index.html</span>
                            <span class="tag">Chart.js</span>
                        </div>
                    </div>
                </div>

                <div class="timeline-item">
                    <div class="timeline-number">16</div>
                    <div class="timeline-content">
                        <div class="timeline-title-row">
                            <h3>분석 과정 저장하기</h3>
                            <a class="small-link" href="https://colab.research.google.com/?hl=ko" target="_blank"
                                rel="noopener noreferrer">Google Colab 바로가기</a>
                        </div>
                        <p>Google Colab에서 수행한 분석 코드, 시각화 결과, 해석 내용을 하나로 묶어 저장합니다. 이미지가 포함된 PDF와 제미나이가 정리한 텍스트 리포트를 함께 준비하여 NotebookLM의 핵심 소스로 활용합니다.</p>
                        <div class="prompt-examples">
                            <div class="prompt-header">
                                <strong>Colab Gemini 명령어</strong>
                                <button class="copy-btn" onclick="copyPrompt(this)">복사하기</button>
                            </div>
                            <p>지금까지의 분석 과정(코드, 시각화 결과, 해석)을 요약하여 텍스트 리포트 형태로 정리해줘. 그리고 노트북 전체를 PDF로 저장하는 코드를 작성해줘.</p>
                        </div>
                        <div class="tag-list">
                            <span class="tag">PDF 저장</span>
                            <span class="tag">리포트 정리</span>
                            <span class="tag">NotebookLM 소스</span>
                        </div>
                    </div>
                </div>

                <div class="timeline-item">
                    <div class="timeline-number">17</div>
                    <div class="timeline-content">
                        <div class="timeline-title-row">
                            <h3>기존 연구(정책)와 비교하기</h3>
                            <a class="small-link" href="https://notebooklm.google.com/" target="_blank"
                                rel="noopener noreferrer">NotebookLM 바로가기</a>
                        </div>
                        <p>분석 결과와 앞서 저장한 분석 자료를 기존 연구, 기사, 정책 자료와 비교하여 내 결과가 기존 자료와 어떤 점에서 비슷하거나 다른지 확인하고, 결과 해석을 보완합니다.</p>
                        <div class="prompt-examples">
                            <div class="prompt-header">
                                <strong>NotebookLM 예시 질문</strong>
                                <button class="copy-btn" onclick="copyPrompt(this)">복사하기</button>
                            </div>
                            <p>인터넷에서 탐구 주제와 관련된 기존 연구, 기사, 정책 자료를 찾아줘. 그리고 각 자료의 핵심 내용과 내 분석 결과가 비슷한 점과 다른 점을 정리해줘.</p>
                        </div>
                        <div class="tag-list">
                            <span class="tag">논문 비교</span>
                            <span class="tag">보도 자료</span>
                            <span class="tag">정책 보고서</span>
                            <span class="tag">차이점 분석</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="section">
            <div class="section-header">
                <div>
                    <div class="section-kicker">Presentation</div>
                    <h2>발표 자료 구성 예시</h2>
                </div>
            </div>

            <div class="slide-container">
                <!-- Ⅰ. 서론 -->
                <div class="slide-section">
                    <h3 class="slide-section-title">Ⅰ. 서론</h3>
                    <div class="slide-list">
                        <article class="slide-card">
                            <h3>연구 배경 및 문제 인식</h3>
                            <p>해결하고자 하는 사회 문제와 중요성 제시 + 탐구 주제·목표 소개</p>
                        </article>
                        <article class="slide-card">
                            <h3>기존 연구 및 정책 검토</h3>
                            <p>관련 선행 연구·기사·정책 자료 요약 및 본 탐구와의 차별점 제시</p>
                        </article>
                        <article class="slide-card">
                            <h3>탐구 질문 및 가설</h3>
                            <p>데이터로 검증할 핵심 탐구 질문 또는 가설 명시</p>
                        </article>
                    </div>
                </div>

                <!-- Ⅱ. 연구 방법 -->
                <div class="slide-section">
                    <h3 class="slide-section-title">Ⅱ. 연구 방법</h3>
                    <div class="slide-list">
                        <article class="slide-card">
                            <h3>활용 데이터 및 전처리 계획</h3>
                            <p>공공데이터 출처·주요 열·활용 목적 + 전처리 방향 및 코드 구성 설명</p>
                        </article>
                        <article class="slide-card">
                            <h3>데이터 전처리 과정</h3>
                            <p>결측치·중복값·지역명·병합 오류 정리 과정 제시</p>
                        </article>
                        <article class="slide-card">
                            <h3>분석 지표 설계</h3>
                            <p>정책·웹앱 제안에 활용할 비율·순위·지수 등 초기 지표 정의</p>
                        </article>
                    </div>
                </div>

                <!-- Ⅲ. 분석 결과 -->
                <div class="slide-section">
                    <h3 class="slide-section-title">Ⅲ. 분석 결과</h3>
                    <div class="slide-list">
                        <article class="slide-card">
                            <h3>통계적 검증</h3>
                            <p>상관분석·평균 비교·유의성 검정 등 초기 지표 통계 결과</p>
                        </article>
                        <article class="slide-card">
                            <h3>분석 결과 시각화</h3>
                            <p>그래프·표·지도 등으로 주요 결과 시각화</p>
                        </article>
                        <article class="slide-card">
                            <h3>지표 정교화 및 재검증</h3>
                            <p>시각화에서 발견된 한계 보완 및 재검증 결과</p>
                        </article>
                        <article class="slide-card">
                            <h3>정교화 지표 시각화</h3>
                            <p>보완된 지표의 시각화 결과 제시</p>
                        </article>
                        <article class="slide-card">
                            <h3>초기 vs 정교화 지표 비교</h3>
                            <p>초기 지표와 정교화된 지표의 차이점 및 수정 근거를 논리적으로 설명</p>
                        </article>
                        <article class="slide-card">
                            <h3>결과 해석</h3>
                            <p>최종 시각화와 통계 결과를 바탕으로 탐구 질문에 대한 답 정리</p>
                        </article>
                    </div>
                </div>

                <!-- Ⅳ. 제언 및 개발 -->
                <div class="slide-section">
                    <h3 class="slide-section-title">Ⅳ. 제언 및 개발</h3>
                    <div class="slide-list">
                        <article class="slide-card">
                            <h3>정책 제안</h3>
                            <p>분석 근거를 바탕으로 제안 배경, 주요 내용, 기대 효과 제시</p>
                        </article>
                        <article class="slide-card">
                            <h3>웹앱 기획 및 구현</h3>
                            <p>데이터 대시보드 및 정책 솔루션 기능의 기획·개발 과정 소개</p>
                        </article>
                    </div>
                </div>

                <!-- Ⅴ. 결론 -->
                <div class="slide-section">
                    <h3 class="slide-section-title">Ⅴ. 결론</h3>
                    <div class="slide-list">
                        <article class="slide-card">
                            <h3>결론 및 한계·향후 과제</h3>
                            <p>연구 요약, 한계점, 향후 발전 방향 제시</p>
                        </article>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <script>
        function copyPrompt(btn) {
            const box = btn.closest('.prompt-examples');
            const p = box.querySelector('p');
            if (p) {
                navigator.clipboard.writeText(p.textContent.trim()).then(() => {
                    btn.textContent = '✓ 복사됨';
                    setTimeout(() => btn.textContent = '복사하기', 1500);
                });
            }
        }
    </script>
</body>

</html>
'''

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(keep)
    f.write(new_content)

print(f"Done! File rebuilt. Old lines kept: {len(keep)}, new content appended.")
