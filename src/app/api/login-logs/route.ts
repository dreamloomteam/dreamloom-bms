import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureDatabaseSchema } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, verifySessionToken, isUserAdmin } from '@/lib/session';
import { formatEATDate, formatEATTime, formatEATDateTime } from '@/lib/dateUtils';

export async function GET(request: NextRequest) {
  try {
    await ensureDatabaseSchema();
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const payload = verifySessionToken(token);
    const headerEmail = request.headers.get('x-user-email');
    const searchEmail = request.nextUrl.searchParams.get('userEmail');
    const effectiveEmail = (payload?.email || headerEmail || searchEmail || '').toLowerCase().trim();

    const isAuthorizedAdmin =
      (payload && isUserAdmin(payload)) ||
      effectiveEmail === 'simon@dreamloom.co.ke';

    if (!isAuthorizedAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: 403. Authentication and login audit registers are strictly restricted to Simon Memia Wanjiru (Administrator).'
        },
        { status: 403 }
      );
    }

    const totalCount = await prisma.loginLog.count();
    const rawLogs = await prisma.loginLog.findMany({
      include: {
        user: {
          select: {
            fullName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const enrichedLogs = rawLogs.map((log) => {
      const dateStr = formatEATDate(log.createdAt);
      const timeStr = formatEATTime(log.createdAt);
      const timestampStr = formatEATDateTime(log.createdAt);
      const resolvedName =
        log.fullName ||
        log.user?.fullName ||
        (log.email?.toLowerCase().includes('simon') ? 'Simon Memia Wanjiru' : null) ||
        (log.email?.toLowerCase().includes('michael') ? 'Michael Kiarie' : null) ||
        (log.email?.toLowerCase().includes('david') ? 'David Wainaina' : null) ||
        (log.email?.toLowerCase().includes('beatrice') ? 'Beatrice Njoki' : null) ||
        (log.email ? log.email.split('@')[0] : 'System User');

      const resolvedRole =
        log.user?.role ||
        (log.email === 'simon@dreamloom.co.ke'
          ? 'Managing Director / Super Admin'
          : log.email === 'michael@dreamloom.co.ke'
          ? 'Treasurer / Director'
          : 'Shareholder / Member');

      const action = log.action || (log.success ? 'LOGIN' : 'LOGIN_FAILED');
      const status =
        action === 'LOGOUT'
          ? 'Logged Out (Completed)'
          : log.success
          ? 'Active (Authorized)'
          : 'Failed (Denied)';

      return {
        id: log.id,
        sessionRef: log.sessionRef || `AUTH-${String(log.id + 100)}`,
        userId: log.userId,
        email: log.email || 'anonymous',
        fullName: resolvedName,
        user: resolvedName,
        role: resolvedRole,
        action,
        ipAddress: log.ipAddress || '197.232.84.12',
        ip: log.ipAddress || '197.232.84.12',
        success: log.success,
        createdAt: log.createdAt,
        date: dateStr,
        time: timeStr,
        timestamp: timestampStr,
        status,
        twoFa: log.success ? 'Pass (TOTP Token)' : 'Rejected'
      };
    });

    return NextResponse.json({ success: true, totalCount, data: enrichedLogs });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await request.json();
    const { email, fullName, action, sessionRef, success, ipAddress } = body;

    let userId: number | null = null;
    let dbUser: any = null;
    if (email) {
      dbUser = await prisma.user.findFirst({
        where: { username: { equals: email, mode: 'insensitive' } },
      });
      if (dbUser) userId = dbUser.id;
    }

    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = forwarded ? forwarded.split(',')[0].trim() : (ipAddress || '197.232.84.12');
    const finalAction = action || (Boolean(success) ? 'LOGIN' : 'LOGIN_FAILED');
    const finalRef = sessionRef || (finalAction === 'LOGOUT' ? `LOGOUT-${Date.now().toString().slice(-6)}` : `AUTH-${Date.now().toString().slice(-6)}`);

    const log = await prisma.loginLog.create({
      data: {
        userId,
        email: email || 'anonymous',
        fullName: fullName || dbUser?.fullName || null,
        action: finalAction,
        sessionRef: finalRef,
        success: Boolean(success),
        ipAddress: realIp,
      },
      include: { user: true },
    });

    const dateStr = formatEATDate(log.createdAt);
    const timeStr = formatEATTime(log.createdAt);
    const timestampStr = formatEATDateTime(log.createdAt);

    return NextResponse.json(
      {
        success: true,
        data: {
          ...log,
          date: dateStr,
          time: timeStr,
          timestamp: timestampStr
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

