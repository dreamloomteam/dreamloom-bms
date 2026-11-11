import { NextResponse } from 'next/server';
import { prisma, ensureDatabaseSchema } from '@/lib/prisma';
import { isAuthorizedEditor, createAuditLog } from '@/lib/audit';

// GET /api/assets
export async function GET() {
  try {
    await ensureDatabaseSchema();
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "cost" DOUBLE PRECISION DEFAULT 0.0`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "custodian" TEXT DEFAULT 'Dreamloom Trustees'`);
    } catch (e) {
      console.warn('Asset schema ensure caught:', e);
    }
    const assets = await prisma.asset.findMany({
      orderBy: { id: 'asc' },
    });
    return NextResponse.json({ success: true, data: assets });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/assets
export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await request.json();
    const { userEmail, userName, id, name, category, valuation, cost, location, custodian, status } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Requires editor role.' }, { status: 403 });
    }

    const customId = id || `AST-${String(Date.now()).slice(-4)}`;
    const created = await prisma.asset.create({
      data: {
        id: customId,
        name: name?.trim() || 'Untitled Asset',
        category: category || 'Real Estate',
        valuation: Number(valuation) || 0,
        cost: Number(cost) || 0,
        location: location || 'Nairobi',
        custodian: custodian || 'Dreamloom Trustees',
        status: status || 'Active',
      },
    });

    await createAuditLog({
      model: 'Assets',
      action: 'Added',
      recordRef: created.id,
      userEmail,
      userName,
      member: created.custodian || 'Dreamloom Trustees',
      oldValues: {},
      newValues: created,
      remarks: `Registered asset ${created.id} (${created.name}) with valuation KES ${created.valuation.toLocaleString()}`,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/assets
export async function PUT(request: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await request.json();
    const { userEmail, userName, id, name, category, valuation, cost, location, custodian, status } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Requires editor role.' }, { status: 403 });
    }

    if (!id) return NextResponse.json({ success: false, error: 'Missing Asset ID' }, { status: 400 });

    const prev = await prisma.asset.findUnique({ where: { id } });
    if (!prev) return NextResponse.json({ success: false, error: 'Asset not found' }, { status: 404 });

    const updated = await prisma.asset.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(category && { category }),
        ...(valuation !== undefined && { valuation: Number(valuation) }),
        ...(cost !== undefined && { cost: Number(cost) }),
        ...(location && { location }),
        ...(custodian && { custodian }),
        ...(status && { status }),
      },
    });

    await createAuditLog({
      model: 'Assets',
      action: 'Updated',
      recordRef: updated.id,
      userEmail,
      userName,
      member: updated.custodian || 'Dreamloom Trustees',
      oldValues: prev,
      newValues: updated,
      remarks: `Updated asset ${updated.id} (${updated.name})`,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/assets
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

    if (!id) return NextResponse.json({ success: false, error: 'Missing Asset ID' }, { status: 400 });

    const prev = await prisma.asset.findUnique({ where: { id } });
    if (!prev) return NextResponse.json({ success: false, error: 'Asset not found' }, { status: 404 });

    await prisma.asset.delete({ where: { id } });

    await createAuditLog({
      model: 'Assets',
      action: 'Deleted',
      recordRef: id,
      userEmail,
      userName,
      member: prev.custodian || 'Dreamloom Trustees',
      oldValues: prev,
      newValues: { status: 'Deleted' },
      remarks: `Deleted asset record ${id} (${prev.name})`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
