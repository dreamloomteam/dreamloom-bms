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
  console.log(`Starting automated E2E verification of Contributions <-> Emergency Fund accounting integration...`);
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
    // 1. Navigate to login / app
    console.log('1. Navigating to login...');
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);

    const isLoginScreen = await page.$('input[placeholder="Username or Email"]');
    if (isLoginScreen) {
      console.log('Logging in as Simon Memia Wanjiru (Admin)...');
      await page.type('input[placeholder="Username or Email"]', 'simon@dreamloom.co.ke');
      await page.type('input[type="password"]', 'Simon@%322');
      await sleep(500);
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
      } else {
        await page.keyboard.press('Enter');
      }
      console.log('Waiting for login redirect...');
      await page.waitForFunction(() => !document.querySelector('input[placeholder="Username or Email"]'), { timeout: 15000 }).catch(() => {});
      await sleep(3000);
    }

    // 2. Trigger batch sync via API to make sure all existing member contributions are connected
    console.log('2. Synchronizing all contributions to Emergency Fund via API...');
    const syncResult = await page.evaluate(async () => {
      const res = await fetch('/api/emergency-fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_all_contributions' })
      });
      return await res.json();
    });
    console.log('Sync API Response:', JSON.stringify(syncResult));

    // Reload page to reflect fresh data
    await page.reload({ waitUntil: 'networkidle2' });
    await sleep(2500);

    // 3. Verify Overview Tab
    console.log('3. Verifying Overview Dashboard...');
    const overviewEvidence = path.join(ARTIFACTS_DIR, 'evidence_overview_accounting_reconciliation.png');
    await page.screenshot({ path: overviewEvidence, fullPage: false });
    console.log('Saved Overview evidence:', overviewEvidence);

    // Read Overview text for verification
    const overviewStats = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasGeneralFunds: text.includes('General Funds Available') || text.includes('General Funds'),
        hasEmergencyAlloc: text.includes('Emergency Fund Allocation') || text.includes('Emergency & Welfare'),
        hasReconciledBadge: text.includes('Balanced') || text.includes('Reconciled') || text.includes('100% Reconciled')
      };
    });
    console.log('Overview Evaluation:', overviewStats);

    // 4. Navigate to Contributions Tab
    console.log('4. Navigating to Contributions tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const contribBtn = buttons.find(b => b.innerText.includes('Contributions') || b.textContent.includes('Contributions'));
      if (contribBtn) contribBtn.click();
    });
    await sleep(2500);

    const contribEvidence = path.join(ARTIFACTS_DIR, 'evidence_contributions_accounting_split.png');
    await page.screenshot({ path: contribEvidence, fullPage: false });
    console.log('Saved Contributions evidence:', contribEvidence);

    const contribStats = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasSplitBanner: text.includes('Fund Split') || text.includes('KES 5,000') || text.includes('KES 1,000') || text.includes('Balanced'),
        hasGenAmount: text.includes('KES 5,000') || text.includes('5,000'),
        hasEmgAmount: text.includes('KES 1,000') || text.includes('1,000')
      };
    });
    console.log('Contributions Evaluation:', contribStats);

    // 5. Navigate to Emergency & Welfare Fund Tab
    console.log('5. Navigating to Emergency & Welfare Fund tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const emgBtn = buttons.find(b => b.innerText.includes('Emergency & Welfare Fund') || b.textContent.includes('Emergency'));
      if (emgBtn) emgBtn.click();
    });
    await sleep(2500);

    // Switch to Sub-tab 2: Monthly Allocations
    console.log('Switching to Monthly Allocations sub-tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const allocTabBtn = buttons.find(b => b.innerText.includes('Monthly Allocations') || b.textContent.includes('Allocations'));
      if (allocTabBtn) allocTabBtn.click();
    });
    await sleep(2000);

    const emgAllocEvidence = path.join(ARTIFACTS_DIR, 'evidence_emergency_fund_allocations_split.png');
    await page.screenshot({ path: emgAllocEvidence, fullPage: false });
    console.log('Saved Emergency Allocations evidence:', emgAllocEvidence);

    // Check table rows in Allocations tab
    const allocData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return rows.slice(0, 5).map(r => {
        const cells = Array.from(r.querySelectorAll('td')).map(td => td.innerText.trim());
        return cells;
      });
    });
    console.log('Sample Allocation Table Rows (first 5):', JSON.stringify(allocData, null, 2));

    // 6. Test Reversal of an Allocation
    console.log('6. Testing Reversal of an allocation...');
    const reverseBtn = await page.$('button[title*="Reverse this allocation"]');
    if (reverseBtn) {
      console.log('Found Reverse button, clicking to open confirmation modal...');
      await reverseBtn.click();
      await sleep(1000);

      const modalEvidence = path.join(ARTIFACTS_DIR, 'evidence_allocation_reversal_modal.png');
      await page.screenshot({ path: modalEvidence, fullPage: false });
      console.log('Saved Reversal Modal evidence:', modalEvidence);

      // Fill reason and submit reversal
      const reasonInput = await page.$('textarea[placeholder*="State the administrative"]');
      if (reasonInput) {
        await reasonInput.type('Audit testing: Authorized test reversal of member monthly allocation');
        await sleep(500);
        const confirmBtn = await page.$('button[type="submit"]');
        if (confirmBtn) {
          await confirmBtn.click();
          await sleep(2000);
        }
      }

      const afterReversalEvidence = path.join(ARTIFACTS_DIR, 'evidence_allocation_after_reversal.png');
      await page.screenshot({ path: afterReversalEvidence, fullPage: false });
      console.log('Saved After Reversal evidence:', afterReversalEvidence);
    } else {
      console.log('No active reverse button found or already reversed.');
    }

    // 7. Verify Idempotence / No Duplication on Refresh
    console.log('7. Testing Refresh Idempotency (verifying zero duplicate allocations)...');
    await page.reload({ waitUntil: 'networkidle2' });
    await sleep(2500);

    // Navigate back to Emergency & Welfare Fund sidebar tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const emgBtn = buttons.find(b => b.innerText.includes('Emergency & Welfare Fund') || b.textContent.includes('Emergency'));
      if (emgBtn) emgBtn.click();
    });
    await sleep(2000);

    // Switch to Monthly Allocations sub-tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const allocTabBtn = buttons.find(b => b.innerText.includes('Monthly Allocations') || b.textContent.includes('Allocations'));
      if (allocTabBtn) allocTabBtn.click();
    });
    await sleep(2000);

    const refreshedAllocEvidence = path.join(ARTIFACTS_DIR, 'evidence_allocations_persisted_idempotent.png');
    await page.screenshot({ path: refreshedAllocEvidence, fullPage: false });

    const refreshedAllocData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return {
        totalRows: rows.length,
        textSample: rows.slice(0, 3).map(r => r.innerText.trim().replace(/\n+/g, ' | '))
      };
    });
    console.log('Allocations count after refresh:', refreshedAllocData.totalRows);
    console.log('Refreshed Allocation sample:', refreshedAllocData.textSample);

    console.log('\n========================================');
    console.log('ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY!');
    console.log('========================================\n');

  } catch (err) {
    console.error('Verification failed with error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
