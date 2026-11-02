import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function isAuthorizedEditor(email?: string | null) {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return clean === 'simon@dreamloom.co.ke' || clean === 'elijah@dreamloom.co.ke';
}

// GET /api/expenses
export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { expenseDate: 'desc' },
    });
    return NextResponse.json({ success: true, data: expenses });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/expenses
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, expenseDate, description, amount, expenseType, referenceDetails } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const created = await prisma.expense.create({
      data: {
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        description: description || 'Operational Expense',
        amount: Number(amount) || 0,
        expenseType: expenseType || 'Operational',
        referenceDetails: referenceDetails || null,
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/expenses
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, id, expenseDate, description, amount, expenseType, referenceDetails } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const updated = await prisma.expense.update({
      where: { id: Number(id) },
      data: {
        ...(expenseDate && { expenseDate: new Date(expenseDate) }),
        ...(description && { description }),
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(expenseType && { expenseType }),
        ...(referenceDetails !== undefined && { referenceDetails }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/expenses
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userEmail = searchParams.get('userEmail');

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.expense.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
