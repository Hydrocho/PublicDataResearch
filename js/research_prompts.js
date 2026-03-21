import { fetchDatasetPreview } from './management.js';

/**
 * Generates a comprehensive prompt for AI based on research-selected datasets.
 */
export async function generateProblemDefinitionPrompt(datasets, researcherOpinion = '') {
    if (!datasets || datasets.length === 0) {
        return "연구 활용으로 선택된 데이터셋이 없습니다. [데이터 관리] 단계에서 연구에 활용할 데이터를 먼저 체크해 주세요.";
    }

    let prompt = `당신은 유능한 데이터 과학자이자 정책 제안 전문가입니다. 
`;

    if (researcherOpinion.trim()) {
        prompt += `\n[연구자의 핵심 의견 및 통찰]\n"${researcherOpinion.trim()}"\n\n위의 의견을 최우선으로 고려하여, `;
    } else {
        prompt += `\n[연구자의 특정 아이디어가 없는 경우]\n"연구자의 선행 가설이 명시되지 않았으므로, 제공된 데이터셋들 사이의 숨겨진 상관관계나 의외의 연결고리를 스스로 찾아내어 가장 창의적이고 실질적인 연구 과제 **1가지**를 우선 발굴해 주세요."\n\n위 지침에 따라, `;
    }

    prompt += `제공된 여러 공공데이터셋의 샘플과 메타정보를 분석하여, 이 데이터들을 조합하거나 개성있게 활용했을 때 가능한 '사회 문제 해결형 연구 주제' **1가지**를 깊이 있게 제안해 주세요.

각 제안에는 다음 내용이 **단 1개씩만** 포함되어야 합니다:
1. 연구 제목 (핵심을 관통하는 1개의 이름)
2. 분석 대상 및 가설 (반드시 아래 명시된 **실제 파일명**들을 사용하여 무엇과 무엇을 결합하는지 명시하되, **단 1개의 핵심 가설만** 제안할 것. 절대로 여러 가설을 나열하거나 번호를 매기지 마십시오.)
3. 예상되는 정책적 기대 효과 (실현 가능한 1가지 방안)

---
### 분석 대상 데이터셋 정보
`;

    for (let i = 0; i < datasets.length; i++) {
        const ds = datasets[i];
        
        // Derive clean filename from data_name for intuitive local processing
        let fileName = ds.data_name.trim();
        if (!fileName.toLowerCase().endsWith('.csv')) {
            fileName += '.csv';
        }

        prompt += `\n[파일: ${fileName}]
이름: ${ds.data_name}
설명: ${ds.metadata?.description || '설명 없음'}
출처: ${ds.metadata?.provider || ds.student_id + ' 학생 공유'}
`;

        try {
            // Fetch sample
            const preview = await fetchDatasetPreview(ds.file_url, ds.data_name);
            if (preview && preview.data && preview.data.length > 0) {
                const sampleRows = preview.data.slice(0, 10);
                const headers = preview.fields || Object.keys(sampleRows[0]);
                
                prompt += `컬럼 구성: ${headers.join(', ')}\n`;
                prompt += `데이터 샘플(JSON): ${JSON.stringify(sampleRows, null, 2)}\n`;
                const rowCount = Number(ds.total_rows);
                const rowCountStr = (rowCount > 1) ? `${rowCount.toLocaleString()}행` : '데이터 분석 중 (상세 샘플 참조)';
                prompt += `전체 데이터 행 수: ${rowCountStr}\n`;
            } else {
                prompt += `(데이터 샘플을 불러올 수 없습니다.)\n`;
            }
        } catch (err) {
            prompt += `(데이터 미리보기 로딩 실패: ${err.message})\n`;
        }
        prompt += `\n---\n`;
    }

    prompt += `\n위의 파일들을 종합적으로 고려하여, 실제 분석이 가능한 실용적인 연구 모델을 제안해 주세요. 답변 시 데이터셋 번호 대신 제공된 **파일명**을 사용하여 지시해 주세요.

---
**[중요 지침: 대화 및 컨텍스트 유지]**
1. 이번 답변에서는 **가장 승산 있는 1개의 아이디어만** 상세하게 제안해 주세요.
2. 제안이 끝난 후에는 "또 다른 아이디어를 확인하시겠습니까?" 또는 "이 아이디어를 좀 더 구체화해 볼까요?"와 같이 연구자의 다음 행동을 묻는 질문으로 마무리해 주세요.
3. 연구자가 추가 아이디어를 요청하더라도, 항상 위에서 제공된 **데이터 샘플(JSON) 및 컬럼 구성**을 연구의 절대적인 근거로 삼아야 합니다. 절대 임의의 가공 데이터를 상상하여 답변하지 마십시오.`;
    
    return prompt;
}

/**
 * Generates a prompt for Google Colab coding based on the selected research log.
 */
export async function generateColabPreprocessingPrompt(selectedLog, datasets) {
    let data;
    try {
        data = JSON.parse(selectedLog.content);
    } catch(e) {
        data = { answer: selectedLog.content };
    }

    let prompt = `당신은 데이터 전처리에 능숙한 파이썬 개발자입니다. 
구글 코랩(Google Colab) 환경에서 아래 연구 주제를 수행하기 위해 **데이터를 병합하고 정제하는 파이썬(Pandas) 코드**를 작성해 주세요.

### 1. 연구 목표 및 가설
제목: ${data.opinion || '연구 주제'}
상세: ${data.answer}

### 2. 처리 대상 데이터셋 및 구조
`;

    for (const ds of datasets) {
        let fileName = ds.data_name.trim();
        if (!fileName.toLowerCase().endsWith('.csv')) fileName += '.csv';

        prompt += `\n[파일명: ${fileName}]\n`;
        
        try {
            const preview = await fetchDatasetPreview(ds.file_url, ds.data_name);
            if (preview && preview.fields) {
                prompt += `- 주요 컬럼: ${preview.fields.join(', ')}\n`;
                prompt += `- 데이터 샘플 (일부): ${JSON.stringify(preview.data.slice(0, 3))}\n`;
            }
        } catch (e) {
            prompt += `- (컬럼 정보 로딩 실패)\n`;
        }
    }

    prompt += `
### 3. 필수 요구 사항 (코드 작성 지침)
1. **파일 로딩**: \`pd.read_csv()\`를 사용하되, 한국 공공데이터의 특성을 고려하여 \`encoding='cp949'\` 또는 \`encoding='utf-8'\`을 유연하게 처리하는 예외 처리 코드를 포함해 주세요.
2. **데이터 결합(Merge)**: 위 데이터셋들 중 '행정동명' 또는 공통된 기준 컬럼을 찾아 \`merge()\` 하는 로직을 작성해 주세요.
3. **데이터 정제**:
   - 가설에 필요한 특정 업종이나 시간대 데이터만 필터링하세요.
   - 결측치 처리 및 데이터 타입(날짜, 숫자 등) 변환 코드를 포함하세요.
4. **최종 저장**: 전처리가 완료된 데이터프레임을 \`processed_research_data.csv\`라는 이름으로 저장하는 코드로 마무리하세요.
5. **한글 폰트 설정**: 코랩 환경에서 시각화 시 한글이 깨지지 않도록 나눔폰트 설치 및 설정 코드를 서두에 포함해 주세요.

위 지침에 따라 주석이 상세히 달린 완성된 파이썬 코드를 작성해 주세요.`;

    return prompt;
}
