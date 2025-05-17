// Basic puppeteer e2e test. Skips if puppeteer is not installed.
const fs = require('fs');
const path = require('path');

let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (err) {
  console.log('puppeteer not installed, skipping');
  process.exit(0);
}

const {spawn} = require('child_process');

async function main() {
  const server = spawn('python', ['app.py'], {
    env: {...process.env, PORT: '5010'},
    stdio: 'inherit'
  });
  await new Promise(r => setTimeout(r, 1000));
  const browser = await puppeteer.launch({args: ['--no-sandbox']});
  const page = await browser.newPage();
  await page.goto('http://localhost:5010', {waitUntil: 'networkidle2'});
  const screenshotPath = path.join(__dirname, 'screenshot.png');
  await page.screenshot({path: screenshotPath});
  await browser.close();
  server.kill();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
