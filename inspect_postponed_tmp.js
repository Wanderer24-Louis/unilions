const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');

(async () => {
  const season = '2026';
  const page = `https://www.cpbl.com.tw/schedule?year=${season}&month=04`;
  const session = await axios.get(page, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
  const cookies = session.headers['set-cookie'] || [];
  const $ = cheerio.load(session.data);
  const script = $('script').text();
  const match = script.match(/RequestVerificationToken:\s*'([^']+)'/);
  const token = match ? match[1] : $('input[name="__RequestVerificationToken"]').val();
  const api = await axios.post('https://www.cpbl.com.tw/schedule/getgamedatas', qs.stringify({ calendar: `${season}/01/01`, kindCode: 'A', location: '' }), {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'RequestVerificationToken': token,
      'Cookie': cookies.join('; '),
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': page,
      'Origin': 'https://www.cpbl.com.tw'
    },
    timeout: 10000
  });
  const games = JSON.parse(api.data.GameDatas);
  const stopped = games.filter(g => String(g.IsGameStop) === '1' || String(g.GameStatus) === '6' || String(g.GameResult) === '1');
  console.log(JSON.stringify(stopped.map(g => ({
    GameDate: g.GameDate,
    GameSno: g.GameSno,
    HomeTeamName: g.HomeTeamName,
    VisitingTeamName: g.VisitingTeamName,
    IsGameStop: g.IsGameStop,
    GameStatus: g.GameStatus,
    GameResult: g.GameResult,
    GameDateTimeE: g.GameDateTimeE,
    PresentStatus: g.PresentStatus
  })), null, 2));
})();
