const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

// RSS新聞來源
const RSS_SOURCES = [
    'https://feeds.feedburner.com/rsscna/sport', // 中央社運動新聞
    'https://news.ltn.com.tw/rss/sports.xml',     // 自由時報體育新聞
    'https://www.ttv.com.tw/rss/RSSHandler.ashx?d=news&t=J',  // 台視體育新聞
    'https://tw.sports.yahoo.com/rss',   //Yahoo新聞
    'https://www.sportsv.net/feed',  //運動視界
];

// 簡單的XML解析函數
function parseRSSXML(xmlData) {
    const items = [];
    
    // 使用正則表達式解析RSS項目
    const itemRegex = /<item[^>]*>([\s\s]*?)<\/item>/gi;
    const titleRegex = /<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>|<title[^>]*>(.*?)<\/title>/i;
    const linkRegex = /<link[^>]*>(.*?)<\/link>/i;
    const descRegex = /<description[^>]*><!\[CDATA\[(.*?)\]\]><\/description>|<description[^>]*>(.*?)<\/description>/i;
    const pubDateRegex = /<pubDate[^>]*>(.*?)<\/pubDate>/i;
    
    // 圖片相關的正則表達式
    const enclosureRegex = /<enclosure[^>]*url=["']([^"']*\.(jpg|jpeg|png|gif|webp))[^"']*["'][^>]*>/i;
    const mediaContentRegex = /<media:content[^>]*url=["']([^"']*\.(jpg|jpeg|png|gif|webp))[^"']*["'][^>]*>/i;
    const imgRegex = /<img[^>]*src=["']([^"']*\.(jpg|jpeg|png|gif|webp))[^"']*["'][^>]*>/i;
    
    let match;
    while ((match = itemRegex.exec(xmlData)) !== null) {
        const itemContent = match[1];
        
        const titleMatch = titleRegex.exec(itemContent);
        const linkMatch = linkRegex.exec(itemContent);
        const descMatch = descRegex.exec(itemContent);
        const dateMatch = pubDateRegex.exec(itemContent);
        
        if (titleMatch && linkMatch) {
            const title = titleMatch[1] || titleMatch[2] || '';
            const link = linkMatch[1] || '';
            const description = descMatch ? (descMatch[1] || descMatch[2] || '') : '';
            const pubDate = dateMatch ? dateMatch[1] : '';
            
            // 嘗試從多個來源提取圖片URL
            let imageUrl = "images/logo.png"; // 預設圖片
            
            // 1. 嘗試從 enclosure 標籤獲取圖片
            const enclosureMatch = enclosureRegex.exec(itemContent);
            if (enclosureMatch) {
                imageUrl = enclosureMatch[1];
            } else {
                // 2. 嘗試從 media:content 標籤獲取圖片
                const mediaMatch = mediaContentRegex.exec(itemContent);
                if (mediaMatch) {
                    imageUrl = mediaMatch[1];
                } else {
                    // 3. 嘗試從描述中的 img 標籤獲取圖片
                    const imgMatch = imgRegex.exec(description);
                    if (imgMatch) {
                        imageUrl = imgMatch[1];
                    }
                }
            }
            
            // 統一獅相關關鍵字
            const unilionsKeywords = [
                '統一獅隊', 'Uni-Lions', '統一7-ELEVEn獅', '統一獅',
                '陳傑憲', '蘇智傑', '林靖凱', '髙塩將樹', '胡智為',
                '許哲晏', '台南棒球場', 'Uni Girls', '統一獅啦啦隊',
                '林佳緯', 'UG女孩', '林安可', '林岳平'
            ];
            
            // 過濾統一獅相關新聞
            const isUnilionsRelated = unilionsKeywords.some(keyword => 
                title.includes(keyword) || description.includes(keyword)
            );
            
            if (isUnilionsRelated) {
                // 清理並保留完整的描述內容
                const fullContent = description.replace(/<[^>]*>/g, '').trim();
                const summary = fullContent.length > 150 ? fullContent.substring(0, 150) + '...' : fullContent;
                
                items.push({
                    title: title.trim(),
                    summary: summary, // 保留摘要用於卡片顯示
                    content: fullContent, // 新增完整內容
                    date: pubDate ? new Date(pubDate).toLocaleDateString('zh-TW') : new Date().toLocaleDateString('zh-TW'),
                    image: imageUrl,
                    link: link.trim()
                });
            }
        }
    }
    
    return items;
}

// 從RSS來源獲取新聞
function fetchFromRSS(rssUrl) {
    return new Promise((resolve, reject) => {
        const request = https.get(rssUrl, (response) => {
            let data = '';
            
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                try {
                    const items = parseRSSXML(data);
                    resolve(items);
                } catch (error) {
                    console.error(`解析RSS失敗 (${rssUrl}):`, error);
                    resolve([]);
                }
            });
        });
        
        request.on('error', (error) => {
            console.error(`RSS請求失敗 (${rssUrl}):`, error);
            resolve([]);
        });
        
        request.setTimeout(10000, () => {
            console.error(`RSS請求超時 (${rssUrl})`);
            request.destroy();
            resolve([]);
        });
    });
}

// 統一獅新聞爬蟲函數
async function fetchUnilionsNews() {
    try {
        console.log('開始獲取統一獅新聞...');
        
        // 並行獲取所有RSS來源
        const promises = RSS_SOURCES.map(source => fetchFromRSS(source));
        const results = await Promise.all(promises);
        
        // 合併所有新聞並去重
        let allNews = [];
        results.forEach(newsArray => {
            allNews = allNews.concat(newsArray);
        });
        
        // 按日期排序並取前6則
        allNews.sort((a, b) => new Date(b.date) - new Date(a.date));
        const uniqueNews = allNews.filter((news, index, self) => 
            index === self.findIndex(n => n.title === news.title)
        );
        
        console.log(`成功獲取 ${uniqueNews.length} 則統一獅新聞`);
        
        // 如果沒有找到相關新聞，返回一些備用新聞
        if (uniqueNews.length === 0) {
            return [
                {
                    title: "統一獅官方網站 - 最新消息",
                    summary: "請關注統一獅官方網站獲取最新球隊動態和比賽資訊。",
                    date: new Date().toLocaleDateString('zh-TW'),
                    image: "images/logo.png",
                    link: "https://www.uni-lions.com.tw/"
                }
            ];
        }
        
        return uniqueNews.slice(0, 6);
        
    } catch (error) {
        console.error('獲取新聞時發生錯誤:', error);
        
        // 返回備用新聞
        return [
            {
                title: "統一獅官方網站 - 最新消息",
                summary: "請關注統一獅官方網站獲取最新球隊動態和比賽資訊。",
                date: new Date().toLocaleDateString('zh-TW'),
                image: "images/logo.png",
                link: "https://www.uni-lions.com.tw/"
            }
        ];
    }
}

// 獲取 CPBL 賽程資料
async function fetchCPBLSchedule(season = new Date().getFullYear().toString()) {
    // 以官方 AJAX 端點抓取資料，並轉為本地結構
    async function getVerificationToken() {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'www.cpbl.com.tw',
                port: 443,
                path: '/schedule',
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
                }
            };
            const req = https.request(options, (res) => {
                let html = '';
                res.setEncoding('utf8');
                res.on('data', (chunk) => html += chunk);
                res.on('end', () => {
                    const match = html.match(/RequestVerificationToken:\s*'([^']+)'/);
                    if (match && match[1]) {
                        resolve(match[1]);
                    } else {
                        reject(new Error('未能取得驗證 Token'));
                    }
                });
            });
            req.on('error', reject);
            req.setTimeout(10000, () => { req.abort(); reject(new Error('取得 Token 超時')); });
            req.end();
        });
    }

    async function fetchGameDatas(token, kindCode = 'A', location = '') {
        return new Promise((resolve, reject) => {
            const postData = `calendar=${encodeURIComponent(`${season}/01/01`)}&location=${encodeURIComponent(location)}&kindCode=${encodeURIComponent(kindCode)}`;
            const options = {
                hostname: 'www.cpbl.com.tw',
                port: 443,
                path: '/schedule/getgamedatas',
                method: 'POST',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData),
                    'X-Requested-With': 'XMLHttpRequest',
                    'RequestVerificationToken': token
                }
            };
            const req = https.request(options, (res) => {
                let body = '';
                res.setEncoding('utf8');
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        const outer = JSON.parse(body);
                        const gameArr = outer.GameDatas ? JSON.parse(outer.GameDatas) : [];
                        resolve(gameArr);
                    } catch (e) {
                        reject(e);
                    }
                });
            });
            req.on('error', reject);
            req.setTimeout(15000, () => { req.abort(); reject(new Error('抓取 GameDatas 超時')); });
            req.write(postData);
            req.end();
        });
    }

    function toLocalSchema(rows) {
        const pad2 = (n) => String(n).padStart(2, '0');
        const parseScore = (s) => (s === undefined || s === null || s === '' || isNaN(Number(s))) ? null : Number(s);
        return rows.map(r => {
            const dateObj = new Date(r.GameDate);
            const start = r.GameDateTimeS ? new Date(r.GameDateTimeS) : (r.GameDate ? new Date(r.GameDate) : null);
            const now = new Date();
            let status = '未開始';
            if (r.IsCancel === 'Y') {
                status = '延賽';
            } else if (r.IsSuspend === 'Y') {
                status = '中止';
            } else if (r.ScoreIsComPa === 'Y' || r.GameDateTimeE) {
                status = '已結束';
            } else if (r.IsPlayBall === 'Y') {
                status = '進行中';
            } else if (start && now < start) {
                status = '未開始';
            } else if (start && now >= start) {
                status = '已結束';
            }
            const dateStr = `${dateObj.getFullYear()}-${pad2(dateObj.getMonth()+1)}-${pad2(dateObj.getDate())}`;
            const timeStr = start ? `${pad2(start.getHours())}:${pad2(start.getMinutes())}` : '';
            return {
                date: dateStr,
                time: timeStr,
                homeTeam: r.HomeTeamName || '',
                awayTeam: r.VisitingTeamName || '',
                venue: r.FieldAbbe || '',
                status,
                homeScore: parseScore(r.HomeScore),
                awayScore: parseScore(r.VisitingScore),
            };
        });
    }

    try {
        const token = await getVerificationToken();
        const gameRows = await fetchGameDatas(token, 'A', '');
        let schedule = {
            season: season,
            games: toLocalSchema(gameRows),
            lastUpdated: new Date().toISOString()
        };
        if (!schedule.games || schedule.games.length === 0) {
            schedule = getDefaultScheduleData(season);
        }
        // 新增：按照日期時間排序（升序）
        if (Array.isArray(schedule.games)) {
            const toDT = (g) => new Date(`${g.date} ${g.time || '00:00'}`);
            schedule.games.sort((a, b) => toDT(a) - toDT(b));
        }
        // 自動更新本地檔
        try {
            const dataFile = path.join(__dirname, 'data', `schedule-${season}.json`);
            fs.writeFileSync(dataFile, JSON.stringify(schedule, null, 2), 'utf8');
        } catch (e) {
            console.error('寫入本地賽程檔失敗:', e);
        }
        return schedule;
    } catch (error) {
        console.error('CPBL AJAX 抓取失敗，回退至預設/本地：', error);
        return getDefaultScheduleData(season);
    }
}

