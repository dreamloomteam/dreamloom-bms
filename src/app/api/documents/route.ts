import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function isAuthorizedEditor(email?: string | null) {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return clean === 'simon@dreamloom.co.ke' || clean === 'elijah@dreamloom.co.ke';
}

// GET /api/documents
export async function GET() {
  try {
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
    const body = await request.json();
    const { userEmail, id, name, category, link, status } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const customId = id || `DOC-${String(Date.now()).slice(-4)}`;
    const created = await prisma.document.create({
      data: {
        id: customId,
        name,
        category: category || 'General',
        link: link || '#',
        status: status || 'Available',
      },
    });

    await prisma.editLog.create({
      data: {
        model: 'Documents',
        action: 'Added',
        changes: JSON.stringify({
          entity: created.name,
          field: 'Document Uploaded / Registered',
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

// PUT /api/documents
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, id, name, category, link, status } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const prev = await prisma.document.findUnique({ where: { id } });

    const updated = await prisma.document.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(link && { link }),
        ...(status && { status }),
      },
    });

    await prisma.editLog.create({
      data: {
        model: 'Documents',
        action: 'Edited',
        changes: JSON.stringify({
          entity: updated.name,
          field: 'Document Metadata Updated',
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

// DELETE /api/documents
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userEmail = searchParams.get('userEmail');

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

    const prev = await prisma.document.findUnique({ where: { id } });
    await prisma.document.delete({ where: { id } });

    await prisma.editLog.create({
      data: {
        model: 'Documents',
        action: 'Deleted',
        changes: JSON.stringify({
          entity: prev?.name || id,
          field: 'Document Deleted',
          prevValue: prev ? prev.name : 'Available',
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
