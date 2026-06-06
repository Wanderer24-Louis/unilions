const axios = require('axios');
const fs = require('fs');
(async () => {
  const url = 'https://cpbl.com.tw/box/live?gameSno=86&kindCode=A&year=2026';
  const response = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    responseType: 'arraybuffer',
    timeout: 10000
  });
  fs.writeFileSync('live86.html', new TextDecoder('utf-8').decode(response.data), 'utf8');
})();
