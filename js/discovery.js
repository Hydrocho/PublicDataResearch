import { categories } from './data.js';
import { localDataCategories } from './localData.js';

/**
 * Renders the Hierarchical Data Explorer in the Step 0 area
 */
export function renderDataExplorer(container, state, onDataSelected) {
    if (!container) return;
    
    container.innerHTML = `
        <div class="explorer-container">
            <aside class="explorer-sidebar">
                <div style="font-weight: 800; font-size: 0.82rem; color: #475569; margin-bottom: 20px; padding: 0 10px; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="layers" style="width: 16px; height: 16px;"></i> 데이터 분류 체계
                </div>
                <div id="explorer-category-list">
                    ${localDataCategories.map(cat => `
                        <div class="category-item" data-id="${cat.id}">
                            <i data-lucide="${cat.icon}" style="width: 18px; height: 18px;"></i>
                            <span>${cat.title.replace('인허가정보_', '')}</span>
                        </div>
                    `).join('')}
                </div>
            </aside>
            
            <main class="explorer-main">
                <div id="explorer-grid" class="explorer-grid">
                    <!-- Items will be rendered here dynamically -->
                </div>
            </main>
        </div>
    `;

    const categoryList = document.getElementById('explorer-category-list');
    const grid = document.getElementById('explorer-grid');

    let currentCategoryId = localDataCategories[0].id;

    const renderItems = () => {
        if (!grid) return;
        grid.innerHTML = '';
        const allItems = [];
        
        const selectedCat = localDataCategories.find(c => c.id === currentCategoryId);
        if (selectedCat) {
            selectedCat.items.forEach(item => {
                allItems.push({ catId: selectedCat.id, name: item });
            });
        }

        if (allItems.length === 0) {
            grid.innerHTML = `<div class="explorer-empty">해당 분류에 데이터가 없습니다.</div>`;
            return;
        }

        grid.innerHTML = allItems.map(item => `
            <div class="data-item" data-name="${item.name}" style="padding: 20px; text-align: center; justify-content: center; display: flex; align-items: center;">
                <div style="font-size: 0.9rem; line-height: 1.4; font-weight: 700; color: #334155;">${item.name}</div>
            </div>
        `).join('');

        // Item Click Logic
        grid.querySelectorAll('.data-item').forEach(el => {
            el.onclick = () => {
                const name = el.getAttribute('data-name');
                const portalUrl = `https://www.data.go.kr/tcs/dss/selectDataSetList.do?dType=FILE&keyword=${encodeURIComponent(name)}`;
                window.open(portalUrl, '_blank');
                
                // Set pending state (pre-fills Step 1 when user decides to go there)
                state.pendingDataName = name;
            };
        });

        if (window.lucide) lucide.createIcons();
    };

    // Category Buttons Logic
    if (categoryList) {
        categoryList.querySelectorAll('.category-item').forEach(el => {
            el.onclick = () => {
                categoryList.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
                el.classList.add('active');
                currentCategoryId = el.getAttribute('data-id');
                renderItems();
            };
        });
        const firstCat = categoryList.querySelector(`[data-id="${currentCategoryId}"]`);
        if (firstCat) firstCat.classList.add('active');
    }

    renderItems();
}

/**
 * Data Saving UI
 */