// 解析 CPBL 賽程 HTML
function parseCPBLSchedule(html, season) {
    const scheduleData = {
        season: season,
        games: [],
        lastUpdated: new Date().toISOString()
    };

    try {
        // 使用正則表達式提取賽程表格資料
        const tableRegex = /<table[^>]*class="[^"]*schedule[^"]*"[^>]*>(.*?)<\/table>/gis;
        const rowRegex = /<tr[^>]*>(.*?)<\/tr>/gis;
        const cellRegex = /<t[dh][^>]*>(.*?)<\/t[dh]>/gis;

        const tableMatch = tableRegex.exec(html);
        if (tableMatch) {
            const tableContent = tableMatch[1];
            let rowMatch;
            
            while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
                const rowContent = rowMatch[1];
                const cells = [];
                let cellMatch;
                
                while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
                    const cellText = cellMatch[1]
                        .replace(/<[^>]*>/g, '') // 移除 HTML 標籤
                        .replace(/&nbsp;/g, ' ') // 替換 &nbsp;
                        .trim();
                    cells.push(cellText);
                }
                
                // 如果有足夠的欄位，解析為比賽資料
                if (cells.length >= 5 && cells[0] && cells[1] && cells[2]) {
                    const game = {
                        date: cells[0],
                        time: cells[1],
                        homeTeam: cells[2],
                        awayTeam: cells[3],
                        venue: cells[4] || '',
                        status: cells[5] || '未開始'
                    };
                    
                    // 過濾標題行
                    if (game.date !== '日期' && game.time !== '時間') {
                        scheduleData.games.push(game);
                    }
                }
            }
        }

        console.log(`成功解析 ${scheduleData.games.length} 場比賽資料`);
        
        // 如果沒有解析到任何比賽資料，拋出錯誤以使用預設資料
        if (scheduleData.games.length === 0) {
            throw new Error('未能解析到任何比賽資料');
        }
        
        return scheduleData;
        
    } catch (error) {
        console.error('解析賽程 HTML 失敗:', error);
        return getDefaultScheduleData(season);
    }
}

