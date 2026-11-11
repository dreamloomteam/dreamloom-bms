import { NextResponse } from 'next/server';
import { prisma, ensureDatabaseSchema } from '@/lib/prisma';
import { isAuthorizedEditor, createAuditLog } from '@/lib/audit';

// GET /api/documents
export async function GET() {
  try {
    await ensureDatabaseSchema();
    const documents = await prisma.document.findMany({
      orderBy: { id: 'asc' },
    });
    return NextResponse.json({ success: true, data: documents });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/documents
export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await request.json();
    const { userEmail, userName, id, name, category, link, status } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Requires editor role.' }, { status: 403 });
    }

    const customId = id || `DOC-${String(Date.now()).slice(-4)}`;
    const created = await prisma.document.create({
      data: {
        id: customId,
        name: name?.trim() || 'Untitled Document',
        category: category || 'General',
        link: link || '#',
        status: status || 'Available',
      },
    });

    await createAuditLog({
      model: 'Documents',
      action: 'Added',
      recordRef: created.id,
      userEmail,
      userName,
      member: created.name,
      oldValues: {},
      newValues: created,
      remarks: `Added document ${created.id} (${created.name})`,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/documents
export async function PUT(request: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await request.json();
    const { userEmail, userName, id, name, category, link, status } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Requires editor role.' }, { status: 403 });
    }

    if (!id) return NextResponse.json({ success: false, error: 'Missing Document ID' }, { status: 400 });

    const prev = await prisma.document.findUnique({ where: { id } });
    if (!prev) return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });

    const updated = await prisma.document.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(category && { category }),
        ...(link && { link }),
        ...(status && { status }),
      },
    });

    await createAuditLog({
      model: 'Documents',
      action: 'Updated',
      recordRef: updated.id,
      userEmail,
      userName,
      member: updated.name,
      oldValues: prev,
      newValues: updated,
      remarks: `Updated document ${updated.id} (${updated.name})`,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/documents
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

    if (!id) return NextResponse.json({ success: false, error: 'Missing Document ID' }, { status: 400 });

    const prev = await prisma.document.findUnique({ where: { id } });
    if (!prev) return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });

    await prisma.document.delete({ where: { id } });

    await createAuditLog({
      model: 'Documents',
      action: 'Deleted',
      recordRef: id,
      userEmail,
      userName,
      member: prev.name,
      oldValues: prev,
      newValues: { status: 'Deleted' },
      remarks: `Deleted document ${id} (${prev.name})`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
