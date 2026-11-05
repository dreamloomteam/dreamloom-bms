import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { syncContributionToPenalty } from '@/lib/syncService';

function isAuthorizedEditor(email?: string | null) {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return clean === 'simon@dreamloom.co.ke' || clean === 'elijah@dreamloom.co.ke';
}

// GET /api/contributions - List all contributions
export async function GET() {
  try {
    const contributions = await prisma.contribution.findMany({
      include: {
        member: {
          select: {
            id: true,
            fullName: true,
            email: true,
            nationalId: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });
    return NextResponse.json({ success: true, data: contributions });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/contributions - Create a new contribution
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, customId, memberName, month, amount, unsettled, payout, notes, remarks } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only Simon Memia or Elijah Waitara can add records.' },
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

    const contribution = await prisma.contribution.create({
      data: {
        customId: customId || `CNT-${Date.now()}`,
        monthYear: month || '01-Oct-2026',
        amount: Number(amount) || 0,
        unsettled: Number(unsettled) || 0,
        payout: Number(payout) || 0,
        remarks: notes || (memberName ? `Member: ${memberName}` : null),
        memberId: memberId,
      },
      include: { member: true },
    });

    await createAuditLog({
      model: 'Contributions',
      action: 'Added',
      recordId: contribution.id,
      userEmail,
      member: memberName || contribution.member?.fullName || 'Mary Wanjiru',
      oldValues: {
        'Record Status': 'None (New Contribution Entry)',
      },
      newValues: {
        'Member': memberName || contribution.member?.fullName || 'Mary Wanjiru',
        'Contribution Amount': `KSh ${Number(amount || 0).toLocaleString()}`,
        'Unsettled Dues': `KSh ${Number(unsettled || 0).toLocaleString()}`,
        'Month / Period': month || '01-Oct-2026',
        'Status': Number(amount || 0) > 0 ? 'Paid' : 'Pending',
      },
      remarks: remarks || `Recorded new monthly contribution of KSh ${Number(amount || 0).toLocaleString()} for ${memberName || 'member'}`,
    });

    try {
      await syncContributionToPenalty(contribution.id);
    } catch (syncErr) {
      console.warn('Penalty sync warning on contribution create:', syncErr);
    }

    return NextResponse.json({ success: true, data: contribution }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/contributions - Update an existing contribution
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, id, customId, memberName, month, amount, unsettled, payout, notes, remarks } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only Simon Memia or Elijah Waitara can edit records.' },
        { status: 403 }
      );
    }

    if (!id && !customId) {
      return NextResponse.json({ success: false, error: 'Record ID or customId is required for update.' }, { status: 400 });
    }

    // Capture complete state immediately before update
    const prevContribution = await prisma.contribution.findFirst({
      where: id ? { id: Number(id) } : { customId: String(customId) },
      include: { member: true },
    });

    if (!prevContribution) {
      return NextResponse.json({ success: false, error: 'Contribution record not found' }, { status: 404 });
    }

    const prevMember = prevContribution.member?.fullName || memberName || 'Mary Wanjiru';
    const oldValues = {
      'Member': prevMember,
      'Contribution Amount': `KSh ${Number(prevContribution.amount).toLocaleString()}`,
      'Unsettled Dues': `KSh ${Number(prevContribution.unsettled).toLocaleString()}`,
      'Month / Period': prevContribution.monthYear,
      'Status': Number(prevContribution.amount) > 0 ? 'Paid' : 'Pending',
    };

    let memberId: number | undefined = undefined;
    if (memberName) {
      const member = await prisma.member.findFirst({
        where: { fullName: { contains: memberName.trim(), mode: 'insensitive' } },
      });
      if (member) memberId = member.id;
    }

    const updated = await prisma.contribution.update({
      where: { id: prevContribution.id },
      data: {
        ...(month !== undefined && { monthYear: month }),
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(unsettled !== undefined && { unsettled: Number(unsettled) }),
        ...(payout !== undefined && { payout: Number(payout) }),
        ...(notes !== undefined && { remarks: notes }),
        ...(memberId !== undefined && { memberId }),
      },
      include: { member: true },
    });

    // Capture complete state immediately after update
    const newMember = updated.member?.fullName || memberName || prevMember;
    const newValues = {
      'Member': newMember,
      'Contribution Amount': `KSh ${Number(updated.amount).toLocaleString()}`,
      'Unsettled Dues': `KSh ${Number(updated.unsettled).toLocaleString()}`,
      'Month / Period': updated.monthYear,
      'Status': Number(updated.amount) > 0 ? 'Paid' : 'Pending',
    };

    await createAuditLog({
      model: 'Contributions',
      action: 'Updated',
      recordId: updated.id,
      userEmail,
      member: newMember,
      oldValues,
      newValues,
      remarks: remarks || `Monthly contribution received and updated for ${newMember}.`,
    });

    try {
      await syncContributionToPenalty(updated.id);
    } catch (syncErr) {
      console.warn('Penalty sync warning on contribution update:', syncErr);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/contributions - Delete a contribution
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const customId = searchParams.get('customId');
    const userEmail = searchParams.get('userEmail');

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only Simon Memia or Elijah Waitara can delete records.' },
        { status: 403 }
      );
    }

    if (!id && !customId) {
      return NextResponse.json({ success: false, error: 'ID or customId required' }, { status: 400 });
    }

    const prevContribution = await prisma.contribution.findFirst({
      where: id ? { id: Number(id) } : { customId: String(customId) },
      include: { member: true },
    });

    if (!prevContribution) {
      return NextResponse.json({ success: false, error: 'Contribution record not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.deposit.updateMany({
        where: { contributionId: prevContribution.id },
        data: { contributionId: null },
      });
      await tx.penalty.updateMany({
        where: { contributionId: prevContribution.id },
        data: { contributionId: null },
      });
      await tx.contribution.delete({ where: { id: prevContribution.id } });
    });

    if (prevContribution) {
      await createAuditLog({
        model: 'Contributions',
        action: 'Deleted',
        recordId: prevContribution.id,
        userEmail,
        member: prevContribution.member?.fullName || `Contribution #${customId || id}`,
        oldValues: {
          'Member': prevContribution.member?.fullName || `Contribution #${customId || id}`,
          'Contribution Amount': `KSh ${Number(prevContribution.amount).toLocaleString()}`,
          'Unsettled Dues': `KSh ${Number(prevContribution.unsettled).toLocaleString()}`,
          'Month / Period': prevContribution.monthYear,
        },
        newValues: {
          'Record Status': 'Contribution Record Deleted (No new active record)',
        },
        remarks: `Deleted contribution record #${customId || id} for ${prevContribution.member?.fullName || 'member'}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
