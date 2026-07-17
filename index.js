console.log('[st-chats-jump] 腳本已更新：修正定位邏輯與新增拖拉功能！');

// 1. 建立並插入按鈕 UI，新增拖拉握把 (drag-handle)
const jumpContainer = document.createElement('div');
jumpContainer.id = 'st-chats-jump-container';
jumpContainer.innerHTML = `
    <div id="drag-handle" title="拖拉移動">⠿</div>
    <button id="jump-up-btn" title="上一則">▲</button>
    <button id="jump-down-btn" title="下一則">▼</button>
`;
document.body.appendChild(jumpContainer);

// 2. 跳轉邏輯
let currentIndex = -1;

function getMessages() {
    // 嚴格過濾：只抓取真實顯示在畫面上的 .mes 區塊，排除隱藏狀態
    return Array.from(document.querySelectorAll('.mes')).filter(mes => mes.offsetParent !== null);
}

function jumpToMessage(direction) {
    const messages = getMessages();
    if (messages.length === 0) return;
    const chatContainer = document.getElementById('chat');

    if (currentIndex < 0 || currentIndex >= messages.length) {
        let closest = 0;
        let minDistance = Infinity;
        // 改以「視窗中心點」為準
        const windowCenter = window.innerHeight / 2;
        
        messages.forEach((mes, index) => {
            const rect = mes.getBoundingClientRect();
            // 計算該則訊息的垂直中心點
            const mesCenter = rect.top + (rect.height / 2);
            const distance = Math.abs(mesCenter - windowCenter);
            if (distance < minDistance) {
                minDistance = distance;
                closest = index;
            }
        });
        currentIndex = closest;
    }

    if (direction === 'up') {
        currentIndex--;
        if (currentIndex < 0) {
            if (chatContainer) chatContainer.scrollTop = 0;
            currentIndex = -1;
            return;
        }
    } else if (direction === 'down') {
        currentIndex++;
        if (currentIndex >= messages.length) {
            currentIndex = messages.length - 1;
        }
    }

    if (messages[currentIndex]) {
        messages[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// 3. 綁定按鈕與滾動事件
document.getElementById('jump-up-btn').addEventListener('click', () => jumpToMessage('up'));
document.getElementById('jump-down-btn').addEventListener('click', () => jumpToMessage('down'));

window.addEventListener('scroll', (e) => {
    if (e.target && e.target.id === 'chat') {
        currentIndex = -1;
    }
}, { passive: true, capture: true });

// 4. 拖拉功能實作
const handle = document.getElementById('drag-handle');
let isDragging = false;
let startX, startY, initialLeft, initialTop;

handle.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    
    // 取得當前容器的物理座標
    const rect = jumpContainer.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;
    
    handle.style.cursor = 'grabbing';
    
    // 解除原本 CSS 的 fixed 置中限制，轉換為絕對座標以跟隨滑鼠
    jumpContainer.style.right = 'auto';
    jumpContainer.style.bottom = 'auto';
    jumpContainer.style.top = initialTop + 'px';
    jumpContainer.style.left = initialLeft + 'px';
    jumpContainer.style.transform = 'none';
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault(); // 防止拖拉時誤反白文字
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