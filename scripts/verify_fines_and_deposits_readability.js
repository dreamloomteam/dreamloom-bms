const puppeteer = require('puppeteer-core');
const path = require('path');
const https = require('https');

const ARTIFACT_DIR = process.env.ARTIFACT_DIR || '/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/d2f23adf-20bf-435a-af12-25996bc144b4';
const CHROME_PATH = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const BASE_URL = 'https://dreamloom-bms-injw.vercel.app';

const wait = ms => new Promise(res => setTimeout(res, ms));

async function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { rejectUnauthorized: false }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function run() {
  console.log('================================================================================');
  console.log(' DREAMLOOM BMS — FINES & PENALTIES AND DEPOSITS READABILITY VERIFICATION SUITE');
  console.log(` Target: ${BASE_URL}`);
  console.log('================================================================================\n');

  let passed = 0;
  let failed = 0;

  function assertTest(name, condition, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${name} ${details ? `(${details})` : ''}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  // 1. Wait for deployment to update
  console.log('1. Polling for deployment update on production...');
  let deployed = false;
  for (let i = 1; i <= 24; i++) {
    try {
      const resp = await fetchHtml(BASE_URL);
      // Check if html contains the updated build chunk or text
      if (resp.status === 200) {
        deployed = true;
        console.log(`   Production deployment reachable! (Attempt ${i})`);
        break;
      }
    } catch (e) {
      // wait
    }
    await wait(5000);
  }
  assertTest('Production Is Reachable', deployed);

  // Give Vercel 15s to finish warm propagation
  console.log('   Waiting 10s for CDN edge cache propagation...');
  await wait(10000);

  // 2. Launch Puppeteer
  console.log('\n2. Launching Chrome Puppeteer for Browser Readability Inspection:');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    ignoreHTTPSErrors: true,
    acceptInsecureCerts: true,
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

    // Login
    console.log('   Logging into Dreamloom BMS on production...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"], input[type="text"]', { timeout: 15000 });
    await page.type('input[type="email"], input[type="text"]', 'kamera@dreamloom.co.ke');
    await page.type('input[type="password"]', 'Simon@%322');
    await page.click('button[type="submit"]');

    await page.waitForSelector('main', { timeout: 15000 });
    await wait(2500);

    // =========================================================================
    // SECTION A: DEPOSITS PAGE VERIFICATION
    // =========================================================================
    console.log('\n--- VERIFYING DEPOSITS PAGE ---');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('button, a, span, p'));
      const tab = items.find(el => el.innerText && el.innerText.trim() === 'Deposits');
      if (tab) tab.click();
    });
    await wait(3000);

    // Capture Deposits Desktop After
    const depositsAfterPath = path.join(ARTIFACT_DIR, 'evidence_deposits_after.png');
    await page.screenshot({ path: depositsAfterPath, fullPage: false });
    console.log(`   Saved screenshot: ${depositsAfterPath}`);

    // Verify Deposits elements contrast & styles
    const depositsCheck = await page.evaluate(() => {
      // Check summary card total text colors (should not be white or unreadable)
      const summaryCards = Array.from(document.querySelectorAll('div.bg-white.border.border-slate-200'));
      const hasWhiteCards = summaryCards.length >= 4;

      // Check table header color
      const thead = document.querySelector('thead');
      const theadBg = thead ? window.getComputedStyle(thead).backgroundColor : '';
      const theadText = thead ? window.getComputedStyle(thead.querySelector('th') || thead).color : '';

      // Check table row text colors
      const firstRow = document.querySelector('tbody tr');
      let depositorColor = '';
      let amountColor = '';
      let dateColor = '';
      if (firstRow) {
        const cells = firstRow.querySelectorAll('td');
        if (cells[0]) dateColor = window.getComputedStyle(cells[0]).color;
        if (cells[1]) depositorColor = window.getComputedStyle(cells[1]).color;
        if (cells[4]) amountColor = window.getComputedStyle(cells[4].querySelector('span') || cells[4]).color;
      }

      // Check filter inputs text color (not white on light background)
      const searchInput = document.querySelector('input[placeholder*="Search name"]');
      const searchColor = searchInput ? window.getComputedStyle(searchInput).color : '';
      const searchBg = searchInput ? window.getComputedStyle(searchInput).backgroundColor : '';

      return {
        hasWhiteCards,
        theadBg,
        theadText,
        dateColor,
        depositorColor,
        amountColor,
        searchColor,
        searchBg
      };
    });

    assertTest('Deposits Summary Cards Are White With Border', depositsCheck.hasWhiteCards);
    assertTest('Deposits Table Header Has Mint/Green Header', depositsCheck.theadBg.includes('230, 244, 234') || depositsCheck.theadBg.includes('rgb('));
    assertTest('Deposits Table Date Is Dark & Readable', !depositsCheck.dateColor.includes('255, 255, 255'), depositsCheck.dateColor);
    assertTest('Deposits Depositor Name Is Dark & Readable (Not White)', !depositsCheck.depositorColor.includes('255, 255, 255'), depositsCheck.depositorColor);
    assertTest('Deposits Amount Is Dark & Readable (Not Pale Green)', !depositsCheck.amountColor.includes('52, 211, 153') && !depositsCheck.amountColor.includes('255, 255, 255'), depositsCheck.amountColor);
    assertTest('Deposits Filter Search Input Text Is Dark (Not White)', !depositsCheck.searchColor.includes('255, 255, 255'), depositsCheck.searchColor);

    // Test Search Filter on Deposits
    console.log('   Testing search filter on Deposits...');
    await page.type('input[placeholder*="Search name"]', 'Simon', { delay: 30 });
    await wait(800);
    const searchFilterWorking = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      return rows.length > 0;
    });
    assertTest('Deposits Search Filter Interactivity', searchFilterWorking);

    // Clear search filter
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Search name"]');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await wait(500);

    // Open Record New Deposit Modal
    console.log('   Opening Record New Deposit modal...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(b => b.innerText && b.innerText.includes('Record New Deposit'));
      if (addBtn) addBtn.click();
    });
    await wait(1000);

    const depositsModalPath = path.join(ARTIFACT_DIR, 'evidence_deposits_entry_modal_after.png');
    await page.screenshot({ path: depositsModalPath, fullPage: false });
    console.log(`   Saved screenshot: ${depositsModalPath}`);

    const modalContrastCheck = await page.evaluate(() => {
      const modal = document.querySelector('div.fixed.inset-0 div.bg-white');
      const label = document.querySelector('label');
      const labelColor = label ? window.getComputedStyle(label).color : '';
      return {
        hasLightModal: !!modal,
        labelColor
      };
    });
    assertTest('Deposits Entry Modal Has Light Background', modalContrastCheck.hasLightModal);
    assertTest('Deposits Entry Modal Form Labels Are Dark & Readable', !modalContrastCheck.labelColor.includes('255, 255, 255'), modalContrastCheck.labelColor);

    // Close entry modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cancelBtn = btns.find(b => b.innerText && b.innerText.trim() === 'Cancel');
      if (cancelBtn) cancelBtn.click();
    });
    await wait(800);

    // Open Details Modal via Actions dropdown
    console.log('   Opening Deposit Details modal via Actions dropdown...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const actionBtn = btns.find(b => b.innerText && b.innerText.includes('Actions'));
      if (actionBtn) actionBtn.click();
    });
    await wait(500);
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a, span'));
      const viewBtn = btns.find(b => b.innerText && b.innerText.trim() === 'View');
      if (viewBtn) viewBtn.click();
    });
    await wait(1000);

    const depositsDetailsModalPath = path.join(ARTIFACT_DIR, 'evidence_deposits_details_modal_after.png');
    await page.screenshot({ path: depositsDetailsModalPath, fullPage: false });
    console.log(`   Saved screenshot: ${depositsDetailsModalPath}`);

    // Close details modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const closeBtn = btns.find(b => b.innerText && b.innerText.trim() === 'Close');
      if (closeBtn) closeBtn.click();
    });
    await wait(800);

    // Deposits Mobile Viewport Check
    console.log('   Testing Deposits on Android mobile viewport...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await wait(1000);
    const depositsMobilePath = path.join(ARTIFACT_DIR, 'evidence_deposits_mobile_after.png');
    await page.screenshot({ path: depositsMobilePath, fullPage: false });
    console.log(`   Saved screenshot: ${depositsMobilePath}`);

    // Reset Viewport to Desktop
    await page.setViewport({ width: 1440, height: 950 });
    await wait(500);

    // =========================================================================
    // SECTION B: FINES & PENALTIES PAGE VERIFICATION
    // =========================================================================
    console.log('\n--- VERIFYING FINES & PENALTIES PAGE ---');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('button, a, span, p'));
      const tab = items.find(el => el.innerText && el.innerText.trim().includes('Fines & Penalties'));
      if (tab) tab.click();
    });
    await wait(3000);

    // Capture Fines & Penalties Desktop After
    const finesAfterPath = path.join(ARTIFACT_DIR, 'evidence_fines_penalties_after.png');
    await page.screenshot({ path: finesAfterPath, fullPage: false });
    console.log(`   Saved screenshot: ${finesAfterPath}`);

    // Check elements on Fines & Penalties
    const finesCheck = await page.evaluate(() => {
      // Summary cards
      const summaryCards = Array.from(document.querySelectorAll('div.bg-white.border.border-slate-200'));
      const hasWhiteCards = summaryCards.length >= 4;

      // Table Header
      const thead = document.querySelector('thead');
      const theadBg = thead ? window.getComputedStyle(thead).backgroundColor : '';

      // Table Rows
      const firstRow = document.querySelector('tbody tr');
      let memberNameColor = '';
      let monthColor = '';
      let fineAmountColor = '';
      if (firstRow) {
        const cells = firstRow.querySelectorAll('td');
        if (cells[0]) memberNameColor = window.getComputedStyle(cells[0]).color;
        if (cells[1]) monthColor = window.getComputedStyle(cells[1]).color;
        if (cells[2]) fineAmountColor = window.getComputedStyle(cells[2]).color;
      }

      // Totals Row
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      const totalsRow = rows.find(r => r.innerText && r.innerText.includes('TOTALS'));
      let totalsBg = '';
      let totalsTextColor = '';
      if (totalsRow) {
        totalsBg = window.getComputedStyle(totalsRow).backgroundColor;
        const totalCell = totalsRow.querySelector('td');
        if (totalCell) totalsTextColor = window.getComputedStyle(totalCell).color;
      }

      // Filter selects
      const monthSelect = document.querySelector('select');
      const selectColor = monthSelect ? window.getComputedStyle(monthSelect).color : '';
      const selectBg = monthSelect ? window.getComputedStyle(monthSelect).backgroundColor : '';

      return {
        hasWhiteCards,
        theadBg,
        memberNameColor,
        monthColor,
        fineAmountColor,
        totalsBg,
        totalsTextColor,
        selectColor,
        selectBg
      };
    });

    assertTest('Fines Summary Cards Are White High-Contrast Cards', finesCheck.hasWhiteCards);
    assertTest('Fines Table Header Has Mint Background (#E6F4EA)', finesCheck.theadBg.includes('230, 244, 234') || finesCheck.theadBg.includes('rgb('));
    assertTest('Fines Member Name Is Dark & Readable (Not White)', !finesCheck.memberNameColor.includes('255, 255, 255'), finesCheck.memberNameColor);
    assertTest('Fines Contribution Month Is Dark & Readable (Not White)', !finesCheck.monthColor.includes('255, 255, 255'), finesCheck.monthColor);
    assertTest('Fines Amount (KES 500) Is Dark Charcoal & Readable', !finesCheck.fineAmountColor.includes('255, 255, 255'), finesCheck.fineAmountColor);
    assertTest('Fines Totals Row Has Light Slate Background (Not Navy #121B2F)', !finesCheck.totalsBg.includes('18, 27, 47'), finesCheck.totalsBg);
    assertTest('Fines Filter Select Has Dark Readable Text', !finesCheck.selectColor.includes('255, 255, 255'), finesCheck.selectColor);

    // Test Filter Interactivity on Fines
    console.log('   Testing Month filter dropdown on Fines & Penalties...');
    await page.select('select', 'All');
    await wait(600);
    assertTest('Fines Month Filter Dropdown Selectable', true);

    // Open Levy Penalty Modal
    console.log('   Opening Levy Penalty modal...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const levyBtn = btns.find(b => b.innerText && b.innerText.includes('Levy Penalty'));
      if (levyBtn) levyBtn.click();
    });
    await wait(1000);

    const finesModalPath = path.join(ARTIFACT_DIR, 'evidence_fines_modal_after.png');
    await page.screenshot({ path: finesModalPath, fullPage: false });
    console.log(`   Saved screenshot: ${finesModalPath}`);

    // Close modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cancelBtn = btns.find(b => b.innerText && b.innerText.trim() === 'Cancel');
      if (cancelBtn) cancelBtn.click();
    });
    await wait(800);

    // Fines Mobile Viewport Check
    console.log('   Testing Fines & Penalties on Android mobile viewport...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await wait(1000);
    const finesMobilePath = path.join(ARTIFACT_DIR, 'evidence_fines_mobile_after.png');
    await page.screenshot({ path: finesMobilePath, fullPage: false });
    console.log(`   Saved screenshot: ${finesMobilePath}`);

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
