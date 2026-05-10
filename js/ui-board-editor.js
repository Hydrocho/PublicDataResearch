export function showBoardEditor(state, onSave, existingPost = null) {
    const isEdit = !!existingPost;
    const modalId = 'board-editor-modal';
    
    // 모달 컨테이너 생성
    let modal = document.getElementById(modalId);
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

    let selectedFiles = []; // 새롭게 추가할 파일들
    let filesToDelete = []; // 삭제할 기존 파일 ID들

    const render = () => {
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px; width: 90%;">
                <div class="modal-header">
                    <h2>${isEdit ? '📝 게시글 수정하기' : '📤 자료 공유하기'}</h2>
                    <button class="close-modal-btn" style="background:none; border:none; font-size:1.5rem; cursor:pointer;">&times;</button>
                </div>
                <div class="modal-body" style="padding: 25px;">
                    <div style="margin-bottom: 20px;">
                        <label style="display:block; font-weight:700; margin-bottom:8px; color:#475569;">제목</label>
                        <input type="text" id="post-title" value="${isEdit ? existingPost.title : ''}" 
                               placeholder="공유할 자료의 제목을 입력하세요"
                               style="width:100%; padding:12px; border:1px solid #e2e8f0; border-radius:8px; outline:none; font-size:1rem;">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display:block; font-weight:700; margin-bottom:8px; color:#475569;">설명</label>
                        <textarea id="post-content" placeholder="자료에 대한 설명을 입력해주세요"
                                  style="width:100%; height:120px; padding:12px; border:1px solid #e2e8f0; border-radius:8px; outline:none; font-size:0.95rem; resize:none;">${isEdit ? existingPost.content : ''}</textarea>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display:block; font-weight:700; margin-bottom:8px; color:#475569;">파일 첨부</label>
                        <div id="drop-zone" style="border:2px dashed #cbd5e1; border-radius:12px; padding:30px; text-align:center; background:#f8fafc; cursor:pointer; transition:all 0.2s;">
                            <i data-lucide="upload-cloud" size="32" style="color:#94a3b8; margin-bottom:10px;"></i>
                            <p style="margin:0; color:#64748b; font-size:0.9rem;">클릭하거나 파일을 여기로 끌어다 놓으세요</p>
                            <input type="file" id="file-input" multiple style="display:none;">
                        </div>
                        
                        <!-- 파일 목록 표시 -->
                        <div id="file-list-container" style="margin-top:15px; display:flex; flex-direction:column; gap:8px;">
                            ${isEdit ? `
                                <div style="font-size:0.8rem; font-weight:700; color:#94a3b8; margin-bottom:4px; margin-top:10px;">기존 첨부 파일</div>
                                ${existingPost.shared_files.filter(f => !filesToDelete.includes(String(f.id))).map(file => `
                                    <div class="file-item glass" style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; border-radius:8px; border:1px solid #e2e8f0; background:white;">
                                        <div style="display:flex; align-items:center; gap:8px; font-size:0.85rem;">
                                            <i data-lucide="file" size="14" style="color:#64748b;"></i>
                                            <span style="font-weight:600; color:#1e293b;">${file.file_name}</span>
                                        </div>
                                        <button class="remove-existing-file-btn" data-id="${file.id}" style="background:none; border:none; color:#ef4444; cursor:pointer; padding:4px;">
                                            <i data-lucide="x" size="16"></i>
                                        </button>
                                    </div>
                                `).join('')}
                                ${existingPost.shared_files.filter(f => !filesToDelete.includes(String(f.id))).length === 0 ? '<p style="font-size:0.85rem; color:#94a3b8; text-align:center;">기존 파일이 없습니다.</p>' : ''}
                            ` : ''}

                            ${selectedFiles.length > 0 ? `
                                <div style="font-size:0.8rem; font-weight:700; color:var(--primary); margin-bottom:4px; margin-top:10px;">새로 추가할 파일</div>
                                ${selectedFiles.map((f, idx) => `
                                    <div class="file-item glass" style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; border-radius:8px; border:1px solid var(--primary); background:rgba(99,102,241,0.05);">
                                        <div style="display:flex; align-items:center; gap:8px; font-size:0.85rem;">
                                            <i data-lucide="file-plus" size="14" style="color:var(--primary);"></i>
                                            <span style="font-weight:600; color:var(--primary);">${f.name}</span>
                                            <span style="font-size:0.75rem; color:#94a3b8;">(${(f.size/1024).toFixed(1)} KB)</span>
                                        </div>
                                        <button class="remove-new-file-btn" data-idx="${idx}" style="background:none; border:none; color:#94a3b8; cursor:pointer; padding:4px;">
                                            <i data-lucide="x" size="16"></i>
                                        </button>
                                    </div>
                                `).join('')}
                            ` : ''}
                        </div>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:30px;">
                        <button class="btn-secondary cancel-btn" style="padding:10px 20px;">취소</button>
                        <button id="save-post-btn" class="btn-primary" style="padding:10px 30px; font-weight:600;">
                            ${isEdit ? '수정 완료' : '공유하기'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        if (window.lucide) lucide.createIcons();
        modal.style.display = 'flex';

        // 이벤트 바인딩
        modal.querySelector('.close-modal-btn').onclick = () => { modal.style.display = 'none'; };
        modal.querySelector('.cancel-btn').onclick = () => { modal.style.display = 'none'; };
        
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');
        
        dropZone.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            selectedFiles = [...selectedFiles, ...Array.from(e.target.files)];
            render();
        };
        
        dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--primary)'; };
        dropZone.ondragleave = () => { dropZone.style.borderColor = '#cbd5e1'; };
        dropZone.ondrop = (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#cbd5e1';
            selectedFiles = [...selectedFiles, ...Array.from(e.dataTransfer.files)];
            render();
        };

        // 기존 파일 제거 버튼
        modal.querySelectorAll('.remove-existing-file-btn').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                if (confirm('이 파일을 삭제하시겠습니까? (수정 완료 클릭 시 반영됩니다)')) {
                    filesToDelete.push(id);
                    render();
                }
            };
        });

        // 새 파일 제거 버튼
        modal.querySelectorAll('.remove-new-file-btn').forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.dataset.idx);
                selectedFiles.splice(idx, 1);
                render();
            };
        });

        // 저장 버튼
        document.getElementById('save-post-btn').onclick = async () => {
            const title = document.getElementById('post-title').value.trim();
            const content = document.getElementById('post-content').value.trim();
            
            if (!title) return alert('제목을 입력해주세요.');
            
            const btn = document.getElementById('save-post-btn');
            const origText = btn.innerText;
            btn.disabled = true;
            btn.innerHTML = '<div class="spinner" style="width:16px; height:16px; border-width:2px;"></div> 처리 중...';
            
            try {
                // 수정 모드인 경우 개별 파일 삭제 처리 먼저 수행 (또는 콜백에서 통합 처리)
                // 여기서는 onSave 콜백 하나로 데이터를 넘겨주고 처리는 호출한 쪽(ui-step-router)에서 담당하게 함
                await onSave({
                    title,
                    content,
                    files: selectedFiles,
                    deletedFileIds: filesToDelete,
                    existingPost: existingPost
                });
                modal.style.display = 'none';
            } catch (err) {
                console.error(err);
                alert('처리 중 오류가 발생했습니다.');
            } finally {
                btn.disabled = false;
                btn.innerText = origText;
            }
        };
    };

    render();
}
