// 賽程頁面 JavaScript 功能

let scheduleData = null;

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeSchedulePage();
});

// 初始化賽程頁面
function initializeSchedulePage() {
    const currentYear = new Date().getFullYear().toString();
    updateScheduleHeader(currentYear);
    loadScheduleData(currentYear); // 改為當年度
}

// 新增：動態更新標題年份
function updateScheduleHeader(year) {
    const header = document.querySelector('.schedule-header h1');
    if (header) {
        header.textContent = `統一獅 ${year} 年賽程表`;
    }
}

// 載入賽程資料
async function loadScheduleData(season = new Date().getFullYear().toString()) {
    const scheduleContent = document.getElementById('schedule-content');
    // 顯示載入狀態
    showLoadingState();
    try {
        const response = await fetch(`/api/schedule?season=${season}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        scheduleData = await response.json();
        displayScheduleTable(scheduleData);
    } catch (error) {
        console.error('載入賽程資料失敗:', error);
        showErrorState();
    }
}

// 顯示載入狀態
function showLoadingState() {
    const scheduleContent = document.getElementById('schedule-content');
    scheduleContent.innerHTML = `
        <div class="schedule-loading">
            <div class="spinner"></div>
            <p>載入賽程資料中...</p>
        </div>
    `;
}

// 顯示錯誤狀態
function showErrorState() {
    const scheduleContent = document.getElementById('schedule-content');
    scheduleContent.innerHTML = `
        <div class="schedule-error">
            <div class="error-icon">⚠️</div>
            <h3>載入失敗</h3>
            <p>無法載入賽程資料，請檢查網路連線或稍後再試。</p>
            <button class="schedule-retry-btn" onclick="reloadSchedule()">
                重新載入
            </button>
        </div>
    `;
}

// 顯示賽程表格
function displayScheduleTable(data) {
    const scheduleContent = document.getElementById('schedule-content');
    
    if (!data.games || data.games.length === 0) {
        scheduleContent.innerHTML = `
            <div class="schedule-error">
                <div class="error-icon">📅</div>
                <h3>暫無賽程</h3>
                <p>${data.season} 年賽季暫無賽程資料。</p>
            </div>
        `;
        return;
    }
    
    const tableHTML = `
        <div class="schedule-table-container">
            <table class="schedule-table">
                <thead>
                    <tr>
                        <th>日期</th>
                        <th>時間</th>
                        <th>主隊</th>
                        <th>客隊</th>
                        <th>球場</th>
                        <th>狀態</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.games.map(game => createGameRow(game)).join('')}
                </tbody>
            </table>
        </div>
        <div class="schedule-info">
            <p>最後更新時間: ${formatDateTime(data.lastUpdated)}</p>
            <p>共 ${data.games.length} 場比賽</p>
        </div>
    `;
    
    scheduleContent.innerHTML = tableHTML;
}

// 建立比賽行
function createGameRow(game) {
    const homeTeamClass = game.homeTeam.includes('統一獅') ? 'team-name uni-lions' : 'team-name';
    const awayTeamClass = game.awayTeam.includes('統一獅') ? 'team-name uni-lions' : 'team-name';
    
    const statusClass = getGameStatusClass(game.status);
    const statusText = getGameStatusText(game.status);
    
    return `
        <tr>
            <td>${formatDate(game.date)}</td>
            <td>${game.time}</td>
            <td class="${homeTeamClass}">${game.homeTeam}</td>
            <td class="${awayTeamClass}">${game.awayTeam}</td>
            <td class="venue-info">${game.venue}</td>
            <td><span class="game-status ${statusClass}">${statusText}</span></td>
        </tr>
    `;
}

// 獲取比賽狀態樣式類別
function getGameStatusClass(status) {
    switch (status) {
        case '進行中':
        case 'LIVE':
            return 'live';
        case '已結束':
        case '結束':
            return 'finished';
        default:
            return 'upcoming';
    }
}

// 獲取比賽狀態文字
function getGameStatusText(status) {
    switch (status) {
        case '進行中':
        case 'LIVE':
            return '🔴 進行中';
        case '已結束':
        case '結束':
            return '✅ 已結束';
        case '未開始':
        default:
            return '⏰ 未開始';
    }
}

// 格式化日期
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        const weekday = weekdays[date.getDay()];
        
        return `${month}/${day} (${weekday})`;
    } catch (error) {
        return dateString;
    }
}

// 格式化日期時間
function formatDateTime(dateTimeString) {
    try {
        const date = new Date(dateTimeString);
        return date.toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return dateTimeString;
    }
}

// 重新載入賽程資料
function reloadSchedule() {
    const currentYear = new Date().getFullYear().toString();
    loadScheduleData(currentYear);
}

// 導出函數供全域使用
window.loadScheduleData = loadScheduleData;
window.reloadSchedule = reloadSchedule;