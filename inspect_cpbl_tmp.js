const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');
const fs = require('fs');

async function fetchGames() {
  const season = '2026';
  const page = `https://www.cpbl.com.tw/schedule?year=${season}&month=05`;
  const session = await axios.get(page, { headers: { 'User-Agent': 'Mozilla/5.0' }, responseType: 'arraybuffer' });
  const html = new TextDecoder('utf-8').decode(session.data);
  const $ = cheerio.load(html);
  const match = $('script').text().match(/RequestVerificationToken:\s*'([^']+)'/);
  const token = match ? match[1] : $('input[name="__RequestVerificationToken"]').val();
  const api = await axios.post('https://www.cpbl.com.tw/schedule/getgamedatas', qs.stringify({ calendar: `${season}/01/01`, kindCode: 'A', location: '' }), { headers: { 'User-Agent': 'Mozilla/5.0', 'RequestVerificationToken': token, 'Cookie': (session.headers['set-cookie']||[]).join('; '), 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest', 'Referer': page, 'Origin': 'https://www.cpbl.com.tw' }, responseType: 'arraybuffer' });
  const text = new TextDecoder('utf-8').decode(api.data);
  const json = JSON.parse(text);
  const games = JSON.parse(json.GameDatas);
  fs.writeFileSync('cpbl_sample.json', JSON.stringify(games.slice(0,5).map(g => ({
    GameDate: g.GameDate,
    HomeTeamName: g.HomeTeamName,
    VisitingTeamName: g.VisitingTeamName,
    FieldAbbe: g.FieldAbbe
  })), null, 2), 'utf8');
}
fetchGames().catch(err=>{console.error(err.message); process.exit(1);});
