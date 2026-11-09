const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'https://dreamloom-bms-injw.vercel.app';
const CHROME_PATH = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const ARTIFACT_DIR = '/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/d2f23adf-20bf-435a-af12-25996bc144b4';

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('--- Capturing Member Directory & Member Profile Modal ---');
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
    await page.setViewport({ width: 1400, height: 950 });

    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

    // Login
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'kamera@dreamloom.co.ke');
    await page.type('input[type="password"]', 'Simon@%322');
    await page.click('button[type="submit"]');

    await page.waitForSelector('nav', { timeout: 15000 });
    await wait(2000);

    // Click Member Directory in sidebar
    console.log('Navigating to Member Directory tab...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('button, a, span'));
      const memTab = items.find(el => el.innerText && el.innerText.trim() === 'Member Directory');
      if (memTab) memTab.click();
    });
    await wait(2000);

    // Screenshot Member Directory Table
    const dirPath = path.join(ARTIFACT_DIR, 'evidence_member_directory_table.png');
    await page.screenshot({ path: dirPath, fullPage: false });
    console.log(`Saved: ${dirPath}`);

    // Click Simon Memia's "Profile" button or row
    console.log('Opening Member Profile Modal for Simon Memia...');
    const clickedProfile = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const profBtn = buttons.find(b => b.innerText && b.innerText.includes('Profile'));
      if (profBtn) {
        profBtn.click();
        return true;
      }
      return false;
    });

    if (clickedProfile) {
      await wait(1500);
      const modalPath = path.join(ARTIFACT_DIR, 'evidence_member_profile_modal.png');
      await page.screenshot({ path: modalPath, fullPage: false });
      console.log(`Saved: ${modalPath}`);
    } else {
      console.log('Could not find Profile button');
    }

  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
}

run();
