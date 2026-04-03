import { fetchDatasetPreview } from './ui.js';

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
4. 전문가가 아닌 일반인도 이해할 수 있는 쉬운 용어를 사용해야 합니다.

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
            // Fetch sample — 10행으로 늘려 AI가 데이터 구조를 더 잘 파악하도록 개선
            const preview = await fetchDatasetPreview(ds.file_url, ds.data_name);
            if (preview && preview.data && preview.data.length > 0) {
                const sampleRows = preview.data.slice(0, 10); // [수정] 3 → 10행
                const headers = preview.fields || Object.keys(sampleRows[0]);

                prompt += `컬럼 구성: ${headers.join(', ')}\n`;
                prompt += `데이터 샘플(JSON): ${JSON.stringify(sampleRows, null, 2)}\n`;
                const rowCount = ds.metadata?.row_count ?? ds.total_rows;
                const rowCountStr = (rowCount && Number(rowCount) > 0) ? `${Number(rowCount).toLocaleString()}행` : '데이터 분석 중 (상세 샘플 참조)';
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
3. 전문가가 아닌 일반인도 이해할 수 있는 쉬운 용어를 사용해야 합니다.
4. 연구자가 추가 아이디어를 요청하더라도, 항상 위에서 제공된 **데이터 샘플(JSON) 및 컬럼 구성**을 연구의 절대적인 근거로 삼아야 합니다. 절대 임의의 가공 데이터를 상상하여 답변하지 마십시오.
5. **2단계 자동 매칭을 위해**, 답변 시 위에서 제공된 **실제 파일명**(.csv 포함)을 문맥 속에서 최소 한 번 이상 정확하게 언급해 주세요. (예: "이 연구를 위해 '서울교통공사_혼잡도.csv' 데이터를 활용합니다.")`;

    return prompt;
}

/**
 * 6단계 파트 A: 데이터 분석 코드 생성 프롬프트
 */
export async function generateAnalysisCodePrompt(selectedLog, datasets, analysisType) {
    let data;
    try { data = JSON.parse(selectedLog.content); } catch(e) { data = { answer: selectedLog.content }; }

    const analysisGuide = {
        '상관관계': '두 변수 이상의 관계 강도(상관계수)를 계산하고, 히트맵으로 시각화하세요. 유의미한 상관관계가 있는 변수 쌍을 강조해 주세요.',
        '집계·비교': '그룹별 평균·합계·빈도를 집계하고 막대그래프 또는 박스플롯으로 비교하세요. 가장 차이가 큰 그룹을 강조해 주세요.',
        '회귀분석': '선형 또는 다중 회귀 모델을 적용하고 R² 및 계수를 출력하세요. 예측값 vs 실제값 산점도도 포함하세요.',
        '군집분석': 'K-Means 클러스터링을 적용하고 최적 K를 엘보우 기법으로 결정하세요. 군집별 특징을 요약해 주세요.',
    };

    let prompt = `당신은 데이터 분석에 능숙한 파이썬 개발자입니다.
아래 연구 주제와 데이터를 바탕으로 구글 코랩(Colab)에서 바로 실행 가능한 **분석 코드**를 작성해 주세요.

### 연구 가설 및 목표
${data.opinion ? `연구자 관점: ${data.opinion}\n` : ''}${data.answer}

### 선택된 분석 방법: ${analysisType}
${analysisGuide[analysisType] || ''}

### 데이터셋 구조
`;

    for (const ds of datasets) {
        let fileName = ds.data_name.trim();
        if (!fileName.toLowerCase().endsWith('.csv')) fileName += '.csv';
        prompt += `\n[파일명: ${fileName}]\n`;
        try {
            const preview = await fetchDatasetPreview(ds.file_url, ds.data_name);
            if (preview && preview.fields) {
                prompt += `- 주요 컬럼: ${preview.fields.join(', ')}\n`;
                prompt += `- 데이터 샘플: ${JSON.stringify(preview.data.slice(0, 5))}\n`;
            }
        } catch(e) { prompt += `- (컬럼 정보 로딩 실패)\n`; }
    }

    prompt += `

### 코드 작성 요구사항
1. 파일 로딩 시 아래 인코딩 자동 탐지 함수를 반드시 사용하세요:
\`\`\`python
def load_csv(filepath):
    for encoding in ['cp949', 'utf-8-sig', 'utf-8']:
        try:
            df = pd.read_csv(filepath, encoding=encoding)
            print(f"[성공] {filepath} → 인코딩: {encoding}")
            return df
        except (UnicodeDecodeError, LookupError):
            continue
    raise ValueError(f"[실패] {filepath}: 지원되는 인코딩 없음")
\`\`\`

2. 코드 최상단에 아래 한글 폰트 설정을 반드시 포함하세요:
\`\`\`python
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm

!apt-get -qq -y install fonts-nanum > /dev/null
fm._rebuild()  # 폰트 캐시 재빌드 (경고 제거에 필수)

font_path = '/usr/share/fonts/truetype/nanum/NanumGothic.ttf'
font_prop = fm.FontProperties(fname=font_path)
plt.rcParams['axes.unicode_minus'] = False
\`\`\`
한글 텍스트가 있는 모든 그래프 요소에 \`fontproperties=font_prop\`을 적용하세요.

3. 각 코드 블록에 한국어 주석으로 설명을 달아주세요.
4. 분석 결과(수치)를 print로 출력하고, 시각화 그래프를 최소 1개 포함하세요.
5. 마지막에 분석 결과 요약을 한국어로 출력하는 코드를 추가하세요.
6. JSON 샘플은 구조 파악 용도로만 사용하고, Python 코드 내에 직접 쓰지 마세요.
   (null→None, true→True, false→False 변환 규칙 준수)`;

    return prompt;
}

