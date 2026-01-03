const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const Parser = require('rss-parser');

const app = express();
const parser = new Parser();

app.use(cors());

// Serve static files from the current directory
app.use(express.static(__dirname));

// API Endpoint for fetching news
app.get('/api/news', async (req, res) => {
    try {
        // Use Google News RSS for Unified Lions
        const feed = await parser.parseURL('https://news.google.com/rss/search?q=%E7%B5%B1%E4%B8%80%E7%8D%85&hl=zh-TW&gl=TW&ceid=TW:zh-Hant');
        
        const newsItems = feed.items.slice(0, 20).map(item => {
            // Extract image from content if possible, otherwise use default
            // Google News RSS doesn't always provide image in a clean way, so we might need a default
            let image = 'images/logo.png'; // Default
            
            // Try to find an image in contentSnippet or content (simple regex)
            const imgMatch = item.content && item.content.match(/src="([^"]+)"/);
            if (imgMatch) {
                image = imgMatch[1];
            }

            return {
                title: item.title,
                summary: item.contentSnippet || item.content || '',
                content: item.content || item.contentSnippet || '',
                date: new Date(item.pubDate).toLocaleDateString('zh-TW'),
                link: item.link,
                image: image
            };
        });

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
        
        const newsItems = feed.items.slice(0, 20).map(item => {
            let image = 'images/logo.png';
            const imgMatch = item.content && item.content.match(/src="([^"]+)"/);
            if (imgMatch) {
                image = imgMatch[1];
            }
            return {
                title: item.title,
                summary: item.contentSnippet || item.content || '',
                content: item.content || item.contentSnippet || '',
                date: new Date(item.pubDate).toLocaleDateString('zh-TW'),
                link: item.link,
                image: image
            };
        });

        res.json(newsItems);
    } catch (error) {
        console.error('Error fetching UniGirls RSS:', error);
        res.status(500).json({ error: 'Failed to fetch UniGirls news' });
    }
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for testing; restrict in production
        methods: ["GET", "POST"]
    }
});

// Path to data file
const DATA_FILE = path.join(__dirname, 'data', 'visits.json');

// Helper to read total visits
function getVisits() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
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
        // Ensure directory exists
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify({ total: count }), 'utf8');
    } catch (err) {
        console.error("Error writing data file:", err);
    }
}

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
