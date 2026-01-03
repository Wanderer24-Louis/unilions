document.addEventListener('DOMContentLoaded', function() {
    // Inject CSS for the counter
    const style = document.createElement('style');
    style.innerHTML = `
        .visitor-counter {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 10px;
            font-size: 0.9em;
            color: #eee;
        }
        .visitor-counter .counter-item {
            display: flex;
            align-items: center;
            gap: 5px;
        }
    `;
    document.head.appendChild(style);

    // Create the HTML structure
    const counterDiv = document.createElement('div');
    counterDiv.className = 'visitor-counter';
    counterDiv.innerHTML = `
        <div class="counter-item">
            <i class="fas fa-eye"></i>
            <span>總瀏覽人數: <span id="total-visits">Loading...</span></span>
        </div>
        <div class="counter-item">
            <i class="fas fa-users"></i>
            <span>即時在線人數: <span id="online-count">Loading...</span></span>
        </div>
    `;

    // Inject into footer
    const footerBottom = document.querySelector('.footer-bottom');
    const footer = document.querySelector('footer');
    if (footerBottom) {
        footerBottom.insertBefore(counterDiv, footerBottom.firstChild);
    } else if (footer) {
        footer.appendChild(counterDiv);
    } else {
        document.body.appendChild(counterDiv);
    }

    // --- Mode Switching Logic ---

    // Function to load Socket.io client dynamically
    function loadSocketIO(callback) {
        if (window.io) {
            callback();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
        script.onload = callback;
        script.onerror = () => {
            console.warn('Failed to load Socket.io, falling back to simulation.');
            startSimulation();
        };
        document.body.appendChild(script);
    }

    // REAL MODE: Connect to backend
    function startRealTime() {
        // Determine server URL: 
        // If we are on localhost, assume localhost:3000
        // If we are on Render (deployed), use the relative path or specific URL
        const serverUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:3000' 
            : window.location.origin; // Assume backend serves frontend on same domain

        const socket = io(serverUrl, {
            reconnectionAttempts: 3, // Try 3 times then give up (and maybe simulate)
            timeout: 2000
        });

        const totalEl = document.getElementById('total-visits');
        const onlineEl = document.getElementById('online-count');

        socket.on('connect', () => {
            console.log('Connected to real-time server');
        });

        socket.on('updateCounts', (data) => {
            if (totalEl) totalEl.textContent = data.total.toLocaleString();
            if (onlineEl) onlineEl.textContent = data.online;
        });

        socket.on('connect_error', (err) => {
            console.log('Connection failed, falling back to simulation', err);
            socket.disconnect();
            startSimulation(); // Fallback if server is not running
        });
    }

    // SIMULATION MODE: Fake numbers (Original Logic)
    function startSimulation() {
        let totalVisits = localStorage.getItem('totalVisits');
        if (!totalVisits) {
            totalVisits = 10;
        } else {
            // Only increment if we haven't just switched from real mode
            // For simplicity, just read it.
            totalVisits = parseInt(totalVisits) + 1;
        }
        localStorage.setItem('totalVisits', totalVisits);

        let currentOnline = Math.floor(Math.random() * (150 - 50 + 1)) + 50;

        const totalEl = document.getElementById('total-visits');
        const onlineEl = document.getElementById('online-count');

        if (totalEl) totalEl.textContent = totalVisits.toLocaleString();
        if (onlineEl) onlineEl.textContent = currentOnline;

        // Fluctuation
        setInterval(() => {
            const change = Math.floor(Math.random() * 7) - 3; 
            currentOnline += change;
            if (currentOnline < 20) currentOnline = 20 + Math.floor(Math.random() * 10);
            if (currentOnline > 500) currentOnline = 500 - Math.floor(Math.random() * 10);
            
            if (onlineEl) onlineEl.textContent = currentOnline;
        }, 5000);
    }

    // ENTRY POINT
    // Try to load Socket.io and connect. If it fails, use simulation.
    loadSocketIO(startRealTime);
});
