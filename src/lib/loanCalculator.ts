/**
 * Authoritative Loan Portfolio Calculation Engine for Dreamloom Financial BMS
 * Implements:
 * - Accurate monthly anniversary period calculation (excluding incomplete periods, handling 28/29/30/31 month lengths & leap years)
 * - Three interest methods: Simple, Reducing Balance, Compound
 * - Configurable repayment allocation policies (Interest First default, Principal First, Proportional)
 * - Automatic 11-column monthly schedule generation & 15-field individual loan profile summary
 * - Dynamic status determination: Active, Partially Paid, Overdue, Settled
 */

import { MONTH_ABBRS } from './dateUtils';
import { getOfficialLoan } from './officialLoanPortfolio';

export type InterestMethod = 'Simple' | 'Reducing Balance' | 'Compound';
export type AllocationPolicy = 'Interest First' | 'Principal First' | 'Proportional';
export type LoanComputedStatus = 'Active' | 'Partially Paid' | 'Overdue' | 'Settled' | 'Cancelled';

export interface LoanRepaymentInput {
  id?: number | string;
  loanId?: string;
  memberId?: number | null;
  paymentDate: Date | string;
  paymentDateStr?: string;
  amount: number;
  interestAllocated?: number;
  principalAllocated?: number;
  paymentMethod?: string;
  mpesaRef?: string | null;
  bankRef?: string | null;
  reference?: string | null;
  remarks?: string | null;
  recordedBy?: string | null;
}

export interface LoanInput {
  id: string;
  memberId: number;
  memberName?: string;
  issueDate: Date | string;
  principal: number;
  interest?: number;
  totalPayable?: number;
  paidAmount?: number;
  principalPaid?: number;
  interestPaid?: number;
  interestRate?: number;
  interestMethod?: string;
  compoundingFrequency?: string;
  durationMonths?: number;
  completedPeriods?: number | null;
  repaymentTerms?: string | null;
  allocationPolicy?: string;
  purpose?: string | null;
  approvalRef?: string | null;
  remarks?: string | null;
  status?: string;
  clearedDate?: Date | string | null;
  repayments?: LoanRepaymentInput[];
}

export interface LoanScheduleRow {
  monthNumber: number;
  periodStart: string;
  periodEnd: string;
  interestPeriod: string;
  isCompleted: boolean;
  openingPrincipal: number;
  interestCharged: number;
  paymentReceived: number;
  interestPaid: number;
  principalPaid: number;
  closingPrincipal: number;
  outstandingInterest: number;
  totalOutstandingBalance: number;
  paymentStatus: 'Settled' | 'Paid' | 'Partially Paid' | 'Unpaid' | 'In Progress' | 'Scheduled';
}

export interface CalculatedLoanProfile {
  id: string;
  memberId: number;
  memberName: string;
  issueDate: string;
  issueDateFormatted: string;
  originalPrincipal: number;
  monthlyInterestRate: number;
  interestMethod: InterestMethod;
  compoundingFrequency: string;
  loanDuration: number;
  repaymentTerms: string;
  allocationPolicy: AllocationPolicy;
  purpose: string;
  approvalRef: string;
  remarks: string;
  completedPeriods: number | null;
  totalInterestAccrued: number;
  interestPaid: number;
  unpaidInterest: number;
  principalRepaid: number;
  remainingPrincipal: number;
  totalLoanAmount: number;
  totalAmountPaid: number;
  totalOutstandingBalance: number;
  status: LoanComputedStatus;
  settlementDate: string;
  schedule: LoanScheduleRow[];
  repayments: Array<
    LoanRepaymentInput & {
      computedInterestAllocated: number;
      computedPrincipalAllocated: number;
      runningBalanceAfter: number;
    }
  >;
}

/**
 * Normalizes any Date or date string to UTC midnight Date object
 */
