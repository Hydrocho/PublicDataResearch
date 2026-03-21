import { supabaseClient } from './config.js';
import { fetchStudentDatasets, deleteStudentDataset, toggleDatasetShare, fetchSharedDatasets, updateDatasetName, toggleResearchUse } from './auth.js';

export async function onLoadDatasets(state, changeStep) {
    if (!state.user || state.user.student_id === 'Guest') {
        const container = document.getElementById('datasets-list-container');
        if (container) container.innerHTML = '<p class="text-muted">게스트 모드에서는 불러올 데이터가 없습니다.</p>';
        return;
    }

    // Fetch both own datasets and shared datasets
    const [ownRes, sharedRes] = await Promise.all([
        fetchStudentDatasets(state.user.student_id),
        fetchSharedDatasets(state.user.student_id)
    ]);
    
    const container = document.getElementById('datasets-list-container');
    if (!container) return;

    if (ownRes.error) {
        container.innerHTML = `<p class="text-muted">데이터를 불러오는 중 오류가 발생했습니다: ${ownRes.error.message}</p>`;
        return;
    }

    const ownData = ownRes.data || [];
    const sharedData = sharedRes.data || [];

    let html = `
        <div class="management-section">
            <h3 style="font-size: 1.1rem; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="user" size="20"></i> 내 데이터 자료실
            </h3>
            ${ownData.length === 0 ? '<p class="text-muted">아직 수집한 데이터가 없습니다.</p>' : `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                    <tr style="text-align: left; border-bottom: 2px solid var(--glass-border);">
                        <th style="padding: 12px; font-size: 0.85rem;">데이터셋 이름</th>
                        <th style="padding: 12px; font-size: 0.85rem; text-align: center;">행 수</th>
                        <th style="padding: 12px; font-size: 0.85rem; text-align: center;">연구 활용</th>
                        <th style="padding: 12px; font-size: 0.85rem; text-align: center;">공유</th>
                        <th style="padding: 12px; font-size: 0.85rem; text-align: right;">관리</th>
                    </tr>
                </thead>
                <tbody>
                    ${ownData.map(ds => {
                        const meta = ds.metadata || {};
                        const rowCount = meta.row_count;
                        const sizeKb = meta.size_kb || ds.size_kb;
                        const rowStr = rowCount != null ? `${Number(rowCount).toLocaleString()}행` : '-';
                        const sizeStr = sizeKb ? (sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB (${Number(sizeKb).toLocaleString()} KB)` : `${Number(sizeKb).toLocaleString()} KB`) : '';
                        return `
                        <tr class="clickable-row" data-id="${ds.id}" style="border-bottom: 1px solid var(--glass-border);">
                            <td style="padding: 12px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <i data-lucide="file-spreadsheet" size="18" style="color: var(--primary);"></i>
                                    <div>
                                        <strong>${ds.data_name}</strong>
                                        ${sizeStr ? `<div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">${sizeStr}</div>` : ''}
                                    </div>
                                    <button class="edit-name-btn" data-id="${ds.id}" title="이름 수정" style="background: none; border: none; cursor: pointer; color: #64748b; padding: 4px; display: flex; align-items: center;">
                                        <i data-lucide="pencil" size="14"></i>
                                    </button>
                                </div>
                            </td>
                            <td style="padding: 12px; text-align: center; font-size: 0.9rem; font-weight: 600; color: ${rowCount != null ? 'var(--primary)' : '#94a3b8'};">${rowStr}</td>
                            <td style="padding: 12px; text-align: center;">
                                <input type="checkbox" class="research-use-check" data-id="${ds.id}" data-owner="true" ${ds.is_research_use ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                            </td>
                            <td style="padding: 12px; text-align: center;">
                                <label class="switch">
                                    <input type="checkbox" class="share-toggle" data-id="${ds.id}" ${ds.is_shared ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </td>
                            <td style="padding: 12px; text-align: right; display: flex; gap: 5px; justify-content: flex-end;">
                                <button class="btn-secondary delete-ds-btn" data-id="${ds.id}" style="font-size: 0.75rem; padding: 5px 10px; color: var(--accent);">삭제</button>
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            `}
        </div>

        <div class="management-section" style="margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1;">
            <h3 style="font-size: 1.1rem; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; color: var(--primary);">
                <i data-lucide="users" size="20"></i> 친구들의 공유 자료실
            </h3>
            <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 15px;">다른 친구들이 공유한 자료를 내 연구에 활용할 수 있습니다.</p>
            ${sharedData.length === 0 ? '<p class="text-muted" style="padding: 20px; background: #f8fafc; border-radius: 8px; text-align: center;">현재 공유된 친구들의 자료가 없습니다.</p>' : `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="text-align: left; border-bottom: 2px solid var(--glass-border);">
                        <th style="padding: 12px; font-size: 0.85rem;">데이터셋 이름</th>
                        <th style="padding: 12px; font-size: 0.85rem;">공유자(학번)</th>
                        <th style="padding: 12px; font-size: 0.85rem; text-align: center;">연구 활용</th>
                    </tr>
                </thead>
                <tbody>
                    ${sharedData.map(ds => `
                        <tr class="clickable-row shared-row" data-id="${ds.id}" style="border-bottom: 1px solid var(--glass-border); background: #f8fafc;">
                            <td style="padding: 12px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <i data-lucide="share-2" size="18" style="color: #6366f1;"></i>
                                    <strong>${ds.data_name}</strong>
                                </div>
                            </td>
                            <td style="padding: 12px; font-size: 0.85rem; color: #4338ca; font-weight: 600;">${ds.student_id}</td>
                            <td style="padding: 12px; text-align: center;">
                                <input type="checkbox" class="research-use-check" data-id="${ds.id}" data-owner="false" ${ds.is_research_use ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            `}
        </div>
    `;

    container.innerHTML = html;
    lucide.createIcons();

    // Row Click Listener (for details)
    container.querySelectorAll('.clickable-row').forEach(row => {
        row.addEventListener('click', (e) => {
            if (e.target.closest('button') || e.target.closest('.switch') || e.target.closest('input[type="checkbox"]')) return; 
            const ds = [...ownData, ...sharedData].find(d => String(d.id) === row.dataset.id);
            if (ds) openDatasetModal(ds);
        });
    });

    // Research Use Check Listener
    container.querySelectorAll('.research-use-check').forEach(chk => {
        chk.addEventListener('change', async () => {
            const id = chk.dataset.id;
            const isUse = chk.checked;
            const isOwner = chk.dataset.owner === 'true';
            
            chk.disabled = true;
            const { error } = await toggleResearchUse(id, isUse, state.user.student_id, isOwner);
            if (error) {
                alert('연구 활용 상태 저장 실패: ' + error.message);
                chk.checked = !isUse;
            }
            chk.disabled = false;
        });
    });

    // Edit Name Listener
    container.querySelectorAll('.edit-name-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const ds = ownData.find(d => String(d.id) === id);
            const currentName = ds ? ds.data_name : '';
            const newName = prompt('수정할 데이터셋 이름을 입력하세요:', currentName);
            
            if (newName && newName.trim() !== '' && newName !== currentName) {
                const { error } = await updateDatasetName(id, newName.trim(), state.user.student_id);
                if (!error) {
                    onLoadDatasets(state, changeStep);
                } else {
                    alert('이름 수정 실패: ' + error.message);
                }
            }
        });
    });

    // Share Toggle Listener
    container.querySelectorAll('.share-toggle').forEach(chk => {
        chk.addEventListener('change', async () => {
            const id = chk.dataset.id;
            const isShared = chk.checked;
            
            chk.disabled = true; // prevent double-clicks
            const { error } = await toggleDatasetShare(id, isShared, state.user.student_id);
            
            if (error) {
                alert('공유 상태 변경 실패: ' + error.message);
                chk.checked = !isShared; // revert
                chk.disabled = false;
            } else {
                console.log('Toggle success for ID:', id, 'New status:', isShared);
                chk.disabled = false;
            }
        });
    });

    // Action Listeners (Select/Research)
    container.querySelectorAll('.select-ds-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const allDatasets = [...ownData, ...sharedData];
            const ds = allDatasets.find(d => String(d.id) === btn.dataset.id);
            if (ds) {
                const prefix = btn.dataset.source === 'shared' ? '[친구공유]' : '[관리]';
                state.selectedTopic = { cat: { title: '관리데이터', id: 'managed' }, dataInfo: { 
                    name: ds.data_name, 
                    url: ds.metadata?.url || '#',
                    file_url: ds.file_url 
                } };
                document.getElementById('selected-topic-box').style.display = 'block';
                document.getElementById('current-topic-text').innerText = `${prefix} ${ds.data_name}`;
                changeStep(2); 
            }
        });
    });

    // Delete Listener (Only for own data)
    container.querySelectorAll('.delete-ds-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!confirm('정말로 이 데이터셋을 삭제하시겠습니까?')) return;
            const targetId = btn.dataset.id;
            const { error } = await deleteStudentDataset(targetId, state.user.student_id);
            if (!error) onLoadDatasets(state, changeStep);
            else alert('삭제 실패: ' + error.message);
        });
    });
}

async function openDatasetModal(dataset) {
    const modal = document.getElementById('dataset-modal');
    const nameEl = document.getElementById('modal-data-name');
    const bodyInner = document.getElementById('modal-body-inner');
    const closeBtn = document.getElementById('close-modal');

    nameEl.innerText = dataset.data_name;
    
    // Core Meta Mapping
    const rawMeta = dataset.metadata || {};
    const getVal = (path, obj = rawMeta) => {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    // Pairs for 2x2 grid (Label-Value-Label-Value)
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
    const format = getVal('encodingFormat') || dataset.data_name.split('.').pop().toUpperCase();
    const sizeVal = Number(dataset.size_kb);
    const size = sizeVal ? (sizeVal >= 1024 ? `${(sizeVal / 1024).toFixed(1)} MB (${sizeVal.toLocaleString()} KB)` : `${sizeVal.toLocaleString()} KB`) : '-';

    bodyInner.innerHTML = `
        <table class="portal-meta-table">
            <tbody>
                <!-- 데이터명 (전체 너비) -->
                <tr>
                    <th class="portal-label">데이터명</th>
                    <td class="portal-value" colspan="3" style="font-weight: 800; color: var(--primary); font-size: 1.1rem;">
                        ${dataset.data_name}
                    </td>
                </tr>
                
                <!-- 기본 메타 정보 (2열 쌍) -->
                ${metaPairs.map(pair => `
                    <tr>
                        <th class="portal-label">${pair[0].label}</th>
                        <td class="portal-value">${pair[0].value}</td>
                        <th class="portal-label">${pair[1].label}</th>
                        <td class="portal-value">${pair[1].value}</td>
                    </tr>
                `).join('')}

                <!-- 확장자 및 크기 -->
                <tr>
                    <th class="portal-label">확장자</th>
                    <td class="portal-value">${format}</td>
                    <th class="portal-label">파일 크기</th>
                    <td class="portal-value">${size}</td>
                </tr>

                <!-- 데이터 설명 (전체 너비) -->
                <tr>
                    <th class="portal-label">데이터 설명</th>
                    <td class="portal-value portal-value-full" colspan="3">
                        ${desc || '설명이 표시되지 않았습니다.'}
                    </td>
                </tr>

                <!-- 키워드 (전체 너비) -->
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

                <!-- 원본 출처 -->
                <tr>
                    <th class="portal-label">원본 출처</th>
                    <td class="portal-value" colspan="3">
                        ${(getVal('url') || '#') !== '#' ? `<a href="${getVal('url')}" target="_blank" style="color: var(--primary); font-weight: bold;">[바로가기]</a>` : '-'}
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- 데이터 미리보기 -->
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

    modal.style.display = 'flex';
    
    // Preview Loading Logic
    const previewEl = document.getElementById('modal-data-preview');
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

    // Close logic
    closeBtn.onclick = () => modal.style.display = 'none';
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
}

/**
 * Fetches and parses CSV or Excel data
 */
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
            // Handle Excel via SheetJS
            const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            // Convert to JSON (array of objects)
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
            
            if (jsonData.length > 0) {
                const fields = jsonData[0]; // Header row
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
            // Handle CSV via PapaParse
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
                    skipEmptyLines: true,
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

/**
 * Renders the parsed data into a stylish table
 */
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

