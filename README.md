# 統一獅官方網站 🦁

這是統一獅棒球隊的官方網站，包含球員資訊、啦啦隊介紹、票務資訊和即時新聞爬蟲功能。

## 🌟 功能特色

- **球員資訊展示** - 完整的球員名單和詳細資料
- **啦啦隊成員介紹** - Uni Girls 啦啦隊成員資訊
- **票務購買資訊** - 比賽門票和座位資訊
- **即時新聞爬蟲** - 自動抓取統一獅相關新聞
- **響應式設計** - 支援各種裝置螢幕

## 🚀 技術架構

- **前端**: HTML5, CSS3, JavaScript
- **後端**: Node.js (原生 HTTP 伺服器)
- **新聞來源**: RSS 爬蟲 (中央社、自由時報)
- **部署**: Render 雲端平台

## 📦 本地開發

### 安裝與運行

1. **克隆專案**
```bash
git clone [repository-url]
cd uni-lions-website
```

2. **安裝依賴**
```bash
npm install
```

3. **啟動開發伺服器**
```bash
npm start
```

4. **開啟瀏覽器**
   訪問 `http://localhost:3000`

## 🌐 部署到 Render

### 自動部署步驟

1. **推送到 GitHub**
```bash
git add .
git commit -m "準備部署到 Render"
git push origin main
```

2. **連接 Render**
   - 前往 [Render.com](https://render.com)
   - 註冊/登入帳號
   - 點擊 "New +" → "Web Service"
   - 連接您的 GitHub 儲存庫

3. **設定部署參數**
   - **Name**: `uni-lions-website`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

4. **部署完成**
   - Render 會自動建置和部署
   - 獲得線上網址: `https://your-app-name.onrender.com`

### 環境變數設定

在 Render 控制台中設定以下環境變數（如需要）：
- `NODE_ENV=production`
- `PORT` (Render 會自動設定)

## 📁 專案結構

```
├── index.html          # 首頁
├── players.html        # 球員頁面
├── cheerleaders.html   # 啦啦隊頁面
├── tickets.html        # 票務頁面
├── css/
│   └── style.css      # 樣式檔案
├── js/
│   └── main.js        # JavaScript 檔案
├── images/            # 圖片資源
├── server.js          # Node.js 伺服器
├── package.json       # 專案設定檔
├── .gitignore         # Git 忽略檔案
└── README.md          # 專案說明
```

## 🔧 新聞爬蟲功能

### RSS 新聞來源
- **中央社運動新聞**: `https://feeds.feedburner.com/rsscna/sport`
- **自由時報體育新聞**: `https://news.ltn.com.tw/rss/sports.xml`

### 關鍵字過濾
自動過濾包含以下關鍵字的新聞：
- 統一、獅、Uni-Lions、統一7-ELEVEn獅
- 球員名稱：陳傑憲、蘇智傑、林靖凱等
- 場地：台南、澄清湖
- 相關詞彙：Uni Girls、啦啦隊、中華職棒、CPBL

### API 端點
- `GET /api/news` - 獲取統一獅相關新聞 (JSON 格式)

## 🛠️ 開發指南

### 新增新聞關鍵字
在 `server.js` 中的 `unilionsKeywords` 陣列新增關鍵字：
```javascript
const unilionsKeywords = [
    // 現有關鍵字...
    '新關鍵字'
];
```

### 修改新聞來源
在 `server.js` 中的 `RSS_SOURCES` 陣列修改 RSS 來源：
```javascript
const RSS_SOURCES = [
    'https://new-rss-source.com/feed.xml'
];
```

## 📱 瀏覽器支援

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🤝 貢獻指南

1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權

MIT License - 詳見 [LICENSE](LICENSE) 檔案

## 📞 聯絡資訊

- **官方網站**: https://www.uni-lions.com.tw/
- **Facebook**: [統一7-ELEVEn獅](https://www.facebook.com/unilions)
- **Instagram**: [@unilions](https://www.instagram.com/unilions/)

---

**統一獅加油！🦁⚾**