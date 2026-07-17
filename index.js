console.log('[st-chats-jump] 腳本已更新：修正長對話座標誤判問題！');

const jumpContainer = document.createElement('div');
jumpContainer.id = 'st-chats-jump-container';
jumpContainer.innerHTML = `
    <div id="drag-handle" title="拖拉移動">⠿</div>
    <button id="jump-up-btn" title="上一則">▲</button>
    <button id="jump-down-btn" title="下一則">▼</button>
`;
document.body.appendChild(jumpContainer);

let currentMesId = null;

function jumpToMessage(direction) {
    const chatContainer = document.getElementById('chat');
    if (!chatContainer) return;

    // 1. 獲取當下「真正可見」且帶有 ID 的所有對話區塊
    const visibleMessages = Array.from(document.querySelectorAll('.mes')).filter(m => m.offsetParent !== null && m.hasAttribute('mesid'));
    if (visibleMessages.length === 0) return;

    // 2. 尋找當前紀錄的 ID 位於陣列中的哪一個位置
    let currentIndex = -1;
    if (currentMesId !== null) {
        currentIndex = visibleMessages.findIndex(m => m.getAttribute('mesid') === currentMesId);
    }

    // 3. 重新計算基準點：物理視覺鎖定
    if (currentIndex === -1) {
        const windowCenter = window.innerHeight / 2;
        
        // 找出「頂部座標」高於「畫面中心點」的最後一個元素。
        // 這能完美對應人類閱讀長文時的視線焦點，徹底排除長度干擾。
        visibleMessages.forEach((mes, index) => {
            const rect = mes.getBoundingClientRect();
            if (rect.top < windowCenter) {
                currentIndex = index;
            }
        });
        
        // 防呆：如果所有訊息都在畫面下半部（例如剛載入時），就抓第一則
        if (currentIndex === -1) currentIndex = 0;
    }

    // 4. 根據陣列索引往上或往下
    if (direction === 'up') {
        currentIndex--;
    } else {
        currentIndex++;
    }

    // 5. 執行跳轉與邊界處理
    if (currentIndex < 0) {
        chatContainer.scrollTop = 0; // 已經到頂，觸發酒館載入歷史
        currentMesId = null;
    } else if (currentIndex >= visibleMessages.length) {
        currentIndex = visibleMessages.length - 1; // 到底了，鎖定在最新一則
        visibleMessages[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
        currentMesId = visibleMessages[currentIndex].getAttribute('mesid');
    } else {
        visibleMessages[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
        currentMesId = visibleMessages[currentIndex].getAttribute('mesid'); // 記錄成功跳轉的 ID
    }
}

document.getElementById('jump-up-btn').addEventListener('click', () => jumpToMessage('up'));
document.getElementById('jump-down-btn').addEventListener('click', () => jumpToMessage('down'));

window.addEventListener('scroll', (e) => {
    if (e.target && e.target.id === 'chat') {
        currentMesId = null;
    }
}, { passive: true, capture: true });

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