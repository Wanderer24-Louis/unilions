document.addEventListener('DOMContentLoaded', function() {
    const addEventBtn = document.getElementById('add-event-btn');
    const addEventForm = document.getElementById('add-event-form');
    const saveEventBtn = document.getElementById('save-event-btn');
    const cancelEventBtn = document.getElementById('cancel-event-btn');
    const newsContainer = document.querySelector('.news-container');
    const eventsContainer = document.querySelector('.events-container');
    const addCheerEventBtn = document.getElementById('add-cheer-event-btn');
    const addCheerEventForm = document.getElementById('add-cheer-event-form');
    const saveCheerEventBtn = document.getElementById('save-cheer-event-btn');
    const cancelCheerEventBtn = document.getElementById('cancel-cheer-event-btn');
    const cheerEventError = document.getElementById('cheer-event-error');
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

    if (addCheerEventBtn) {
        addCheerEventBtn.addEventListener('click', () => {
            if (!isAuthenticated()) {
                pendingAction = 'addCheerEvent';
                openLoginModal();
                return;
            }
            addCheerEventForm.style.display = 'block';
        });
    }

    if (cancelEventBtn) {
        cancelEventBtn.addEventListener('click', () => {
            addEventForm.style.display = 'none';
        });
    }

    if (cancelCheerEventBtn) {
        cancelCheerEventBtn.addEventListener('click', () => {
            addCheerEventForm.style.display = 'none';
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

    if (saveCheerEventBtn) {
        saveCheerEventBtn.addEventListener('click', () => {
            if (!isAuthenticated()) {
                pendingAction = 'saveCheerEvent';
                openLoginModal();
                return;
            }
            const month = document.getElementById('cheer-event-month').value;
            const day = document.getElementById('cheer-event-day').value;
            const title = document.getElementById('cheer-event-title').value;
            const location = document.getElementById('cheer-event-location').value;
            const showup = document.getElementById('cheer-event-showup').value;
            const time = document.getElementById('cheer-event-time').value;
            const link = document.getElementById('cheer-event-link').value;

            if (!month || !day || !title) {
                if (cheerEventError) cheerEventError.style.display = 'block';
                return;
            }
            if (cheerEventError) cheerEventError.style.display = 'none';

            const card = document.createElement('div');
            card.className = 'event-card';
            card.innerHTML = `
                <div class="event-date">
                    <span class="month">${month}</span>
                    <span class="day">${day}</span>
                </div>
                <div class="event-info">
                    <h3>${title}</h3>
                    ${location ? `<p class="event-location">${location}</p>` : ''}
                    ${showup ? `<p class="showup">出席女孩：${showup}</p>` : ''}
                    ${time ? `<p class="event-time">${time}</p>` : ''}
                    ${link ? `<a href="${link}" class="btn btn-secondary" target="_blank">活動詳情</a>` : ''}
                </div>
            `;
            if (eventsContainer) eventsContainer.prepend(card);

            document.getElementById('cheer-event-month').value = '';
            document.getElementById('cheer-event-day').value = '';
            document.getElementById('cheer-event-title').value = '';
            document.getElementById('cheer-event-location').value = '';
            document.getElementById('cheer-event-showup').value = '';
            document.getElementById('cheer-event-time').value = '';
            document.getElementById('cheer-event-link').value = '';
            addCheerEventForm.style.display = 'none';
        });
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
            if (pendingAction === 'addCheerEvent') {
                addCheerEventForm.style.display = 'block';
            }
            if (pendingAction === 'saveCheerEvent') {
                saveCheerEventBtn.click();
            }
            pendingAction = null;
        });
    }
});
