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
        prompt += `\n[연구자의 특정 아이디어가 없는 경우]\n"연구자의 선행 가설이 명시되지 않았으므로, 제공된 데이터셋들 사이의 숨겨진 상관관계나 의외의 연결고리를 스스로 찾아내어 가장 창의적이고 실질적인 연구 과제 3가지를 발굴해 주세요."\n\n위 지침에 따라, `;
    }

    prompt += `제공된 여러 공공데이터셋의 샘플과 메타정보를 분석하여, 이 데이터들을 조합하거나 개성있게 활용했을 때 가능한 '사회 문제 해결형 연구 주제' 3가지를 제안해 주세요.

각 제안에는 다음 내용이 포함되어야 합니다:
1. 연구 제목
2. 분석 대상 및 가설 (반드시 아래 명시된 **실제 파일명**들을 사용하여 무엇과 무엇을 결합하는지 명시)
3. 예상되는 정책적 기대 효과

---
### 분석 대상 데이터셋 정보
`;

    for (let i = 0; i < datasets.length; i++) {
        const ds = datasets[i];
        
        // Extract real filename from URL or use data_name as fallback
        let fileName = 'dataset.csv';
        if (ds.file_url) {
            const parts = ds.file_url.split('/');
            fileName = parts[parts.length - 1];
        } else {
            fileName = ds.data_name.endsWith('.csv') ? ds.data_name : `${ds.data_name}.csv`;
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
                const rowCountStr = (typeof ds.total_rows === 'number') ? ds.total_rows.toLocaleString() : ds.total_rows;
                prompt += `전체 데이터 행 수: ${rowCountStr}행\n`;
            } else {
                prompt += `(데이터 샘플을 불러올 수 없습니다.)\n`;
            }
        } catch (err) {
            prompt += `(데이터 미리보기 로딩 실패: ${err.message})\n`;
        }
        prompt += `\n---\n`;
    }

    prompt += `\n위의 파일들을 종합적으로 고려하여, 실제 분석이 가능한 실용적인 연구 모델을 제안해 주세요. 답변 시 데이터셋 번호 대신 제공된 **파일명**을 사용하여 지시해 주세요.`;
    
    return prompt;
}
