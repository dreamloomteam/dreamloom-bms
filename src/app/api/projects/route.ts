import { NextResponse } from 'next/server';
import { prisma, ensureDatabaseSchema } from '@/lib/prisma';
import { isAuthorizedEditor, createAuditLog } from '@/lib/audit';

// GET /api/projects
export async function GET() {
  try {
    await ensureDatabaseSchema();
    const projects = await prisma.project.findMany({
      orderBy: { id: 'asc' },
    });
    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/projects
export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await request.json();
    const { userEmail, userName, id, name, manager, budget, status } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Requires editor role.' }, { status: 403 });
    }

    const customId = id || `PRJ-${String(Date.now()).slice(-4)}`;
    const created = await prisma.project.create({
      data: {
        id: customId,
        name: name?.trim() || 'Untitled Project',
        manager: manager || 'Simon Memia',
        budget: Number(budget) || 0,
        status: status || 'Active',
      },
    });

    await createAuditLog({
      model: 'Projects',
      action: 'Added',
      recordRef: created.id,
      userEmail,
      userName,
      member: created.manager || 'Simon Memia',
      oldValues: {},
      newValues: created,
      remarks: `Created project ${created.id} (${created.name}) with budget KES ${created.budget.toLocaleString()}`,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/projects
export async function PUT(request: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await request.json();
    const { userEmail, userName, id, name, manager, budget, status } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Requires editor role.' }, { status: 403 });
    }

    if (!id) return NextResponse.json({ success: false, error: 'Missing Project ID' }, { status: 400 });

    const prev = await prisma.project.findUnique({ where: { id } });
    if (!prev) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(manager && { manager }),
        ...(budget !== undefined && { budget: Number(budget) }),
        ...(status && { status }),
      },
    });

    await createAuditLog({
      model: 'Projects',
      action: 'Updated',
      recordRef: updated.id,
      userEmail,
      userName,
      member: updated.manager || 'Simon Memia',
      oldValues: prev,
      newValues: updated,
      remarks: `Updated project ${updated.id} (${updated.name})`,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/projects
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

    if (!id) return NextResponse.json({ success: false, error: 'Missing Project ID' }, { status: 400 });

    const prev = await prisma.project.findUnique({ where: { id } });
    if (!prev) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });

    await prisma.project.delete({ where: { id } });

    await createAuditLog({
      model: 'Projects',
      action: 'Deleted',
      recordRef: id,
      userEmail,
      userName,
      member: prev.manager || 'Simon Memia',
      oldValues: prev,
      newValues: { status: 'Deleted' },
      remarks: `Deleted project ${id} (${prev.name})`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
