// 宣告當前定位的訊息索引
let currentIndex = -1;

function getMessages() {
    // 酒館的訊息區塊預設會帶有 .mes 這個 class
    return Array.from(document.querySelectorAll('.mes'));
}

function jumpToMessage(direction) {
    const messages = getMessages();
    if (messages.length === 0) return;
    const chatContainer = document.getElementById('chat');

    // 如果使用者手動捲動過，或者還沒開始按，就重新計算目前最靠近畫面上方的訊息是哪一則
    if (currentIndex < 0 || currentIndex >= messages.length) {
        let closest = 0;
        let minDistance = Infinity;
        
        messages.forEach((mes, index) => {
            const rect = mes.getBoundingClientRect();
            // 找出距離視窗頂部最近的區塊
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
        // 當索引小於 0，代表已經按到目前載入的最頂端一則
        if (currentIndex < 0) {
            if (chatContainer) {
                // 強制將對話框捲動到最上面，這會直接觸發酒館內建的載入歷史紀錄功能
                chatContainer.scrollTop = 0;
            }
            // 重置索引。下次點擊時會重新掃描新載入的 DOM
            currentIndex = -1;
            return;
        }
    } else if (direction === 'down') {
        currentIndex++;
        if (currentIndex >= messages.length) {
            currentIndex = messages.length - 1; // 鎖定在最底端
        }
    }

    // 執行平滑跳轉至目標訊息
    if (messages[currentIndex]) {
        messages[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

jQuery(async () => {
    // 建立懸浮按鈕 UI
    const jumpContainer = document.createElement('div');
    jumpContainer.id = 'st-chats-jump-container';
    jumpContainer.innerHTML = `
        <button id="jump-up-btn" class="menu_button" title="上一則">▲</button>
        <button id="jump-down-btn" class="menu_button" title="下一則">▼</button>
    `;
    document.body.appendChild(jumpContainer);

    // 綁定點擊事件
    document.getElementById('jump-up-btn').addEventListener('click', () => jumpToMessage('up'));
    document.getElementById('jump-down-btn').addEventListener('click', () => jumpToMessage('down'));

    // 監聽對話框的滾動事件。如果使用者手動滑動滑鼠滾輪，就重置索引，避免下次點擊時亂跳
    const chatContainer = document.getElementById('chat');
    if (chatContainer) {
        chatContainer.addEventListener('scroll', () => {
            currentIndex = -1;
        }, { passive: true });
    }
});