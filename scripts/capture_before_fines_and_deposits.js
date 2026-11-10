const puppeteer = require('puppeteer-core');
const path = require('path');

const ARTIFACT_DIR = process.env.ARTIFACT_DIR || '/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/d2f23adf-20bf-435a-af12-25996bc144b4';
const CHROME_PATH = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const BASE_URL = 'https://dreamloom-bms-injw.vercel.app';

const wait = ms => new Promise(res => setTimeout(res, ms));

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    ignoreHTTPSErrors: true,
    acceptInsecureCerts: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--ignore-certificate-errors'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 950 });

    console.log('Logging into Dreamloom BMS on production...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"], input[type="text"]', { timeout: 10000 });
    await page.type('input[type="email"], input[type="text"]', 'kamera@dreamloom.co.ke');
    await page.type('input[type="password"]', 'Simon@%322');
    await page.click('button[type="submit"]');

    await page.waitForSelector('main', { timeout: 15000 });
    await wait(2500);

    // 1. Deposits Tab Before
    console.log('Navigating to Deposits...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('button, a, span, p'));
      const tab = items.find(el => el.innerText && el.innerText.trim() === 'Deposits');
      if (tab) tab.click();
    });
    await wait(2500);

    const depositsBeforePath = path.join(ARTIFACT_DIR, 'evidence_deposits_before.png');
    await page.screenshot({ path: depositsBeforePath, fullPage: false });
    console.log(`Saved Deposits Before: ${depositsBeforePath}`);

    // 2. Fines & Penalties Tab Before
    console.log('Navigating to Fines & Penalties...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('button, a, span, p'));
      const tab = items.find(el => el.innerText && el.innerText.trim().includes('Fines & Penalties'));
      if (tab) tab.click();
    });
    await wait(2500);

    const finesBeforePath = path.join(ARTIFACT_DIR, 'evidence_fines_penalties_before.png');
    await page.screenshot({ path: finesBeforePath, fullPage: false });
    console.log(`Saved Fines & Penalties Before: ${finesBeforePath}`);

  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
