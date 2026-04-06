const express = require('express');
const http = require('http');
const https = require('https');
const { Server } = require("socket.io");
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');

const app = express();
const parser = new Parser();

app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Ensure DATA_DIR is correct absolute path
const DATA_DIR = path.join(__dirname, 'data');
console.log(`[INIT] Server starting...`);
console.log(`[INIT] __dirname: ${__dirname}`);
console.log(`[INIT] Forced DATA_DIR: ${DATA_DIR}`);
console.log(`[INIT] process.env.DATA_DIR was: ${process.env.DATA_DIR}`);

try {
    if (!fs.existsSync(DATA_DIR)) {
        console.log(`[INIT] Creating DATA_DIR: ${DATA_DIR}`);
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
} catch (err) {
    console.error(`[INIT] Error creating DATA_DIR:`, err);
}

function getImageFromRssItem(item) {
    let image = 'images/logo.png';
    if (item.enclosure && item.enclosure.url) {
        image = item.enclosure.url;
    } else if (item['media:content'] && item['media:content']['$'] && item['media:content']['$'].url) {
        image = item['media:content']['$'].url;
    } else if (item['media:thumbnail'] && item['media:thumbnail']['$'] && item['media:thumbnail']['$'].url) {
        image = item['media:thumbnail']['$'].url;
    } else {
        const html = item['content:encoded'] || item.content || '';
        if (html) {
            const imgMatch = html.match(/<img[^>]+src="([^">]+)"/i);
            if (imgMatch) {
                image = imgMatch[1];
            }
        }
    }
    return image;
}

