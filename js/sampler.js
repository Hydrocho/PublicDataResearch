/**
 * Smart CSV Sampler for Large Files
 * Filters rows by multiple keywords (AND logic) to keep file size under 50MB.
 * @deprecated Use sampleCsvByConditions for column-based filtering.
 */
export async function sampleCsvByKeywords(file, keywordsStr, onProgress) {
    return new Promise((resolve, reject) => {
        const matchedRows = [];
        let processedCount = 0;
        const keywords = (keywordsStr ?? '').split(/\s+/).filter(k => k.length > 0);

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

                const isMatch = keywords.every(kw => rowStr.includes(kw));
                if (isMatch) matchedRows.push(row);
            },
            complete: function() {
                if (onProgress) onProgress('필터링 완료. 용량 계산 중...');
                if (matchedRows.length === 0) {
                    return reject(new Error(`파일에서 입력한 조건을 모두 만족하는 데이터를 찾을 수 없습니다.`));
                }
                const finalCsv = Papa.unparse(matchedRows);
                const blob = new Blob([finalCsv], { type: 'text/csv' });
                resolve({ blob, rowCount: matchedRows.length, originalSize: file.size, newSize: blob.size });
            },
            error: (err) => reject(err)
        });
    });
}

/**
 * [NEW] Condition-based CSV Sampler
 * @param {File|Blob} file - The CSV file to filter
 * @param {Array<{column: string, operator: string, value: string}>} conditions - Filter conditions (AND logic)
 * @param {Function} onProgress - Progress callback
 */
export async function sampleCsvByConditions(file, conditions, onProgress) {
    return new Promise((resolve, reject) => {
        const matchedRows = [];
        let processedCount = 0;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            step: function(results) {
                processedCount++;
                if (processedCount % 5000 === 0) {
                    if (onProgress) onProgress(`데이터 분석 중... (${processedCount.toLocaleString()}행 처리됨)`);
                }

                const row = results.data;

                // AND logic: all conditions must match
                const isMatch = conditions.every(({ column, operator, value }) => {
                    const cellRaw = row[column];
                    if (cellRaw === undefined || cellRaw === null) return false;
                    const cell = String(cellRaw).trim();
                    const val = String(value).trim();

                    switch (operator) {
                        case 'contains': return cell.includes(val);
                        case '=':        return cell === val;
                        case '!=':       return cell !== val;
                        case '>':        return parseFloat(cell) > parseFloat(val);
                        case '<':        return parseFloat(cell) < parseFloat(val);
                        case '>=':       return parseFloat(cell) >= parseFloat(val);
                        case '<=':       return parseFloat(cell) <= parseFloat(val);
                        default:         return cell.includes(val);
                    }
                });

                if (isMatch) matchedRows.push(row);
            },
            complete: function() {
                if (onProgress) onProgress('필터링 완료. 용량 계산 중...');
                if (matchedRows.length === 0) {
                    return reject(new Error(`설정한 조건을 만족하는 데이터가 없습니다. 조건을 다시 확인해 주세요.`));
                }
                const finalCsv = Papa.unparse(matchedRows);
                const blob = new Blob([finalCsv], { type: 'text/csv' });
                resolve({ blob, rowCount: matchedRows.length, originalSize: file.size, newSize: blob.size });
            },
            error: (err) => reject(err)
        });
    });
}

/**
 * Parse only the header row from a large CSV to get column names quickly.
 */
export async function parseCsvHeaders(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            preview: 1, // Only parse first data row
            skipEmptyLines: true,
            complete: (results) => resolve(results.meta.fields || []),
            error: (err) => reject(err)
        });
    });
}