export function showSaveInstructions(dataName, state, onDataSelected) {
    const details = document.getElementById('save-form-container');
    if (!details) return;

    const displayTitle = dataName ? `'${dataName}' 데이터 저장 및 연동` : "신규 데이터 저장 및 연동";

    details.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3>📥 ${displayTitle}</h3>
        </div>
        
        <div style="background: var(--primary-glow); padding: 18px; border-radius: 12px; border-left: 5px solid var(--primary); margin-bottom: 25px; font-size: 0.95rem; line-height: 1.6; color: #1e3a8a;">
            💡 <b>워크플로우:</b><br>
            공공데이터포털에서 필요한 데이터를 찾으셨다면, 아래 양식에 메타데이터(선택)와 분석용 파일(필수)을 등록해 주세요.
        </div>

        <div style="display: grid; gap: 20px;">
            <!-- Step 1: Meta -->
            <div class="glass" style="padding: 18px; background: rgba(255,255,255,0.4); border: 1px dashed var(--glass-border);">
                <label style="display: block; font-size: 0.85rem; font-weight: 800; margin-bottom: 10px; color: #334155;">1단계: 메타데이터 JSON-LD (복사/붙여넣기 - 권장)</label>
                <textarea id="found-data-json" placeholder="데이터 상세페이지 하단의 JSON-LD <script> 내용을 붙여넣으세요. 이름이 자동 입력됩니다." style="width: 100%; height: 110px; padding: 12px; border-radius: 8px; font-size: 0.75rem; font-family: 'Consolas', monospace; border: 1px solid var(--glass-border); line-height: 1.4;"></textarea>
                <p id="json-auto-msg" style="font-size: 0.75rem; color: #15803d; font-weight: 800; display: none; margin-top: 8px;">🪄 데이터 정보가 성공적으로 감지되었습니다!</p>
            </div>

            <!-- Step 2: File -->
            <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
                <label style="display: block; font-size: 0.85rem; font-weight: 800; margin-bottom: 10px; color: #334155;">2단계: 분석 데이터 파일 선택 (필수)</label>
                <button id="manual-upload-btn" class="btn-secondary" style="width: 100%; height: 48px; font-weight: 600;">📁 CSV/Excel 파일 업로드</button>
                <input type="file" id="file-input" style="display: none;" accept=".csv,.xlsx,.xls,.json">
                <div id="upload-status" style="font-size: 0.8rem; color: var(--primary); margin-top: 8px; font-weight: 700;"></div>
            </div>

            <!-- Step 3: Confirm -->
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid var(--glass-border);">
                <div style="margin-bottom: 15px;">
                    <label style="font-size: 0.78rem; color: #64748b; font-weight: 700; display: block; margin-bottom: 6px;">최종 파일 데이터명</label>
                    <input type="text" id="found-data-name" value="${dataName || ''}" placeholder="데이터셋의 이름을 입력하세요" style="width: 100%; border: 1px solid var(--glass-border); padding: 10px; border-radius: 6px; background: white; font-weight: 600;">
                </div>
                <button id="save-data-info" class="btn-primary" style="width: 100%; padding: 16px; font-size: 1.05rem; font-weight: 800; display: flex; justify-content: center; align-items: center; text-align: center;">저장하기</button>
            </div>
        </div>
    `;

    const fileInput = document.getElementById('file-input');
    const uploadStatus = document.getElementById('upload-status');
    let selectedFile = null;

    document.getElementById('manual-upload-btn').onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
        if (e.target.files.length > 0) {
            selectedFile = e.target.files[0];
            uploadStatus.innerText = `📦 ${selectedFile.name} (${Math.round(selectedFile.size/1024)}KB) 준비됨`;
            const nameField = document.getElementById('found-data-name');
            if (nameField && (!nameField.value.trim() || nameField.value === dataName)) {
                nameField.value = selectedFile.name.split('.')[0];
            }
        }
    };

    const jsonArea = document.getElementById('found-data-json');
    const autoMsg = document.getElementById('json-auto-msg');
    let extractedMeta = {};

    jsonArea.addEventListener('input', () => {
        let str = jsonArea.value.trim();
        if (str.length < 30) return;
        try {
            str = str.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
            str = str.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"').replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");
            const data = JSON.parse(str);
            extractedMeta = data;
            const name = data.alternateName || data.name || '';
            if (name) document.getElementById('found-data-name').value = name;
            autoMsg.style.display = 'block';
        } catch (e) {
            autoMsg.style.display = 'none';
        }
    });

    document.getElementById('save-data-info').onclick = async () => {
        const name = document.getElementById('found-data-name').value.trim();
        if (!name) return alert('데이터셋 이름을 입력해 주세요.');
        if (!selectedFile) return alert('업로드할 파일을 선택해 주세요.');

        const btn = document.getElementById('save-data-info');
        const originalText = btn.innerText;

        // [Pre-process] Convert Excel to CSV if needed
        let fileToUpload = selectedFile;
        const isExcel = selectedFile.name.toLowerCase().endsWith('.xlsx') || selectedFile.name.toLowerCase().endsWith('.xls');
        
        if (isExcel) {
            try {
                btn.disabled = true;
                btn.innerText = 'CSV 변환 중...';
                const buffer = await selectedFile.arrayBuffer();
                const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const csvString = XLSX.utils.sheet_to_csv(worksheet);
                
                // Create new CSV file
                const csvBlob = new Blob([csvString], { type: 'text/csv' });
                const newFileName = selectedFile.name.replace(/\.(xlsx|xls)$/i, '.csv');
                fileToUpload = new File([csvBlob], newFileName, { type: 'text/csv' });
                
                // Update selectedFile for the rest of the logic
                selectedFile = fileToUpload;
                
                // Update name input if it still has old extension
                const nameInput = document.getElementById('found-data-name');
                if (nameInput && nameInput.value.toLowerCase().endsWith('.xlsx') || nameInput.value.toLowerCase().endsWith('.xls')) {
                    nameInput.value = nameInput.value.replace(/\.(xlsx|xls)$/i, '.csv');
                    name = nameInput.value;
                }
                
                uploadStatus.innerText = '✅ 엑셀을 CSV로 변환했습니다.';
                btn.innerText = originalText;
                btn.disabled = false;
            } catch (err) {
                alert('엑셀 변환 중 오류가 발생했습니다: ' + err.message);
                btn.innerText = originalText;
                btn.disabled = false;
                return;
            }
        }

        // [Check] File size limit (Supabase default is often 50MB)
        const MAX_SIZE = 50 * 1024 * 1024; // 50MB
        if (fileToUpload.size > MAX_SIZE) {
            let samplingSuccessful = false;
            while (!samplingSuccessful) {
                const keywords = prompt(`파일(${Math.round(selectedFile.size/1024/1024)}MB)이 제한(50MB)을 초과합니다.\n\n추출할 키워드들을 공백으로 구분하여 입력해 주세요. (예: 경기도 수원 상가)\n입력한 모든 단어를 포함하는 행만 추출됩니다.`, '경기도 수원');
                
                if (keywords === null) return; // Cancelled
                const targetKeywords = keywords.trim();
                if (!targetKeywords) {
                    alert('하나 이상의 키워드를 입력해야 합니다.');
                    continue;
                }

                try {
                    btn.disabled = true;
                    btn.innerText = '샘플링 중...';
                    const { sampleCsvByKeywords } = await import('./sampler.js');
                    const result = await sampleCsvByKeywords(selectedFile, targetKeywords, (msg) => {
                        uploadStatus.innerText = msg;
                    });

                    const resultSizeMB = result.newSize / (1024 * 1024);
                    if (resultSizeMB > 49.5) { // Leave a small buffer
                        alert(`필터링 결과(${Math.round(resultSizeMB)}MB)가 여전히 50MB 제한에 가깝거나 초과합니다.\n조건을 더 구체적으로 입력하여 범위를 좁혀주세요.`);
                        continue;
                    }

                    const confirmSave = confirm(`스마트 샘플링 결과:\n- 키워드: [${targetKeywords}]\n- 일치 데이터: ${result.rowCount.toLocaleString()}행\n- 최종 용량: ${Math.round(result.newSize/1024)}KB\n\n이 데이터로 정책 연구실에 저장할까요?`);
                    if (!confirmSave) {
                        btn.disabled = false;
                        btn.innerText = originalText;
                        uploadStatus.innerText = '저장이 취소되었습니다.';
                        return;
                    }

                    fileToUpload = result.blob;
                    extractedMeta.sampled = true;
                    extractedMeta.sampled_row_count = result.rowCount; // Pass to save logic
                    extractedMeta.sampling_keywords = targetKeywords;
                    extractedMeta.original_size_mb = Math.round(selectedFile.size/1024/1024);
                    
                    uploadStatus.innerText = `✅ '${targetKeywords}' 데이터 추출 완료 (${result.rowCount.toLocaleString()}행, ${Math.round(result.newSize/1024)}KB)`;
                    samplingSuccessful = true;
                } catch (err) {
                    alert('샘플링 중 오류가 발생했습니다: ' + err.message);
                    btn.disabled = false;
                    btn.innerText = originalText;
                    return;
                }
            }
        }

        btn.disabled = true;
        btn.innerText = '저장 중...';

        try {
            const dataInfo = {
                name: name,
                metadata: extractedMeta,
                file_url: null,
                uploaded_at: new Date().toISOString()
            };

            // 1. Upload file
            let totalRows = 0;
            if (state.user && state.user.student_id !== 'Guest') {
                const { uploadManualFile } = await import('./downloader.js');
                
                // [Diagnostic] Get correct row count if not already sampled
                if (!extractedMeta.sampled) {
                    btn.innerText = '행 수 분석 중...';
                    await new Promise((resolve) => {
                        Papa.parse(fileToUpload, {
                            header: true,
                            skipEmptyLines: true,
                            complete: (results) => {
                                totalRows = results.data.length;
                                resolve();
                            },
                            error: () => resolve() // Fail gracefully
                        });
                    });
                } else {
                    // rowCount from sampling block is needed
                    // In the sampling block, we could have saved it to extractedMeta
                    totalRows = extractedMeta.sampled_row_count || 0;
                }

                const result = await uploadManualFile(state.user.student_id, fileToUpload, selectedFile.name);
                if (result.success) {
                    dataInfo.file_url = result.path;
                    dataInfo.size_kb = result.size_kb;
                } else throw new Error(result.error);

                // 2. Save to DB (Persistent)
                const { saveStudentDataset } = await import('./auth.js');
                await saveStudentDataset(
                    state.user.student_id,
                    dataInfo.name,
                    dataInfo.file_url,
                    dataInfo.metadata,
                    dataInfo.size_kb,
                    totalRows || 0
                );
            } else {
                dataInfo.file_url = `guest/${selectedFile.name}`;
                dataInfo.size_kb = Math.round(fileToUpload.size/1024);
                // Guest doesn't save to DB
            }

            delete state.pendingDataName;
            onDataSelected({ id: 'local-explorer', title: '인허가데이터' }, dataInfo);
        } catch (err) {
            alert('저장 중 오류가 발생했습니다: ' + err.message);
            btn.disabled = false;
            btn.innerText = originalText;
        }
    };
    if (window.lucide) lucide.createIcons();
}

export function showCategoryDetails(catId, state, onDataSelected) {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;
    showSaveInstructions(cat.title, state, onDataSelected);
}
