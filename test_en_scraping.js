const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');

async function testEnScraping() {
    try {
        const baseUrl = 'https://en.cpbl.com.tw/schedule';
        const sessionResponse = await axios.get(baseUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const cookies = sessionResponse.headers['set-cookie'];
        const $ = cheerio.load(sessionResponse.data);
        const token = $('input[name="__RequestVerificationToken"]').val();

        console.log('Token found:', token ? 'Yes' : 'No');
        console.log('Cookies found:', cookies ? 'Yes' : 'No');

        if (!token || !cookies) return;

        const apiUrl = 'https://en.cpbl.com.tw/schedule/getgamedatas';
        const postData = qs.stringify({
            calendar: '2026/04/01',
            kindCode: 'A',
            location: ''
        });

        const apiResponse = await axios.post(apiUrl, postData, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'RequestVerificationToken': token,
                'Cookie': cookies.join('; '),
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': 'https://en.cpbl.com.tw/schedule',
                'Origin': 'https://en.cpbl.com.tw'
            }
        });

        console.log('API Response Status:', apiResponse.status);
        if (apiResponse.data && apiResponse.data.GameDatas) {
            console.log('Found games!');
        } else {
            console.log('No GameDatas');
        }

    } catch (e) {
        console.error('Error:', e.message);
        if (e.response) console.log('Response status:', e.response.status);
    }
}

testEnScraping();