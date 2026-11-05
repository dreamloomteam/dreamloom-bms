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
