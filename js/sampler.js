/**
 * Smart CSV Sampler for Large Files
 * Filters rows by multiple keywords (AND logic) to keep file size under 50MB.
 */
export async function sampleCsvByKeywords(file, keywordsStr, onProgress) {
    return new Promise((resolve, reject) => {
        const matchedRows = [];
        let processedCount = 0;
        const keywords = keywordsStr.split(/\s+/).filter(k => k.length > 0);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            step: function(results) {
                processedCount++;
                if (processedCount % 5000 === 0) {
                    if (onProgress) onProgress(`데이터 분석 중... (${processedCount.toLocaleString()}행 처리됨)`);
                }

                const row = results.data;
                const rowStr = JSON.stringify(row);

                // AND Logic: Every keyword must be present in the row
                const isMatch = keywords.every(kw => rowStr.includes(kw));
                if (isMatch) {
                    matchedRows.push(row);
                }
            },
            complete: function() {
                if (onProgress) onProgress('필터링 완료. 용량 계산 중...');
                
                if (matchedRows.length === 0) {
                    return reject(new Error(`파일에서 입력한 조건을 모두 만족하는 데이터를 찾을 수 없습니다.`));
                }

                // Convert back to CSV
                const finalCsv = Papa.unparse(matchedRows);
                const blob = new Blob([finalCsv], { type: 'text/csv' });

                resolve({
                    blob: blob,
                    rowCount: matchedRows.length,
                    originalSize: file.size,
                    newSize: blob.size
                });
            },
            error: function(err) {
                reject(err);
            }
        });
    });
}
