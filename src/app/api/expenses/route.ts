import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

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
    const { userEmail, expenseDate, description, amount, expenseType, referenceDetails, remarks } = body;

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

    await createAuditLog({
      model: 'Expenses',
      action: 'Added',
      recordId: created.id,
      userEmail,
      member: referenceDetails || description || 'Vendor Expense',
      oldValues: {
        'Record Status': 'None (New Expense Entry)',
      },
      newValues: {
        'Description': created.description,
        'Expense Amount': `KSh ${Number(created.amount).toLocaleString()}`,
        'Category': created.expenseType,
        'Paid To / Reference': referenceDetails || '-',
      },
      remarks: remarks || `Approved operational expense of KSh ${Number(created.amount).toLocaleString()} for ${referenceDetails || description}`,
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
    const { userEmail, id, expenseDate, description, amount, expenseType, referenceDetails, remarks } = body;

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Only authorized directors can update expenses.' }, { status: 403 });
    }

    const numId = typeof id === 'number' ? id : parseInt(String(id).replace(/\D/g, ''), 10);
    if (!numId || isNaN(numId)) {
      return NextResponse.json({ success: false, error: 'Valid Expense ID is required' }, { status: 400 });
    }

    const prevExpense = await prisma.expense.findUnique({
      where: { id: numId },
    });

    if (!prevExpense) {
      return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
    }

    const oldValues = {
      'Description': prevExpense.description,
      'Expense Amount': `KSh ${Number(prevExpense.amount).toLocaleString()}`,
      'Category': prevExpense.expenseType,
      'Paid To / Reference': prevExpense.referenceDetails || '-',
    };

    const updated = await prisma.expense.update({
      where: { id: numId },
      data: {
        ...(expenseDate && { expenseDate: new Date(expenseDate) }),
        ...(description && { description }),
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(expenseType && { expenseType }),
        ...(referenceDetails !== undefined && { referenceDetails }),
      },
    });

    const newValues = {
      'Description': updated.description,
      'Expense Amount': `KSh ${Number(updated.amount).toLocaleString()}`,
      'Category': updated.expenseType,
      'Paid To / Reference': updated.referenceDetails || '-',
    };

    await createAuditLog({
      model: 'Expenses',
      action: 'Updated',
      recordId: updated.id,
      userEmail,
      member: updated.referenceDetails || updated.description || 'Vendor Expense',
      oldValues,
      newValues,
      remarks: remarks || `Updated expense voucher #${updated.id} to KSh ${Number(updated.amount).toLocaleString()}`,
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
    const rawId = searchParams.get('id');
    const userEmail = searchParams.get('userEmail');

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Only authorized directors can delete expenses.' }, { status: 403 });
    }

    const numId = rawId ? (isNaN(Number(rawId)) ? parseInt(rawId.replace(/\D/g, ''), 10) : Number(rawId)) : null;
    if (!numId || isNaN(numId)) {
      return NextResponse.json({ success: false, error: 'Valid Expense ID is required' }, { status: 400 });
    }

    const prevExpense = await prisma.expense.findUnique({
      where: { id: numId },
    });

    if (!prevExpense) {
      return NextResponse.json({ success: false, error: 'Expense record not found' }, { status: 404 });
    }

    await prisma.expense.delete({ where: { id: numId } });

    await createAuditLog({
      model: 'Expenses',
      action: 'Deleted',
      recordId: prevExpense.id,
      userEmail,
      member: prevExpense.referenceDetails || prevExpense.description || `Expense #${numId}`,
      oldValues: {
        'Description': prevExpense.description,
        'Expense Amount': `KSh ${Number(prevExpense.amount).toLocaleString()}`,
        'Category': prevExpense.expenseType,
        'Paid To / Reference': prevExpense.referenceDetails || '-',
      },
      newValues: {
        'Record Status': 'Expense Record Deleted (No new active record)',
      },
      remarks: `Deleted expense voucher #${numId}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
