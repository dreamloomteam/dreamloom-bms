import { NextResponse } from 'next/server';
import { prisma, ensureDatabaseSchema } from '@/lib/prisma';
import { isAuthorizedEditor, createAuditLog } from '@/lib/audit';

// GET /api/suppliers
export async function GET() {
  try {
    await ensureDatabaseSchema();
    const suppliers = await prisma.supplier.findMany({
      orderBy: { id: 'asc' },
    });
    return NextResponse.json({ success: true, data: suppliers });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/suppliers
export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await request.json();
    const { userEmail, userName, id, name, category, contact, status } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Requires editor role.' }, { status: 403 });
    }

    const customId = id || `SUP-${String(Date.now()).slice(-4)}`;
    const created = await prisma.supplier.create({
      data: {
        id: customId,
        name: name?.trim() || 'Untitled Supplier',
        category: category || 'General Operations',
        contact: contact || 'Nairobi Office',
        status: status || 'Active',
      },
    });

    await createAuditLog({
      model: 'Suppliers',
      action: 'Added',
      recordRef: created.id,
      userEmail,
      userName,
      member: created.name,
      oldValues: {},
      newValues: created,
      remarks: `Registered supplier ${created.id} (${created.name})`,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/suppliers
export async function PUT(request: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await request.json();
    const { userEmail, userName, id, name, category, contact, status } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Requires editor role.' }, { status: 403 });
    }

    if (!id) return NextResponse.json({ success: false, error: 'Missing Supplier ID' }, { status: 400 });

    const prev = await prisma.supplier.findUnique({ where: { id } });
    if (!prev) return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 });

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(category && { category }),
        ...(contact && { contact }),
        ...(status && { status }),
      },
    });

    await createAuditLog({
      model: 'Suppliers',
      action: 'Updated',
      recordRef: updated.id,
      userEmail,
      userName,
      member: updated.name,
      oldValues: prev,
      newValues: updated,
      remarks: `Updated supplier ${updated.id} (${updated.name})`,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/suppliers
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

    if (!id) return NextResponse.json({ success: false, error: 'Missing Supplier ID' }, { status: 400 });

    const prev = await prisma.supplier.findUnique({ where: { id } });
    if (!prev) return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 });

    await prisma.supplier.delete({ where: { id } });

    await createAuditLog({
      model: 'Suppliers',
      action: 'Deleted',
      recordRef: id,
      userEmail,
      userName,
      member: prev.name,
      oldValues: prev,
      newValues: { status: 'Deleted' },
      remarks: `Deleted supplier ${id} (${prev.name})`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