/**
 * 6단계 파트 B: 분석 결과 해석 & 가설 검증 프롬프트
 */
export function generateInterpretationPrompt(selectedLog, analysisResult) {
    let data;
    try { data = JSON.parse(selectedLog.content); } catch(e) { data = { answer: selectedLog.content }; }

    return `당신은 데이터 분석 결과 해석 및 정책 제안 전문가입니다.
아래 연구 가설과 분석 결과를 바탕으로 다음 4가지 항목을 작성해 주세요.

---
### 원래 연구 가설 및 목표
${data.opinion ? `연구자 관점: ${data.opinion}\n` : ''}${data.answer}

---
### 분석 결과 (학생 입력)
${analysisResult}

---
### 작성 요청 항목

**[1] 가설 검증 결과**
- 위 분석 결과를 기준으로, 연구 가설이 지지되었는지(supported) 기각되었는지(rejected) 판단해 주세요.
- 판단 근거를 분석 수치와 함께 구체적으로 설명하세요.

**[2] 결과 해석 (쉬운 말로)**
- 전문가가 아닌 중학생·고등학생도 이해할 수 있는 쉬운 언어로 결과의 의미를 설명해 주세요.
- 핵심 발견 사항 2~3가지를 bullet point로 정리해 주세요.

**[3] 한계점 및 추가 분석 제안**
- 이 분석의 한계점(데이터 부족, 분석 방법의 제약 등)을 솔직하게 1~2가지 제시하세요.
- 더 정확한 결론을 위해 추가로 분석할 수 있는 방향을 제안해 주세요.

**[4] 8단계 정책 제안을 위한 시사점**
- 이 분석 결과가 실제 정책에 어떻게 활용될 수 있는지 구체적인 제안 1~2가지를 작성해 주세요.
- 제안은 현실적으로 실현 가능한 내용이어야 합니다.`;
}

