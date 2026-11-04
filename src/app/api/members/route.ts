import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function isAuthorizedEditor(email?: string | null) {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return clean === 'simon@dreamloom.co.ke' || clean === 'elijah@dreamloom.co.ke';
}

// GET /api/members
export async function GET() {
  try {
    const members = await prisma.member.findMany({
      orderBy: { id: 'asc' },
      include: {
        contributions: { select: { amount: true, unsettled: true } },
        loans: { select: { principal: true, paidAmount: true, status: true, totalPayable: true } },
      },
    });
    return NextResponse.json({ success: true, data: members });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/members
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, fullName, nationalId, phone, email, role } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const created = await prisma.member.create({
      data: {
        fullName,
        nationalId: nationalId || String(Date.now()).slice(-8),
        phone: phone || '0700000000',
        email: email || `${fullName.split(' ')[0].toLowerCase()}@dreamloom.co.ke`,
        role: role || 'Member',
      },
    });

    // Record Audit Log
    await prisma.editLog.create({
      data: {
        model: 'Member Directory',
        action: 'Added',
        recordId: created.id,
        changes: JSON.stringify({
          entity: created.fullName,
          field: 'New Member Registered',
          prevValue: 'None',
          newValue: created.fullName,
          user: userEmail,
        }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/members
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, id, fullName, nationalId, phone, email, role } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const prev = await prisma.member.findUnique({ where: { id: Number(id) } });

    const updated = await prisma.member.update({
      where: { id: Number(id) },
      data: {
        ...(fullName && { fullName }),
        ...(nationalId && { nationalId }),
        ...(phone && { phone }),
        ...(email && { email }),
        ...(role && { role }),
      },
    });

    // Record Audit Log
    await prisma.editLog.create({
      data: {
        model: 'Member Directory',
        action: 'Edited',
        recordId: updated.id,
        changes: JSON.stringify({
          entity: updated.fullName,
          field: 'Member Details Updated',
          prevValue: prev ? `${prev.fullName} (${prev.role})` : 'Existing',
          newValue: `${updated.fullName} (${updated.role})`,
          user: userEmail,
        }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/members
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userEmail = searchParams.get('userEmail');

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const prev = await prisma.member.findUnique({ where: { id: Number(id) } });
    await prisma.member.delete({ where: { id: Number(id) } });

    // Record Audit Log
    await prisma.editLog.create({
      data: {
        model: 'Member Directory',
        action: 'Deleted',
        recordId: Number(id),
        changes: JSON.stringify({
          entity: prev?.fullName || `Member #${id}`,
          field: 'Member Removed',
          prevValue: prev?.fullName || 'Active',
          newValue: 'Deleted',
          user: userEmail,
        }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
