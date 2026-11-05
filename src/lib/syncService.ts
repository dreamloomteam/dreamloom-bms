import { prisma } from './prisma';
import { ALL_MONTHS, MONTH_ABBRS, parseDateToMonthYear } from './dateUtils';
import { createAuditLog } from './audit';

export interface NormalizedPeriod {
  monthIdx: number;
  year: number;
  monthName: string;
  monthShort: string;
  periodKey: string; // e.g. "Sep 2026"
}

/**
 * Normalizes any date string or Date into standard period object
 */
export function normalizePeriod(dateOrStr: string | Date | null | undefined): NormalizedPeriod {
  if (!dateOrStr) {
    const now = new Date();
    const monthIdx = now.getMonth();
    const year = now.getFullYear();
    return {
      monthIdx,
      year,
      monthName: ALL_MONTHS[monthIdx],
      monthShort: MONTH_ABBRS[monthIdx],
      periodKey: `${MONTH_ABBRS[monthIdx]} ${year}`,
    };
  }

  if (dateOrStr instanceof Date) {
    const monthIdx = dateOrStr.getMonth();
    const year = dateOrStr.getFullYear();
    return {
      monthIdx,
      year,
      monthName: ALL_MONTHS[monthIdx],
      monthShort: MONTH_ABBRS[monthIdx],
      periodKey: `${MONTH_ABBRS[monthIdx]} ${year}`,
    };
  }

  const parsed = parseDateToMonthYear(dateOrStr);
  if (parsed) {
    return {
      monthIdx: parsed.monthIdx,
      year: parsed.year,
      monthName: ALL_MONTHS[parsed.monthIdx],
      monthShort: MONTH_ABBRS[parsed.monthIdx],
      periodKey: `${MONTH_ABBRS[parsed.monthIdx]} ${parsed.year}`,
    };
  }

  const now = new Date();
  return {
    monthIdx: now.getMonth(),
    year: now.getFullYear(),
    monthName: ALL_MONTHS[now.getMonth()],
    monthShort: MONTH_ABBRS[now.getMonth()],
    periodKey: `${MONTH_ABBRS[now.getMonth()]} ${now.getFullYear()}`,
  };
}

/**
 * Synchronizes a single contribution into the Fines & Late Payment Penalties Register.
 * Matching key: Member ID + Month + Year + Dues Type.
 * Guaranteed: One member cannot have duplicate penalties for the same month.
 */
export async function syncContributionToPenalty(contributionId: number) {
  const contribution = await prisma.contribution.findUnique({
    where: { id: contributionId },
    include: { member: true },
  });

  if (!contribution || !contribution.memberId) {
    return null;
  }

  const period = normalizePeriod(contribution.monthYear);
  const duesType = 'Contribution & Fine';
  const unsettled = Number(contribution.unsettled) || 0;
  const isLateOrFine = unsettled > 0 || (contribution.remarks && contribution.remarks.toLowerCase().includes('penalty'));

  // If no unsettled dues and no penalty remarks, check if an existing unsettled record should be cleared
  const existing = await prisma.penalty.findUnique({
    where: {
      memberId_monthYear_duesType: {
        memberId: contribution.memberId,
        monthYear: period.periodKey,
        duesType,
      },
    },
    include: { payments: true },
  });

  if (!isLateOrFine && !existing) {
    return null;
  }

  const fineAmount = 500; // Standard late fine

  if (existing) {
    // Mirror the updated contribution unsettled amount while preserving existing payments
    const remContrib = Math.max(0, unsettled - existing.paidContribution);
    const remFine = Math.max(0, existing.penaltyAmount - existing.paidFine);
    const remBalance = remContrib + remFine;
    const totalPaid = existing.paidContribution + existing.paidFine;
    let newStatus = 'UNPAID';
    if (remBalance === 0 && (totalPaid > 0 || unsettled === 0)) {
      newStatus = 'PAID';
    } else if (totalPaid > 0) {
      newStatus = 'PARTIALLY PAID';
    }

    const updated = await prisma.penalty.update({
      where: { id: existing.id },
      data: {
        unsettledContribution: unsettled,
        remainingBalance: remBalance,
        status: newStatus,
        contributionId: contribution.id,
      },
      include: { member: true, payments: true },
    });
    return updated;
  } else if (isLateOrFine) {
    // Create new penalty record
    const totalOutstanding = unsettled + fineAmount;
    const created = await prisma.penalty.create({
      data: {
        memberId: contribution.memberId,
        monthYear: period.periodKey,
        dueDate: new Date(),
        dateLevied: new Date(),
        unsettledContribution: unsettled,
        penaltyAmount: fineAmount,
        paidAmount: 0,
        paidContribution: 0,
        paidFine: 0,
        remainingBalance: totalOutstanding,
        status: 'UNPAID',
        reason: 'Late Contribution & Unsettled Dues',
        duesType,
        contributionId: contribution.id,
      },
      include: { member: true, payments: true },
    });
    return created;
  }

  return null;
}

/**
 * Executes transparent, traceable payment allocation between contribution and fine components.
 * Uses atomic Prisma transaction to prevent double counting.
 */