export function toUTCMidnight(input: Date | string | null | undefined): Date {
  if (!input) {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
  if (input instanceof Date) {
    if (isNaN(input.getTime())) {
      const now = new Date();
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    }
    return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
  }
  const str = String(input).trim();
  // Match YYYY-MM-DD
  const iso = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    return new Date(Date.UTC(parseInt(iso[1], 10), parseInt(iso[2], 10) - 1, parseInt(iso[3], 10)));
  }
  // Match DD/MM/YYYY or DD-MM-YYYY (numeric British/Kenyan format)
  const dmyNum = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyNum) {
    const day = parseInt(dmyNum[1], 10);
    const month = parseInt(dmyNum[2], 10) - 1;
    const year = parseInt(dmyNum[3], 10);
    return new Date(Date.UTC(year, month, day));
  }
  // Match DD-MMM-YYYY or DD MMM YYYY
  const dmy = str.match(/^(\d{1,2})[-\s]([A-Za-z]{3,})[-\s](\d{4})/);
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const mStr = dmy[2].slice(0, 3).toLowerCase();
    const year = parseInt(dmy[3], 10);
    const mIdx = MONTH_ABBRS.findIndex(m => m.toLowerCase() === mStr);
    if (mIdx >= 0) {
      return new Date(Date.UTC(year, mIdx, day));
    }
  }
  const parsed = new Date(str.includes('T') ? str : `${str} UTC`);
  if (!isNaN(parsed.getTime())) {
    return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
  }
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Formats a UTC Date as YYYY-MM-DD
 */
export function formatISODate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Formats a UTC Date as "15 May 2026"
 */
export function formatDisplayDate(d: Date): string {
  const day = d.getUTCDate();
  const m = MONTH_ABBRS[d.getUTCMonth()];
  const y = d.getUTCFullYear();
  return `${day} ${m} ${y}`;
}

/**
 * Calculates the exact monthly anniversary date for `monthOffset` months after `issueDate`.
 * Properly handles varying month lengths (28, 29 in leap years, 30, 31) and end-of-month dates (29th, 30th, 31st).
 */
export function getAnniversaryDate(issueDate: Date | string, monthOffset: number): Date {
  const start = toUTCMidnight(issueDate);
  if (monthOffset <= 0) return start;

  const startYear = start.getUTCFullYear();
  const startMonth = start.getUTCMonth();
  const startDay = start.getUTCDate();

  const totalMonths = startMonth + monthOffset;
  const targetYear = startYear + Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;

  // Day 0 of (targetMonth + 1) gives the exact number of days in targetMonth (including 29 in leap year Feb)
  const maxDayInTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const targetDay = Math.min(startDay, maxDayInTargetMonth);

  return new Date(Date.UTC(targetYear, targetMonth, targetDay));
}

/**
 * Calculates the number of completed monthly anniversary periods between `issueDate` and `asOfDate`.
 * Strictly excludes incomplete periods.
 */
export function getCompletedMonthlyPeriods(
  issueDate: Date | string,
  asOfDate: Date | string = new Date()
): number {
  const start = toUTCMidnight(issueDate);
  const end = toUTCMidnight(asOfDate);

  if (end.getTime() < start.getTime()) return 0;

  let k = 1;
  while (k <= 240) {
    const anniv = getAnniversaryDate(start, k);
    if (anniv.getTime() <= end.getTime()) {
      k++;
    } else {
      break;
    }
  }
  return k - 1;
}

