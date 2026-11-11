import { NextResponse } from 'next/server';
import { prisma, ensureDatabaseSchema } from '@/lib/prisma';
import { isAuthorizedEditor, createAuditLog } from '@/lib/audit';

// GET /api/investments
export async function GET() {
  try {
    await ensureDatabaseSchema();
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
    await ensureDatabaseSchema();
    const body = await request.json();
    const { userEmail, userName, id, asset, type, capital, expectedReturn, status } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Requires editor role.' }, { status: 403 });
    }

    const customId = id || `INV-${String(Date.now()).slice(-4)}`;
    const created = await prisma.investment.create({
      data: {
        id: customId,
        asset: asset?.trim() || 'Strategic Investment',
        type: type || 'Strategic Capital',
        capital: Number(capital) || 0,
        expectedReturn: expectedReturn || '12%',
        status: status || 'Active',
      },
    });

    await createAuditLog({
      model: 'Investments',
      action: 'Added',
      recordRef: created.id,
      userEmail,
      userName,
      member: created.asset,
      oldValues: {},
      newValues: created,
      remarks: `Added investment ${created.id} (${created.asset}) with capital KES ${created.capital.toLocaleString()}`,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/investments
export async function PUT(request: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await request.json();
    const { userEmail, userName, id, asset, type, capital, expectedReturn, status } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Requires editor role.' }, { status: 403 });
    }

    if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

    const prev = await prisma.investment.findUnique({ where: { id } });
    if (!prev) return NextResponse.json({ success: false, error: 'Investment not found' }, { status: 404 });

    const updated = await prisma.investment.update({
      where: { id },
      data: {
        ...(asset && { asset: asset.trim() }),
        ...(type && { type }),
        ...(capital !== undefined && { capital: Number(capital) }),
        ...(expectedReturn && { expectedReturn }),
        ...(status && { status }),
      },
    });

    await createAuditLog({
      model: 'Investments',
      action: 'Updated',
      recordRef: updated.id,
      userEmail,
      userName,
      member: updated.asset,
      oldValues: prev,
      newValues: updated,
      remarks: `Updated investment ${updated.id} (${updated.asset})`,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/investments
export async function DELETE(request: Request) {
  try {
    await ensureDatabaseSchema();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userEmail = searchParams.get('userEmail');
    const userName = searchParams.get('userName');

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Requires editor role.' }, { status: 403 });
    }

    if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

    const prev = await prisma.investment.findUnique({ where: { id } });
    if (!prev) return NextResponse.json({ success: false, error: 'Investment not found' }, { status: 404 });

    await prisma.investment.delete({ where: { id } });

    await createAuditLog({
      model: 'Investments',
      action: 'Deleted',
      recordRef: id,
      userEmail,
      userName,
      member: prev.asset,
      oldValues: prev,
      newValues: { status: 'Deleted' },
      remarks: `Deleted investment ${id} (${prev.asset})`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