export async function recordPenaltyPayment(params: {
  penaltyId: number;
  amount: number;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  userEmail?: string;
}) {
  const { penaltyId, amount, paymentMethod, reference, notes, userEmail } = params;

  if (amount <= 0) {
    throw new Error('Payment amount must be greater than zero.');
  }

  // Execute database operations inside interactive transaction with generous timeout for serverless DB
  const result = await prisma.$transaction(
    async (tx) => {
      const penalty = await tx.penalty.findUnique({
        where: { id: penaltyId },
        include: { member: true, payments: true },
      });

      if (!penalty) {
        throw new Error(`Penalty record #${penaltyId} not found.`);
      }

      const currentRemaining = Number(penalty.remainingBalance);
      if (amount > currentRemaining) {
        throw new Error(
          `Payment of KSh ${amount.toLocaleString()} exceeds the remaining balance of KSh ${currentRemaining.toLocaleString()}.`
        );
      }

      // Transparent allocation: Contribution component first, then fine component
      const neededContrib = Math.max(0, penalty.unsettledContribution - penalty.paidContribution);
      const allocContrib = Math.min(amount, neededContrib);
      const remainingPayment = amount - allocContrib;
      const neededFine = Math.max(0, penalty.penaltyAmount - penalty.paidFine);
      const allocFine = Math.min(remainingPayment, neededFine);

      const newPaidContrib = penalty.paidContribution + allocContrib;
      const newPaidFine = penalty.paidFine + allocFine;
      const newPaidTotal = penalty.paidAmount + amount;

      const remainingContrib = Math.max(0, penalty.unsettledContribution - newPaidContrib);
      const remainingFine = Math.max(0, penalty.penaltyAmount - newPaidFine);
      const newRemainingBalance = remainingContrib + remainingFine;
      const newStatus = newRemainingBalance === 0 ? 'PAID' : 'PARTIALLY PAID';
      const nowIso = new Date().toISOString().slice(0, 10);

      // 1. Create payment transaction record
      const paymentTx = await tx.paymentTransaction.create({
        data: {
          penaltyId: penalty.id,
          amount: amount,
          allocatedContribution: allocContrib,
          allocatedFine: allocFine,
          paymentDate: new Date(),
          paymentMethod: paymentMethod || 'M-PESA',
          reference: reference || `PAY-${Date.now()}`,
          notes: notes || `Payment allocated: KSh ${allocContrib.toLocaleString()} to contribution, KSh ${allocFine.toLocaleString()} to fine.`,
          createdByUser: userEmail || 'Administrator',
        },
      });

      // 2. Update penalty record
      const updatedPenalty = await tx.penalty.update({
        where: { id: penalty.id },
        data: {
          paidAmount: newPaidTotal,
          paidContribution: newPaidContrib,
          paidFine: newPaidFine,
          remainingBalance: newRemainingBalance,
          status: newStatus,
          datePaid: newStatus === 'PAID' ? nowIso : penalty.datePaid,
        },
        include: { member: true, payments: true },
      });

      // 3. Mirror reduction in contribution record if linked
      if (penalty.contributionId && allocContrib > 0) {
        await tx.contribution.update({
          where: { id: penalty.contributionId },
          data: {
            unsettled: remainingContrib,
          },
        });
      }

      return {
        penalty: updatedPenalty,
        transaction: paymentTx,
        allocatedContribution: allocContrib,
        allocatedFine: allocFine,
        remainingContribution: remainingContrib,
        remainingFine: remainingFine,
        remainingBalance: newRemainingBalance,
      };
    },
    { maxWait: 15000, timeout: 25000 }
  );

  // 4. Create forensic audit trail outside the transaction
  try {
    await createAuditLog({
      model: 'Fines & Penalties',
      action: 'Updated',
      recordId: result.penalty.id,
      userEmail,
      member: result.penalty.member?.fullName || 'Member',
      oldValues: {
        'Status': result.penalty.status === 'PAID' ? 'PARTIALLY PAID' : 'UNPAID',
        'Amount Paid': `KSh ${(result.penalty.paidAmount - amount).toLocaleString()}`,
        'Remaining Balance': `KSh ${(result.remainingBalance + amount).toLocaleString()}`,
      },
      newValues: {
        'Status': result.penalty.status,
        'Amount Paid': `KSh ${result.penalty.paidAmount.toLocaleString()}`,
        'Remaining Balance': `KSh ${result.remainingBalance.toLocaleString()}`,
        'Allocated to Contribution': `KSh ${result.allocatedContribution.toLocaleString()}`,
        'Allocated to Fine': `KSh ${result.allocatedFine.toLocaleString()}`,
      },
      remarks: `Recorded payment of KSh ${amount.toLocaleString()} for ${result.penalty.member?.fullName} (${result.penalty.monthYear})`,
    });
  } catch (auditErr) {
    console.warn('Audit log creation failed non-fatally:', auditErr);
  }

  return result;
}

/**
 * Synchronizes all existing contributions in the database to ensure complete historical accuracy.
 */
export async function syncAllContributions() {
  const contributions = await prisma.contribution.findMany({
    where: {
      OR: [
        { unsettled: { gt: 0 } },
        { remarks: { contains: 'penalty', mode: 'insensitive' } },
        { remarks: { contains: 'late', mode: 'insensitive' } },
      ],
    },
    select: { id: true },
  });

  const results = [];
  for (const c of contributions) {
    const res = await syncContributionToPenalty(c.id);
    if (res) results.push(res);
  }
  return results;
}
