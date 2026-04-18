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

            <!-- Step 3: Source Links (NEW) -->
            <div class="glass" style="padding: 18px; background: rgba(255,255,255,0.4); border: 1px dashed var(--glass-border);">
                <label style="display: block; font-size: 0.85rem; font-weight: 800; margin-bottom: 10px; color: #334155;">3단계: 자료 링크 주소 (선택)</label>
                <div style="display: grid; gap: 8px;">
                    <input type="text" id="data-link-1" placeholder="링크 1 (예: 포털 상세 페이지)" style="width: 100%; border: 1px solid var(--glass-border); padding: 8px; border-radius: 6px; font-size: 0.8rem;">
                    <input type="text" id="data-link-2" placeholder="링크 2 (예: 원문 사이트)" style="width: 100%; border: 1px solid var(--glass-border); padding: 8px; border-radius: 6px; font-size: 0.8rem;">
                    <input type="text" id="data-link-3" placeholder="링크 3 (기타 소스)" style="width: 100%; border: 1px solid var(--glass-border); padding: 8px; border-radius: 6px; font-size: 0.8rem;">
                </div>
                <p style="font-size: 0.7rem; color: #64748b; margin-top: 8px;">* 1단계 JSON-LD에 정보가 있으면 자동으로 입력됩니다.</p>
            </div>

            <!-- Step 4: Confirm -->
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
            const sizeKb = Math.round(selectedFile.size / 1024);
            const displaySize = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)}MB (${sizeKb.toLocaleString()}KB)` : `${sizeKb.toLocaleString()}KB`;
            uploadStatus.innerText = `📦 ${selectedFile.name} (${displaySize}) 준비됨`;
            const nameField = document.getElementById('found-data-name');
            if (nameField && !nameField.value.trim()) {
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
            
            // Auto-fill Name
            const name = data.alternateName || data.name || '';
            if (name) document.getElementById('found-data-name').value = name;
            
            // Auto-fill Links (Logic for Public Data Portals)
            if (data.url) {
                document.getElementById('data-link-1').value = data.url;
            }
            if (data.distribution && Array.isArray(data.distribution) && data.distribution.length > 0) {
                const dist = data.distribution[0];
                const contentUrl = dist.contentUrl || dist.downloadUrl || '';
                if (contentUrl) document.getElementById('data-link-2').value = contentUrl;
            }
            
            autoMsg.style.display = 'block';
        } catch (e) {
            autoMsg.style.display = 'none';
        }
    });

    document.getElementById('save-data-info').onclick = async () => {
        const source_link_1 = document.getElementById('data-link-1').value.trim();
        const source_link_2 = document.getElementById('data-link-2').value.trim();
        const source_link_3 = document.getElementById('data-link-3').value.trim();
        
        const links = [source_link_1, source_link_2, source_link_3].filter(Boolean);
        if (links.length === 0) return alert('최소 하나의 자료 링크 주소를 입력해 주세요. (1단계 JSON-LD를 붙여넣으면 자동 입력됩니다.)');

        const name = document.getElementById('found-data-name').value.trim();
        if (!name) return alert('데이터셋 이름을 입력해 주세요.');
        if (!selectedFile) return alert('업로드할 파일을 선택해 주세요.');

        const btn = document.getElementById('save-data-info');
        const originalText = btn.innerText;

        // [Pre-process] Convert Excel to CSV if needed
        let fileToUpload = selectedFile;
        let splitFiles = null; // set when user chooses "split all sheets"
        const isExcel = selectedFile.name.toLowerCase().endsWith('.xlsx') || selectedFile.name.toLowerCase().endsWith('.xls');

        if (isExcel) {
            try {
                btn.disabled = true;
                btn.innerText = '시트 분석 중...';
                const buffer = await selectedFile.arrayBuffer();
                const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });

                let selectedSheetName;
                if (workbook.SheetNames.length > 1) {
                    btn.disabled = false;
                    btn.innerText = originalText;
                    const sheetResult = await showSheetSelectModal(workbook);
                    if (!sheetResult) return;

                    if (sheetResult.mode === 'split') {
                        // Convert every sheet to an individual CSV file
                        btn.disabled = true;
                        btn.innerText = '시트 분할 중...';
                        const baseName = selectedFile.name.replace(/\.(xlsx|xls)$/i, '');
                        splitFiles = workbook.SheetNames.map(sheetName => {
                            const ws = workbook.Sheets[sheetName];
                            const csv = sheetToCsvSkipTitleRow(ws);
                            const blob = new Blob([csv], { type: 'text/csv' });
                            // Count data rows directly from the sheet range (no PapaParse needed)
                            const ref = ws['!ref'];
                            const rowCount = ref ? Math.max(0, XLSX.utils.decode_range(ref).e.r) : 0;
                            return {
                                sheetName,
                                rowCount,
                                file: new File([blob], `${baseName}_${sheetName}.csv`, { type: 'text/csv' })
                            };
                        });
                        uploadStatus.innerText = `✅ ${splitFiles.length}개 시트를 개별 CSV로 분할했습니다.`;
                        btn.innerText = originalText;
                        btn.disabled = false;
                        // Skip single-sheet conversion below
                    } else {
                        selectedSheetName = sheetResult.dataSheet;
                        btn.disabled = true;
                        btn.innerText = 'CSV 변환 중...';
                    }
                } else {
                    selectedSheetName = workbook.SheetNames[0];
                }

                if (!splitFiles) {
                    const worksheet = workbook.Sheets[selectedSheetName];
                    const csvString = sheetToCsvSkipTitleRow(worksheet);
                    const csvBlob = new Blob([csvString], { type: 'text/csv' });
                    const newFileName = selectedFile.name.replace(/\.(xlsx|xls)$/i, '.csv');
                    fileToUpload = new File([csvBlob], newFileName, { type: 'text/csv' });
                    selectedFile = fileToUpload;

                    const nameInput = document.getElementById('found-data-name');
                    if (nameInput && (nameInput.value.toLowerCase().endsWith('.xlsx') || nameInput.value.toLowerCase().endsWith('.xls'))) {
                        nameInput.value = nameInput.value.replace(/\.(xlsx|xls)$/i, '.csv');
                    }
                    uploadStatus.innerText = `✅ "${selectedSheetName}" 시트를 CSV로 변환했습니다.`;
                    btn.innerText = originalText;
                    btn.disabled = false;
                }
            } catch (err) {
                alert('엑셀 변환 중 오류가 발생했습니다: ' + err.message);
                btn.innerText = originalText;
                btn.disabled = false;
                return;
            }
        }

        // [Check] File size limit — single file mode only
        const MAX_SIZE = 50 * 1024 * 1024;
        if (!splitFiles && fileToUpload.size > MAX_SIZE) {
            btn.disabled = true;
            btn.innerText = '컬럼 분석 중...';

            let headers = [];
            let fileEncoding = 'UTF-8';
            try {
                const { parseCsvHeaders } = await import('./sampler.js');
                const headerResult = await parseCsvHeaders(fileToUpload);
                headers = headerResult.fields;
                fileEncoding = headerResult.encoding;
            } catch(e) {
                alert('파일 헤더를 읽는 중 오류가 발생했습니다: ' + e.message);
                btn.disabled = false; btn.innerText = originalText; return;
            }

            btn.disabled = false;
            btn.innerText = originalText;

            const result = await showColumnFilterModal(fileToUpload, headers, selectedFile.size, uploadStatus, fileEncoding);
            if (!result) return;

            fileToUpload = result.blob;
            extractedMeta.sampled = true;
            extractedMeta.sampled_row_count = result.rowCount;
            extractedMeta.filter_conditions = result.conditions;
            extractedMeta.original_size_mb = Math.round(selectedFile.size / 1024 / 1024);
            const sizeKb = Math.round(result.blob.size / 1024);
            const displaySize = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)}MB (${sizeKb.toLocaleString()}KB)` : `${sizeKb.toLocaleString()}KB`;
            uploadStatus.innerText = `✅ 필터링 완료 (${result.rowCount.toLocaleString()}행, ${displaySize})`;
        }

        btn.disabled = true;
        btn.innerText = '저장 중...';

        try {
            const baseMetadata = { ...extractedMeta, source_links: links };

            // ── Split mode: upload each sheet as a separate dataset ──────────
            if (splitFiles && state.user && state.user.student_id !== 'Guest') {
                const { uploadManualFile } = await import('./downloader.js');
                const { saveStudentDataset } = await import('./auth.js');
                let firstDataInfo = null;
                const total = splitFiles.length;

                for (let i = 0; i < total; i++) {
                    const { sheetName, file, rowCount } = splitFiles[i];
                    // 이미 name 끝에 sheetName이 포함되어 있으면 중복 추가 방지
                    const dsName = name.endsWith(`_${sheetName}`) || name === sheetName
                        ? name
                        : `${name}_${sheetName}`;
                    const sizeLabel = file.size >= 1024 * 1024
                        ? `${(file.size / 1024 / 1024).toFixed(1)}MB`
                        : `${Math.round(file.size / 1024)}KB`;

                    btn.innerText = `업로드 중 (${i + 1}/${total})...`;
                    uploadStatus.innerText = `☁️ "${sheetName}" 업로드 중... (${sizeLabel})`;
                    const uploadResult = await uploadManualFile(state.user.student_id, file, dsName);
                    if (!uploadResult.success) throw new Error(uploadResult.error);

                    btn.innerText = `DB 저장 중 (${i + 1}/${total})...`;
                    uploadStatus.innerText = `💾 "${sheetName}" DB 저장 중...`;
                    await saveStudentDataset(state.user.student_id, dsName, uploadResult.path, baseMetadata, uploadResult.size_kb, rowCount);

                    if (!firstDataInfo) firstDataInfo = { name: dsName, file_url: uploadResult.path, metadata: baseMetadata, size_kb: uploadResult.size_kb };
                }

                btn.innerText = '✅ 저장 완료!';
                btn.disabled = false;
                uploadStatus.innerText = `✅ ${total}개 시트가 개별 데이터셋으로 저장되었습니다!`;
                delete state.pendingDataName;
                onDataSelected({ id: 'local-explorer', title: '인허가데이터' }, firstDataInfo);
                return;
            }

            // ── Single file mode ─────────────────────────────────────────────
            const dataInfo = {
                name: name,
                metadata: baseMetadata,
                file_url: null,
                uploaded_at: new Date().toISOString()
            };

            let totalRows = 0;
            if (state.user && state.user.student_id !== 'Guest') {
                const { uploadManualFile } = await import('./downloader.js');

                if (!extractedMeta.sampled) {
                    btn.innerText = '행 수 분석 중...';
                    uploadStatus.innerText = '📊 행 수를 계산하고 있습니다...';
                    await new Promise((resolve) => {
                        const timeout = setTimeout(resolve, 15000);
                        Papa.parse(fileToUpload, {
                            header: true,
                            skipEmptyLines: true,
                            complete: (results) => { clearTimeout(timeout); totalRows = results.data.length; resolve(); },
                            error: () => { clearTimeout(timeout); resolve(); }
                        });
                    });
                    uploadStatus.innerText = `📊 ${totalRows.toLocaleString()}행 확인 완료`;
                } else {
                    totalRows = extractedMeta.sampled_row_count || 0;
                }

                const sizeLabel = fileToUpload.size >= 1024 * 1024
                    ? `${(fileToUpload.size / 1024 / 1024).toFixed(1)}MB`
                    : `${Math.round(fileToUpload.size / 1024)}KB`;
                btn.innerText = '업로드 중...';
                uploadStatus.innerText = `☁️ 파일을 서버에 올리는 중... (${sizeLabel})`;
                const result = await uploadManualFile(state.user.student_id, fileToUpload, dataInfo.name);
                if (result.success) {
                    dataInfo.file_url = result.path;
                    dataInfo.size_kb = result.size_kb;
                } else throw new Error(result.error);

                btn.innerText = 'DB 저장 중...';
                uploadStatus.innerText = '💾 데이터베이스에 저장하는 중...';
                const { saveStudentDataset } = await import('./auth.js');
                await saveStudentDataset(state.user.student_id, dataInfo.name, dataInfo.file_url, dataInfo.metadata, dataInfo.size_kb, totalRows || 0);
            } else {
                dataInfo.file_url = `guest/${selectedFile.name}`;
                dataInfo.size_kb = Math.round(fileToUpload.size / 1024);
            }

            btn.innerText = '✅ 저장 완료!';
            btn.disabled = false;
            uploadStatus.innerText = '✅ 저장이 완료되었습니다. 3단계로 이동합니다...';
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

/**
 * Shows a modal for selecting which sheet to use when an Excel has multiple sheets.
 * Returns:
 *   { mode: 'single', dataSheet: string }  — convert one sheet
 *   { mode: 'split' }                       — split all sheets into separate CSVs
 *   null                                    — cancelled
 */
function showSheetSelectModal(workbook) {
    return new Promise((resolve) => {
        const existing = document.getElementById('sheet-select-modal-overlay');
        if (existing) existing.remove();

        const CODEBOOK_NAMES = ['변수정보', '변수값', '코드북', '설명', 'codebook', 'variables', 'metadata'];

        const sheetInfos = workbook.SheetNames.map(name => {
            const sheet = workbook.Sheets[name];
            const ref = sheet['!ref'];
            let rows = 0, cols = 0;
            if (ref) {
                const range = XLSX.utils.decode_range(ref);
                rows = range.e.r - range.s.r + 1;
                cols = range.e.c - range.s.c + 1;
            }
            const upper = name.toUpperCase();
            const lower = name.toLowerCase();
            const isDataSheet = upper.includes('DATA') || upper.includes('데이터') || upper.includes('원자료');
            const isCodebook = CODEBOOK_NAMES.some(n => lower.includes(n.toLowerCase()));
            return { name, rows, cols, isDataSheet, isCodebook };
        });

        let selectedSheet = (sheetInfos.find(s => s.isDataSheet) || sheetInfos[0]).name;

        const overlay = document.createElement('div');
        overlay.id = 'sheet-select-modal-overlay';
        overlay.style.cssText = `
            position:fixed; inset:0; background:rgba(0,0,0,0.55); z-index:9999;
            display:flex; align-items:center; justify-content:center; padding:20px;
        `;

        const render = () => {
            overlay.innerHTML = `
                <div style="background:#fff; border-radius:16px; padding:28px; width:100%; max-width:520px; max-height:85vh; overflow-y:auto; box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                    <h3 style="margin:0 0 6px; font-size:1.1rem; color:#1e293b;">📋 엑셀 시트 처리 방식을 선택하세요</h3>
                    <p style="margin:0 0 16px; font-size:0.83rem; color:#64748b;">이 엑셀 파일에는 <strong>${sheetInfos.length}개의 시트</strong>가 있습니다.</p>

                    <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:20px;">
                        ${sheetInfos.map(s => `
                            <div class="sheet-item" data-name="${s.name}" style="
                                padding:12px 16px; border-radius:10px; cursor:pointer;
                                border:2px solid ${s.name === selectedSheet ? '#3b82f6' : '#e2e8f0'};
                                background:${s.name === selectedSheet ? '#eff6ff' : '#f8fafc'};
                                display:flex; align-items:center; gap:12px;
                            ">
                                <span style="font-size:1.3rem;">${s.isDataSheet ? '📊' : s.isCodebook ? '📖' : '📄'}</span>
                                <div style="flex:1; min-width:0;">
                                    <div style="font-weight:700; font-size:0.9rem; color:#1e293b; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                                        ${s.name}
                                        ${s.isDataSheet ? `<span style="background:#dbeafe; color:#1d4ed8; font-size:0.68rem; padding:2px 7px; border-radius:99px; font-weight:700; white-space:nowrap;">DATA</span>` : ''}
                                        ${s.isCodebook ? `<span style="background:#f0fdf4; color:#15803d; font-size:0.68rem; padding:2px 7px; border-radius:99px; font-weight:700; white-space:nowrap;">코드북</span>` : ''}
                                    </div>
                                    <div style="font-size:0.75rem; color:#64748b; margin-top:3px;">${s.rows.toLocaleString()}행 × ${s.cols}열</div>
                                </div>
                                ${s.name === selectedSheet ? `<span style="color:#3b82f6; font-size:1.2rem; flex-shrink:0;">✓</span>` : ''}
                            </div>
                        `).join('')}
                    </div>

                    <div style="border-top:1px solid #e2e8f0; padding-top:16px; margin-bottom:16px;">
                        <button id="sheet-split-btn" style="
                            width:100%; padding:12px; background:#f0fdf4; border:2px dashed #86efac;
                            border-radius:10px; cursor:pointer; font-size:0.88rem; font-weight:700;
                            color:#15803d; display:flex; align-items:center; justify-content:center; gap:8px;
                        ">
                            <span style="font-size:1.1rem;">📂</span>
                            모든 시트를 개별 CSV로 분할 저장 (${sheetInfos.length}개 데이터셋 생성)
                        </button>
                        <p style="font-size:0.75rem; color:#64748b; margin:8px 0 0; text-align:center;">
                            각 시트가 <em>파일명_시트명.csv</em> 형태의 독립 데이터셋으로 저장됩니다.
                        </p>
                    </div>

                    <div style="display:flex; gap:10px; justify-content:flex-end;">
                        <button id="sheet-cancel-btn" style="padding:9px 22px; background:#f1f5f9; border:1px solid #e2e8f0; border-radius:8px; cursor:pointer; font-size:0.9rem;">취소</button>
                        <button id="sheet-confirm-btn" style="padding:9px 22px; background:#3b82f6; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:600; font-size:0.9rem;">
                            선택한 시트만 변환
                        </button>
                    </div>
                </div>
            `;

            overlay.querySelectorAll('.sheet-item').forEach(el => {
                el.onclick = () => { selectedSheet = el.dataset.name; render(); };
            });

            overlay.querySelector('#sheet-cancel-btn').onclick = () => { overlay.remove(); resolve(null); };
            overlay.querySelector('#sheet-split-btn').onclick = () => { overlay.remove(); resolve({ mode: 'split' }); };
            overlay.querySelector('#sheet-confirm-btn').onclick = () => {
                overlay.remove();
                resolve({ mode: 'single', dataSheet: selectedSheet });
            };
        };

        document.body.appendChild(overlay);
        render();
    });
}

/**
 * Shows a modal UI for column-based CSV filtering.
 * Returns a Promise<{blob, rowCount, conditions}> or null if cancelled.
 */
/**
 * Converts a worksheet to CSV, skipping the first row if it is a title row
 * (i.e. only the first cell has content and all other cells in that row are empty).
 * This prevents PapaParse "Duplicate headers" warnings from merged-cell title rows
 * that are common in Korean public data Excel files.
 */
function sheetToCsvSkipTitleRow(ws) {
    if (!ws['!ref']) return XLSX.utils.sheet_to_csv(ws);
    const range = XLSX.utils.decode_range(ws['!ref']);
    if (range.e.r < 1) return XLSX.utils.sheet_to_csv(ws); // single row — nothing to skip

    // Check if row 0 is a title row: first cell has a value, all other cells in that row are empty
    const firstCell = ws[XLSX.utils.encode_cell({ r: 0, c: 0 })];
    if (!firstCell || !firstCell.v) return XLSX.utils.sheet_to_csv(ws);

    let isTitleRow = true;
    for (let c = range.s.c + 1; c <= range.e.c; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
        if (cell && cell.v !== undefined && cell.v !== '') { isTitleRow = false; break; }
    }

    if (!isTitleRow) return XLSX.utils.sheet_to_csv(ws);

    // Skip row 0 by adjusting the range
    const trimmedRange = { ...range, s: { ...range.s, r: 1 } };
    return XLSX.utils.sheet_to_csv(ws, { range: trimmedRange });
}

function showColumnFilterModal(file, headers, originalSizeBytes, uploadStatus, encoding = 'UTF-8') {
    return new Promise((resolve) => {
        // Remove any existing modal
        const existingModal = document.getElementById('filter-modal-overlay');
        if (existingModal) existingModal.remove();

        const OPERATORS = ['포함', '=', '!=', '>', '<', '>=', '<='];
        let conditions = [{ column: headers[0] || '', operator: '=', value: '' }];
        let filterResult = null;

        const overlay = document.createElement('div');
        overlay.id = 'filter-modal-overlay';
        overlay.style.cssText = `
            position:fixed; inset:0; background:rgba(0,0,0,0.55); z-index:9999;
            display:flex; align-items:center; justify-content:center; padding:20px;
        `;

        function buildOptionHtml(items, selected) {
            return items.map(h => `<option value="${h}" ${h === selected ? 'selected' : ''}>${h}</option>`).join('');
        }

        function renderModal() {
            overlay.innerHTML = `
                <div style="background:#fff; border-radius:16px; padding:30px; width:100%; max-width:620px; max-height:90vh; overflow-y:auto; box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                    <h3 style="margin:0 0 6px; font-size:1.15rem; color:#1e293b;">📊 데이터 필터링 조건 설정</h3>
                    <p style="margin:0 0 18px; font-size:0.85rem; color:#64748b;">
                        파일 용량: <strong>${Math.round(originalSizeBytes/1024/1024)}MB</strong> (50MB 초과 → 필터링 필요)
                    </p>

                    <div id="filter-conditions-list" style="display:flex; flex-direction:column; gap:10px; margin-bottom:16px;">
                        ${conditions.map((c, i) => `
                            <div style="display:flex; align-items:center; gap:8px; padding:10px 12px; background:#f8fafc; border-radius:10px; border:1px solid #e2e8f0;" data-idx="${i}">
                                <div style="font-size:0.75rem; color:#64748b; min-width:28px;">${i === 0 ? 'WHERE' : 'AND'}</div>
                                <select class="fc-col" style="flex:2; padding:7px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.85rem;">
                                    ${buildOptionHtml(headers, c.column)}
                                </select>
                                <select class="fc-op" style="flex:1; padding:7px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.85rem;">
                                    ${buildOptionHtml(OPERATORS, c.operator)}
                                </select>
                                <input class="fc-val" type="text" value="${c.value}" placeholder="값 입력" style="flex:2; padding:7px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.85rem;">
                                ${i > 0 ? `<button class="fc-remove" style="background:none; border:none; color:#ef4444; font-size:1.1rem; cursor:pointer; padding:2px 4px;">✕</button>` : '<div style="width:24px;"></div>'}
                            </div>
                        `).join('')}
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
                        ${conditions.length < 3 ? `
                            <button id="fc-add-btn" style="padding:7px 16px; background:#f1f5f9; border:1px solid #e2e8f0; border-radius:8px; cursor:pointer; font-size:0.85rem; color:#475569;">
                                + 조건 추가 (AND)
                            </button>
                        ` : '<div></div>'}
                        <button id="fc-run-btn" style="padding:8px 22px; background:#3b82f6; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:600; font-size:0.9rem;">
                            🔍 필터 실행
                        </button>
                    </div>

                    <div id="fc-result-area" style="min-height:36px; margin-bottom:18px; font-size:0.9rem; color:#475569; padding:10px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; display:${filterResult ? 'block' : 'none'};">
                        ${filterResult ? (() => {
                            const sizeKb = Math.round(filterResult.blob.size / 1024);
                            const displaySize = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)}MB (${sizeKb.toLocaleString()}KB)` : `${sizeKb.toLocaleString()}KB`;
                            return `✅ <strong>${filterResult.rowCount.toLocaleString()}행</strong> 추출됨 (${displaySize})`;
                        })() : ''}
                    </div>

                    <div style="display:flex; gap:10px; justify-content:flex-end;">
                        <button id="fc-cancel-btn" style="padding:9px 22px; background:#f1f5f9; border:1px solid #e2e8f0; border-radius:8px; cursor:pointer; font-size:0.9rem;">취소</button>
                        <button id="fc-confirm-btn" style="padding:9px 22px; background:${filterResult ? '#10b981' : '#94a3b8'}; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:600; font-size:0.9rem;" ${filterResult ? '' : 'disabled'}>
                            📥 이 데이터로 저장하기
                        </button>
                    </div>
                </div>
            `;

            // Sync condition state from DOM -> array on change
            overlay.querySelectorAll('[data-idx]').forEach(row => {
                const i = parseInt(row.dataset.idx);
                row.querySelector('.fc-col').onchange = e => { conditions[i].column = e.target.value; };
                row.querySelector('.fc-op').onchange = e => { conditions[i].operator = e.target.value; };
                row.querySelector('.fc-val').oninput = e => { conditions[i].value = e.target.value; filterResult = null; renderModal(); };
                const removeBtn = row.querySelector('.fc-remove');
                if (removeBtn) removeBtn.onclick = () => { conditions.splice(i, 1); filterResult = null; renderModal(); };
            });

            const addBtn = overlay.querySelector('#fc-add-btn');
            if (addBtn) addBtn.onclick = () => {
                conditions.push({ column: headers[0] || '', operator: '=', value: '' });
                filterResult = null;
                renderModal();
            };

            overlay.querySelector('#fc-cancel-btn').onclick = () => { overlay.remove(); resolve(null); };
            overlay.querySelector('#fc-confirm-btn').onclick = () => {
                if (!filterResult) return;
                overlay.remove();
                resolve({ ...filterResult, conditions });
            };

            overlay.querySelector('#fc-run-btn').onclick = async () => {
                // Validate conditions
                const valid = conditions.filter(c => c.column && c.value.trim() !== '');
                if (valid.length === 0) { alert('조건을 하나 이상 완성해 주세요 (컬럼 + 값 필수).'); return; }

                const runBtn = overlay.querySelector('#fc-run-btn');
                runBtn.disabled = true;
                runBtn.textContent = '분석 중...';
                if (uploadStatus) uploadStatus.innerText = '데이터 필터링 중...';

                try {
                    const { sampleCsvByConditions } = await import('./sampler.js');
                    const r = await sampleCsvByConditions(file, valid, (msg) => {
                        if (uploadStatus) uploadStatus.innerText = msg;
                        const ra = overlay.querySelector('#fc-result-area');
                        if (ra) { ra.style.display = 'block'; ra.textContent = msg; }
                    }, encoding);

                    const sizeMB = r.blob.size / (1024 * 1024);
                    if (sizeMB > 49.5) {
                        alert(`필터링 결과(${Math.round(sizeMB)}MB)가 아직 50MB 제한에 가깝습니다.\n조건을 더 추가해 범위를 좁혀주세요.`);
                        runBtn.disabled = false;
                        runBtn.textContent = '🔍 필터 실행';
                        return;
                    }

                    filterResult = r;
                    renderModal();
                } catch (err) {
                    alert('필터링 오류: ' + err.message);
                    runBtn.disabled = false;
                    runBtn.textContent = '🔍 필터 실행';
                }
            };
        }

        document.body.appendChild(overlay);
        renderModal();
    });
}
