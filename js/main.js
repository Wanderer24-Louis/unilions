// 導航選單切換
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('nav');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            nav.classList.toggle('active');
        });
    }

    // FAQ 切換
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            item.classList.toggle('active');
        });
    });

    // 球員過濾功能
    const filterBtns = document.querySelectorAll('.filter-btn');
    const playerCards = document.querySelectorAll('.player-card');
    
    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // 移除所有按鈕的 active 類
                filterBtns.forEach(b => b.classList.remove('active'));
                
                // 添加當前按鈕的 active 類
                btn.classList.add('active');
                
                const filter = btn.getAttribute('data-filter');
                
                // 顯示或隱藏球員卡片
                playerCards.forEach(card => {
                    if (filter === 'all') {
                        card.style.display = 'block';
                    } else {
                        const position = card.getAttribute('data-position');
                        if (position === filter) {
                            card.style.display = 'block';
                        } else {
                            card.style.display = 'none';
                        }
                    }
                });
            });
        });
    }

    const nc = document.querySelector('.news-container');
    if (nc && nc.id !== 'weather-container' && nc.getAttribute('data-source') !== 'unigirls') {
        loadUnilionsNews();
    }

    const weatherContainer = document.getElementById('weather-container');
    if (weatherContainer) {
        loadWeatherForecast(weatherContainer);
    }

    const stadiumSelect = document.getElementById('stadium-select');
    const stadiumTabs = document.querySelectorAll('.stadium-tab');
    const entries = document.querySelectorAll('.stadium-entry');
    const showStadium = (val) => {
        entries.forEach(el => {
            el.style.display = (el.getAttribute('data-stadium') === val) ? 'block' : 'none';
        });
        stadiumTabs.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-stadium') === val);
        });
    };
    if (stadiumTabs.length > 0) {
        showStadium(document.querySelector('.stadium-tab.active').getAttribute('data-stadium'));
        stadiumTabs.forEach(btn => {
            btn.addEventListener('click', () => showStadium(btn.getAttribute('data-stadium')));
        });
    } else if (stadiumSelect) {
        showStadium(stadiumSelect.value);
        stadiumSelect.addEventListener('change', () => showStadium(stadiumSelect.value));
    }
});

// 載入統一獅新聞的函數
async function loadUnilionsNews() {
    const newsContainer = document.querySelector('.news-container');
    
    if (!newsContainer) {
        return; // 如果不在相關頁面，就不執行
    }

    try {
        // 顯示載入中的狀態
        newsContainer.innerHTML = `
            <div class="loading-news">
                <i class="fas fa-spinner fa-spin"></i>
                <p>正在載入最新消息...</p>
            </div>
        `;

        // 從API獲取新聞
        const response = await fetch('/api/news');
        const news = await response.json();

        if (response.ok && news.length > 0) {
            // 清空容器並顯示新聞
            newsContainer.innerHTML = '';
            
            // 判斷是否需要限制顯示數量
            // 檢查容器是否有 data-limit="all" 屬性
            const limit = newsContainer.getAttribute('data-limit');
            const displayNews = (limit === 'all') ? news : news.slice(0, 3);
            
            displayNews.forEach((article, index) => {
                const newsCard = document.createElement('div');
                newsCard.className = 'news-card';
                const cardId = `news-card-${index}`;
                
                newsCard.innerHTML = `
                    <div class="news-image-container">
                        <img src="${article.image}" alt="${article.title}" onerror="this.src='images/logo.png'">
                    </div>
                    <div class="news-content">
                        <h3>${article.title}</h3>
                        <div class="news-summary">
                            <p>${article.summary}</p>
                        </div>
                        <div class="news-full-content" id="content-${cardId}" style="display: none;">
                            <p>${article.content || article.summary}</p>
                        </div>
                        <div class="news-meta">
                            <span class="news-date">${article.date}</span>
                            <button class="toggle-content-btn" onclick="toggleNewsContent('${cardId}')">
                                <span class="expand-text">展開全文</span>
                                <span class="collapse-text" style="display: none;">收起</span>
                            </button>
                            <a href="${article.link}" class="read-more" target="_blank">原文連結</a>
                        </div>
                    </div>
                `;
                newsContainer.appendChild(newsCard);
            });
        } else {
            throw new Error('無法載入新聞');
        }
    } catch (error) {
        console.error('載入新聞時發生錯誤:', error);
        newsContainer.innerHTML = `
            <div class="news-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>暫時無法載入最新消息，請稍後再試</p>
                <button onclick="loadUnilionsNews()" class="retry-btn">重新載入</button>
            </div>
        `;
    }
}

// 展開/收起新聞內容功能
function toggleNewsContent(cardId) {
    const summaryElement = document.querySelector(`#content-${cardId}`).parentElement.querySelector('.news-summary');
    const fullContentElement = document.getElementById(`content-${cardId}`);
    const toggleBtn = document.querySelector(`button[onclick="toggleNewsContent('${cardId}')"]`);
    const expandText = toggleBtn.querySelector('.expand-text');
    const collapseText = toggleBtn.querySelector('.collapse-text');
    
    if (fullContentElement.style.display === 'none') {
        // 展開全文
        summaryElement.style.display = 'none';
        fullContentElement.style.display = 'block';
        expandText.style.display = 'none';
        collapseText.style.display = 'inline';
    } else {
        // 收起全文
        summaryElement.style.display = 'block';
        fullContentElement.style.display = 'none';
        expandText.style.display = 'inline';
        collapseText.style.display = 'none';
    }
}

