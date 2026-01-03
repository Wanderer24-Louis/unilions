document.addEventListener('DOMContentLoaded', function() {
    // 1. Initialize Total Visits
    let totalVisits = localStorage.getItem('totalVisits');
    if (!totalVisits) {
        // Initial seed number (e.g., start from 12,345 to look realistic)
        totalVisits = 12345;
    } else {
        // Increment on new session or page load
        // To prevent incrementing on every refresh in the same session, we could use sessionStorage
        // But for "Total Page Views", incrementing every time is correct.
        totalVisits = parseInt(totalVisits) + 1;
    }
    localStorage.setItem('totalVisits', totalVisits);

    // 2. Simulate Current Online Users
    // Random number between 50 and 150
    let currentOnline = Math.floor(Math.random() * (150 - 50 + 1)) + 50;

    // 3. Create the HTML for the counter
    const counterDiv = document.createElement('div');
    counterDiv.className = 'visitor-counter';
    counterDiv.innerHTML = `
        <div class="counter-item">
            <i class="fas fa-eye"></i>
            <span>總瀏覽人數: ${totalVisits.toLocaleString()}</span>
        </div>
        <div class="counter-item">
            <i class="fas fa-users"></i>
            <span>即時在線人數: <span id="online-count">${currentOnline}</span></span>
        </div>
    `;

    // 4. Inject into the footer
    // Try to find .footer-bottom first, otherwise append to footer, otherwise body
    const footerBottom = document.querySelector('.footer-bottom');
    const footer = document.querySelector('footer');
    
    if (footerBottom) {
        // Insert before the copyright text
        footerBottom.insertBefore(counterDiv, footerBottom.firstChild);
    } else if (footer) {
        footer.appendChild(counterDiv);
    } else {
        document.body.appendChild(counterDiv);
    }

    // 5. Simulate real-time fluctuation for online users
    setInterval(() => {
        // Fluctuate by -3 to +3
        const change = Math.floor(Math.random() * 7) - 3; 
        currentOnline += change;
        
        // Safety bounds
        if (currentOnline < 20) currentOnline = 20 + Math.floor(Math.random() * 10);
        if (currentOnline > 500) currentOnline = 500 - Math.floor(Math.random() * 10);
        
        const onlineCountEl = document.getElementById('online-count');
        if (onlineCountEl) {
            onlineCountEl.textContent = currentOnline;
            
            // Optional: visual effect for update
            onlineCountEl.style.color = '#ff9900';
            setTimeout(() => {
                onlineCountEl.style.color = '';
            }, 500);
        }
    }, 5000); // Update every 5 seconds
});
