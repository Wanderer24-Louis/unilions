const axios = require('axios');
const cheerio = require('cheerio');

async function debugCPBL() {
    try {
        const url = 'https://www.cpbl.com.tw/schedule?year=2026&month=04';
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(response.data);
        console.log('Title:', $('title').text());
        
        console.log('--- Table Classes ---');
        $('table').each((i, el) => {
            console.log(`Table ${i} classes:`, $(el).attr('class'));
        });

        console.log('--- First Row of each table ---');
        $('table').each((i, table) => {
            console.log(`Table ${i} first 3 rows:`);
            $(table).find('tr').slice(0, 3).each((j, tr) => {
                console.log(`  Row ${j}:`, $(tr).text().replace(/\s+/g, ' ').trim().substring(0, 100));
            });
        });

        console.log('--- DIV classes related to schedule ---');
        $('div[class*="schedule"], div[class*="list"]').each((i, el) => {
            console.log(`Div ${i} class:`, $(el).attr('class'));
        });

    } catch (e) {
        console.error(e);
    }
}

debugCPBL();