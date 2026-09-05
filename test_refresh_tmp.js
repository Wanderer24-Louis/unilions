const { spawn } = require('child_process');
const http = require('http');

const child = spawn(process.execPath, ['server.js'], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] });
let output = '';
child.stdout.on('data', d => {
  output += d.toString();
  process.stdout.write(d.toString());
});
child.stderr.on('data', d => {
  output += d.toString();
  process.stdout.write(d.toString());
});
child.on('exit', code => {
  console.log('CHILD_EXIT=' + code);
});

function requestOnce() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://127.0.0.1:3000/api/schedule?season=2026&refresh=1&t=' + Date.now(), res => {
      let body = '';
      res.on('data', chunk => body += chunk.toString());
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
  });
}

(async () => {
  try {
    await new Promise(r => setTimeout(r, 8000));
    const result = await requestOnce();
    console.log('STATUS=' + result.status);
    console.log(result.body.slice(0, 500));
  } catch (error) {
    console.error('REQUEST_ERROR=' + error.message);
  } finally {
    child.kill();
    setTimeout(() => process.exit(0), 1000);
  }
})();
