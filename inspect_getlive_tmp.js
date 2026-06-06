const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');

(async () => {
  const pageUrl = 'https://cpbl.com.tw/box/live?gameSno=86&kindCode=A&year=2026';
  const pageResponse = await axios.get(pageUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    responseType: 'arraybuffer',
    timeout: 10000
  });
  const html = new TextDecoder('utf-8').decode(pageResponse.data);
  const $ = cheerio.load(html);
  const token = $('input[name="__RequestVerificationToken"]').val();
  const form = {
    __RequestVerificationToken: token,
    GameSno: '86',
    KindCode: 'A',
    Year: '2026',
    PrevOrNext: '0'
  };
  const apiResponse = await axios.post('https://cpbl.com.tw/box/getlive', qs.stringify(form), {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'Cookie': (pageResponse.headers['set-cookie'] || []).join('; '),
      'Referer': pageUrl,
      'Origin': 'https://cpbl.com.tw'
    },
    timeout: 10000
  });
  console.log(JSON.stringify(Object.keys(apiResponse.data), null, 2));
  console.log('success', apiResponse.data.Success);
  console.log('curt', apiResponse.data.CurtGameDetailJson?.slice(0, 400));
  console.log('live', apiResponse.data.LiveLogJson?.slice(0, 400));
})();
