import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorizedEditor } from '@/lib/audit';

// GET /api/projects
export async function GET() {
  try {
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
    const body = await request.json();
    const { userEmail, id, name, manager, budget, status } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const customId = id || `PRJ-${String(Date.now()).slice(-4)}`;
    const created = await prisma.project.create({
      data: {
        id: customId,
        name,
        manager: manager || 'Simon Memia',
        budget: Number(budget) || 0,
        status: status || 'Active',
      },
    });

    await prisma.editLog.create({
      data: {
        model: 'Projects',
        action: 'Added',
        changes: JSON.stringify({
          entity: created.name,
          field: 'Project Created',
          prevValue: 'None',
          newValue: `Budget: KES ${created.budget.toLocaleString()}`,
          user: userEmail,
        }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/projects
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, id, name, manager, budget, status } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const prev = await prisma.project.findUnique({ where: { id } });

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(manager && { manager }),
        ...(budget !== undefined && { budget: Number(budget) }),
        ...(status && { status }),
      },
    });

    await prisma.editLog.create({
      data: {
        model: 'Projects',
        action: 'Edited',
        changes: JSON.stringify({
          entity: updated.name,
          field: 'Project Updated',
          prevValue: prev ? `KES ${prev.budget.toLocaleString()} (${prev.status})` : 'Existing',
          newValue: `KES ${updated.budget.toLocaleString()} (${updated.status})`,
          user: userEmail,
        }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/projects
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userEmail = searchParams.get('userEmail');

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

    const prev = await prisma.project.findUnique({ where: { id } });
    await prisma.project.delete({ where: { id } });

    await prisma.editLog.create({
      data: {
        model: 'Projects',
        action: 'Deleted',
        changes: JSON.stringify({
          entity: prev?.name || id,
          field: 'Project Removed',
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
