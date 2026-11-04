import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

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
    const { userEmail, memberName, dateLevied, penaltyAmount, paidAmount, reason, status, remarks } = body;

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

    await createAuditLog({
      model: 'Fines & Penalties',
      action: 'Added',
      recordId: created.id,
      userEmail,
      member: memberName || created.member?.fullName || 'Daniel Kamau',
      oldValues: {
        'Record Status': 'None (New Penalty Levy)',
      },
      newValues: {
        'Member': memberName || created.member?.fullName || 'Daniel Kamau',
        'Penalty Amount': `KSh ${Number(penaltyAmount || 500).toLocaleString()}`,
        'Reason': reason || 'Late payment + penalty',
        'Status': status || 'Active',
      },
      remarks: remarks || `Levied penalty against ${memberName || 'member'}`,
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
    const { userEmail, id, memberName, dateLevied, penaltyAmount, paidAmount, reason, status, remarks } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const prevPenalty = await prisma.penalty.findUnique({
      where: { id: Number(id) },
      include: { member: true },
    });

    if (!prevPenalty) {
      return NextResponse.json({ success: false, error: 'Penalty record not found' }, { status: 404 });
    }

    const prevMember = prevPenalty.member?.fullName || memberName || 'Daniel Kamau';
    const oldValues = {
      'Member': prevMember,
      'Penalty Amount': `KSh ${Number(prevPenalty.penaltyAmount).toLocaleString()}`,
      'Reason': prevPenalty.reason,
      'Status': prevPenalty.status,
    };

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

    const newMember = updated.member?.fullName || memberName || prevMember;
    const newValues = {
      'Member': newMember,
      'Penalty Amount': `KSh ${Number(updated.penaltyAmount).toLocaleString()}`,
      'Reason': updated.reason,
      'Status': updated.status,
    };

    await createAuditLog({
      model: 'Fines & Penalties',
      action: 'Updated',
      recordId: updated.id,
      userEmail,
      member: newMember,
      oldValues,
      newValues,
      remarks: remarks || `Updated penalty record status to ${updated.status} for ${newMember}.`,
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

    const prevPenalty = await prisma.penalty.findUnique({
      where: { id: Number(id) },
      include: { member: true },
    });

    await prisma.penalty.delete({ where: { id: Number(id) } });

    if (prevPenalty) {
      await createAuditLog({
        model: 'Fines & Penalties',
        action: 'Deleted',
        recordId: prevPenalty.id,
        userEmail,
        member: prevPenalty.member?.fullName || `Penalty #${id}`,
        oldValues: {
          'Member': prevPenalty.member?.fullName || `Penalty #${id}`,
          'Penalty Amount': `KSh ${Number(prevPenalty.penaltyAmount).toLocaleString()}`,
          'Reason': prevPenalty.reason,
          'Status': prevPenalty.status,
        },
        newValues: {
          'Record Status': 'Penalty Record Deleted (No new active record)',
        },
        remarks: 'Incorrectly levied penalty removed after review.',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