async function loadWeatherForecast(container) {
    try {
        container.innerHTML = `<div class="loading-news"><i class="fas fa-spinner fa-spin"></i><p>正在載入天氣預報...</p></div>`;
        const response = await fetch('/api/weather');
        const data = await response.json();
        if (response.ok && data.items && Array.isArray(data.items) && data.items.length > 0) {
            container.innerHTML = '<div class="weather-grid"></div>';
            const grid = container.querySelector('.weather-grid');
            data.items.forEach((item) => {
                const text = `${item.title} ${item.description}`;
                const tempMatch = text.match(/溫度[:：]\s*(\d+)\s*~\s*(\d+)/);
                const rainMatch = text.match(/降雨(?:機率)?[:：]\s*(\d+)\s*%/);
                const rainPct = rainMatch ? parseInt(rainMatch[1], 10) : 0;
                let cond = 'cloud-sun';
                if (/晴時多雲|多雲時晴/.test(text)) {
                    cond = 'cloud-sun';
                } else if (/多雲/.test(text)) {
                    cond = 'cloud-sun';
                } else if (/陰/.test(text)) {
                    cond = 'cloud';
                } else if (/晴/.test(text)) {
                    cond = 'sun';
                }
                if ((/雷陣雨|豪雨|大雨|陣雨/.test(text) && rainPct >= 20) || rainPct >= 50) {
                    cond = 'rain';
                }
                const tMin = tempMatch ? tempMatch[1] : '';
                const tMax = tempMatch ? tempMatch[2] : '';
                const rain = `${rainPct}%`;
                const card = document.createElement('div');
                card.className = 'weather-card';
                card.innerHTML = `
                    <div class="weather-icon">${getWeatherSVG(cond)}</div>
                    <div class="weather-content">
                        <h3>${item.title}</h3>
                        <div class="weather-sub">
                            <span class="weather-temp">${tMin && tMax ? `${tMin} ~ ${tMax}°C` : ''}</span>
                            <span class="precip-badge">降雨 ${rain}</span>
                        </div>
                        <div class="weather-meta">
                            <span class="weather-date">${item.date}</span>
                            <a href="${item.link}" class="read-more" target="_blank">詳細</a>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        } else {
            throw new Error('無資料');
        }
    } catch (e) {
        container.innerHTML = `
            <div class="news-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>暫時無法載入天氣預報，請稍後再試</p>
                <button class="retry-btn">重新載入</button>
            </div>
        `;
        const btn = container.querySelector('.retry-btn');
        if (btn) {
            btn.addEventListener('click', () => loadWeatherForecast(container));
        }
    }
}

function getWeatherSVG(cond) {
    if (cond === 'sun') {
        return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="14" fill="#FFC107"/><g stroke="#FFA000" stroke-width="4" stroke-linecap="round"><line x1="32" y1="6" x2="32" y2="16"/><line x1="32" y1="48" x2="32" y2="58"/><line x1="6" y1="32" x2="16" y2="32"/><line x1="48" y1="32" x2="58" y2="32"/><line x1="12" y1="12" x2="20" y2="20"/><line x1="44" y1="44" x2="52" y2="52"/><line x1="12" y1="52" x2="20" y2="44"/><line x1="44" y1="20" x2="52" y2="12"/></g></svg>';
    }
    if (cond === 'cloud-sun') {
        return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="24" r="10" fill="#FFC107"/><g stroke="#FFA000" stroke-width="3" stroke-linecap="round"><line x1="20" y1="9" x2="20" y2="14"/><line x1="20" y1="34" x2="20" y2="39"/><line x1="5" y1="24" x2="10" y2="24"/><line x1="30" y1="24" x2="35" y2="24"/></g><g fill="#B0BEC5"><circle cx="36" cy="34" r="12"/><circle cx="26" cy="38" r="10"/><rect x="20" y="34" width="28" height="12" rx="6"/></g></svg>';
    }
    if (cond === 'rain') {
        return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><g fill="#B0BEC5"><circle cx="36" cy="28" r="12"/><circle cx="26" cy="32" r="10"/><rect x="20" y="30" width="28" height="12" rx="6"/></g><g fill="#4FC3F7"><path d="M24 48c0 3-3 6-3 6s-3-3-3-6a3 3 0 0 1 6 0z"/><path d="M34 48c0 3-3 6-3 6s-3-3-3-6a3 3 0 0 1 6 0z"/><path d="M44 48c0 3-3 6-3 6s-3-3-3-6a3 3 0 0 1 6 0z"/></g></svg>';
    }
    return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><g fill="#B0BEC5"><circle cx="36" cy="34" r="12"/><circle cx="26" cy="38" r="10"/><rect x="20" y="34" width="28" height="12" rx="6"/></g></svg>';
}
//篩選球員
document.addEventListener("DOMContentLoaded", function () {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const playerCards = document.querySelectorAll(".player-card");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // 移除所有按鈕的 active 樣式
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const filterValue = button.getAttribute("data-filter");

      // 篩選球員卡
      playerCards.forEach((card) => {
        const category = card.getAttribute("data-category");

        if (filterValue === "all" || category === filterValue) {
          card.style.display = "block";
        } else {
          card.style.display = "none";
        }
      });
    });
  });
});

// 回到頁首按鈕
const backToTopButton = document.getElementById("back-to-top");

window.onscroll = function() {
    if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
        backToTopButton.style.display = "block";
    } else {
        backToTopButton.style.display = "none";
    }
};

backToTopButton.onclick = function() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
};