/**
 * Generates a prompt for Google Colab coding based on the selected research log.
 *
 * [설계 방향]
 * 어떤 데이터셋이 주어질지 사전에 알 수 없으므로,
 * 특정 전처리 방법을 지정하는 대신 AI가 데이터를 스스로 진단하고
 * 필요한 전처리 요소를 체크리스트 형태로 먼저 보고하도록 설계.
 * 사용자가 진단 결과를 확인한 뒤 코드 생성을 승인하는 2단계 구조.
 *
 * [변경 사항 요약]
 * 1. '방법 지정형' 프롬프트 → '진단 후 보고형' 프롬프트로 전면 재설계
 * 2. AI가 데이터를 직접 분석해 결합 방식, 구조 변환, 결측치, 외부 보강 필요 여부를
 *    체크리스트로 정리한 뒤 사용자 승인을 받고 코드를 작성하도록 변경
 * 3. 특정 방법(Haversine, pd.melt, 행정동명 등) 하드코딩 완전 제거
 * 4. 샘플 데이터 3행 → 10행으로 확대 (유지)
 * 5. JSON 샘플의 null/true/false를 Python 코드에 그대로 사용 시 NameError 발생 방지:
 *    - 샘플은 구조 파악 용도로만 사용하고 코드에 직접 붙여넣기 금지 지침 추가
 *    - JSON → Python 타입 변환 규칙(null→None, true→True, false→False) 명시
 * 6. 한글 폰트 설정 코드를 정확한 템플릿으로 명시 추가:
 *    - 나눔폰트 설치 + FontProperties 방식으로 고정
 *    - axes.unicode_minus 설정 포함
 */
