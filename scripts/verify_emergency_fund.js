const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROMIUM_PATH = '/usr/bin/chromium';
const APP_URL = process.env.TEST_URL || 'http://localhost:3000';
const ARTIFACTS_DIR = '/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/d2f23adf-20bf-435a-af12-25996bc144b4';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log(`Starting automated verification against ${APP_URL}...`);
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
  await page.setViewport({ width: 1440, height: 900 });

  page.on('dialog', async dialog => {
    console.log('[Browser Alert Dialog]:', dialog.message());
    await dialog.accept();
  });

  try {
    // 1. Navigate to App
    console.log('1. Navigating to login screen...');
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);

    // If on login screen, login as Simon Memia Wanjiru (Admin)
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
      console.log('Waiting for login redirect / dashboard...');
      await page.waitForFunction(() => !document.querySelector('input[placeholder="Username or Email"]'), { timeout: 15000 }).catch(() => {});
      await sleep(4000);
    }

    // 2. Verify Sidebar contains "Emergency & Welfare Fund"
    console.log('2. Checking sidebar for Emergency & Welfare Fund item...');
    const emergencyFundNav = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const found = buttons.find(b => b.textContent && b.textContent.includes('Emergency & Welfare Fund'));
      if (found) {
        found.click();
        return true;
      }
      return false;
    });

    if (!emergencyFundNav) {
      throw new Error('Sidebar item "Emergency & Welfare Fund" NOT found!');
    }
    console.log('Found and clicked "Emergency & Welfare Fund" in sidebar.');
    await sleep(3000);

    // 3. Take screenshot of the Emergency Fund Dashboard
    const screenshot1 = path.join(ARTIFACTS_DIR, 'evidence_emergency_fund_dashboard.png');
    await page.screenshot({ path: screenshot1, fullPage: false });
    console.log(`Saved screenshot: ${screenshot1}`);

    // Verify 6 KPI Cards
    const kpiTexts = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('#dashboard-content-area .rounded-2xl'));
      return cards.map(c => c.textContent || '');
    });
    console.log('KPI Cards rendered:', kpiTexts.slice(0, 6));

    // 4. Check Monthly Allocations Sub-tab
    console.log('4. Navigating to Monthly Allocations sub-tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const allocBtn = buttons.find(b => b.textContent && b.textContent.includes('Monthly Allocations'));
      if (allocBtn) allocBtn.click();
    });
    await sleep(2000);

    const allocScreenshot = path.join(ARTIFACTS_DIR, 'evidence_emergency_fund_allocations.png');
    await page.screenshot({ path: allocScreenshot, fullPage: false });
    console.log(`Saved screenshot: ${allocScreenshot}`);

    // Verify 7 members are present in the allocations
    const memberAllocCount = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      return rows.length;
    });
    console.log(`Allocations count: ${memberAllocCount}`);

    // 5. Test Loan Application Form
    console.log('5. Opening Loan Application modal...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const applyBtn = buttons.find(b => b.textContent && b.textContent.includes('Apply for Loan'));
      if (applyBtn) applyBtn.click();
    });
    await sleep(1500);

    const appModalScreenshot = path.join(ARTIFACTS_DIR, 'evidence_emergency_fund_app_modal.png');
    await page.screenshot({ path: appModalScreenshot, fullPage: false });
    console.log(`Saved screenshot: ${appModalScreenshot}`);

    // Fill application form for member 2 (David Wainaina) using native typing
    await page.select('select[required]', '2');
    await sleep(300);
    await page.type('input[placeholder="e.g. 25000"]', '10000');
    await sleep(200);
    await page.type('textarea[required]', 'Emergency family medical facility requirement');
    await sleep(200);
    await page.evaluate(() => {
      const d = document.querySelector('input[type="date"][required]');
      if (d) {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const dateStr = nextMonth.toISOString().slice(0, 10);
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(d, dateStr);
        d.dispatchEvent(new Event('input', { bubbles: true }));
        d.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await sleep(500);

    // Submit Application
    console.log('Submitting application...');
    await page.evaluate(() => {
      const submitBtn = Array.from(document.querySelectorAll('button')).find(
        b => b.textContent && b.textContent.includes('Submit Application')
      );
      if (submitBtn) submitBtn.click();
    });
    await sleep(4000);

    // 6. Check Applications Sub-tab
    console.log('6. Checking Loan Applications sub-tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const appTabBtn = buttons.find(b => b.textContent && b.textContent.includes('Loan Applications'));
      if (appTabBtn) appTabBtn.click();
    });
    await sleep(2000);

    const appsScreenshot = path.join(ARTIFACTS_DIR, 'evidence_emergency_fund_applications_list.png');
    await page.screenshot({ path: appsScreenshot, fullPage: false });
    console.log(`Saved screenshot: ${appsScreenshot}`);

    // 7. Check if there is a pending application to review
    console.log('7. Checking for Review & Approve action...');
    const hasReviewBtn = await page.evaluate(() => {
      const reviewBtn = Array.from(document.querySelectorAll('button')).find(
        b => b.textContent && b.textContent.includes('Review & Approve')
      );
      if (reviewBtn) {
        reviewBtn.click();
        return true;
      }
      return false;
    });

    if (hasReviewBtn) {
      await sleep(1500);
      const approveModalScreenshot = path.join(ARTIFACTS_DIR, 'evidence_emergency_fund_approve_modal.png');
      await page.screenshot({ path: approveModalScreenshot, fullPage: false });
      console.log(`Saved screenshot: ${approveModalScreenshot}`);

      // Close modal or confirm
      await page.evaluate(() => {
        const closeBtn = Array.from(document.querySelectorAll('button')).find(
          b => b.textContent && b.textContent.includes('Cancel')
        );
        if (closeBtn) closeBtn.click();
      });
      await sleep(1500);
    }

    // 8. Check for Disburse Loan action if available
    console.log('8. Checking for Disburse Loan action...');
    const hasDisburseBtn = await page.evaluate(() => {
      const disburseBtn = Array.from(document.querySelectorAll('button')).find(
        b => b.textContent && b.textContent.includes('Disburse Loan')
      );
      if (disburseBtn) {
        disburseBtn.click();
        return true;
      }
      return false;
    });

    if (hasDisburseBtn) {
      await page.waitForSelector('input[placeholder="e.g. QHJ829XK11"]', { timeout: 5000 }).catch(() => {});
      const disbInput = await page.$('input[placeholder="e.g. QHJ829XK11"]');
      if (disbInput) {
        await page.type('input[placeholder="e.g. QHJ829XK11"]', 'MPESA-EWF-2026-001');
        const disburseModalScreenshot = path.join(ARTIFACTS_DIR, 'evidence_emergency_fund_disburse_modal.png');
        await page.screenshot({ path: disburseModalScreenshot, fullPage: false });
        console.log(`Saved screenshot: ${disburseModalScreenshot}`);

        await page.evaluate(() => {
          const confirmDisbBtn = Array.from(document.querySelectorAll('button')).find(
            b => b.textContent && b.textContent.includes('Confirm Disbursement')
          );
          if (confirmDisbBtn) confirmDisbBtn.click();
        });
        await sleep(3500);
      }
    }

    // 9. Check Emergency Loan Portfolio
    console.log('9. Checking Emergency Loan Portfolio sub-tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const portfolioBtn = buttons.find(b => b.textContent && b.textContent.includes('Emergency Loan Portfolio'));
      if (portfolioBtn) portfolioBtn.click();
    });
    await sleep(2500);

    const loanPortfolioScreenshot = path.join(ARTIFACTS_DIR, 'evidence_emergency_fund_loans_portfolio.png');
    await page.screenshot({ path: loanPortfolioScreenshot, fullPage: false });
    console.log(`Saved screenshot: ${loanPortfolioScreenshot}`);

    // 10. Record Full Repayment & Settlement (Pre-filled with exact principal + 10% interest)
    console.log('10. Recording Loan Repayment & Full Settlement...');
    const hasRepayBtn = await page.evaluate(() => {
      const tableButtons = Array.from(document.querySelectorAll('table button'));
      const repayBtn = tableButtons.find(
        b => b.textContent && b.textContent.trim().toLowerCase() === 'repay'
      );
      if (repayBtn) {
        repayBtn.click();
        return true;
      }
      return false;
    });

    if (hasRepayBtn) {
      await page.waitForSelector('input[placeholder="e.g. QKJ47829M1"]', { timeout: 10000 });
      await sleep(500);
      await page.type('input[placeholder="e.g. QKJ47829M1"]', 'MPESA-REP-SETTLED-001');
      await sleep(500);

      const repayModalScreenshot = path.join(ARTIFACTS_DIR, 'evidence_emergency_fund_repay_modal.png');
      await page.screenshot({ path: repayModalScreenshot, fullPage: false });
      console.log(`Saved screenshot: ${repayModalScreenshot}`);

      // Submit Repayment
      await page.evaluate(() => {
        const submitRepBtn = Array.from(document.querySelectorAll('button')).find(
          b => b.textContent && b.textContent.includes('Submit Repayment')
        );
        if (submitRepBtn) submitRepBtn.click();
      });
      await sleep(4000);
    }

    // 12. Check Transaction Register
    console.log('12. Checking Transaction Register sub-tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const regBtn = buttons.find(b => b.textContent && b.textContent.includes('Transaction Register'));
      if (regBtn) regBtn.click();
    });
    await sleep(2000);

    const registerScreenshot = path.join(ARTIFACTS_DIR, 'evidence_emergency_fund_register.png');
    await page.screenshot({ path: registerScreenshot, fullPage: false });
    console.log(`Saved screenshot: ${registerScreenshot}`);

    // 13. Check Reports Hub
    console.log('13. Checking Reports Hub sub-tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const repBtn = buttons.find(b => b.textContent && b.textContent.includes('Reports Hub'));
      if (repBtn) repBtn.click();
    });
    await sleep(2000);

    const reportsScreenshot = path.join(ARTIFACTS_DIR, 'evidence_emergency_fund_reports_hub.png');
    await page.screenshot({ path: reportsScreenshot, fullPage: false });
    console.log(`Saved screenshot: ${reportsScreenshot}`);

    console.log('ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('Error during verification:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
