import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to check editor permissions: Simon Memia or Elijah Waitara
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
    const { userEmail, customId, memberName, month, amount, unsettled, payout, notes } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only Simon Memia or Elijah Waitara can add records.' },
        { status: 403 }
      );
    }

    // Lookup member if provided
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
    });

    // Record audit edit log
    try {
      await prisma.editLog.create({
        data: {
          model: 'Contribution',
          action: 'create',
          recordId: contribution.id,
          changes: JSON.stringify({ customId, memberName, month, amount, unsettled, payout, notes, createdBy: userEmail }),
        },
      });
    } catch (logErr) {
      console.warn('Edit log creation skipped:', logErr);
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
    const { userEmail, id, customId, memberName, month, amount, unsettled, payout, notes } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only Simon Memia or Elijah Waitara can edit records.' },
        { status: 403 }
      );
    }

    if (!id && !customId) {
      return NextResponse.json({ success: false, error: 'Record ID or customId is required for update.' }, { status: 400 });
    }

    // Lookup member if provided
    let memberId: number | undefined = undefined;
    if (memberName) {
      const member = await prisma.member.findFirst({
        where: { fullName: { contains: memberName.trim(), mode: 'insensitive' } },
      });
      if (member) memberId = member.id;
    }

    const updated = await prisma.contribution.upsert({
      where: id ? { id: Number(id) } : { customId: String(customId) },
      update: {
        ...(month !== undefined && { monthYear: month }),
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(unsettled !== undefined && { unsettled: Number(unsettled) }),
        ...(payout !== undefined && { payout: Number(payout) }),
        ...(notes !== undefined && { remarks: notes }),
        ...(memberId !== undefined && { memberId }),
      },
      create: {
        customId: customId || (id ? `CNT-${id}` : `CNT-${Date.now()}`),
        monthYear: month || '01-Oct-2026',
        amount: Number(amount) || 0,
        unsettled: Number(unsettled) || 0,
        payout: Number(payout) || 0,
        remarks: notes || (memberName ? `Member: ${memberName}` : null),
        memberId: memberId || null,
      },
    });

    // Record audit edit log
    try {
      await prisma.editLog.create({
        data: {
          model: 'Contribution',
          action: 'update',
          recordId: updated.id,
          changes: JSON.stringify({ id, customId, memberName, month, amount, unsettled, payout, notes, updatedBy: userEmail }),
        },
      });
    } catch (logErr) {
      console.warn('Edit log update skipped:', logErr);
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

    if (id) {
      await prisma.contribution.delete({ where: { id: Number(id) } });
    } else if (customId) {
      await prisma.contribution.delete({ where: { customId } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