function fetchOgImage(url) {
    return new Promise(resolve => {
        try {
            if (!url) {
                return resolve(null);
            }
            const client = url.startsWith('https') ? https : http;
            const req = client.get(url, res => {
                if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    return resolve(fetchOgImage(res.headers.location));
                }
                let data = '';
                res.on('data', chunk => {
                    if (data.length < 200000) {
                        data += chunk.toString('utf8');
                    }
                });
                res.on('end', () => {
                    try {
                        const ogMatch = data.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
                        const nameMatch = data.match(/<meta[^>]+name=["']og:image["'][^>]*content=["']([^"']+)["']/i);
                        const twMatch = data.match(/<meta[^>]+name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
                        let raw = null;
                        if (ogMatch) {
                            raw = ogMatch[1];
                        } else if (nameMatch) {
                            raw = nameMatch[1];
                        } else if (twMatch) {
                            raw = twMatch[1];
                        }
                        if (!raw) {
                            return resolve(null);
                        }
                        try {
                            const u = new URL(raw, url);
                            return resolve(u.toString());
                        } catch {
                            return resolve(raw);
                        }
                    } catch {
                        return resolve(null);
                    }
                });
            });
            req.on('error', () => resolve(null));
            req.setTimeout(5000, () => {
                req.destroy();
                resolve(null);
            });
        } catch {
            resolve(null);
        }
    });
}

async function buildNewsItems(feedItems) {
    const items = (feedItems || []).slice(0, 20);
    const mapped = await Promise.all(items.map(async item => {
        let image = getImageFromRssItem(item);
        if (!image || image === 'images/logo.png') {
            const og = await fetchOgImage(item.link);
            if (og) {
                image = og;
            }
        }
        return {
            title: item.title,
            summary: item.contentSnippet || item.content || '',
            content: item.content || item.contentSnippet || '',
            date: new Date(item.pubDate).toLocaleDateString('zh-TW'),
            link: item.link,
            image
        };
    }));
    return mapped;
}

// API Endpoint for fetching news
app.get('/api/news', async (req, res) => {
    try {
        const feed = await parser.parseURL('https://news.google.com/rss/search?q=%E7%B5%B1%E4%B8%80%E7%8D%85&hl=zh-TW&gl=TW&ceid=TW:zh-Hant');
        const newsItems = await buildNewsItems(feed.items);

        res.json(newsItems);
    } catch (error) {
        console.error('Error fetching RSS:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

// API Endpoint for fetching UniGirls-specific news
app.get('/api/unigirls-news', async (req, res) => {
    try {
        const query = encodeURIComponent('統一獅 啦啦隊 OR UniGirls OR Uni Girls OR Uni-Girls');
        const url = `https://news.google.com/rss/search?q=${query}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
        const feed = await parser.parseURL(url);
        const newsItems = await buildNewsItems(feed.items);

        res.json(newsItems);
    } catch (error) {
        console.error('Error fetching UniGirls RSS:', error);
        res.status(500).json({ error: 'Failed to fetch UniGirls news' });
    }
});

// Simple in-memory cache for weather
let weatherCache = {
    data: null,
    timestamp: 0
};
const WEATHER_CACHE_TTL = 5 * 60 * 1000;

// API Endpoint for fetching Tainan weather forecast from CWA RSS
app.get('/api/weather', async (req, res) => {
    try {
        const now = Date.now();
        if (weatherCache.data && (now - weatherCache.timestamp) < WEATHER_CACHE_TTL) {
            return res.json(weatherCache.data);
        }
        const rssUrl = 'https://www.cwa.gov.tw/rss/forecast/36_13.xml';
        const feed = await parser.parseURL(rssUrl);
        const items = (feed.items || []).slice(0, 3).map(item => ({
            title: item.title,
            description: item.content || item.contentSnippet || '',
            date: new Date(item.pubDate).toLocaleString('zh-TW'),
            link: item.link
        }));
        const payload = {
            source: '中央氣象署RSS',
            updatedAt: new Date(feed.lastBuildDate || Date.now()).toLocaleString('zh-TW'),
            items
        };
        weatherCache = { data: payload, timestamp: now };
        res.json(payload);
    } catch (error) {
        console.error('Error fetching weather RSS:', error);
        res.status(500).json({ error: 'Failed to fetch weather' });
    }
});

// API Endpoint for fetching schedule
// Helper to refresh schedule data from CPBL
async function refreshScheduleData(season, kindCode = 'A') {
    try {
        console.log(`[REFRESH] Refreshing schedule for season ${season}, kindCode ${kindCode}...`);
        
        if (season !== '2026') return null;

        const targetFile = `schedule-${season}.json`;
        const filePath = path.join(DATA_DIR, targetFile);
        
        if (!fs.existsSync(filePath)) return null;
        
        let localData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        let updated = false;

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const months = [currentMonth];
        if (currentMonth > 3) months.push(currentMonth - 1);

        for (const month of months) {
            if (month < 3 || month > 11) continue; 
            
            // Step 1: Get Token and Cookie
            const baseUrl = `https://www.cpbl.com.tw/schedule?year=${season}&month=${month.toString().padStart(2, '0')}&_=${Date.now()}`;
            console.log(`[REFRESH] Fetching token and cookies from ${baseUrl}...`);
            
            const sessionResponse = await axios.get(baseUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 10000
            });

            const cookies = sessionResponse.headers['set-cookie'];
            if (!cookies) {
                console.log(`[REFRESH] No cookies found for month ${month}, skipping...`);
                continue;
            }

            const $ = cheerio.load(sessionResponse.data);
            
            // Try to find the specific token used in AJAX calls (often longer than the hidden input)
            let token = '';
            const scriptContent = $('script').text();
            const ajaxTokenMatch = scriptContent.match(/RequestVerificationToken:\s*'([^']+)'/);
            
            if (ajaxTokenMatch) {
                token = ajaxTokenMatch[1];
                console.log(`[REFRESH] Found AJAX token for month ${month}`);
            } else {
                token = $('input[name="__RequestVerificationToken"]').val();
                console.log(`[REFRESH] Using hidden field token for month ${month}`);
            }

            if (!token) {
                console.log(`[REFRESH] No token found for month ${month}, skipping...`);
                continue;
            }

            // Step 2: Post to get JSON data
            const apiUrl = 'https://www.cpbl.com.tw/schedule/getgamedatas';
            const postData = qs.stringify({
                calendar: `${season}/01/01`,
                kindCode: kindCode,
                location: ''
            });

            console.log(`[REFRESH] Posting to ${apiUrl} for month ${month}...`);
            const apiResponse = await axios.post(apiUrl, postData, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'RequestVerificationToken': token,
                    'Cookie': cookies.join('; '),
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': `https://www.cpbl.com.tw/schedule?year=${season}&month=${month.toString().padStart(2, '0')}`,
                    'Origin': 'https://www.cpbl.com.tw'
                },
                timeout: 10000
            });

            if (apiResponse.data && apiResponse.data.GameDatas) {
                const games = JSON.parse(apiResponse.data.GameDatas);
                console.log(`[REFRESH] Found ${games.length} games in month ${month}`);
                
                if (games.length > 0) {
                    console.log(`[REFRESH] Game object keys: ${Object.keys(games[0]).join(', ')}`);
                }

                games.forEach(cpblGame => {
                    // GameDate: "2026/04/01 18:35:00"
                    const gameDate = cpblGame.GameDate.substring(0, 10).replace(/\//g, '-');
                    const homeTeamName = cpblGame.HomeTeamName;
                    const visitingTeamName = cpblGame.VisitingTeamName;
                    
                    // GameStatus mapping
                    let statusText = '未開賽';
                    const presentStatus = parseInt(cpblGame.PresentStatus || 0);
                    const isGameStop = parseInt(cpblGame.IsGameStop || 0);
                    const isPlayBall = cpblGame.IsPlayBall === 'Y';
                    
                    if (cpblGame.GameDateTimeE) {
                        statusText = '已結束';
                    } else if (presentStatus === 2 || isPlayBall) {
                        statusText = '進行中';
                    } else if (isGameStop === 1 || cpblGame.GameStatus == 6 || cpblGame.GameResult == 1) {
                        statusText = '延賽';
                    }
                    
                    localData.games.forEach(game => {
                        if (game.date === gameDate && 
                            (game.homeTeam.includes(homeTeamName) || homeTeamName.includes(game.homeTeam)) &&
                            (game.awayTeam.includes(visitingTeamName) || visitingTeamName.includes(game.awayTeam))) {
                            
                            const newHomeScore = parseInt(cpblGame.HomeScore || 0);
                            const newAwayScore = parseInt(cpblGame.VisitingScore || 0);
                            
                            // Log for debugging
                            if (game.date === '2026-03-29' || game.date === '2026-04-04' || game.date === '2026-04-06') {
                                console.log(`[REFRESH] Debug ${gameDate}: Status=${presentStatus}, Stop=${isGameStop}, Play=${cpblGame.IsPlayBall}, EndTime=${cpblGame.GameDateTimeE}, Result=${cpblGame.GameResult}`);
                            }

                            if (game.homeScore !== newHomeScore || game.awayScore !== newAwayScore || game.status !== statusText) {
                                console.log(`[REFRESH] Updating game on ${gameDate}: ${game.homeTeam} ${newHomeScore} : ${newAwayScore} ${game.awayTeam} (${statusText})`);
                                game.homeScore = newHomeScore;
                                game.awayScore = newAwayScore;
                                game.status = statusText;
                                updated = true;
                            }
                        }
                    });
                });
            } else {
                console.log(`[REFRESH] No GameDatas returned for month ${month}`);
            }
        }

        if (updated) {
            fs.writeFileSync(filePath, JSON.stringify(localData, null, 2), 'utf8');
            console.log(`[REFRESH] Saved updated schedule to ${targetFile}`);
        }

        return localData;
    } catch (error) {
        console.error('[REFRESH] Error refreshing schedule:', error.message);
        return null;
    }
}

app.get('/api/schedule', async (req, res) => {
    try {
        const season = req.query.season || new Date().getFullYear().toString();
        const kindCode = req.query.kindCode;
        const refresh = req.query.refresh === '1';
        
        let targetFile = `schedule-${season}.json`;
        
        if (kindCode) {
             const specificFile = `schedule-${season}-${kindCode}.json`;
             if (fs.existsSync(path.join(DATA_DIR, specificFile))) {
                 targetFile = specificFile;
             }
        }
        
        const filePath = path.join(DATA_DIR, targetFile);
        
        if (refresh) {
            const refreshedData = await refreshScheduleData(season, kindCode);
            if (refreshedData) {
                return res.json(refreshedData);
            }
        }

        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            res.json(JSON.parse(data));
        } else {
            res.status(404).json({ error: 'Schedule not found', season, kindCode });
        }
    } catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).json({ error: 'Failed to fetch schedule' });
    }
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for testing; restrict in production
        methods: ["GET", "POST"]
    }
});

