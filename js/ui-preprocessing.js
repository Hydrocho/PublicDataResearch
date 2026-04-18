import { supabaseClient } from './config.js';

export async function renderPreprocessingView(containerId, {
    getOwnLogsFn,
    getTeamLogsFn = null,
    getDatasetsFn,
    getSelectedId,
    setSelectedIdAndRerender,
    onDelete = null,
    onGoToStep4 = null,
    isTeacherMode = false,
}) {
    const canvasInner = document.getElementById(containerId);
    if (!canvasInner) return;

    canvasInner.innerHTML = '<div style="text-align:center;padding:40px;"><p class="text-muted">4단계 연구 기록을 불러오는 중입니다...</p></div>';

    const [{ data: rawLogs, error }, teamResult] = await Promise.all([
        getOwnLogsFn(),
        getTeamLogsFn ? getTeamLogsFn() : Promise.resolve({ data: null }),
    ]);
    const teamLogs = teamResult.data || [];
    
    let logs = Array.isArray(rawLogs) ? rawLogs.flat() : (rawLogs ? [rawLogs] : []);
    const hasOwn = logs.length > 0;
    const hasTeam = teamLogs.length > 0;

    if (error || (!hasOwn && !hasTeam)) {
        canvasInner.innerHTML = `
            <div style="text-align:center;padding:50px 20px;">
                <div style="font-size:3rem;margin-bottom:20px;">📝</div>
                <h3 style="margin-bottom:10px;">${isTeacherMode ? '4단계 테스트 결과가 없습니다.' : '4단계에서 저장된 연구 주제가 없습니다.'}</h3>
                <p class="text-muted">${isTeacherMode
                    ? '[4단계: 문제 정의] 탭의 <strong>교사 테스트</strong>에서 프롬프트를 생성하면<br>이곳에서 5단계 테스트를 진행할 수 있습니다.'
                    : '먼저 [4단계: 문제 정의]에서 AI 프롬프트를 생성하고<br>답변 내용을 저장해 주세요.'}</p>
                ${onGoToStep4 ? `<button class="btn-secondary" style="margin-top:20px;" id="go-to-step4-btn">${isTeacherMode ? '4단계 테스트로 가기' : '4단계로 가기'}</button>` : ''}
            </div>`;
        if (onGoToStep4) {
            const goBtn = canvasInner.querySelector('#go-to-step4-btn');
            if (goBtn) goBtn.onclick = onGoToStep4;
        }
        return;
    }

    const selectedResearchId = getSelectedId();

    if (selectedResearchId) {
        const allLogs = [...(logs || []), ...(teamLogs || [])];
        const selectedLog = allLogs.find(l => String(l.id) === String(selectedResearchId));
        if (selectedLog) {
            let data;
            try { data = JSON.parse(selectedLog.content); } catch(e) { data = { answer: selectedLog.content }; }

            canvasInner.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:25px;">
                    <div>
                        <h2 style="display:flex;align-items:center;gap:10px;">
                            <i data-lucide="check-circle-2" style="color:var(--primary);"></i> 5단계: 데이터 전처리
                            ${isTeacherMode ? '<span style="font-size:0.75rem;background:#fef3c7;color:#92400e;border-radius:6px;padding:3px 10px;font-weight:600;">🧪 교사 테스트 모드</span>' : ''}
                            ${selectedLog._isTeam ? `<span style="font-size:0.75rem;background:#e0f2fe;color:#0369a1;border-radius:6px;padding:3px 10px;font-weight:600;">팀원: ${selectedLog._memberName}</span>` : ''}
                        </h2>
                        <p class="text-muted">선택하신 연구 주제의 상세 내용을 확인하고 전처리를 준비합니다.</p>
                    </div>
                    <button id="reset-selection-btn" class="btn-secondary" style="font-size:0.85rem;">다른 주제 선택</button>
                </div>

                <div class="glass" style="padding:25px;margin-bottom:25px;border-left:4px solid var(--primary);">
                    <div style="margin-bottom:20px;">
                        <h4 style="color:var(--secondary);margin-bottom:10px;font-size:1rem;">📝 연구자의 분석 관점 및 아이디어</h4>
                        <div style="padding:15px;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;font-size:0.95rem;line-height:1.5;color:var(--text);">${data.opinion || '의견 없음'}</div>
                    </div>
                    <div style="margin-bottom:20px;">
                        <h4 style="color:var(--secondary);margin-bottom:10px;font-size:1rem;">🤖 생성된 연구 가이드 프롬프트</h4>
                        <div style="padding:15px;background:#0f172a;color:#f8fafc;border-radius:8px;font-family:'Consolas',monospace;font-size:0.85rem;line-height:1.4;max-height:150px;overflow-y:auto;">${data.prompt || '프롬프트 내역 없음'}</div>
                    </div>
                    <div>
                        <h4 style="color:var(--secondary);margin-bottom:10px;font-size:1rem;">✨ 인공지능 답변 기록 (상세 원문)</h4>
                        <div style="padding:20px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;font-size:1rem;line-height:1.7;color:var(--text);min-height:200px;white-space:pre-wrap;">${data.answer}</div>
                    </div>
                </div>

                <div style="text-align:center;padding:40px;border:2px dashed #cbd5e1;border-radius:15px;background:rgba(255,255,255,0.4);margin-bottom:25px;">
                    <h3 style="margin-bottom:10px;color:var(--secondary);">🛠️ 데이터 전처리 가이드</h3>
                    <p class="text-muted" style="margin-bottom:20px;">이 연구를 수행하기 위한 Python(Pandas) 전처리 코드를 생성합니다.</p>
                    <button id="generate-colab-prompt-btn" class="btn-primary" style="background:#059669;border-color:#059669;padding:12px 25px;">
                        <i data-lucide="code" style="vertical-align:middle;margin-right:8px;"></i> 구글 코랩(Colab) 전처리 프롬프트 생성
                    </button>
                </div>

                <div id="colab-prompt-result" style="display:none;background:#0f172a;border-radius:12px;padding:25px;margin-bottom:25px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                        <h4 style="color:#f8fafc;margin:0;font-size:1rem;">💻 구글 코랩용 AI 요청 프롬프트</h4>
                        <button id="copy-colab-btn" class="btn-secondary" style="font-size:0.75rem;padding:5px 12px;background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.2);color:white;">복사하기</button>
                    </div>
                    <textarea id="colab-prompt-text" readonly style="width:100%;height:350px;background:rgba(0,0,0,0.3);color:#e2e8f0;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:15px;font-family:'Consolas',monospace;font-size:0.85rem;line-height:1.6;"></textarea>
                    <div style="margin-top:15px;color:#94a3b8;font-size:0.8rem;">
                        <i data-lucide="info" size="14" style="vertical-align:middle;margin-right:5px;"></i> 이 내용을 복사하여 ChatGPT 등에 입력하면 전처리 코드를 얻을 수 있습니다.
                    </div>
                </div>

                <div id="research-download-center" style="display:none;background:white;border-radius:12px;border:1px solid #e2e8f0;padding:25px;margin-bottom:25px;box-shadow:var(--shadow-sm);">
                    <h3 style="margin:0 0 20px 0;color:var(--secondary);font-size:1.15rem;">
                        <i data-lucide="download-cloud" style="vertical-align:middle;margin-right:8px;"></i> 분석 데이터 파일 다운로드
                    </h3>
                    <div id="research-files-list" style="display:grid;gap:12px;"></div>
                    <p style="font-size:0.8rem;color:#64748b;margin-top:15px;">
                        <i data-lucide="alert-circle" size="14" style="vertical-align:middle;"></i> 다운로드한 파일을 구글 코랩(Colab)에 그대로 업로드하여 사용하세요.
                    </p>
                </div>
            `;
            lucide.createIcons();

            canvasInner.querySelector('#reset-selection-btn').onclick = () => setSelectedIdAndRerender(null);

            const colabBtn = canvasInner.querySelector('#generate-colab-prompt-btn');
            if (colabBtn) {
                colabBtn.onclick = async () => {
                    colabBtn.disabled = true;
                    colabBtn.innerHTML = '<i class="spinner-sm"></i> 프롬프트 생성 중...';
                    const { generateColabPreprocessingPrompt } = await import('./research_prompts.js');
                    try {
                        const { data: allDatasets, error: fetchErr } = await getDatasetsFn();
                        if (fetchErr) throw fetchErr;
                        const researchText = data.answer || '';
                        const datasets = (allDatasets || []).filter(ds => {
                            const baseName = ds.data_name.replace(/\.(csv|xlsx|xls|json)$/i, '').trim();
                            const lowerText = researchText.toLowerCase();
                            return lowerText.includes(baseName.toLowerCase()) || lowerText.includes(ds.data_name.toLowerCase());
                        });
                        const colabPrompt = await generateColabPreprocessingPrompt(selectedLog, datasets);
                        const resultArea = canvasInner.querySelector('#colab-prompt-result');
                        const promptTextArea = canvasInner.querySelector('#colab-prompt-text');
                        resultArea.style.display = 'block';
                        promptTextArea.value = colabPrompt;
                        resultArea.scrollIntoView({ behavior: 'smooth' });

                        const downloadCenter = canvasInner.querySelector('#research-download-center');
                        const filesList = canvasInner.querySelector('#research-files-list');
                        if (downloadCenter && filesList) {
                            downloadCenter.style.display = 'block';
                            if (datasets.length === 0) {
                                filesList.innerHTML = `<div style="text-align:center;padding:20px;color:#64748b;font-size:0.9rem;background:#f1f5f9;border-radius:8px;">내려받을 수 있는 데이터셋이 없습니다. 먼저 0단계 또는 데이터를 저장해 주세요.</div>`;
                            } else {
                                filesList.innerHTML = datasets.map(ds => {
                                    const meta = ds.metadata || {};
                                    const sizeKb = meta.size_kb || ds.size_kb;
                                    const sizeStr = sizeKb ? (sizeKb >= 1024 ? `${(sizeKb/1024).toFixed(1)} MB (${Number(sizeKb).toLocaleString()} KB)` : `${Number(sizeKb).toLocaleString()} KB`) : '';
                                    const rowCount = meta.row_count;
                                    const rowStr = rowCount != null ? `${Number(rowCount).toLocaleString()}행` : '';
                                    const infoStr = [rowStr, sizeStr].filter(Boolean).join(' · ');
                                    let fileName = (ds.metadata?.filename || ds.data_name).trim();
                                    if (!fileName.toLowerCase().endsWith('.csv')) fileName += '.csv';
                                    let downloadUrl = ds.file_url;
                                    if (downloadUrl && !downloadUrl.startsWith('http')) {
                                        let storagePath = downloadUrl;
                                        if (storagePath.startsWith('datasets/')) storagePath = storagePath.replace('datasets/', '');
                                        const { data: { publicUrl } } = supabaseClient.storage.from('datasets').getPublicUrl(storagePath);
                                        downloadUrl = `${publicUrl}?download=${encodeURIComponent(fileName)}`;
                                    }
                                    return `
                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                                            <div style="display:flex;align-items:center;gap:12px;">
                                                <i data-lucide="file-spreadsheet" style="color:#059669;"></i>
                                                <div>
                                                    <div style="font-weight:600;font-size:0.95rem;color:#1e293b;">${fileName}</div>
                                                    <div style="font-size:0.75rem;color:#64748b;">${infoStr || '정보 없음'}</div>
                                                </div>
                                            </div>
                                            <a href="${downloadUrl}" class="btn-secondary" style="font-size:0.8rem;padding:6px 15px;background:white;text-decoration:none;display:flex;align-items:center;gap:5px;color:#475569;border:1px solid #cbd5e1;">
                                                <i data-lucide="download" size="14"></i> 다운로드
                                            </a>
                                        </div>`;
                                }).join('');
                            }
                        }
                        lucide.createIcons();
                    } catch (err) {
                        alert('프롬프트 생성 중 오류가 발생했습니다: ' + err.message);
                    } finally {
                        colabBtn.disabled = false;
                        colabBtn.innerHTML = '<i data-lucide="code" style="vertical-align:middle;margin-right:8px;"></i> 구글 코랩(Colab) 전처리 프롬프트 생성';
                        lucide.createIcons();
                    }
                };
            }

            const copyColabBtn = canvasInner.querySelector('#copy-colab-btn');
            if (copyColabBtn) {
                copyColabBtn.onclick = () => {
                    const text = canvasInner.querySelector('#colab-prompt-text').value;
                    navigator.clipboard.writeText(text).then(() => {
                        copyColabBtn.innerText = '복사 완료!';
                        setTimeout(() => copyColabBtn.innerText = '복사하기', 2000);
                    });
                };
            }
            return;
        }
    }

    canvasInner.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <h2>5단계: 데이터 전처리 및 정제</h2>
            ${isTeacherMode ? '<span style="font-size:0.8rem;background:#fef3c7;color:#92400e;border-radius:20px;padding:5px 14px;font-weight:600;">🧪 교사 테스트 모드</span>' : ''}
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:25px;">
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 18px;">
                <div style="font-size:0.75rem;font-weight:700;color:#16a34a;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">5단계 역할</div>
                <div style="font-size:0.88rem;color:#166534;line-height:1.55;">4단계에서 저장한 연구 주제를 선택하고, 해당 주제에 맞는 <strong>데이터 전처리 코드</strong>를 AI의 도움으로 생성합니다. 생성된 코드는 구글 코랩(Colab)에서 바로 사용할 수 있습니다.</div>
            </div>
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px 18px;">
                <div style="font-size:0.75rem;font-weight:700;color:#1d4ed8;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">사용 방법</div>
                <div style="font-size:0.88rem;color:#1e3a8a;line-height:1.55;">① 아래 목록에서 연구 주제 <strong>선택하기</strong> → ② <strong>코랩 전처리 프롬프트 생성</strong> 클릭 → ③ 생성된 프롬프트를 ChatGPT 등에 붙여넣어 코드 받기 → ④ 코랩에서 실행</div>
            </div>
            <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;padding:16px 18px;">
                <div style="font-size:0.75rem;font-weight:700;color:#7c3aed;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">${isTeacherMode ? '테스트 모드 안내' : '연구 주제 추가'}</div>
                <div style="font-size:0.88rem;color:#4c1d95;line-height:1.55;">${isTeacherMode
                    ? '[4단계: 문제 정의] 탭의 교사 테스트에서 프롬프트를 생성해야 이 목록에 나타납니다. 학생 기록에는 영향을 주지 않습니다.'
                    : '목록에 주제가 없거나 새 주제를 추가하려면 <strong>4단계: 문제 정의</strong>에서 AI 답변을 저장해 주세요. 저장된 항목이 이 목록에 자동으로 나타납니다.'}</div>
            </div>
        </div>

        <div style="margin-bottom:20px;">
            <h4 style="margin-bottom:15px;display:flex;align-items:center;gap:8px;">
                <i data-lucide="list-checks" size="18"></i> ${isTeacherMode ? '교사 테스트 연구 주제' : '내 연구 주제'}
            </h4>
            ${!hasOwn ? `<p class="text-muted" style="padding:15px;background:#f8fafc;border-radius:8px;">${isTeacherMode ? '생성된 교사 테스트 연구 주제가 없습니다.' : '저장된 내 연구 주제가 없습니다.'}</p>` : `
            <div style="display:grid;gap:15px;">
                ${(logs || []).map(log => {
                    let logData;
                    try { logData = JSON.parse(log.content); } catch(e) { logData = { answer: log.content }; }
                    const dateStr = new Date(log.created_at).toLocaleString();
                    const isSelected = String(selectedResearchId) === String(log.id);
                    return `
                        <div class="glass card research-log-card ${isSelected ? 'active' : ''}"
                             data-id="${log.id}"
                             style="padding:20px;cursor:pointer;border-left:4px solid ${isSelected ? 'var(--primary)' : 'var(--glass-border)'};transition:all 0.2s;">
                            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
                                <span style="font-size:0.8rem;color:var(--primary);font-weight:500;">
                                    <i data-lucide="clock" size="12" style="vertical-align:middle;"></i> ${dateStr}
                                </span>
                                ${isSelected ? '<span class="tag" style="background:var(--primary);color:white;scale:0.8;">선택됨</span>' : ''}
                            </div>
                            <div style="margin-bottom:12px;">
                                <strong style="display:block;font-size:0.9rem;color:var(--secondary);margin-bottom:5px;">분석 관점:</strong>
                                <p style="font-size:0.95rem;line-height:1.4;color:var(--text);margin:0;">${logData.opinion || '의견 없음'}</p>
                            </div>
                            <div>
                                <strong style="display:block;font-size:0.9rem;color:var(--secondary);margin-bottom:5px;">AI 제안 요약:</strong>
                                <p style="font-size:0.9rem;color:#64748b;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.5;margin:0;">${logData.answer}</p>
                            </div>
                            <div style="text-align:right;margin-top:15px;">
                                ${onDelete ? `<button class="btn-secondary delete-research-btn" data-id="${log.id}" style="font-size:0.8rem;padding:6px 15px;background:#fee2e2;color:#dc2626;border-color:#fecaca;margin-right:8px;">삭제</button>` : ''}
                                <button class="btn-primary select-research-btn" data-id="${log.id}" style="font-size:0.8rem;padding:6px 15px;">${isSelected ? '현재 선택됨' : '선택하기'}</button>
                            </div>
                        </div>`;
                }).join('')}
            </div>`}
        </div>

        ${hasTeam ? `
        <div style="margin-top:35px;padding-top:25px;border-top:1px dashed #cbd5e1;">
            <h4 style="margin-bottom:15px;display:flex;align-items:center;gap:8px;color:#0369a1;">
                <i data-lucide="users-round" size="18"></i> 팀원의 연구 주제
            </h4>
            <div style="display:grid;gap:15px;">
                ${(teamLogs || []).map(log => {
                    let logData;
                    try { logData = JSON.parse(log.content); } catch(e) { logData = { answer: log.content }; }
                    const dateStr = new Date(log.created_at).toLocaleString();
                    const isSelected = String(selectedResearchId) === String(log.id);
                    return `
                        <div class="glass card research-log-card ${isSelected ? 'active' : ''}"
                             data-id="${log.id}"
                             style="padding:20px;cursor:pointer;border-left:4px solid ${isSelected ? '#0284c7' : '#bae6fd'};background:#f0f9ff;transition:all 0.2s;">
                            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
                                <div style="display:flex;align-items:center;gap:8px;">
                                    <span style="font-size:0.8rem;color:#0369a1;font-weight:500;">
                                        <i data-lucide="clock" size="12" style="vertical-align:middle;"></i> ${dateStr}
                                    </span>
                                    <span style="font-size:0.75rem;background:#e0f2fe;color:#0369a1;border-radius:4px;padding:1px 8px;font-weight:600;">${log._memberName}</span>
                                </div>
                                ${isSelected ? '<span class="tag" style="background:#0284c7;color:white;scale:0.8;">선택됨</span>' : ''}
                            </div>
                            <div style="margin-bottom:12px;">
                                <strong style="display:block;font-size:0.9rem;color:var(--secondary);margin-bottom:5px;">분석 관점:</strong>
                                <p style="font-size:0.95rem;line-height:1.4;color:var(--text);margin:0;">${logData.opinion || '의견 없음'}</p>
                            </div>
                            <div>
                                <strong style="display:block;font-size:0.9rem;color:var(--secondary);margin-bottom:5px;">AI 제안 요약:</strong>
                                <p style="font-size:0.9rem;color:#64748b;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.5;margin:0;">${logData.answer}</p>
                            </div>
                            <div style="text-align:right;margin-top:15px;">
                                <button class="btn-primary select-research-btn" data-id="${log.id}" style="font-size:0.8rem;padding:6px 15px;background:#0284c7;border-color:#0284c7;">${isSelected ? '현재 선택됨' : '선택하기'}</button>
                            </div>
                        </div>`;
                }).join('')}
            </div>
        </div>` : ''}
    `;

    lucide.createIcons();

    canvasInner.querySelectorAll('.delete-research-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            if (!onDelete) return;
            if (!confirm('정말로 이 연구 기록을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.')) return;
            const id = btn.dataset.id;
            try {
                await onDelete(id);
                if (String(getSelectedId()) === String(id)) setSelectedIdAndRerender(null);
                else setSelectedIdAndRerender(getSelectedId());
            } catch(err) {
                console.error('Delete failed:', err);
            }
        };
    });

    canvasInner.querySelectorAll('.select-research-btn').forEach(btn => {
        btn.onclick = (e) => { e.stopPropagation(); setSelectedIdAndRerender(btn.dataset.id); };
    });

    canvasInner.querySelectorAll('.research-log-card').forEach(card => {
        card.onclick = () => setSelectedIdAndRerender(card.dataset.id);
    });
}