export async function generateColabPreprocessingPrompt(selectedLog, datasets) {
    let data;
    try {
        data = JSON.parse(selectedLog.content);
    } catch (e) {
        data = { answer: selectedLog.content };
    }

    let prompt = `당신은 데이터 전처리에 능숙한 파이썬 개발자입니다.
아래 연구 주제와 데이터셋 정보를 바탕으로, **코드를 바로 작성하지 말고** 먼저 전처리 진단 보고서를 작성해 주세요.

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
                // 10행 제공: 행 유형이 여러 가지인 경우(예: 상선/하선) AI가 구조를 정확히 파악하도록
                prompt += `- 데이터 샘플 (일부): ${JSON.stringify(preview.data.slice(0, 10))}\n`;
            }
        } catch (e) {
            prompt += `- (컬럼 정보 로딩 실패)\n`;
        }
    }

    prompt += `

### 3. 진단 지침 (코드 작성 전 필수 수행)

위 데이터셋들을 꼼꼼히 분석하여, 아래 7가지 항목에 대해 **진단 보고서**를 먼저 작성해 주세요.
각 항목은 해당 파일명을 명시하여 구체적으로 작성하고, 문제가 없는 항목은 "이상 없음"으로 표기하세요.

---
**📋 전처리 진단 보고서 양식**

**[1] 데이터 결합 방식**
- 제공된 **모든 파일**을 어떤 기준으로 연결할 수 있는지 파일별로 각각 분석하세요.
- 각 파일 간 공통 컬럼이 있는지, 공간(위도/경도) 기반 결합이 필요한지, 시간 기준 결합이 가능한지 등을 판단하세요.
- 파일이 3개 이상인 경우, 어떤 순서로 결합할지 단계적으로 설명하세요. (예: A+B 결합 후 → C 결합)
- 결합이 불가능하거나 추가 데이터가 필요한 경우, 그 이유와 필요한 데이터를 명시하세요.

**[2] 데이터 구조 변환 필요 여부**
- 분석에 불편한 구조(예: 항목이 컬럼으로 가로로 퍼져 있는 형태 등)가 있는지 확인하세요.
- 변환이 필요한 경우, 어떤 파일의 어떤 컬럼이 문제인지 구체적으로 설명하세요.

**[3] 결측치 및 데이터 품질**
- 샘플 데이터 기준으로 결측치, 이상값, 중복 데이터가 의심되는 부분을 찾아 보고하세요.
- 데이터 타입 변환(숫자, 날짜 등)이 필요한 컬럼도 함께 명시하세요.

**[4] 외부 보강 데이터 필요 여부**
- 연구 가설을 검증하기 위해 제공된 파일만으로 부족한 정보가 있는지 확인하세요.
- 부족한 경우, 어떤 데이터가 필요하며 어디서 구할 수 있는지(출처 포함) 안내하세요.

**[5] 파일 로딩 시 주의사항**
- 인코딩, 구분자, 헤더 위치 등 파일을 불러올 때 주의해야 할 기술적 사항을 정리하세요.
- 한국 공공데이터는 인코딩이 파일마다 다를 수 있으므로, 샘플만으로 인코딩을 확신할 수 없습니다.
  코드 작성 시 아래와 같이 \`cp949\`, \`utf-8-sig\`, \`utf-8\` 순서로 자동 시도하는 예외처리를 반드시 사용하세요:

\`\`\`python
def load_csv(filepath):
    for encoding in ['cp949', 'utf-8-sig', 'utf-8']:
        try:
            df = pd.read_csv(filepath, encoding=encoding)
            print(f"[성공] {filepath} → 인코딩: {encoding}")
            return df
        except (UnicodeDecodeError, LookupError):
            continue
    raise ValueError(f"[실패] {filepath}: 지원되는 인코딩으로 파일을 읽을 수 없습니다.")
\`\`\`

**[6] Python 코드 작성 시 타입 변환 주의사항**
- 위에 제공된 데이터 샘플은 JSON 형식입니다. 샘플은 데이터 구조를 파악하는 용도로만 사용하고,
  Python 코드 안에 샘플 데이터를 직접 붙여넣지 마세요.
- 실제 데이터는 반드시 \`pd.read_csv()\`로 파일을 불러오는 방식만 사용하세요.
- 만약 코드 내에 JSON 값을 직접 써야 할 경우, 아래 변환 규칙을 반드시 지키세요:
  - JSON \`null\` → Python \`None\`
  - JSON \`true\` → Python \`True\`
  - JSON \`false\` → Python \`False\`
  (이를 지키지 않으면 NameError가 발생합니다.)

**[7] 한글 폰트 설정**
- 코드 최상단에 아래 한글 폰트 설정 코드를 반드시 포함하세요.
- 아래 코드를 그대로 사용하고, 임의로 변경하지 마세요.

\`\`\`python
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm

# 1. 나눔폰트 설치 및 캐시 재빌드 (경고 제거에 필수)
!apt-get -qq -y install fonts-nanum > /dev/null
fm._rebuild()

# 2. 폰트 파일 경로 지정 및 FontProperties 생성
font_path = '/usr/share/fonts/truetype/nanum/NanumGothic.ttf'
font_prop = fm.FontProperties(fname=font_path)
plt.rcParams['axes.unicode_minus'] = False
\`\`\`

- 이후 모든 그래프의 제목, 축 레이블, 범례 등 한글이 포함된 텍스트에는
  \`fontproperties=font_prop\` 인자를 반드시 적용하세요.
  예: \`plt.title('혼잡도 분석', fontproperties=font_prop)\`

---
보고서 작성이 끝나면 마지막에 아래 문장을 추가하세요:

> "위 진단 결과를 확인하셨으면 '코드 작성을 시작해 주세요'라고 말씀해 주세요.
> 특히 [4] 외부 보강 데이터가 필요한 경우, 해당 데이터를 먼저 준비하신 후 코드 작성을 요청하시면
> 더 완성도 높은 코드를 제공할 수 있습니다."

**⚠️ 주의: 이 단계에서는 파이썬 코드를 절대 작성하지 마세요. 진단 보고서만 작성하세요.**`;

    return prompt;
}