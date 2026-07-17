console.log('[st-chats-jump] 腳本已被酒館讀取並開始執行！');

// 1. 建立並插入按鈕 UI
const jumpContainer = document.createElement('div');
jumpContainer.id = 'st-chats-jump-container';
jumpContainer.innerHTML = `
    <button id="jump-up-btn" title="上一則">▲</button>
    <button id="jump-down-btn" title="下一則">▼</button>
`;
document.body.appendChild(jumpContainer);

// 2. 跳轉邏輯
let currentIndex = -1;

function getMessages() {
    return Array.from(document.querySelectorAll('.mes'));
}

function jumpToMessage(direction) {
    const messages = getMessages();
    if (messages.length === 0) return;
    const chatContainer = document.getElementById('chat');

    if (currentIndex < 0 || currentIndex >= messages.length) {
        let closest = 0;
        let minDistance = Infinity;
        messages.forEach((mes, index) => {
            const rect = mes.getBoundingClientRect();
            const distance = Math.abs(rect.top);
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

// 3. 綁定按鈕事件
document.getElementById('jump-up-btn').addEventListener('click', () => jumpToMessage('up'));
document.getElementById('jump-down-btn').addEventListener('click', () => jumpToMessage('down'));

// 4. 監聽滾動重置
window.addEventListener('scroll', (e) => {
    if (e.target && e.target.id === 'chat') {
        currentIndex = -1;
    }
}, { passive: true, capture: true });