export function renderTeacherPreprocessing(logs, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!logs || logs.length === 0) {
        container.innerHTML = '<div class="text-muted" style="text-align:center; padding: 40px;">아직 작성된 4단계 기록이 없습니다.</div>';
        return;
    }

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px;">
            ${logs.map(log => {
                let data = { answer: '', opinion: '' };
                try {
                    data = JSON.parse(log.content);
                } catch (e) {
                    data.answer = log.content;
                }

                return `
                <div class="glass card clickable-card teacher-step2-card" data-id="${log.id}" 
                     style="padding: 20px; transition: all 0.2s; cursor: pointer; border-left: 4px solid #0ea5e9;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                        <span style="font-size: 0.8rem; color: var(--primary); font-weight: 500;">
                            <i data-lucide="clock" size="12" style="vertical-align: middle;"></i> ${new Date(log.created_at).toLocaleString()}
                        </span>
                        <span class="badge" style="background: #e0f2fe; color: #0369a1; font-size: 0.7rem;">${log.student_name}</span>
                    </div>
                    
                    <div style="margin-bottom: 12px;">
                        <strong style="display: block; font-size: 0.85rem; color: var(--secondary); margin-bottom: 5px;">연구 주제:</strong>
                        <p style="font-size: 0.95rem; font-weight: 600; line-height: 1.4; color: var(--text); margin:0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                            ${data.opinion || '연구 주제'}
                        </p>
                    </div>

                    <div style="text-align: right; margin-top: 15px;">
                        <button class="btn-primary" style="font-size: 0.8rem; padding: 6px 15px; background: #0ea5e9; border-color: #0ea5e9;">전처리 가이드 보기</button>
                    </div>
                </div>
                `;
            }).join('')}
        </div>
    `;

    if (window.lucide) lucide.createIcons();

    container.querySelectorAll('.teacher-step2-card').forEach(card => {
        card.onclick = () => {
            const log = logs.find(l => String(l.id) === card.dataset.id);
            if (log) renderTeacherPreprocessingDetail(log, containerId, logs);
        };
    });
}

export async function renderTeacherPreprocessingDetail(selectedLog, containerId, allLogs) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let data;
    try {
        data = JSON.parse(selectedLog.content);
    } catch(e) {
        data = { answer: selectedLog.content };
    }

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
            <div>
                <h2 style="display: flex; align-items: center; gap: 10px; font-size: 1.25rem;">
                    <i data-lucide="user" style="color: var(--primary);"></i> ${selectedLog.student_name} 학생의 5단계 전처리
                </h2>
                <p class="text-muted" style="font-size: 0.9rem;">선택된 연구 주제에 최적화된 전처리 가이드를 확인합니다.</p>
            </div>
            <button id="back-to-step2-list-btn" class="btn-secondary" style="font-size: 0.85rem;">전체 목록으로</button>
        </div>

        <div class="glass" style="padding: 25px; margin-bottom: 25px; border-left: 4px solid #0ea5e9; background: white;">
            <div style="margin-bottom: 20px;">
                <h4 style="color: var(--secondary); margin-bottom: 15px; font-size: 1rem; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="lightbulb" size="18"></i> 연구자의 핵심 의견
                </h4>
                <div style="padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.95rem; line-height: 1.5; color: var(--text);">
                    ${data.opinion || '의견 없음'}
                </div>
            </div>

            <div>
                <h4 style="color: var(--secondary); margin-bottom: 15px; font-size: 1rem; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="bot" size="18"></i> AI 제안 내용 요약
                </h4>
                <div style="padding: 20px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 1rem; line-height: 1.7; color: var(--text); min-height: 150px; white-space: pre-wrap;">${data.answer}</div>
            </div>
        </div>

        <div style="text-align: center; padding: 40px; border: 2px dashed #cbd5e1; border-radius: 15px; background: rgba(14, 165, 233, 0.05); margin-bottom: 25px;">
            <h3 style="margin-bottom: 10px; color: var(--secondary);">🛠️ 데이터 전처리 가이드 생성</h3>
            <p class="text-muted" style="margin-bottom: 20px;">학생과 동일하게 Python(Pandas) 전처리 코드를 생성해 볼 수 있습니다.</p>
            <button id="teacher-generate-colab-btn" class="btn-primary" style="background: #059669; border-color: #059669; padding: 12px 25px;">
                <i data-lucide="code" style="vertical-align: middle; margin-right: 8px;"></i> 구글 코랩(Colab) 전처리 프롬프트 생성 (테스트)
            </button>
        </div>

        <div id="teacher-colab-result" style="display: none; background: #0f172a; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="color: #f8fafc; margin: 0; font-size: 1rem;">💻 생성된 구글 코랩용 프롬프트</h4>
                <button id="teacher-copy-colab-btn" class="btn-secondary" style="font-size: 0.75rem; padding: 5px 12px; background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); color: white;">복사하기</button>
            </div>
            <textarea id="teacher-colab-text" readonly style="width: 100%; height: 300px; background: rgba(0,0,0,0.3); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 15px; font-family: 'Consolas', monospace; font-size: 0.85rem; line-height: 1.6;"></textarea>
        </div>

        <div id="teacher-download-center" style="display: none; background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 25px; box-shadow: var(--shadow-sm);">
            <h3 style="margin: 0 0 20px 0; color: var(--secondary); font-size: 1.15rem;">
                <i data-lucide="download-cloud" style="vertical-align: middle; margin-right: 8px;"></i> 학생이 가공해야 할 원본 데이터
            </h3>
            <div id="teacher-files-list" style="display: grid; gap: 12px;"></div>
        </div>
    `;

    lucide.createIcons();

    document.getElementById('back-to-step2-list-btn').onclick = () => renderTeacherPreprocessing(allLogs, containerId);

    const genBtn = document.getElementById('teacher-generate-colab-btn');
    if (genBtn) {
        genBtn.onclick = async () => {
            genBtn.disabled = true;
            genBtn.innerHTML = '<i class="spinner-sm"></i> 가이드 생성 중...';
            
            const { fetchAllResearchDatasets } = await import('./auth.js');
            const { generateColabPreprocessingPrompt } = await import('./research_prompts.js');
            
            try {
                const { data: allDatasets, error: fetchErr } = await fetchAllResearchDatasets(selectedLog.student_id);
                if (fetchErr) throw fetchErr;
                
                const researchText = data.answer || "";
                const datasets = (allDatasets || []).filter(ds => {
                    const baseName = ds.data_name.replace(/\.(csv|xlsx|xls|json)$/i, "").trim();
                    const lowerText = researchText.toLowerCase();
                    return lowerText.includes(baseName.toLowerCase()) || 
                           lowerText.includes(ds.data_name.toLowerCase());
                });

                const colabPrompt = await generateColabPreprocessingPrompt(selectedLog, datasets);
                
                const resultArea = document.getElementById('teacher-colab-result');
                const promptTextArea = document.getElementById('teacher-colab-text');
                resultArea.style.display = 'block';
                promptTextArea.value = colabPrompt;

                const downloadCenter = document.getElementById('teacher-download-center');
                const filesList = document.getElementById('teacher-files-list');
                if (downloadCenter && filesList) {
                    downloadCenter.style.display = 'block';
                    if (datasets.length === 0) {
                        filesList.innerHTML = '<div style="text-align: center; padding: 20px; color: #64748b;">(이 연구를 위해 선택된 데이터셋이 없습니다.)</div>';
                    } else {
                        filesList.innerHTML = datasets.map(ds => {
                            let fileName = ds.data_name.trim();
                            if (!fileName.toLowerCase().endsWith('.csv')) fileName += '.csv';
                            return `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <i data-lucide="file-spreadsheet" style="color: #059669;"></i>
                                        <div style="font-weight: 600; font-size: 0.95rem; color: #1e293b;">${fileName}</div>
                                    </div>
                                    <button class="btn-secondary" disabled style="font-size: 0.75rem; padding: 4px 10px; opacity: 0.6;">교사용 미리보기 전용</button>
                                </div>
                            `;
                        }).join('');
                    }
                    lucide.createIcons();
                }
            } catch (err) {
                alert('가이드 생성 중 오류: ' + err.message);
            } finally {
                genBtn.disabled = false;
                genBtn.innerHTML = '<i data-lucide="code" style="vertical-align: middle; margin-right: 8px;"></i> 구글 코랩(Colab) 전처리 프롬프트 생성 (테스트)';
                lucide.createIcons();
            }
        };
    }

    const copyBtn = document.getElementById('teacher-copy-colab-btn');
    if (copyBtn) {
        copyBtn.onclick = () => {
            const text = document.getElementById('teacher-colab-text').value;
            navigator.clipboard.writeText(text).then(() => {
                const originalText = copyBtn.innerText;
                copyBtn.innerText = '복사 완료!';
                setTimeout(() => copyBtn.innerText = originalText, 2000);
            });
        };
    }
}
