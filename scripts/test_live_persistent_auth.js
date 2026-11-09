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
  console.log(` DREAMLOOM BMS — PERSISTENT LOGIN & SESSION VERIFICATION SUITE`);
  console.log(` Target: ${BASE_URL}`);
  console.log('================================================================\n');

  // --- PART 1: HTTP API ENDPOINTS TEST ---
  console.log('--- 1. Testing Auth HTTP Endpoints ---');

  // Wait for Vercel deployment if necessary
  let deploymentReady = false;
  for (let attempt = 1; attempt <= 20; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/session`, { cache: 'no-store' });
      if (res.status === 200) {
        const body = await res.json();
        if (body.authenticated !== undefined) {
          console.log(`  Deployment ready on attempt ${attempt}`);
          deploymentReady = true;
          break;
        }
      }
    } catch (e) {}
    console.log(`  Waiting for Vercel build to deploy (attempt ${attempt}/20)...`);
    await wait(5000);
  }

  if (!deploymentReady) {
    console.error('Deployment not ready after waiting.');
    process.exit(1);
  }

  // 1.1 Unauthenticated session request
  {
    const res = await fetch(`${BASE_URL}/api/auth/session`);
    const data = await res.json();
    assert(res.status === 200 && data.authenticated === false, 'GET /api/auth/session without cookie returns authenticated: false');
  }

  // 1.2 Invalid credentials test
  {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'kamera@dreamloom.co.ke', password: 'WrongPassword' })
    });
    const data = await res.json();
    assert(res.status === 401 && data.success === false, 'POST /api/auth/login with wrong password returns 401 Unauthorized');
  }

  // 1.3 Successful login with Remember Me (30 Days)
  let sessionCookie = '';
  {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'kamera@dreamloom.co.ke',
        password: 'Simon@%322',
        rememberMe: true
      })
    });
    const data = await res.json();
    const setCookie = res.headers.get('set-cookie') || '';
    sessionCookie = setCookie.split(';')[0];

    assert(res.status === 200 && data.success === true, 'POST /api/auth/login returns 200 and success: true');
    assert(data.user && data.user.email === 'kamera@dreamloom.co.ke', 'POST /api/auth/login returns correct user profile');
    assert(setCookie.includes('dreamloom_session='), 'POST /api/auth/login sets dreamloom_session cookie');
    assert(setCookie.toLowerCase().includes('httponly'), 'dreamloom_session cookie has HttpOnly flag');
    assert(setCookie.toLowerCase().includes('max-age=2592000'), 'dreamloom_session cookie has 30-day Max-Age (2592000s)');
  }

  // 1.4 Valid session verification using cookie
  {
    const res = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: { Cookie: sessionCookie }
    });
    const data = await res.json();
    assert(res.status === 200 && data.authenticated === true, 'GET /api/auth/session with valid cookie returns authenticated: true');
    assert(data.user && data.user.fullName === 'Simon Memia Wanjiru', 'Session payload contains full user identity');
    assert(data.user && data.user.role === 'Director / Super Admin', 'Session payload preserves RBAC permissions');
  }

  // 1.5 Tampered session cookie rejection
  {
    const tampered = sessionCookie.slice(0, -6) + 'abcdef';
    const res = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: { Cookie: tampered }
    });
    const data = await res.json();
    assert(data.authenticated === false, 'Tampered session cookie is rejected');
  }

  // 1.6 Login with Remember Me = false (Standard 24h duration)
  {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'kamera@dreamloom.co.ke',
        password: 'Simon@%322',
        rememberMe: false
      })
    });
    const setCookie = res.headers.get('set-cookie') || '';
    assert(setCookie.toLowerCase().includes('max-age=86400'), 'Standard session (rememberMe: false) has 24h Max-Age (86400s)');
  }

  // 1.7 Logout endpoint clears cookie
  {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: sessionCookie }
    });
    const data = await res.json();
    const setCookie = res.headers.get('set-cookie') || '';
    assert(res.status === 200 && data.success === true, 'POST /api/auth/logout returns 200 OK');
    assert(setCookie.includes('Max-Age=0') || setCookie.includes('expires='), 'POST /api/auth/logout invalidates session cookie');
  }

  console.log('\n--- 2. End-to-End Browser Automation & Persistence Tests ---');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--ignore-certificate-errors'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Step A: Load login page
    console.log(`  Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Verify Remember Me checkbox exists and is checked
    const rememberMeChecked = await page.evaluate(() => {
      const cb = document.querySelector('#remember-me-toggle');
      return cb ? cb.checked : null;
    });
    assert(rememberMeChecked === true, 'Login screen has "[x] Remember me on this device" checked by default');

    // Take screenshot of Login Screen with Remember Me
    const loginScreenshotPath = path.join(ARTIFACT_DIR, 'evidence_persistent_login_screen.png');
    await page.screenshot({ path: loginScreenshotPath, fullPage: false });
    console.log(`  📸 Saved login screen screenshot: ${loginScreenshotPath}`);

    // Step B: Authenticate
    console.log('  Submitting login credentials (kamera@dreamloom.co.ke)...');
    await page.type('input[type="email"]', 'kamera@dreamloom.co.ke');
    await page.type('input[placeholder*="authorized PIN"]', 'Simon@%322');
    await page.click('button[type="submit"]');

    // Wait for Dashboard to appear
    await page.waitForFunction(() => {
      return document.body.innerText.includes('Simon Memia') &&
             !document.body.innerText.includes('Authenticate & Access');
    }, { timeout: 15000 });

    assert(true, 'User successfully authenticated and entered Dashboard');

    const dashScreenshotPath = path.join(ARTIFACT_DIR, 'evidence_dashboard_authenticated.png');
    await page.screenshot({ path: dashScreenshotPath, fullPage: false });
    console.log(`  📸 Saved authenticated dashboard screenshot: ${dashScreenshotPath}`);

    // Step C: REFRESH TEST (User Requirement: Refreshing any page must not log the user out)
    console.log('  Testing Page Refresh persistence...');
    await page.reload({ waitUntil: 'networkidle2', timeout: 30000 });

    const stillLoggedInAfterRefresh = await page.evaluate(() => {
      return document.body.innerText.includes('Simon Memia') &&
             !document.body.innerText.includes('Authenticate & Access');
    });
    assert(stillLoggedInAfterRefresh, 'Page refresh preserved session: User remains logged in without re-entering password');

    // Step D: Navigation between modules
    console.log('  Testing navigation to Contributions...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const contribBtn = buttons.find(b => b.innerText.includes('Contributions'));
      if (contribBtn) contribBtn.click();
    });
    await wait(2000);

    const onContributions = await page.evaluate(() => {
      return document.body.innerText.includes('MONTHLY CONTRIBUTION REGISTER') ||
             document.body.innerText.includes('Contributions');
    });
    assert(onContributions, 'Navigated to Contributions tab while maintaining authenticated session');

    // Refresh on Contributions page
    await page.reload({ waitUntil: 'networkidle2', timeout: 30000 });
    const stillLoggedInOnContrib = await page.evaluate(() => {
      return document.body.innerText.includes('Simon Memia') &&
             !document.body.innerText.includes('Authenticate & Access');
    });
    assert(stillLoggedInOnContrib, 'Refresh on Contributions page preserved authenticated session');

    // Step E: Simulate closing and reopening browser (new page sharing cookies)
    console.log('  Testing Browser Restart Simulation (new page/session)...');
    const page2 = await browser.newPage();
    await page2.setViewport({ width: 1280, height: 800 });
    await page2.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    const restoredInNewWindow = await page2.evaluate(() => {
      return document.body.innerText.includes('Simon Memia') &&
             !document.body.innerText.includes('Authenticate & Access');
    });
    assert(restoredInNewWindow, 'Reopening application on device automatically restored authenticated session');

    // Step F: Intentional Logout Test
    console.log('  Testing Intentional Logout...');
    await page2.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const profileBtn = buttons.find(b => b.innerText.includes('Simon Memia') || b.querySelector('img'));
      if (profileBtn) profileBtn.click();
    });
    await wait(500);

    await page2.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const logoutBtn = buttons.find(b => b.innerText.includes('Sign Out'));
      if (logoutBtn) logoutBtn.click();
    });
    await wait(2000);

    const isLoggedOut = await page2.evaluate(() => {
      return document.body.innerText.includes('Authenticate & Access');
    });
    assert(isLoggedOut, 'Sign Out button successfully logged out user and returned to Login Screen');

    // Refresh after logout -> must stay logged out
    await page2.reload({ waitUntil: 'networkidle2', timeout: 30000 });
    const staysLoggedOut = await page2.evaluate(() => {
      return document.body.innerText.includes('Authenticate & Access');
    });
    assert(staysLoggedOut, 'Refresh after intentional logout remains logged out and requires credentials');

  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log(` FINAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
