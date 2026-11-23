import { prisma } from './prisma';
import { ALL_MONTHS, MONTH_ABBRS, parseDateToMonthYear, normalizeMonthYear } from './dateUtils';
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
 * Checks if the monthly contribution deadline (16th day of that month at 23:59:59 EAT) has passed.
 * EAT is UTC+3.
 */
export function isContributionDeadlinePassed(monthYearStr: string, referenceDate: Date = new Date()): boolean {
  const period = normalizePeriod(monthYearStr);
  // 16th of that month at 23:59:59 EAT corresponds to 20:59:59 UTC on the 16th
  const deadlineUtc = new Date(Date.UTC(period.year, period.monthIdx, 16, 20, 59, 59));
  return referenceDate.getTime() > deadlineUtc.getTime();
}

/**
 * Automatic Monthly Penalty Generation.
 * Scans contributions across all 7 members:
 * - When a member fails to make required monthly contribution by the 16th deadline:
 *   Generates exactly ONE KSh 500 penalty.
 * - Never generates duplicate penalties (enforced by memberId + monthYear).
 * - Never generates penalties for members who paid on time.
 * - Never generates penalties for months that have not yet reached the 16th deadline.
 * - Preserves existing penalty records and payment status.
 */
export async function syncAllContributions() {
  const members = await prisma.member.findMany({
    orderBy: { id: 'asc' },
  });

  const contributions = await prisma.contribution.findMany({
    orderBy: { id: 'asc' },
  });

  const duesType = 'Contribution & Fine';
  const now = new Date();
  const createdPenalties: any[] = [];

  for (const contrib of contributions) {
    if (!contrib.memberId) continue;

    const period = normalizePeriod(contrib.monthYear);

    // Rule 1: Deadline check - Do not generate penalties for months that have not yet reached the 16th
    if (!isContributionDeadlinePassed(period.periodKey, now)) {
      continue;
    }

    // Rule 2: Member paid on time check
    const amount = Number(contrib.amount) || 0;
    const unsettled = Number(contrib.unsettled) || 0;
    const remarks = (contrib.remarks || '').toLowerCase();
    const isLateOrUnsettled = unsettled > 0 || amount === 0 || remarks.includes('late') || remarks.includes('penalty');

    if (!isLateOrUnsettled) {
      // Member paid on time, do not generate fine
      continue;
    }

    // Rule 3: Single penalty per member per month - Never generate duplicate
    const existing = await prisma.penalty.findUnique({
      where: {
        memberId_monthYear_duesType: {
          memberId: contrib.memberId,
          monthYear: period.periodKey,
          duesType,
        },
      },
    });

    if (existing) {
      // Existing penalty preserved, do not duplicate
      continue;
    }

    // Create exactly one KSh 500 fine
    const created = await prisma.penalty.create({
      data: {
        memberId: contrib.memberId,
        monthYear: period.periodKey,
        dueDate: new Date(),
        dateLevied: new Date(),
        penaltyAmount: 500.0,
        unsettledContribution: 0.0,
        paidAmount: 0.0,
        paidContribution: 0.0,
        paidFine: 0.0,
        remainingBalance: 500.0,
        status: 'UNPAID',
        reason: 'Late Contribution Penalty',
        duesType,
        contributionId: contrib.id,
      },
      include: { member: true },
    });

    createdPenalties.push(created);
  }

  return createdPenalties;
}

/**
 * Synchronizes a single contribution into the KSh 500 penalty register.
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

  // Deadline check
  if (!isContributionDeadlinePassed(period.periodKey)) {
    return null;
  }

  const amount = Number(contribution.amount) || 0;
  const unsettled = Number(contribution.unsettled) || 0;
  const remarks = (contribution.remarks || '').toLowerCase();
  const isLateOrUnsettled = unsettled > 0 || amount === 0 || remarks.includes('late') || remarks.includes('penalty');

  if (!isLateOrUnsettled) {
    return null;
  }

  const existing = await prisma.penalty.findUnique({
    where: {
      memberId_monthYear_duesType: {
        memberId: contribution.memberId,
        monthYear: period.periodKey,
        duesType,
      },
    },
  });

  if (existing) {
    return existing;
  }

  return await prisma.penalty.create({
    data: {
      memberId: contribution.memberId,
      monthYear: period.periodKey,
      dueDate: new Date(),
      dateLevied: new Date(),
      penaltyAmount: 500.0,
      unsettledContribution: 0.0,
      paidAmount: 0.0,
      paidContribution: 0.0,
      paidFine: 0.0,
      remainingBalance: 500.0,
      status: 'UNPAID',
      reason: 'Late Contribution Penalty',
      duesType,
      contributionId: contribution.id,
    },
    include: { member: true },
  });
}

/**
  * Backward compatibility helper for legacy scripts.
  */
