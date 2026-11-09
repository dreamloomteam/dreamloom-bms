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
  console.log(' DREAMLOOM FINANCIAL — REDESIGNED 3D LOGIN SCREEN VERIFICATION');
  console.log(` Target: ${BASE_URL}`);
  console.log('========================================================================\n');

  // Step 1: Wait for deployment
  console.log('--- 1. Checking Deployment & Asset Availability ---');
  let assetReady = false;
  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/dreamloom_login_bg.png`, { cache: 'no-store' });
      if (res.status === 200) {
        console.log(`  3D Welcome Background Image loaded (HTTP 200) on attempt ${attempt}`);
        assetReady = true;
        break;
      }
    } catch (e) {}
    console.log(`  Waiting for Vercel deployment of 3D asset (attempt ${attempt}/30)...`);
    await wait(4000);
  }

  assert(assetReady, 'Background image /dreamloom_login_bg.png is live');

  // Step 2: Test Authentication API with both Email and Username
  console.log('\n--- 2. Testing Authentication API (Email & Username Support) ---');

  // 2.1 Login via full email
  const loginEmailRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'kamera@dreamloom.co.ke', password: 'Simon@%322' })
  });
  const emailData = await loginEmailRes.json();
  assert(loginEmailRes.status === 200 && emailData.success, 'Login with full email (kamera@dreamloom.co.ke) succeeds');
  assert(emailData.user?.role?.includes('Director') || emailData.user?.role?.includes('Admin'), 'User role resolved as Director / Super Admin');

  // 2.2 Login via username
  const loginUserRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'kamera', password: 'Simon@%322' })
  });
  const userData = await loginUserRes.json();
  assert(loginUserRes.status === 200 && userData.success, 'Login with username (kamera) succeeds');

  // 2.3 Login via another member username
  const loginDavidRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'david', password: 'David@399' })
  });
  const davidData = await loginDavidRes.json();
  assert(loginDavidRes.status === 200 && davidData.success, 'Login with member username (david) succeeds');

  // 2.4 Invalid credentials rejection
  const invalidRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'kamera', password: 'WrongPassword' })
  });
  assert(invalidRes.status === 401, 'Invalid credentials properly rejected with HTTP 401');

  // Step 3: Puppeteer UI Testing across Desktop, Tablet, and Mobile
  console.log('\n--- 3. Testing UI Layout, Controls & Responsiveness via Headless Chrome ---');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    ignoreHTTPSErrors: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--ignore-certificate-errors']
  });

  try {
    // 3.1 Desktop View (1440x900)
    console.log('\n  [Desktop View 1440x900]');
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Clear cookies to ensure fresh unauthenticated login screen
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');

    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await wait(2000);

    // Verify elements are present
    const welcomeHeader = await page.evaluate(() => {
      const h2 = document.querySelector('h2');
      return h2 ? h2.textContent : null;
    });
    assert(welcomeHeader && welcomeHeader.includes('Welcome Back!'), 'Card displays "Welcome Back!" heading');

    const inputs = await page.$$('input');
    assert(inputs.length >= 2, 'Username/Email and Password input fields rendered');

    // Test Show / Hide password toggle
    const pwdInput = await page.$('input[placeholder="Password"]');
    assert(pwdInput !== null, 'Password field with placeholder "Password" found');

    const initialType = await page.evaluate(el => el.getAttribute('type'), pwdInput);
    assert(initialType === 'password', 'Password field initially has type="password"');

    // Click show/hide toggle button
    await page.evaluate(() => {
      const form = document.querySelector('form');
      const toggleBtn = form.querySelector('button[type="button"]');
      if (toggleBtn) toggleBtn.click();
    });
    await wait(500);

    const toggledType = await page.evaluate(el => el.getAttribute('type'), pwdInput);
    assert(toggledType === 'text', 'Password field toggled to type="text" upon clicking eye icon');

    // Toggle back
    await page.evaluate(() => {
      const form = document.querySelector('form');
      const toggleBtn = form.querySelector('button[type="button"]');
      if (toggleBtn) toggleBtn.click();
    });
    await wait(500);

    // Test Forgot Password modal
    console.log('  Testing Forgot Password modal...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const forgot = btns.find(b => b.textContent && b.textContent.includes('Forgot Password?'));
      if (forgot) forgot.click();
    });
    await wait(800);

    const forgotModalVisible = await page.evaluate(() => {
      return document.body.textContent.includes('Password & PIN Recovery');
    });
    assert(forgotModalVisible, 'Forgot Password recovery modal displays on click');

    // Close Forgot Password modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const close = btns.find(b => b.textContent && b.textContent.includes('Close & Return to Login'));
      if (close) close.click();
    });
    await wait(800);

    // Capture desktop screenshot
    const desktopPath = path.join(ARTIFACT_DIR, 'evidence_redesigned_login_desktop.png');
    await page.screenshot({ path: desktopPath });
    console.log(`  Saved desktop screenshot: ${desktopPath}`);
    assert(fs.existsSync(desktopPath), 'Captured evidence_redesigned_login_desktop.png');

    // 3.2 Tablet View (1024x768)
    console.log('\n  [Tablet View 1024x768]');
    await page.setViewport({ width: 1024, height: 768 });
    await wait(1000);
    const tabletPath = path.join(ARTIFACT_DIR, 'evidence_redesigned_login_tablet.png');
    await page.screenshot({ path: tabletPath });
    console.log(`  Saved tablet screenshot: ${tabletPath}`);
    assert(fs.existsSync(tabletPath), 'Captured evidence_redesigned_login_tablet.png');

    // 3.3 Mobile View (390x844 - iPhone / Android)
    console.log('\n  [Mobile View 390x844]');
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await wait(1000);
    const mobilePath = path.join(ARTIFACT_DIR, 'evidence_redesigned_login_mobile.png');
    await page.screenshot({ path: mobilePath });
    console.log(`  Saved mobile screenshot: ${mobilePath}`);
    assert(fs.existsSync(mobilePath), 'Captured evidence_redesigned_login_mobile.png');

    // 3.4 Perform Full End-to-End Login via UI
    console.log('\n  [Functional Login via UI]');
    await page.setViewport({ width: 1440, height: 900 });
    await wait(500);

    const userInput = await page.$('input[placeholder="Username or Email"]');
    if (userInput) {
      await userInput.click({ clickCount: 3 });
      await userInput.type('kamera');
    }

    const pwdInputElem = await page.$('input[placeholder="Password"]');
    if (pwdInputElem) {
      await pwdInputElem.click({ clickCount: 3 });
      await pwdInputElem.type('Simon@%322');
    }
    await wait(500);

    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    await wait(5000);

    const dashboardVisible = await page.evaluate(() => {
      return document.body.textContent.includes('DREAMLOOM') &&
        (document.body.textContent.includes('Overview') || document.body.textContent.includes('Loan Portfolio'));
    });
    assert(dashboardVisible, 'Dashboard loaded successfully after login with username');

    const dashboardPath = path.join(ARTIFACT_DIR, 'evidence_login_successful_dashboard.png');
    await page.screenshot({ path: dashboardPath });
    console.log(`  Saved authenticated dashboard screenshot: ${dashboardPath}`);
    assert(fs.existsSync(dashboardPath), 'Captured evidence_login_successful_dashboard.png');

    await page.close();
  } finally {
    await browser.close();
  }

  console.log('\n========================================================================');
  console.log(` FINAL TEST RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) process.exit(1);
}

run().catch(e => {
  console.error('Verification failed:', e);
  process.exit(1);
});
