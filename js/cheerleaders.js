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
                loginError.style.display = 'block';
                return;
            }
            localStorage.setItem('authToken', 'local-demo-token');
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
