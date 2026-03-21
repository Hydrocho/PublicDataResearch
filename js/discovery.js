import { categories } from './data.js';

export function showCategoryDetails(catId, state, onDataSelected) {
    const cat = categories.find(c => c.id === catId);
    const details = document.getElementById('category-details');
    details.style.display = 'block';
    details.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3>🔍 ${cat.title} 데이터 탐색 키워드</h3>
            <button id="close-details" class="btn-secondary">닫기</button>
        </div>
        
        <div style="margin-bottom: 30px;">
            <p class="text-muted" style="margin-bottom: 15px;">아래 키워드를 클릭하면 공공데이터포털 검색 결과로 연결됩니다.</p>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                ${cat.keywords.map(kw => `
                    <button class="glass keyword-btn" data-kw="${kw}" style="padding: 10px 15px; border-radius: 20px; font-size: 0.9rem; border: 1px solid var(--primary-glow);">
                        # ${kw}
                    </button>
                `).join('')}
            </div>
        </div>

          <div class="glass" style="padding: 25px; border-top: 2px solid var(--primary);">
            <h4 style="margin-bottom: 20px;">📥 발견한 데이터 정보 저장 및 연동</h4>
            <div style="display: grid; gap: 20px;">
                <div class="glass" style="padding: 15px; background: rgba(0,0,0,0.03); border: 1px dashed var(--primary-glow);">
                    <label style="display: block; font-size: 0.85rem; font-weight: bold; color: var(--text); margin-bottom: 8px;">1. 파일 메타정보 (JSON-LD)</label>
                    <textarea id="found-data-json" placeholder="공공데이터포털 상세페이지의 <script type='application/ld+json'> 내용을 복사해서 붙여넣어 주세요" style="width: 100%; height: 90px; background: #fff; border: 1px solid var(--glass-border); color: #333; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 0.75rem; margin-bottom: 10px;"></textarea>
                    <p id="json-auto-msg" style="font-size: 0.75rem; color: var(--primary); font-weight: bold; display: none;">🪄 상세페이지 주소와 메타데이터가 자동으로 감지되었습니다!</p>
                </div>

                <div>
                   <label style="display: block; font-size: 0.85rem; font-weight: bold; color: var(--text); margin-bottom: 8px;">2. 다운로드한 파일</label>
                   <div style="display: flex; gap: 10px; align-items: center;">
                        <button id="manual-upload-btn" class="btn-secondary" style="flex: 1; font-size: 0.85rem; padding: 12px;">📁 파일 직접 업로드 (선택)</button>
                        <input type="file" id="file-input" style="display: none;" accept=".csv,.xlsx,.xls,.json">
                   </div>
                   <div id="upload-status" style="font-size: 0.75rem; color: var(--primary); margin-top: 5px; display: none; font-weight: bold;">파일이 선택되었습니다.</div>
                </div>

                <hr style="border: none; border-top: 1px solid var(--glass-border); margin: 10px 0;">

                <div style="background: rgba(255,255,255,0.3); padding: 15px; border-radius: 10px;">
                    <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 15px;">▼ 위 입력을 토대로 아래 정보가 자동으로 수집되었습니다.</p>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 5px;">데이터셋 이름</label>
                        <input type="text" id="found-data-name" placeholder="JSON 입력 시 자동 생성" style="width: 100%; background: #eee; border: 1px solid var(--glass-border); color: #333; padding: 10px; border-radius: 5px;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 5px;">상세페이지 URL</label>
                        <input type="text" id="found-data-url" placeholder="JSON 입력 시 자동 추출" style="width: 100%; background: #eee; border: 1px solid var(--glass-border); color: #333; padding: 10px; border-radius: 5px;">
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 5px;">제공기관</label>
                            <input type="text" id="found-data-provider" placeholder="자동 입력됨" style="width: 100%; background: #eee; border: 1px solid var(--glass-border); color: #333; padding: 10px; border-radius: 5px;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 5px;">업데이트 주기</label>
                            <input type="text" id="found-data-cycle" placeholder="자동 입력됨" style="width: 100%; background: #eee; border: 1px solid var(--glass-border); color: #333; padding: 10px; border-radius: 5px;">
                        </div>
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 5px;">데이터 설명</label>
                        <textarea id="found-data-desc" placeholder="자동 입력됨" style="width: 100%; height: 80px; background: #eee; border: 1px solid var(--glass-border); color: #333; padding: 10px; border-radius: 5px; resize: none; font-size: 0.85rem;"></textarea>
                    </div>
                </div>

                <div style="text-align: right; margin-top: 10px;">
                    <button id="save-data-info" class="btn-primary" style="padding: 15px 40px; font-size: 1.1rem;">✨ 데이터 저장</button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('close-details').onclick = () => details.style.display = 'none';

    // File Upload Logic
    const fileInput = document.getElementById('file-input');
    const uploadStatus = document.getElementById('upload-status');
    let selectedFile = null;

    document.getElementById('manual-upload-btn').onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
        if (e.target.files.length > 0) {
            selectedFile = e.target.files[0];
            uploadStatus.innerText = `📄 ${selectedFile.name} (${Math.round(selectedFile.size/1024)}KB) 선택됨`;
            uploadStatus.style.display = 'block';
            
            // Only fill if name is currently empty (prioritize metadata name from JSON)
            const nameField = document.getElementById('found-data-name');
            if (nameField && !nameField.value.trim()) {
                nameField.value = selectedFile.name.split('.')[0];
            }
        }
    };

    // JSON Auto-Parsing
    const jsonArea = document.getElementById('found-data-json');
    const autoMsg = document.getElementById('json-auto-msg');
    
    jsonArea.addEventListener('input', () => {
        let jsonStr = jsonArea.value.trim();
        if (jsonStr.length < 20) {
            autoMsg.style.display = 'none';
            if (jsonStr.length === 0) {
                ['name', 'provider', 'cycle', 'desc', 'url'].forEach(f => {
                    const el = document.getElementById(`found-data-${f}`);
                    if (el) el.value = '';
                });
            }
            return;
        }
        
        try {
            jsonStr = jsonStr.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
            jsonStr = jsonStr.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"');
            jsonStr = jsonStr.replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");

            const data = JSON.parse(jsonStr);
            const name = data.alternateName || data.name || '';
            const provider = data.creator ? (Array.isArray(data.creator) ? data.creator[0].name : data.creator.name) : '';
            const cycle = data.datasetTimeInterval || '';
            const description = data.description || '';
            const url = data.url || '';

            let updated = false;
            if (name) { document.getElementById('found-data-name').value = name; updated = true; }
            if (provider) { document.getElementById('found-data-provider').value = provider; updated = true; }
            if (cycle) { document.getElementById('found-data-cycle').value = cycle; updated = true; }
            if (description) { document.getElementById('found-data-desc').value = description; updated = true; }
            if (url) { document.getElementById('found-data-url').value = url; updated = true; }

            if (updated) autoMsg.style.display = 'block';
        } catch (err) {
            autoMsg.style.display = 'none';
        }
    });

    // Keyword Buttons
    document.querySelectorAll('.keyword-btn').forEach(btn => {
        btn.onclick = () => {
            const kw = btn.dataset.kw;
            window.open(`https://www.data.go.kr/tcs/dss/selectDataSetList.do?dType=FILE&keyword=${encodeURIComponent(kw)}`, '_blank');
        };
    });

    document.getElementById('save-data-info').onclick = async () => {
        const jsonContent = document.getElementById('found-data-json').value.trim();
        if (!jsonContent) return alert('메타데이터 JSON 내용을 먼저 입력해 주세요!');
        if (!selectedFile) return alert('수집한 데이터 파일을 업로드해 주세요!');

        const dataInfo = {
            name: document.getElementById('found-data-name').value,
            url: document.getElementById('found-data-url').value,
            metadata: {
                provider: document.getElementById('found-data-provider').value,
                cycle: document.getElementById('found-data-cycle').value,
                description: document.getElementById('found-data-desc').value
            },
            file_url: null
        };
        
        if (!dataInfo.name || !dataInfo.url) return alert('메타데이터 JSON에서 정보를 추출하지 못했습니다. 내용을 다시 확인해 주세요!');

        if (state.user && state.user.student_id !== 'Guest') {
            const { uploadManualFile } = await import('./downloader.js');
            const result = await uploadManualFile(state.user.student_id, selectedFile, selectedFile.name);
            if (result.success) {
                dataInfo.file_url = result.path;
                dataInfo.size_kb = result.size_kb;
            } else return alert('파일 저장에 실패했습니다: ' + result.error);
        }
        
        onDataSelected(cat, dataInfo);
    };
}
