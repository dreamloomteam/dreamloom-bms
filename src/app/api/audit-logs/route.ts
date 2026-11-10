import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { SESSION_COOKIE_NAME, verifySessionToken, isUserAdmin } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const payload = verifySessionToken(token);

    if (!payload || !isUserAdmin(payload)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Administrator role required to access Edit Log.' },
        { status: 403 }
      );
    }

    const totalCount = await prisma.editLog.count();
    const logs = await prisma.editLog.findMany({
      include: {
        user: {
          select: {
            fullName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return NextResponse.json({ success: true, totalCount, data: logs });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { model, action, recordId, changes, userEmail, userName, member, oldValues, newValues, remarks } = body;

    const payload = typeof changes === 'string' ? JSON.parse(changes) : (changes || {});
    const effOld = oldValues || payload.oldValues || {};
    const effNew = newValues || payload.newValues || {};
    const effMember = member || payload.member || 'Mary Wanjiru';
    const effRemarks = remarks || payload.remarks || undefined;

    const log = await createAuditLog({
      model: model || payload.module || 'Contributions',
      action: action || payload.action || 'Updated',
      recordId: recordId ? Number(recordId) : null,
      userEmail: userEmail || payload.userEmail,
      userName: userName || payload.user,
      member: effMember,
      oldValues: effOld,
      newValues: effNew,
      remarks: effRemarks,
    });

    return NextResponse.json({ success: true, data: log }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
