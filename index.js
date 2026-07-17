console.log('[st-chats-jump] 腳本已更新：無狀態視覺運算 + 智慧長文錨點 + 強制精準定位');

const jumpContainer = document.createElement('div');
jumpContainer.id = 'st-chats-jump-container';
jumpContainer.innerHTML = `
    <div id="drag-handle" title="拖拉移動">⠿</div>
    <button id="jump-up-btn" title="上一則">▲</button>
    <button id="jump-down-btn" title="下一則">▼</button>
`;
document.body.appendChild(jumpContainer);

function jumpToMessage(direction) {
    const chatContainer = document.getElementById('chat');
    if (!chatContainer) return;

    // 1. 取得畫面上所有可見且帶有 ID 的對話區塊
    const visibleMessages = Array.from(document.querySelectorAll('.mes')).filter(m => m.offsetParent !== null && m.hasAttribute('mesid'));
    if (visibleMessages.length === 0) return;

    // 2. 獲取聊天視窗的「物理頂端座標」 (加上 10px 緩衝區，排除邊框干擾)
    const chatRect = chatContainer.getBoundingClientRect();
    const viewTop = chatRect.top + 10; 

    // 3. 找出「當前肉眼正在閱讀」的對話
    // 邏輯：從上往下遍歷，找出最後一個「頂部座標高於或貼齊視窗頂端」的區塊
    let currentIndex = 0;
    for (let i = 0; i < visibleMessages.length; i++) {
        const rect = visibleMessages[i].getBoundingClientRect();
        if (rect.top <= viewTop) {
            currentIndex = i;
        } else {
            break; // 找到第一個低於視窗的區塊就停止
        }
    }

    let targetIndex = currentIndex;
    const currentRect = visibleMessages[currentIndex].getBoundingClientRect();

    // 4. 符合人類直覺的跳轉邏輯
    if (direction === 'up') {
        // 【智慧長文錨點】
        // 如果當前對話的頂端被推到視窗上方超過 50px (代表你正處於長文的深處)
        // 按「上一則」必須先回到『這則對話的最頂端』，而不是直接跳到上一樓。
        if (currentRect.top < viewTop - 50) {
            targetIndex = currentIndex;
        } else {
            targetIndex = currentIndex - 1; // 已經在頂部，才真正跳往上一樓
        }
    } else if (direction === 'down') {
        targetIndex = currentIndex + 1;
    }

    // 5. 執行跳轉與邊界防呆
    if (targetIndex < 0) {
        chatContainer.scrollTop = 0; // 置頂載入歷史
    } else if (targetIndex >= visibleMessages.length) {
        targetIndex = visibleMessages.length - 1;
        // 改用 behavior: 'auto' (瞬間跳轉)，達到與 Console 測試相同的 100% 精準度
        visibleMessages[targetIndex].scrollIntoView({ behavior: 'auto', block: 'start' });
    } else {
        visibleMessages[targetIndex].scrollIntoView({ behavior: 'auto', block: 'start' });
    }
}

document.getElementById('jump-up-btn').addEventListener('click', () => jumpToMessage('up'));
document.getElementById('jump-down-btn').addEventListener('click', () => jumpToMessage('down'));

// 拖拉邏輯
const handle = document.getElementById('drag-handle');
let isDragging = false;
let startX, startY, initialLeft, initialTop;

handle.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = jumpContainer.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;
    handle.style.cursor = 'grabbing';
    
    jumpContainer.style.right = 'auto';
    jumpContainer.style.bottom = 'auto';
    jumpContainer.style.top = initialTop + 'px';
    jumpContainer.style.left = initialLeft + 'px';
    jumpContainer.style.transform = 'none';
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    jumpContainer.style.left = (initialLeft + dx) + 'px';
    jumpContainer.style.top = (initialTop + dy) + 'px';
});

document.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        handle.style.cursor = 'grab';
    }
});

// ==========================================
// 擴充功能更新監聽器 (模擬酒館助手的重新載入通知)
// ==========================================
document.addEventListener('click', (e) => {
    // 1. 確認點擊的目標是否為按鈕 (或按鈕內的圖示)
    const targetButton = e.target.closest('.menu_button');
    if (!targetButton) return;

    // 2. 往上尋找該按鈕所屬的擴充功能列
    // 酒館的擴充功能列通常包在具有特定結構的 div 中，我們用文字內容來精準定位
    const extensionRow = targetButton.closest('.flex-container') || targetButton.parentElement.parentElement;
    
    if (extensionRow && extensionRow.textContent.includes('ST Chats Jump')) {
        // 3. 確認點擊的是「更新」按鈕 (判斷是否包含 Git 分支圖示)
        if (targetButton.querySelector('.fa-code-branch') || targetButton.classList.contains('fa-code-branch') || targetButton.innerHTML.includes('fa-code-branch')) {
            
            // 4. 攔截到更新動作！設定 2 秒延遲，讓後端伺服器有時間完成 git pull
            setTimeout(() => {
                toastr.info(
                    `ST Chats Jump 已在背景更新完成。<br><a href="#" onclick="location.reload(); return false;" style="text-decoration: underline; cursor: pointer; color: #fff; font-weight: bold;">Click here to reload immediately</a>`,
                    '擴充功能更新',
                    { escapeHtml: false, timeOut: 15000, extendedTimeOut: 5000 }
                );
            }, 2000);
        }
    }
});