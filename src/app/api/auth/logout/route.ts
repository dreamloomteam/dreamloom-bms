import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => c.trim().split('=').map(decodeURIComponent))
    );
    const token = cookies[SESSION_COOKIE_NAME];
    const payload = verifySessionToken(token);

    let bodyUser: any = null;
    try {
      bodyUser = await request.json();
    } catch (e) {}

    const userEmail = payload?.email || bodyUser?.email;
    const fullName = payload?.fullName || payload?.name || bodyUser?.fullName || bodyUser?.name;
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : '197.232.84.12';

    if (userEmail) {
      let dbUserId: number | null = null;
      try {
        const dbUser = await prisma.user.findFirst({
          where: { username: { equals: userEmail, mode: 'insensitive' } },
        });
        if (dbUser) dbUserId = dbUser.id;

        const sessionRef = `LOGOUT-${Date.now().toString().slice(-6)}`;
        await prisma.loginLog.create({
          data: {
            userId: dbUserId,
            email: userEmail.toLowerCase(),
            fullName: fullName || null,
            action: 'LOGOUT',
            sessionRef,
            success: true,
            ipAddress,
          },
        });
      } catch (logErr) {
        console.warn('Failed to record logout log in database:', logErr);
      }
    }
  } catch (err) {
    console.warn('Logout handler error:', err);
  }

  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}

