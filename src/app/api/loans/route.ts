import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function isAuthorizedEditor(email?: string | null) {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return clean === 'simon@dreamloom.co.ke' || clean === 'elijah@dreamloom.co.ke';
}

// GET /api/loans - List all loans with member info
export async function GET() {
  try {
    const loans = await prisma.loan.findMany({
      include: {
        member: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });
    return NextResponse.json({ success: true, data: loans });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/loans - Create new loan
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, id, memberName, issueDate, principal, interest, totalPayable, paidAmount, status, clearedDate } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only Simon Memia or Elijah Waitara can add/edit loans.' },
        { status: 403 }
      );
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

    const loanId = id || `L${Date.now().toString().slice(-4)}`;
    const p = Number(principal) || 0;
    const i = Number(interest) || (p * 0.1);
    const tot = Number(totalPayable) || (p + i);
    const paid = Number(paidAmount) || 0;
    const currentStatus = status || (paid >= tot ? 'Settled' : 'Active');

    const created = await prisma.loan.create({
      data: {
        id: loanId,
        memberId,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        principal: p,
        interest: i,
        totalPayable: tot,
        paidAmount: paid,
        status: currentStatus,
        clearedDate: clearedDate ? new Date(clearedDate) : null,
      },
      include: { member: true },
    });

    try {
      await prisma.editLog.create({
        data: {
          model: 'Loan',
          action: 'create',
          recordId: 0,
          changes: JSON.stringify({ loanId, memberName, principal: p, status: currentStatus, createdBy: userEmail }),
        },
      });
    } catch (e) {
      console.warn('Edit log skipped:', e);
    }

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/loans - Update loan
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, id, memberName, issueDate, principal, interest, totalPayable, paidAmount, status, clearedDate } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only Simon Memia or Elijah Waitara can update loans.' },
        { status: 403 }
      );
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Loan ID is required' }, { status: 400 });
    }

    let memberId: number | undefined = undefined;
    if (memberName) {
      const member = await prisma.member.findFirst({
        where: { fullName: { contains: memberName.trim(), mode: 'insensitive' } },
      });
      if (member) memberId = member.id;
    }

    const p = principal !== undefined ? Number(principal) : undefined;
    const i = interest !== undefined ? Number(interest) : undefined;
    const tot = totalPayable !== undefined ? Number(totalPayable) : undefined;
    const paid = paidAmount !== undefined ? Number(paidAmount) : undefined;

    const updated = await prisma.loan.update({
      where: { id: String(id) },
      data: {
        ...(memberId && { memberId }),
        ...(issueDate && { issueDate: new Date(issueDate) }),
        ...(p !== undefined && { principal: p }),
        ...(i !== undefined && { interest: i }),
        ...(tot !== undefined && { totalPayable: tot }),
        ...(paid !== undefined && { paidAmount: paid }),
        ...(status && { status }),
        ...(clearedDate !== undefined && { clearedDate: clearedDate ? new Date(clearedDate) : null }),
      },
      include: { member: true },
    });

    try {
      await prisma.editLog.create({
        data: {
          model: 'Loan',
          action: 'update',
          recordId: 0,
          changes: JSON.stringify({ id, memberName, principal: p, paidAmount: paid, status, updatedBy: userEmail }),
        },
      });
    } catch (e) {
      console.warn('Edit log skipped:', e);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/loans - Delete loan
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userEmail = searchParams.get('userEmail');

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only Simon Memia or Elijah Waitara can delete loans.' },
        { status: 403 }
      );
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Loan ID is required' }, { status: 400 });
    }

    await prisma.loan.delete({ where: { id: String(id) } });

    try {
      await prisma.editLog.create({
        data: {
          model: 'Loan',
          action: 'delete',
          recordId: 0,
          changes: JSON.stringify({ id, deletedBy: userEmail }),
        },
      });
    } catch (e) {
      console.warn('Edit log skipped:', e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
