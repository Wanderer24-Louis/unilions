const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');

async function fetchLiveInning(season, kindCode, gameSno) {
  const liveUrl = `https://cpbl.com.tw/box/live?gameSno=${gameSno}&kindCode=${kindCode || 'A'}&year=${season}`;
  const response = await axios.get(liveUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    responseType: 'arraybuffer',
    timeout: 10000
  });
  const html = new TextDecoder('utf-8').decode(response.data);
  const $ = cheerio.load(html);
  const token = $('input[name="__RequestVerificationToken"]').val();
  const payload = qs.stringify({ __RequestVerificationToken: token, GameSno: String(gameSno), KindCode: kindCode || 'A', Year: String(season), PrevOrNext: '0' });
  const liveDataResponse = await axios.post('https://cpbl.com.tw/box/getlive', payload, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'Cookie': (response.headers['set-cookie'] || []).join('; '),
      'Referer': liveUrl,
      'Origin': 'https://cpbl.com.tw'
    },
    timeout: 10000
  });
  const liveLogs = JSON.parse(liveDataResponse.data.LiveLogJson);
  const latestLog = liveLogs[liveLogs.length - 1];
  return `${latestLog.InningSeq}局${String(latestLog.VisitingHomeType) === '1' ? '上' : '下'}`;
}

fetchLiveInning('2026', 'A', 86).then(value => fs.writeFileSync('inning_result.txt', value, 'utf8')).catch(err => { console.error(err.message); process.exit(1); });
