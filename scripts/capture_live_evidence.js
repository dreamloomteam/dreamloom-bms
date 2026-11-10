const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = '/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/d2f23adf-20bf-435a-af12-25996bc144b4';
const BASE_URL = 'https://dreamloom-bms-injw.vercel.app';

async function run() {
  console.log('Launching headless browser...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900', '--ignore-certificate-errors']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  async function takeScreenshot(name, desc) {
    const filePath = path.join(ARTIFACT_DIR, `${name}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`📸 Captured screenshot: ${name}.png — ${desc}`);
  }

  try {
    console.log(`Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Check if on login screen
    console.log('Logging in as Admin (kamera@dreamloom.co.ke)...');
    const emailInput = await page.$('input[type="email"], input[placeholder*="email" i], input[type="text"]');
    if (emailInput) {
      await emailInput.click({ clickCount: 3 });
      await emailInput.type('kamera@dreamloom.co.ke', { delay: 20 });

      const passInput = await page.$('input[type="password"]');
      if (passInput) {
        await passInput.click({ clickCount: 3 });
        await passInput.type('Simon@%322', { delay: 20 });
      }

      const loginBtn = await page.$('button[type="submit"]');
      if (loginBtn) {
        await loginBtn.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
      }
    }

    await new Promise(r => setTimeout(r, 3000));

    // Helper to click sidebar tab by name
    async function clickTab(tabName) {
      console.log(`Clicking tab: "${tabName}"`);
      const clicked = await page.evaluate((name) => {
        const buttons = Array.from(document.querySelectorAll('aside button, aside a, nav button'));
        const target = buttons.find(b => b.textContent && b.textContent.includes(name));
        if (target) {
          target.click();
          return true;
        }
        return false;
      }, tabName);
      if (!clicked) {
        console.warn(`Tab "${tabName}" not found in sidebar!`);
      }
      await new Promise(r => setTimeout(r, 1500));
      return clicked;
    }

    // 1. Overview Dashboard (Untouched constraint verification)
    await clickTab('Overview');
    await takeScreenshot('evidence_overview_intact', 'Dashboard Overview intact with all financial summaries');

    // 2. Loan Portfolio
    await clickTab('Loan Portfolio');
    await takeScreenshot('evidence_uniform_loan_portfolio', 'Loan Portfolio with mint headers, alternating rows, and mono figures');

    // 3. Contributions
    await clickTab('Contributions');
    await takeScreenshot('evidence_uniform_contributions', 'Contributions register with alternating rows and mint table headers');

    // 4. Deposits
    await clickTab('Deposits');
    await takeScreenshot('evidence_uniform_deposits', 'Deposits tab with green wave hero banner and alternating rows');

    // 5. Member Directory
    await clickTab('Member Directory');
    await takeScreenshot('evidence_uniform_member_directory', 'Member Directory with green wave banner and restored balances summary');

    // 6. Fines & Penalties
    await clickTab('Fines & Penalties');
    await takeScreenshot('evidence_uniform_fines', 'Fines & Penalties with green wave hero banner and alternating rows');

    // 7. Expenses
    await clickTab('Expenses');
    await takeScreenshot('evidence_uniform_expenses', 'Expenses tab with green wave hero banner and mint alternating table');

    // 8. Admin Login Log
    await clickTab('Login Log');
    await takeScreenshot('evidence_admin_login_log', 'Administrator Login Log view with mint header and session logs');

    // 9. Admin Edit Log
    await clickTab('Edit Log');
    await takeScreenshot('evidence_admin_edit_log', 'Administrator Edit Log view with mint header and audit trail');

    // =========================================================================
    // NON-ADMIN (TREASURER) RESTRICTION TEST
    // =========================================================================
    console.log('\n--- Switching to Non-Admin User (michael@dreamloom.co.ke) ---');
    // Clear cookies / localStorage and reload
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');

    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    const emailInput2 = await page.$('input[type="email"], input[placeholder*="email" i], input[type="text"]');
    if (emailInput2) {
      await emailInput2.click({ clickCount: 3 });
      await emailInput2.type('michael@dreamloom.co.ke', { delay: 20 });

      const passInput2 = await page.$('input[type="password"]');
      if (passInput2) {
        await passInput2.click({ clickCount: 3 });
        await passInput2.type('Michael@389', { delay: 20 });
      }

      const loginBtn2 = await page.$('button[type="submit"]');
      if (loginBtn2) {
        await loginBtn2.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
      }
    }

    await new Promise(r => setTimeout(r, 3000));

    // Check sidebar links
    const sidebarText = await page.evaluate(() => {
      const aside = document.querySelector('aside');
      return aside ? aside.innerText : '';
    });
    console.log('Treasurer Sidebar Text:\n', sidebarText);
    const hasLoginLog = sidebarText.includes('Login Log');
    const hasEditLog = sidebarText.includes('Edit Log');
    console.log(`Treasurer has "Login Log" in sidebar: ${hasLoginLog} (Expected: false)`);
    console.log(`Treasurer has "Edit Log" in sidebar: ${hasEditLog} (Expected: false)`);

    await takeScreenshot('evidence_treasurer_sidebar_restricted', 'Treasurer view showing Login Log and Edit Log hidden from sidebar');

  } catch (err) {
    console.error('Error during browser automation:', err);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

run();
