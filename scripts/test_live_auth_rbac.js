const BASE_URL = 'https://dreamloom-bms-injw.vercel.app';

async function testUser(email, password, expectedAdmin) {
  console.log(`\n======================================================`);
  console.log(`Testing user: ${email} (Expected Admin: ${expectedAdmin})`);
  console.log(`======================================================`);

  // 1. Login
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, rememberMe: true })
  });

  const cookieHeader = loginRes.headers.get('set-cookie');
  console.log(`Login Status: ${loginRes.status}`);
  const loginData = await loginRes.json();
  console.log(`User Info:`, loginData.user ? { name: loginData.user.name, role: loginData.user.role, email: loginData.user.email } : loginData);

  if (!cookieHeader) {
    console.error('No session cookie returned from login!');
    return;
  }

  // Extract session cookie
  const sessionCookie = cookieHeader.split(';')[0];
  console.log(`Cookie obtained: ${sessionCookie.slice(0, 35)}...`);

  // 2. Test /api/login-logs
  const loginLogsRes = await fetch(`${BASE_URL}/api/login-logs`, {
    headers: { Cookie: sessionCookie }
  });
  const loginLogsJson = await loginLogsRes.json();
  console.log(`GET /api/login-logs -> Status: ${loginLogsRes.status}`);
  if (expectedAdmin) {
    if (loginLogsRes.status === 200 && loginLogsJson.success) {
      console.log(`✅ PASS: Admin successfully fetched login logs (${loginLogsJson.data?.length} records)`);
    } else {
      console.error(`❌ FAIL: Admin was denied or got error:`, loginLogsJson);
    }
  } else {
    if (loginLogsRes.status === 403 && !loginLogsJson.success) {
      console.log(`✅ PASS: Non-admin correctly received HTTP 403 Forbidden: "${loginLogsJson.error}"`);
    } else {
      console.error(`❌ FAIL: Non-admin was NOT blocked! Status: ${loginLogsRes.status}`, loginLogsJson);
    }
  }

  // 3. Test /api/audit-logs
  const auditLogsRes = await fetch(`${BASE_URL}/api/audit-logs`, {
    headers: { Cookie: sessionCookie }
  });
  const auditLogsJson = await auditLogsRes.json();
  console.log(`GET /api/audit-logs -> Status: ${auditLogsRes.status}`);
  if (expectedAdmin) {
    if (auditLogsRes.status === 200 && auditLogsJson.success) {
      console.log(`✅ PASS: Admin successfully fetched audit logs (${auditLogsJson.data?.length} records)`);
    } else {
      console.error(`❌ FAIL: Admin was denied or got error:`, auditLogsJson);
    }
  } else {
    if (auditLogsRes.status === 403 && !auditLogsJson.success) {
      console.log(`✅ PASS: Non-admin correctly received HTTP 403 Forbidden: "${auditLogsJson.error}"`);
    } else {
      console.error(`❌ FAIL: Non-admin was NOT blocked! Status: ${auditLogsRes.status}`, auditLogsJson);
    }
  }
}

async function run() {
  // Test 1: Admin
  await testUser('kamera@dreamloom.co.ke', 'Simon@%322', true);

  // Test 2: Treasurer
  await testUser('michael@dreamloom.co.ke', 'Michael@389', false);

  // Test 3: Member
  await testUser('david@dreamloom.co.ke', 'David@399', false);
}

run().catch(console.error);
