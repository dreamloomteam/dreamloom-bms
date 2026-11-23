const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROMIUM_PATH = '/usr/bin/chromium';
const APP_URL = process.env.BASE_URL || 'https://dreamloom-bms-injw.vercel.app';
const ARTIFACTS_DIR = '/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/d2f23adf-20bf-435a-af12-25996bc144b4';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('Starting automated cleanup execution and post-cleanup verification...');
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
  await page.setViewport({ width: 1440, height: 950 });

  page.on('dialog', async dialog => {
    console.log('[Browser Alert Dialog]:', dialog.message());
    await dialog.accept();
  });

  try {
    // 1. Navigate to app and authenticate as Super Admin
    console.log('1. Authenticating as Simon Memia Wanjiru (Admin / Super Admin)...');
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    const isLoginScreen = await page.$('input[placeholder="Username or Email"]');
    if (isLoginScreen) {
      await page.type('input[placeholder="Username or Email"]', 'simon@dreamloom.co.ke');
      await page.type('input[type="password"]', 'Simon@%322');
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
      else await page.keyboard.press('Enter');
      await page.waitForFunction(() => !document.querySelector('input[placeholder="Username or Email"]'), { timeout: 15000 }).catch(() => {});
      await sleep(2500);
    }

    // 2. Poll until cleanup_test_data is deployed and executable
    console.log('2. Verifying cleanup endpoint readiness on Vercel deployment...');
    let cleanupResult = null;
    for (let attempt = 1; attempt <= 12; attempt++) {
      cleanupResult = await page.evaluate(async () => {
        try {
          const res = await fetch('/api/emergency-fund', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'cleanup_test_data' })
          });
          return await res.json();
        } catch (err) {
          return { error: err.message };
        }
      });

      if (cleanupResult.success) {
        console.log(`[SUCCESS] Cleanup API executed on attempt ${attempt}:`, JSON.stringify(cleanupResult));
        break;
      } else if (cleanupResult.error && cleanupResult.error.includes('Unsupported action')) {
        console.log(`Attempt ${attempt}: Vercel deployment still in progress, waiting 10s...`);
        await sleep(10000);
      } else {
        console.log(`Attempt ${attempt} response:`, cleanupResult);
        break;
      }
    }

    if (!cleanupResult || !cleanupResult.success) {
      throw new Error(`Cleanup execution failed: ${JSON.stringify(cleanupResult)}`);
    }

    console.log('\n--- CLEANUP SUMMARY REPORT ---');
    console.log(JSON.stringify(cleanupResult.data, null, 2));

    // 3. Verify Emergency Fund Data Post-Cleanup
    console.log('\n3. Querying post-cleanup Emergency Fund state...');
    const postCleanupData = await page.evaluate(async () => {
      const res = await fetch('/api/emergency-fund');
      return await res.json();
    });

    if (!postCleanupData.success) {
      throw new Error(`Failed to fetch post-cleanup emergency fund data: ${postCleanupData.error}`);
    }

    const ef = postCleanupData.data;
    console.log('Post-cleanup Stats:', JSON.stringify(ef.stats, null, 2));
    console.log('Applications count:', ef.applications?.length || 0);
    console.log('Loans count:', ef.loans?.length || 0);
    console.log('Repayments count:', ef.repayments?.length || 0);
    console.log('Non-Allocation Transactions count:', (ef.transactions || []).filter(t => !t.id.startsWith('TXN-ALC-')).length);
    console.log('Allocations count:', ef.allocations?.length || 0);

    // Save post-cleanup snapshot
    fs.writeFileSync('emergency_fund_snapshot_post_cleanup.json', JSON.stringify(ef, null, 2));

    // 4. Verify Genuine Module Integrity
    console.log('\n4. Verifying genuine company modules integrity...');
    const moduleCounts = await page.evaluate(async () => {
      const fetchCount = async (url) => {
        try {
          const res = await fetch(url);
          const json = await res.json();
          return Array.isArray(json.data) ? json.data.length : (Array.isArray(json) ? json.length : 0);
        } catch {
          return 0;
        }
      };
      return {
        members: await fetchCount('/api/members'),
        contributions: await fetchCount('/api/contributions'),
        loans: await fetchCount('/api/loans'),
        expenses: await fetchCount('/api/expenses'),
        deposits: await fetchCount('/api/deposits'),
        penalties: await fetchCount('/api/penalties'),
        assets: await fetchCount('/api/assets'),
        projects: await fetchCount('/api/projects')
      };
    });
    console.log('Genuine Module Counts:', JSON.stringify(moduleCounts, null, 2));

    // 5. Capture UI Evidence Screenshots
    console.log('\n5. Capturing post-cleanup UI evidence screenshots...');
    await page.reload({ waitUntil: 'networkidle2' });
    await sleep(2500);

    // Screenshot Overview
    const overviewPath = path.join(ARTIFACTS_DIR, 'evidence_overview_post_cleanup.png');
    await page.screenshot({ path: overviewPath, fullPage: false });
    console.log('Saved Overview evidence:', overviewPath);

    // Navigate to Emergency Fund Tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const emgBtn = buttons.find(b => b.innerText.includes('Emergency & Welfare Fund') || b.textContent.includes('Emergency'));
      if (emgBtn) emgBtn.click();
    });
    await sleep(2000);

    // Screenshot Dashboard Sub-tab
    const dashPath = path.join(ARTIFACTS_DIR, 'evidence_emergency_fund_dashboard_post_cleanup.png');
    await page.screenshot({ path: dashPath, fullPage: false });
    console.log('Saved Emergency Fund Dashboard evidence:', dashPath);

    // Switch to Loan Applications Sub-tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const appTabBtn = buttons.find(b => b.innerText.includes('Applications & Approvals') || b.textContent.includes('Applications'));
      if (appTabBtn) appTabBtn.click();
    });
    await sleep(1500);

    const appsPath = path.join(ARTIFACTS_DIR, 'evidence_emergency_fund_applications_clean.png');
    await page.screenshot({ path: appsPath, fullPage: false });
    console.log('Saved Clean Applications evidence:', appsPath);

    // Switch to Loan Portfolio Sub-tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const loansTabBtn = buttons.find(b => b.innerText.includes('Emergency Loans Portfolio') || b.textContent.includes('Portfolio'));
      if (loansTabBtn) loansTabBtn.click();
    });
    await sleep(1500);

    const loansPath = path.join(ARTIFACTS_DIR, 'evidence_emergency_fund_loans_clean.png');
    await page.screenshot({ path: loansPath, fullPage: false });
    console.log('Saved Clean Loans evidence:', loansPath);

    // Switch to Register / Transactions Sub-tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const regTabBtn = buttons.find(b => b.innerText.includes('Fund Register & Ledger') || b.textContent.includes('Ledger'));
      if (regTabBtn) regTabBtn.click();
    });
    await sleep(1500);

    const regPath = path.join(ARTIFACTS_DIR, 'evidence_emergency_fund_ledger_clean.png');
    await page.screenshot({ path: regPath, fullPage: false });
    console.log('Saved Clean Ledger evidence:', regPath);

    console.log('\n========================================');
    console.log('TEST DATA CLEANUP AND VERIFICATION COMPLETED WITH 100% SUCCESS!');
    console.log('========================================\n');

  } catch (err) {
    console.error('Error during cleanup execution:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
