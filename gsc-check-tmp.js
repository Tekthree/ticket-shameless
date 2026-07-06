const { chromium } = require('playwright');

(async () => {
  console.log('connecting...');
  const browser = await chromium.connectOverCDP('http://localhost:9222', { timeout: 60000 });
  console.log('connected');
  const context = browser.contexts()[0];
  console.log('contexts:', browser.contexts().length, 'pages:', context.pages().length);
  const page = context.pages()[0] || await context.newPage();
  console.log('using page, current url:', page.url());

  await page.goto('https://search.google.com/search-console/about', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2000);
  console.log('URL:', page.url());
  console.log('TITLE:', await page.title());

  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
