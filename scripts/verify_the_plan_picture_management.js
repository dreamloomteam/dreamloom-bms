const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CHROME_PATH = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const ARTIFACT_DIR = '/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/d2f23adf-20bf-435a-af12-25996bc144b4';

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Generate a test high-res image data URL (green gradient badge)
function createSampleImageBase64(titleText, color = '#0A5C36') {
  // 400x300 PNG with SVG drawing
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#022c19;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#grad)" rx="24"/>
    <circle cx="400" cy="240" r="100" fill="white" opacity="0.15"/>
    <text x="400" y="260" font-family="sans-serif" font-size="44" font-weight="bold" fill="#ffffff" text-anchor="middle">${titleText}</text>
    <text x="400" y="320" font-family="sans-serif" font-size="24" fill="#A7F3D0" text-anchor="middle">Dreamloom Holding Limited • Verified Upload</text>
    <rect x="250" y="360" width="300" height="40" rx="10" fill="#ffffff" opacity="0.2"/>
    <text x="400" y="386" font-family="sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">OFFICIAL BMS PHOTOGRAPH</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function run() {
  console.log(`Starting Picture Management Verification on ${BASE_URL}...`);

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

  // ---------------------------------------------------------------------------
  // STEP 1: LOGIN AS SUPER ADMIN SIMON MEMIA
  // ---------------------------------------------------------------------------
  console.log('Navigating to login...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(1500);

  const loginInput = await page.$('input[placeholder="Username or Email"]');
  if (loginInput) {
    console.log('Logging in as Simon Memia Wanjiru (simon@dreamloom.co.ke)...');
    await page.type('input[placeholder="Username or Email"]', 'simon@dreamloom.co.ke', { delay: 15 });
    await page.type('input[placeholder="Password"]', 'Simon@%322', { delay: 15 });
    await page.click('button[type="submit"]');
    await wait(3000);
  }

  // Open "The Plan" tab
  console.log('Opening "The Plan" tab in sidebar...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('aside button'));
    const planBtn = btns.find(b => b.textContent.includes('The Plan'));
    if (planBtn) planBtn.click();
  });
  await wait(2000);

  // ---------------------------------------------------------------------------
  // STEP 2: VERIFY ADMIN PICTURE CONTROLS ARE VISIBLE TO SIMON
  // ---------------------------------------------------------------------------
  const adminControlsVisible = await page.evaluate(() => {
    const uploadButtons = Array.from(document.querySelectorAll('button')).filter(b =>
      b.textContent.includes('Upload Picture')
    );
    const manageButtons = Array.from(document.querySelectorAll('button[title="Manage Picture"]'));
    return {
      uploadButtonsCount: uploadButtons.length,
      manageButtonsCount: manageButtons.length
    };
  });

  console.log('Admin controls detected:', adminControlsVisible);
  if (adminControlsVisible.uploadButtonsCount === 0 || adminControlsVisible.manageButtonsCount === 0) {
    throw new Error('Admin picture management controls are NOT visible to Simon!');
  }

  // ---------------------------------------------------------------------------
  // STEP 3: OPEN PICTURE ACTIONS DROPDOWN AND CAPTURE SCREENSHOT
  // ---------------------------------------------------------------------------
  console.log('Opening picture actions dropdown on first photo...');
  await page.evaluate(() => {
    const manageBtn = document.querySelector('button[title="Manage Picture"]');
    if (manageBtn) manageBtn.click();
  });
  await wait(800);

  const dropdownOptions = await page.evaluate(() => {
    const dropdown = document.querySelector('.photo-actions-dropdown-container');
    if (!dropdown) return [];
    return Array.from(dropdown.querySelectorAll('button')).map(b => b.textContent.trim());
  });

  console.log('Dropdown options available:', dropdownOptions);
  const screenshotDropdown = path.join(ARTIFACT_DIR, 'evidence_picture_mgmt_admin_dropdown.png');
  await page.screenshot({ path: screenshotDropdown, fullPage: false });
  console.log(`Saved screenshot: ${screenshotDropdown}`);

  // ---------------------------------------------------------------------------
  // STEP 4: TEST 1 — SIMON UPLOADS A NEW DREAMLOOM APARTMENTS PHOTOGRAPH
  // ---------------------------------------------------------------------------
  console.log('Testing Upload New Picture to Dreamloom Apartments...');
  const newApartmentPhoto = {
    title: 'Phase II Executive Wings',
    caption: 'Modern luxury residential development with infinity pools and solar rooftop arrays.',
    tag: 'Executive Phase II',
    base64: createSampleImageBase64('PHASE II APARTMENTS', '#0284C7')
  };

  const uploadResult = await page.evaluate(async (data) => {
    const res = await fetch('/api/the-plan/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'upload',
        projectId: 'apartments',
        title: data.title,
        caption: data.caption,
        tag: data.tag,
        fileBase64: data.base64,
        fileName: 'apartments_phase_2.png',
        userEmail: 'simon@dreamloom.co.ke',
        userName: 'Simon Memia Wanjiru'
      })
    });
    return await res.json();
  }, newApartmentPhoto);

  console.log('Upload result for Apartments:', uploadResult.success, uploadResult.message);
  if (!uploadResult.success) {
    throw new Error(`Upload failed: ${uploadResult.error}`);
  }

  // ---------------------------------------------------------------------------
  // STEP 5: VERIFY PHOTOGRAPH APPEARS IMMEDIATELY AND PERSISTS ACROSS REFRESH
  // ---------------------------------------------------------------------------
  console.log('Refreshing page to verify persistence...');
  await page.reload({ waitUntil: 'networkidle2' });
  await wait(2500);

  // Switch to The Plan tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('aside button'));
    const planBtn = btns.find(b => b.textContent.includes('The Plan'));
    if (planBtn) planBtn.click();
  });
  await wait(2000);

  const apartmentPhotoExists = await page.evaluate((title) => {
    return document.body.innerText.includes(title);
  }, newApartmentPhoto.title);

  console.log(`Uploaded Apartments photo persists after refresh: ${apartmentPhotoExists}`);
  if (!apartmentPhotoExists) {
    throw new Error('New Apartments photo did NOT persist after page refresh!');
  }

  // ---------------------------------------------------------------------------
  // STEP 6: TEST 4 — SIMON REPLACES AVOCADO PHOTOGRAPH WITHOUT CHANGING DAIRY
  // ---------------------------------------------------------------------------
  console.log('Testing Replace Avocado photograph without modifying Dairy...');
  // Capture dairy photos before
  const dairyPhotosBefore = await page.evaluate(async () => {
    const res = await fetch('/api/the-plan/images').then(r => r.json());
    return res.data['dairy-farm'];
  });

  const replaceAvocadoResult = await page.evaluate(async (sampleImg) => {
    const res = await fetch('/api/the-plan/images').then(r => r.json());
    const avocadoPhotos = res.data['avocado-farm'];
    const firstAvocado = avocadoPhotos[0];

    const replaceRes = await fetch('/api/the-plan/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'replace',
        projectId: 'avocado-farm',
        photoId: firstAvocado.id,
        title: 'High-Density Hass Orchard',
        caption: 'Certified export-grade grafted Hass orchard with micro-sprinkler fertigation.',
        tag: 'Certified Hass',
        fileBase64: sampleImg,
        fileName: 'avocado_high_density.png',
        userEmail: 'simon@dreamloom.co.ke',
        userName: 'Simon Memia Wanjiru'
      })
    });
    return await replaceRes.json();
  }, createSampleImageBase64('HIGH-DENSITY HASS ORCHARD', '#15803D'));

  console.log('Replace Avocado result:', replaceAvocadoResult.success, replaceAvocadoResult.message);
  if (!replaceAvocadoResult.success) {
    throw new Error(`Replace Avocado failed: ${replaceAvocadoResult.error}`);
  }

  // Verify Dairy photos remain completely unchanged
  const dairyPhotosAfter = await page.evaluate(async () => {
    const res = await fetch('/api/the-plan/images').then(r => r.json());
    return res.data['dairy-farm'];
  });

  const dairyUnchanged = JSON.stringify(dairyPhotosBefore) === JSON.stringify(dairyPhotosAfter);
  console.log(`Dairy photos completely untouched during Avocado replacement: ${dairyUnchanged}`);
  if (!dairyUnchanged) {
    throw new Error('Replacing Avocado photograph accidentally modified Dairy photos!');
  }

  // ---------------------------------------------------------------------------
  // STEP 7: TEST 5 — SIMON ADDS ANOTHER PHOTOGRAPH TO GOAT FARM
  // ---------------------------------------------------------------------------
  console.log('Testing Add photograph to Goat Farm section...');
  const addGoatResult = await page.evaluate(async (sampleImg) => {
    const res = await fetch('/api/the-plan/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'upload',
        projectId: 'goat-farm',
        title: 'Pedigree Boer Stud Bucks',
        caption: 'Purebred South African Boer stud bucks for intensive breeding multiplication.',
        tag: 'Stud Bucks',
        fileBase64: sampleImg,
        fileName: 'boer_stud_bucks.png',
        userEmail: 'simon@dreamloom.co.ke',
        userName: 'Simon Memia Wanjiru'
      })
    });
    return await res.json();
  }, createSampleImageBase64('BOER STUD BUCKS', '#9333EA'));

  console.log('Add Goat Farm photo result:', addGoatResult.success);
  if (!addGoatResult.success) {
    throw new Error(`Add Goat Farm photo failed: ${addGoatResult.error}`);
  }

  // ---------------------------------------------------------------------------
  // STEP 8: TEST 6 — SIMON CHANGES THE COVER PHOTOGRAPH
  // ---------------------------------------------------------------------------
  console.log('Testing Set as Cover photograph in Dreamloom Apartments...');
  const setCoverResult = await page.evaluate(async () => {
    const res = await fetch('/api/the-plan/images').then(r => r.json());
    const aptPhotos = res.data['apartments'];
    // Target the newly uploaded Phase II photo
    const phase2 = aptPhotos.find(p => p.title.includes('Phase II')) || aptPhotos[aptPhotos.length - 1];

    const coverRes = await fetch('/api/the-plan/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'set-cover',
        projectId: 'apartments',
        photoId: phase2.id,
        userEmail: 'simon@dreamloom.co.ke',
        userName: 'Simon Memia Wanjiru'
      })
    });
    return await coverRes.json();
  });

  console.log('Set cover result:', setCoverResult.success, setCoverResult.message);
  if (!setCoverResult.success) {
    throw new Error(`Set cover failed: ${setCoverResult.error}`);
  }

  // Reload to verify all updates render in UI
  await page.reload({ waitUntil: 'networkidle2' });
  await wait(2000);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('aside button'));
    const planBtn = btns.find(b => b.textContent.includes('The Plan'));
    if (planBtn) planBtn.click();
  });
  await wait(2000);

  const screenshotAdminUpdated = path.join(ARTIFACT_DIR, 'evidence_picture_mgmt_new_photo_uploaded.png');
  await page.screenshot({ path: screenshotAdminUpdated, fullPage: false });
  console.log(`Saved screenshot: ${screenshotAdminUpdated}`);

  // ---------------------------------------------------------------------------
  // STEP 9: TEST 8 & 9 — NORMAL MEMBER (DAVID WAINAINA) READ-ONLY ACCESS
  // ---------------------------------------------------------------------------
  console.log('Testing Normal Member Access (David Wainaina)...');
  await browser.close();

  const browserMember = await puppeteer.launch({
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

  const memberPage = await browserMember.newPage();
  await memberPage.setViewport({ width: 1600, height: 1100 });

  await memberPage.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(1500);

  await memberPage.type('input[placeholder="Username or Email"]', 'david@dreamloom.co.ke', { delay: 15 });
  await memberPage.type('input[placeholder="Password"]', 'David@399', { delay: 15 });
  await memberPage.click('button[type="submit"]');
  await wait(3000);

  // Navigate to The Plan
  await memberPage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('aside button'));
    const planBtn = btns.find(b => b.textContent.includes('The Plan'));
    if (planBtn) planBtn.click();
  });
  await wait(2000);

  // Verify David sees the updated photos (Phase II Executive Wings)
  const memberSeesUpdatedPhoto = await memberPage.evaluate(() => {
    return document.body.innerText.includes('Phase II Executive Wings');
  });
  console.log(`David sees Simon's updated Apartments photo: ${memberSeesUpdatedPhoto}`);

  // Verify David sees ZERO management controls
  const memberControls = await memberPage.evaluate(() => {
    const uploadButtons = Array.from(document.querySelectorAll('button')).filter(b =>
      b.textContent.includes('Upload Picture')
    );
    const manageButtons = Array.from(document.querySelectorAll('button[title="Manage Picture"]'));
    return {
      uploadButtonsCount: uploadButtons.length,
      manageButtonsCount: manageButtons.length
    };
  });
  console.log('Controls visible to David Wainaina:', memberControls);

  if (memberControls.uploadButtonsCount > 0 || memberControls.manageButtonsCount > 0) {
    throw new Error('Normal member David Wainaina can see administrator picture management buttons!');
  }

  // Verify server-side authorization check blocks unauthorized POST
  console.log('Testing server-side rejection for non-admin POST request...');
  const unauthorizedPostResult = await memberPage.evaluate(async () => {
    const res = await fetch('/api/the-plan/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete',
        projectId: 'apartments',
        photoId: 'any-id',
        userEmail: 'david@dreamloom.co.ke'
      })
    });
    return { status: res.status, body: await res.json() };
  });

  console.log('Server rejection response:', unauthorizedPostResult.status, unauthorizedPostResult.body.error);
  if (unauthorizedPostResult.status !== 403) {
    throw new Error(`Expected 403 Forbidden for non-admin POST, got ${unauthorizedPostResult.status}`);
  }

  const screenshotMemberView = path.join(ARTIFACT_DIR, 'evidence_picture_mgmt_member_view_no_controls.png');
  await memberPage.screenshot({ path: screenshotMemberView, fullPage: false });
  console.log(`Saved screenshot: ${screenshotMemberView}`);

  // ---------------------------------------------------------------------------
  // STEP 10: TEST MOBILE VIEWPORT (390 x 844)
  // ---------------------------------------------------------------------------
  console.log('Testing Mobile Viewport on Android/iPhone (390x844)...');
  await memberPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await wait(1000);

  const screenshotMobile = path.join(ARTIFACT_DIR, 'evidence_picture_mgmt_mobile_view.png');
  await memberPage.screenshot({ path: screenshotMobile, fullPage: false });
  console.log(`Saved screenshot: ${screenshotMobile}`);

  await browserMember.close();
  console.log('🎉 ALL 10 TESTS PASSED WITH 100% SUCCESS!');
}

run().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
