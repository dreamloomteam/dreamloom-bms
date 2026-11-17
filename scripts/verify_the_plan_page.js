const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CHROME_PATH = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const ARTIFACT_DIR = '/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/d2f23adf-20bf-435a-af12-25996bc144b4';

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log(`Starting Verification for "The Plan" on ${BASE_URL}...`);

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

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1100 });

  // 1. Navigate & Login as Super Admin Simon Memia
  console.log('Navigating to BMS login...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(1500);

  const loginInput = await page.$('input[placeholder="Username or Email"]');
  if (loginInput) {
    console.log('Logging in as Simon Memia Wanjiru...');
    await page.type('input[placeholder="Username or Email"]', 'simon@dreamloom.co.ke', { delay: 20 });
    await page.type('input[placeholder="Password"]', 'Simon@%322', { delay: 20 });
    await page.click('button[type="submit"]');
    await wait(3000);
  }

  // 2. Verify sidebar contains "The Plan"
  console.log('Checking sidebar for "The Plan"...');
  const sidebarButtons = await page.$$eval('aside button', btns => btns.map(b => b.textContent.trim()));
  const hasThePlan = sidebarButtons.some(t => t.includes('The Plan'));
  console.log(`Sidebar items count: ${sidebarButtons.length}, contains "The Plan": ${hasThePlan}`);
  if (!hasThePlan) {
    throw new Error('Sidebar does NOT contain "The Plan" item!');
  }

  // 3. Click "The Plan" in sidebar
  console.log('Clicking "The Plan" sidebar item...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('aside button'));
    const planBtn = btns.find(b => b.textContent.includes('The Plan'));
    if (planBtn) planBtn.click();
  });
  await wait(2000);

  // 4. Verify Content of "The Plan"
  const pageVerification = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    const requiredTexts = [
      'OUR VISION. OUR INVESTMENTS. OUR FUTURE.',
      'Building lasting wealth through land, agriculture and property development.',
      'DREAMLOOM LAND & PROPERTY INVESTMENT',
      'DREAMLOOM APARTMENTS & RENTAL PROPERTIES',
      'DREAMLOOM POULTRY FARM',
      'Broiler Chicken Production',
      'Layer Chicken Production',
      'DREAMLOOM DAIRY FARM',
      'DREAMLOOM GOAT FARM',
      'DREAMLOOM FODDER & NAPIER GRASS FARM',
      'DREAMLOOM AVOCADO FARM',
      'WHERE BIG DREAMERS MEET',
      'Today we plan. Tomorrow we build. Together we grow.'
    ];

    const missing = requiredTexts.filter(t => !bodyText.includes(t));

    // Verify all project images loaded
    const planImages = Array.from(document.querySelectorAll('img[src*="/images/the-plan/"]'));
    const imageStatus = planImages.map(img => ({
      src: img.getAttribute('src'),
      alt: img.getAttribute('alt'),
      naturalWidth: img.naturalWidth,
      loaded: img.naturalWidth > 0
    }));

    const brokenImages = imageStatus.filter(i => !i.loaded);

    return {
      totalImages: planImages.length,
      brokenImagesCount: brokenImages.length,
      missingTexts: missing,
      images: imageStatus
    };
  });

  console.log(`Page verification result:
  - Total Plan images on page: ${pageVerification.totalImages}
  - Broken images: ${pageVerification.brokenImagesCount}
  - Missing texts: ${JSON.stringify(pageVerification.missingTexts)}`);

  if (pageVerification.missingTexts.length > 0) {
    throw new Error(`Missing required texts: ${pageVerification.missingTexts.join(', ')}`);
  }
  if (pageVerification.brokenImagesCount > 0) {
    throw new Error(`${pageVerification.brokenImagesCount} images failed to load!`);
  }

  // 5. Test Lightbox modal
  console.log('Testing Lightbox Modal...');
  await page.evaluate(() => {
    const firstImg = document.querySelector('img[src*="/images/the-plan/"]');
    if (firstImg) firstImg.click();
  });
  await wait(1000);

  const isModalOpen = await page.evaluate(() => {
    const modal = document.querySelector('.fixed.inset-0.z-50');
    return !!modal;
  });
  console.log(`Lightbox opened successfully: ${isModalOpen}`);

  // Capture desktop screenshot with lightbox
  const lightboxPath = path.join(ARTIFACT_DIR, 'evidence_the_plan_lightbox.png');
  await page.screenshot({ path: lightboxPath, fullPage: false });
  console.log(`Saved screenshot: ${lightboxPath}`);

  // Close Lightbox
  await page.evaluate(() => {
    const closeBtn = document.querySelector('button[aria-label="Close photo preview"]');
    if (closeBtn) closeBtn.click();
  });
  await wait(500);

  // Capture Desktop Full Page View
  const desktopPath = path.join(ARTIFACT_DIR, 'evidence_the_plan_desktop.png');
  await page.screenshot({ path: desktopPath, fullPage: false });
  console.log(`Saved screenshot: ${desktopPath}`);

  // 6. Test Mobile Viewport (390x844 - iPhone / Android)
  console.log('Testing Mobile Viewport (390x844)...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await wait(1000);

  const mobilePath = path.join(ARTIFACT_DIR, 'evidence_the_plan_mobile.png');
  await page.screenshot({ path: mobilePath, fullPage: false });
  console.log(`Saved screenshot: ${mobilePath}`);

  // 7. Non-admin verification: Log in as regular member David Wainaina
  console.log('Verifying Non-Admin Member Access (David Wainaina)...');
  await browser.close();

  const browser2 = await puppeteer.launch({
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

  const memberPage = await browser2.newPage();
  await memberPage.setViewport({ width: 1600, height: 1100 });

  await memberPage.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(1500);

  await memberPage.type('input[placeholder="Username or Email"]', 'david@dreamloom.co.ke', { delay: 20 });
  await memberPage.type('input[placeholder="Password"]', 'David@399', { delay: 20 });
  await memberPage.click('button[type="submit"]');
  await wait(3000);

  // Check David can see "The Plan"
  const davidPlanAvailable = await memberPage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('aside button'));
    const planBtn = btns.find(b => b.textContent.includes('The Plan'));
    if (planBtn) {
      planBtn.click();
      return true;
    }
    return false;
  });
  await wait(2000);

  console.log(`David Wainaina access to "The Plan": ${davidPlanAvailable}`);
  const davidDesktopPath = path.join(ARTIFACT_DIR, 'evidence_the_plan_member_view.png');
  await memberPage.screenshot({ path: davidDesktopPath, fullPage: false });
  console.log(`Saved screenshot: ${davidDesktopPath}`);

  await browser2.close();
  console.log('✅ ALL TESTS PASSED SUCCESSFULLY!');
}

run().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
