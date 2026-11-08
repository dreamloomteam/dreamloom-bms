import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorizedEditor } from '@/lib/audit';

// GET /api/investments
export async function GET() {
  try {
    const investments = await prisma.investment.findMany({
      orderBy: { id: 'asc' },
    });
    return NextResponse.json({ success: true, data: investments });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/investments
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, id, asset, type, capital, expectedReturn, status } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const customId = id || `INV-${String(Date.now()).slice(-4)}`;
    const created = await prisma.investment.create({
      data: {
        id: customId,
        asset,
        type: type || 'Strategic Capital',
        capital: Number(capital) || 0,
        expectedReturn: expectedReturn || '12%',
        status: status || 'Active',
      },
    });

    await prisma.editLog.create({
      data: {
        model: 'Investments',
        action: 'Added',
        changes: JSON.stringify({
          entity: created.asset,
          field: 'Capital Investment Added',
          prevValue: 'KES 0.00',
          newValue: `KES ${created.capital.toLocaleString()}`,
          user: userEmail,
        }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/investments
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, id, asset, type, capital, expectedReturn, status } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const prev = await prisma.investment.findUnique({ where: { id } });

    const updated = await prisma.investment.update({
      where: { id },
      data: {
        ...(asset && { asset }),
        ...(type && { type }),
        ...(capital !== undefined && { capital: Number(capital) }),
        ...(expectedReturn && { expectedReturn }),
        ...(status && { status }),
      },
    });

    await prisma.editLog.create({
      data: {
        model: 'Investments',
        action: 'Edited',
        changes: JSON.stringify({
          entity: updated.asset,
          field: 'Capital Investment Updated',
          prevValue: prev ? `KES ${prev.capital.toLocaleString()} (${prev.status})` : 'Existing',
          newValue: `KES ${updated.capital.toLocaleString()} (${updated.status})`,
          user: userEmail,
        }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/investments
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userEmail = searchParams.get('userEmail');

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

    const prev = await prisma.investment.findUnique({ where: { id } });
    await prisma.investment.delete({ where: { id } });

    await prisma.editLog.create({
      data: {
        model: 'Investments',
        action: 'Deleted',
        changes: JSON.stringify({
          entity: prev?.asset || id,
          field: 'Investment Entry Removed',
          prevValue: prev ? `KES ${prev.capital.toLocaleString()}` : 'Active',
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
