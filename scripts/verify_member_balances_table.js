const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME_PATH = '/usr/bin/google-chrome';
const BASE_URL = 'https://dreamloom-bms-injw.vercel.app';
const ARTIFACT_DIR = '/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/d2f23adf-20bf-435a-af12-25996bc144b4';

async function run() {
  console.log('1. Waiting 15s for Vercel deployment propagation...');
  await new Promise(r => setTimeout(r, 15000));

  console.log('2. Launching Puppeteer...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    ignoreHTTPSErrors: true,
    acceptInsecureCerts: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1600 });

    console.log('3. Navigating to login...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Login
    await page.waitForSelector('input[type="text"], input[type="email"]', { timeout: 10000 });
    const emailInput = await page.$('input[type="text"], input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    await emailInput.type('kamera@dreamloom.co.ke');
    await passwordInput.type('Simon@%322');

    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));

    // Navigate to Member Directory
    console.log('4. Navigating to Member Directory tab...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const memBtn = btns.find(b => b.textContent && b.textContent.includes('Member Directory'));
      if (memBtn) memBtn.click();
    });
    await new Promise(r => setTimeout(r, 3000));

    // Check Member Balances table presence
    const tableInfo = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim());
      const hasTitle = headings.some(h => h.includes('Member Balances, Unsettled Dues & Shares — Automatic Summary'));
      
      const tables = Array.from(document.querySelectorAll('table'));
      const summaryTable = tables.find(t => t.textContent.includes('UNSETTLED CONTRIBUTIONS (KES)') || t.textContent.includes('Unsettled Contributions (KES)'));
      
      let rowsCount = 0;
      let grandTotalText = '';
      if (summaryTable) {
        rowsCount = summaryTable.querySelectorAll('tbody tr').length;
        const lastRow = summaryTable.querySelector('tbody tr:last-child');
        if (lastRow) grandTotalText = lastRow.textContent.trim();
      }

      return {
        headings,
        hasTitle,
        hasSummaryTable: !!summaryTable,
        rowsCount,
        grandTotalText
      };
    });

    console.log('Table verification info:', JSON.stringify(tableInfo, null, 2));

    const screenshotPath = `${ARTIFACT_DIR}/evidence_member_balances_summary_restored.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('Saved screenshot to:', screenshotPath);

    if (tableInfo.hasTitle && tableInfo.hasSummaryTable) {
      console.log('✅ PASS: Member Balances, Unsettled Dues & Shares – Automatic Summary successfully restored on live production!');
    } else {
      console.error('❌ FAIL: Table was not found or deployment is still in progress.');
    }

  } finally {
    await browser.close();
  }
}

run().catch(console.error);