// 獲取預設賽程資料
function getDefaultScheduleData(season) {
    return {
        season: season,
        games: [
            {
                date: '2024-03-23',
                time: '18:35',
                homeTeam: '統一獅',
                awayTeam: '樂天桃猿',
                venue: '台南棒球場',
                status: '已結束'
            },
            {
                date: '2024-03-24',
                time: '17:05',
                homeTeam: '中信兄弟',
                awayTeam: '統一獅',
                venue: '洲際棒球場',
                status: '已結束'
            },
            {
                date: '2024-03-26',
                time: '18:35',
                homeTeam: '統一獅',
                awayTeam: '富邦悍將',
                venue: '台南棒球場',
                status: '進行中'
            },
            {
                date: '2024-03-28',
                time: '18:35',
                homeTeam: '味全龍',
                awayTeam: '統一獅',
                venue: '天母棒球場',
                status: '未開始'
            },
            {
                date: '2024-03-30',
                time: '17:05',
                homeTeam: '統一獅',
                awayTeam: '中信兄弟',
                venue: '台南棒球場',
                status: '未開始'
            },
            {
                date: '2024-04-02',
                time: '18:35',
                homeTeam: '樂天桃猿',
                awayTeam: '統一獅',
                venue: '桃園棒球場',
                status: '未開始'
            },
            {
                date: '2024-04-05',
                time: '18:35',
                homeTeam: '統一獅',
                awayTeam: '味全龍',
                venue: '台南棒球場',
                status: '未開始'
            },
            {
                date: '2024-04-07',
                time: '17:05',
                homeTeam: '富邦悍將',
                awayTeam: '統一獅',
                venue: '新莊棒球場',
                status: '未開始'
            }
        ],
        lastUpdated: new Date().toISOString()
    };
}

