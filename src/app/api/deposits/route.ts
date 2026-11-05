import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { getEATISODate, getEATCurrentYear, parseDateToMonthYear } from '@/lib/dateUtils';

// Helper to generate next unique deposit ID (DEP-YYYY-XXXX)
async function generateDepositId(date: Date = new Date()): Promise<string> {
  const year = date.getFullYear() || getEATCurrentYear();
  const count = await prisma.deposit.count();
  const sequence = String(count + 1).padStart(4, '0');
  let candidate = `DEP-${year}-${sequence}`;

  // Ensure absolute uniqueness
  const exists = await prisma.deposit.findUnique({ where: { customId: candidate } });
  if (exists) {
    candidate = `DEP-${year}-${Date.now().toString().slice(-4)}`;
  }
  return candidate;
}

// GET /api/deposits
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const transactionType = searchParams.get('type');
    const receivingAccount = searchParams.get('account');
    const reconciliationStatus = searchParams.get('reconciliation');
    const search = searchParams.get('search');

    const deposits = await prisma.deposit.findMany({
      include: {
        member: {
          select: {
            id: true,
            fullName: true,
            nationalId: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    const todayISO = getEATISODate();

    // Summary calculations (excluding reversed)
    let totalDeposits = 0;
    let depositsThisMonth = 0;
    let depositsToday = 0;
    let reconciledCount = 0;
    let unreconciledCount = 0;
    let discrepancyCount = 0;
    let reversedCount = 0;

    const currentYear = getEATCurrentYear();
    const currentMonthYear = parseDateToMonthYear(new Date().toISOString());

    deposits.forEach((dep) => {
      if (dep.isReversed) {
        reversedCount++;
        return; // Exclude reversed from active totals
      }

      const amt = Number(dep.amount) || 0;
      totalDeposits += amt;

      const depDate = new Date(dep.date);
      const depDateISO = depDate.toISOString().slice(0, 10);
      const depMonthYear = parseDateToMonthYear(depDate.toISOString());

      if (
        currentMonthYear &&
        depMonthYear &&
        currentMonthYear.monthIdx === depMonthYear.monthIdx &&
        currentMonthYear.year === depMonthYear.year
      ) {
        depositsThisMonth += amt;
      }

      if (depDateISO === todayISO) {
        depositsToday += amt;
      }

      if (dep.reconciliationStatus === 'Reconciled') reconciledCount++;
      else if (dep.reconciliationStatus === 'Discrepancy') discrepancyCount++;
      else unreconciledCount++;
    });

    return NextResponse.json({
      success: true,
      data: deposits,
      metrics: {
        totalDeposits,
        depositsThisMonth,
        depositsToday,
        totalTransactions: deposits.length,
        activeTransactions: deposits.length - reversedCount,
        reconciledCount,
        unreconciledCount,
        discrepancyCount,
        reversedCount,
      },
    });
  } catch (error) {
    console.error('Error fetching deposits:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/deposits
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      action,
      userEmail,
      userName,
      // Deposit fields
      depositorName,
      date,
      amount,
      transactionType,
      customTransactionType,
      reason,
      reference,
      paymentMethod,
      receivingAccount,
      memberId,
      allocationType,
      allocationRef,
      contributionId,
      loanId,
      projectId,
      investmentId,
      attachmentUrl,
      attachmentName,
      // Reversal fields
      depositId,
      reversalReason,
      // Reconciliation fields
      reconciliationStatus,
      reconciliationNotes,
    } = body;

    const author = userName || (userEmail ? userEmail.split('@')[0] : 'Administrator');

    // -------------------------------------------------------------------------
    // ACTION: REVERSE A DEPOSIT
    // -------------------------------------------------------------------------
    if (action === 'reverse') {
      const depId = Number(depositId || body.id);
      if (!depId) {
        return NextResponse.json({ success: false, error: 'Deposit ID is required for reversal' }, { status: 400 });
      }

      const existing = await prisma.deposit.findUnique({
        where: { id: depId },
        include: { member: true },
      });

      if (!existing) {
        return NextResponse.json({ success: false, error: 'Deposit record not found' }, { status: 404 });
      }

      if (existing.isReversed) {
        return NextResponse.json({ success: false, error: 'Deposit is already reversed' }, { status: 400 });
      }

      const revReason = reversalReason || 'Correction / Reversal of transaction';

      // Perform reversal in database transaction
      const updated = await prisma.$transaction(async (tx) => {
        // If this deposit was linked to a Loan Repayment, undo loan paidAmount
        if (existing.transactionType === 'Loan Repayment' && existing.loanId) {
          const loan = await tx.loan.findUnique({ where: { id: existing.loanId } });
          if (loan) {
            const newPaid = Math.max(0, loan.paidAmount - existing.amount);
            const newStatus = newPaid >= loan.totalPayable ? 'Settled' : 'Active';
            await tx.loan.update({
              where: { id: existing.loanId },
              data: {
                paidAmount: newPaid,
                status: newStatus,
                clearedDate: newStatus === 'Settled' ? loan.clearedDate : null,
              },
            });
          }
        }

        // Mark deposit as reversed
        return tx.deposit.update({
          where: { id: depId },
          data: {
            isReversed: true,
            reversalReason: revReason,
            reversedAt: new Date(),
            reversedBy: author,
          },
        });
      });

      // Audit Log for Reversal
      await createAuditLog({
        model: 'Deposits',
        action: 'Updated',
        recordId: depId,
        userEmail: userEmail || 'system@dreamloom.co.ke',
        userName: author,
        member: existing.depositorName,
        oldValues: {
          customId: existing.customId,
          amount: existing.amount,
          status: 'Active',
          isReversed: false,
        },
        newValues: {
          customId: existing.customId,
          amount: existing.amount,
          status: 'REVERSED',
          isReversed: true,
          reversalReason: revReason,
        },
        remarks: `Deposit Reversal [${existing.customId}]: ${revReason}`,
      });

      return NextResponse.json({ success: true, message: 'Deposit successfully reversed', data: updated });
    }

    // -------------------------------------------------------------------------
    // ACTION: RECONCILE A DEPOSIT
    // -------------------------------------------------------------------------
    if (action === 'reconcile') {
      const depId = Number(depositId || body.id);
      if (!depId) {
        return NextResponse.json({ success: false, error: 'Deposit ID is required for reconciliation' }, { status: 400 });
      }

      const existing = await prisma.deposit.findUnique({ where: { id: depId } });
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Deposit not found' }, { status: 404 });
      }

      const newStatus = reconciliationStatus || 'Reconciled';
      const updated = await prisma.deposit.update({
        where: { id: depId },
        data: {
          reconciliationStatus: newStatus,
          reconciledAt: new Date(),
          reconciledBy: author,
          reconciliationNotes: reconciliationNotes || null,
        },
      });

      // Audit Log for Reconciliation
      await createAuditLog({
        model: 'Deposits',
        action: 'Updated',
        recordId: depId,
        userEmail: userEmail || 'system@dreamloom.co.ke',
        userName: author,
        member: existing.depositorName,
        oldValues: {
          customId: existing.customId,
          reconciliationStatus: existing.reconciliationStatus,
        },
        newValues: {
          customId: existing.customId,
          reconciliationStatus: newStatus,
          reconciliationNotes: reconciliationNotes || '-',
        },
        remarks: `Reconciliation Status Changed to ${newStatus}`,
      });

      return NextResponse.json({ success: true, message: 'Reconciliation updated', data: updated });
    }

    // -------------------------------------------------------------------------
    // ACTION: CREATE NEW DEPOSIT
    // -------------------------------------------------------------------------
    if (!depositorName || !amount) {
      return NextResponse.json(
        { success: false, error: 'Depositor Name and Amount are required fields' },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Amount must be a positive number' }, { status: 400 });
    }

    // 1. Duplicate Reference Protection: Check if external reference already exists (non-reversed)
    if (reference && reference.trim()) {
      const cleanRef = reference.trim();
      const existingRef = await prisma.deposit.findFirst({
        where: {
          reference: { equals: cleanRef, mode: 'insensitive' },
          isReversed: false,
        },
      });

      if (existingRef) {
        return NextResponse.json(
          {
            success: false,
            isDuplicate: true,
            error: `Duplicate Reference Detected: A deposit with reference '${cleanRef}' already exists in the system (Recorded for ${existingRef.depositorName}, KES ${existingRef.amount.toLocaleString()} on ${new Date(existingRef.date).toLocaleDateString()}). Duplicate transactions are strictly prevented.`,
          },
          { status: 400 }
        );
      }
    }

    const depositDate = date ? new Date(date) : new Date();
    const customId = await generateDepositId(depositDate);

    // 2. Resolve Member if memberId or member name provided
    let finalMemberId: number | null = memberId ? Number(memberId) : null;
    if (!finalMemberId && depositorName) {
      const matched = await prisma.member.findFirst({
        where: { fullName: { contains: depositorName.trim(), mode: 'insensitive' } },
      });
      if (matched) finalMemberId = matched.id;
    }

    // 3. Save Deposit & Perform Financial Integration
    const created = await prisma.$transaction(async (tx) => {
      const newDeposit = await tx.deposit.create({
        data: {
          customId,
          date: depositDate,
          depositorName: depositorName.trim(),
          amount: numAmount,
          transactionType: transactionType || 'Member Deposit',
          customTransactionType: customTransactionType || null,
          reason: reason || 'Deposit received',
          reference: reference ? reference.trim() : null,
          paymentMethod: paymentMethod || 'M-Pesa',
          receivingAccount: receivingAccount || 'Equity Bank - A/C 1760287177880',
          memberId: finalMemberId,
          allocationType: allocationType || 'None',
          allocationRef: allocationRef || null,
          contributionId: contributionId ? Number(contributionId) : null,
          loanId: loanId || null,
          projectId: projectId || null,
          investmentId: investmentId || null,
          reconciliationStatus: reconciliationStatus || 'Unreconciled',
          attachmentUrl: attachmentUrl || null,
          attachmentName: attachmentName || null,
          createdByUser: author,
        },
      });

      // Financial Integration: If Loan Repayment linked to existing loan, update the loan
      if (transactionType === 'Loan Repayment' && loanId) {
        const loan = await tx.loan.findUnique({ where: { id: loanId } });
        if (loan) {
          const newPaid = loan.paidAmount + numAmount;
          const newStatus = newPaid >= loan.totalPayable ? 'Settled' : 'Active';
          await tx.loan.update({
            where: { id: loanId },
            data: {
              paidAmount: newPaid,
              status: newStatus,
              clearedDate: newStatus === 'Settled' ? depositDate : loan.clearedDate,
            },
          });
        }
      }

      return newDeposit;
    });

    // 4. Audit Trail Entry
    await createAuditLog({
      model: 'Deposits',
      action: 'Added',
      recordId: created.id,
      userEmail: userEmail || 'admin@dreamloom.co.ke',
      userName: author,
      member: created.depositorName,
      oldValues: {},
      newValues: {
        customId: created.customId,
        date: created.date.toISOString().slice(0, 10),
        depositor: created.depositorName,
        amount: created.amount,
        type: created.transactionType,
        account: created.receivingAccount,
        reference: created.reference || '-',
        paymentMethod: created.paymentMethod,
        allocation: created.allocationType !== 'None' ? `${created.allocationType}: ${created.allocationRef || ''}` : 'None',
      },
      remarks: `New Deposit: ${created.reason}`,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('Error in deposit POST:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/deposits
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      userEmail,
      userName,
      depositorName,
      date,
      amount,
      transactionType,
      customTransactionType,
      reason,
      reference,
      paymentMethod,
      receivingAccount,
      memberId,
      allocationType,
      allocationRef,
      contributionId,
      loanId,
      projectId,
      investmentId,
      attachmentUrl,
      attachmentName,
    } = body;

    const depId = Number(id);
    if (!depId) {
      return NextResponse.json({ success: false, error: 'Deposit ID is required' }, { status: 400 });
    }

    const existing = await prisma.deposit.findUnique({ where: { id: depId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Deposit record not found' }, { status: 404 });
    }

    if (existing.isReversed) {
      return NextResponse.json(
        { success: false, error: 'Cannot modify a reversed deposit record' },
        { status: 400 }
      );
    }

    // Check duplicate reference if changed
    if (reference && reference.trim() && reference.trim().toLowerCase() !== (existing.reference || '').toLowerCase()) {
      const cleanRef = reference.trim();
      const duplicate = await prisma.deposit.findFirst({
        where: {
          reference: { equals: cleanRef, mode: 'insensitive' },
          id: { not: depId },
          isReversed: false,
        },
      });
      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            isDuplicate: true,
            error: `Duplicate Reference Detected: Reference '${cleanRef}' is already used by deposit ${duplicate.customId} (${duplicate.depositorName}, KES ${duplicate.amount.toLocaleString()}).`,
          },
          { status: 400 }
        );
      }
    }

    const numAmount = amount !== undefined ? Number(amount) : existing.amount;
    const author = userName || (userEmail ? userEmail.split('@')[0] : 'Administrator');

    const updated = await prisma.$transaction(async (tx) => {
      // Adjust loan if loan repayment amount changed
      if (existing.transactionType === 'Loan Repayment' && existing.loanId) {
        const loan = await tx.loan.findUnique({ where: { id: existing.loanId } });
        if (loan) {
          const diff = numAmount - existing.amount;
          const newPaid = Math.max(0, loan.paidAmount + diff);
          const newStatus = newPaid >= loan.totalPayable ? 'Settled' : 'Active';
          await tx.loan.update({
            where: { id: existing.loanId },
            data: {
              paidAmount: newPaid,
              status: newStatus,
              clearedDate: newStatus === 'Settled' ? loan.clearedDate || new Date() : null,
            },
          });
        }
      }

      return tx.deposit.update({
        where: { id: depId },
        data: {
          depositorName: depositorName !== undefined ? depositorName.trim() : existing.depositorName,
          date: date ? new Date(date) : existing.date,
          amount: numAmount,
          transactionType: transactionType || existing.transactionType,
          customTransactionType: customTransactionType !== undefined ? customTransactionType : existing.customTransactionType,
          reason: reason !== undefined ? reason : existing.reason,
          reference: reference !== undefined ? (reference ? reference.trim() : null) : existing.reference,
          paymentMethod: paymentMethod || existing.paymentMethod,
          receivingAccount: receivingAccount || existing.receivingAccount,
          memberId: memberId !== undefined ? (memberId ? Number(memberId) : null) : existing.memberId,
          allocationType: allocationType !== undefined ? allocationType : existing.allocationType,
          allocationRef: allocationRef !== undefined ? allocationRef : existing.allocationRef,
          contributionId: contributionId !== undefined ? (contributionId ? Number(contributionId) : null) : existing.contributionId,
          loanId: loanId !== undefined ? loanId : existing.loanId,
          projectId: projectId !== undefined ? projectId : existing.projectId,
          investmentId: investmentId !== undefined ? investmentId : existing.investmentId,
          attachmentUrl: attachmentUrl !== undefined ? attachmentUrl : existing.attachmentUrl,
          attachmentName: attachmentName !== undefined ? attachmentName : existing.attachmentName,
        },
      });
    });

    // Audit Log for Edit
    await createAuditLog({
      model: 'Deposits',
      action: 'Updated',
      recordId: depId,
      userEmail: userEmail || 'system@dreamloom.co.ke',
      userName: author,
      member: updated.depositorName,
      oldValues: {
        depositorName: existing.depositorName,
        amount: existing.amount,
        type: existing.transactionType,
        account: existing.receivingAccount,
        reference: existing.reference || '-',
        paymentMethod: existing.paymentMethod,
      },
      newValues: {
        depositorName: updated.depositorName,
        amount: updated.amount,
        type: updated.transactionType,
        account: updated.receivingAccount,
        reference: updated.reference || '-',
        paymentMethod: updated.paymentMethod,
      },
      remarks: `Edited Deposit [${existing.customId}]`,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in deposit PUT:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/deposits
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userEmail = searchParams.get('userEmail') || 'admin@dreamloom.co.ke';
    const reason = searchParams.get('reason') || 'Administrative Deletion';

    if (!id) {
      return NextResponse.json({ success: false, error: 'Deposit ID is required' }, { status: 400 });
    }

    const depId = Number(id);
    const existing = await prisma.deposit.findUnique({ where: { id: depId } });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Deposit not found' }, { status: 404 });
    }

    // Rather than permanently destroying financial records, we perform a safe reversal
    // unless hardDelete=true is specified by root admin
    const isHardDelete = searchParams.get('hardDelete') === 'true';

    if (isHardDelete) {
      await prisma.deposit.delete({ where: { id: depId } });
      await createAuditLog({
        model: 'Deposits',
        action: 'Deleted',
        recordId: depId,
        userEmail,
        member: existing.depositorName,
        oldValues: {
          customId: existing.customId,
          amount: existing.amount,
          depositor: existing.depositorName,
        },
        newValues: {},
        remarks: `Hard Deletion of Deposit [${existing.customId}]: ${reason}`,
      });
      return NextResponse.json({ success: true, message: 'Deposit permanently deleted' });
    }

    // Default: Soft Reversal preserving audit trail
    const reversed = await prisma.deposit.update({
      where: { id: depId },
      data: {
        isReversed: true,
        reversalReason: reason,
        reversedAt: new Date(),
        reversedBy: userEmail.split('@')[0],
      },
    });

    await createAuditLog({
      model: 'Deposits',
      action: 'Updated',
      recordId: depId,
      userEmail,
      member: existing.depositorName,
      oldValues: { status: 'Active', isReversed: false },
      newValues: { status: 'REVERSED', isReversed: true, reason },
      remarks: `Reversed Deposit [${existing.customId}]: ${reason}`,
    });

    return NextResponse.json({ success: true, message: 'Deposit successfully reversed', data: reversed });
  } catch (error) {
    console.error('Error in deposit DELETE:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
