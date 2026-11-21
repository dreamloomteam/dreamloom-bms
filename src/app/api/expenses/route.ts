import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorizedEditor, createAuditLog } from '@/lib/audit';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session';

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
    const rawDbId = searchParams.get('dbId');
    const rawCustomId = searchParams.get('customId');
    let userEmail = searchParams.get('userEmail');

    // Also check session cookie if userEmail is missing
    if (!userEmail) {
      try {
        const cookieHeader = request.headers.get('cookie') || '';
        const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
        if (match) {
          const payload = verifySessionToken(match[1]);
          if (payload?.email) {
            userEmail = payload.email;
          }
        }
      } catch (e) {}
    }

    if (!isAuthorizedEditor(userEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Only authorized directors can delete expenses.' }, { status: 403 });
    }

    let prevExpense = null;

    // 1. Direct lookup by explicit dbId if numeric
    const explicitDbId = rawDbId ? Number(rawDbId) : null;
    if (explicitDbId && !isNaN(explicitDbId)) {
      prevExpense = await prisma.expense.findUnique({
        where: { id: explicitDbId },
      });
    }

    // 2. Direct lookup by rawId if numeric
    if (!prevExpense && rawId && !isNaN(Number(rawId))) {
      prevExpense = await prisma.expense.findUnique({
        where: { id: Number(rawId) },
      });
    }

    // 3. Fallback: Parse digits from rawId or rawCustomId (e.g. "EXP-35")
    const numId = rawId ? (isNaN(Number(rawId)) ? parseInt(rawId.replace(/\D/g, ''), 10) : Number(rawId)) : null;
    if (!prevExpense && numId && !isNaN(numId)) {
      prevExpense = await prisma.expense.findUnique({
        where: { id: numId },
      });
    }

    // 4. Index-based fallback if formatted as "EXP-XX" (1-indexed based on newest-first ordering)
    const formattedId = rawCustomId || (rawId && String(rawId).toUpperCase().startsWith('EXP-') ? String(rawId) : null);
    if (!prevExpense && formattedId) {
      const allExpenses = await prisma.expense.findMany({
        orderBy: { expenseDate: 'desc' },
      });
      const expIndex = parseInt(formattedId.replace(/\D/g, ''), 10) - 1;
      if (expIndex >= 0 && expIndex < allExpenses.length) {
        prevExpense = allExpenses[expIndex];
      }
    }

    if (!prevExpense) {
      return NextResponse.json({ success: false, error: 'Expense record not found' }, { status: 404 });
    }

    await prisma.expense.delete({ where: { id: prevExpense.id } });

    await createAuditLog({
      model: 'Expenses',
      action: 'Deleted',
      recordId: prevExpense.id,
      userEmail,
      member: prevExpense.referenceDetails || prevExpense.description || `Expense #${prevExpense.id}`,
      oldValues: {
        'Description': prevExpense.description,
        'Expense Amount': `KSh ${Number(prevExpense.amount).toLocaleString()}`,
        'Category': prevExpense.expenseType,
        'Paid To / Reference': prevExpense.referenceDetails || '-',
      },
      newValues: {
        'Record Status': 'Expense Record Deleted (No new active record)',
      },
      remarks: `Deleted expense voucher #${prevExpense.id} ("${prevExpense.description}")`,
    });

    return NextResponse.json({ success: true, deletedId: prevExpense.id });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
