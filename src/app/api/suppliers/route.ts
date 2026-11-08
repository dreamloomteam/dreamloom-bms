import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorizedEditor } from '@/lib/audit';

// GET /api/suppliers
export async function GET() {
  try {
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
    const body = await request.json();
    const { userEmail, id, name, category, contact, status } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const customId = id || `SUP-${String(Date.now()).slice(-4)}`;
    const created = await prisma.supplier.create({
      data: {
        id: customId,
        name,
        category: category || 'General Operations',
        contact: contact || 'Nairobi Office',
        status: status || 'Active',
      },
    });

    await prisma.editLog.create({
      data: {
        model: 'Suppliers',
        action: 'Added',
        changes: JSON.stringify({
          entity: created.name,
          field: 'Supplier Added',
          prevValue: 'None',
          newValue: `${created.name} (${created.category})`,
          user: userEmail,
        }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/suppliers
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, id, name, category, contact, status } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const prev = await prisma.supplier.findUnique({ where: { id } });

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(contact && { contact }),
        ...(status && { status }),
      },
    });

    await prisma.editLog.create({
      data: {
        model: 'Suppliers',
        action: 'Edited',
        changes: JSON.stringify({
          entity: updated.name,
          field: 'Supplier Details Updated',
          prevValue: prev ? `${prev.name} (${prev.status})` : 'Existing',
          newValue: `${updated.name} (${updated.status})`,
          user: userEmail,
        }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/suppliers
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userEmail = searchParams.get('userEmail');

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

    const prev = await prisma.supplier.findUnique({ where: { id } });
    await prisma.supplier.delete({ where: { id } });

    await prisma.editLog.create({
      data: {
        model: 'Suppliers',
        action: 'Deleted',
        changes: JSON.stringify({
          entity: prev?.name || id,
          field: 'Supplier Removed',
          prevValue: prev ? prev.name : 'Active',
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
