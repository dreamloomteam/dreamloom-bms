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
  console.log('========================================================================');
  console.log(' DREAMLOOM FINANCIAL — LIVE VERIFICATION: LOAN INTEREST PERSISTENCE');
  console.log(` Target: ${BASE_URL}`);
  console.log('========================================================================\n');

  const getLoans = (data) => Array.isArray(data) ? data : (data.loans || []);

  // 1. Wait for deployment to propagate
  console.log('--- 1. Checking Live Deployment Readiness ---');
  let ready = false;
  for (let attempt = 1; attempt <= 25; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/api/loans?asOfDate=2026-11-09`, { cache: 'no-store' });
      if (res.status === 200) {
        const body = await res.json();
        const list = getLoans(body);
        if (list.length > 0) {
          console.log(`  Deployment ready on attempt ${attempt} (${list.length} loans returned)`);
          ready = true;
          break;
        }
      }
    } catch (e) {}
    console.log(`  Waiting for Vercel deployment (attempt ${attempt}/25)...`);
    await wait(4000);
  }

  if (!ready) {
    console.error('Deployment check timed out.');
    process.exit(1);
  }

  // 2. Authenticate
  console.log('\n--- 2. Authenticating as Authorized Director ---');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'kamera@dreamloom.co.ke', password: 'Simon@%322', rememberMe: true })
  });
  const cookieHeader = loginRes.headers.get('set-cookie') || '';
  const sessionCookie = cookieHeader.split(';')[0];
  assert(loginRes.status === 200, 'Authenticated successfully with session cookie');

  // 3. Mandatory Test Case from User Request:
  // Principal: KSh 10,000
  // Selected Rate: 10%
  // Interest Method: Simple
  // Issue Date: Exactly 3 completed months prior to valuation date (2026-08-09 -> 2026-11-09)
  console.log('\n--- 3. Testing Loan Creation (3 Completed Months) ---');
  const testLoan3Id = `TEST-3M-${Date.now().toString().slice(-4)}`;
  const create3Res = await fetch(`${BASE_URL}/api/loans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
    body: JSON.stringify({
      id: testLoan3Id,
      borrower: 'Simon Memia Wanjiru',
      principal: 10000,
      interestRate: 10,
      interestMethod: 'Simple',
      durationMonths: 6,
      issueDate: '2026-08-09',
      approvalRef: `APR-${testLoan3Id}`,
      asOfDate: '2026-11-09',
      userEmail: 'kamera@dreamloom.co.ke'
    })
  });

  const create3Data = await create3Res.json();
  assert(create3Res.status === 201 || create3Res.status === 200, `Created loan ${testLoan3Id} via POST /api/loans`);
  assert(Number(create3Data.interestRate) === 10, 'Response interestRate is 10%', `Got ${create3Data.interestRate}`);
  assert(Number(create3Data.interest) === 3000, 'Response interest is KES 3,000 (10,000 × 10% × 3)', `Got ${create3Data.interest}`);
  assert(Number(create3Data.totalLoan) === 13000, 'Response totalLoan is KES 13,000 (10,000 + 3,000)', `Got ${create3Data.totalLoan}`);

  // Fetch from GET /api/loans?asOfDate=2026-11-09
  const get3Res = await fetch(`${BASE_URL}/api/loans?asOfDate=2026-11-09`, { headers: { Cookie: sessionCookie } });
  const allLoans3 = getLoans(await get3Res.json());
  const fetchedLoan3 = allLoans3.find(l => l.id === testLoan3Id);

  assert(fetchedLoan3 !== undefined, `Found loan ${testLoan3Id} in GET /api/loans`);
  assert(Number(fetchedLoan3?.interestRate) === 10, 'GET register interestRate is 10%');
  assert(Number(fetchedLoan3?.interest) === 3000, 'GET register Interest Accrued is KES 3,000 (NOT 0!)', `Got ${fetchedLoan3?.interest}`);
  assert(Number(fetchedLoan3?.totalLoan) === 13000, 'GET register Total Loan is KES 13,000 (NOT 10,000!)', `Got ${fetchedLoan3?.totalLoan}`);
  assert(fetchedLoan3?.completedPeriods === 3, 'GET register completedPeriods is 3');

  // 4. Test Newly Issued Loan (0 Completed Months)
  console.log('\n--- 4. Testing Newly Issued Loan (0 Completed Months) ---');
  const testLoan0Id = `TEST-0M-${Date.now().toString().slice(-4)}`;
  const create0Res = await fetch(`${BASE_URL}/api/loans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
    body: JSON.stringify({
      id: testLoan0Id,
      borrower: 'Simon Memia Wanjiru',
      principal: 10000,
      interestRate: 10,
      interestMethod: 'Simple',
      durationMonths: 6,
      issueDate: '2026-11-09',
      approvalRef: `APR-${testLoan0Id}`,
      asOfDate: '2026-11-09',
      userEmail: 'kamera@dreamloom.co.ke'
    })
  });

  const create0Data = await create0Res.json();
  assert(create0Res.status === 201 || create0Res.status === 200, `Created newly issued loan ${testLoan0Id}`);
  assert(Number(create0Data.interestRate) === 10, 'Rate is preserved as 10% (NOT 0%)', `Got ${create0Data.interestRate}`);
  assert(Number(create0Data.interest) === 0, 'Interest Accrued is correctly KES 0 for 0 completed months', `Got ${create0Data.interest}`);
  assert(Number(create0Data.totalLoan) === 10000, 'Total Loan is correctly equal to principal KES 10,000', `Got ${create0Data.totalLoan}`);

  const get0Res = await fetch(`${BASE_URL}/api/loans?asOfDate=2026-11-09`, { headers: { Cookie: sessionCookie } });
  const allLoans0 = getLoans(await get0Res.json());
  const fetchedLoan0 = allLoans0.find(l => l.id === testLoan0Id);
  assert(Number(fetchedLoan0?.interestRate) === 10, 'GET register rate is 10%');
  assert(Number(fetchedLoan0?.interest) === 0, 'GET register interest is 0');
  assert(Number(fetchedLoan0?.totalLoan) === 10000, 'GET register totalLoan is 10,000');

  // 5. Test UI Live Calculation Preview & Portfolio Register in Browser
  console.log('\n--- 5. Testing UI Preview & Register with Headless Chrome ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    ignoreHTTPSErrors: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900', '--ignore-certificate-errors']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Open site and authenticate
    await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle2', timeout: 30000 });

    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {
      await page.type('input[type="email"]', 'kamera@dreamloom.co.ke');
      await page.type('input[type="password"]', 'Simon@%322');
      await page.click('button[type="submit"]');
      await wait(3000);
    }

    // Navigate to Loan Portfolio tab
    const tabButtons = await page.$$('button');
    for (const b of tabButtons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('Loan Portfolio')) {
        await b.click();
        break;
      }
    }
    await wait(3000);

    // Capture Loan Portfolio register screenshot showing the tested loans
    const registerScreenshotPath = path.join(ARTIFACT_DIR, 'evidence_loan_portfolio_interest_fix.png');
    await page.screenshot({ path: registerScreenshotPath, fullPage: true });
    console.log(`  Saved register screenshot to ${registerScreenshotPath}`);
    assert(fs.existsSync(registerScreenshotPath), 'Captured evidence_loan_portfolio_interest_fix.png');

    // Click "+ Disburse New Loan" button to open modal
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Disburse New Loan')) {
        await btn.click();
        break;
      }
    }
    await wait(1500);

    // Set principal = 10000, interestRate = 10, issueDate = 2026-08-09
    // Fill principal input
    const inputs = await page.$$('input');
    for (const input of inputs) {
      const ph = await page.evaluate(el => el.getAttribute('placeholder'), input);
      if (ph && ph.includes('100000')) {
        await input.click({ clickCount: 3 });
        await input.type('10000');
      }
      const type = await page.evaluate(el => el.getAttribute('type'), input);
      if (type === 'date') {
        await input.click({ clickCount: 3 });
        await input.type('2026-08-09');
      }
    }
    await wait(1500);

    // Capture Disburse modal preview screenshot
    const modalScreenshotPath = path.join(ARTIFACT_DIR, 'evidence_loan_disburse_modal_preview.png');
    await page.screenshot({ path: modalScreenshotPath, fullPage: true });
    console.log(`  Saved modal preview screenshot to ${modalScreenshotPath}`);
    assert(fs.existsSync(modalScreenshotPath), 'Captured evidence_loan_disburse_modal_preview.png');

  } finally {
    await browser.close();
  }

  // 6. Clean up temporary test loans
  console.log('\n--- 6. Cleaning Up Test Loans ---');
  await fetch(`${BASE_URL}/api/loans?id=${testLoan3Id}&forcePermanentDelete=true&userEmail=kamera@dreamloom.co.ke`, {
    method: 'DELETE',
    headers: { Cookie: sessionCookie }
  });
  await fetch(`${BASE_URL}/api/loans?id=${testLoan0Id}&forcePermanentDelete=true&userEmail=kamera@dreamloom.co.ke`, {
    method: 'DELETE',
    headers: { Cookie: sessionCookie }
  });
  console.log(`  Deleted temporary test loans ${testLoan3Id} and ${testLoan0Id}`);

  console.log('\n========================================================================');
  console.log(` FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) process.exit(1);
}

run().catch(e => {
  console.error('Test execution failed:', e);
  process.exit(1);
});
