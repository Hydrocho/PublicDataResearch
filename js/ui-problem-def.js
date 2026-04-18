export async function renderProblemDefinitionView(containerId, getDatasetsFn, saveRecordFn, goToManagementFn) {
    const canvasInner = document.getElementById(containerId);
    if (!canvasInner) return;

    canvasInner.innerHTML = '<div style="text-align:center;padding:40px;"><p class="text-muted">연구용 데이터를 불러오는 중입니다...</p></div>';

    const { generateProblemDefinitionPrompt } = await import('./research_prompts.js');
    const { data: datasets, error } = await getDatasetsFn();

    if (error || !datasets || datasets.length === 0) {
        const isTeacher = !saveRecordFn;
        canvasInner.innerHTML = `
            <div style="text-align:center;padding:50px 20px;">
                <div style="font-size:3rem;margin-bottom:20px;">📋</div>
                <h3 style="margin-bottom:10px;">연구 활용으로 선택된 데이터가 없습니다.</h3>
                <p class="text-muted">${isTeacher
                    ? '데이터 관리 탭에서 <strong>교사 테스트 활용</strong> 체크박스를 선택해 주세요.'
                    : '먼저 [데이터 관리] 단계에서 연구에 활용할 데이터셋들을<br>체크박스로 선택해 주세요.'}</p>
                ${goToManagementFn ? `<button class="btn-secondary" style="margin-top:20px;" id="go-to-mgmt-btn">데이터 관리로 가기</button>` : ''}
            </div>`;
        const goBtn = canvasInner.querySelector('#go-to-mgmt-btn');
        if (goBtn && goToManagementFn) goBtn.onclick = goToManagementFn;
        return;
    }

    const isTeacher = !saveRecordFn;
    canvasInner.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <h2>4단계: 문제 정의 및 가설 설정</h2>
            <span class="tag" style="background:${isTeacher ? '#fef3c7' : 'var(--primary-glow)'};padding:5px 12px;border-radius:20px;font-size:0.8rem;color:${isTeacher ? '#92400e' : ''};">
                ${isTeacher ? '🧪 교사 테스트 모드' : '분석 준비 완료'}
            </span>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:25px;">
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 18px;">
                <div style="font-size:0.75rem;font-weight:700;color:#16a34a;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">4단계 역할</div>
                <div style="font-size:0.88rem;color:#166534;line-height:1.55;">3단계에서 선택한 데이터를 바탕으로 <strong>연구 주제와 가설</strong>을 AI와 함께 구체화합니다. 여기서 저장한 연구 주제가 5단계 전처리의 출발점이 됩니다.</div>
            </div>
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px 18px;">
                <div style="font-size:0.75rem;font-weight:700;color:#1d4ed8;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">사용 방법</div>
                <div style="font-size:0.88rem;color:#1e3a8a;line-height:1.55;">① 분석 관점(나의 아이디어)을 입력 → ② <strong>AI 프롬프트 생성</strong> 클릭 → ③ ChatGPT 등에 붙여넣어 답변 받기 → ④ 답변을 복사해 저장</div>
            </div>
            <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;padding:16px 18px;">
                <div style="font-size:0.75rem;font-weight:700;color:#7c3aed;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">${isTeacher ? '테스트 모드 안내' : '기록 저장'}</div>
                <div style="font-size:0.88rem;color:#4c1d95;line-height:1.55;">${isTeacher
                    ? '교사 테스트 모드에서는 저장 없이 프롬프트만 생성합니다. 학생 기록에 영향을 주지 않습니다.'
                    : 'AI 답변을 받은 뒤 <strong>기록 저장하기</strong>를 눌러야 5단계에서 해당 연구 주제를 선택할 수 있습니다.'}</div>
            </div>
        </div>

        <div class="glass" style="padding:25px;border-left:4px solid var(--primary);margin-bottom:25px;">
            <h4 style="color:var(--secondary);margin-bottom:15px;display:flex;align-items:center;gap:8px;">
                <i data-lucide="database" size="18"></i> 선택된 연구 데이터 (${datasets.length}건)
            </h4>
            <ul style="list-style:none;padding:0;margin-bottom:15px;">
                ${datasets.map(ds => `
                    <li style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:0.95rem;">
                        <i data-lucide="check-circle" size="14" style="color:#10b981;"></i>
                        <strong>${ds.data_name}</strong>
                        ${ds.students?.name ? `<span style="font-size:0.78rem;color:#94a3b8;">(${ds.students.name})</span>` : ''}
                    </li>`).join('')}
            </ul>
            <p style="font-size:0.85rem;color:#64748b;">위 데이터들의 샘플과 메타정보를 분석하여 AI용 프롬프트를 생성합니다.</p>
        </div>

        <div class="glass" style="padding:25px;margin-bottom:25px;border-top:2px solid var(--secondary);">
            <h4 style="color:var(--secondary);margin-bottom:15px;display:flex;align-items:center;gap:8px;">
                <i data-lucide="lightbulb" size="18"></i> 연구자의 분석 관점 및 아이디어 (선택)
            </h4>
            <textarea id="researcher-opinion-text" placeholder="예: '청소년 자살률과 정신건강 인프라의 상관관계를 중심으로 분석하고 싶음', '약국 접근성이 낮은 지역의 특징을 도출하고 싶음' 등..."
                       style="width:100%;height:100px;background:#ffffff;border:1px solid #cbd5e1;color:var(--text);padding:15px;border-radius:8px;font-size:0.95rem;line-height:1.5;box-shadow:inset 0 2px 4px rgba(0,0,0,0.05);"></textarea>
            <p style="font-size:0.8rem;color:#94a3b8;margin-top:8px;">데이터에 대한 본인의 가설이나 특히 궁금한 점을 적어주시면 AI가 이를 반영하여 주제를 제안합니다.</p>
        </div>

        <div id="prompt-generator-section" style="text-align:center;padding:30px;background:rgba(79,70,229,0.05);border-radius:12px;border:1px dashed var(--primary);">
            <button id="make-prompt-btn" class="btn-primary" style="padding:12px 30px;font-weight:600;">
                <i data-lucide="sparkles" size="18" style="vertical-align:middle;margin-right:5px;"></i> AI 분석용 프롬프트 생성하기
            </button>
            <p style="font-size:0.8rem;color:#64748b;margin-top:10px;">* 실시간 데이터 샘플링을 진행하므로 약 2~3초가 소요될 수 있습니다.</p>
        </div>

        <div id="ai-prompt-result" style="display:none;margin-top:25px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <h4 style="margin:0;">✨ 생성된 연구 가이드 프롬프트</h4>
                <div style="display:flex;gap:8px;">
                    ${!isTeacher ? `<button id="save-step1-btn" class="btn-primary" style="font-size:0.75rem;padding:5px 12px;background:#059669;border-color:#059669;">기록 저장하기</button>` : ''}
                    <button id="copy-prompt-btn" class="btn-secondary" style="font-size:0.75rem;padding:5px 12px;">클립보드 복사</button>
                </div>
            </div>
            <textarea id="ai-prompt-text" readonly style="width:100%;height:280px;background:#0f172a;color:#f8fafc;border:1px solid var(--glass-border);border-radius:8px;padding:18px;font-family:'Consolas',monospace;font-size:0.9rem;line-height:1.6;font-weight:500;"></textarea>
            <p style="font-size:0.8rem;color:var(--primary);margin-top:10px;">
                <i data-lucide="info" size="14" style="vertical-align:middle;"></i> 생성된 내용을 복사하여 ChatGPT나 Claude 등 생성형 AI에게 질문해 보세요.
            </p>
        </div>

        ${isTeacher ? `
        <div id="teacher-answer-section" style="display:none;margin-top:25px;padding:25px;background:#f0fdf4;border:2px solid #86efac;border-radius:12px;">
            <h4 style="color:#15803d;margin-bottom:10px;display:flex;align-items:center;gap:8px;">
                <i data-lucide="message-square-plus" size="18"></i> AI 답변 입력 및 교사 테스트 저장
            </h4>
            <p style="font-size:0.88rem;color:#166534;margin-bottom:15px;line-height:1.6;">
                위 프롬프트를 ChatGPT 등에 붙여넣어 답변을 받은 후, 아래에 붙여넣어 주세요.<br>
                <strong>저장하면 5단계 교사 테스트</strong>에서 이 내용을 바탕으로 전처리 프롬프트를 생성할 수 있습니다.
            </p>
            <textarea id="teacher-answer-input" placeholder="ChatGPT 등의 AI가 답변한 연구 주제·가설 제안 내용을 여기에 붙여넣으세요..."
                style="width:100%;height:220px;background:#ffffff;border:1px solid #86efac;border-radius:8px;padding:15px;font-size:0.92rem;line-height:1.6;color:var(--text);"></textarea>
            <div style="text-align:right;margin-top:12px;">
                <button id="save-teacher-test-btn" class="btn-primary" style="background:#15803d;border-color:#15803d;padding:10px 24px;font-weight:600;">
                    <i data-lucide="save" size="16" style="vertical-align:middle;margin-right:6px;"></i> 교사 테스트 저장 (5단계에서 사용)
                </button>
            </div>
        </div>` : ''}
    `;

    if (window.lucide) lucide.createIcons();

    canvasInner.querySelector('#make-prompt-btn').onclick = async () => {
        const makeBtn = canvasInner.querySelector('#make-prompt-btn');
        const opinion = canvasInner.querySelector('#researcher-opinion-text')?.value || '';
        const origHtml = makeBtn.innerHTML;
        makeBtn.disabled = true;
        makeBtn.innerHTML = '<i class="spinner-sm"></i> 프롬프트 생성 중...';

        try {
            const prompt = await generateProblemDefinitionPrompt(datasets, opinion);
            canvasInner.querySelector('#prompt-generator-section').style.display = 'none';
            const resultArea = canvasInner.querySelector('#ai-prompt-result');
            resultArea.style.display = 'block';
            canvasInner.querySelector('#ai-prompt-text').value = prompt;
            if (window.lucide) lucide.createIcons();
            // 교사 테스트 모드: AI 답변 입력 섹션 표시
            if (isTeacher) {
                const answerSection = canvasInner.querySelector('#teacher-answer-section');
                if (answerSection) answerSection.style.display = 'block';
                // 이전 답변이 있으면 불러오기
                const { getTeacherTestLog } = await import('./auth.js');
                const existing = getTeacherTestLog();
                if (existing) {
                    try {
                        const ex = JSON.parse(existing.content);
                        const answerInput = canvasInner.querySelector('#teacher-answer-input');
                        if (answerInput && ex.aiAnswer) answerInput.value = ex.aiAnswer;
                    } catch(e) {}
                }
            }
        } catch (err) {
            alert('프롬프트 생성 중 오류가 발생했습니다: ' + err.message);
        } finally {
            makeBtn.disabled = false;
            makeBtn.innerHTML = origHtml;
        }
    };

    canvasInner.querySelector('#copy-prompt-btn').onclick = () => {
        const text = canvasInner.querySelector('#ai-prompt-text')?.value || '';
        navigator.clipboard.writeText(text).then(() => {
            const btn = canvasInner.querySelector('#copy-prompt-btn');
            const orig = btn.innerText;
            btn.innerText = '복사 완료!';
            setTimeout(() => btn.innerText = orig, 2000);
        });
    };

    const saveBtn = canvasInner.querySelector('#save-step1-btn');
    if (saveBtn && saveRecordFn) {
        saveBtn.onclick = async () => {
            const prompt = canvasInner.querySelector('#ai-prompt-text')?.value || '';
            const opinion = canvasInner.querySelector('#researcher-opinion-text')?.value || '';
            if (!prompt) return alert('생성된 프롬프트가 없습니다.');
            const origHtml = saveBtn.innerHTML;
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="spinner-sm"></i> 저장 중...';
            try {
                await saveRecordFn({ answer: prompt, opinion });
            } catch (err) {
                alert('저장 중 오류가 발생했습니다: ' + err.message);
            } finally {
                saveBtn.disabled = false;
                saveBtn.innerHTML = origHtml;
            }
        };
    }

    if (isTeacher) {
        const teacherSaveBtn = canvasInner.querySelector('#save-teacher-test-btn');
        if (teacherSaveBtn) {
            teacherSaveBtn.onclick = async () => {
                const prompt = canvasInner.querySelector('#ai-prompt-text')?.value || '';
                const opinion = canvasInner.querySelector('#researcher-opinion-text')?.value || '';
                const aiAnswer = canvasInner.querySelector('#teacher-answer-input')?.value?.trim() || '';
                if (!aiAnswer) {
                    alert('AI 답변을 입력해 주세요. ChatGPT 등에서 받은 답변을 붙여넣은 후 저장하세요.');
                    return;
                }
                const origHtml = teacherSaveBtn.innerHTML;
                teacherSaveBtn.disabled = true;
                teacherSaveBtn.innerHTML = '<i class="spinner-sm"></i> 저장 중...';
                try {
                    const { setTeacherTestLog } = await import('./auth.js');
                    await setTeacherTestLog({
                        id: 'teacher-test',
                        content: JSON.stringify({ answer: aiAnswer, opinion, prompt }),
                        created_at: new Date().toISOString(),
                    });
                    teacherSaveBtn.innerHTML = '<i data-lucide="check" size="16" style="vertical-align:middle;margin-right:6px;"></i> 저장 완료! (5단계에서 사용 가능)';
                    teacherSaveBtn.style.background = '#059669';
                    teacherSaveBtn.style.borderColor = '#059669';
                    if (window.lucide) lucide.createIcons();
                } catch (err) {
                    alert('저장 중 오류가 발생했습니다: ' + err.message);
                    teacherSaveBtn.disabled = false;
                    teacherSaveBtn.innerHTML = origHtml;
                }
            };
        }
    }
}

export function renderTeacherProblemDefinitions(logs, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!logs || logs.length === 0) {
        container.innerHTML = '<div class="text-muted" style="text-align:center; padding: 40px;">아직 작성된 4단계 기록이 없습니다.</div>';
        return;
    }

    const byStudent = {};
    logs.forEach(log => {
        const key = log.student_id;
        if (!byStudent[key]) byStudent[key] = { name: log.student_name, logs: [] };
        byStudent[key].logs.push(log);
    });
    const totalStudents = Object.keys(byStudent).length;

    container.innerHTML = `
        <div style="margin-bottom:18px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
            <span style="font-size:0.88rem;color:#64748b;">전체 <strong style="color:var(--secondary);">${logs.length}건</strong> / <strong style="color:var(--secondary);">${totalStudents}명</strong> 제출</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 16px;">
            ${logs.map(log => {
                let data = { answer: '', opinion: '' };
                try { data = JSON.parse(log.content); } catch (e) { data.answer = log.content; }
                const preview = (data.answer || '').replace(/#{1,3}\s?|<br>|---|\*\*/g, '').slice(0, 120);

                return `
                <div class="glass card clickable-card step1-log-card" data-id="${log.id}"
                     style="padding: 20px; transition: all 0.2s; cursor: pointer; border-left: 4px solid #f59e0b;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                        <span style="background:#fef3c7;color:#92400e;font-size:0.78rem;font-weight:700;border-radius:6px;padding:3px 10px;">
                            ${log.student_name}
                        </span>
                        <span style="font-size:0.75rem;color:#94a3b8;">
                            ${new Date(log.created_at).toLocaleDateString('ko-KR', {month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}
                        </span>
                    </div>

                    <div style="margin-bottom:10px;">
                        <div style="font-size:0.75rem;font-weight:700;color:#0369a1;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.04em;">분석 관점</div>
                        <p style="font-size:0.9rem;line-height:1.5;color:var(--text);margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                            ${data.opinion || '<span style="color:#94a3b8;">작성된 관점 없음</span>'}
                        </p>
                    </div>

                    <div style="margin-bottom:12px;">
                        <div style="font-size:0.75rem;font-weight:700;color:#7c3aed;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.04em;">생성된 프롬프트 미리보기</div>
                        <p style="font-size:0.82rem;color:#64748b;margin:0;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                            ${preview}…
                        </p>
                    </div>

                    <div style="text-align:right;">
                        <button class="btn-primary" style="font-size:0.78rem;padding:5px 14px;">전체 보기</button>
                    </div>
                </div>`;
            }).join('')}
        </div>
    `;

    container.querySelectorAll('.step1-log-card').forEach(card => {
        card.onclick = () => {
            const log = logs.find(l => String(l.id) === card.dataset.id);
            if (log) showProblemDefinitionDetailModal(log);
        };
    });
}

export function showProblemDefinitionDetailModal(log) {
    const modal = document.getElementById('step1-detail-modal');
    const studentEl = document.getElementById('step1-modal-student');
    const titleEl = document.getElementById('step1-modal-title');
    const bodyEl = document.getElementById('step1-modal-body');
    const closeBtn = document.getElementById('close-step1-modal');

    studentEl.innerText = `${log.student_name} 학생 | ${new Date(log.created_at).toLocaleString()}`;
    
    let data = { answer: '', opinion: '' };
    try {
        data = JSON.parse(log.content);
    } catch (e) {
        data.answer = log.content;
    }

    titleEl.innerText = data.opinion || '연구 주제 상세 보기';

    bodyEl.innerHTML = `
        <div style="margin-bottom: 24px;">
            <div style="font-size:0.75rem;font-weight:700;color:#0369a1;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;">
                💬 학생의 분석 관점 및 아이디어
            </div>
            <div style="background:#f0f9ff;padding:18px 20px;border-radius:10px;border:1px solid #bae6fd;font-size:0.95rem;line-height:1.7;color:#0c4a6e;font-weight:500;">
                ${data.opinion || '<span style="color:#94a3b8;">작성된 관점이 없습니다.</span>'}
            </div>
        </div>

        <div style="border-top:1px dashed #cbd5e1;padding-top:24px;">
            <div style="font-size:0.75rem;font-weight:700;color:#7c3aed;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;">
                ✨ 생성된 AI 연구 가이드 프롬프트
            </div>
            <div style="background:#0f172a;color:#f8fafc;padding:20px;border-radius:10px;font-family:'Consolas',monospace;font-size:0.88rem;line-height:1.7;white-space:pre-wrap;max-height:480px;overflow-y:auto;">
                ${(data.answer || '').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
            </div>
            <div style="margin-top:10px;text-align:right;">
                <button id="copy-step1-prompt-btn" class="btn-secondary" style="font-size:0.8rem;padding:6px 14px;">📋 프롬프트 복사</button>
            </div>
        </div>
    `;

    const copyBtn = bodyEl.querySelector('#copy-step1-prompt-btn');
    if (copyBtn) {
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(data.answer || '').then(() => {
                copyBtn.textContent = '✅ 복사 완료!';
                setTimeout(() => { copyBtn.textContent = '📋 프롬프트 복사'; }, 2000);
            });
        };
    }

    if (window.lucide) lucide.createIcons();
    modal.style.display = 'flex';

    closeBtn.onclick = () => modal.style.display = 'none';
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
}
