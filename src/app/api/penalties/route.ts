import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function isAuthorizedEditor(email?: string | null) {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return clean === 'simon@dreamloom.co.ke' || clean === 'elijah@dreamloom.co.ke';
}

// GET /api/penalties
export async function GET() {
  try {
    const penalties = await prisma.penalty.findMany({
      include: {
        member: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { dateLevied: 'desc' },
    });
    return NextResponse.json({ success: true, data: penalties });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/penalties
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, memberName, dateLevied, penaltyAmount, paidAmount, reason, status } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    let memberId: number | null = null;
    if (memberName) {
      const member = await prisma.member.findFirst({
        where: { fullName: { contains: memberName.trim(), mode: 'insensitive' } },
      });
      if (member) memberId = member.id;
    }

    if (!memberId) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 400 });
    }

    const date = dateLevied ? new Date(dateLevied) : new Date();
    const created = await prisma.penalty.create({
      data: {
        memberId,
        monthYear: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        dueDate: date,
        dateLevied: date,
        penaltyAmount: Number(penaltyAmount) || 500,
        paidAmount: Number(paidAmount) || 0,
        status: status || 'Active',
        reason: reason || 'Late payment + penalty',
      },
      include: { member: true },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/penalties
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, id, memberName, dateLevied, penaltyAmount, paidAmount, reason, status } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    let memberId: number | undefined = undefined;
    if (memberName) {
      const member = await prisma.member.findFirst({
        where: { fullName: { contains: memberName.trim(), mode: 'insensitive' } },
      });
      if (member) memberId = member.id;
    }

    const updated = await prisma.penalty.update({
      where: { id: Number(id) },
      data: {
        ...(memberId && { memberId }),
        ...(dateLevied && { dateLevied: new Date(dateLevied), dueDate: new Date(dateLevied) }),
        ...(penaltyAmount !== undefined && { penaltyAmount: Number(penaltyAmount) }),
        ...(paidAmount !== undefined && { paidAmount: Number(paidAmount) }),
        ...(reason && { reason }),
        ...(status && { status }),
      },
      include: { member: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/penalties
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userEmail = searchParams.get('userEmail');

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.penalty.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
