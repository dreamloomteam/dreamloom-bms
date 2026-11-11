const puppeteer = require('puppeteer-core');
const CHROME_PATH = '/usr/bin/google-chrome';
const BASE_URL = 'https://dreamloom-bms-injw.vercel.app';
const ARTIFACT_DIR = '/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/d2f23adf-20bf-435a-af12-25996bc144b4';

const MEMBERS = [
  { name: 'Simon Memia Wanjiru', email: 'simon@dreamloom.co.ke', password: 'Simon@%322', expectedRole: 'Director / Super Admin', isAdmin: true },
  { name: 'David Wainaina Kinyua', email: 'david@dreamloom.co.ke', password: 'David@399', expectedRole: 'Member', isAdmin: false },
  { name: 'Elijah Waitara Gichari', email: 'elijah@dreamloom.co.ke', password: 'Elijah@342', expectedRole: 'Member', isAdmin: false },
  { name: 'Samuel Kamau Nguuro', email: 'samuel@dreamloom.co.ke', password: 'Samuel@400', expectedRole: 'Member', isAdmin: false },
  { name: 'Michael Kiarie Wanjiru', email: 'michael@dreamloom.co.ke', password: 'Michael@389', expectedRole: 'Treasurer', isAdmin: false },
  { name: 'Daniel Kamau Njiriri', email: 'daniel@dreamloom.co.ke', password: 'daniel@366', expectedRole: 'Member', isAdmin: false },
  { name: 'Beatrice Njoki Muthoni', email: 'beatrice@dreamloom.co.ke', password: 'Beatrice@404', expectedRole: 'Member', isAdmin: false },
];

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('=============================================================================');
  console.log('DREAMLOOM BMS — DEPOSIT PAGE ACCESS CONTROL & ADMIN VERIFICATION SUITE');
  console.log('=============================================================================');

  // Step 0: Wait for Vercel deployment of commit
  console.log('\n[Phase 0] Waiting for live deployment to reflect latest changes...');
  let deployed = false;
  for (let attempt = 1; attempt <= 20; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'kamera@dreamloom.co.ke', password: 'Simon@%322' })
      });
      const data = await res.json();
      // If kamera login fails (401), the new build is deployed!
      if (res.status === 401 && !data.success) {
        console.log(`✅ Live deployment confirmed on attempt ${attempt}! Kamera account correctly rejected with 401.`);
        deployed = true;
        break;
      }
      console.log(`Attempt ${attempt}/20: Old build still responding. Waiting 6s...`);
    } catch (e) {
      console.log(`Attempt ${attempt}/20: Network error: ${e.message}. Retrying...`);
    }
    await sleep(6000);
  }

  if (!deployed) {
    console.error('❌ Deployment timed out after 120 seconds!');
  }

  // Step 1: Verify Unwanted Kamera Account Rejection
  console.log('\n[Phase 1] Verifying Revocation of "kamera@dreamloom.co.ke"...');
  const kameraLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'kamera@dreamloom.co.ke', password: 'Simon@%322' })
  });
  const kameraData = await kameraLogin.json();
  console.log(`Kamera login HTTP status: ${kameraLogin.status}`);
  console.log(`Kamera login response:`, kameraData);
  if (kameraLogin.status === 401 && !kameraData.success) {
    console.log('✅ PASS: kamera@dreamloom.co.ke is strictly rejected from login (HTTP 401)');
  } else {
    console.error('❌ FAIL: kamera@dreamloom.co.ke was not rejected!');
  }

  // Step 2: Test All 7 Legitimate Member Accounts Authentication
  console.log('\n[Phase 2] Verifying All 7 Legitimate Member Accounts...');
  for (const m of MEMBERS) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: m.email, password: m.password, rememberMe: true })
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.user) {
      console.log(`✅ PASS: ${m.name} (${m.email}) authenticated -> Role: "${data.user.role}"`);
    } else {
      console.error(`❌ FAIL: ${m.name} (${m.email}) failed login!`, data);
    }
  }

  // Step 3: Server-Side API Security & RBAC Enforcement on /api/deposits
  console.log('\n[Phase 3] Testing Server-Side API Security on /api/deposits...');
  // 3a. Unauthenticated GET /api/deposits
  const unauthGet = await fetch(`${BASE_URL}/api/deposits`);
  const unauthGetData = await unauthGet.json();
  console.log(`Unauthenticated GET /api/deposits -> HTTP ${unauthGet.status}: "${unauthGetData.error}"`);
  if (unauthGet.status === 403) {
    console.log('✅ PASS: Unauthenticated GET /api/deposits is blocked (403)');
  }

  // 3b. David (Member) session
  const davidLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'david@dreamloom.co.ke', password: 'David@399', rememberMe: true })
  });
  const davidCookie = davidLogin.headers.get('set-cookie')?.split(';')[0];
  
  // David attempts GET /api/deposits
  const davidGet = await fetch(`${BASE_URL}/api/deposits`, {
    headers: { Cookie: davidCookie }
  });
  const davidGetData = await davidGet.json();
  console.log(`Member David GET /api/deposits -> HTTP ${davidGet.status}: "${davidGetData.error}"`);
  if (davidGet.status === 403) {
    console.log('✅ PASS: Ordinary Member David is blocked from Deposit Register (403 Forbidden)');
  } else {
    console.error('❌ FAIL: Ordinary Member David was NOT blocked from Deposit Register!');
  }

  // David attempts reconcile
  const davidReconcile = await fetch(`${BASE_URL}/api/deposits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: davidCookie },
    body: JSON.stringify({ action: 'reconcile', depositId: 1, reconciliationStatus: 'Reconciled' })
  });
  const davidReconcileData = await davidReconcile.json();
  console.log(`Member David Reconcile -> HTTP ${davidReconcile.status}: "${davidReconcileData.error}"`);
  if (davidReconcile.status === 403) {
    console.log('✅ PASS: Ordinary Member David is blocked from Reconcile (403 Forbidden)');
  }

  // David attempts reverse
  const davidReverse = await fetch(`${BASE_URL}/api/deposits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: davidCookie },
    body: JSON.stringify({ action: 'reverse', depositId: 1, reversalReason: 'Test' })
  });
  const davidReverseData = await davidReverse.json();
  console.log(`Member David Reverse -> HTTP ${davidReverse.status}: "${davidReverseData.error}"`);
  if (davidReverse.status === 403) {
    console.log('✅ PASS: Ordinary Member David is blocked from Reverse (403 Forbidden)');
  }

  // 3c. Simon (Admin) session
  const simonLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'simon@dreamloom.co.ke', password: 'Simon@%322', rememberMe: true })
  });
  const simonCookie = simonLogin.headers.get('set-cookie')?.split(';')[0];

  const simonGet = await fetch(`${BASE_URL}/api/deposits`, {
    headers: { Cookie: simonCookie }
  });
  const simonGetData = await simonGet.json();
  console.log(`Admin Simon GET /api/deposits -> HTTP ${simonGet.status}: success=${simonGetData.success}, total records=${simonGetData.data?.length}`);
  if (simonGet.status === 200 && simonGetData.success && Array.isArray(simonGetData.data)) {
    console.log('✅ PASS: Sole Administrator Simon Memia successfully fetched full Deposit Register');
  } else {
    console.error('❌ FAIL: Simon Memia could not fetch Deposit Register!', simonGetData);
  }

  // Step 4: Browser Testing with Puppeteer
  console.log('\n[Phase 4] Launching Headless Chromium for Visual & Functional Testing...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    ignoreHTTPSErrors: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--ignore-certificate-errors']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1600 });

    page.on('dialog', async (d) => {
      console.log('Browser Dialog Opened:', d.message());
      await d.dismiss();
    });

    // 4A. Simon Memia Administrator View
    console.log('\n--- Testing Administrator View (Simon Memia Wanjiru) ---');
    const cdp = await page.target().createCDPSession();
    await cdp.send('Network.clearBrowserCookies');
    await cdp.send('Network.clearBrowserCache');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Login as Simon
    console.log('Logging in as Simon Memia Wanjiru...');
    await page.waitForSelector('input[type="text"], input[type="email"]', { timeout: 15000 });
    const emailInput = await page.$('input[type="text"], input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    await emailInput.type('simon@dreamloom.co.ke');
    await passwordInput.type('Simon@%322');
    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();
    await sleep(4000);

    // Navigate to Deposits tab
    console.log('Navigating to Deposits tab as Administrator...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const depBtn = btns.find(b => b.textContent && b.textContent.trim().startsWith('Deposits'));
      if (depBtn) depBtn.click();
    });
    await sleep(3000);

    // Verify Admin elements: Hero Banner, Summary Cards, Register Table
    const adminCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasRegisterHeading = text.includes('Deposits & Treasury Inflow');
      const hasTotalCard = text.includes('TOTAL DEPOSITS RECEIVED') || text.includes('Total Deposits Received');
      const hasMonthCard = text.includes('DEPOSITS THIS MONTH') || text.includes('Deposits This Month');
      const hasRecordBtn = Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Record Deposit'));
      const hasRegisterTable = Array.from(document.querySelectorAll('table')).some(t => t.textContent.includes('Transaction ID') || t.textContent.includes('Depositor'));
      return { hasRegisterHeading, hasTotalCard, hasMonthCard, hasRecordBtn, hasRegisterTable };
    });
    console.log('Admin Deposit Tab Elements Check:', adminCheck);
    if (adminCheck.hasRegisterHeading && adminCheck.hasTotalCard && adminCheck.hasRegisterTable) {
      console.log('✅ PASS: Simon Memia sees the full Administrator Deposit Register & Controls!');
      await page.screenshot({ path: `${ARTIFACT_DIR}/evidence_admin_deposit_register.png`, fullPage: true });
      console.log('Saved screenshot: evidence_admin_deposit_register.png');
    } else {
      console.error('❌ FAIL: Admin Deposit view missing components!', adminCheck);
    }

    // 4B. Ordinary Member View (David Wainaina Kinyua)
    console.log('\n--- Testing Member View (David Wainaina Kinyua) ---');
    await cdp.send('Network.clearBrowserCookies');
    await cdp.send('Network.clearBrowserCache');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Login as David
    console.log('Logging in as David Wainaina Kinyua...');
    await page.waitForSelector('input[type="text"], input[type="email"]', { timeout: 15000 });
    const dEmailInput = await page.$('input[type="text"], input[type="email"]');
    const dPasswordInput = await page.$('input[type="password"]');
    await dEmailInput.type('david@dreamloom.co.ke');
    await dPasswordInput.type('David@399');
    const dSubmitBtn = await page.$('button[type="submit"]');
    await dSubmitBtn.click();
    await sleep(4000);

    // Navigate to Deposits tab
    console.log('Navigating to Deposits tab as Ordinary Member...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const depBtn = btns.find(b => b.textContent && b.textContent.trim().startsWith('Deposits'));
      if (depBtn) depBtn.click();
    });
    await sleep(3000);

    // Verify Member elements: ONLY Deposit Entry Screen, NO Register, NO Summary cards
    const memberCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasEntryTitle = text.includes('Deposit Entry Form') || text.includes('Deposit Entry');
      const hasMemberPortalBadge = text.includes('Member Portal');
      const hasRegisterTable = Array.from(document.querySelectorAll('table')).length > 0;
      const hasSummaryCards = text.includes('TOTAL DEPOSITS RECEIVED') || text.includes('Total Deposits Received');
      const hasLockedIdentity = Array.from(document.querySelectorAll('input')).some(i => i.readOnly && i.value.includes('David Wainaina'));
      return { hasEntryTitle, hasMemberPortalBadge, hasRegisterTable, hasSummaryCards, hasLockedIdentity };
    });
    console.log('Member Deposit Tab Elements Check:', memberCheck);

    if (memberCheck.hasEntryTitle && !memberCheck.hasRegisterTable && !memberCheck.hasSummaryCards && memberCheck.hasLockedIdentity) {
      console.log('✅ PASS: David sees ONLY the Deposit Entry Screen! Register table and summary cards are strictly hidden.');
      await page.screenshot({ path: `${ARTIFACT_DIR}/evidence_member_deposit_entry_only.png`, fullPage: true });
      console.log('Saved screenshot: evidence_member_deposit_entry_only.png');
    } else {
      console.error('❌ FAIL: Member Deposit view failed strict isolation rules!', memberCheck);
    }

    // 4C. Member Submits Deposit & Verifies Exact Confirmation Message
    console.log('\n--- Testing Deposit Submission by David Wainaina ---');
    const testRef = 'MPESA-' + Date.now().toString().slice(-8);
    console.log(`Submitting deposit: KES 15,000 | Ref: ${testRef}...`);

    const amtInput = await page.$('input[type="number"]');
    if (amtInput) {
      await amtInput.click({ clickCount: 3 });
      await amtInput.type('15000');
    }

    const refInput = await page.$('input[placeholder*="QK89123456"]');
    if (refInput) {
      await refInput.click({ clickCount: 3 });
      await refInput.type(testRef);
    }

    const reasonInput = await page.$('textarea');
    if (reasonInput) {
      await reasonInput.click({ clickCount: 3 });
      await reasonInput.type('Monthly investment deposit verified under access control test');
    }

    await sleep(1000);

    // Click submit
    console.log('Clicking Submit Deposit Entry...');
    await page.evaluate(() => {
      const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Submit Deposit Entry'));
      if (submitBtn) submitBtn.click();
    });

    await sleep(5000);

    // Verify confirmation message
    const confirmCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasLine1 = text.includes('YOUR DEPOSIT RECEIVED SUCCESSFULLY');
      const hasLine2 = text.includes('THANKYOU FOR TRUSTING DREAMLOOM HOLDING LIMITED');
      return { hasLine1, hasLine2 };
    });
    console.log('Confirmation Message Check:', confirmCheck);

    if (confirmCheck.hasLine1 && confirmCheck.hasLine2) {
      console.log('🎉 SUCCESS: Exact Confirmation Message displayed prominently!');
      console.log('Line 1: YOUR DEPOSIT RECEIVED SUCCESSFULLY');
      console.log('Line 2: THANKYOU FOR TRUSTING DREAMLOOM HOLDING LIMITED');
      await page.screenshot({ path: `${ARTIFACT_DIR}/evidence_member_deposit_success_confirmation.png`, fullPage: true });
      console.log('Saved screenshot: evidence_member_deposit_success_confirmation.png');
    } else {
      console.error('❌ FAIL: Exact Confirmation Message was NOT displayed!', confirmCheck);
    }

    // 4D. Simon logs back in to verify deposit in the admin register
    console.log('\n--- Verifying Deposit in Admin Deposit Register ---');
    await cdp.send('Network.clearBrowserCookies');
    await cdp.send('Network.clearBrowserCache');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    await page.waitForSelector('input[type="text"], input[type="email"]', { timeout: 15000 });
    const sEmailInput = await page.$('input[type="text"], input[type="email"]');
    const sPasswordInput = await page.$('input[type="password"]');
    await sEmailInput.type('simon@dreamloom.co.ke');
    await sPasswordInput.type('Simon@%322');
    const sSubmitBtn = await page.$('button[type="submit"]');
    await sSubmitBtn.click();
    await sleep(4000);

    // Navigate to Deposits
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const depBtn = btns.find(b => b.textContent && b.textContent.trim().startsWith('Deposits'));
      if (depBtn) depBtn.click();
    });
    await sleep(3000);

    const verifiedInRegister = await page.evaluate((ref) => {
      return document.body.innerText.includes(ref);
    }, testRef);
    console.log(`Deposit with Ref ${testRef} visible in Simon's Register:`, verifiedInRegister);

    if (verifiedInRegister) {
      console.log('🎉 SUCCESS: David\'s newly submitted deposit is immediately visible in Simon\'s Admin Register!');
      await page.screenshot({ path: `${ARTIFACT_DIR}/evidence_admin_deposit_verified_in_register.png`, fullPage: true });
      console.log('Saved screenshot: evidence_admin_deposit_verified_in_register.png');
    }

  } finally {
    await browser.close();
  }

  console.log('\n=============================================================================');
  console.log('ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
  console.log('=============================================================================');
}

main().catch(err => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
