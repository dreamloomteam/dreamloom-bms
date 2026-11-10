const puppeteer = require('puppeteer-core');
const CHROME_PATH = '/usr/bin/google-chrome';
const BASE_URL = 'https://dreamloom-bms-injw.vercel.app';
const ARTIFACT_DIR = '/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/d2f23adf-20bf-435a-af12-25996bc144b4';

async function run() {
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

    for (let attempt = 1; attempt <= 10; attempt++) {
      console.log(`Attempt ${attempt}/10: checking live deployment...`);
      await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

      // Login if login form exists
      const emailInput = await page.$('input[type="text"], input[type="email"]');
      if (emailInput) {
        const passwordInput = await page.$('input[type="password"]');
        await emailInput.type('kamera@dreamloom.co.ke');
        await passwordInput.type('Simon@%322');
        const submitBtn = await page.$('button[type="submit"]');
        await submitBtn.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
        await new Promise(r => setTimeout(r, 3000));
      }

      // Click Member Directory
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const memBtn = btns.find(b => b.textContent && b.textContent.includes('Member Directory'));
        if (memBtn) memBtn.click();
      });
      await new Promise(r => setTimeout(r, 3000));

      const res = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim());
        const hasTitle = headings.some(h => h.includes('Member Balances, Unsettled Dues & Shares — Automatic Summary'));
        const tables = Array.from(document.querySelectorAll('table'));
        const summaryTable = tables.find(t => t.textContent.includes('UNSETTLED CONTRIBUTIONS (KES)') || t.textContent.includes('Unsettled Contributions (KES)'));
        return {
          headings,
          hasTitle,
          hasSummaryTable: !!summaryTable,
          rows: summaryTable ? summaryTable.querySelectorAll('tbody tr').length : 0
        };
      });

      console.log('Result:', res);
      if (res.hasTitle && res.hasSummaryTable) {
        console.log('🎉 SUCCESS: Deployment live and table verified!');
        await page.screenshot({ path: `${ARTIFACT_DIR}/evidence_member_balances_summary_restored.png`, fullPage: true });
        console.log('Saved screenshot: evidence_member_balances_summary_restored.png');
        return;
      }

      console.log('Waiting 15s before next attempt...');
      await new Promise(r => setTimeout(r, 15000));
    }
    throw new Error('Timed out waiting for new Vercel deployment');
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
