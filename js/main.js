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
});