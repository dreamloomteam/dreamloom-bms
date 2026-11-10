const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'https://dreamloom-bms-injw.vercel.app';
const CHROME_PATH = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const ARTIFACT_DIR = '/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/d2f23adf-20bf-435a-af12-25996bc144b4';

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
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
  console.log(' DREAMLOOM BMS — LIGHT UI, ACTIONS DROPDOWN, CNT-016 & PHOTOS VERIFICATION SUITE');
  console.log(` Target: ${BASE_URL}`);
  console.log('================================================================================\n');

  // Step 1: Wait for deployment to serve commit 57263fb
  console.log('1. Polling for deployment update on production...');
  let deployed = false;
  for (let attempt = 1; attempt <= 25; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/members/member-6.jpg`, { method: 'HEAD' });
      if (res.status === 200) {
        deployed = true;
        console.log(`   Production deployment active with member-6.jpg! (Attempt ${attempt})`);
        break;
      }
    } catch (e) {}
    await wait(3000);
  }

  assertTest('Production Deployed Replacement Member Photo member-6.jpg', deployed);

  // Step 2: Check member photos HTTP 200
  console.log('\n2. Verifying Replacement Member Photos on Production:');
  const photo5Res = await fetch(`${BASE_URL}/members/member-5.jpg`);
  const photo6Res = await fetch(`${BASE_URL}/members/member-6.jpg`);
  const photo7Res = await fetch(`${BASE_URL}/members/member-7.jpg`);
  assertTest('Photo 1 (Michael Kiarie Wanjiru) member-5.jpg is HTTP 200', photo5Res.status === 200, `Status: ${photo5Res.status}`);
  assertTest('Photo 2 (Daniel Kamau Njiriri) member-6.jpg is HTTP 200', photo6Res.status === 200, `Status: ${photo6Res.status}`);
  assertTest('Photo 3 (Beatrice Njoki Muthoni) member-7.jpg is HTTP 200', photo7Res.status === 200, `Status: ${photo7Res.status}`);

  // Step 3: API Auth & Verification of CNT-016
  console.log('\n3. Verifying Authenticated API & Contribution CNT-016:');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'kamera', password: 'Simon@%322' })
  });
  const cookie = loginRes.headers.get('set-cookie');
  assertTest('Director Authentication', loginRes.status === 200);

  const contribRes = await fetch(`${BASE_URL}/api/contributions`, { headers: { Cookie: cookie } });
  const contribs = await contribRes.json();
  const cnt016 = contribs.find(c => c.customId === 'CNT-016' || c.id === 'CNT-016');
  assertTest('CNT-016 Exists in /api/contributions', !!cnt016);
  assertTest('CNT-016 Member is Simon Memia Wanjiru', cnt016?.memberName === 'Simon Memia Wanjiru', `Member: ${cnt016?.memberName}`);
  assertTest('CNT-016 Month is December 2025', cnt016?.month === 'December' && cnt016?.year === 2025, `${cnt016?.month} ${cnt016?.year}`);
  assertTest('CNT-016 Expected Amount is 6,000', Number(cnt016?.expectedAmount) === 6000, `Expected: ${cnt016?.expectedAmount}`);
  assertTest('CNT-016 Paid Amount is 6,000', Number(cnt016?.amount) === 6000, `Paid: ${cnt016?.amount}`);
  assertTest('CNT-016 Unsettled is 0', Number(cnt016?.unsettled) === 0, `Unsettled: ${cnt016?.unsettled}`);
  assertTest('CNT-016 Status is Fully Paid', cnt016?.status === 'Fully Paid', `Status: ${cnt016?.status}`);

  // Step 4: Launch Puppeteer for Browser Visual Verification & Screenshots
  console.log('\n4. Launching Chrome Puppeteer for Browser UI Verification:');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    ignoreHTTPSErrors: true,
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
    await page.setViewport({ width: 1440, height: 950 });

    // Navigate to Login
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"], input[type="text"]', { timeout: 10000 });
    await page.type('input[type="email"], input[type="text"]', 'kamera@dreamloom.co.ke');
    await page.type('input[type="password"]', 'Simon@%322');
    await page.click('button[type="submit"]');

    // Wait for dashboard load
    await page.waitForSelector('main', { timeout: 15000 });
    await wait(2000);

    // 4a: Navigate to Loan Portfolio & Screenshot
    console.log('   Navigating to Loan Portfolio...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('button, a, span'));
      const tab = items.find(el => el.innerText && el.innerText.trim() === 'Loans');
      if (tab) tab.click();
    });
    await wait(2000);

    const loanShotPath = path.join(ARTIFACT_DIR, 'evidence_redesigned_loan_portfolio_light.png');
    await page.screenshot({ path: loanShotPath, fullPage: false });
    console.log(`   Saved screenshot: ${loanShotPath}`);

    // 4b: Navigate to Contributions tab
    console.log('   Navigating to Contributions tab...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('button, a, span'));
      const tab = items.find(el => el.innerText && el.innerText.trim() === 'Contributions');
      if (tab) tab.click();
    });
    await wait(2500);

    // Screenshot Monthly Contributions Register (Light design with Actions dropdown)
    const contribLightPath = path.join(ARTIFACT_DIR, 'evidence_redesigned_contributions_light.png');
    await page.screenshot({ path: contribLightPath, fullPage: false });
    console.log(`   Saved screenshot: ${contribLightPath}`);

    // Click on the first Actions dropdown button in the table to capture it opened!
    console.log('   Clicking Actions dropdown to open it...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const actionsBtn = btns.find(b => b.innerText && b.innerText.trim().includes('Actions'));
      if (actionsBtn) actionsBtn.click();
    });
    await wait(800);

    const actionsDropdownOpenPath = path.join(ARTIFACT_DIR, 'evidence_actions_dropdown_opened.png');
    await page.screenshot({ path: actionsDropdownOpenPath, fullPage: false });
    console.log(`   Saved screenshot: ${actionsDropdownOpenPath}`);

    // 4c: Switch to "All Cycles Ledger" in ContributionsTab
    console.log('   Switching to "All Cycles Ledger"...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('button'));
      const allCyclesBtn = items.find(b => b.innerText && b.innerText.trim().includes('All Cycles Ledger'));
      if (allCyclesBtn) allCyclesBtn.click();
    });
    await wait(2000);

    // Search for CNT-016 in the search box of All Cycles Ledger
    const ledgerInputSelector = 'input[placeholder*="Search member, month"]';
    await page.waitForSelector(ledgerInputSelector, { timeout: 5000 }).catch(() => {});
    await page.click(ledgerInputSelector);
    await page.type(ledgerInputSelector, 'CNT-016', { delay: 50 });
    await wait(1500);

    const allCyclesCnt016Path = path.join(ARTIFACT_DIR, 'evidence_contributions_all_cycles_cnt016.png');
    await page.screenshot({ path: allCyclesCnt016Path, fullPage: false });
    console.log(`   Saved screenshot: ${allCyclesCnt016Path}`);

    // Check if CNT-016 is visible on the page
    const cnt016Visible = await page.evaluate(() => {
      return document.body.innerText.includes('CNT-016') && document.body.innerText.includes('Simon Memia Wanjiru');
    });
    assertTest('CNT-016 is Rendered in All Cycles Ledger with Simon Memia Wanjiru', cnt016Visible);

    // 4d: Navigate to Member Directory to verify the 3 replacement photos
    console.log('   Navigating to Member Directory to verify Michael, Daniel, and Beatrice photos...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('button, a, span, p'));
      const memTab = items.find(el => el.innerText && el.innerText.trim().includes('Member Directory'));
      if (memTab) memTab.click();
    });
    await wait(2500);

    const memDirPhotosPath = path.join(ARTIFACT_DIR, 'evidence_member_directory_replacement_photos.png');
    await page.screenshot({ path: memDirPhotosPath, fullPage: false });
    console.log(`   Saved screenshot: ${memDirPhotosPath}`);

    const photosCheck = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img')).map(i => i.src);
      const hasMember5 = images.some(s => s.includes('member-5.jpg'));
      const hasMember6 = images.some(s => s.includes('member-6.jpg'));
      const hasMember7 = images.some(s => s.includes('member-7.jpg'));
      return { hasMember5, hasMember6, hasMember7 };
    });

    assertTest('Member Directory uses member-5.jpg (Michael Kiarie Wanjiru)', photosCheck.hasMember5);
    assertTest('Member Directory uses member-6.jpg (Daniel Kamau Njiriri)', photosCheck.hasMember6);
    assertTest('Member Directory uses member-7.jpg (Beatrice Njoki Muthoni)', photosCheck.hasMember7);

  } finally {
    await browser.close();
  }

  console.log('\n================================================================================');
  console.log(` SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================================');
  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('Test suite execution error:', err);
  process.exit(1);
});
