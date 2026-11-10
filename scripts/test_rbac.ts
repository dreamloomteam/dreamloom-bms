import { GET as getLoginLogs } from '../src/app/api/login-logs/route';
import { GET as getAuditLogs } from '../src/app/api/audit-logs/route';
import { createSessionToken } from '../src/lib/session';
import { NextRequest } from 'next/server';

function reqWithCookie(url: string, cookieValue?: string) {
  const r = new NextRequest(new URL(url, 'http://localhost:3000'), { method: 'GET' });
  if (cookieValue) {
    r.cookies.set('dreamloom_session', cookieValue);
  }
  return r;
}

async function test() {
  console.log('--- TEST 1: Unauthenticated Requests ---');
  const unauthLoginRes = await getLoginLogs(reqWithCookie('http://localhost:3000/api/login-logs'));
  console.log('Unauthenticated /api/login-logs status:', unauthLoginRes.status, await unauthLoginRes.json());
  const unauthAuditRes = await getAuditLogs(reqWithCookie('http://localhost:3000/api/audit-logs'));
  console.log('Unauthenticated /api/audit-logs status:', unauthAuditRes.status, await unauthAuditRes.json());

  console.log('\n--- TEST 2: Non-Admin Requests (Treasurer / Member) ---');
  const treasurerToken = createSessionToken({
    email: 'michael@dreamloom.co.ke',
    name: 'Michael',
    fullName: 'Michael Njoroge',
    nationalId: '24556677',
    phone: '+254711223344',
    role: 'Treasurer'
  }).token;
  const treasLoginRes = await getLoginLogs(reqWithCookie('http://localhost:3000/api/login-logs', treasurerToken));
  console.log('Treasurer /api/login-logs status:', treasLoginRes.status, await treasLoginRes.json());
  const treasAuditRes = await getAuditLogs(reqWithCookie('http://localhost:3000/api/audit-logs', treasurerToken));
  console.log('Treasurer /api/audit-logs status:', treasAuditRes.status, await treasAuditRes.json());

  console.log('\n--- TEST 3: Administrator Requests (kamera@dreamloom.co.ke) ---');
  const adminToken = createSessionToken({
    email: 'kamera@dreamloom.co.ke',
    name: 'Simon',
    fullName: 'Simon Memia Wanjiru',
    nationalId: '22114455',
    phone: '+254700000000',
    role: 'Super Administrator'
  }).token;
  const adminLoginRes = await getLoginLogs(reqWithCookie('http://localhost:3000/api/login-logs', adminToken));
  const adminLoginJson = await adminLoginRes.json();
  console.log('Admin /api/login-logs status:', adminLoginRes.status, 'records:', adminLoginJson.data?.length);
  const adminAuditRes = await getAuditLogs(reqWithCookie('http://localhost:3000/api/audit-logs', adminToken));
  const adminAuditJson = await adminAuditRes.json();
  console.log('Admin /api/audit-logs status:', adminAuditRes.status, 'records:', adminAuditJson.data?.length);
}

test().catch(console.error);
