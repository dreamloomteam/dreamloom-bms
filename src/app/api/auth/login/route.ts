import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findAuthorizedUser } from '@/lib/authConfig';
import { createSessionToken, getCookieOptions } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = body.email || body.username || body.identifier;
    const { password, rememberMe = true } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: 'Username or email and password are required.' },
        { status: 400 }
      );
    }

    const user = findAuthorizedUser(identifier, password);

    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : '197.232.84.12';

    if (!user) {
      // Log failed attempt to PostgreSQL
      try {
        await prisma.loginLog.create({
          data: {
            email: String(identifier).trim().toLowerCase(),
            success: false,
            ipAddress,
          },
        });
      } catch (logErr) {
        console.warn('Failed to record login failure log:', logErr);
      }

      return NextResponse.json(
        {
          success: false,
          message: 'Invalid credentials. Please verify your authorized member email and permanent PIN.',
        },
        { status: 401 }
      );
    }

    // Successful authentication
    const { token, payload, maxAge } = createSessionToken(user, Boolean(rememberMe));

    // Log successful attempt to PostgreSQL
    try {
      let dbUserId: number | null = null;
      const dbUser = await prisma.user.findFirst({
        where: { username: { equals: user.email, mode: 'insensitive' } },
      });
      if (dbUser) dbUserId = dbUser.id;

      await prisma.loginLog.create({
        data: {
          userId: dbUserId,
          email: user.email.toLowerCase(),
          success: true,
          ipAddress,
        },
      });
    } catch (logErr) {
      console.warn('Failed to record login success log:', logErr);
    }

    const response = NextResponse.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        fullName: user.fullName,
        nationalId: user.nationalId,
        phone: user.phone,
        role: user.role,
        rememberMe: Boolean(rememberMe),
      },
    });

    const cookieOpts = getCookieOptions(maxAge);
    response.cookies.set(cookieOpts.name, token, {
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
      maxAge: cookieOpts.maxAge,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}
