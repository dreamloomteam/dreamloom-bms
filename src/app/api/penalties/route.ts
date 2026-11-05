import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { normalizePeriod, syncAllContributions, isContributionDeadlinePassed } from '@/lib/syncService';
import { getEATISODate } from '@/lib/dateUtils';

function isAuthorizedEditor(email?: string | null) {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return clean === 'simon@dreamloom.co.ke' || clean === 'elijah@dreamloom.co.ke';
}

// GET /api/penalties - List all KSh 500 late-payment penalties
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
      },
      orderBy: { dateLevied: 'desc' },
    });

    const enriched = penalties.map((p) => {
      const fineAmount = 500;
      const isPaid = p.status?.toUpperCase() === 'PAID' || (Number(p.paidAmount) >= 500 && p.status?.toUpperCase() !== 'UNPAID' && p.status?.toUpperCase() !== 'ACTIVE');
      const normalizedStatus = isPaid ? 'Paid' : 'Unpaid';
      const period = normalizePeriod(p.monthYear);

      return {
        id: p.id,
        dbId: p.id,
        member: p.member?.fullName || 'Member',
        memberId: p.memberId,
        monthYear: period.periodKey,
        month: period.monthName,
        year: period.year,
        date: p.dateLevied ? String(p.dateLevied).slice(0, 10) : getEATISODate(),
        amount: fineAmount,
        fineAmount,
        penaltyAmount: fineAmount,
        status: normalizedStatus,
        datePaid: isPaid ? (p.datePaid || String(p.dateLevied).slice(0, 10)) : '-',
        reason: p.reason || 'Late Contribution Penalty',
      };
    });

    // Compute automatic penalty summary metrics
    const totalCount = enriched.length;
    const paidCount = enriched.filter(p => p.status === 'Paid').length;
    const unpaidCount = enriched.filter(p => p.status === 'Unpaid').length;
    const totalFinesRecorded = totalCount * 500;
    const totalFinesCollected = paidCount * 500;
    const outstandingFines = unpaidCount * 500;

    return NextResponse.json({
      success: true,
      data: enriched,
      metrics: {
        totalFinesRecorded,
        totalFinesCollected,
        outstandingFines,
        unpaidCount,
        paidCount,
        totalCount,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/penalties - Create penalty, toggle status, or auto-generate
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, userEmail } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only Simon Memia or Elijah Waitara can manage penalty records.' },
        { status: 403 }
      );
    }

    // 1. Full Synchronization / Automatic Monthly Penalty Generation
    if (action === 'sync') {
      const generated = await syncAllContributions();
      return NextResponse.json({
        success: true,
        message: `Successfully generated ${generated.length} new late payment penalties from contributions.`,
        data: generated,
      });
    }

    // 2. Status Toggle Action (Unpaid <-> Paid)
    if (action === 'toggle') {
      const { id, status } = body;
      const numId = typeof id === 'number' ? id : parseInt(String(id).replace(/\D/g, ''), 10);
      if (!numId || isNaN(numId)) {
        return NextResponse.json({ success: false, error: 'Valid penalty ID is required.' }, { status: 400 });
      }

      const prev = await prisma.penalty.findUnique({
        where: { id: numId },
        include: { member: true },
      });

      if (!prev) {
        return NextResponse.json({ success: false, error: 'Penalty record not found.' }, { status: 404 });
      }

      const nextStatus = status ? (status.toUpperCase() === 'PAID' ? 'PAID' : 'UNPAID') : (prev.status?.toUpperCase() === 'PAID' ? 'UNPAID' : 'PAID');
      const isPaid = nextStatus === 'PAID';
      const todayISO = getEATISODate();

      const updated = await prisma.penalty.update({
        where: { id: numId },
        data: {
          status: nextStatus,
          penaltyAmount: 500.0,
          paidAmount: isPaid ? 500.0 : 0.0,
          paidFine: isPaid ? 500.0 : 0.0,
          remainingBalance: isPaid ? 0.0 : 500.0,
          datePaid: isPaid ? todayISO : null,
        },
        include: { member: true },
      });

      await createAuditLog({
        model: 'Fines & Penalties',
        action: 'Updated',
        recordId: updated.id,
        userEmail,
        member: updated.member?.fullName || 'Member',
        oldValues: {
          'Fine Amount': 'KSh 500',
          'Period': updated.monthYear,
          'Payment Status': prev.status?.toUpperCase() === 'PAID' ? 'Paid' : 'Unpaid',
        },
        newValues: {
          'Fine Amount': 'KSh 500',
          'Period': updated.monthYear,
          'Payment Status': isPaid ? 'Paid' : 'Unpaid',
          'Date Paid': isPaid ? todayISO : '-',
        },
        remarks: `Marked late payment fine as ${isPaid ? 'Paid' : 'Unpaid'} for ${updated.member?.fullName} (${updated.monthYear})`,
      });

      return NextResponse.json({ success: true, data: updated });
    }

    // 3. Manual Penalty Entry
    const { memberName, monthYear, status } = body;

    if (!memberName) {
      return NextResponse.json({ success: false, error: 'Member Name is required.' }, { status: 400 });
    }

    const member = await prisma.member.findFirst({
      where: { fullName: { contains: memberName.trim(), mode: 'insensitive' } },
    });

    if (!member) {
      return NextResponse.json({ success: false, error: `Member "${memberName}" not found in system.` }, { status: 404 });
    }

    const period = normalizePeriod(monthYear || new Date());
    const duesType = 'Contribution & Fine';

    // Prevent duplicate penalties for the same member and month
    const existing = await prisma.penalty.findUnique({
      where: {
        memberId_monthYear_duesType: {
          memberId: member.id,
          monthYear: period.periodKey,
          duesType,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `Duplicate Blocked: A late-payment penalty already exists for ${member.fullName} in ${period.periodKey}. Only ONE penalty is allowed per member per contribution month.`,
        },
        { status: 400 }
      );
    }

    const isPaid = (status || '').toLowerCase() === 'paid';
    const todayISO = getEATISODate();

    const created = await prisma.penalty.create({
      data: {
        memberId: member.id,
        monthYear: period.periodKey,
        dueDate: new Date(),
        dateLevied: new Date(),
        penaltyAmount: 500.0,
        unsettledContribution: 0.0,
        paidAmount: isPaid ? 500.0 : 0.0,
        paidFine: isPaid ? 500.0 : 0.0,
        paidContribution: 0.0,
        remainingBalance: isPaid ? 0.0 : 500.0,
        status: isPaid ? 'PAID' : 'UNPAID',
        reason: 'Late Contribution Penalty',
        duesType,
        datePaid: isPaid ? todayISO : null,
      },
      include: { member: true },
    });

    await createAuditLog({
      model: 'Fines & Penalties',
      action: 'Added',
      recordId: created.id,
      userEmail,
      member: member.fullName,
      oldValues: {
        'Record Status': 'None (New Late Penalty)',
      },
      newValues: {
        'Member Name': member.fullName,
        'Contribution Month': period.periodKey,
        'Fine Amount': 'KSh 500',
        'Payment Status': isPaid ? 'Paid' : 'Unpaid',
      },
      remarks: `Recorded KSh 500 late-payment fine for ${member.fullName} (${period.periodKey}).`,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/penalties - Update a penalty record
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, id, memberName, monthYear, status } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only Simon Memia or Elijah Waitara can update penalties.' },
        { status: 403 }
      );
    }

    const numId = typeof id === 'number' ? id : parseInt(String(id).replace(/\D/g, ''), 10);
    if (!numId || isNaN(numId)) {
      return NextResponse.json({ success: false, error: 'Valid penalty ID is required.' }, { status: 400 });
    }

    const prev = await prisma.penalty.findUnique({
      where: { id: numId },
      include: { member: true },
    });

    if (!prev) {
      return NextResponse.json({ success: false, error: 'Penalty record not found.' }, { status: 404 });
    }

    let targetMemberId = prev.memberId;
    let targetMemberName = prev.member.fullName;
    if (memberName && memberName.trim() !== prev.member.fullName) {
      const foundMem = await prisma.member.findFirst({
        where: { fullName: { contains: memberName.trim(), mode: 'insensitive' } },
      });
      if (foundMem) {
        targetMemberId = foundMem.id;
        targetMemberName = foundMem.fullName;
      }
    }

    const period = monthYear ? normalizePeriod(monthYear) : normalizePeriod(prev.monthYear);
    const duesType = 'Contribution & Fine';

    // Duplicate check if member or month changed
    if (targetMemberId !== prev.memberId || period.periodKey !== prev.monthYear) {
      const duplicate = await prisma.penalty.findFirst({
        where: {
          id: { not: numId },
          memberId: targetMemberId,
          monthYear: period.periodKey,
          duesType,
        },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            error: `Duplicate Blocked: A late-payment penalty already exists for ${targetMemberName} in ${period.periodKey}.`,
          },
          { status: 400 }
        );
      }
    }

    const isPaid = (status || '').toLowerCase() === 'paid' || (status || '').toUpperCase() === 'PAID';
    const todayISO = getEATISODate();

    const updated = await prisma.penalty.update({
      where: { id: numId },
      data: {
        memberId: targetMemberId,
        monthYear: period.periodKey,
        penaltyAmount: 500.0,
        paidAmount: isPaid ? 500.0 : 0.0,
        paidFine: isPaid ? 500.0 : 0.0,
        remainingBalance: isPaid ? 0.0 : 500.0,
        status: isPaid ? 'PAID' : 'UNPAID',
        datePaid: isPaid ? (prev.datePaid || todayISO) : null,
      },
      include: { member: true },
    });

    await createAuditLog({
      model: 'Fines & Penalties',
      action: 'Updated',
      recordId: updated.id,
      userEmail,
      member: targetMemberName,
      oldValues: {
        'Member Name': prev.member.fullName,
        'Contribution Month': prev.monthYear,
        'Fine (KES)': '500',
        'Payment Status': prev.status?.toUpperCase() === 'PAID' ? 'Paid' : 'Unpaid',
      },
      newValues: {
        'Member Name': targetMemberName,
        'Contribution Month': period.periodKey,
        'Fine (KES)': '500',
        'Payment Status': isPaid ? 'Paid' : 'Unpaid',
        'Date Paid': isPaid ? (prev.datePaid || todayISO) : '-',
      },
      remarks: `Updated late penalty record for ${targetMemberName} (${period.periodKey}) to ${isPaid ? 'Paid' : 'Unpaid'}.`,
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
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only Simon Memia or Elijah Waitara can delete penalties.' },
        { status: 403 }
      );
    }

    const numId = rawId ? (isNaN(Number(rawId)) ? parseInt(rawId.replace(/\D/g, ''), 10) : Number(rawId)) : null;
    if (!numId || isNaN(numId)) {
      return NextResponse.json({ success: false, error: 'Valid penalty ID is required.' }, { status: 400 });
    }

    const prev = await prisma.penalty.findUnique({
      where: { id: numId },
      include: { member: true },
    });

    if (!prev) {
      return NextResponse.json({ success: false, error: 'Penalty record not found.' }, { status: 404 });
    }

    await prisma.penalty.delete({ where: { id: numId } });

    await createAuditLog({
      model: 'Fines & Penalties',
      action: 'Deleted',
      recordId: numId,
      userEmail,
      member: prev.member?.fullName || `Penalty #${numId}`,
      oldValues: {
        'Member Name': prev.member?.fullName || `Penalty #${numId}`,
        'Contribution Month': prev.monthYear,
        'Fine (KES)': '500',
        'Payment Status': prev.status?.toUpperCase() === 'PAID' ? 'Paid' : 'Unpaid',
      },
      newValues: {
        'Record Status': 'Penalty Record Deleted',
      },
      remarks: `Deleted KSh 500 penalty for ${prev.member?.fullName} (${prev.monthYear}).`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
