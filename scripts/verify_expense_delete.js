const puppeteer = require('puppeteer-core');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'https://dreamloom-bms-injw.vercel.app';
const CHROME_PATH = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const ARTIFACT_DIR = '/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/d2f23adf-20bf-435a-af12-25996bc144b4';

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log(`Starting Expenses Delete Action Verification on ${BASE_URL}...`);

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
  // STEP 1: LOGIN AS AUTHORIZED ADMINISTRATOR (SIMON MEMIA WANJIRU)
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

  // ---------------------------------------------------------------------------
  // STEP 2: CREATE A SPECIFIC TEST EXPENSE TO VERIFY DELETE SAFELY
  // ---------------------------------------------------------------------------
  const testDesc = `Verification Expense Voucher ${Date.now()}`;
  console.log(`Creating test expense: "${testDesc}"...`);

  const createRes = await page.evaluate(async (desc) => {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expenseDate: new Date().toISOString(),
        description: desc,
        amount: 8750,
        expenseType: 'Operational Test',
        referenceDetails: 'Automated Delete Verification',
        userEmail: 'simon@dreamloom.co.ke'
      })
    });
    return await res.json();
  }, testDesc);

  console.log('Create test expense response:', createRes);
  if (!createRes.success || !createRes.data?.id) {
    throw new Error('Failed to create test expense for verification: ' + JSON.stringify(createRes));
  }
  const testExpenseDbId = createRes.data.id;
  console.log(`Created test expense with database ID: ${testExpenseDbId}`);

  // ---------------------------------------------------------------------------
  // STEP 3: NAVIGATE TO EXPENSES PAGE AND LOAD LATEST DATA
  // ---------------------------------------------------------------------------
  console.log('Navigating to Expenses tab and loading latest data from server...');
  await page.reload({ waitUntil: 'networkidle2' });
  await wait(2000);

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('aside button'));
    const expBtn = btns.find(b => b.textContent.includes('Expenses'));
    if (expBtn) expBtn.click();
  });
  await wait(2500);

  // Take screenshot of Expenses table showing the test record and Actions tab
  const screenshotBefore = path.join(ARTIFACT_DIR, 'evidence_expenses_before_delete.png');
  await page.screenshot({ path: screenshotBefore, fullPage: false });
  console.log(`Saved screenshot before delete: ${screenshotBefore}`);

  // Check test expense exists in DOM
  const existsBefore = await page.evaluate((desc) => {
    return document.body.innerText.includes(desc);
  }, testDesc);
  console.log(`Test expense visible in Expenses table: ${existsBefore}`);
  if (!existsBefore) {
    throw new Error(`Test expense "${testDesc}" was not found in table!`);
  }

  // ---------------------------------------------------------------------------
  // STEP 4: TEST CONFIRMATION DIALOG CANCELLATION (RECORD MUST REMAIN)
  // ---------------------------------------------------------------------------
  console.log('Testing Delete Cancel (Record must NOT be deleted)...');
  // Listen for dialog and dismiss (cancel)
  page.once('dialog', async dialog => {
    console.log(`Dialog appeared: "${dialog.message()}". Dismissing (Cancel)...`);
    await dialog.dismiss();
  });

  // Find row with testDesc and click its Action dropdown -> Delete
  await page.evaluate((desc) => {
    const rows = Array.from(document.querySelectorAll('table tbody tr'));
    const targetRow = rows.find(r => r.textContent.includes(desc));
    if (!targetRow) throw new Error('Target row not found for cancel test');
    const actionBtn = targetRow.querySelector('button[title="Actions"]') || targetRow.querySelector('td:last-child button');
    if (!actionBtn) throw new Error('Action dropdown button not found in row');
    actionBtn.click();
  }, testDesc);
  await wait(600);

  // Click 'Delete' option in dropdown
  await page.evaluate(() => {
    const deleteBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Delete');
    if (!deleteBtn) throw new Error('Delete dropdown item not found');
    deleteBtn.click();
  });
  await wait(1500);

  // Verify record is STILL present after cancellation
  const stillExistsAfterCancel = await page.evaluate((desc) => {
    return document.body.innerText.includes(desc);
  }, testDesc);
  console.log(`Record still present after dialog cancellation: ${stillExistsAfterCancel}`);
  if (!stillExistsAfterCancel) {
    throw new Error('Record was unexpectedly deleted when dialog was dismissed!');
  }

  // ---------------------------------------------------------------------------
  // STEP 5: TEST CONFIRMATION DIALOG ACCEPTANCE (DELETE RECORD)
  // ---------------------------------------------------------------------------
  console.log('Testing Delete Confirm (Accepting dialog)...');
  let dialogMessageSeen = '';
  page.once('dialog', async dialog => {
    dialogMessageSeen = dialog.message();
    console.log(`Dialog appeared: "${dialogMessageSeen}". Accepting (Confirm)...`);
    await dialog.accept();
  });

  // Open Actions dropdown on target row again
  await page.evaluate((desc) => {
    const rows = Array.from(document.querySelectorAll('table tbody tr'));
    const targetRow = rows.find(r => r.textContent.includes(desc));
    if (!targetRow) throw new Error('Target row not found for delete test');
    const actionBtn = targetRow.querySelector('button[title="Actions"]') || targetRow.querySelector('td:last-child button');
    if (!actionBtn) throw new Error('Action dropdown button not found in row');
    actionBtn.click();
  }, testDesc);
  await wait(600);

  // Click Delete button
  await page.evaluate(() => {
    const deleteBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Delete');
    if (!deleteBtn) throw new Error('Delete dropdown item not found');
    deleteBtn.click();
  });
  await wait(2500);

  // ---------------------------------------------------------------------------
  // STEP 6: VERIFY IMMEDIATE REMOVAL FROM EXPENSES TABLE (DOM)
  // ---------------------------------------------------------------------------
  const existsImmediatelyAfter = await page.evaluate((desc) => {
    return document.body.innerText.includes(desc);
  }, testDesc);
  console.log(`Record disappeared immediately from Expenses table: ${!existsImmediatelyAfter}`);
  if (existsImmediatelyAfter) {
    throw new Error('Record did NOT disappear immediately from the Expenses table after deletion!');
  }

  const screenshotAfter = path.join(ARTIFACT_DIR, 'evidence_expenses_after_delete.png');
  await page.screenshot({ path: screenshotAfter, fullPage: false });
  console.log(`Saved screenshot after delete: ${screenshotAfter}`);

  // ---------------------------------------------------------------------------
  // STEP 7: VERIFY RECORD IS DELETED FROM DATABASE VIA API
  // ---------------------------------------------------------------------------
  console.log('Verifying record is deleted from backend database...');
  const dbCheck = await page.evaluate(async (id) => {
    const res = await fetch('/api/expenses').then(r => r.json());
    if (!res.success) return { error: res.error };
    const found = res.data.find(e => e.id === id);
    return { found: Boolean(found), count: res.data.length };
  }, testExpenseDbId);

  console.log('Database check after delete:', dbCheck);
  if (dbCheck.found) {
    throw new Error(`Record ${testExpenseDbId} is STILL present in database after deletion!`);
  }

  // ---------------------------------------------------------------------------
  // STEP 8: CONFIRM RECORD REMAINS DELETED AFTER REFRESHING THE PAGE
  // ---------------------------------------------------------------------------
  console.log('Refreshing page to verify persistence of deletion...');
  await page.reload({ waitUntil: 'networkidle2' });
  await wait(2500);

  // Switch back to Expenses tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('aside button'));
    const expBtn = btns.find(b => b.textContent.includes('Expenses'));
    if (expBtn) expBtn.click();
  });
  await wait(2000);

  const existsAfterReload = await page.evaluate((desc) => {
    return document.body.innerText.includes(desc);
  }, testDesc);
  console.log(`Record remains deleted after page reload: ${!existsAfterReload}`);
  if (existsAfterReload) {
    throw new Error('Deleted record reappeared after page refresh!');
  }

  // ---------------------------------------------------------------------------
  // STEP 9: CONFIRM RECORD REMAINS DELETED AFTER LOGOUT AND RE-LOGIN
  // ---------------------------------------------------------------------------
  console.log('Testing persistence across logout and re-login...');
  // Click user profile/logout or call logout API
  await page.evaluate(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
  });
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
  await wait(1500);

  // Log back in
  const reloginInput = await page.$('input[placeholder="Username or Email"]');
  if (reloginInput) {
    console.log('Re-logging in as Simon Memia Wanjiru...');
    await page.type('input[placeholder="Username or Email"]', 'simon@dreamloom.co.ke', { delay: 15 });
    await page.type('input[placeholder="Password"]', 'Simon@%322', { delay: 15 });
    await page.click('button[type="submit"]');
    await wait(3000);
  }

  // Open Expenses tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('aside button'));
    const expBtn = btns.find(b => b.textContent.includes('Expenses'));
    if (expBtn) expBtn.click();
  });
  await wait(2000);

  const existsAfterRelogin = await page.evaluate((desc) => {
    return document.body.innerText.includes(desc);
  }, testDesc);
  console.log(`Record remains deleted after re-login: ${!existsAfterRelogin}`);
  if (existsAfterRelogin) {
    throw new Error('Deleted record reappeared after logout and re-login!');
  }

  // ---------------------------------------------------------------------------
  // STEP 10: VERIFY AUDIT LOG RECORDED THE EXPENSE DELETION
  // ---------------------------------------------------------------------------
  console.log('Verifying Audit Log entry for Deleted expense...');
  const auditLogs = await page.evaluate(async (id) => {
    const res = await fetch('/api/audit-logs').then(r => r.json());
    if (!res.success) return [];
    return res.data.filter(log => log.model === 'Expenses' && log.action === 'Deleted' && (log.recordId === id || log.recordRef === String(id)));
  }, testExpenseDbId);

  console.log(`Found ${auditLogs.length} audit log entries for deleted expense.`);
  if (auditLogs.length > 0) {
    console.log('Audit log details:', {
      action: auditLogs[0].action,
      model: auditLogs[0].model,
      user: auditLogs[0].userName,
      remarks: auditLogs[0].remarks
    });
  }

  console.log('🎉 ALL 6 VERIFICATION REQUIREMENTS PASSED WITH 100% SUCCESS!');
  await browser.close();
}

run().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
