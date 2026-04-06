const axios = require('axios');

async function testAPI() {
    try {
        const url = 'https://www.cpbl.com.tw/schedule/get_schedule';
        const params = {
            year: '2026',
            month: '04',
            kindCode: 'A'
        };
        const response = await axios.get(url, {
            params,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        console.log('API Status:', response.status);
        console.log('API Data Snippet:', JSON.stringify(response.data).substring(0, 500));
        
    } catch (e) {
        console.error('API Error:', e.message);
        if (e.response) {
            console.error('API Response Status:', e.response.status);
        }
    }
}

testAPI();