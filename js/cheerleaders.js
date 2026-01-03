document.addEventListener('DOMContentLoaded', function() {
    const addEventBtn = document.getElementById('add-event-btn');
    const addEventForm = document.getElementById('add-event-form');
    const saveEventBtn = document.getElementById('save-event-btn');
    const cancelEventBtn = document.getElementById('cancel-event-btn');
    const newsContainer = document.querySelector('.news-container');
    const loginModal = document.getElementById('login-modal');
    const loginCloseBtn = document.getElementById('login-close-btn');
    const loginCancelBtn = document.getElementById('login-cancel-btn');
    const loginSubmitBtn = document.getElementById('login-submit-btn');
    const loginError = document.getElementById('login-error');
    let pendingAction = null;

    const isAuthenticated = () => !!localStorage.getItem('authToken');

    if (addEventBtn) {
        addEventBtn.addEventListener('click', () => {
            if (!isAuthenticated()) {
                pendingAction = 'addEvent';
                openLoginModal();
                return;
            }
            addEventForm.style.display = 'block';
        });
    }


    if (cancelEventBtn) {
        cancelEventBtn.addEventListener('click', () => {
            addEventForm.style.display = 'none';
        });
    }


    if (saveEventBtn) {
        saveEventBtn.addEventListener('click', () => {
            if (!isAuthenticated()) {
                pendingAction = 'saveEvent';
                openLoginModal();
                return;
            }
            const title = document.getElementById('event-title').value;
            const content = document.getElementById('event-content').value;
            const image = document.getElementById('event-image').value;
            const date = new Date().toLocaleDateString();

            if (title && content) {
                const newsCard = document.createElement('div');
                newsCard.className = 'news-card';
                
                newsCard.innerHTML = `
                    <div class="news-image-container">
                        <img src="${image}" alt="${title}" onerror="this.src='images/logo.png'">
                    </div>
                    <div class="news-content">
                        <h3>${title}</h3>
                        <div class="news-summary">
                            <p>${content}</p>
                        </div>
                        <div class="news-meta">
                            <span class="news-date">${date}</span>
                        </div>
                    </div>
                `;
                newsContainer.appendChild(newsCard);

                document.getElementById('event-title').value = '';
                document.getElementById('event-content').value = '';
                document.getElementById('event-image').value = '';
                addEventForm.style.display = 'none';
            }
        });
    }

    if (newsContainer && newsContainer.getAttribute('data-source') === 'unigirls') {
        loadUniGirlsNews(newsContainer);
    }

    function openLoginModal() {
        if (loginModal) {
            loginError.style.display = 'none';
            loginModal.style.display = 'flex';
        }
    }

    function closeLoginModal() {
        if (loginModal) {
            loginModal.style.display = 'none';
        }
    }

    if (loginCloseBtn) {
        loginCloseBtn.addEventListener('click', () => {
            closeLoginModal();
        });
    }

    if (loginCancelBtn) {
        loginCancelBtn.addEventListener('click', () => {
            closeLoginModal();
        });
    }

    if (loginSubmitBtn) {
        loginSubmitBtn.addEventListener('click', () => {
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            if (!username || !password) {
                loginError.textContent = '請輸入帳號與密碼';
                loginError.style.display = 'block';
                return;
            }
            const isValid = username === 'admin' && password === 'unilions123';
            if (!isValid) {
                loginError.textContent = '帳號或密碼錯誤';
                loginError.style.display = 'block';
                return;
            }
            localStorage.setItem('authToken', 'local-demo-token');
            localStorage.setItem('authUser', username);
            closeLoginModal();
            if (pendingAction === 'addEvent') {
                addEventForm.style.display = 'block';
            }
            if (pendingAction === 'saveEvent') {
                saveEventBtn.click();
            }
            pendingAction = null;
        });
    }
});

async function loadUniGirlsNews(container) {
    try {
        container.innerHTML = `
            <div class="loading-news">
                <i class="fas fa-spinner fa-spin"></i>
                <p>正在載入最新消息...</p>
            </div>
        `;
        const response = await fetch('/api/unigirls-news');
        const news = await response.json();
        if (response.ok && Array.isArray(news) && news.length > 0) {
            container.innerHTML = '';
            const displayNews = news.slice(0, 3);
            displayNews.forEach((article, index) => {
                const cardId = `unigirls-${index}`;
                const el = document.createElement('div');
                el.className = 'news-card';
                el.innerHTML = `
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
                container.appendChild(el);
            });
        } else {
            throw new Error('無資料');
        }
    } catch (e) {
        container.innerHTML = `
            <div class="news-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>暫時無法載入最新消息，請稍後再試</p>
                <button onclick="loadUniGirlsNews(document.querySelector('.news-container[data-source=\\'unigirls\\']'))" class="retry-btn">重新載入</button>
            </div>
        `;
    }
}
