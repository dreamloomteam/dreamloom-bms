import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { normalizePeriod, recordPenaltyPayment, syncAllContributions } from '@/lib/syncService';

function isAuthorizedEditor(email?: string | null) {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return clean === 'simon@dreamloom.co.ke' || clean === 'elijah@dreamloom.co.ke';
}

// GET /api/penalties - List all penalties with full component breakdown
export async function GET() {
  try {
    const penalties = await prisma.penalty.findMany({
      include: {
        member: {
          select: {
            id: true,
            fullName: true,
            email: true,
            nationalId: true,
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
      orderBy: { dateLevied: 'desc' },
    });

    const enriched = penalties.map((p) => {
      const unsettledContrib = Number(p.unsettledContribution) || 0;
      const penaltyAmt = Number(p.penaltyAmount) || 0;
      const totalOutstanding = unsettledContrib + penaltyAmt;
      const paidContrib = Number(p.paidContribution) || 0;
      const paidFn = Number(p.paidFine) || 0;
      const paidTotal = Number(p.paidAmount) || (paidContrib + paidFn);
      const remainingContrib = Math.max(0, unsettledContrib - paidContrib);
      const remainingFn = Math.max(0, penaltyAmt - paidFn);
      const remainingBal = remainingContrib + remainingFn;

      let calculatedStatus = p.status;
      if (remainingBal === 0 && (paidTotal > 0 || totalOutstanding === 0)) {
        calculatedStatus = 'PAID';
      } else if (paidTotal > 0) {
        calculatedStatus = 'PARTIALLY PAID';
      } else {
        calculatedStatus = 'UNPAID';
      }

      return {
        ...p,
        totalOutstanding,
        paidContribution: paidContrib,
        paidFine: paidFn,
        paidAmount: paidTotal,
        remainingContribution: remainingContrib,
        remainingFine: remainingFn,
        remainingBalance: remainingBal,
        status: calculatedStatus,
      };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/penalties - Create penalty, record payment, or sync
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, userEmail } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Only Simon Memia or Elijah Waitara can perform this action.' }, { status: 403 });
    }

    // 1. Payment Action
    if (action === 'payment') {
      const { penaltyId, amount, paymentMethod, reference, notes } = body;
      if (!penaltyId || !amount) {
        return NextResponse.json({ success: false, error: 'penaltyId and amount are required for payment' }, { status: 400 });
      }

      const paymentResult = await recordPenaltyPayment({
        penaltyId: Number(penaltyId),
        amount: Number(amount),
        paymentMethod,
        reference,
        notes,
        userEmail,
      });

      return NextResponse.json({ success: true, data: paymentResult });
    }

    // 2. Full Sync Action
    if (action === 'sync') {
      const synced = await syncAllContributions();
      return NextResponse.json({ success: true, message: `Synchronized ${synced.length} records.`, data: synced });
    }

    // 3. Create or Update Penalty Record
    const { memberName, dateLevied, penaltyAmount, unsettledContribution, reason, remarks, monthYear } = body;

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
    const period = normalizePeriod(monthYear || dateLevied || date);
    const duesType = 'Contribution & Fine';
    const fineAmt = Number(penaltyAmount !== undefined ? penaltyAmount : 500);
    const unsettledContrib = Number(unsettledContribution || 0);

    // Look for existing contribution for this member and period to mirror
    let linkedContributionId: number | null = null;
    let actualUnsettled = unsettledContrib;

    const existingContrib = await prisma.contribution.findFirst({
      where: {
        memberId,
        monthYear: { contains: period.monthShort, mode: 'insensitive' },
      },
    });

    if (existingContrib) {
      linkedContributionId = existingContrib.id;
      if (unsettledContrib === 0 && existingContrib.unsettled > 0) {
        actualUnsettled = existingContrib.unsettled;
      }
    }

    const totalOutstanding = actualUnsettled + fineAmt;

    // Upsert to enforce uniqueness: One member cannot have two penalties for the same month
    const penalty = await prisma.penalty.upsert({
      where: {
        memberId_monthYear_duesType: {
          memberId,
          monthYear: period.periodKey,
          duesType,
        },
      },
      update: {
        penaltyAmount: fineAmt,
        unsettledContribution: actualUnsettled,
        remainingBalance: totalOutstanding,
        reason: reason || 'Late payment + penalty',
        ...(linkedContributionId && { contributionId: linkedContributionId }),
      },
      create: {
        memberId,
        monthYear: period.periodKey,
        dueDate: date,
        dateLevied: date,
        penaltyAmount: fineAmt,
        unsettledContribution: actualUnsettled,
        paidAmount: 0,
        paidContribution: 0,
        paidFine: 0,
        remainingBalance: totalOutstanding,
        status: 'UNPAID',
        reason: reason || 'Late payment + penalty',
        duesType,
        contributionId: linkedContributionId,
      },
      include: { member: true, payments: true },
    });

    await createAuditLog({
      model: 'Fines & Penalties',
      action: 'Added',
      recordId: penalty.id,
      userEmail,
      member: memberName || penalty.member?.fullName || 'Member',
      oldValues: {
        'Record Status': 'None (New Penalty Levy)',
      },
      newValues: {
        'Member': memberName || penalty.member?.fullName || 'Member',
        'Period': period.periodKey,
        'Unsettled Contribution': `KSh ${actualUnsettled.toLocaleString()}`,
        'Penalty Amount': `KSh ${fineAmt.toLocaleString()}`,
        'Total Outstanding': `KSh ${totalOutstanding.toLocaleString()}`,
        'Status': penalty.status,
      },
      remarks: remarks || `Levied penalty against ${memberName || 'member'} for ${period.periodKey}`,
    });

    return NextResponse.json({ success: true, data: penalty }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/penalties - Update an existing penalty record
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, id, memberName, dateLevied, penaltyAmount, unsettledContribution, reason, status, remarks } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Only authorized directors can update penalties.' }, { status: 403 });
    }

    const numId = typeof id === 'number' ? id : parseInt(String(id).replace(/\D/g, ''), 10);
    if (!numId || isNaN(numId)) {
      return NextResponse.json({ success: false, error: 'Valid Penalty ID is required' }, { status: 400 });
    }

    const prevPenalty = await prisma.penalty.findUnique({
      where: { id: numId },
      include: { member: true, payments: true },
    });

    if (!prevPenalty) {
      return NextResponse.json({ success: false, error: 'Penalty record not found' }, { status: 404 });
    }

    const prevMember = prevPenalty.member?.fullName || memberName || 'Member';
    const oldValues = {
      'Member': prevMember,
      'Penalty Amount': `KSh ${Number(prevPenalty.penaltyAmount).toLocaleString()}`,
      'Unsettled Contribution': `KSh ${Number(prevPenalty.unsettledContribution).toLocaleString()}`,
      'Remaining Balance': `KSh ${Number(prevPenalty.remainingBalance).toLocaleString()}`,
      'Status': prevPenalty.status,
    };

    let memberId: number | undefined = undefined;
    if (memberName) {
      const member = await prisma.member.findFirst({
        where: { fullName: { contains: memberName.trim(), mode: 'insensitive' } },
      });
      if (member) memberId = member.id;
    }

    const newUnsettled = unsettledContribution !== undefined ? Number(unsettledContribution) : prevPenalty.unsettledContribution;
    const newFineAmt = penaltyAmount !== undefined ? Number(penaltyAmount) : prevPenalty.penaltyAmount;
    const remContrib = Math.max(0, newUnsettled - prevPenalty.paidContribution);
    const remFine = Math.max(0, newFineAmt - prevPenalty.paidFine);
    const remTotal = remContrib + remFine;

    let newStatus = status || prevPenalty.status;
    if (!status) {
      if (remTotal === 0 && (prevPenalty.paidAmount > 0 || newUnsettled === 0)) {
        newStatus = 'PAID';
      } else if (prevPenalty.paidAmount > 0) {
        newStatus = 'PARTIALLY PAID';
      } else {
        newStatus = 'UNPAID';
      }
    }

    const updated = await prisma.penalty.update({
      where: { id: numId },
      data: {
        ...(memberId && { memberId }),
        ...(dateLevied && { dateLevied: new Date(dateLevied), dueDate: new Date(dateLevied) }),
        ...(penaltyAmount !== undefined && { penaltyAmount: newFineAmt }),
        ...(unsettledContribution !== undefined && { unsettledContribution: newUnsettled }),
        remainingBalance: remTotal,
        ...(reason && { reason }),
        status: newStatus,
      },
      include: { member: true, payments: true },
    });

    const newMember = updated.member?.fullName || memberName || prevMember;
    const newValues = {
      'Member': newMember,
      'Penalty Amount': `KSh ${Number(updated.penaltyAmount).toLocaleString()}`,
      'Unsettled Contribution': `KSh ${Number(updated.unsettledContribution).toLocaleString()}`,
      'Remaining Balance': `KSh ${Number(updated.remainingBalance).toLocaleString()}`,
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

// DELETE /api/penalties - Delete a penalty
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawId = searchParams.get('id');
    const userEmail = searchParams.get('userEmail');

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Only authorized directors can delete penalties.' }, { status: 403 });
    }

    const numId = rawId ? (isNaN(Number(rawId)) ? parseInt(rawId.replace(/\D/g, ''), 10) : Number(rawId)) : null;
    if (!numId || isNaN(numId)) {
      return NextResponse.json({ success: false, error: 'Valid Penalty ID is required' }, { status: 400 });
    }

    const prevPenalty = await prisma.penalty.findUnique({
      where: { id: numId },
      include: { member: true },
    });

    if (!prevPenalty) {
      return NextResponse.json({ success: false, error: 'Penalty record not found' }, { status: 404 });
    }

    await prisma.penalty.delete({ where: { id: numId } });

    await createAuditLog({
      model: 'Fines & Penalties',
      action: 'Deleted',
      recordId: prevPenalty.id,
      userEmail,
      member: prevPenalty.member?.fullName || `Penalty #${numId}`,
      oldValues: {
        'Member': prevPenalty.member?.fullName || `Penalty #${numId}`,
        'Penalty Amount': `KSh ${Number(prevPenalty.penaltyAmount).toLocaleString()}`,
        'Reason': prevPenalty.reason,
        'Status': prevPenalty.status,
      },
      newValues: {
        'Record Status': 'Penalty Record Deleted (No new active record)',
      },
      remarks: 'Penalty removed after administrative review.',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
