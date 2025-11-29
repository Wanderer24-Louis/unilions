// 賽程頁面 JavaScript 功能

let scheduleData = [];
let filterMode = 'month'; // 'week', 'month', 'all'
let gameType = 'A'; // 'A'=例行賽, 'E'=季後賽

// 載入賽程資料
async function loadScheduleData(refresh = false, kindCode = 'A') {
    try {
        const currentYear = new Date().getFullYear();
        let url = `/api/schedule?season=${currentYear}`;
        if (kindCode) {
            url += `&kindCode=${kindCode}`;
        }
        if (refresh) {
            url += '&refresh=1';
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.games && Array.isArray(data.games)) {
            scheduleData = data.games;
            displayScheduleTable();
        } else {
            console.error('賽程資料格式錯誤:', data);
            document.getElementById('schedule-table').innerHTML = '<p>無法載入賽程資料</p>';
        }
    } catch (error) {
        console.error('載入賽程資料時發生錯誤:', error);
        document.getElementById('schedule-table').innerHTML = '<p>載入賽程資料時發生錯誤</p>';
    }
}

// 重新載入賽程
function reloadSchedule() {
    loadScheduleData(true, gameType);
}

// 切換賽事類型
function switchGameType(newGameType) {
    gameType = newGameType;
    loadScheduleData(false, gameType);
}

// 切換篩選模式
function switchFilter(newMode) {
    filterMode = newMode;
    displayScheduleTable();
}

// 檢查日期是否在一週內
function withinOneWeek(gameDate) {
    const today = new Date();
    const game = new Date(gameDate);
    const diffTime = game - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
}

// 檢查日期是否在一個月內
function withinOneMonth(gameDate) {
    const today = new Date();
    const game = new Date(gameDate);
    const diffTime = game - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 31;
}

// 渲染控制按鈕
function renderControls() {
    const gameTypeButtons = `
        <div class="game-type-controls" style="margin-bottom: 15px;">
            <button onclick="switchGameType('A')" class="${gameType === 'A' ? 'active' : ''}">例行賽</button>
            <button onclick="switchGameType('E')" class="${gameType === 'E' ? 'active' : ''}">季後挑戰賽</button>
        </div>
    `;
    
    const filterButtons = `
        <div class="filter-controls" style="margin-bottom: 15px;">
            <button onclick="switchFilter('week')" class="${filterMode === 'week' ? 'active' : ''}">近一周內</button>
            <button onclick="switchFilter('month')" class="${filterMode === 'month' ? 'active' : ''}">一個月內</button>
            <button onclick="switchFilter('all')" class="${filterMode === 'all' ? 'active' : ''}">完整賽程</button>
            <button onclick="reloadSchedule()" style="margin-left: 20px;">重新載入</button>
        </div>
    `;
    
    return gameTypeButtons + filterButtons;
}

// 顯示賽程表格
function displayScheduleTable() {
    const tableContainer = document.getElementById('schedule-table');
    
    if (!scheduleData || scheduleData.length === 0) {
        tableContainer.innerHTML = renderControls() + '<p>目前沒有賽程資料</p>';
        return;
    }

    // 篩選統一獅的比賽
    let lionsGames = scheduleData.filter(game => 
        game.homeTeam === '統一獅' || game.awayTeam === '統一獅'
    );

    // 根據篩選模式進行篩選
    if (filterMode === 'week') {
        lionsGames = lionsGames.filter(game => withinOneWeek(game.date));
    } else if (filterMode === 'month') {
        lionsGames = lionsGames.filter(game => withinOneMonth(game.date));
    }
    // 'all' 模式不進行額外篩選

    // 按日期和時間排序（降序）
    lionsGames.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateB - dateA; // 降序排列
    });

    if (lionsGames.length === 0) {
        const modeText = filterMode === 'week' ? '近一周內' : filterMode === 'month' ? '一個月內' : '完整賽程';
        const gameTypeText = gameType === 'A' ? '例行賽' : '季後挑戰賽';
        tableContainer.innerHTML = renderControls() + `<p>目前沒有${modeText}的統一獅${gameTypeText}賽程</p>`;
        return;
    }

    let tableHTML = renderControls() + `
        <table>
            <thead>
                <tr>
                    <th>日期</th>
                    <th>時間</th>
                    <th>主隊</th>
                    <th>客隊</th>
                    <th>球場</th>
                    <th>狀態</th>
                    <th>比分</th>
                </tr>
            </thead>
            <tbody>
    `;

    lionsGames.forEach(game => {
        // 處理比分顯示
        let scoreDisplay = '-';
        if (game.homeScore !== null && game.homeScore !== undefined && 
            game.awayScore !== null && game.awayScore !== undefined) {
            scoreDisplay = `${game.homeScore} : ${game.awayScore}`;
        }

        tableHTML += `
            <tr>
                <td>${game.date}</td>
                <td>${game.time}</td>
                <td>${game.homeTeam}</td>
                <td>${game.awayTeam}</td>
                <td>${game.venue}</td>
                <td>${game.status}</td>
                <td>${scoreDisplay}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    tableContainer.innerHTML = tableHTML;
}

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', function() {
    loadScheduleData();
});