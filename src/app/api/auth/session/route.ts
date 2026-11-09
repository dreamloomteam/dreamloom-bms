import { NextRequest, NextResponse } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  createSessionToken,
  getCookieOptions,
} from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const payload = verifySessionToken(token);

    if (!payload) {
      const response = NextResponse.json({ authenticated: false, user: null });
      // Clear invalid cookie
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    const user = {
      email: payload.email,
      name: payload.name,
      fullName: payload.fullName,
      nationalId: payload.nationalId,
      phone: payload.phone,
      role: payload.role,
      rememberMe: payload.rememberMe,
    };

    const response = NextResponse.json({
      authenticated: true,
      user,
    });

    // Sliding window renewal: If rememberMe is true and token has been active for > 3 days, renew it
    const now = Math.floor(Date.now() / 1000);
    const ageInSeconds = now - payload.iat;
    if (payload.rememberMe && ageInSeconds > 3 * 24 * 60 * 60) {
      const renewed = createSessionToken(user, true);
      const cookieOpts = getCookieOptions(renewed.maxAge);
      response.cookies.set(cookieOpts.name, renewed.token, {
        httpOnly: cookieOpts.httpOnly,
        secure: cookieOpts.secure,
        sameSite: cookieOpts.sameSite,
        path: cookieOpts.path,
        maxAge: cookieOpts.maxAge,
      });
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      { authenticated: false, user: null, error: (error as Error).message },
      { status: 500 }
    );
  }
}
