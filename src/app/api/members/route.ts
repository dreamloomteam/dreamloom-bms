import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

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
    const { userEmail, fullName, nationalId, phone, email, role, remarks } = body;

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

    await createAuditLog({
      model: 'Members',
      action: 'Added',
      recordId: created.id,
      userEmail,
      member: created.fullName,
      oldValues: {
        'Record Status': 'None (New Member Entry)',
      },
      newValues: {
        'Member Name': created.fullName,
        'Corporate Role': created.role,
        'National ID': created.nationalId,
        'Phone Number': created.phone,
        'Email Address': created.email,
        'Status': 'Active',
      },
      remarks: remarks || `New authorized member registration completed for ${created.fullName}.`,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/members
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, id, fullName, nationalId, phone, email, role, remarks } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const prev = await prisma.member.findUnique({ where: { id: Number(id) } });
    if (!prev) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }

    const oldValues = {
      'Member Name': prev.fullName,
      'Corporate Role': prev.role,
      'National ID': prev.nationalId,
      'Phone Number': prev.phone,
      'Email Address': prev.email,
      'Status': 'Active',
    };

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

    const newValues = {
      'Member Name': updated.fullName,
      'Corporate Role': updated.role,
      'National ID': updated.nationalId,
      'Phone Number': updated.phone,
      'Email Address': updated.email,
      'Status': 'Active',
    };

    await createAuditLog({
      model: 'Members',
      action: 'Updated',
      recordId: updated.id,
      userEmail,
      member: updated.fullName,
      oldValues,
      newValues,
      remarks: remarks || `Updated profile and credentials for member ${updated.fullName}.`,
    });

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

    if (prev) {
      await createAuditLog({
        model: 'Members',
        action: 'Deleted',
        recordId: Number(id),
        userEmail,
        member: prev.fullName,
        oldValues: {
          'Member Name': prev.fullName,
          'Corporate Role': prev.role,
          'National ID': prev.nationalId,
          'Phone Number': prev.phone,
          'Status': 'Active',
        },
        newValues: {
          'Record Status': 'Member Record Deleted (No new active record)',
        },
        remarks: `Member registration terminated for ${prev.fullName}.`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
