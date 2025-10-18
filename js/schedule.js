// 賽程頁面 JavaScript 功能

let scheduleData = null;
let filterMode = 'month'; // 週: 'week'、月: 'month'、全部: 'all'

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
async function loadScheduleData(season = new Date().getFullYear().toString(), refresh = false) {
    const scheduleContent = document.getElementById('schedule-content');
    // 顯示載入狀態
    showLoadingState();
    try {
        const url = refresh ? `/api/schedule?season=${season}&refresh=1` : `/api/schedule?season=${season}`;
        const response = await fetch(url);
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
    const isLions = (name) => !!name && /統一.*獅/.test(name);
    const toDT = (g) => new Date(`${g.date} ${g.time || '00:00'}`);
    const now = new Date();
    const oneMonthLater = new Date(now.getTime());
    oneMonthLater.setDate(oneMonthLater.getDate() + 31);
    const oneWeekLater = new Date(now.getTime());
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);

    // 僅顯示統一獅相關比賽（主隊或客隊）的基礎集合
    const gamesAll = Array.isArray(data.games) ? data.games.filter(g => isLions(g.homeTeam) || isLions(g.awayTeam)) : [];

    // 一個月內（未來31天）的過濾條件
    const withinOneMonth = (g) => {
        const dt = toDT(g);
        return dt >= now && dt <= oneMonthLater;
    };
    // 一周內（未來7天）的過濾條件
    const withinOneWeek = (g) => {
        const dt = toDT(g);
        return dt >= now && dt <= oneWeekLater;
    };

    // 根據模式選擇集合
    let games;
    switch (filterMode) {
        case 'all':
            games = gamesAll.slice();
            break;
        case 'week':
            games = gamesAll.filter(withinOneWeek);
            break;
        case 'month':
        default:
            games = gamesAll.filter(withinOneMonth);
            break;
    }

    if (!games || games.length === 0) {
        scheduleContent.innerHTML = `
            <div class="schedule-error">
                <div class="error-icon">📅</div>
                <h3>暫無賽程</h3>
                <p>${data.season} 年僅顯示統一獅相關比賽，${filterMode === 'all' ? '目前沒有資料。' : (filterMode === 'week' ? '近一周內目前沒有資料。' : '一個月內目前沒有資料。')}</p>
                <div class="schedule-controls">
                    ${renderControls()}
                </div>
            </div>
        `;
        return;
    }

    // 依日期時間排序（降序，最晚的在最上）
    games = games.sort((a, b) => toDT(b) - toDT(a));

    const tableHTML = `
        <div class="schedule-controls">
            ${renderControls()}
        </div>
        <div class="schedule-table-container">
            <table class="schedule-table">
                <thead>
                    <tr>
                        <th>日期</th>
                        <th>時間</th>
                        <th>主隊</th>
                        <th>客隊</th>
                        <th>比分</th>
                        <th>球場</th>
                        <th>狀態</th>
                    </tr>
                </thead>
                <tbody>
                    ${games.map(game => createGameRow(game)).join('')}
                </tbody>
            </table>
        </div>
        <div class="schedule-info">
            <p>最後更新時間: ${formatDateTime(data.lastUpdated)}</p>
            <p>僅顯示統一獅相關比賽，${filterMode === 'all' ? '完整賽程' : (filterMode === 'week' ? '近一周內' : '一個月內')} 共 ${games.length} 場</p>
        </div>
    `;
    scheduleContent.innerHTML = tableHTML;
}

function renderControls() {
    const weekActive = filterMode === 'week' ? 'active' : '';
    const monthActive = filterMode === 'month' ? 'active' : '';
    const allActive = filterMode === 'all' ? 'active' : '';
    return `
        <button class="schedule-toggle-btn ${weekActive}" onclick="switchFilter('week')">近一周內</button>
        <button class="schedule-toggle-btn ${monthActive}" onclick="switchFilter('month')">一個月內</button>
        <button class="schedule-toggle-btn ${allActive}" onclick="switchFilter('all')">完整賽程</button>
    `;
}

function switchFilter(mode) {
    filterMode = mode;
    if (scheduleData) {
        displayScheduleTable(scheduleData);
    }
}

function createGameRow(game) {
    const homeTeamClass = game.homeTeam.includes('統一獅') ? 'team-name uni-lions' : 'team-name';
    const awayTeamClass = game.awayTeam.includes('統一獅') ? 'team-name uni-lions' : 'team-name';
    const statusClass = getGameStatusClass(game.status);
    const statusText = getGameStatusText(game.status);
    const scoreText = (typeof game.homeScore === 'number' && typeof game.awayScore === 'number')
        ? `${game.homeScore} - ${game.awayScore}`
        : '-';
    return `
        <tr>
            <td>${formatDate(game.date)}</td>
            <td>${game.time}</td>
            <td class="${homeTeamClass}">${game.homeTeam}</td>
            <td class="${awayTeamClass}">${game.awayTeam}</td>
            <td class="score-cell">${scoreText}</td>
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
function formatDate(dateStr) {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (e) { return dateStr; }
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
    loadScheduleData(currentYear, true);
}

// 導出函數供全域使用
window.loadScheduleData = loadScheduleData;
window.reloadSchedule = reloadSchedule;
window.switchFilter = switchFilter;