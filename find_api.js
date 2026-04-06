const axios = require('axios');

async function findAPI() {
    try {
        const url = 'https://www.cpbl.com.tw/schedule?year=2026&month=04';
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const html = response.data;
        
        // Look for API calls or data objects
        const scriptMatches = html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/gm);
        if (scriptMatches) {
            scriptMatches.forEach(script => {
                if (script.includes('http') || script.includes('api') || script.includes('GameDate')) {
                    console.log('--- Script Snippet ---');
                    console.log(script.substring(0, 500));
                }
            });
        }
        
    } catch (e) {
        console.error(e);
    }
}

findAPI();