const server = http.createServer(async (req, res) => {
    // 改用 WHATWG URL API 解析請求 URL
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = requestUrl.pathname;
    
    // API端點：獲取統一獅新聞
    if (pathname === '/api/news' && req.method === 'GET') {
        try {
            const news = await fetchUnilionsNews();
            res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify(news));
            return;
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '無法獲取新聞資料' }));
            return;
        }
    }
    
    // API端點：獲取賽程資料（支援例行賽和季後賽）
    // 變更：預設當年度，優先回應本地檔，過期時自動刷新，支援 kindCode 參數
    if (pathname === '/api/schedule' && req.method === 'GET') {
        try {
            const reqSeason = requestUrl.searchParams.get('season') || new Date().getFullYear().toString();
            const season = reqSeason;
            const forceRefresh = requestUrl.searchParams.get('refresh') === '1';
            const dataFile = path.join(__dirname, 'data', `schedule-${season}.json`);
            let shouldRefresh = true;
            if (fs.existsSync(dataFile)) {
                try {
                    const fileContent = fs.readFileSync(dataFile, 'utf8');
                    const localData = JSON.parse(fileContent);
                    if (localData.lastUpdated) {
                        const ageMs = Date.now() - new Date(localData.lastUpdated).getTime();
                        // 一天內不刷新，直接回本地（除非指定強制刷新）
                        if (!forceRefresh && ageMs < 24 * 60 * 60 * 1000 && Array.isArray(localData.games) && localData.games.length > 0) {
                            shouldRefresh = false;
                            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                            res.end(JSON.stringify(localData));
                            return;
                        }
                    }
                } catch {}
            }
            // 刷新或不存在：抓取官方，並寫入本地
            const schedule = await fetchCPBLSchedule(season);
            try {
                fs.writeFileSync(dataFile, JSON.stringify(schedule, null, 2), 'utf8');
            } catch (e) { console.error('更新本地檔失敗:', e); }
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify(schedule));
            return;
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '無法獲取賽程資料' }));
            return;
        }
    }
    
    // 獲取請求的URL路徑
    let filePath = '.' + pathname;
    
    // 如果路徑是'/'，則默認為index.html
    if (filePath === './') {
        filePath = './index.html';
    }

    // 獲取文件擴展名
    const extname = path.extname(filePath);
    
    // 設置默認的內容類型
    let contentType = 'text/html';
    
    // 根據文件擴展名設置適當的內容類型
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpg';
            break;
        case '.svg':
            contentType = 'image/svg+xml';
            break;
    }

    // 讀取文件
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // 頁面未找到
                fs.readFile('./404.html', (err, content) => {
                    if (err) {
                        // 如果404頁面也不存在，則返回一個簡單的404消息
                        res.writeHead(404);
                        res.end('404 Not Found');
                    } else {
                        res.writeHead(404, { 'Content-Type': 'text/html' });
                        res.end(content, 'utf-8');
                    }
                });
            } else {
                // 服務器錯誤
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            // 成功響應
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`伺服器運行在 http://localhost:${PORT}/`);
});
