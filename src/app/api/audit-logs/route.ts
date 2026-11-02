import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
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
      take: 100,
    });
    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { model, action, recordId, changes } = body;

    const log = await prisma.editLog.create({
      data: {
        model: model || 'System',
        action: action || 'update',
        recordId: recordId ? Number(recordId) : null,
        changes: typeof changes === 'string' ? changes : JSON.stringify(changes || {}),
      },
    });

    return NextResponse.json({ success: true, data: log }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
