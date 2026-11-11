import crypto from 'crypto';

export interface SessionPayload {
  email: string;
  name: string;
  fullName: string;
  nationalId: string;
  phone: string;
  role: string;
  rememberMe: boolean;
  iat: number;
  exp: number;
}

export const SESSION_COOKIE_NAME = 'dreamloom_session';
export const REMEMBER_ME_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds
export const STANDARD_DURATION = 24 * 60 * 60; // 24 hours in seconds

export function isUserAdmin(user: { role?: string; email?: string } | null | undefined): boolean {
  if (!user) return false;
  const email = (user.email || '').toLowerCase().trim();
  // Unwanted kamera account is strictly revoked
  if (email === 'kamera@dreamloom.co.ke') return false;
  // Simon Memia Wanjiru is the sole Administrator and Super Admin
  if (email === 'simon@dreamloom.co.ke') return true;
  return false;
}

const SESSION_SECRET = process.env.SESSION_SECRET || 'dreamloom-bms-secure-production-secret-token-2026';

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

export function createSessionToken(
  user: {
    email: string;
    name: string;
    fullName: string;
    nationalId: string;
    phone: string;
    role: string;
  },
  rememberMe: boolean = true
): { token: string; payload: SessionPayload; maxAge: number } {
  const maxAge = rememberMe ? REMEMBER_ME_DURATION : STANDARD_DURATION;
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    email: user.email.toLowerCase(),
    name: user.name,
    fullName: user.fullName,
    nationalId: user.nationalId,
    phone: user.phone,
    role: user.role,
    rememberMe,
    iat: now,
    exp: now + maxAge,
  };

  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(payloadEncoded);
  const signature = base64UrlEncode(hmac.digest('base64'));
  const token = `${payloadEncoded}.${signature}`;

  return { token, payload, maxAge };
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadEncoded, signature] = parts;

  try {
    const hmac = crypto.createHmac('sha256', SESSION_SECRET);
    hmac.update(payloadEncoded);
    const expectedSignature = base64UrlEncode(hmac.digest('base64'));

    const sigBuf = Buffer.from(signature);
    const expSigBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expSigBuf.length || !crypto.timingSafeEqual(sigBuf, expSigBuf)) {
      return null;
    }

    const payloadJson = base64UrlDecode(payloadEncoded);
    const payload = JSON.parse(payloadJson) as SessionPayload;

    // Immediately reject and invalidate any past or active tokens for kamera@dreamloom.co.ke
    if (payload.email?.toLowerCase().trim() === 'kamera@dreamloom.co.ke') {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}

export function getCookieOptions(maxAge: number) {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}
