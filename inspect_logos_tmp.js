const axios = require('axios');
async function main() {
  const res = await axios.get('https://www.cpbl.com.tw/team', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = res.data;
  const regex = /ClubNo=(\w+)"[^>]*background-image:url\('([^']+)'\)/g;
  const found = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    found.push({ club: match[1], url: match[2] });
  }
  console.log(JSON.stringify(found, null, 2));
}
main().catch(err => { console.error(err.message); process.exit(1); });
