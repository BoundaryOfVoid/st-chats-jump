console.log('[st-chats-jump] 腳本已更新：無狀態視覺運算 + 觸控邊界防呆 + 最高權限更新攔截');

// ==========================================
// 1. 建立並插入按鈕 UI
// ==========================================
const jumpContainer = document.createElement('div');
jumpContainer.id = 'st-chats-jump-container';
jumpContainer.innerHTML = `
    <div id="drag-handle" title="拖拉移動">⠿</div>
    <button id="jump-up-btn" title="上一則">▲</button>
    <button id="jump-down-btn" title="下一則">▼</button>
`;
document.body.appendChild(jumpContainer);


// ==========================================
// 2. 核心跳轉邏輯 (無狀態視覺運算 + 智慧長文錨點)
// ==========================================
function jumpToMessage(direction) {
    const chatContainer = document.getElementById('chat');
    if (!chatContainer) return;

    // 取得畫面上所有可見且帶有 ID 的對話區塊
    const visibleMessages = Array.from(document.querySelectorAll('.mes')).filter(m => m.offsetParent !== null && m.hasAttribute('mesid'));
    if (visibleMessages.length === 0) return;

    // 獲取聊天視窗的「物理頂端座標」 (加上 10px 緩衝區，排除邊框干擾)
    const chatRect = chatContainer.getBoundingClientRect();
    const viewTop = chatRect.top + 10; 

    // 找出「當前肉眼正在閱讀」的對話：
    // 從上往下遍歷，找出最後一個「頂部座標高於或貼齊視窗頂端」的區塊
    let currentIndex = 0;
    for (let i = 0; i < visibleMessages.length; i++) {
        const rect = visibleMessages[i].getBoundingClientRect();
        if (rect.top <= viewTop) {
            currentIndex = i;
        } else {
            break; 
        }
    }

    let targetIndex = currentIndex;
    const currentRect = visibleMessages[currentIndex].getBoundingClientRect();

    // 符合人類直覺的跳轉邏輯
    if (direction === 'up') {
        // 【智慧長文錨點】
        // 如果當前對話的頂端被推到視窗上方超過 50px (代表你正處於長文的深處)
        // 按「上一則」必須先回到『這則對話的最頂端』，而不是直接跳到上一樓。
        if (currentRect.top < viewTop - 50) {
            targetIndex = currentIndex;
        } else {
            targetIndex = currentIndex - 1; 
        }
    } else if (direction === 'down') {
        targetIndex = currentIndex + 1;
    }

    // 執行跳轉與邊界防呆 (強制使用 behavior: 'auto' 與 block: 'start' 確保 100% 精準)
    if (targetIndex < 0) {
        chatContainer.scrollTop = 0; // 置頂載入歷史
    } else if (targetIndex >= visibleMessages.length) {
        targetIndex = visibleMessages.length - 1;
        visibleMessages[targetIndex].scrollIntoView({ behavior: 'auto', block: 'start' });
    } else {
        visibleMessages[targetIndex].scrollIntoView({ behavior: 'auto', block: 'start' });
    }
}

document.getElementById('jump-up-btn').addEventListener('click', () => jumpToMessage('up'));
document.getElementById('jump-down-btn').addEventListener('click', () => jumpToMessage('down'));


// ==========================================
// 3. 拖拉邏輯 (支援滑鼠與平板觸控 + 物理邊界防呆)
// ==========================================
const handle = document.getElementById('drag-handle');
let isDragging = false;
let startX, startY, initialLeft, initialTop;

// 抓取座標：判斷是觸控手指還是滑鼠指標
function getEventPos(e) {
    if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
}

function dragStart(e) {
    isDragging = true;
    const pos = getEventPos(e);
    startX = pos.x;
    startY = pos.y;
    
    // 獲取當前容器的絕對物理座標
    const rect = jumpContainer.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;
    handle.style.cursor = 'grabbing';
    
    // 解除 CSS 的置中或靠右限制，轉換為絕對座標以跟隨指標
    jumpContainer.style.right = 'auto';
    jumpContainer.style.bottom = 'auto';
    jumpContainer.style.top = initialTop + 'px';
    jumpContainer.style.left = initialLeft + 'px';
    jumpContainer.style.transform = 'none';
}

