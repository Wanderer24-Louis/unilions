const axios = require('axios');

async function checkHeadersNoCache() {
    try {
        const url = 'https://www.cpbl.com.tw/schedule?_=' + Date.now();
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        console.log('Headers:', response.headers);
    } catch (e) {
        console.error(e);
    }
}

checkHeadersNoCache();