export async function recordPenaltyPayment(params: any) {
  const { penaltyId, amount, paymentMethod, reference, notes, userEmail } = params;
  const numId = typeof penaltyId === 'number' ? penaltyId : parseInt(String(penaltyId).replace(/\D/g, ''), 10);
  const nowIso = new Date().toISOString().slice(0, 10);

  const updated = await prisma.penalty.update({
    where: { id: numId },
    data: {
      paidAmount: Number(amount) || 500,
      paidFine: Number(amount) || 500,
      remainingBalance: 0,
      status: 'PAID',
      datePaid: nowIso,
    },
    include: { member: true, payments: true }
  });

  return {
    penalty: updated,
    allocatedContribution: 0,
    allocatedFine: Number(amount) || 500,
    remainingContribution: 0,
    remainingFine: 0,
    remainingBalance: 0
  };
}

/**
 * Calculates internal fund split between General Company Funds and Emergency & Welfare Fund.
 * Target per monthly contribution: KSh 6,000 = KSh 5,000 (General) + KSh 1,000 (Emergency).
 * Proportional allocation for partial contributions: (amountPaid / 6000) * 1000.
 */
export function calculateContributionFundSplit(amountPaid: number, expectedAmount: number = 6000) {
  const paid = Math.max(0, Number(amountPaid) || 0);
  const expected = expectedAmount > 0 ? expectedAmount : 6000;

  let emergencyAmount = 0;
  if (paid >= 6000) {
    emergencyAmount = 1000.0;
  } else if (paid > 0) {
    // Proportional allocation: (paid / 6000) * 1000 rounded to 2 decimal places
    emergencyAmount = Math.min(1000.0, Math.round((paid / 6000) * 1000 * 100) / 100);
  } else {
    emergencyAmount = 0.0;
  }

  const generalAmount = Math.max(0, Math.round((paid - emergencyAmount) * 100) / 100);
  const outstandingEmergency = Math.max(0, Math.round((1000.0 - emergencyAmount) * 100) / 100);
  const isReconciled = Math.abs(paid - (generalAmount + emergencyAmount)) < 0.01;
  const difference = Math.round((paid - (generalAmount + emergencyAmount)) * 100) / 100;

  return {
    paidAmount: paid,
    generalAmount,
    emergencyAmount,
    outstandingEmergency,
    isReconciled,
    difference
  };
}

/**
 * Synchronizes a contribution record into the Emergency & Welfare Fund allocation register.
 * 
 * Rules:
 * - Every member contributes KSh 6,000 / month.
 * - When KSh 6,000 is PAID:
 *   - KSh 5,000 to General Company Funds
 *   - KSh 1,000 to Emergency & Welfare Fund
 * - Proportional allocation for partial contributions: (paidAmount / 6000) * 1000
 * - Unpaid / 0 amount: 0 allocation, marked Pending
 * - Reversal / deletion: status 'Reversed', amount 0, transaction marked isReversed
 * - Double-counting prevention: exactly one allocation per member per month/year (enforced by DB unique constraint).
 */
