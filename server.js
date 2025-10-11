const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

// 新聞爬蟲函數
function fetchUnilionsNews() {
    return new Promise((resolve, reject) => {
        // 模擬統一獅新聞數據（實際應用中可以爬取真實新聞網站）
        const mockNews = [
            {
                title: "統一獅主場迎戰富邦悍將，力拼三連勝",
                summary: "統一獅將在台南棒球場迎戰富邦悍將，球迷期待球隊延續勝利氣勢。",
                date: new Date().toLocaleDateString('zh-TW'),
                image: "images/news1.jpg",
                link: "#"
            },
            {
                title: "陳傑憲單場雙響砲，助球隊逆轉勝",
                summary: "統一獅隊長陳傑憲在昨日比賽中敲出兩支全壘打，帶領球隊完成大逆轉。",
                date: new Date(Date.now() - 86400000).toLocaleDateString('zh-TW'),
                image: "images/news2.jpg",
                link: "#"
            },
            {
                title: "Uni Girls推出新舞蹈，球迷熱烈回響",
                summary: "統一獅啦啦隊Uni Girls推出全新應援舞蹈，在社群媒體上獲得廣大迴響。",
                date: new Date(Date.now() - 172800000).toLocaleDateString('zh-TW'),
                image: "images/news3.jpg",
                link: "#"
            },
            {
                title: "統一獅新秀投手表現亮眼，獲教練團肯定",
                summary: "年輕投手在春訓中展現優異表現，有望成為球隊輪值投手。",
                date: new Date(Date.now() - 259200000).toLocaleDateString('zh-TW'),
                image: "images/news1.jpg",
                link: "#"
            }
        ];
        
        // 模擬網路延遲
        setTimeout(() => {
            resolve(mockNews);
        }, 500);
    });
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
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