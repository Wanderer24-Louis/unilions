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

    // 動態載入統一獅新聞
    loadUnilionsNews();
});

// 載入統一獅新聞的函數
async function loadUnilionsNews() {
    const newsContainer = document.querySelector('.news-container');
    
    if (!newsContainer) {
        return; // 如果不在首頁，就不執行
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
            
            // 只顯示前3則新聞
            const displayNews = news.slice(0, 3);
            
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