export async function syncContributionToEmergencyFund(
  contributionId: number,
  options?: {
    userEmail?: string | null;
    userName?: string | null;
    isReversal?: boolean;
    reversalReason?: string | null;
  }
) {
  const contribution = await prisma.contribution.findUnique({
    where: { id: contributionId },
    include: { member: true, payments: { orderBy: { id: 'asc' } } }
  });

  if (!contribution || Number(contribution.payout) > 0) {
    return null;
  }

  // Resolve member
  let member = contribution.member;
  if (!member && contribution.memberId) {
    member = await prisma.member.findUnique({ where: { id: contribution.memberId } });
  }
  if (!member && contribution.remarks) {
    const match = String(contribution.remarks).match(/Member:\s*([^)\]]+)/i);
    if (match) {
      const cleanName = match[1].trim().toLowerCase();
      member = await prisma.member.findFirst({
        where: { fullName: { contains: cleanName, mode: 'insensitive' } }
      });
    }
  }

  if (!member) {
    return null;
  }

  const norm = normalizeMonthYear(contribution.month, contribution.year, contribution.monthYear);
  const split = calculateContributionFundSplit(
    Number(contribution.amount) || 0,
    Number(contribution.expectedAmount) || 6000
  );

  let emergencyAllocation = split.emergencyAmount;
  let status = 'Pending';
  let notes = '';

  if (options?.isReversal) {
    emergencyAllocation = 0.0;
    status = 'Reversed';
    notes = options.reversalReason || `Allocation reversed (Contribution payment cancelled/reversed)`;
  } else if (split.paidAmount >= 6000) {
    emergencyAllocation = 1000.0;
    status = 'Allocated';
    notes = `Auto-allocated from KSh 6,000 contribution (${contribution.paymentReference || contribution.customId || 'Paid'})`;
  } else if (split.paidAmount > 0) {
    status = 'Partially Allocated';
    notes = `Partial internal allocation: KSh ${emergencyAllocation.toLocaleString()} allocated (KSh ${split.outstandingEmergency.toLocaleString()} pending full KSh 6,000 contribution)`;
  } else {
    emergencyAllocation = 0.0;
    status = 'Pending';
    notes = `Pending payment of monthly KSh 6,000 contribution`;
  }

  const generalFundsAmount = split.generalAmount;
  const sourceContribution = `Contribution ${contribution.customId || ('CNT-' + contribution.id)} (KES ${split.paidAmount.toLocaleString()} paid: KES ${generalFundsAmount.toLocaleString()} General + KES ${emergencyAllocation.toLocaleString()} Emergency)`;

  const existingAlloc = await prisma.emergencyFundAllocation.findUnique({
    where: {
      memberId_month_year: {
        memberId: member.id,
        month: norm.monthName,
        year: norm.year
      }
    }
  });

  const savedAllocation = await prisma.emergencyFundAllocation.upsert({
    where: {
      memberId_month_year: {
        memberId: member.id,
        month: norm.monthName,
        year: norm.year
      }
    },
    update: {
      amount: emergencyAllocation,
      monthYear: norm.monthYearShort,
      sourceContribution,
      status,
      notes,
      recordedBy: options?.userName || 'System / Auto-Allocated'
    },
    create: {
      memberId: member.id,
      month: norm.monthName,
      year: norm.year,
      monthYear: norm.monthYearShort,
      amount: emergencyAllocation,
      sourceContribution,
      status,
      notes,
      recordedBy: options?.userName || 'System / Auto-Allocated'
    }
  });

  // Update or record transaction in EmergencyFundTransaction ledger
  const txnId = `TXN-ALC-${norm.year}${norm.monthName.substring(0, 3).toUpperCase()}-M00${member.id}`;
  const existingTxn = await prisma.emergencyFundTransaction.findUnique({ where: { id: txnId } });

  const pDateStr = contribution.paymentDate || norm.defaultDateStr;
  const pDate = new Date(pDateStr.includes('T') ? pDateStr : `${pDateStr} UTC`);
  const validPDate = isNaN(pDate.getTime()) ? new Date(norm.year, norm.monthIdx, 1) : pDate;

  if (emergencyAllocation > 0) {
    await prisma.emergencyFundTransaction.upsert({
      where: { id: txnId },
      update: {
        amount: emergencyAllocation,
        isReversed: false,
        reversedAt: null,
        reversalReason: null,
        description: `Monthly internal emergency fund allocation for ${member.fullName} (${norm.monthYearShort}) from KES ${split.paidAmount.toLocaleString()} contribution`,
        paymentReference: contribution.paymentReference || contribution.customId || `ALC-${norm.monthYearShort}-M00${member.id}`,
        performedBy: options?.userName || 'Treasurer'
      },
      create: {
        id: txnId,
        transactionDate: validPDate,
        type: 'ALLOCATION',
        category: 'Fund Capital',
        amount: emergencyAllocation,
        memberId: member.id,
        memberName: member.fullName,
        referenceId: `${norm.monthYearShort}-M00${member.id}`,
        paymentMethod: 'Internal Allocation',
        paymentReference: contribution.paymentReference || contribution.customId || `ALC-${norm.monthYearShort}-M00${member.id}`,
        description: `Monthly internal emergency fund allocation for ${member.fullName} (${norm.monthYearShort}) from KES ${split.paidAmount.toLocaleString()} contribution`,
        performedBy: options?.userName || 'Treasurer'
      }
    });
  } else if (existingTxn) {
    if (options?.isReversal) {
      await prisma.emergencyFundTransaction.update({
        where: { id: txnId },
        data: {
          isReversed: true,
          reversedAt: new Date(),
          reversalReason: options?.reversalReason || 'Contribution reversed'
        }
      });
    } else {
      await prisma.emergencyFundTransaction.update({
        where: { id: txnId },
        data: {
          amount: 0,
          description: `Monthly internal emergency fund allocation pending for ${member.fullName} (${norm.monthYearShort})`
        }
      });
    }
  }

  // Audit Log
  await createAuditLog({
    model: 'EmergencyFundAllocation',
    action: existingAlloc ? (options?.isReversal ? 'Reversed' : 'Updated') : 'Added',
    recordId: savedAllocation.id,
    recordRef: `ALC-${savedAllocation.id}`,
    userEmail: options?.userEmail || null,
    userName: options?.userName || 'System / Auto-Allocated',
    member: member.fullName,
    oldValues: existingAlloc ? { amount: existingAlloc.amount, status: existingAlloc.status } : {},
    newValues: {
      amount: savedAllocation.amount,
      status: savedAllocation.status,
      generalFundsAmount,
      totalContribution: split.paidAmount
    },
    remarks: options?.isReversal
      ? `Reversed Emergency Fund allocation for ${member.fullName} (${norm.monthYearShort})`
      : `Synchronized Emergency Fund allocation of KES ${emergencyAllocation.toLocaleString()} from KES ${split.paidAmount.toLocaleString()} contribution for ${member.fullName} (${norm.monthYearShort})`
  });

  return savedAllocation;
}

/**
 * Synchronizes all eligible member contributions into Emergency Fund allocations.
 */
export async function syncAllContributionsToEmergencyFund(userEmail?: string, userName?: string) {
  const contributions = await prisma.contribution.findMany({
    where: { payout: 0 },
    orderBy: { id: 'asc' }
  });

  let synced = 0;
  for (const c of contributions) {
    if (c.memberId && Number(c.amount) > 0) {
      await syncContributionToEmergencyFund(c.id, { userEmail, userName });
      synced++;
    }
  }
  return synced;
}
