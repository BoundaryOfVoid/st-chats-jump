console.log('[st-chats-jump] 腳本已更新：新增裝置獨立位置記憶 + 邊界防呆 + 微縮體積');

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
// 2. 核心跳轉邏輯
// ==========================================
function jumpToMessage(direction) {
    const chatContainer = document.getElementById('chat');
    if (!chatContainer) return;

    const visibleMessages = Array.from(document.querySelectorAll('.mes')).filter(m => m.offsetParent !== null && m.hasAttribute('mesid'));
    if (visibleMessages.length === 0) return;

    const chatRect = chatContainer.getBoundingClientRect();
    const viewTop = chatRect.top + 10; 

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

    if (direction === 'up') {
        if (currentRect.top < viewTop - 50) {
            targetIndex = currentIndex;
        } else {
            targetIndex = currentIndex - 1; 
        }
    } else if (direction === 'down') {
        targetIndex = currentIndex + 1;
    }

    if (targetIndex < 0) {
        chatContainer.scrollTop = 0;
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
// 3. 裝置判定、位置記憶與邊界運算
// ==========================================
function getDeviceProfile() {
    const w = window.innerWidth;
    if (w <= 768) return 'mobile';
    if (w <= 1024) return 'tablet';
    return 'desktop';
}

function clampPosition(left, top, rectWidth, rectHeight) {
    const maxLeft = window.innerWidth - rectWidth;
    const maxTop = window.innerHeight - rectHeight;
    // 強制限制不超出右下邊界，且 Y 軸至少留 60px 避開頂部導覽列
    const clampedLeft = Math.max(0, Math.min(left, maxLeft));
    const clampedTop = Math.max(60, Math.min(top, maxTop));
    return { left: clampedLeft, top: clampedTop };
}

function initAndLoadPosition() {
    const profile = getDeviceProfile();
    const savedPos = localStorage.getItem(`st-chats-jump-pos-${profile}`);
    const rect = jumpContainer.getBoundingClientRect();
    
    // 如果因為某些原因抓不到長寬，給予防呆預設值
    const w = rect.width || 36;
    const h = rect.height || 80;

    // 清除 CSS 可能干擾的預設定位
    jumpContainer.style.right = 'auto';
    jumpContainer.style.bottom = 'auto';
    jumpContainer.style.transform = 'none';

    if (savedPos) {
        try {
            const pos = JSON.parse(savedPos);
            const clamped = clampPosition(pos.left, pos.top, w, h);
            jumpContainer.style.left = clamped.left + 'px';
            jumpContainer.style.top = clamped.top + 'px';
            return; // 成功讀取並設定後直接結束
        } catch (e) {
            console.error('位置讀取錯誤，套用預設', e);
        }
    }

    // 若無記憶紀錄的「首次載入預設位置」
    if (profile === 'desktop') {
        // 電腦版預設在中間偏右
        jumpContainer.style.left = (window.innerWidth - w - 20) + 'px';
        jumpContainer.style.top = (window.innerHeight / 2 - h / 2) + 'px';
    } else {
        // 平板與手機版預設在右下方
        jumpContainer.style.left = (window.innerWidth - w - 10) + 'px';
        jumpContainer.style.top = (window.innerHeight - h - 120) + 'px';
    }
}

// 延遲 500 毫秒執行初始化，確保 DOM 長寬已經渲染完畢
setTimeout(initAndLoadPosition, 500);

// 當視窗縮放或旋轉螢幕時，強制重算邊界，防止按鈕掉出畫面
window.addEventListener('resize', () => {
    const rect = jumpContainer.getBoundingClientRect();
    const clamped = clampPosition(rect.left, rect.top, rect.width, rect.height);
    jumpContainer.style.left = clamped.left + 'px';
    jumpContainer.style.top = clamped.top + 'px';
}, { passive: true });

// ==========================================
// 4. 拖拉邏輯
// ==========================================
const handle = document.getElementById('drag-handle');
let isDragging = false;
let startX, startY, initialLeft, initialTop;

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
    
    const rect = jumpContainer.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;
    handle.style.cursor = 'grabbing';
}

function dragMove(e) {
    if (!isDragging) return;
    if (e.cancelable) e.preventDefault(); 
    
    const pos = getEventPos(e);
    const dx = pos.x - startX;
    const dy = pos.y - startY;
    
    let newLeft = initialLeft + dx;
    let newTop = initialTop + dy;
    
    const rect = jumpContainer.getBoundingClientRect();
    const clamped = clampPosition(newLeft, newTop, rect.width, rect.height);
    
    jumpContainer.style.left = clamped.left + 'px';
    jumpContainer.style.top = clamped.top + 'px';
}

function dragEnd() {
    if (isDragging) {
        isDragging = false;
        handle.style.cursor = 'grab';
        
        // 拖曳結束時，將當前座標與所屬設備類型存入硬碟
        const rect = jumpContainer.getBoundingClientRect();
        const profile = getDeviceProfile();
        localStorage.setItem(`st-chats-jump-pos-${profile}`, JSON.stringify({
            left: rect.left,
            top: rect.top
        }));
    }
}

handle.addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', dragMove, { passive: false });
document.addEventListener('mouseup', dragEnd);

handle.addEventListener('touchstart', dragStart, { passive: false });
document.addEventListener('touchmove', dragMove, { passive: false });
document.addEventListener('touchend', dragEnd);

// ==========================================
// 5. 擴充功能更新監聽器
// ==========================================
document.addEventListener('click', (e) => {
    const clickedElement = e.target.closest('div, button, i, span');
    if (!clickedElement) return;

    const isUpdate = clickedElement.classList.contains('fa-code-branch') || 
                     clickedElement.querySelector('.fa-code-branch') || 
                     clickedElement.closest('.fa-code-branch');
    if (!isUpdate) return;

    const extensionRow = clickedElement.closest('.flex-container') || clickedElement.parentElement.parentElement;
    
    if (extensionRow && extensionRow.textContent.includes('ST Chats Jump')) {
        setTimeout(() => {
            toastr.info(
                `ST Chats Jump 已在背景更新完成。<br><a href="#" onclick="location.reload(); return false;" style="text-decoration: underline; cursor: pointer; color: #fff; font-weight: bold;">Click here to reload immediately</a>`,
                '擴充功能更新',
                { escapeHtml: false, timeOut: 15000, extendedTimeOut: 5000 }
            );
        }, 1500);
    }
}, { capture: true });