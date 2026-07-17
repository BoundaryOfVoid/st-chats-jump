console.log('[st-chats-jump] 腳本已更新：改為橫向排列與 ID 精準跳轉！');

const jumpContainer = document.createElement('div');
jumpContainer.id = 'st-chats-jump-container';
jumpContainer.innerHTML = `
    <div id="drag-handle" title="拖拉移動">⋮⋮</div>
    <button id="jump-up-btn" title="上一則 (ID-1)">▲</button>
    <button id="jump-down-btn" title="下一則 (ID+1)">▼</button>
`;
document.body.appendChild(jumpContainer);

let currentMesId = -1;

function jumpToMessage(direction) {
    const chatContainer = document.getElementById('chat');
    if (!chatContainer) return;

    // 1. 如果目前沒有鎖定的 ID，先精算畫面中央的訊息 ID
    if (currentMesId === -1) {
        // 只抓取帶有 mesid 屬性且目前有顯示的區塊
        const messages = Array.from(document.querySelectorAll('.mes')).filter(m => m.offsetParent !== null && m.hasAttribute('mesid'));
        if (messages.length === 0) return;

        let closestId = parseInt(messages[0].getAttribute('mesid'), 10);
        let minDistance = Infinity;
        const windowCenter = window.innerHeight / 2;
        
        messages.forEach(mes => {
            const rect = mes.getBoundingClientRect();
            const mesCenter = rect.top + (rect.height / 2);
            const distance = Math.abs(mesCenter - windowCenter);
            if (distance < minDistance) {
                minDistance = distance;
                closestId = parseInt(mes.getAttribute('mesid'), 10);
            }
        });
        currentMesId = closestId;
    }

    // 2. 嚴格依據 ID 進行加減
    let targetId = direction === 'up' ? currentMesId - 1 : currentMesId + 1;
    
    // 如果目標 ID 小於 0，代表已經在最頂端，嘗試觸發歷史載入
    if (targetId < 0) {
        chatContainer.scrollTop = 0;
        currentMesId = -1;
        return;
    }

    // 3. 尋找目標 ID 的 DOM 元素
    let targetMes = document.querySelector(`.mes[mesid="${targetId}"]`);
    
    // 防呆機制：如果該 ID 被刪除了或隱藏了，繼續往下/上找一個最近的
    while (targetMes && targetMes.offsetParent === null) {
        targetId = direction === 'up' ? targetId - 1 : targetId + 1;
        targetMes = document.querySelector(`.mes[mesid="${targetId}"]`);
    }

    if (targetMes) {
        // 執行精準跳轉
        targetMes.scrollIntoView({ behavior: 'smooth', block: 'center' });
        currentMesId = targetId; // 記錄跳轉後的 ID，供下次點擊使用
    } else {
        // 如果 DOM 裡找不到該 ID
        if (direction === 'up') {
            chatContainer.scrollTop = 0; // 置頂以載入更多歷史
            currentMesId = -1;
        } else {
            currentMesId = -1; // 到底了，重置狀態
        }
    }
}

// 綁定點擊事件
document.getElementById('jump-up-btn').addEventListener('click', () => jumpToMessage('up'));
document.getElementById('jump-down-btn').addEventListener('click', () => jumpToMessage('down'));

// 滾動時重置 ID 鎖定
window.addEventListener('scroll', (e) => {
    if (e.target && e.target.id === 'chat') {
        currentMesId = -1;
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