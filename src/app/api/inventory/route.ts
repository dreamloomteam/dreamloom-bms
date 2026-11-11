import { NextResponse } from 'next/server';
import { prisma, ensureDatabaseSchema } from '@/lib/prisma';
import { isAuthorizedEditor, createAuditLog } from '@/lib/audit';

// GET /api/inventory
export async function GET() {
  try {
    await ensureDatabaseSchema();
    const items = await prisma.inventory.findMany({
      orderBy: { sku: 'asc' },
    });
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/inventory
export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await request.json();
    const { userEmail, userName, id, sku, name, category, location, quantity, reorderLevel, unitValue, status } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Requires editor role.' }, { status: 403 });
    }

    const customId = id || `INV-${String(Date.now()).slice(-4)}`;
    const customSku = sku?.trim() || `SKU-${String(Date.now()).slice(-4)}`;
    const qty = Number(quantity) || 0;
    const uVal = Number(unitValue) || 0;
    const totalVal = qty * uVal;

    const created = await prisma.inventory.create({
      data: {
        id: customId,
        sku: customSku,
        name: name?.trim() || 'Untitled Inventory Item',
        category: category || 'General Supplies',
        location: location || 'Executive Safe',
        quantity: qty,
        reorderLevel: Number(reorderLevel) || 0,
        unitValue: uVal,
        totalValue: totalVal,
        status: status || 'In Stock',
      },
    });

    await createAuditLog({
      model: 'Inventory',
      action: 'Added',
      recordRef: created.sku,
      userEmail,
      userName,
      member: created.name,
      oldValues: {},
      newValues: created,
      remarks: `Added inventory item ${created.sku} (${created.name}) with total value KES ${created.totalValue.toLocaleString()}`,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/inventory
export async function PUT(request: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await request.json();
    const { userEmail, userName, id, sku, name, category, location, quantity, reorderLevel, unitValue, status } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Requires editor role.' }, { status: 403 });
    }

    if (!id && !sku) return NextResponse.json({ success: false, error: 'Missing Item ID or SKU' }, { status: 400 });

    const prev = await prisma.inventory.findFirst({
      where: {
        OR: [
          ...(id ? [{ id }] : []),
          ...(sku ? [{ sku }] : []),
        ],
      },
    });
    if (!prev) return NextResponse.json({ success: false, error: 'Inventory item not found' }, { status: 404 });

    const qty = quantity !== undefined ? Number(quantity) : prev.quantity;
    const uVal = unitValue !== undefined ? Number(unitValue) : prev.unitValue;
    const totalVal = qty * uVal;

    const updated = await prisma.inventory.update({
      where: { id: prev.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(sku && { sku: sku.trim() }),
        ...(category && { category }),
        ...(location && { location }),
        ...(quantity !== undefined && { quantity: qty }),
        ...(reorderLevel !== undefined && { reorderLevel: Number(reorderLevel) }),
        ...(unitValue !== undefined && { unitValue: uVal }),
        totalValue: totalVal,
        ...(status && { status }),
      },
    });

    await createAuditLog({
      model: 'Inventory',
      action: 'Updated',
      recordRef: updated.sku,
      userEmail,
      userName,
      member: updated.name,
      oldValues: prev,
      newValues: updated,
      remarks: `Updated inventory item ${updated.sku} (${updated.name})`,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/inventory
export async function DELETE(request: Request) {
  try {
    await ensureDatabaseSchema();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const sku = searchParams.get('sku');
    const userEmail = searchParams.get('userEmail');
    const userName = searchParams.get('userName');

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Requires editor role.' }, { status: 403 });
    }

    if (!id && !sku) return NextResponse.json({ success: false, error: 'Missing Item ID or SKU' }, { status: 400 });

    const prev = await prisma.inventory.findFirst({
      where: {
        OR: [
          ...(id ? [{ id }] : []),
          ...(sku ? [{ sku }] : []),
        ],
      },
    });
    if (!prev) return NextResponse.json({ success: false, error: 'Inventory item not found' }, { status: 404 });

    await prisma.inventory.delete({ where: { id: prev.id } });

    await createAuditLog({
      model: 'Inventory',
      action: 'Deleted',
      recordRef: prev.sku,
      userEmail,
      userName,
      member: prev.name,
      oldValues: prev,
      newValues: { status: 'Deleted' },
      remarks: `Deleted inventory item ${prev.sku} (${prev.name})`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
