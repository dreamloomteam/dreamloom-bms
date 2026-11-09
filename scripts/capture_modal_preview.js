const puppeteer = require('puppeteer-core');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'https://dreamloom-bms-injw.vercel.app';
const CHROME_PATH = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const ARTIFACT_DIR = '/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/d2f23adf-20bf-435a-af12-25996bc144b4';

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    ignoreHTTPSErrors: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,1100', '--ignore-certificate-errors']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1100 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

    // Check login
    const pwd = await page.$('input[type="password"]');
    if (pwd) {
      await page.type('input[type="email"]', 'kamera@dreamloom.co.ke');
      await page.type('input[type="password"]', 'Simon@%322');
      await page.click('button[type="submit"]');
      await wait(3000);
    }

    // Switch to Loan Portfolio tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const lp = btns.find(b => b.textContent && b.textContent.includes('Loan Portfolio'));
      if (lp) lp.click();
    });
    await wait(2500);

    // Click Disburse Loan button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const disb = btns.find(b => b.textContent && b.textContent.includes('DISBURSE LOAN'));
      if (disb) disb.click();
    });
    await wait(1500);

    // Find the modal form
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (!form) return;
      const inputs = Array.from(form.querySelectorAll('input'));
      const setVal = (input, val) => {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(input, val);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };

      const principalInput = inputs.find(i => i.placeholder && i.placeholder.includes('100000'));
      if (principalInput) setVal(principalInput, '10000');

      const dateInput = inputs.find(i => i.type === 'date');
      if (dateInput) setVal(dateInput, '2026-08-09');
    });
    await wait(1500);

    // Scroll down inside the modal
    await page.evaluate(() => {
      const scrollable = document.querySelector('.overflow-y-auto') || document.querySelector('form');
      if (scrollable) {
        scrollable.scrollTop = scrollable.scrollHeight;
      }
      const preview = Array.from(document.querySelectorAll('div')).find(d => d.textContent && d.textContent.includes('Valuation / As-Of Date'));
      if (preview) {
        preview.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    });
    await wait(1000);

    const modalPath = path.join(ARTIFACT_DIR, 'evidence_loan_disburse_modal_preview.png');
    await page.screenshot({ path: modalPath });
    console.log('Saved modal preview screenshot:', modalPath);

  } finally {
    await browser.close();
  }
})();
