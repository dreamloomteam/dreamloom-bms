import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, verifySessionToken, isUserAdmin } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const payload = verifySessionToken(token);

    if (!payload || !isUserAdmin(payload)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Administrator role required to access Login Log.' },
        { status: 403 }
      );
    }

    const totalCount = await prisma.loginLog.count();
    const logs = await prisma.loginLog.findMany({
      include: {
        user: {
          select: {
            fullName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json({ success: true, totalCount, data: logs });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, success, ipAddress, userAgent } = body;

    let userId: number | null = null;
    if (email) {
      const user = await prisma.user.findFirst({
        where: { username: { equals: email, mode: 'insensitive' } },
      });
      if (user) userId = user.id;
    }

    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = forwarded ? forwarded.split(',')[0].trim() : (ipAddress || '197.232.84.12');

    const log = await prisma.loginLog.create({
      data: {
        userId,
        email: email || 'anonymous',
        success: Boolean(success),
        ipAddress: realIp,
      },
      include: { user: true },
    });

    return NextResponse.json({ success: true, data: log }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
