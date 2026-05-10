export async function renderResearchJournalStep4(containerId, state, options = {}) {
    const root = document.getElementById(containerId);
    if (!root) return;

    const isReadOnly = options.readOnly || false;
    const targetId = options.targetStudentId || state.user?.student_id;

    // 질문 목록 구성
    const questions = [
        { 
            id: 'step4_q1', 
            label: '1. 활용한 공공 데이터 목록은?', 
            isList: true, 
            cols: [
                { key: 'agency', label: '제공기관', placeholder: '예: 통계청', width: '1fr' },
                { key: 'name', label: '데이터명', placeholder: '예: 인구동향조사', width: '1.5fr' },
                { key: 'url', label: 'URL', placeholder: 'http://...', width: '2fr' }
            ]
        },
        { id: 'step4_q2', label: '2. 설정한 가설은?', placeholder: '데이터를 통해 증명하고자 하는 핵심 가설을 적어보세요.' },
        { 
            id: 'step4_q3', 
            label: '3. 가설과 관련한 기존 연구 결과(논문, 보고서)나 보도 자료의 검색 결과는?', 
            isList: true,
            cols: [
                { key: 'category', label: '구분', placeholder: '예: 보도자료/기사, 논문', width: '0.8fr' },
                { key: 'title', label: '자료명', placeholder: '예: 교육부 외국인 유학생...', width: '1.5fr' },
                { key: 'url', label: '출처 및 수집 URL', placeholder: 'http://...', width: '2.2fr' }
            ]
        },
        { id: 'step4_q4', label: '4. 가설에 대한 분석 결과는?', placeholder: '데이터 분석(그래프, 평균 비교 등)을 통해 알게 된 사실을 적어보세요.' },
        { id: 'step4_q5', label: '5. 통계적으로 가설에 대한 검증 결과는?', placeholder: 'T-검정, 상관분석 등을 통해 얻은 통계적 결론을 적어보세요.' },
        { 
            id: 'step4_q6', 
            label: '6. 사용한 AI 도구는?', 
            isList: true,
            cols: [
                { key: 'stage', label: '활용 단계', placeholder: '예: 기획안 고도화', width: '1fr' },
                { key: 'tool', label: '활용 AI 도구명', placeholder: '예: ChatGPT', width: '1fr' },
                { key: 'input', label: '주요 입력값(프롬프트)', placeholder: '예: OO데이터 분석 대안 제시', width: '1.8fr' },
                { key: 'result', label: '산출 결과물 설명 및 역할', placeholder: '예: 서비스 시나리오 도출', width: '1.8fr' }
            ]
        },
        { 
            id: 'step4_q7', 
            label: '7. 저작권이 있는 외부 이미지 사용 출처는?', 
            isList: true,
            cols: [
                { key: 'location', label: '사용 위치', placeholder: '예: 5page 하단', width: '1fr' },
                { key: 'desc', label: '이미지/자료 설명', placeholder: '예: 통학로 안전 지도', width: '1.5fr' },
                { key: 'source', label: '출처(사이트명 및 저작권자)', placeholder: '예: 공공데이터포털', width: '2fr' },
                { key: 'note', label: '비고', placeholder: '예: 출처 명기 완료', width: '1fr' }
            ]
        },
        {
            id: 'step4_q8',
            label: '8. 연구 기록 (누가 기록)',
            isList: true,
            cols: [
                { key: 'date', label: '일자', placeholder: '예: 2024-05-10', width: '1fr' },
                { key: 'content', label: '연구 활동 내용', placeholder: '예: 가설 설정 및 관련 선행 연구 분석 수행', width: '4.5fr' }
            ]
        }
    ];

    root.innerHTML = `
        <style>
            .journal-grid-row { display: grid; align-items: center; width: 100%; box-sizing: border-box; }
            .journal-col-header { color: #94a3b8; font-weight: 700; font-size: 0.8rem; text-align: center; padding: 0 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .col-input::placeholder { color: #cbd5e1; opacity: 0.7; }
            .team-share-badge { display: none; align-items: center; gap: 4px; padding: 4px 10px; background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
        </style>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <h2 style="margin:0; font-size:1.3rem;">📝 4단계: 연구 일지 작성 ${isReadOnly ? '(조회 모드)' : ''}</h2>
                    <div id="team-share-badge" class="team-share-badge">
                        <i data-lucide="users" size="12"></i> <span id="team-name-label">팀 공유 중</span>
                    </div>
                </div>
                <p class="text-muted" style="margin:2px 0 0; font-size:0.85rem;">실제 분석 결과와 연구 내용을 기록하세요. ${!isReadOnly ? '<span id="auto-save-status-step4" style="margin-left:8px; color:var(--primary); font-weight:600; opacity:0.6;">(자동 저장)</span>' : ''}</p>
            </div>
            <div id="save-indicator-step4" style="font-size:0.8rem; color:#94a3b8; display:flex; align-items:center; gap:5px;">
                <i data-lucide="${isReadOnly ? 'eye' : 'cloud-check'}" size="14"></i>
                <span id="last-saved-time-step4">불러오는 중...</span>
            </div>
        </div>

        <div id="worksheet-container-step4" style="display:grid; grid-template-columns: 1fr; gap:10px; width: 98%; margin: 0 auto;">
            ${questions.map(q => `
                <div class="glass" style="padding:12px 18px; border-radius:10px; border-left:3px solid #e2e8f0;">
                    <label style="display:block; font-weight:700; color:var(--secondary); font-size:0.9rem; margin-bottom:10px;">${q.label}</label>
                    
                    ${q.isList ? `
                        <div id="list-container-${q.id}" style="width: 100%;">
                            <div class="journal-grid-row" style="grid-template-columns: ${q.cols.map(c => c.width).join(' ')}${isReadOnly ? '' : ' 35px'}; gap:10px; margin-bottom:5px;">
                                ${q.cols.map(c => `<div class="journal-col-header">${c.label}</div>`).join('')}
                                ${isReadOnly ? '' : '<div></div>'}
                            </div>
                            <div id="rows-for-${q.id}" style="width: 100%;"></div>
                            ${!isReadOnly ? `
                            <button class="add-row-btn" data-qid="${q.id}" style="margin-top:8px; padding:8px; border:1px dashed #cbd5e1; background:transparent; border-radius:8px; color:#64748b; font-size:0.85rem; cursor:pointer; width:100%; transition:all 0.2s;">
                                <i data-lucide="plus" size="14" style="vertical-align:middle; margin-right:4px;"></i> 항목 추가
                            </button>
                            ` : ''}
                        </div>
                    ` : `
                        <textarea id="${q.id}" class="journal-input-step4" placeholder="${q.placeholder}" 
                            ${isReadOnly ? 'readonly' : ''}
                            style="width:100%; min-height:50px; background:transparent; border:1px solid #f1f5f9; border-radius:8px; padding:10px; font-size:0.88rem; line-height:1.5; resize:vertical; outline:none;"></textarea>
                    `}
                </div>
            `).join('')}
        </div>
    `;

    if (window.lucide) lucide.createIcons();

    const addRow = (qid, data = {}, placeholderData = null) => {
        const q = questions.find(item => item.id === qid);
        const container = document.getElementById(`rows-for-${qid}`);
        if (!container) return;

        if (qid === 'step4_q8' && Object.keys(data).length === 0) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            data.date = `${year}-${month}-${day}`;
        }

        const row = document.createElement('div');
        row.className = `journal-grid-row row-item-${qid}`;
        row.style.gridTemplateColumns = `${q.cols.map(c => c.width).join(' ')}${isReadOnly ? '' : ' 35px'}`;
        row.style.gap = '10px';
        row.style.marginBottom = '6px';
        
        row.innerHTML = q.cols.map(c => {
            const pText = (placeholderData && placeholderData[c.key]) ? `예: ${placeholderData[c.key]}` : c.placeholder;
            return `
                <input class="col-input" data-key="${c.key}" value="${data[c.key] || ''}" placeholder="${pText}" 
                       ${isReadOnly ? 'readonly' : ''}
                       style="width:100%; box-sizing:border-box; padding:6px 10px; border:1px solid #e2e8f0; border-radius:8px; font-size:0.82rem; outline:none; ${isReadOnly ? 'background:#f8fafc;' : ''}">
            `;
        }).join('') + (isReadOnly ? '' : `
            <button class="remove-btn" style="width:35px; height:32px; background:#fff1f2; border:1px solid #fecaca; color:#dc2626; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; box-sizing:border-box;">
                <i data-lucide="trash-2" size="14"></i>
            </button>
        `);
        
        container.appendChild(row);
        if (window.lucide) lucide.createIcons();

        if (!isReadOnly) {
            row.querySelectorAll('input').forEach(input => input.addEventListener('input', triggerAutoSave));
            const removeBtn = row.querySelector('.remove-btn');
            if (removeBtn) {
                removeBtn.onclick = () => {
                    if (confirm('삭제하시겠습니까?')) { row.remove(); triggerAutoSave(); }
                };
            }
        }
    };

    const triggerAutoSave = () => {
        if (isReadOnly) return;
        const statusEl = document.getElementById('auto-save-status-step4');
        if (statusEl) { statusEl.innerText = '(저장 중...)'; statusEl.style.opacity = '1'; }

        if (autoSaveTimer) clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(async () => {
            const journalData = {};
            questions.forEach(q => {
                if (q.isList) {
                    const list = [];
                    document.querySelectorAll(`.row-item-${q.id}`).forEach(row => {
                        const rowData = {};
                        row.querySelectorAll('input').forEach(input => { rowData[input.dataset.key] = input.value; });
                        if (Object.values(rowData).some(v => v.trim() !== '')) list.push(rowData);
                    });
                    journalData[q.id] = list;
                } else {
                    journalData[q.id] = document.getElementById(q.id).value;
                }
            });

            try {
                await state.onSaveRecord(3, JSON.stringify(journalData));
                document.getElementById('last-saved-time-step4').innerText = `저장됨 (${new Date().toLocaleTimeString()})`;
                if (statusEl) { statusEl.innerText = '(자동 저장됨)'; statusEl.style.opacity = '0.4'; }
            } catch (err) { if (statusEl) statusEl.innerText = '(저장 실패!)'; }
        }, 2000); 
    };

    document.querySelectorAll('.add-row-btn').forEach(btn => {
        btn.onclick = () => { addRow(btn.dataset.qid); triggerAutoSave(); };
    });

    const loadJournalData = async () => {
        try {
            const { fetchLatestTeamJournal } = await import('./auth.js');
            const { data: logs, isTeam, teamName } = await fetchLatestTeamJournal(targetId, 3);
            
            // 팀 공유 정보 표시
            if (isTeam) {
                const badge = document.getElementById('team-share-badge');
                const label = document.getElementById('team-name-label');
                if (badge && label) {
                    badge.style.display = 'flex';
                    label.innerText = `${teamName} 팀 공동 작업 중`;
                }
            }

            if (logs && logs.length > 0) {
                const savedData = JSON.parse(logs[0].content || '{}');
                questions.forEach(q => {
                    if (q.isList) {
                        const rows = savedData[q.id];
                        const hasRealContent = Array.isArray(rows) && rows.length > 0 && rows.some(r => Object.values(r).some(v => v && v.trim() !== ''));
                        
                        if (hasRealContent) {
                            rows.forEach(r => addRow(q.id, r));
                        } else {
                            if (!isReadOnly) {
                                if (q.id === 'step4_q6') {
                                    addRow('step4_q6', {}, { stage: '기획안 고도화', tool: 'Chat GPT', input: 'OO데이터를 분석해서 교육적 대안 3가지 제시', result: '아이디어 논리 보완 및 서비스 시나리오 도출' });
                                } else if (q.id === 'step4_q7') {
                                    addRow('step4_q7', {}, { location: '5page 하단', desc: '통학로 안전 지도 이미지', source: '공공데이터포털(경찰청 제공)', note: '출처 명기 완료' });
                                } else { addRow(q.id); }
                            }
                        }
                    } else {
                        const el = document.getElementById(q.id);
                        if (el && savedData[q.id]) el.value = savedData[q.id];
                    }
                });
                const lastUpdater = isTeam ? ` (${logs[0].student_id} 수정)` : '';
                document.getElementById('last-saved-time-step4').innerText = `${isReadOnly ? '데이터 로드됨' : '마지막 저장'}: ${new Date(logs[0].updated_at || logs[0].created_at).toLocaleTimeString()}${lastUpdater}`;
            } else {
                if (!isReadOnly) {
                    addRow('step4_q1');
                    addRow('step4_q3');
                    addRow('step4_q6', {}, { stage: '기획안 고도화', tool: 'Chat GPT', input: 'OO데이터를 분석해서 교육적 대안 3가지 제시', result: '아이디어 논리 보완 및 서비스 시나리오 도출' });
                    addRow('step4_q7', {}, { location: '5page 하단', desc: '통학로 안전 지도 이미지', source: '공공데이터포털(경찰청 제공)', note: '출처 명기 완료' });
                    addRow('step4_q8');
                }
                document.getElementById('last-saved-time-step4').innerText = '저장된 내용 없음';
            }
        } catch (err) { console.error('Load fail:', err); }
    };

    if (!isReadOnly) {
        document.querySelectorAll('.journal-input-step4').forEach(input => {
            input.addEventListener('input', triggerAutoSave);
        });
    }

    if (targetId) await loadJournalData();
}