function dragMove(e) {
    if (!isDragging) return;
    
    // 平板防呆：拖拉按鈕時，強制取消預設行為，防止整個網頁背景滑動
    if (e.cancelable) {
        e.preventDefault(); 
    }
    
    const pos = getEventPos(e);
    const dx = pos.x - startX;
    const dy = pos.y - startY;
    
    let newLeft = initialLeft + dx;
    let newTop = initialTop + dy;
    
    // 取得按鈕容器的實際長寬
    const rect = jumpContainer.getBoundingClientRect();
    
    // 邊界防呆：計算螢幕的最大可見長寬
    const maxLeft = window.innerWidth - rect.width;
    const maxTop = window.innerHeight - rect.height;
    
    // 強制限制 X 軸與 Y 軸不得超出螢幕
    // 註：Y 軸 (newTop) 最少保留 60px 空間，避免鑽進平板/手機上方導覽列底下
    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(60, Math.min(newTop, maxTop)); 
    
    jumpContainer.style.left = newLeft + 'px';
    jumpContainer.style.top = newTop + 'px';
}

function dragEnd() {
    if (isDragging) {
        isDragging = false;
        handle.style.cursor = 'grab';
    }
}

// 綁定滑鼠事件 (電腦端)
handle.addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', dragMove, { passive: false });
document.addEventListener('mouseup', dragEnd);

// 綁定觸控事件 (平板/手機端)
handle.addEventListener('touchstart', dragStart, { passive: false });
document.addEventListener('touchmove', dragMove, { passive: false });
document.addEventListener('touchend', dragEnd);


// ==========================================
// 4. 擴充功能更新監聽器 (最高權限攔截)
// ==========================================
document.addEventListener('click', (e) => {
    // 尋找滑鼠點擊的最近的區塊
    const clickedElement = e.target.closest('div, button, i, span');
    if (!clickedElement) return;

    // 確認是否點擊了帶有分支圖示 (更新) 的按鈕
    const isUpdate = clickedElement.classList.contains('fa-code-branch') || 
                     clickedElement.querySelector('.fa-code-branch') || 
                     clickedElement.closest('.fa-code-branch');

    if (!isUpdate) return;

    // 往上尋找該按鈕所屬的擴充功能列
    const extensionRow = clickedElement.closest('.flex-container') || clickedElement.parentElement.parentElement;
    
    // 如果確認是 ST Chats Jump 的更新按鈕
    if (extensionRow && extensionRow.textContent.includes('ST Chats Jump')) {
        setTimeout(() => {
            toastr.info(
                `ST Chats Jump 已在背景更新完成。<br><a href="#" onclick="location.reload(); return false;" style="text-decoration: underline; cursor: pointer; color: #fff; font-weight: bold;">Click here to reload immediately</a>`,
                '擴充功能更新',
                { escapeHtml: false, timeOut: 15000, extendedTimeOut: 5000 }
            );
        }, 1500); // 1.5秒後彈出，避開按鈕本身的動畫卡頓
    }
}, { capture: true });

// ==========================================
// 5. 行動裝置強制初始化定位 (徹底避開 CSS 快取與衝突)
// ==========================================
setTimeout(() => {
    // 偵測是否為平板或手機環境 (螢幕寬度小於 1024px)
    if (window.innerWidth <= 1024) {
        const rect = jumpContainer.getBoundingClientRect();
        
        // 取得容器長寬，若因載入延遲抓不到，給予預設安全值
        const w = rect.width || 46; 
        const h = rect.height || 100;
        
        // 強制計算絕對座標：位於畫面右方 15px，下方 120px 處
        const initLeft = window.innerWidth - w - 15;
        const initTop = window.innerHeight - h - 120;
        
        // 拔除所有 CSS 的對齊限制，換成 JS 的絕對物理定位
        jumpContainer.style.right = 'auto';
        jumpContainer.style.bottom = 'auto';
        jumpContainer.style.transform = 'none';
        jumpContainer.style.left = initLeft + 'px';
        jumpContainer.style.top = initTop + 'px';
    }
}, 1000); // 延遲 1 秒，確保酒館的其他 UI 都已經載入完畢，避免被擠掉