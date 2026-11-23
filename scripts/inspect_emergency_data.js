const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROMIUM_PATH = '/usr/bin/chromium';
const APP_URL = process.env.BASE_URL || 'https://dreamloom-bms-injw.vercel.app';

(async () => {
  console.log(`Connecting to ${APP_URL} to inspect all Emergency Fund records...`);
  const browser = await puppeteer.launch({
    executablePath: CHROMIUM_PATH,
    headless: true,
    ignoreHTTPSErrors: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    const isLoginScreen = await page.$('input[placeholder="Username or Email"]');
    if (isLoginScreen) {
      await page.type('input[placeholder="Username or Email"]', 'simon@dreamloom.co.ke');
      await page.type('input[type="password"]', 'Simon@%322');
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
      else await page.keyboard.press('Enter');
      await page.waitForFunction(() => !document.querySelector('input[placeholder="Username or Email"]'), { timeout: 15000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 2000));
    }

    // Call GET /api/emergency-fund
    const fundData = await page.evaluate(async () => {
      const res = await fetch('/api/emergency-fund');
      return await res.json();
    });

    console.log('--- EMERGENCY FUND DATA DUMP ---');
    if (!fundData.success) {
      console.error('Failed to fetch emergency fund data:', fundData.error);
    } else {
      const d = fundData.data;
      console.log('Stats:', JSON.stringify(d.stats, null, 2));
      console.log('Allocations count:', d.allocations?.length || 0);
      console.log('Applications count:', d.applications?.length || 0);
      console.log('Loans count:', d.loans?.length || 0);
      console.log('Repayments count:', d.repayments?.length || 0);
      console.log('Transactions count:', d.transactions?.length || 0);

      console.log('\n--- APPLICATIONS ---');
      console.log(JSON.stringify(d.applications, null, 2));

      console.log('\n--- LOANS ---');
      console.log(JSON.stringify(d.loans, null, 2));

      console.log('\n--- REPAYMENTS ---');
      console.log(JSON.stringify(d.repayments, null, 2));

      console.log('\n--- TRANSACTIONS (first 10) ---');
      console.log(JSON.stringify((d.transactions || []).slice(0, 10), null, 2));

      console.log('\n--- ALLOCATIONS (first 10) ---');
      console.log(JSON.stringify((d.allocations || []).slice(0, 10), null, 2));

      // Save complete snapshot to file
      fs.writeFileSync('emergency_fund_snapshot_before_cleanup.json', JSON.stringify(d, null, 2));
      console.log('Saved snapshot to emergency_fund_snapshot_before_cleanup.json');
    }

  } catch (err) {
    console.error('Error inspecting:', err);
  } finally {
    await browser.close();
  }
})();
