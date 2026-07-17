console.log('[st-chats-jump] 腳本已被酒館讀取並開始執行！');

// 1. 將樣式直接寫入 JS，確保一定會被載入
const css = `
#st-chats-jump-container {
    position: fixed;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 15px;
    z-index: 99999; /* 調高層級，確保不會被酒館的背景或選單遮擋 */
}
#st-chats-jump-container button {
    width: 45px;
    height: 45px;
    border-radius: 8px;
    font-size: 20px;
    cursor: pointer;
    background-color: rgba(30, 30, 30, 0.8);
    color: #ffffff;
    border: 1px solid #555;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
}
#st-chats-jump-container button:hover {
    background-color: rgba(80, 80, 80, 0.8);
}
`;

// 2. 強制注入 CSS 到網頁中
const style = document.createElement('style');
style.innerHTML = css;
document.head.appendChild(style);

// 3. 建立並插入按鈕 UI
const jumpContainer = document.createElement('div');
jumpContainer.id = 'st-chats-jump-container';
jumpContainer.innerHTML = `
    <button id="jump-up-btn" title="上一則">▲</button>
    <button id="jump-down-btn" title="下一則">▼</button>
`;
document.body.appendChild(jumpContainer);

// 4. 跳轉邏輯
let currentIndex = -1;

function getMessages() {
    return Array.from(document.querySelectorAll('.mes'));
}

function jumpToMessage(direction) {
    const messages = getMessages();
    if (messages.length === 0) return;
    const chatContainer = document.getElementById('chat');

    // 重新計算目前最靠近畫面上方的訊息
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
            if (chatContainer) {
                // 強制捲動到頂端，觸發歷史紀錄載入
                chatContainer.scrollTop = 0;
            }
            currentIndex = -1;
            return;
        }
    } else if (direction === 'down') {
        currentIndex++;
        if (currentIndex >= messages.length) {
            currentIndex = messages.length - 1;
        }
    }

    // 執行跳轉
    if (messages[currentIndex]) {
        messages[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// 5. 綁定按鈕事件
document.getElementById('jump-up-btn').addEventListener('click', () => jumpToMessage('up'));
document.getElementById('jump-down-btn').addEventListener('click', () => jumpToMessage('down'));

// 6. 監聽對話框滾動，重置索引
// 使用 capture 確保能抓到酒館動態生成的 #chat 容器事件
window.addEventListener('scroll', (e) => {
    if (e.target && e.target.id === 'chat') {
        currentIndex = -1;
    }
}, { passive: true, capture: true });