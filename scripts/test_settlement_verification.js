const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://dreamloom-bms-injw.vercel.app';
const CHROME_PATH = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const ARTIFACT_DIR = '/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/d2f23adf-20bf-435a-af12-25996bc144b4';

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let passed = 0;
let failed = 0;

function assertTest(name, condition, details = '') {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${name} ${details ? `(${details})` : ''}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${name} ${details ? `(${details})` : ''}`);
  }
}

async function run() {
  console.log('================================================================================');
  console.log(' DREAMLOOM BMS — LOAN SETTLEMENT VERIFICATION SUITE (LOANS 1067 & 1070)');
  console.log(` Target: ${BASE_URL}`);
  console.log('================================================================================\n');

  // 1. Authenticate
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'kamera', password: 'Simon@%322' })
  });
  const cookie = loginRes.headers.get('set-cookie');
  assertTest('Authentication as Authorized Director', loginRes.status === 200);

  // 2. Verify Loan 1067 in /api/loans
  console.log('\n--- Checking Loan 1067 Production State ---');
  const loansRes = await fetch(`${BASE_URL}/api/loans`, { headers: { Cookie: cookie } });
  const loans = await loansRes.json();
  const l1067 = loans.find(l => l.id === 'L1067');
  assertTest('Loan 1067 Exists in Production', !!l1067);
  assertTest('Loan 1067 Status is Settled', l1067.status === 'Settled', `Status: ${l1067.status}`);
  assertTest('Loan 1067 Balance is Zero', l1067.balance === 0, `Balance: KES ${l1067.balance}`);
  assertTest('Loan 1067 Paid Matches Total Loan', l1067.paid === l1067.totalLoan, `Paid: KES ${l1067.paid}, Total: KES ${l1067.totalLoan}`);
  assertTest('Loan 1067 Has Repayment History Preserved', l1067.repayments?.length === 6, `Found ${l1067.repayments?.length} repayments`);

  // 3. Verify Loan 1070 in /api/loans
  console.log('\n--- Checking Loan 1070 Production State ---');
  const l1070 = loans.find(l => l.id === 'L1070');
  assertTest('Loan 1070 Exists in Production', !!l1070);
  assertTest('Loan 1070 Status is Settled', l1070.status === 'Settled', `Status: ${l1070.status}`);
  assertTest('Loan 1070 Balance is Zero', l1070.balance === 0, `Balance: KES ${l1070.balance}`);
  assertTest('Loan 1070 Paid Matches Total Loan', l1070.paid === 11700, `Paid: KES ${l1070.paid}, Total: KES ${l1070.totalLoan}`);
  assertTest('Loan 1070 Repayment Rep-74 Preserved', l1070.repayments?.length === 1 && l1070.repayments[0].amount === 11700, `Found ${l1070.repayments?.length} repayments`);

  // 4. Verify Member Directory Synchronization
  console.log('\n--- Verifying Cross-Module Member Directory Synchronization ---');
  const membersRes = await fetch(`${BASE_URL}/api/members`, { headers: { Cookie: cookie } });
  const membersData = await membersRes.json();
  const members = Array.isArray(membersData) ? membersData : (membersData.data || []);
  const david = members.find(m => m.id === 2);
  const daniel = members.find(m => m.id === 6);

  const davidL1067 = david?.loans?.find(l => l.id === 'L1067');
  const danielL1070 = daniel?.loans?.find(l => l.id === 'L1070');
  assertTest('David Member Record Shows L1067 Settled', davidL1067?.status === 'Settled', `Status: ${davidL1067?.status}`);
  assertTest('Daniel Member Record Shows L1070 Settled', danielL1070?.status === 'Settled', `Status: ${danielL1070?.status}`);

  // 5. Lifecycle Testing with Temporary Loan
  console.log('\n--- Testing Settlement Lifecycle with Temporary Test Loan ---');
  const tempLoanId = `TEST-SETTLE-${Date.now().toString().slice(-4)}`;
  
  // Create temporary loan: KES 8,000 at 10% Simple, 2 months
  const createRes = await fetch(`${BASE_URL}/api/loans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      id: tempLoanId,
      memberId: 1,
      principal: 8000,
      interestRate: 10,
      durationMonths: 2,
      interestMethod: 'Simple',
      issueDate: '2026-10-06',
      userEmail: 'kamera@dreamloom.co.ke'
    })
  });
  assertTest('Create Temporary Test Loan', createRes.status === 201, `Status: ${createRes.status}`);

  // Partial repayment 1: KES 2,000 -> Should be Partially Paid
  const rep1Res = await fetch(`${BASE_URL}/api/loans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      action: 'repayment',
      loanId: tempLoanId,
      amount: 2000,
      paymentDate: '2026-11-10',
      reference: `REF-PARTIAL-1-${Date.now().toString().slice(-4)}`,
      userEmail: 'kamera@dreamloom.co.ke'
    })
  });
  const rep1Data = await rep1Res.json();
  assertTest('Partial Repayment Leaves Loan Partially Paid', rep1Data.status === 'Partially Paid' && rep1Data.balance === 6800, `Status: ${rep1Data.status}, Bal: ${rep1Data.balance}`);

  // Duplicate reference prevention
  const dupRes = await fetch(`${BASE_URL}/api/loans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      action: 'repayment',
      loanId: tempLoanId,
      amount: 1000,
      paymentDate: '2026-11-10',
      reference: rep1Data.repayments[0]?.reference,
      userEmail: 'kamera@dreamloom.co.ke'
    })
  });
  assertTest('Prevent Duplicate Repayment Reference', dupRes.status === 409, `HTTP ${dupRes.status}`);

  // Final repayment: KES 6,800 -> Should immediately become Settled
  const rep2Res = await fetch(`${BASE_URL}/api/loans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      action: 'repayment',
      loanId: tempLoanId,
      amount: 6800,
      paymentDate: '2026-11-10',
      reference: `REF-FINAL-${Date.now().toString().slice(-4)}`,
      userEmail: 'kamera@dreamloom.co.ke'
    })
  });
  const rep2Data = await rep2Res.json();
  assertTest('Final Qualifying Repayment Automatically Settles Loan', rep2Data.status === 'Settled' && rep2Data.balance === 0, `Status: ${rep2Data.status}, Bal: ${rep2Data.balance}`);

  // Clean up temporary test loan
  await fetch(`${BASE_URL}/api/loans?id=${tempLoanId}&forcePermanentDelete=true&userEmail=kamera@dreamloom.co.ke`, {
    method: 'DELETE',
    headers: { Cookie: cookie }
  });
  console.log(`  Cleaned up temporary test loan ${tempLoanId}.`);

  // 6. Puppeteer UI Verification & Screenshot
  console.log('\n--- Capturing Production UI Evidence via Puppeteer ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    ignoreHTTPSErrors: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900', '--ignore-certificate-errors']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

    // Login if needed
    const pwd = await page.$('input[placeholder="Password"]');
    if (pwd) {
      await page.type('input[placeholder="Username or Email"]', 'kamera');
      await page.type('input[placeholder="Password"]', 'Simon@%322');
      await page.click('button[type="submit"]');
      await wait(3000);
    }

    // Navigate to Settled Loans History
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const lp = btns.find(b => b.textContent && b.textContent.includes('Loan Portfolio'));
      if (lp) lp.click();
    });
    await wait(2000);

    // Click 'Settled Loans History' sub-tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const sh = btns.find(b => b.textContent && b.textContent.includes('Settled Loans History'));
      if (sh) sh.click();
    });
    await wait(2000);

    const screenshotPath = path.join(ARTIFACT_DIR, 'evidence_loans_1067_1070_settled.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`  Saved screenshot: ${screenshotPath}`);
    assertTest('Captured Settled Loans History Screenshot', fs.existsSync(screenshotPath));

    await page.close();
  } finally {
    await browser.close();
  }

  console.log('\n================================================================================');
  console.log(` TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================================\n');

  if (failed > 0) process.exit(1);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
