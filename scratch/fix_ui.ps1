$file = "c:\POS_printer_Project\POS_Printer_Edu\my-praise-land\public\Ext_App\PublicDataResearch\js\ui.js"
$lines = Get-Content $file
$startLine = 970
$endLine = 1430
$prefix = $lines[0..($startLine-2)]
$suffix = $lines[($endLine-1)..($lines.Length-1)]
$newContent = @'
async function setupTeacherUploadPanel(container, teacherEmail, onSuccess) {
    const fileInput = container.querySelector("#teacher-file-input");
    const nameInput = container.querySelector("#teacher-dataset-name");
    const jsonArea = container.querySelector("#teacher-metadata-json");
    const saveBtn = container.querySelector("#teacher-dataset-save-btn");
    const uploadStatus = container.querySelector("#teacher-upload-status");
    const jsonAutoMsg = container.querySelector("#json-autocomplete-msg");

    let selectedFile = null;
    let extractedMeta = {};

    if (fileInput) {
        fileInput.onchange = (e) => {
            selectedFile = e.target.files[0];
            const sizeKb = Math.round(selectedFile.size / 1024);
            const displaySize = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)}MB (${sizeKb.toLocaleString()}KB)` : `${sizeKb.toLocaleString()}KB`;
            if (uploadStatus) uploadStatus.innerText = `📦 ${selectedFile.name} (${displaySize}) 준비됨`;
            if (nameInput && !nameInput.value.trim()) {
                nameInput.value = selectedFile.name.replace(/\.[^.]+$/, "");
            }
        };
    }

    if (jsonArea) {
        jsonArea.addEventListener("input", () => {
            let str = jsonArea.value.trim();
            if (str.length < 10) return;
            try {
                str = str.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
                const data = JSON.parse(str);
                extractedMeta = data;
                const name = data.alternateName || data.name || "";
                if (name && nameInput && !nameInput.value.trim()) nameInput.value = name;
                if (jsonAutoMsg) jsonAutoMsg.style.display = "block";
            } catch {
                if (jsonAutoMsg) jsonAutoMsg.style.display = "none";
            }
        });
    }

    if (saveBtn) {
        saveBtn.onclick = async () => {
            const name = nameInput ? nameInput.value.trim() : "";
            if (!name) { alert("데이터셋 이름을 입력해 주세요."); return; }
            if (!selectedFile) { alert("업로드할 파일을 선택해 주세요."); return; }

            saveBtn.disabled = true;
            saveBtn.innerText = "저장 중...";
            try {
                let totalRows = 0;
                await new Promise((resolve) => {
                    Papa.parse(selectedFile, { header: true, skipEmptyLines: true, complete: (r) => { totalRows = r.data.length; resolve(); }, error: () => resolve() });
                });

                const { uploadManualFile } = await import("./downloader.js");
                const result = await uploadManualFile(teacherEmail, selectedFile, name);
                if (!result.success) throw new Error(result.error);

                const { saveTeacherDataset } = await import("./auth.js");
                const { error } = await saveTeacherDataset(teacherEmail, name, result.path, extractedMeta, result.size_kb, totalRows);
                if (error) throw new Error(error.message);

                if (uploadStatus) uploadStatus.innerText = "✅ 저장 완료!";
                saveBtn.innerText = "저장 완료!";
                setTimeout(() => { if (onSuccess) onSuccess(); }, 800);
            } catch (err) {
                alert("저장 중 오류가 발생했습니다: " + err.message);
                saveBtn.disabled = false; saveBtn.innerText = "저장하기";
            }
        };
    }
}

/**
 * Teacher View: Render ALL datasets from ALL students
 */
export function renderTeacherDataManagement(datasets, onToggleShare, onToggleResearch, teacherIds = [], teacherEmail = null, showUploadPanel = true, onTeacherUploadSuccess = null) {
    const container = document.getElementById("teacher-dataset-list");
    if (!container) return;

    if (!datasets || datasets.length === 0) {
        container.innerHTML = `
            ${showUploadPanel && teacherEmail ? renderTeacherUploadPanelHTML() : ""}
            <p class="text-muted" style="text-align:center; padding: 40px;">수집된 데이터셋이 없습니다.</p>`;
        if (showUploadPanel && teacherEmail) setupTeacherUploadPanel(container, teacherEmail, onTeacherUploadSuccess);
        if (window.lucide) lucide.createIcons();
        return;
    }

    const students = [];
    const seenIds = new Set();
    datasets.forEach(ds => {
        if (ds.student_id && !seenIds.has(ds.student_id) && ds.student_id !== teacherEmail) {
            seenIds.add(ds.student_id);
            students.push({ id: ds.student_id, name: ds.students?.name || ds.student_id });
        }
    });
    students.sort((a, b) => a.id.localeCompare(b.id));

    container.innerHTML = `
        ${showUploadPanel && teacherEmail ? renderTeacherUploadPanelHTML() : ""}

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
                    <label style="display:flex; align-items:center; gap:6px; padding:5px 12px; background:#f8fafc; border-radius:20px; font-size:0.82rem; cursor:pointer; border:1px solid #e2e8f0; transition:all 0.2s;" class="student-filter-label">
                        <input type="checkbox" class="student-filter-chk" value="${s.id}" checked style="width:14px; height:14px; accent-color:var(--primary);">
                        <span style="font-weight:600; color:#334155;">${s.name}</span>
                        <span style="font-size:0.72rem; color:#94a3b8;">${s.id}</span>
                    </label>
                `).join("")}
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
                <div style="display:flex; align-items:center; gap:8px; padding:6px 12px; background:rgba(255,255,255,0.6); border:1px solid #bfdbfe; border-radius:8px;">
                    <span style="font-size:0.78rem; color:#1e40af; font-weight:700;">작성자 일괄 변경:</span>
                    <select id="bulk-reassign-select" style="font-size:0.8rem; padding:4px 10px; border-radius:6px; border:1px solid #3b82f6;">
                        <option value="__teacher__">교사 (미배정)</option>
                        ${students.map(s => `<option value="${s.id}">${s.name}</option>`).join("")}
                    </select>
                    <button id="teacher-bulk-reassign-btn" class="btn-primary" style="font-size:0.78rem; padding:6px 14px; background:#3b82f6;">변경</button>
                </div>
                <button id="teacher-bulk-delete-btn" class="btn-primary" style="background:#e11d48; border-color:#e11d48; font-size:0.78rem; padding:8px 16px;">선택 삭제</button>
            </div>
        </div>

        <div id="teacher-management-table-wrap">
            <table style="width:100%;border-collapse:collapse;margin-top:4px;">
                <thead>
                    <tr style="text-align:left;border-bottom:2px solid var(--glass-border);background:#f8fafc;">
                        <th style="padding:12px; text-align:center; width:40px;"><input type="checkbox" id="ds-bulk-all-chk"></th>
                        <th style="padding:12px;">데이터셋 이름</th>
                        <th style="padding:12px;">작성자</th>
                        <th style="padding:12px;text-align:center;">행수</th>
                        <th style="padding:12px;text-align:center;">학생 연구 활용</th>
                        <th style="padding:12px;text-align:center;background:#fffbeb;">교사 테스트 활용</th>
                        <th style="padding:12px;text-align:center;">공유</th>
                        <th style="padding:12px;text-align:center;"></th>
                    </tr>
                </thead>
                <tbody id="management-tbody">
                    ${datasets.map(ds => {
                        const isTeacherOwned = teacherEmail && (ds.student_id === teacherEmail || ds.metadata?.teacher_email === teacherEmail);
                        const isUnassigned = isTeacherOwned && ds.student_id === teacherEmail;
                        const ownerName = isUnassigned ? "교사" : (ds.students?.name || ds.student_id || "탈퇴한 사용자");
                        const isTeacherChecked = teacherIds.includes(String(ds.id));
                        const meta = ds.metadata || {};
                        const rowStr = meta.row_count != null ? `${Number(meta.row_count).toLocaleString()}행` : "-";
                        const sizeKb = meta.size_kb || ds.size_kb;
                        const sizeStr = sizeKb ? (sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${Number(sizeKb).toLocaleString()} KB`) : "";
                        const ownerCell = isTeacherOwned
                            ? `<span class="reassign-owner-btn" data-id="${ds.id}" data-current="${ds.student_id}" style="cursor:pointer;display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:6px;font-size:0.82rem;font-weight:700;${isUnassigned ? "color:#4f46e5;background:#eef2ff;" : "color:#0369a1;background:#e0f2fe;"}">${ownerName} <i data-lucide="user-round-cog" size="13"></i></span>`
                            : `<span style="font-size:0.85rem;color:#4b5563;">${ownerName}</span>`;
                        return `
                        <tr class="clickable-row data-row" data-id="${ds.id}" data-student="${ds.student_id}" data-teacher-owned="${isTeacherOwned}" style="border-bottom:1px solid var(--glass-border);cursor:pointer;${isTeacherOwned ? "background:#f5f3ff;" : ""}">
                            <td style="padding:12px; text-align:center;" onclick="event.stopPropagation()">${isTeacherOwned ? `<input type="checkbox" class="ds-row-chk" data-id="${ds.id}">` : ""}</td>
                            <td style="padding:12px;"><div style="display:flex;align-items:center;gap:10px;"><i data-lucide="${isTeacherOwned ? "shield-check" : "file-spreadsheet"}" size="18"></i><strong>${ds.data_name}</strong></div></td>
                            <td style="padding:12px;" class="owner-cell" data-id="${ds.id}">${ownerCell}</td>
                            <td style="padding:12px;text-align:center;"><span style="font-size:0.88rem;font-weight:600;">${rowStr}</span>${sizeStr ? `<div style="font-size:0.72rem;color:#94a3b8;">${sizeStr}</div>` : ""}</td>
                            <td style="padding:12px;text-align:center;"><input type="checkbox" class="teacher-research-toggle" data-id="${ds.id}" ${ds.is_research_use ? "checked" : ""}></td>
                            <td style="padding:12px;text-align:center;background:#fffdf0;"><input type="checkbox" class="teacher-test-toggle" data-id="${ds.id}" ${isTeacherChecked ? "checked" : ""} style="accent-color:#f59e0b;"></td>
                            <td style="padding:12px;text-align:center;"><label class="switch"><input type="checkbox" class="teacher-share-toggle" data-id="${ds.id}" ${ds.is_shared ? "checked" : "" Heather}><span class="slider"></span></label></td>
                            <td style="padding:12px;text-align:center;">${isTeacherOwned ? `<button class="teacher-delete-ds-btn btn-secondary" data-id="${ds.id}" style="color:#dc2626;"><i data-lucide="trash-2" size="13"></i></button>` : ""}</td>
                        </tr>`;
                    }).join("")}
                </tbody>
            </table>
            <div id="no-filtered-data" style="display:none; text-align:center; padding:50px; color:#94a3b8;"><p>선택한 조건에 맞는 데이터가 없습니다.</p></div>
        </div>
    `;

    const filterChecks = container.querySelectorAll(".student-filter-chk");
    const dataRows = container.querySelectorAll(".data-row");
    const noDataMsg = container.querySelector("#no-filtered-data");

    const updateFilter = () => {
        const selectedIds = Array.from(filterChecks).filter(chk => chk.checked).map(chk => chk.value);
        const showTeacher = selectedIds.includes("__teacher__");
        filterChecks.forEach(chk => {
            const label = chk.closest(".student-filter-label");
            if (chk.checked) { label.style.opacity = "1"; label.style.borderColor = "var(--primary)"; }
            else { label.style.opacity = "0.4"; label.style.borderColor = "#e2e8f0"; }
        });
        let visibleCount = 0;
        dataRows.forEach(row => {
            const studentId = row.dataset.student;
            const dsId = row.dataset.id;
            const ds = datasets.find(d => String(d.id) === dsId);
            const isTeacherRow = teacherEmail && (studentId === teacherEmail || ds?.metadata?.teacher_email === teacherEmail);
            let shouldShow = isTeacherRow ? showTeacher : selectedIds.includes(studentId);
            row.style.display = shouldShow ? "table-row" : "none";
            if (shouldShow) visibleCount++;
        });
        noDataMsg.style.display = visibleCount === 0 ? "block" : "none";
    };
'@
$prefix + $newContent.Split("`n") + $suffix | Set-Content $file -Encoding utf8