export function roundCurrency(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

function normalizeInterestMethod(method?: string | null): InterestMethod {
  if (!method) return 'Simple';
  const m = method.toLowerCase().trim();
  if (m.includes('reduc')) return 'Reducing Balance';
  if (m.includes('comp')) return 'Compound';
  return 'Simple';
}

function normalizeAllocationPolicy(policy?: string | null): AllocationPolicy {
  if (!policy) return 'Interest First';
  const p = policy.toLowerCase().trim();
  if (p.includes('principal')) return 'Principal First';
  if (p.includes('prop')) return 'Proportional';
  return 'Interest First';
}

function allocatePaymentAmount(
  paymentAmount: number,
  interestDue: number,
  principalDue: number,
  policy: AllocationPolicy
): { interestPaid: number; principalPaid: number } {
  if (paymentAmount <= 0) return { interestPaid: 0, principalPaid: 0 };

  if (policy === 'Principal First') {
    const principalPaid = roundCurrency(Math.min(principalDue, paymentAmount));
    const rem = roundCurrency(Math.max(0, paymentAmount - principalPaid));
    const interestPaid = roundCurrency(Math.min(interestDue, rem));
    return { interestPaid, principalPaid };
  }

  if (policy === 'Proportional') {
    const totalDue = interestDue + principalDue;
    if (totalDue <= 0) return { interestPaid: 0, principalPaid: 0 };
    if (paymentAmount >= totalDue) {
      return { interestPaid: roundCurrency(interestDue), principalPaid: roundCurrency(principalDue) };
    }
    const interestShare = roundCurrency(paymentAmount * (interestDue / totalDue));
    const interestPaid = Math.min(interestDue, interestShare);
    const principalPaid = roundCurrency(Math.min(principalDue, Math.max(0, paymentAmount - interestPaid)));
    return { interestPaid, principalPaid };
  }

  // Default: Interest First, then Principal
  const interestPaid = roundCurrency(Math.min(interestDue, paymentAmount));
  const rem = roundCurrency(Math.max(0, paymentAmount - interestPaid));
  const principalPaid = roundCurrency(Math.min(principalDue, rem));
  return { interestPaid, principalPaid };
}

/**
 * Main authoritative calculation function for any individual loan
 */
export function calculateLoanProfile(
  loan: LoanInput & { asOfDate?: Date | string | null },
  asOfDateInput?: Date | string | null
): CalculatedLoanProfile {
  // Check if loan is in the Official 14 Loan Portfolio — STRICT NO RECALCULATION
  const official = getOfficialLoan(loan.id);
  if (official) {
    const isSettled = official.status === 'Settled';
    const issueDateUTC = toUTCMidnight(official.issueDateISO);
    const settlementDateUTC = official.settlementDateISO ? toUTCMidnight(official.settlementDateISO) : null;

    const enrichedRepayments: Array<
      LoanRepaymentInput & {
        computedInterestAllocated: number;
        computedPrincipalAllocated: number;
        runningBalanceAfter: number;
      }
    > = [];

    if (official.totalPaid > 0) {
      enrichedRepayments.push({
        id: `REP-${official.id}`,
        loanId: official.id,
        memberId: official.memberId,
        paymentDate: settlementDateUTC || issueDateUTC,
        paymentDateStr: official.settlementDateStr || official.issueDateStr,
        amount: official.totalPaid,
        interestAllocated: official.interestPaid,
        principalAllocated: official.principalRepaid,
        computedInterestAllocated: official.interestPaid,
        computedPrincipalAllocated: official.principalRepaid,
        runningBalanceAfter: 0,
        paymentMethod: 'M-Pesa',
        reference: `HIST-${official.id}`,
        remarks: 'Official Historical Settlement'
      });
    }

    return {
      id: official.id,
      memberId: official.memberId,
      memberName: official.memberName,
      issueDate: official.issueDateStr,
      issueDateFormatted: formatDisplayDate(issueDateUTC),
      originalPrincipal: official.principal,
      monthlyInterestRate: official.monthlyInterestRate,
      interestMethod: official.interestMethod as InterestMethod,
      compoundingFrequency: 'Monthly',
      loanDuration: official.durationMonths,
      repaymentTerms: 'Monthly Anniversary',
      allocationPolicy: 'Interest First',
      purpose: official.purpose,
      approvalRef: official.approvalRef,
      remarks: official.remarks,
      completedPeriods: official.completedPeriods,
      totalInterestAccrued: official.interestAccrued,
      interestPaid: official.interestPaid,
      unpaidInterest: isSettled ? 0 : official.interestAccrued,
      principalRepaid: official.principalRepaid,
      remainingPrincipal: isSettled ? 0 : official.principal,
      totalLoanAmount: official.totalLoanAmount,
      totalAmountPaid: official.totalPaid,
      totalOutstandingBalance: official.outstandingBalance,
      status: official.status,
      settlementDate: official.settlementDateStr || '-',
      schedule: [],
      repayments: enrichedRepayments
    };
  }

  const issueDate = toUTCMidnight(loan.issueDate);
  const effectiveAsOf = asOfDateInput || loan.asOfDate;
  const rawAsOfDate = effectiveAsOf ? toUTCMidnight(effectiveAsOf) : toUTCMidnight(new Date());

  const originalPrincipal = roundCurrency(Number(loan.principal) || 0);
  const monthlyInterestRate =
    loan.interestRate !== undefined && loan.interestRate !== null && !isNaN(Number(loan.interestRate))
      ? Number(loan.interestRate)
      : originalPrincipal > 0 && loan.interest
      ? roundCurrency((Number(loan.interest) / originalPrincipal) * 100)
      : 10.0;

  const rateDecimal = monthlyInterestRate / 100;
  const interestMethod = normalizeInterestMethod(loan.interestMethod);
  const compoundingFrequency = loan.compoundingFrequency || 'Monthly';
  const loanDuration = Math.max(1, Number(loan.durationMonths) || 6);
  const allocationPolicy = normalizeAllocationPolicy(loan.allocationPolicy);

  // Prepare chronological list of repayments on or before rawAsOfDate
  const rawRepayments: LoanRepaymentInput[] = Array.isArray(loan.repayments) ? [...loan.repayments] : [];
  if (rawRepayments.length === 0 && Number(loan.paidAmount) > 0) {
    const fallbackDate =
      loan.clearedDate && String(loan.clearedDate) !== '-'
        ? toUTCMidnight(loan.clearedDate)
        : getAnniversaryDate(issueDate, 1);
    rawRepayments.push({
      id: 0,
      loanId: loan.id,
      memberId: loan.memberId,
      paymentDate: fallbackDate,
      paymentDateStr: formatISODate(fallbackDate),
      amount: roundCurrency(Number(loan.paidAmount)),
      paymentMethod: 'M-Pesa',
      reference: `SET-${loan.id}`,
      remarks: 'Recorded loan payment'
    });
  }

  const validRepayments = rawRepayments
    .map(r => ({
      ...r,
      parsedDate: toUTCMidnight(r.paymentDate || r.paymentDateStr),
      amount: roundCurrency(Number(r.amount) || 0)
    }))
    .filter(r => r.amount > 0 && r.parsedDate.getTime() <= rawAsOfDate.getTime())
    .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

  // Determine effective evaluation date (if loan was settled earlier, stop accruing new interest after settlement date)
  let effectiveAsOfDate = rawAsOfDate;
  if (loan.status === 'Settled' && loan.clearedDate && String(loan.clearedDate) !== '-') {
    const clearedDt = toUTCMidnight(loan.clearedDate);
    if (clearedDt.getTime() < effectiveAsOfDate.getTime()) {
      effectiveAsOfDate = clearedDt;
    }
  }

  const completedPeriodsRaw = getCompletedMonthlyPeriods(issueDate, effectiveAsOfDate);

  // Determine the maximum period index that has either a completed anniversary or active repayments on/before rawAsOfDate
  let maxActivePeriod = completedPeriodsRaw;
  for (const rep of validRepayments) {
    let k = 1;
    while (k <= 240) {
      const kEnd = getAnniversaryDate(issueDate, k);
      if (rep.parsedDate.getTime() <= kEnd.getTime()) {
        if (k > maxActivePeriod) maxActivePeriod = k;
        break;
      }
      k++;
    }
  }

  // Also if settled early in Month 1 with 0 completed periods
  if (maxActivePeriod === 0 && (validRepayments.length > 0 || loan.status === 'Settled')) {
    maxActivePeriod = 1;
  }

  const schedule: LoanScheduleRow[] = [];
  let openingPrincipal = originalPrincipal;
  let carryOverUnpaidInterest = 0;

  let cumulativeInterestAccrued = 0;
  let cumulativeInterestPaid = 0;
  let cumulativePrincipalPaid = 0;

  const usedRepaymentIndices = new Set<number>();
  const enrichedRepayments: Array<
    LoanRepaymentInput & {
      computedInterestAllocated: number;
      computedPrincipalAllocated: number;
      runningBalanceAfter: number;
    }
  > = [];

  const compoundingStep =
    compoundingFrequency === 'Quarterly'
      ? 3
      : compoundingFrequency === 'Semi-Annually'
      ? 6
      : compoundingFrequency === 'Annually'
      ? 12
      : 1;

  const totalScheduleRows = Math.max(maxActivePeriod, loanDuration);

  for (let p = 1; p <= totalScheduleRows; p++) {
    const pStart = getAnniversaryDate(issueDate, p - 1);
    const pEnd = getAnniversaryDate(issueDate, p);
    const isCompletedAnniversary = p <= completedPeriodsRaw;
    const isOngoingActivePeriod = p <= maxActivePeriod;

    // Stop accruing interest if principal & interest were already 100% settled in a prior period
    const alreadySettledPrior =
      p > 1 && openingPrincipal <= 0.005 && carryOverUnpaidInterest <= 0.005;

    const totalRepaidSoFar = validRepayments.reduce((s, r) => s + r.amount, 0);
    const isIncompleteMonth1WithPayment =
      completedPeriodsRaw === 0 &&
      p === 1 &&
      loan.status !== 'Settled' &&
      totalRepaidSoFar <= originalPrincipal;

    let interestCharged = 0;
    if (
      isCompletedAnniversary &&
      !alreadySettledPrior &&
      openingPrincipal > 0.005 &&
      !isIncompleteMonth1WithPayment
    ) {
      if (interestMethod === 'Simple') {
        interestCharged = roundCurrency(originalPrincipal * rateDecimal);
      } else if (interestMethod === 'Reducing Balance') {
        interestCharged = roundCurrency(openingPrincipal * rateDecimal);
      } else {
        // Compound Interest: capitalise unpaid interest according to compoundingFrequency
        const shouldCapitalise = (p - 1) % compoundingStep === 0;
        const baseForCompound = shouldCapitalise
          ? openingPrincipal + carryOverUnpaidInterest
          : openingPrincipal;
        interestCharged = roundCurrency(baseForCompound * rateDecimal);
      }
    }

    // Legacy historical settled loans that had an agreed flat interest amount and no explicit interestRate recorded
    if (
      (loan.interestRate === undefined || loan.interestRate === null) &&
      loan.status === 'Settled' &&
      completedPeriodsRaw <= 1 &&
      p === 1 &&
      loan.interest !== undefined &&
      Number(loan.interest) > 0 &&
      rawRepayments.length <= 1
    ) {
      interestCharged = roundCurrency(Number(loan.interest));
    }

    cumulativeInterestAccrued = roundCurrency(cumulativeInterestAccrued + interestCharged);

    // Gather repayments belonging to period p (or remaining valid repayments if p is the maxActivePeriod or final row)
    const periodRepayments: typeof validRepayments = [];
    validRepayments.forEach((rep, idx) => {
      if (usedRepaymentIndices.has(idx)) return;
      const t = rep.parsedDate.getTime();
      const inWindow =
        p === 1
          ? t <= pEnd.getTime()
          : p === totalScheduleRows || p === maxActivePeriod
          ? t > pStart.getTime() && t <= rawAsOfDate.getTime()
          : t > pStart.getTime() && t <= pEnd.getTime();
      if (inWindow) {
        usedRepaymentIndices.add(idx);
        periodRepayments.push(rep);
      }
    });

    let periodPaymentReceived = 0;
    let periodInterestPaid = 0;
    let periodPrincipalPaid = 0;

    let runningInterestDue = roundCurrency(carryOverUnpaidInterest + interestCharged);
    let runningPrincipalDue = openingPrincipal;

    for (const rep of periodRepayments) {
      const alloc = allocatePaymentAmount(
        rep.amount,
        runningInterestDue,
        runningPrincipalDue,
        allocationPolicy
      );
      runningInterestDue = roundCurrency(Math.max(0, runningInterestDue - alloc.interestPaid));
      runningPrincipalDue = roundCurrency(Math.max(0, runningPrincipalDue - alloc.principalPaid));

      periodPaymentReceived = roundCurrency(periodPaymentReceived + rep.amount);
      periodInterestPaid = roundCurrency(periodInterestPaid + alloc.interestPaid);
      periodPrincipalPaid = roundCurrency(periodPrincipalPaid + alloc.principalPaid);

      enrichedRepayments.push({
        ...rep,
        paymentDateStr: rep.paymentDateStr || formatISODate(rep.parsedDate),
        computedInterestAllocated: alloc.interestPaid,
        computedPrincipalAllocated: alloc.principalPaid,
        runningBalanceAfter: roundCurrency(runningPrincipalDue + runningInterestDue)
      });
    }

    cumulativeInterestPaid = roundCurrency(cumulativeInterestPaid + periodInterestPaid);
    cumulativePrincipalPaid = roundCurrency(cumulativePrincipalPaid + periodPrincipalPaid);

    const closingPrincipal = roundCurrency(Math.max(0, openingPrincipal - periodPrincipalPaid));
    const outstandingInterest = roundCurrency(
      Math.max(0, carryOverUnpaidInterest + interestCharged - periodInterestPaid)
    );
    const totalOutstandingBalance = roundCurrency(closingPrincipal + outstandingInterest);

    let paymentStatus: LoanScheduleRow['paymentStatus'] = 'Unpaid';
    if (totalOutstandingBalance <= 0.005) {
      paymentStatus = 'Settled';
    } else if (periodPaymentReceived > 0 && outstandingInterest <= 0.005) {
      paymentStatus = 'Paid';
    } else if (periodPaymentReceived > 0) {
      paymentStatus = 'Partially Paid';
    } else if (!isCompletedAnniversary) {
      paymentStatus = p === completedPeriodsRaw + 1 ? 'In Progress' : 'Scheduled';
    }

    schedule.push({
      monthNumber: p,
      periodStart: formatISODate(pStart),
      periodEnd: formatISODate(pEnd),
      interestPeriod: `${formatDisplayDate(pStart)} – ${formatDisplayDate(pEnd)}`,
      isCompleted: isCompletedAnniversary || periodPaymentReceived > 0,
      openingPrincipal,
      interestCharged,
      paymentReceived: periodPaymentReceived,
      interestPaid: periodInterestPaid,
      principalPaid: periodPrincipalPaid,
      closingPrincipal,
      outstandingInterest,
      totalOutstandingBalance,
      paymentStatus
    });

    openingPrincipal = closingPrincipal;
    carryOverUnpaidInterest = outstandingInterest;

    // If loan is fully settled during active periods, no further schedule rows needed
    if (totalOutstandingBalance <= 0.005 && isOngoingActivePeriod) {
      break;
    }
  }

  const isCancelled = loan.status === 'Cancelled';
  const remainingPrincipal = isCancelled ? 0 : roundCurrency(Math.max(0, originalPrincipal - cumulativePrincipalPaid));
  const unpaidInterest = isCancelled ? 0 : roundCurrency(Math.max(0, cumulativeInterestAccrued - cumulativeInterestPaid));
  const totalLoanAmount = roundCurrency(originalPrincipal + cumulativeInterestAccrued);
  const totalAmountPaid = roundCurrency(cumulativePrincipalPaid + cumulativeInterestPaid);
  const totalOutstandingBalance = isCancelled ? 0 : roundCurrency(remainingPrincipal + unpaidInterest);

  // Determine authoritative loan status
  let computedStatus: LoanComputedStatus = 'Active';
  if (isCancelled) {
    computedStatus = 'Cancelled';
  } else if (
    totalOutstandingBalance <= 0.005 &&
    (totalAmountPaid >= originalPrincipal || maxActivePeriod > 0)
  ) {
    computedStatus = 'Settled';
  } else if (totalAmountPaid > 0 && totalOutstandingBalance > 0.005) {
    computedStatus = 'Partially Paid';
  } else if (completedPeriodsRaw > loanDuration && totalOutstandingBalance > 0.005) {
    computedStatus = 'Overdue';
  } else {
    computedStatus = 'Active';
  }

  let settlementDate = '-';
  if (computedStatus === 'Settled') {
    if (loan.clearedDate && String(loan.clearedDate) !== '-') {
      settlementDate = formatISODate(toUTCMidnight(loan.clearedDate));
    } else if (enrichedRepayments.length > 0) {
      const lastRep = enrichedRepayments[enrichedRepayments.length - 1];
      settlementDate = lastRep.paymentDateStr || formatISODate(toUTCMidnight(lastRep.paymentDate));
    } else {
      settlementDate = formatISODate(effectiveAsOfDate);
    }
  }

  return {
    id: loan.id,
    memberId: loan.memberId,
    memberName: loan.memberName || 'Member',
    issueDate: formatISODate(issueDate),
    issueDateFormatted: formatDisplayDate(issueDate),
    originalPrincipal,
    monthlyInterestRate,
    interestMethod,
    compoundingFrequency,
    loanDuration,
    repaymentTerms: loan.repaymentTerms || 'Monthly Anniversary',
    allocationPolicy,
    purpose: loan.purpose || 'Personal / Business Development',
    approvalRef: loan.approvalRef || `APR-${loan.id}`,
    remarks: loan.remarks || '',
    completedPeriods: completedPeriodsRaw,
    totalInterestAccrued: cumulativeInterestAccrued,
    interestPaid: cumulativeInterestPaid,
    unpaidInterest,
    principalRepaid: cumulativePrincipalPaid,
    remainingPrincipal,
    totalLoanAmount,
    totalAmountPaid,
    totalOutstandingBalance,
    status: computedStatus,
    settlementDate,
    schedule,
    repayments: enrichedRepayments
  };
}
