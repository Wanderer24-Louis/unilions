const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
    // 獲取請求的URL路徑
    let filePath = '.' + req.url;
    
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