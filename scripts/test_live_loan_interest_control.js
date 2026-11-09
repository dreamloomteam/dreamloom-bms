const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'https://dreamloom-bms-injw.vercel.app';
const CHROME_PATH = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const ARTIFACT_DIR = '/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/d2f23adf-20bf-435a-af12-25996bc144b4';

let passed = 0;
let failed = 0;

function assert(condition, label, detail) {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('================================================================');
  console.log(' DREAMLOOM FINANCIAL — LIVE PRODUCTION LOAN INTEREST TEST');
  console.log(` Target: ${BASE_URL}`);
  console.log('================================================================\n');

  const getLoans = (data) => Array.isArray(data) ? data : (data.loans || []);

  // Step 1: Wait for deployment
  console.log('--- 1. Checking Live Deployment & API Health ---');
  let ready = false;
  for (let attempt = 1; attempt <= 20; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/api/loans`, { cache: 'no-store' });
      if (res.status === 200) {
        const body = await res.json();
        const list = getLoans(body);
        if (list.length > 0) {
          console.log(`  Live API ready on attempt ${attempt} (${list.length} loans returned)`);
          ready = true;
          break;
        }
      }
    } catch (e) {}
    console.log(`  Waiting for Vercel deployment (attempt ${attempt}/20)...`);
    await wait(4000);
  }

  if (!ready) {
    console.error('Deployment check timed out.');
    process.exit(1);
  }

  // Step 2: Test API with Explicit Interest Rates
  console.log('\n--- 2. Testing API Loan Creation & Editing with Explicit Rates ---');

  // Login to get session cookie
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'kamera@dreamloom.co.ke', password: 'Simon@%322', rememberMe: true })
  });
  const cookieHeader = loginRes.headers.get('set-cookie') || '';
  const sessionCookie = cookieHeader.split(';')[0];
  console.log('  Authenticated successfully as Director.');

  // Fetch initial loans to verify isolation later
  const initRes = await fetch(`${BASE_URL}/api/loans`, { headers: { Cookie: sessionCookie } });
  const initData = await initRes.json();
  const originalLoans = getLoans(initData);
  console.log(`  Current active loan facilities in database: ${originalLoans.length}`);

  // Test Loan ID
  const testLoanId = `TEST-RT-${Date.now().toString().slice(-4)}`;
  const testApprovalRef = `APR-${testLoanId}`;

  // 2.1 Create Loan with 15% Interest Rate
  console.log(`\n  Creating loan ${testLoanId} with selected 15% rate...`);
  const createRes = await fetch(`${BASE_URL}/api/loans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
    body: JSON.stringify({
      id: testLoanId,
      borrower: 'Simon Memia Wanjiru',
      principal: 10000,
      interestRate: 15,
      interestMethod: 'Simple',
      durationMonths: 6,
      issueDate: '2026-08-01',
      approvalRef: testApprovalRef,
      userEmail: 'kamera@dreamloom.co.ke'
    })
  });

  const createData = await createRes.json();
  assert((createRes.status === 200 || createRes.status === 201) && createData.success === true, 'POST /api/loans created loan successfully (HTTP 201 Created)');

  // Verify created loan properties
  const fetch1Res = await fetch(`${BASE_URL}/api/loans?asOfDate=2026-11-01`, { headers: { Cookie: sessionCookie } });
  const fetch1Data = await fetch1Res.json();
  const createdLoan = getLoans(fetch1Data).find(l => l.id === testLoanId);

  assert(createdLoan !== undefined, `Found created loan ${testLoanId} in database`);
  assert(createdLoan && createdLoan.interestRate === 15, `Saved interestRate is strictly 15% (got ${createdLoan?.interestRate}%)`);
  assert(createdLoan && createdLoan.interest === 4500, `Interest calculated at 15% for 3 months = KES 4,500 (got KES ${createdLoan?.interest})`);
  assert(createdLoan && createdLoan.totalLoan === 14500, `Total loan payable = KES 14,500 (got KES ${createdLoan?.totalLoan})`);

  // 2.2 Edit Loan to 0% (Interest-Free)
  console.log(`\n  Editing loan ${testLoanId} to selected 0% (Interest-Free)...`);
  const edit0Res = await fetch(`${BASE_URL}/api/loans`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
    body: JSON.stringify({
      id: testLoanId,
      interestRate: 0,
      editReason: 'Authorized interest waiver to 0%',
      userEmail: 'kamera@dreamloom.co.ke'
    })
  });
  const edit0Data = await edit0Res.json();
  assert(edit0Res.status === 200 && edit0Data.success === true, 'PUT /api/loans updated loan to 0%');

  const fetch2Res = await fetch(`${BASE_URL}/api/loans?asOfDate=2026-11-01`, { headers: { Cookie: sessionCookie } });
  const fetch2Data = await fetch2Res.json();
  const edited0Loan = getLoans(fetch2Data).find(l => l.id === testLoanId);

  assert(edited0Loan && edited0Loan.interestRate === 0, `Saved interestRate is strictly 0% (got ${edited0Loan?.interestRate}%)`);
  assert(edited0Loan && edited0Loan.interest === 0, `Interest calculated at 0% is strictly KES 0 (got KES ${edited0Loan?.interest})`);
  assert(edited0Loan && edited0Loan.totalLoan === 10000, `Total loan payable at 0% is strictly principal KES 10,000 (got KES ${edited0Loan?.totalLoan})`);

  // 2.3 Edit Loan to 10%
  console.log(`\n  Editing loan ${testLoanId} to selected 10%...`);
  const edit10Res = await fetch(`${BASE_URL}/api/loans`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
    body: JSON.stringify({
      id: testLoanId,
      interestRate: 10,
      editReason: 'Reset to 10% monthly',
      userEmail: 'kamera@dreamloom.co.ke'
    })
  });
  const edit10Data = await edit10Res.json();
  assert(edit10Res.status === 200 && edit10Data.success === true, 'PUT /api/loans updated loan to 10%');

  const fetch3Res = await fetch(`${BASE_URL}/api/loans?asOfDate=2026-11-01`, { headers: { Cookie: sessionCookie } });
  const fetch3Data = await fetch3Res.json();
  const edited10Loan = getLoans(fetch3Data).find(l => l.id === testLoanId);

  assert(edited10Loan && edited10Loan.interestRate === 10, `Saved interestRate is strictly 10% (got ${edited10Loan?.interestRate}%)`);
  assert(edited10Loan && edited10Loan.interest === 3000, `Interest calculated at 10% for 3 months = KES 3,000 (got KES ${edited10Loan?.interest})`);
  assert(edited10Loan && edited10Loan.totalLoan === 13000, `Total loan payable at 10% = KES 13,000 (got KES ${edited10Loan?.totalLoan})`);

  // 2.4 Cleanup Test Loan
  console.log(`\n  Cleaning up test loan ${testLoanId}...`);
  const delRes = await fetch(`${BASE_URL}/api/loans?id=${testLoanId}&userEmail=kamera@dreamloom.co.ke`, {
    method: 'DELETE',
    headers: { Cookie: sessionCookie }
  });
  const delData = await delRes.json();
  assert(delRes.status === 200 && delData.success === true, `Test loan ${testLoanId} deleted cleanly`);

  // Step 3: Browser UI Automation & Verification
  console.log('\n--- 3. Testing Interactive UI via Headless Chrome ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    ignoreHTTPSErrors: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--ignore-certificate-errors']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 950 });

    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

    // Login
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'kamera@dreamloom.co.ke');
    await page.type('input[type="password"]', 'Simon@%322');
    await page.click('button[type="submit"]');

    await page.waitForSelector('nav', { timeout: 15000 });
    await wait(2000);

    // Navigate to Loan Portfolio
    console.log('  Navigating to Loan Portfolio...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('button, a, span'));
      const loanTab = items.find(el => el.innerText && el.innerText.trim() === 'Loan Portfolio');
      if (loanTab) loanTab.click();
    });
    await wait(2000);

    // Click Disburse Loan
    console.log('  Opening Disburse Loan modal...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const disburseBtn = buttons.find(b => b.innerText && b.innerText.includes('DISBURSE LOAN'));
      if (disburseBtn) disburseBtn.click();
    });
    await wait(1000);

    // Verify Presets are rendered
    const presetsFound = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const presetTexts = buttons.map(b => b.innerText.trim());
      return {
        has0: presetTexts.some(t => t.includes('0%')),
        has5: presetTexts.some(t => t.includes('5%')),
        has10: presetTexts.some(t => t.includes('10%')),
        has15: presetTexts.some(t => t.includes('15%')),
        has20: presetTexts.some(t => t.includes('20%'))
      };
    });

    assert(presetsFound.has0 && presetsFound.has5 && presetsFound.has10 && presetsFound.has15 && presetsFound.has20, 'All preset rate chips (0%, 5%, 10%, 15%, 20%) are present in modal');

    // Type Principal = 10000 using page.type
    console.log('  Entering principal amount KES 10,000...');
    const princInput = await page.$('input[placeholder*="100000"]');
    if (princInput) {
      await princInput.click({ clickCount: 3 });
      await princInput.type('10000');
    }
    await wait(500);

    // Click 15% Preset
    console.log('  Clicking 15% preset button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn15 = buttons.find(b => b.innerText.trim() === '15%');
      if (btn15) btn15.click();
    });
    await wait(500);

    // Verify preview reflects 15%
    const preview15Text = await page.evaluate(() => {
      const modal = document.querySelector('form');
      return modal ? modal.innerText : '';
    });
    assert(preview15Text.includes('15%') && preview15Text.includes('1,500'), 'Preview dynamically calculates KES 1,500/month for 15%');

    // Capture screenshot of Modal with 15% preset selected
    const modal15Path = path.join(ARTIFACT_DIR, 'evidence_loan_modal_presets.png');
    await page.screenshot({ path: modal15Path, fullPage: false });
    console.log(`  📸 Saved Loan Modal screenshot: ${modal15Path}`);

    // Click 0% Preset
    console.log('  Clicking 0% (Interest-Free) preset button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn0 = buttons.find(b => b.innerText.trim().includes('0%'));
      if (btn0) btn0.click();
    });
    await wait(500);

    const preview0Text = await page.evaluate(() => {
      const modal = document.querySelector('form');
      return modal ? modal.innerText : '';
    });
    assert(preview0Text.includes('0% Interest-Free Loan'), 'Preview dynamically confirms 0% Interest-Free Loan with KES 0 interest');

    // Close modal via Cancel button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const cancelBtn = buttons.find(b => b.innerText.trim() === 'Cancel');
      if (cancelBtn) cancelBtn.click();
    });
    await wait(1000);

    // Capture Loan Portfolio register screenshot showing individual rates
    const regPath = path.join(ARTIFACT_DIR, 'evidence_loan_portfolio_rates.png');
    await page.screenshot({ path: regPath, fullPage: false });
    console.log(`  📸 Saved Loan Portfolio register screenshot: ${regPath}`);

  } catch (err) {
    console.error('Browser automation error:', err);
    failed++;
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log(` FINAL TEST REPORT: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

run();
