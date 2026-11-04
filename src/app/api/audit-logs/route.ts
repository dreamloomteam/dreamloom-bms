import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
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

    let userId: number | null = null;
    if (userEmail) {
      const user = await prisma.user.findFirst({
        where: { username: { equals: userEmail, mode: 'insensitive' } },
      });
      if (user) userId = user.id;
    }

    const payload = typeof changes === 'string' ? JSON.parse(changes) : (changes || {});
    if (userName && !payload.user) payload.user = userName;
    if (userEmail && !payload.userEmail) payload.userEmail = userEmail;
    if (member && !payload.member) payload.member = member;
    if (oldValues && !payload.oldValues) payload.oldValues = oldValues;
    if (newValues && !payload.newValues) payload.newValues = newValues;
    if (remarks && !payload.remarks) payload.remarks = remarks;

    const log = await prisma.editLog.create({
      data: {
        userId,
        model: model || 'System',
        action: action || 'Updated',
        recordId: recordId ? Number(recordId) : null,
        changes: JSON.stringify(payload),
      },
      include: { user: true },
    });

    return NextResponse.json({ success: true, data: log }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