const VISITS_FILE = path.join(DATA_DIR, 'visits.json');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedbacks.json');

// Helper to read total visits
function getVisits() {
    try {
        if (fs.existsSync(VISITS_FILE)) {
            const data = fs.readFileSync(VISITS_FILE, 'utf8');
            return JSON.parse(data).total || 0;
        }
    } catch (err) {
        console.error("Error reading data file:", err);
    }
    return 0;
}

// Helper to write total visits
function saveVisits(count) {
    try {
        fs.writeFileSync(VISITS_FILE, JSON.stringify({ total: count }), 'utf8');
    } catch (err) {
        console.error("Error writing data file:", err);
    }
}

app.post('/api/feedback', (req, res) => {
    try {
        const { name = '', email = '', subject = '', message = '' } = req.body || {};
        const trimmed = {
            name: String(name).trim().slice(0, 100),
            email: String(email).trim().slice(0, 200),
            subject: String(subject).trim().slice(0, 200),
            message: String(message).trim().slice(0, 2000)
        };
        if (!trimmed.message) {
            return res.status(400).json({ error: 'message_required' });
        }
        const entry = {
            id: Date.now().toString(36),
            ...trimmed,
            createdAt: new Date().toISOString()
        };
        let list = [];
        if (fs.existsSync(FEEDBACK_FILE)) {
            try {
                const data = fs.readFileSync(FEEDBACK_FILE, 'utf8');
                list = JSON.parse(data) || [];
            } catch {}
        }
        list.push(entry);
        fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(list), 'utf8');
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: 'save_failed' });
    }
});

// Initialize counts
let onlineUsers = 0;
let totalVisits = getVisits();

io.on('connection', (socket) => {
    // 1. A new user connected
    onlineUsers++;
    
    // 2. Increment total visits (simple logic: 1 connection = 1 visit)
    // In a real app, you might want to debounce this based on IP or session
    totalVisits++;
    saveVisits(totalVisits);

    console.log(`User connected. Online: ${onlineUsers}, Total: ${totalVisits}`);

    // 3. Broadcast updated counts to ALL clients
    io.emit('updateCounts', {
        online: onlineUsers,
        total: totalVisits
    });

    // 4. Handle disconnect
    socket.on('disconnect', () => {
        onlineUsers--;
        if (onlineUsers < 0) onlineUsers = 0; // Safety check
        
        console.log(`User disconnected. Online: ${onlineUsers}`);
        
        io.emit('updateCounts', {
            online: onlineUsers,
            total: totalVisits
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to see the site`);
});
