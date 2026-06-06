const axios = require('axios');
const cheerio = require('cheerio');

(async () => {
  const url = 'https://cpbl.com.tw/box/live?gameSno=86&kindCode=A&year=2026';
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    responseType: 'arraybuffer',
    timeout: 10000
  });

  const pageText = cheerio.load(new TextDecoder('utf-8').decode(response.data)).text().replace(/\s+/g, ' ');
  const inningMatches = [...pageText.matchAll(/(\d+)\s*局\s*([上下])/g)];
  console.log('matchCount', inningMatches.length);
  console.log('matches', inningMatches.slice(0, 20).map(m => `${m[1]}局${m[2]}`).join(','));
  if (inningMatches.length > 0) {
    const latest = inningMatches[inningMatches.length - 1];
    console.log('latest', `${latest[1]}局${latest[2]}`);
  }
})();
