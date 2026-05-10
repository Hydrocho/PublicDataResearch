import { supabaseClient } from './config.js';

function renderTeacherUploadPanelHTML() {
    return `
    <div id="teacher-upload-panel" style="margin-bottom:20px;border:1.5px dashed #6366f1;border-radius:12px;overflow:hidden;">
        <button id="teacher-upload-toggle-btn" style="width:100%;display:flex;justify-content:space-between;align-items:center;padding:14px 18px;background:#eef2ff;border:none;cursor:pointer;font-size:0.95rem;font-weight:700;color:#4338ca;">
            <span style="display:flex;align-items:center;gap:8px;">
                <i data-lucide="upload-cloud" size="18"></i> 교사 데이터 직접 등록
            </span>
            <i data-lucide="chevron-down" size="18" id="teacher-upload-chevron"></i>
        </button>
        <div id="teacher-upload-form" style="display:none;padding:20px;background:white;border-top:1px solid #e0e7ff;">
            <p style="font-size:0.85rem;color:#6366f1;margin:0 0 16px;"><i data-lucide="info" size="14" style="vertical-align:middle;margin-right:4px;"></i> 교사가 직접 수집한 자료를 등록하면 학생 연구에 활용 가능하고 교사 테스트 모드에서도 사용할 수 있습니다.</p>
            <div style="display:grid;gap:14px;">
                <div>
                    <label style="display:block;font-size:0.82rem;font-weight:700;color:#334155;margin-bottom:6px;">메타데이터 JSON-LD (선택 — 공공데이터포털 상세페이지 하단 스크립트 붙여넣기)</label>
                    <textarea id="teacher-upload-json" placeholder="JSON-LD 내용을 붙여넣으면 이름이 자동 입력됩니다." style="width:100%;height:80px;padding:10px;border-radius:8px;font-size:0.75rem;font-family:'Consolas',monospace;border:1px solid #e2e8f0;box-sizing:border-box;"></textarea>
                    <p id="teacher-json-auto-msg" style="font-size:0.75rem;color:#15803d;font-weight:700;display:none;margin:4px 0 0;">🪄 데이터 정보가 감지되었습니다!</p>
                </div>
                <div style="background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e2e8f0;">
                    <label style="display:block;font-size:0.82rem;font-weight:700;color:#334155;margin-bottom:8px;">CSV / Excel 파일 선택 <span style="color:#dc2626;">(필수)</span></label>
                    <button id="teacher-file-select-btn" class="btn-secondary" style="width:100%;padding:10px;font-weight:600;">📁 파일 업로드 (CSV / Excel)</button>
                    <input type="file" id="teacher-file-input" style="display:none;" accept=".csv,.xlsx,.xls">
                    <div id="teacher-upload-status" style="font-size:0.8rem;color:var(--primary);margin-top:8px;font-weight:700;min-height:18px;"></div>
                </div>
                <div>
                    <label style="display:block;font-size:0.82rem;font-weight:700;color:#334155;margin-bottom:6px;">데이터셋 이름 <span style="color:#dc2626;">(필수)</span></label>
                    <input type="text" id="teacher-upload-name" placeholder="데이터셋 이름을 입력하세요" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:0.92rem;box-sizing:border-box;">
                </div>
                <button id="teacher-upload-save-btn" class="btn-primary" style="width:100%;padding:14px;font-size:1rem;font-weight:800;background:#4f46e5;border-color:#4f46e5;">저장하기</button>
            </div>
        </div>
    </div>`;
}

async function setupTeacherUploadPanel(container, teacherEmail, onSuccess) {
    const toggleBtn = container.querySelector('#teacher-upload-toggle-btn');
    const form = container.querySelector('#teacher-upload-form');
    const chevron = container.querySelector('#teacher-upload-chevron');
    if (toggleBtn && form) {
        toggleBtn.onclick = () => {
            const open = form.style.display !== 'none';
            form.style.display = open ? 'none' : 'block';
            if (chevron) chevron.style.transform = open ? '' : 'rotate(180deg)';
            if (window.lucide) lucide.createIcons();
        };
    }

    const fileInput = container.querySelector('#teacher-file-input');
    const fileSelectBtn = container.querySelector('#teacher-file-select-btn');
    const uploadStatus = container.querySelector('#teacher-upload-status');
    const nameInput = container.querySelector('#teacher-upload-name');
    const jsonArea = container.querySelector('#teacher-upload-json');
    const jsonAutoMsg = container.querySelector('#teacher-json-auto-msg');
    const saveBtn = container.querySelector('#teacher-upload-save-btn');
    let selectedFile = null;
    let extractedMeta = {};

    if (fileSelectBtn) fileSelectBtn.onclick = () => fileInput && fileInput.click();

    if (fileInput) {
        fileInput.onchange = (e) => {
            if (!e.target.files.length) return;
            selectedFile = e.target.files[0];
            const sizeKb = Math.round(selectedFile.size / 1024);
            const displaySize = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)}MB (${sizeKb.toLocaleString()}KB)` : `${sizeKb.toLocaleString()}KB`;
            if (uploadStatus) uploadStatus.innerText = `📦 ${selectedFile.name} (${displaySize}) 준비됨`;
            if (nameInput && !nameInput.value.trim()) {
                nameInput.value = selectedFile.name.replace(/\.[^.]+$/, '');
            }
        };
    }

    if (jsonArea) {
        jsonArea.addEventListener('input', () => {
            let str = jsonArea.value.trim();
            if (str.length < 30) return;
            try {
                str = str.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
                str = str.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"').replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");
                const data = JSON.parse(str);
                extractedMeta = data;
                const name = data.alternateName || data.name || '';
                if (name && nameInput && !nameInput.value.trim()) nameInput.value = name;
                if (jsonAutoMsg) jsonAutoMsg.style.display = 'block';
            } catch {
                if (jsonAutoMsg) jsonAutoMsg.style.display = 'none';
            }
        });
    }

    if (saveBtn) {
        saveBtn.onclick = async () => {
            const name = nameInput ? nameInput.value.trim() : '';
            if (!name) { alert('데이터셋 이름을 입력해 주세요.'); return; }
            if (!selectedFile) { alert('업로드할 파일을 선택해 주세요.'); return; }

            let fileToUpload = selectedFile;
            const isExcel = selectedFile.name.toLowerCase().endsWith('.xlsx') || selectedFile.name.toLowerCase().endsWith('.xls');

            if (isExcel) {
                try {
                    saveBtn.disabled = true;
                    saveBtn.innerText = 'CSV 변환 중...';
                    const buffer = await selectedFile.arrayBuffer();
                    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
                    const csvString = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
                    const csvBlob = new Blob([csvString], { type: 'text/csv' });
                    fileToUpload = new File([csvBlob], selectedFile.name.replace(/\.(xlsx|xls)$/i, '.csv'), { type: 'text/csv' });
                    if (uploadStatus) uploadStatus.innerText = '✅ 엑셀을 CSV로 변환했습니다.';
                    saveBtn.disabled = false;
                    saveBtn.innerText = '저장하기';
                } catch (err) {
                    alert('엑셀 변환 중 오류가 발생했습니다: ' + err.message);
                    saveBtn.disabled = false; saveBtn.innerText = '저장하기'; return;
                }
            }

            saveBtn.disabled = true;
            saveBtn.innerText = '저장 중...';
            try {
                let totalRows = 0;
                await new Promise((resolve) => {
                    Papa.parse(fileToUpload, { header: true, skipEmptyLines: true, complete: (r) => { totalRows = r.data.length; resolve(); }, error: () => resolve() });
                });

                const { uploadManualFile } = await import('./downloader.js');
                const result = await uploadManualFile(teacherEmail, fileToUpload, name);
                if (!result.success) throw new Error(result.error);

                const { saveTeacherDataset } = await import('./auth.js');
                const { error } = await saveTeacherDataset(teacherEmail, name, result.path, extractedMeta, result.size_kb, totalRows);
                if (error) throw new Error(error.message);

                if (uploadStatus) uploadStatus.innerText = '✅ 저장 완료!';
                saveBtn.innerText = '저장 완료!';
                setTimeout(() => {
                    if (onSuccess) onSuccess();
                }, 800);
            } catch (err) {
                alert('저장 중 오류가 발생했습니다: ' + err.message);
                saveBtn.disabled = false; saveBtn.innerText = '저장하기';
            }
        };
    }
}

export function renderTeacherDataManagement(datasets, onToggleShare, teacherIds = [], teacherEmail = null, showUploadPanel = true, onTeacherUploadSuccess = null) {
    const container = document.getElementById('teacher-dataset-list');
    if (!container) return;

    if (!datasets || datasets.length === 0) {
        container.innerHTML = `
            ${showUploadPanel && teacherEmail ? renderTeacherUploadPanelHTML() : ''}
            <p class="text-muted" style="text-align:center; padding: 40px;">수집된 데이터셋이 없습니다.</p>`;
        if (showUploadPanel && teacherEmail) setupTeacherUploadPanel(container, teacherEmail, onTeacherUploadSuccess);
        if (window.lucide) lucide.createIcons();
        return;
    }

    // Sort: teacher-uploaded datasets first (by data_name asc), then the rest in original order
    const isTeacherDs = (ds) => teacherEmail && (ds.student_id === teacherEmail || ds.metadata?.teacher_email === teacherEmail);
    const teacherOwned = [...datasets].filter(isTeacherDs).sort((a, b) => (a.data_name || '').localeCompare(b.data_name || '', 'ko'));
    const others = datasets.filter(ds => !isTeacherDs(ds));
    datasets = [...teacherOwned, ...others];

    const students = [];
    const seenIds = new Set();
    datasets.forEach(ds => {
        if (ds.student_id && !seenIds.has(ds.student_id) && ds.student_id !== teacherEmail) {
            seenIds.add(ds.student_id);
            students.push({
                id: ds.student_id,
                name: ds.students?.name || ds.student_id
            });
        }
    });
    students.sort((a, b) => a.id.localeCompare(b.id));

    container.innerHTML = `
        ${showUploadPanel && teacherEmail ? renderTeacherUploadPanelHTML() : ''}

        <div style="margin-bottom:20px; padding:18px; background:white; border:1px solid #e2e8f0; border-radius:12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <div style="font-weight:700; font-size:0.95rem; color:var(--secondary); display:flex; align-items:center; gap:8px;">
                    <i data-lucide="filter" size="18" style="color:var(--primary);"></i>
                    학생별 데이터 보기 (다중 선택 가능)
                </div>
                <div style="display:flex; gap:10px;">
                    <button id="filter-all-btn" class="btn-secondary" style="font-size:0.75rem; padding:4px 10px;">전체 선택</button>
                    <button id="filter-none-btn" class="btn-secondary" style="font-size:0.75rem; padding:4px 10px;">전체 해제</button>
                </div>
            </div>
            <div id="student-filter-list" style="display:flex; flex-wrap:wrap; gap:8px; max-height:120px; overflow-y:auto; padding:4px;">
                <!-- Teacher Filter -->
                <label style="display:flex; align-items:center; gap:6px; padding:5px 14px; background:#eef2ff; border-radius:20px; font-size:0.85rem; cursor:pointer; border:1px solid #c7d2fe; transition:all 0.2s;" class="student-filter-label teacher-filter-label">
                    <input type="checkbox" class="student-filter-chk" value="__teacher__" checked style="width:14px; height:14px; accent-color:#4f46e5;">
                    <i data-lucide="shield-check" size="14" style="color:#4f46e5;"></i>
                    <span style="font-weight:700; color:#3730a3;">교사용 자료</span>
                </label>
                ${students.map(s => `
                    <label style="display:flex; align-items:center; gap:6px; padding:5px 12px; background:#f1f5f9; border-radius:20px; font-size:0.82rem; cursor:pointer; border:1px solid #e2e8f0; transition:all 0.2s;" class="student-filter-label">
                        <input type="checkbox" class="student-filter-chk" value="${s.id}" checked style="width:14px; height:14px; accent-color:var(--primary);">
                        <span style="font-weight:600; color:#334155;">${s.name}</span>
                        <span style="font-size:0.72rem; color:#94a3b8;">${s.id}</span>
                    </label>
                `).join('')}
            </div>
        </div>

        <!-- Keyword Search & Sorting Box -->
        <div style="margin-bottom:20px; padding:18px; background:white; border:1px solid #e2e8f0; border-radius:12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <div style="font-weight:700; font-size:0.95rem; color:var(--secondary); display:flex; align-items:center; gap:8px;">
                    <i data-lucide="filter" size="18" style="color:var(--primary);"></i>
                    데이터 검색 및 정렬 설정
                </div>
                <div style="display:flex; gap:10px; align-items:center;">
                    <div style="display:flex; background:#f1f5f9; padding:3px; border-radius:8px; border:1px solid #e2e8f0;">
                        <label style="cursor:pointer; padding:5px 12px; border-radius:6px; font-size:0.75rem; font-weight:700; transition:all 0.2s;" class="search-logic-label active">
                            <input type="radio" name="search-logic" value="and" checked style="display:none;"> AND
                        </label>
                        <label style="cursor:pointer; padding:5px 12px; border-radius:6px; font-size:0.75rem; font-weight:700; transition:all 0.2s;" class="search-logic-label">
                            <input type="radio" name="search-logic" value="or" style="display:none;"> OR
                        </label>
                    </div>
                </div>
            </div>
            
            <div style="display:flex; gap:15px; align-items:center; flex-wrap:wrap;">
                <div style="position:relative; flex:1; min-width:300px;">
                    <input type="text" id="dataset-search-input" placeholder="키워드로 데이터셋 검색 (여러 개는 공백 구분)..." 
                           style="width:100%; padding:10px 15px 10px 40px; border:1px solid #e2e8f0; border-radius:10px; font-size:0.9rem; font-family:inherit; outline:none; transition:all 0.2s;">
                    <i data-lucide="search" size="16" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#94a3b8;"></i>
                </div>
                
                <div style="display:flex; align-items:center; gap:8px; padding-left:15px; border-left:2px solid #f1f5f9;">
                    <i data-lucide="list-ordered" size="16" style="color:#64748b;"></i>
                    <select id="teacher-ds-sort-select" style="font-size:0.85rem; padding:9px 12px; border:1.5px solid #e2e8f0; border-radius:10px; background:white; color:#475569; outline:none; cursor:pointer; font-weight:600;">
                        <option value="time-desc">최신 업로드순</option>
                        <option value="time-asc">과거 업로드순</option>
                        <option value="name-asc">데이터 이름순 (ㄱ-ㅎ)</option>
                        <option value="name-desc">데이터 이름순 (ㅎ-ㄱ)</option>
                        <option value="size-desc">용량 큰 순</option>
                    </select>
                </div>
            </div>

            <!-- New: Filter for Teacher Test Checked items -->
            <div style="margin-top:15px; padding-top:12px; border-top:1px solid #f1f5f9;">
                <label style="display:inline-flex; align-items:center; gap:10px; cursor:pointer; padding:6px 14px; background:#fffbeb; border:1px solid #fde68a; border-radius:8px; transition:all 0.2s; user-select:none;">
                    <input type="checkbox" id="filter-teacher-test-only-chk" style="width:16px; height:16px; accent-color:#f59e0b; cursor:pointer;">
                    <span style="font-size:0.88rem; font-weight:700; color:#92400e;">
                        <i data-lucide="flask-conical" size="14" style="vertical-align:middle; margin-right:4px;"></i>
                        교사 테스트 활용 체크된 자료만 보기
                    </span>
                </label>
            </div>
        </div>

        <div style="margin-bottom:12px;padding:10px 14px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:0.85rem;color:#92400e;display:flex;align-items:center;gap:8px;">
            <i data-lucide="flask-conical" size="15"></i>
            <span><strong>교사 테스트 활용</strong> 체크 = 4단계 교사 테스트 모드에서 이 데이터셋을 사용합니다. 학생 기록에는 영향을 주지 않습니다.</span>
        </div>

        <!-- Bulk Action Bar -->
        <div id="teacher-bulk-action-bar" style="display:none; margin-bottom:12px; padding:12px 18px; background:#fff1f2; border:1px solid #fda4af; border-radius:10px; align-items:center; justify-content:space-between; animation: slideDown 0.2s ease-out; flex-wrap:wrap; gap:12px;">
            <div style="font-size:0.92rem; color:#be123c; font-weight:700; display:flex; align-items:center; gap:8px;">
                <i data-lucide="check-square" size="18"></i>
                <span id="bulk-select-count">0</span>개의 자료가 선택되었습니다.
            </div>

            <div style="display:flex; align-items:center; gap:14px; flex-wrap:wrap;">
                <!-- Bulk Reassign Tools -->
                <div style="display:flex; align-items:center; gap:8px; padding:6px 12px; background:rgba(255,255,255,0.6); border:1px solid #bfdbfe; border-radius:8px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
                    <span style="font-size:0.78rem; color:#1e40af; font-weight:700;">작성자 일괄 변경:</span>
                    <select id="bulk-reassign-select" style="font-size:0.8rem; padding:4px 10px; border-radius:6px; border:1px solid #3b82f6; background:white; min-width:140px;">
                        <option value="__teacher__">교사 (미배정)</option>
                        ${students.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                    </select>
                    <button id="teacher-bulk-reassign-btn" class="btn-primary" style="font-size:0.78rem; padding:6px 14px; background:#3b82f6; border-color:#3b82f6; font-weight:700; display:flex; align-items:center; gap:5px;">
                        <i data-lucide="users" size="14"></i> 변경
                    </button>
                </div>

                <div style="width:1px; height:28px; background:#fda4af; opacity:0.5;"></div>

                <button id="teacher-bulk-download-btn" class="btn-primary" style="background:#059669; border-color:#059669; font-size:0.78rem; padding:8px 16px; font-weight:700; display:flex; align-items:center; gap:6px;">
                    <i data-lucide="download" size="15"></i> 선택 다운로드 (ZIP)
                </button>

                <button id="teacher-bulk-delete-btn" class="btn-primary" style="background:#e11d48; border-color:#e11d48; font-size:0.78rem; padding:8px 16px; font-weight:700; display:flex; align-items:center; gap:6px;">
                    <i data-lucide="trash-2" size="15"></i> 선택 삭제
                </button>
            </div>
        </div>

        <!-- Bulk Name Edit Toggle -->
        <div style="display:flex;justify-content:flex-end;margin-bottom:8px;">
            <button id="toggle-bulk-name-edit-btn" class="btn-secondary" style="font-size:0.82rem;padding:7px 16px;display:flex;align-items:center;gap:7px;border-color:#a5b4fc;color:#4338ca;background:#eef2ff;">
                <i data-lucide="pencil-line" size="15"></i> 이름 일괄 편집
            </button>
        </div>

        <!-- Bulk Name Edit Panel -->
        <div id="bulk-name-edit-panel" style="display:none;margin-bottom:20px;border:2px solid #a5b4fc;border-radius:12px;overflow:hidden;">
            <div style="background:#eef2ff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;">
                <div style="font-weight:700;color:#3730a3;font-size:0.95rem;display:flex;align-items:center;gap:8px;">
                    <i data-lucide="pencil-line" size="16"></i> 교사 데이터 이름 일괄 편집
                    <span style="font-size:0.78rem;font-weight:500;color:#6366f1;">(교사가 등록한 자료만 편집 가능)</span>
                </div>
                <div style="display:flex;gap:10px;">
                    <button id="bulk-name-save-btn" class="btn-primary" style="font-size:0.82rem;padding:7px 18px;background:#4f46e5;border-color:#4f46e5;font-weight:700;display:flex;align-items:center;gap:6px;">
                        <i data-lucide="save" size="14"></i> 전체 저장
                    </button>
                    <button id="bulk-name-close-btn" class="btn-secondary" style="font-size:0.82rem;padding:7px 14px;">닫기</button>
                </div>
            </div>
            <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr style="background:#f5f3ff;text-align:left;border-bottom:2px solid #c7d2fe;">
                            <th style="padding:10px 14px;font-size:0.8rem;color:#4338ca;width:40px;">#</th>
                            <th id="bulk-name-sort-th" style="padding:10px 14px;font-size:0.8rem;color:#4338ca;cursor:pointer;user-select:none;white-space:nowrap;">
                                데이터셋 이름 <i data-lucide="chevrons-up-down" size="13" style="vertical-align:middle;opacity:0.6;"></i>
                            </th>
                            <th style="padding:10px 14px;font-size:0.8rem;color:#4338ca;">파일 표시명 (metadata.filename)</th>
                            <th style="padding:10px 14px;font-size:0.8rem;color:#4338ca;width:70px;text-align:center;">상태</th>
                        </tr>
                    </thead>
                    <tbody id="bulk-name-edit-tbody">
                        ${datasets
                            .filter(ds => teacherEmail && (ds.student_id === teacherEmail || ds.metadata?.teacher_email === teacherEmail))
                            .map((ds, idx) => `
                            <tr data-id="${ds.id}" style="border-bottom:1px solid #e0e7ff;">
                                <td style="padding:10px 14px;font-size:0.82rem;color:#94a3b8;">${idx + 1}</td>
                                <td style="padding:8px 14px;">
                                    <input class="bulk-name-input" data-id="${ds.id}" data-field="data_name" data-original="${(ds.data_name || '').replace(/"/g, '&quot;')}"
                                        value="${(ds.data_name || '').replace(/"/g, '&quot;')}"
                                        style="width:100%;padding:7px 10px;border:1px solid #e2e8f0;border-radius:6px;font-size:0.88rem;font-family:inherit;min-width:180px;">
                                </td>
                                <td style="padding:8px 14px;">
                                    <input class="bulk-filename-input" data-id="${ds.id}" data-field="filename" data-original="${((ds.metadata?.filename || ds.metadata?.name || '')).replace(/"/g, '&quot;')}"
                                        value="${((ds.metadata?.filename || ds.metadata?.name || '')).replace(/"/g, '&quot;')}"
                                        placeholder="(파일 표시명 없음)"
                                        style="width:100%;padding:7px 10px;border:1px solid #e2e8f0;border-radius:6px;font-size:0.88rem;font-family:inherit;min-width:180px;color:#475569;">
                                </td>
                                <td style="padding:10px 14px;text-align:center;" class="bulk-row-status-${ds.id}"></td>
                            </tr>`).join('')}
                    </tbody>
                </table>
                ${datasets.filter(ds => teacherEmail && (ds.student_id === teacherEmail || ds.metadata?.teacher_email === teacherEmail)).length === 0
                    ? '<div style="text-align:center;padding:30px;color:#94a3b8;">편집 가능한 교사 등록 데이터셋이 없습니다.</div>' : ''}
            </div>
            <div id="bulk-name-save-result" style="display:none;padding:12px 20px;font-size:0.85rem;font-weight:700;"></div>
        </div>

        <div id="teacher-management-table-wrap">
            <table style="width:100%;border-collapse:collapse;margin-top:4px;">
                <thead>
                    <tr style="text-align:left;border-bottom:2px solid var(--glass-border);background:#f8fafc;">
                        <th style="padding:12px; text-align:center; width:40px;">
                            <input type="checkbox" id="ds-bulk-all-chk" title="전체 선택" style="width:16px;height:16px;cursor:pointer;">
                        </th>
                        <th style="padding:12px;">데이터셋 이름</th>
                        <th style="padding:12px;">작성자</th>
                        <th style="padding:12px;text-align:center;">행 수</th>
                        <th style="padding:12px;text-align:center;background:#fffbeb;">
                            <div style="display:flex;align-items:center;justify-content:center;gap:7px;">
                                <input type="checkbox" id="teacher-test-all-chk" title="전체 체크/해제" style="width:16px;height:16px;cursor:pointer;accent-color:#f59e0b;flex-shrink:0;">
                                교사 테스트 활용
                            </div>
                        </th>
                        <th style="padding:12px;text-align:center;">공유</th>
                        <th style="padding:12px;text-align:center;"></th>
                    </tr>
                </thead>
                <tbody id="management-tbody">
                    ${datasets.map(ds => {
                        const isTeacherOwned = teacherEmail && (
                            ds.student_id === teacherEmail ||
                            ds.metadata?.teacher_email === teacherEmail
                        );
                        const isUnassigned = isTeacherOwned && ds.student_id === teacherEmail;
                        const ownerName = isUnassigned
                            ? '교사'
                            : (ds.students?.name || ds.student_id || '탈퇴한 사용자');
                        const isTeacherChecked = teacherIds.includes(String(ds.id));
                        const meta = ds.metadata || {};
                        const rowCount = meta.row_count;
                        const sizeKb = meta.size_kb || ds.size_kb;
                        const rowStr = rowCount != null ? `${Number(rowCount).toLocaleString()}행` : '-';
                        const sizeStr = sizeKb
                            ? (sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${Number(sizeKb).toLocaleString()} KB`)
                            : '';
                        const ownerCell = isTeacherOwned
                            ? `<span class="reassign-owner-btn"
                                    data-id="${ds.id}"
                                    data-current="${ds.student_id}"
                                    style="cursor:pointer;display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:6px;font-size:0.82rem;font-weight:700;
                                           ${isUnassigned
                                               ? 'color:#4f46e5;background:#eef2ff;border:1px dashed #a5b4fc;'
                                               : 'color:#0369a1;background:#e0f2fe;border:1px dashed #7dd3fc;'}">
                                   ${ownerName}
                                   <i data-lucide="user-round-cog" size="13"></i>
                               </span>`
                            : `<span style="font-size:0.85rem;color:#4b5563;">${ownerName}</span>`;
                        return `
                        <tr class="clickable-row data-row ds-row" 
                            data-id="${ds.id}" 
                            data-student="${ds.student_id}" 
                            data-teacher-owned="${isTeacherOwned}" 
                            data-name="${ds.data_name}"
                            data-created="${ds.created_at}"
                            data-size="${sizeKb}"
                            style="border-bottom:1px solid var(--glass-border);cursor:pointer;${isTeacherOwned ? 'background:#f5f3ff;' : ''}">
                            <td style="padding:12px; text-align:center;" onclick="event.stopPropagation()">
                                <input type="checkbox" class="ds-row-chk" data-id="${ds.id}" style="width:16px;height:16px;cursor:pointer;">
                            </td>
                            <td style="padding:12px;">
                                <div style="display:flex;align-items:center;gap:10px;">
                                    <i data-lucide="${isTeacherOwned ? 'shield-check' : 'file-spreadsheet'}" size="18" style="color:${isTeacherOwned ? '#6366f1' : 'var(--primary)'};"></i>
                                    <strong>${ds.data_name}</strong>
                                </div>
                            </td>
                            <td style="padding:12px;" class="owner-cell" data-id="${ds.id}">${ownerCell}</td>
                            <td style="padding:12px;text-align:center;">
                                <span style="font-size:0.88rem;font-weight:600;color:${rowCount != null ? 'var(--secondary)' : '#94a3b8'};">${rowStr}</span>
                                ${sizeStr ? `<div style="font-size:0.72rem;color:#94a3b8;margin-top:2px;">${sizeStr}</div>` : ''}
                            </td>
                            <td style="padding:12px;text-align:center;background:#fffdf0;">
                                <input type="checkbox" class="teacher-test-toggle" data-id="${ds.id}" ${isTeacherChecked ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer;accent-color:#f59e0b;">
                            </td>
                            <td style="padding:12px;text-align:center;">
                                <label class="switch">
                                    <input type="checkbox" class="teacher-share-toggle" data-id="${ds.id}" ${ds.is_shared ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </td>
                            <td style="padding:12px;text-align:center;">
                                ${isTeacherOwned ? `<button class="teacher-delete-ds-btn btn-secondary" data-id="${ds.id}" style="font-size:0.75rem;padding:4px 10px;color:#dc2626;border-color:#fecaca;background:#fef2f2;" title="삭제"><i data-lucide="trash-2" size="13" style="vertical-align:middle;"></i></button>` : ''}
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
            <div id="no-filtered-data" style="display:none; text-align:center; padding:50px; color:#94a3b8;">
                <i data-lucide="search-x" size="48" style="margin-bottom:15px; opacity:0.5;"></i>
                <p>조건에 맞는 데이터셋이 없습니다.</p>
            </div>
        </div>
    `;

    // Filter Logic
    const filterChecks = container.querySelectorAll('.student-filter-chk');
    const dataRows = container.querySelectorAll('.data-row');
    const noDataMsg = container.querySelector('#no-filtered-data');

    const updateFilter = () => {
        const selectedIds = Array.from(filterChecks)
            .filter(chk => chk.checked)
            .map(chk => chk.value);

        const showTeacher = selectedIds.includes('__teacher__');

        // Teacher test only filter
        const teacherTestOnlyChk = container.querySelector('#filter-teacher-test-only-chk');
        const showTeacherTestOnly = teacherTestOnlyChk?.checked || false;

        // Keywords search
        const searchInput = container.querySelector('#dataset-search-input');
        const searchLogic = container.querySelector('input[name="search-logic"]:checked')?.value || 'and';
        const keywords = (searchInput?.value || '').trim().toLowerCase().split(/\s+/).filter(Boolean);

        // Update Search Logic Labels styling
        container.querySelectorAll('.search-logic-label').forEach(label => {
            const radio = label.querySelector('input');
            if (radio.checked) {
                label.style.background = 'white';
                label.style.color = 'var(--primary)';
                label.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
            } else {
                label.style.background = 'transparent';
                label.style.color = '#64748b';
                label.style.boxShadow = 'none';
            }
        });

        filterChecks.forEach(chk => {
            const label = chk.closest('.student-filter-label');
            const isTeacherFilter = chk.value === '__teacher__';
            if (chk.checked) {
                label.style.background = isTeacherFilter ? '#eef2ff' : 'var(--primary-glow)';
                label.style.borderColor = isTeacherFilter ? '#4f46e5' : 'var(--primary)';
                label.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                label.style.opacity = '1';
            } else {
                label.style.background = '#f8fafc';
                label.style.borderColor = '#e2e8f0';
                label.style.boxShadow = 'none';
                label.style.opacity = '0.4';
            }
        });

        let visibleCount = 0;
        dataRows.forEach(row => {
            const studentId = row.dataset.student;
            const dsId = row.dataset.id;
            const ds = datasets.find(d => String(d.id) === dsId);
            const isTeacherRow = teacherEmail && (
                studentId === teacherEmail ||
                ds?.metadata?.teacher_email === teacherEmail
            );

            let shouldShow = false;
            if (isTeacherRow) {
                if (showTeacher) shouldShow = true;
            } else if (selectedIds.includes(studentId)) {
                shouldShow = true;
            }

            // Teacher Test Only filter
            if (shouldShow && showTeacherTestOnly) {
                const isChecked = teacherIds.includes(String(dsId));
                if (!isChecked) shouldShow = false;
            }

            // Keyword filtering
            if (shouldShow && keywords.length > 0) {
                const dataName = (ds?.data_name || "").toLowerCase();
                if (searchLogic === 'or') {
                    shouldShow = keywords.some(k => dataName.includes(k));
                } else {
                    shouldShow = keywords.every(k => dataName.includes(k));
                }
            }

            if (shouldShow) {
                row.style.display = 'table-row';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });

        noDataMsg.style.display = visibleCount === 0 ? 'block' : 'none';
        const table = container.querySelector('table');
        if (table) table.style.display = visibleCount === 0 ? 'none' : 'table';
    };

    const syncBulkUI = () => {
        if (!bulkBar) return;
        const checked = Array.from(dsRowChks).filter(c => c.checked && c.closest('tr').style.display !== 'none');
        if (checked.length > 0) {
            bulkBar.style.display = 'flex';
            bulkCount.innerText = checked.length;
        } else {
            bulkBar.style.display = 'none';
        }

        const visibleRows = Array.from(dsRowChks).filter(c => c.closest('tr').style.display !== 'none');
        if (visibleRows.length > 0) {
            dsBulkAllChk.checked = visibleRows.every(c => c.checked);
            dsBulkAllChk.indeterminate = !dsBulkAllChk.checked && visibleRows.some(c => c.checked);
        } else {
            dsBulkAllChk.checked = false;
            dsBulkAllChk.indeterminate = false;
        }
    };

    filterChecks.forEach(chk => chk.addEventListener('change', () => { updateFilter(); syncBulkUI(); syncAllChkDeferred(); }));

    const teacherTestOnlyFilter = container.querySelector('#filter-teacher-test-only-chk');
    if (teacherTestOnlyFilter) {
        teacherTestOnlyFilter.onchange = () => {
            updateFilter();
            syncBulkUI();
            syncAllChkDeferred();
        };
    }

    const filterAllBtn = container.querySelector('#filter-all-btn');
    if (filterAllBtn) filterAllBtn.onclick = () => { filterChecks.forEach(chk => chk.checked = true); updateFilter(); syncBulkUI(); syncAllChkDeferred(); };

    const filterNoneBtn = container.querySelector('#filter-none-btn');
    if (filterNoneBtn) filterNoneBtn.onclick = () => { filterChecks.forEach(chk => chk.checked = false); updateFilter(); syncBulkUI(); syncAllChkDeferred(); };

    // Keyword Search Listeners
    const searchInput = container.querySelector('#dataset-search-input');
    if (searchInput) {
        searchInput.oninput = () => { updateFilter(); syncBulkUI(); syncAllChkDeferred(); };
        searchInput.onfocus = () => { searchInput.style.borderColor = 'var(--primary)'; };
        searchInput.onblur = () => { searchInput.style.borderColor = '#e2e8f0'; };
    }
    container.querySelectorAll('input[name="search-logic"]').forEach(radio => {
        radio.onchange = () => { updateFilter(); syncBulkUI(); syncAllChkDeferred(); };
    });

    let syncAllChkDeferred = () => {};

    updateFilter();

    container.querySelectorAll('.teacher-share-toggle').forEach(chk => {
        chk.onchange = () => onToggleShare(chk.dataset.id, chk.checked);
    });
    const teacherTestToggles = container.querySelectorAll('.teacher-test-toggle');
    const allChk = container.querySelector('#teacher-test-all-chk');

    const syncAllChk = () => {
        if (!allChk) return;
        const visible = Array.from(teacherTestToggles).filter(c => c.closest('tr')?.style.display !== 'none');
        const checkedCount = visible.filter(c => c.checked).length;
        allChk.checked = visible.length > 0 && checkedCount === visible.length;
        allChk.indeterminate = checkedCount > 0 && checkedCount < visible.length;
    };
    syncAllChkDeferred = syncAllChk;

    teacherTestToggles.forEach(chk => {
        chk.onchange = async () => {
            chk.disabled = true;
            const { setTeacherResearchId } = await import('./auth.js');
            await setTeacherResearchId(chk.dataset.id, chk.checked);
            chk.disabled = false;
            syncAllChk();
        };
    });

    if (allChk) {
        allChk.onchange = async () => {
            const shouldCheck = allChk.checked;
            const visible = Array.from(teacherTestToggles).filter(c => c.closest('tr')?.style.display !== 'none');
            const toChange = visible.filter(c => c.checked !== shouldCheck);
            if (toChange.length === 0) return;

            allChk.disabled = true;
            toChange.forEach(c => { c.disabled = true; });

            const { setTeacherResearchIdBulk } = await import('./auth.js');
            await setTeacherResearchIdBulk(toChange.map(c => c.dataset.id), shouldCheck);

            toChange.forEach(c => { c.checked = shouldCheck; c.disabled = false; });
            allChk.disabled = false;
            syncAllChk();
        };
        syncAllChk();
    }

    // Delete teacher-owned datasets
    container.querySelectorAll('.teacher-delete-ds-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            if (!confirm('교사가 등록한 이 데이터셋을 삭제하시겠습니까?')) return;
            btn.disabled = true;
            const { deleteTeacherDataset } = await import('./auth.js');
            const { error } = await deleteTeacherDataset(btn.dataset.id);
            if (error) { alert('삭제 실패: ' + error.message); btn.disabled = false; }
            else if (onTeacherUploadSuccess) onTeacherUploadSuccess();
        };
    });

    // Reassign teacher dataset to a student (or back to teacher)
    container.querySelectorAll('.reassign-owner-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const dsId = btn.dataset.id;
            const currentStudentId = btn.dataset.current;
            const cell = container.querySelector(`.owner-cell[data-id="${dsId}"]`);
            if (!cell) return;

            cell.innerHTML = `
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                    <select id="reassign-select-${dsId}" style="font-size:0.8rem;padding:5px 8px;border-radius:6px;border:1px solid #a5b4fc;max-width:160px;">
                        <option value="__teacher__">교사 (미배정)</option>
                        ${students.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                    </select>
                    <button class="reassign-confirm-btn btn-primary" data-id="${dsId}" style="font-size:0.75rem;padding:4px 10px;background:#4f46e5;border-color:#4f46e5;">확인</button>
                    <button class="reassign-cancel-btn btn-secondary" data-id="${dsId}" style="font-size:0.75rem;padding:4px 10px;">취소</button>
                </div>`;

            const select = cell.querySelector(`#reassign-select-${dsId}`);
            if (select) {
                if (currentStudentId === teacherEmail || !currentStudentId) select.value = '__teacher__';
                else select.value = currentStudentId;
            }

            cell.querySelector('.reassign-confirm-btn').onclick = async (e2) => {
                e2.stopPropagation();
                const newStudentId = select.value === '__teacher__' ? teacherEmail : select.value;
                const { reassignDatasetToStudent } = await import('./auth.js');
                const { error } = await reassignDatasetToStudent(dsId, newStudentId, teacherEmail);
                if (error) { alert('변경 실패: ' + error.message); return; }
                if (onTeacherUploadSuccess) onTeacherUploadSuccess();
            };

            cell.querySelector('.reassign-cancel-btn').onclick = (e2) => {
                e2.stopPropagation();
                if (onTeacherUploadSuccess) onTeacherUploadSuccess();
            };
        };
    });

    // Sorting Logic
    const sortSelect = container.querySelector('#teacher-ds-sort-select');
    if (sortSelect) {
        sortSelect.onchange = () => {
            const mode = sortSelect.value;
            const tbody = container.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('.ds-row'));
            
            rows.sort((a, b) => {
                if (mode === 'time-desc') return new Date(b.dataset.created) - new Date(a.dataset.created);
                if (mode === 'time-asc') return new Date(a.dataset.created) - new Date(b.dataset.created);
                if (mode === 'name-asc') return a.dataset.name.localeCompare(b.dataset.name, 'ko');
                if (mode === 'name-desc') return b.dataset.name.localeCompare(a.dataset.name, 'ko');
                if (mode === 'size-desc') return parseFloat(b.dataset.size) - parseFloat(a.dataset.size);
                return 0;
            });
            
            // Re-append to DOM (maintains event listeners)
            rows.forEach(row => tbody.appendChild(row));
        };
    }

    // Bulk Delete Logic
    const dsBulkAllChk = container.querySelector('#ds-bulk-all-chk');
    const dsRowChks = container.querySelectorAll('.ds-row-chk');
    const bulkBar = container.querySelector('#teacher-bulk-action-bar');
    const bulkCount = container.querySelector('#bulk-select-count');
    const bulkDelBtn = container.querySelector('#teacher-bulk-delete-btn');

    if (dsBulkAllChk) {
        dsBulkAllChk.onchange = () => {
            const isChecked = dsBulkAllChk.checked;
            dsRowChks.forEach(chk => {
                if (chk.closest('tr').style.display !== 'none') {
                    chk.checked = isChecked;
                }
            });
            syncBulkUI();
        };
    }

    dsRowChks.forEach(chk => {
        chk.onchange = (e) => {
            e.stopPropagation();
            syncBulkUI();
        };
    });

    if (bulkDelBtn) {
        bulkDelBtn.onclick = async () => {
            const checkedIds = Array.from(dsRowChks)
                .filter(chk => chk.checked && chk.closest('tr').style.display !== 'none')
                .map(chk => chk.dataset.id);

            if (checkedIds.length === 0) return;
            if (!confirm(`선택한 ${checkedIds.length}개의 데이터셋을 모두 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;

            bulkDelBtn.disabled = true;
            bulkDelBtn.innerHTML = `<i data-lucide="loader-2" class="spin" size="15"></i> 삭제 중...`;
            if (window.lucide) lucide.createIcons();

            const { deleteTeacherDataset } = await import('./auth.js');
            let successCount = 0;
            let failCount = 0;

            for (const id of checkedIds) {
                const { error } = await deleteTeacherDataset(id);
                if (error) failCount++;
                else successCount++;
            }

            if (failCount > 0) alert(`${successCount}개 삭제 성공, ${failCount}개 실패`);

            if (onTeacherUploadSuccess) onTeacherUploadSuccess();
        };
    }

    // Bulk Reassign Logic
    const bulkReassignBtn = container.querySelector('#teacher-bulk-reassign-btn');
    const bulkReassignSelect = container.querySelector('#bulk-reassign-select');

    if (bulkReassignBtn && bulkReassignSelect) {
        bulkReassignBtn.onclick = async () => {
            const checkedIds = Array.from(dsRowChks)
                .filter(chk => chk.checked && chk.closest('tr').style.display !== 'none')
                .map(chk => chk.dataset.id);

            if (checkedIds.length === 0) return;

            const selectedVal = bulkReassignSelect.value;
            const newStudentId = selectedVal === '__teacher__' ? teacherEmail : selectedVal;
            const targetName = selectedVal === '__teacher__' ? '교사 (미배정)' : (students.find(s => s.id === selectedVal)?.name || selectedVal);

            if (!confirm(`선택한 ${checkedIds.length}개의 자료를 '${targetName}' 학생에게 일괄 배정하시겠습니까?`)) return;

            bulkReassignBtn.disabled = true;
            bulkReassignBtn.innerHTML = `<i data-lucide="loader-2" class="spin" size="14"></i> 변경 중...`;
            if (window.lucide) lucide.createIcons();

            const { reassignDatasetToStudent } = await import('./auth.js');
            for (const id of checkedIds) {
                await reassignDatasetToStudent(id, newStudentId, teacherEmail);
            }

            if (onTeacherUploadSuccess) onTeacherUploadSuccess();
        };
    }

    // Bulk Download Logic
    const bulkDownloadBtn = container.querySelector('#teacher-bulk-download-btn');
    if (bulkDownloadBtn) {
        bulkDownloadBtn.onclick = async () => {
            const checkedIds = Array.from(dsRowChks)
                .filter(chk => chk.checked && chk.closest('tr').style.display !== 'none')
                .map(chk => chk.dataset.id);

            if (checkedIds.length === 0) {
                alert('다운로드할 데이터셋을 선택해주세요.');
                return;
            }

            bulkDownloadBtn.disabled = true;
            const originalHTML = bulkDownloadBtn.innerHTML;
            bulkDownloadBtn.innerHTML = `<i data-lucide="loader-2" class="spin" size="15"></i> 준비 중...`;
            if (window.lucide) lucide.createIcons();

            try {
                const zip = new JSZip();
                const { fetchDatasetContentBulk } = await import('./auth.js');
                
                // Fetch full data for each checked ID
                const datasetsToDownload = await fetchDatasetContentBulk(checkedIds);

                if (!datasetsToDownload || datasetsToDownload.length === 0) {
                    throw new Error('선택한 데이터셋 정보를 불러올 수 없습니다.');
                }

                for (let i = 0; i < datasetsToDownload.length; i++) {
                    const ds = datasetsToDownload[i];
                    bulkDownloadBtn.innerHTML = `<i data-lucide="loader-2" class="spin" size="15"></i> 다운로드 중 (${i + 1}/${datasetsToDownload.length})`;
                    if (window.lucide) lucide.createIcons();

                    let finalUrl = ds.file_url;
                    if (finalUrl && !finalUrl.startsWith('http')) {
                        const { data } = supabaseClient.storage.from('datasets').getPublicUrl(ds.file_url);
                        finalUrl = data.publicUrl;
                    }

                    const response = await fetch(finalUrl);
                    if (!response.ok) throw new Error(`${ds.data_name} 파일을 가져올 수 없습니다.`);
                    const blob = await response.blob();
                    
                    let fileName = ds.data_name || `dataset_${ds.id}`;
                    fileName = fileName.replace(/[\\/:*?"<>|]/g, '_');
                    
                    const ext = ds.file_url.split('.').pop() || 'csv';
                    let finalFileName = `${fileName}.${ext}`;
                    
                    // 중복 파일명 처리 (동일한 이름의 데이터셋이 있을 경우)
                    let counter = 1;
                    while (zip.file(finalFileName)) {
                        finalFileName = `${fileName}_(${counter}).${ext}`;
                        counter++;
                    }
                    
                    zip.file(finalFileName, blob);
                }

                bulkDownloadBtn.innerHTML = `<i data-lucide="loader-2" class="spin" size="15"></i> 압축 생성 중...`;
                if (window.lucide) lucide.createIcons();

                const content = await zip.generateAsync({ type: "blob" });
                const url = window.URL.createObjectURL(content);
                const a = document.createElement('a');
                const dateStr = new Date().toISOString().slice(0, 10);
                
                a.href = url;
                a.download = `PublicDataResearch_Export_${dateStr}.zip`;
                document.body.appendChild(a);
                a.click();
                
                // Cleanup
                setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                    a.remove();
                }, 100);

            } catch (err) {
                console.error(err);
                alert('일괄 다운로드 중 오류가 발생했습니다: ' + err.message);
            } finally {
                bulkDownloadBtn.disabled = false;
                bulkDownloadBtn.innerHTML = originalHTML;
                if (window.lucide) lucide.createIcons();
            }
        };
    }

    // Bulk Name Edit Panel logic
    const toggleBulkNameEditBtn = container.querySelector('#toggle-bulk-name-edit-btn');
    const bulkNameEditPanel = container.querySelector('#bulk-name-edit-panel');
    const bulkNameSaveBtn = container.querySelector('#bulk-name-save-btn');
    const bulkNameCloseBtn = container.querySelector('#bulk-name-close-btn');

    if (toggleBulkNameEditBtn && bulkNameEditPanel) {
        toggleBulkNameEditBtn.onclick = () => {
            const isOpen = bulkNameEditPanel.style.display !== 'none';
            bulkNameEditPanel.style.display = isOpen ? 'none' : 'block';
            toggleBulkNameEditBtn.innerHTML = isOpen
                ? '<i data-lucide="pencil-line" size="15"></i> 이름 일괄 편집'
                : '<i data-lucide="x" size="15"></i> 편집 패널 닫기';
            toggleBulkNameEditBtn.style.background = isOpen ? '#eef2ff' : '#f1f5f9';
            if (window.lucide) lucide.createIcons();
        };
    }

    if (bulkNameCloseBtn) {
        bulkNameCloseBtn.onclick = () => {
            if (bulkNameEditPanel) bulkNameEditPanel.style.display = 'none';
            if (toggleBulkNameEditBtn) {
                toggleBulkNameEditBtn.innerHTML = '<i data-lucide="pencil-line" size="15"></i> 이름 일괄 편집';
                toggleBulkNameEditBtn.style.background = '#eef2ff';
                if (window.lucide) lucide.createIcons();
            }
        };
    }

    if (bulkNameSaveBtn) {
        bulkNameSaveBtn.onclick = async () => {
            const { updateDatasetDetails } = await import('./auth.js');

            const nameInputs = container.querySelectorAll('.bulk-name-input');
            const fileInputs = container.querySelectorAll('.bulk-filename-input');

            // Collect changed rows: group by id
            const changes = {};
            nameInputs.forEach(inp => {
                const id = inp.dataset.id;
                const newVal = inp.value.trim();
                if (newVal && newVal !== inp.dataset.original) {
                    if (!changes[id]) changes[id] = { id };
                    changes[id].data_name = newVal;
                }
            });
            fileInputs.forEach(inp => {
                const id = inp.dataset.id;
                const newVal = inp.value.trim();
                if (newVal !== inp.dataset.original) {
                    if (!changes[id]) changes[id] = { id };
                    changes[id].filename = newVal;
                }
            });

            const toSave = Object.values(changes);
            if (toSave.length === 0) {
                const resultEl = container.querySelector('#bulk-name-save-result');
                if (resultEl) {
                    resultEl.style.display = 'block';
                    resultEl.style.background = '#fef9c3';
                    resultEl.style.color = '#92400e';
                    resultEl.innerText = '변경된 내용이 없습니다.';
                    setTimeout(() => { resultEl.style.display = 'none'; }, 2500);
                }
                return;
            }

            bulkNameSaveBtn.disabled = true;
            bulkNameSaveBtn.innerHTML = '<i class="spinner-sm"></i> 저장 중...';

            let successCount = 0;
            let failCount = 0;

            for (const change of toSave) {
                const statusCell = container.querySelector(`.bulk-row-status-${change.id}`);
                try {
                    const updates = {};
                    if (change.data_name) updates.data_name = change.data_name;
                    if ('filename' in change) {
                        const ds = datasets.find(d => String(d.id) === change.id);
                        updates.metadata = { ...(ds?.metadata || {}), filename: change.filename };
                    }
                    const { error } = await updateDatasetDetails(change.id, updates);
                    if (error) throw error;

                    // Update original values so re-saves don't flag them again
                    const nInp = container.querySelector(`.bulk-name-input[data-id="${change.id}"]`);
                    const fInp = container.querySelector(`.bulk-filename-input[data-id="${change.id}"]`);
                    if (nInp && change.data_name) nInp.dataset.original = change.data_name;
                    if (fInp && 'filename' in change) fInp.dataset.original = change.filename;

                    if (statusCell) statusCell.innerHTML = '<i data-lucide="check-circle" size="16" style="color:#16a34a;"></i>';
                    successCount++;
                } catch (err) {
                    if (statusCell) statusCell.innerHTML = '<i data-lucide="x-circle" size="16" style="color:#dc2626;" title="' + err.message + '"></i>';
                    failCount++;
                }
            }

            if (window.lucide) lucide.createIcons();

            const resultEl = container.querySelector('#bulk-name-save-result');
            if (resultEl) {
                resultEl.style.display = 'block';
                if (failCount === 0) {
                    resultEl.style.background = '#dcfce7';
                    resultEl.style.color = '#166534';
                    resultEl.innerText = `✅ ${successCount}건 저장 완료!`;
                } else {
                    resultEl.style.background = '#fee2e2';
                    resultEl.style.color = '#991b1b';
                    resultEl.innerText = `⚠️ ${successCount}건 저장, ${failCount}건 실패`;
                }
                setTimeout(() => { resultEl.style.display = 'none'; }, 3500);
            }

            bulkNameSaveBtn.disabled = false;
            bulkNameSaveBtn.innerHTML = '<i data-lucide="save" size="14"></i> 전체 저장';
            if (window.lucide) lucide.createIcons();

            // Refresh the main table labels without full reload
            if (successCount > 0 && onTeacherUploadSuccess) onTeacherUploadSuccess();
        };
    }

    // Row click → modal
    container.querySelectorAll('.clickable-row').forEach(row => {
        row.onclick = (e) => {
            if (e.target.closest('input') || e.target.closest('.switch') ||
                e.target.closest('button') || e.target.closest('.reassign-owner-btn') ||
                e.target.closest('.owner-cell') || e.target.tagName === 'TD' && e.target.cellIndex === 0) return;
            const dsId = row.dataset.id;
            const ds = datasets.find(d => String(d.id) === String(dsId));
            if (ds) openDatasetModal(ds, true, onTeacherUploadSuccess);
        };
    });

    // Bulk edit panel: sort by name header click
    const bulkNameSortTh = container.querySelector('#bulk-name-sort-th');
    const bulkNameTbody = container.querySelector('#bulk-name-edit-tbody');
    if (bulkNameSortTh && bulkNameTbody) {
        let sortAsc = true;
        bulkNameSortTh.onclick = () => {
            const rows = Array.from(bulkNameTbody.querySelectorAll('tr'));
            rows.sort((a, b) => {
                const aVal = a.querySelector('.bulk-name-input')?.value || '';
                const bVal = b.querySelector('.bulk-name-input')?.value || '';
                return sortAsc
                    ? aVal.localeCompare(bVal, 'ko')
                    : bVal.localeCompare(aVal, 'ko');
            });
            rows.forEach((row, i) => {
                const numCell = row.querySelector('td:first-child');
                if (numCell) numCell.textContent = i + 1;
                bulkNameTbody.appendChild(row);
            });
            sortAsc = !sortAsc;
            const icon = bulkNameSortTh.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', sortAsc ? 'chevrons-up-down' : 'chevron-down');
                if (!sortAsc) icon.style.transform = 'scaleY(-1)';
                else icon.style.transform = '';
                if (window.lucide) lucide.createIcons();
            }
        };
    }

    // Highlight changed rows in the bulk edit panel
    container.querySelectorAll('.bulk-name-input, .bulk-filename-input').forEach(inp => {
        inp.addEventListener('input', () => {
            const changed = inp.value.trim() !== inp.dataset.original;
            inp.style.borderColor = changed ? '#6366f1' : '#e2e8f0';
            inp.style.background = changed ? '#f5f3ff' : '';
        });
    });

    if (teacherEmail) setupTeacherUploadPanel(container, teacherEmail, onTeacherUploadSuccess);
    if (window.lucide) lucide.createIcons();
}

export function renderDatasetsList(datasets, containerId, onDelete, onToggleShare, onEditName) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!datasets || datasets.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #64748b;">수집된 데이터셋이 없습니다.</div>';
        return;
    }

    container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
                <tr style="text-align: left; border-bottom: 2px solid var(--glass-border);">
                    <th style="padding: 12px; font-size: 0.85rem;">데이터셋 이름</th>
                    <th style="padding: 12px; font-size: 0.85rem; text-align: center;">행 수</th>
                    <th style="padding: 12px; font-size: 0.85rem; text-align: center;">공유</th>
                    <th style="padding: 12px; font-size: 0.85rem; text-align: right;">관리</th>
                </tr>
            </thead>
            <tbody id="datasets-table-body">
                ${datasets.map(ds => {
                    const meta = ds.metadata || {};
                    const rowCount = meta.row_count;
                    const sizeKb = meta.size_kb || ds.size_kb;
                    const rowStr = rowCount != null ? `${Number(rowCount).toLocaleString()}행` : '-';
                    const sizeStr = sizeKb ? (sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB (${Number(sizeKb).toLocaleString()} KB)` : `${Number(sizeKb).toLocaleString()} KB`) : '';
                    return `
                    <tr class="managed-row" data-id="${ds.id}" style="border-bottom: 1px solid var(--glass-border); cursor: pointer;">
                        <td style="padding: 12px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <i data-lucide="file-spreadsheet" size="18" style="color: var(--primary);"></i>
                                <div>
                                    <strong>${ds.data_name}</strong>
                                    ${sizeStr ? `<div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">${sizeStr}</div>` : ''}
                                </div>
                                <button class="managed-edit-name-btn" data-id="${ds.id}" title="이름 수정" style="background: none; border: none; cursor: pointer; color: #64748b; padding: 4px; display: flex; align-items: center;">
                                    <i data-lucide="pencil" size="14"></i>
                                </button>
                            </div>
                        </td>
                        <td style="padding: 12px; text-align: center; font-size: 0.9rem; font-weight: 600; color: ${rowCount != null ? 'var(--primary)' : '#94a3b8'};">${rowStr}</td>
                        <td style="padding: 12px; text-align: center;">
                            <label class="switch">
                                <input type="checkbox" class="managed-share-toggle" data-id="${ds.id}" ${ds.is_shared ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                        </td>
                        <td style="padding: 12px; text-align: right;">
                            <button class="btn-secondary managed-delete-ds-btn" data-id="${ds.id}" style="font-size: 0.75rem; padding: 5px 10px; color: var(--accent);">삭제</button>
                        </td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    lucide.createIcons();

    container.querySelectorAll('.managed-row').forEach(row => {
        row.addEventListener('click', (e) => {
            if (e.target.closest('button') || e.target.closest('.switch') || e.target.closest('input[type="checkbox"]')) return;
            const ds = datasets.find(d => String(d.id) === row.dataset.id);
            if (ds) openDatasetModal(ds, false);
        });
    });

    container.querySelectorAll('.managed-delete-ds-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            onDelete(btn.dataset.id);
        };
    });

    container.querySelectorAll('.managed-share-toggle').forEach(chk => {
        chk.onchange = () => onToggleShare(chk.dataset.id, chk.checked);
    });

    container.querySelectorAll('.managed-edit-name-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const ds = datasets.find(d => String(d.id) === id);
            onEditName(id, ds?.data_name || '');
        };
    });
}

async function setupTeacherEditInModal(modal, dataset, onUpdate) {
    const { updateDatasetDetails } = await import('./auth.js');

    const btnEditName = modal.querySelector('#btn-edit-data-name');
    const displayResName = modal.querySelector('#modal-display-name');
    const wrapperEditName = modal.querySelector('#edit-data-name-wrapper');
    const inputEditName = modal.querySelector('#input-edit-data-name');
    const btnSaveName = modal.querySelector('#btn-save-data-name');
    const btnCancelName = modal.querySelector('#btn-cancel-data-name');

    if (btnEditName) {
        btnEditName.onclick = () => {
            btnEditName.style.display = 'none';
            displayResName.style.display = 'none';
            wrapperEditName.style.display = 'flex';
        };
    }
    if (btnCancelName) {
        btnCancelName.onclick = () => {
            btnEditName.style.display = 'inline-flex';
            displayResName.style.display = 'inline';
            wrapperEditName.style.display = 'none';
            inputEditName.value = dataset.data_name;
        };
    }
    if (btnSaveName) {
        btnSaveName.onclick = async () => {
            const newName = inputEditName.value.trim();
            if (!newName) { alert('이름을 입력해주세요.'); return; }
            btnSaveName.disabled = true;
            const { error } = await updateDatasetDetails(dataset.id, { data_name: newName });
            if (error) { alert('수정 중 오류 발생: ' + error.message); }
            else {
                dataset.data_name = newName;
                displayResName.innerText = newName;
                btnCancelName.click();
                if (onUpdate) onUpdate();
            }
            btnSaveName.disabled = false;
        };
    }

    const btnEditFile = modal.querySelector('#btn-edit-filename');
    const displayResFile = modal.querySelector('#modal-display-filename');
    const wrapperEditFile = modal.querySelector('#edit-filename-wrapper');
    const inputEditFile = modal.querySelector('#input-edit-filename');
    const btnSaveFile = modal.querySelector('#btn-save-filename');
    const btnCancelFile = modal.querySelector('#btn-cancel-filename');

    if (btnEditFile) {
        btnEditFile.onclick = () => {
            btnEditFile.style.display = 'none';
            displayResFile.style.display = 'none';
            wrapperEditFile.style.display = 'flex';
        };
    }
    if (btnCancelFile) {
        btnCancelFile.onclick = () => {
            btnEditFile.style.display = 'inline-flex';
            displayResFile.style.display = 'inline';
            wrapperEditFile.style.display = 'none';
            inputEditFile.value = (dataset.metadata?.filename || dataset.metadata?.name || '-');
        };
    }
    if (btnSaveFile) {
        btnSaveFile.onclick = async () => {
            const newFile = inputEditFile.value.trim();
            if (!newFile) { alert('파일명을 입력해주세요.'); return; }
            btnSaveFile.disabled = true;

            const newMeta = { ...(dataset.metadata || {}), filename: newFile };
            const { error } = await updateDatasetDetails(dataset.id, { metadata: newMeta });

            if (error) { alert('수정 중 오류 발생: ' + error.message); }
            else {
                dataset.metadata = newMeta;
                displayResFile.innerText = newFile;
                btnCancelFile.click();
                if (onUpdate) onUpdate();
            }
            btnSaveFile.disabled = false;
        };
    }

    if (window.lucide) window.lucide.createIcons();
}

export async function openDatasetModal(dataset, isTeacher = false, onUpdate = null) {
    const modal = document.getElementById('dataset-modal');
    if (!modal) return;

    const nameEl = document.getElementById('modal-data-name');
    const bodyInner = document.getElementById('modal-body-inner');
    const closeBtn = document.getElementById('close-modal');

    if (nameEl) nameEl.innerText = dataset.data_name;

    const rawMeta = dataset.metadata || {};
    const getVal = (path, obj = rawMeta) => {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    const metaPairs = [
        [
            { label: '제공 기관', value: getVal('creator.name') || getVal('provider') || '-' },
            { label: '분류 체계', value: getVal('additionalType') || '-' }
        ],
        [
            { label: '관리부서', value: getVal('creator.contactPoint.contactType') || '-' },
            { label: '문의처', value: getVal('creator.contactPoint.telephone') || '-' }
        ],
        [
            { label: '업데이트 주기', value: getVal('datasetTimeInterval') || getVal('cycle') || '-' },
            { label: '보유근거', value: getVal('source') || '-' }
        ],
        [
            { label: '등록일', value: getVal('dateCreated') || '-' },
            { label: '수정일', value: getVal('dateModified') || '-' }
        ]
    ];

    const desc = getVal('description');
    const keywords = getVal('keywords');
    const formatRaw = getVal('encodingFormat');
    let format = '-';
    if (formatRaw) {
        format = formatRaw;
    } else if (dataset.data_name && dataset.data_name.includes('.')) {
        const ext = dataset.data_name.split('.').pop().toUpperCase();
        if (ext.length <= 5) format = ext;
    }
    if (format === '-' && dataset.file_url) {
        if (dataset.file_url.toLowerCase().endsWith('.csv')) format = 'CSV';
        else if (dataset.file_url.toLowerCase().endsWith('.xlsx')) format = 'XLSX';
    }
    const sizeVal = dataset.size_kb !== null && dataset.size_kb !== undefined ? Number(dataset.size_kb) : null;
    let size = '-';
    if (sizeVal !== null) {
        if (sizeVal === 0) size = '0 KB';
        else if (sizeVal >= 1024) size = `${(sizeVal / 1024).toFixed(1)} MB (${sizeVal.toLocaleString()} KB)`;
        else size = `${sizeVal.toLocaleString()} KB`;
    }

    const originalFilename = rawMeta.filename || rawMeta.name || dataset.data_name;

    if (bodyInner) {
        bodyInner.innerHTML = `
            <table class="portal-meta-table">
                <tbody>
                    <tr>
                        <th class="portal-label">데이터셋 제목</th>
                        <td class="portal-value" colspan="3">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <span id="modal-display-name" style="font-weight: 800; color: var(--primary); font-size: 1.1rem;">${dataset.data_name}</span>
                                ${isTeacher ? `<button id="btn-edit-data-name" class="btn-secondary" style="padding:4px 8px; font-size:0.7rem;"><i data-lucide="edit-3" size="14"></i> 수정</button>` : ''}
                                <div id="edit-data-name-wrapper" style="display:none; flex:1; align-items:center; gap:8px;">
                                    <input type="text" id="input-edit-data-name" value="${dataset.data_name}" style="flex:1; padding:6px; font-size:0.9rem;">
                                    <button id="btn-save-data-name" class="btn-primary" style="padding:6px 12px; font-size:0.8rem;">저장</button>
                                    <button id="btn-cancel-data-name" class="btn-secondary" style="padding:6px 12px; font-size:0.8rem;">취소</button>
                                </div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th class="portal-label">첨부파일명</th>
                        <td class="portal-value" colspan="3">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <span id="modal-display-filename">${originalFilename}</span>
                                ${isTeacher ? `<button id="btn-edit-filename" class="btn-secondary" style="padding:4px 8px; font-size:0.7rem;"><i data-lucide="edit-3" size="14"></i> 수정</button>` : ''}
                                <div id="edit-filename-wrapper" style="display:none; flex:1; align-items:center; gap:8px;">
                                    <input type="text" id="input-edit-filename" value="${originalFilename}" style="flex:1; padding:6px; font-size:0.9rem;">
                                    <button id="btn-save-filename" class="btn-primary" style="padding:6px 12px; font-size:0.8rem;">저장</button>
                                    <button id="btn-cancel-filename" class="btn-secondary" style="padding:6px 12px; font-size:0.8rem;">취소</button>
                                </div>
                            </div>
                        </td>
                    </tr>
                    ${metaPairs.map(pair => `
                        <tr>
                            <th class="portal-label">${pair[0].label}</th>
                            <td class="portal-value">${pair[0].value}</td>
                            <th class="portal-label">${pair[1].label}</th>
                            <td class="portal-value">${pair[1].value}</td>
                        </tr>
                    `).join('')}
                    <tr>
                        <th class="portal-label">확장자</th>
                        <td class="portal-value">${format}</td>
                        <th class="portal-label">파일 크기</th>
                        <td class="portal-value">${size}</td>
                    </tr>
                    <tr>
                        <th class="portal-label">데이터 설명</th>
                        <td class="portal-value portal-value-full" colspan="3">
                            ${desc || '설명이 표시되지 않았습니다.'}
                        </td>
                    </tr>
                    ${keywords ? `
                    <tr>
                        <th class="portal-label">키워드</th>
                        <td class="portal-value" colspan="3">
                            <div class="portal-keywords-wrapper">
                                ${(typeof keywords === 'string' ? keywords.split(',') : keywords).map(kw =>
                                    `<span class="badge-portal"># ${kw.trim()}</span>`
                                ).join('')}
                            </div>
                        </td>
                    </tr>
                    ` : ''}
                    <tr>
                        <th class="portal-label">원본 출처</th>
                        <td class="portal-value" colspan="3">
                            ${(() => {
                                const url = getVal('url');
                                const sourceLinks = rawMeta.source_links || [];
                                if (url && url !== '#') {
                                    return `<a href="${url}" target="_blank" style="color: var(--primary); font-weight: bold;">[원본 사이트 바로가기]</a>`;
                                } else if (sourceLinks.length > 0) {
                                    return sourceLinks.map((link, idx) =>
                                        `<a href="${link}" target="_blank" style="color: var(--primary); font-weight: bold; margin-right: 15px;">[출처 ${idx + 1}]</a>`
                                    ).join('');
                                }
                                return '-';
                            })()}
                        </td>
                    </tr>
                </tbody>
            </table>
            <div class="preview-table-card">
                <div class="preview-table-header">
                    📄 데이터 미리보기 (상위 20개 행)
                    <span class="badge-outline" style="background: #fee2e2; color: #b91c1c; border: none; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">CSV 전용</span>
                </div>
                <div id="modal-data-preview" class="data-preview-table-container">
                    <div style="padding: 40px; text-align: center; color: var(--text-muted);">
                        데이터를 읽어오는 중입니다...
                    </div>
                </div>
            </div>
        `;

        if (isTeacher) {
            setupTeacherEditInModal(modal, dataset, onUpdate);
        }
    }

    modal.style.display = 'flex';

    const previewEl = document.getElementById('modal-data-preview');
    if (previewEl) {
        if (dataset.file_url) {
            try {
                const previewData = await fetchDatasetPreview(dataset.file_url, dataset.data_name);
                renderPreviewTable(previewData, previewEl);
            } catch (err) {
                previewEl.innerHTML = `<div style="padding: 30px; text-align: center; color: #ef4444;">❌ 데이터를 불러오지 못했습니다: ${err.message}</div>`;
            }
        } else {
            previewEl.innerHTML = `<div style="padding: 30px; text-align: center; color: var(--text-muted);">연동된 파일이 없습니다.</div>`;
        }
    }

    if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
}

function isVarInfoFileName(name = '') {
    const n = name.replace(/\s/g, '').toLowerCase();
    return n.includes('변수정보') || n.includes('변수info') || n.includes('변수값') || n.includes('코드북') || n.includes('데이터정의');
}

export async function renderDatasetSampleViewer(datasets, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!datasets || datasets.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;"><p class="text-muted">연구 활용으로 선택된 데이터셋이 없습니다.<br>3단계에서 데이터셋의 <strong>연구 활용</strong> 체크박스를 선택해 주세요.</p></div>';
        return;
    }

    // 1. 초기 뼈대부터 먼저 렌더링 (사용자 경험 개선)
    container.innerHTML = datasets.map((ds, idx) => {
        const fileName = (ds.metadata?.filename || ds.data_name || '').trim();
        const isVarInfo = isVarInfoFileName(fileName);
        return `
        <div style="margin-bottom:20px;border:1px solid ${isVarInfo ? '#c7d2fe' : '#e2e8f0'};border-radius:12px;overflow:hidden;">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 20px;background:${isVarInfo ? '#eef2ff' : '#f8fafc'};border-bottom:1px solid ${isVarInfo ? '#c7d2fe' : '#e2e8f0'};">
                <div style="display:flex;align-items:center;gap:10px;font-weight:700;color:${isVarInfo ? '#3730a3' : 'var(--secondary)'};">
                    <i data-lucide="${isVarInfo ? 'list' : 'file-spreadsheet'}" size="16"></i>
                    ${fileName}
                    ${isVarInfo ? '<span style="font-size:0.72rem;font-weight:500;background:#c7d2fe;color:#3730a3;padding:2px 8px;border-radius:20px;">정보/정의서</span>' : ''}
                </div>
                <div style="display:flex;align-items:center;gap:12px;">
                    <!-- Segmented Control for Mode Selection -->
                    <div class="view-mode-selector" data-idx="${idx}" style="display:none; background:#f1f5f9; padding:3px; border-radius:8px; display:flex; align-items:center; border:1px solid #e2e8f0;">
                        <label style="margin:0; padding:4px 10px; font-size:0.75rem; font-weight:600; cursor:pointer; border-radius:6px; transition:all 0.2s; display:flex; align-items:center; gap:4px; color:#475569;" class="mode-label active">
                            <input type="radio" name="view-mode-${idx}" value="sample" checked style="display:none;">
                            샘플 데이터
                        </label>
                        <label style="margin:0; padding:4px 10px; font-size:0.75rem; font-weight:600; cursor:pointer; border-radius:6px; transition:all 0.2s; display:flex; align-items:center; gap:4px; color:#94a3b8;" class="mode-label">
                            <input type="radio" name="view-mode-${idx}" value="full" style="display:none;">
                            전체 데이터
                        </label>
                    </div>
                    <button class="copy-sample-btn btn-secondary" data-idx="${idx}" style="font-size:0.78rem;padding:5px 14px;display:none;align-items:center;gap:5px;">
                        <i data-lucide="copy" size="13"></i> 복사
                    </button>
                </div>
            </div>
            <pre id="ds-sample-text-${idx}" style="margin:0;padding:16px 20px;font-size:0.8rem;line-height:1.6;background:${isVarInfo ? '#f5f3ff' : 'white'};color:#64748b;white-space:pre-wrap;word-break:break-all;max-height:380px;overflow-y:auto;font-family:'Consolas','D2Coding',monospace;">데이터를 불러오는 중입니다...</pre>
        </div>`;
    }).join('');

    if (window.lucide) lucide.createIcons();

    // 2. 하나씩 데이터를 순차적으로 로드해와서 채우기 (동시 접속 수 제한 및 오류 방지)
    for (let idx = 0; idx < datasets.length; idx++) {
        const ds = datasets[idx];
        const fileName = (ds.metadata?.filename || ds.data_name || '').trim();
        const isVarInfo = isVarInfoFileName(fileName);
        const preEl = document.getElementById(`ds-sample-text-${idx}`);
        const copyBtn = container.querySelector(`.copy-sample-btn[data-idx="${idx}"]`);
        
        let text = '';
        try {
            if (isVarInfo) {
                const full = await fetchDatasetAll(ds.file_url);
                if (full && full.data && full.data.length > 0) {
                    const fields = full.fields || Object.keys(full.data[0]);
                    const varCol   = fields.find(f => /^변수$|^variable$|^var$/i.test(f.trim())) || fields[0];
                    const posCol   = fields.find(f => /위치|position|pos/i.test(f.trim()));
                    const labelCol = fields.find(f => /레이블|label/i.test(f.trim())) || fields[2];
                    text += `[${fileName} — 전체 ${full.data.length}행]\n`;
                    text += `(이 파일은 메타데이터 또는 정의서이므로 전체 내용을 표시합니다.)\n\n`;
                    
                    const headers = full.fields || Object.keys(full.data[0] || {});
                    full.data.forEach((row, i) => {
                        text += `[행 ${i + 1}] `;
                        text += headers.map(h => `${h}: ${row[h] ?? ''}`).join(' | ');
                        text += `\n`;
                    });
                } else {
                    text = '(변수정보를 불러올 수 없습니다.)';
                }
            } else {
                const preview = await fetchDatasetPreview(ds.file_url, ds.data_name);
                if (preview && preview.data && preview.data.length > 0) {
                    const sampleRows = preview.data.slice(0, 20);
                    const headers = preview.fields || Object.keys(sampleRows[0]);
                    const rowCount = ds.metadata?.row_count;
                    text += `[파일명: ${fileName}]\n`;
                    if (rowCount) text += `전체 행 수: ${Number(rowCount).toLocaleString()}행\n`;
                    text += `\n[컬럼 구성 (${headers.length}개)]\n${headers.join(', ')}\n`;
                    text += `\n[데이터 샘플 — 상위 ${sampleRows.length}행 (동일 패턴 반복 데이터)]\n`;
                    sampleRows.forEach((row, i) => {
                        text += `--- 행 ${i + 1} ---\n`;
                        headers.forEach(h => { text += `  ${h}: ${row[h] ?? ''}\n`; });
                    });
                } else {
                    text = '(데이터를 불러올 수 없습니다.)';
                }
            }
        } catch (err) {
            console.error(`Error loading sample for ${fileName}:`, err);
            text = `(로딩 실패: ${err.message})`;
            if (preEl) preEl.style.color = '#ef4444';
        }

        if (preEl) {
            preEl.innerText = text;
            preEl.style.color = '#1e293b'; 
        }

        // '모드 선택' 라디오 버튼 핸들러
        const selector = container.querySelector(`.view-mode-selector[data-idx="${idx}"]`);
        if (selector) {
            const previewText = text; 
            let fullText = null;      
            const rowCount = ds.metadata?.row_count || 0;

            // 20행 초과일 때만 선택기 노출
            if (rowCount > 20 || !rowCount) {
                selector.style.display = 'flex';
            }

            const labels = selector.querySelectorAll('.mode-label');
            selector.querySelectorAll('input[type="radio"]').forEach(radio => {
                radio.onchange = async () => {
                    // UI 스타일 업데이트
                    labels.forEach(l => {
                        const r = l.querySelector('input');
                        if (r.checked) {
                            l.style.background = 'white';
                            l.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                            l.style.color = 'var(--primary)';
                        } else {
                            l.style.background = 'transparent';
                            l.style.boxShadow = 'none';
                            l.style.color = '#94a3b8';
                        }
                    });

                    if (radio.value === 'sample') {
                        preEl.innerText = previewText;
                        text = previewText;
                    } else {
                        if (fullText) {
                            preEl.innerText = fullText;
                            text = fullText;
                        } else {
                            preEl.innerText = '데이터 전체를 불러오는 중...';
                            try {
                                const full = await fetchDatasetAll(ds.file_url);
                                if (full && full.data) {
                                    let generated = `[${fileName} — 전체 ${full.data.length}행]\n\n`;
                                    const headers = full.fields || Object.keys(full.data[0] || {});
                                    full.data.forEach((row, i) => {
                                        generated += `[행 ${i + 1}] `;
                                        generated += headers.map(h => `${h}: ${row[h] ?? ''}`).join(' | ');
                                        generated += `\n`;
                                    });
                                    fullText = generated;
                                    preEl.innerText = fullText;
                                    text = fullText;
                                }
                            } catch (err) {
                                alert('전체 데이터를 불러오지 못했습니다: ' + err.message);
                                const sampleRadio = selector.querySelector('input[value="sample"]');
                                if (sampleRadio) {
                                    sampleRadio.checked = true;
                                    sampleRadio.dispatchEvent(new Event('change'));
                                }
                            }
                        }
                    }
                };
            });
            // 초기 스타일 적용을 위해 change 이벤트 트리거
            const checkedRadio = selector.querySelector('input[checked]');
            if (checkedRadio) checkedRadio.dispatchEvent(new Event('change'));
        }
        if (copyBtn && text && !text.startsWith('(로딩 실패')) {
            copyBtn.style.display = 'flex';
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(text).then(() => {
                    const origHtml = copyBtn.innerHTML;
                    copyBtn.innerHTML = '<i data-lucide="check" size="13"></i> 복사됨!';
                    copyBtn.style.background = '#dcfce7';
                    copyBtn.style.borderColor = '#86efac';
                    if (window.lucide) lucide.createIcons();
                    setTimeout(() => {
                        copyBtn.innerHTML = origHtml;
                        copyBtn.style.background = '';
                        copyBtn.style.borderColor = '';
                        if (window.lucide) lucide.createIcons();
                    }, 2500);
                });
            };
        }
        
        // 브라우저 렌더링 여유를 주기 위해 아주 짧은 지연
        await new Promise(r => setTimeout(r, 50));
    }
}

export async function fetchDatasetAll(fileUrl, _fileName = '') {
    let finalUrl = fileUrl;
    if (!fileUrl.startsWith('http')) {
        const { data } = supabaseClient.storage.from('datasets').getPublicUrl(fileUrl);
        finalUrl = data.publicUrl;
    }
    const response = await fetch(finalUrl);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const buffer = await response.arrayBuffer();
    let text;
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(buffer); }
    catch (e) { text = new TextDecoder('euc-kr').decode(buffer); }
    return new Promise((resolve, reject) => {
        Papa.parse(text, {
            header: true,
            skipEmptyLines: 'greedy',
            complete: (r) => resolve({ data: r.data, fields: r.meta.fields }),
            error: (err) => reject(new Error(err.message || '파싱 실패')),
        });
    });
}

export async function fetchDatasetPreview(fileUrl, fileName = '') {
    let finalUrl = fileUrl;
    if (!fileUrl.startsWith('http')) {
        const { data } = supabaseClient.storage.from('datasets').getPublicUrl(fileUrl);
        finalUrl = data.publicUrl;
    }

    const isExcel = fileName.toLowerCase().endsWith('.xlsx') || fileName.toLowerCase().endsWith('.xls') ||
                  fileUrl.toLowerCase().endsWith('.xlsx') || fileUrl.toLowerCase().endsWith('.xls');

    try {
        const response = await fetch(finalUrl);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const buffer = await response.arrayBuffer();

        if (isExcel) {
            const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

            if (jsonData.length > 0) {
                const fields = jsonData[0];
                const dataRows = jsonData.slice(1, 21).map(row => {
                    const obj = {};
                    fields.forEach((f, i) => obj[f] = row[i]);
                    return obj;
                });
                return { data: dataRows, fields: fields };
            } else {
                throw new Error('엑셀 파일에 데이터가 없습니다.');
            }
        } else {
            let text;
            try {
                const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
                text = utf8Decoder.decode(buffer);
            } catch (e) {
                const euckrDecoder = new TextDecoder('euc-kr');
                text = euckrDecoder.decode(buffer);
            }

            return new Promise((resolve, reject) => {
                Papa.parse(text, {
                    header: true,
                    preview: 20,
                    skipEmptyLines: 'greedy',
                    complete: (results) => {
                        if (results.data && results.data.length > 0) {
                            resolve({ data: results.data, fields: results.meta.fields });
                        } else {
                            reject(new Error('데이터가 비어있거나 읽을 수 없는 형식입니다.'));
                        }
                    },
                    error: (err) => reject(new Error(err.message || '파일 파킹 실패'))
                });
            });
        }
    } catch (err) {
        throw new Error(`파일을 가져오는 중 오류 발생: ${err.message}`);
    }
}

function renderPreviewTable(previewResult, container) {
    const { data, fields } = previewResult;
    const headers = fields || (data.length > 0 ? Object.keys(data[0]) : []);

    if (headers.length === 0) {
        container.innerHTML = '<div style="padding: 30px; text-align: center;">표시할 데이터 컬럼이 없습니다.</div>';
        return;
    }

    container.innerHTML = `
        <table class="preview-table">
            <thead>
                <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${data.map(row => `
                    <tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>
                `).join('')}
            </tbody>
        </table>
    `;
}
