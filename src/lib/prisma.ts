import { PrismaClient } from '@prisma/client';
import { initialContributions } from './initialData';
import { normalizeMonthYear } from './dateUtils';
import { OFFICIAL_LOAN_PORTFOLIO } from './officialLoanPortfolio';
import { toUTCMidnight } from './loanCalculator';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  schemaEnsured: boolean | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Idempotently ensures the PostgreSQL schema has all columns and tables required
 * for the upgraded Loan Portfolio and Contributions modules, and repairs any legacy
 * Contribution rows missing memberId, month, or year without deleting existing data.
 */
export async function ensureDatabaseSchema(): Promise<void> {
  if (globalForPrisma.schemaEnsured) return;
  try {
    // 1. Extend Contribution table idempotently
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Contribution"
        ADD COLUMN IF NOT EXISTS "month" TEXT,
        ADD COLUMN IF NOT EXISTS "year" INTEGER,
        ADD COLUMN IF NOT EXISTS "expectedAmount" DOUBLE PRECISION NOT NULL DEFAULT 6000.0,
        ADD COLUMN IF NOT EXISTS "creditBalance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
        ADD COLUMN IF NOT EXISTS "paymentDate" TEXT,
        ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT DEFAULT 'M-Pesa',
        ADD COLUMN IF NOT EXISTS "mpesaRef" TEXT,
        ADD COLUMN IF NOT EXISTS "bankRef" TEXT,
        ADD COLUMN IF NOT EXISTS "paymentReference" TEXT,
        ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'Unpaid';
    `);

    // 2. Create ContributionPayment table idempotently
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ContributionPayment" (
        "id" SERIAL NOT NULL,
        "contributionId" INTEGER NOT NULL,
        "memberId" INTEGER,
        "amount" DOUBLE PRECISION NOT NULL,
        "paymentDate" TEXT NOT NULL,
        "paymentMethod" TEXT NOT NULL DEFAULT 'M-Pesa',
        "mpesaRef" TEXT,
        "bankRef" TEXT,
        "reference" TEXT,
        "remarks" TEXT,
        "recordedBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ContributionPayment_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "ContributionPayment_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "ContributionPayment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);

    // 3. Extend Loan table idempotently
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Loan"
        ADD COLUMN IF NOT EXISTS "principalPaid" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
        ADD COLUMN IF NOT EXISTS "interestPaid" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
        ADD COLUMN IF NOT EXISTS "interestRate" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
        ADD COLUMN IF NOT EXISTS "interestMethod" TEXT NOT NULL DEFAULT 'Simple',
        ADD COLUMN IF NOT EXISTS "compoundingFrequency" TEXT NOT NULL DEFAULT 'Monthly',
        ADD COLUMN IF NOT EXISTS "durationMonths" INTEGER NOT NULL DEFAULT 6,
        ADD COLUMN IF NOT EXISTS "repaymentTerms" TEXT DEFAULT 'Monthly Anniversary',
        ADD COLUMN IF NOT EXISTS "allocationPolicy" TEXT NOT NULL DEFAULT 'Interest First',
        ADD COLUMN IF NOT EXISTS "purpose" TEXT DEFAULT 'Personal / Business Development',
        ADD COLUMN IF NOT EXISTS "approvalRef" TEXT,
        ADD COLUMN IF NOT EXISTS "remarks" TEXT,
        ADD COLUMN IF NOT EXISTS "completedPeriods" INTEGER;
    `);

    // 4. Create LoanRepayment table idempotently
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LoanRepayment" (
        "id" SERIAL NOT NULL,
        "loanId" TEXT NOT NULL,
        "memberId" INTEGER,
        "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "paymentDateStr" TEXT NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "interestAllocated" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
        "principalAllocated" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
        "paymentMethod" TEXT NOT NULL DEFAULT 'M-Pesa',
        "mpesaRef" TEXT,
        "bankRef" TEXT,
        "reference" TEXT,
        "remarks" TEXT,
        "recordedBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "LoanRepayment_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "LoanRepayment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "LoanRepayment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);

    // 4b. Create PageAppearance table idempotently for persistent per-page customisation
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PageAppearance" (
        "id" SERIAL NOT NULL,
        "userId" TEXT NOT NULL,
        "pageKey" TEXT NOT NULL,
        "settings" JSONB NOT NULL,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PageAppearance_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "PageAppearance_user_page_idx" ON "PageAppearance" ("userId", "pageKey")
    `);

    // 5. Backfill any legacy Contribution rows missing memberId, month, or year
    const legacyRows = await prisma.contribution.findMany({
      where: {
        OR: [{ month: null }, { year: null }, { memberId: null }]
      }
    });

    if (legacyRows.length > 0) {
      const members = await prisma.member.findMany();
      const customIdToInit = new Map<string, (typeof initialContributions)[number]>();
      for (const ic of initialContributions) {
        customIdToInit.set(ic.id, ic);
      }

      for (const row of legacyRows) {
        let resolvedMemberId = row.memberId;
        const initMatch = row.customId ? customIdToInit.get(row.customId) : undefined;

        if (!resolvedMemberId && initMatch && !initMatch.payout) {
          const matchedMember = members.find(
            m => m.fullName.toLowerCase().trim() === initMatch.member.toLowerCase().trim()
          );
          if (matchedMember) {
            resolvedMemberId = matchedMember.id;
          }
        }

        const norm = normalizeMonthYear(row.month, row.year, row.monthYear);
        const isPayout = (row.payout && row.payout > 0) || (initMatch && initMatch.payout > 0);
        const paidAmt = Number(row.amount) || 0;
        const unsettledAmt = Number(row.unsettled) || 0;
        const expectedAmt = isPayout
          ? 0
          : paidAmt + unsettledAmt > 0
          ? paidAmt + unsettledAmt
          : 6000;
        const computedStatus = isPayout
          ? 'Payout'
          : paidAmt >= expectedAmt && expectedAmt > 0
          ? 'Fully Paid'
          : paidAmt > 0
          ? 'Partially Paid'
          : 'Unpaid';

        await prisma.contribution.update({
          where: { id: row.id },
          data: {
            memberId: resolvedMemberId,
            month: norm.monthName,
            year: norm.year,
            expectedAmount: expectedAmt,
            status: row.status && row.status !== 'Unpaid' ? row.status : computedStatus,
            paymentDate: row.paymentDate || (paidAmt > 0 ? norm.defaultDateStr : null),
            paymentReference: row.paymentReference || row.mpesaRef || row.bankRef || null
          }
        });
      }
    }

    // 5b. Ensure Simon Memia Wanjiru's authoritative December 2025 record (CNT-016) exists and is properly linked
    try {
      const simonMember = await prisma.member.findFirst({
        where: {
          OR: [
            { id: 1 },
            { fullName: { contains: 'Simon Memia', mode: 'insensitive' } }
          ]
        }
      });

      if (simonMember) {
        const existingSimonDec = await prisma.contribution.findFirst({
          where: {
            OR: [
              { customId: 'CNT-016' },
              { memberId: simonMember.id, month: 'December', year: 2025 },
              { remarks: { contains: 'Simon Memia' }, month: 'December', year: 2025 }
            ]
          }
        });

        if (!existingSimonDec) {
          const createdDec = await prisma.contribution.create({
            data: {
              customId: 'CNT-016',
              memberId: simonMember.id,
              month: 'December',
              year: 2025,
              monthYear: 'Dec 2025',
              expectedAmount: 6000.0,
              amount: 6000.0,
              unsettled: 0.0,
              creditBalance: 0.0,
              payout: 0.0,
              paymentDate: '01-Dec-2025',
              paymentMethod: 'M-Pesa',
              paymentReference: 'CNT-016-REF',
              status: 'Fully Paid',
              remarks: 'Monthly Contribution (Member: Simon Memia Wanjiru)'
            }
          });

          await prisma.contributionPayment.create({
            data: {
              contributionId: createdDec.id,
              memberId: simonMember.id,
              amount: 6000.0,
              paymentDate: '01-Dec-2025',
              paymentMethod: 'M-Pesa',
              reference: 'CNT-016-REF',
              remarks: 'Monthly Contribution (Member: Simon Memia Wanjiru)',
              recordedBy: 'System'
            }
          });
        } else if (!existingSimonDec.memberId || existingSimonDec.customId !== 'CNT-016') {
          await prisma.contribution.update({
            where: { id: existingSimonDec.id },
            data: {
              memberId: simonMember.id,
              customId: existingSimonDec.customId || 'CNT-016',
              month: 'December',
              year: 2025,
              monthYear: 'Dec 2025'
            }
          });
        }
      }
    } catch (e) {
      console.error('Error ensuring CNT-016 contribution record:', e);
    }

    // 6. STRICT OFFICIAL LOAN PORTFOLIO SYNC (Exact 14 Records from PDF/Excel)
    await syncOfficialLoansDataset();

    // 7. Ensure unique constraint & performance indexes exist idempotently
    const indexQueries = [
      `CREATE UNIQUE INDEX IF NOT EXISTS "Contribution_memberId_month_year_key" ON "Contribution"("memberId", "month", "year")`,
      `CREATE INDEX IF NOT EXISTS "Contribution_month_year_idx" ON "Contribution"("month", "year")`,
      `CREATE INDEX IF NOT EXISTS "ContributionPayment_contributionId_idx" ON "ContributionPayment"("contributionId")`,
      `CREATE INDEX IF NOT EXISTS "ContributionPayment_memberId_idx" ON "ContributionPayment"("memberId")`,
      `CREATE INDEX IF NOT EXISTS "Loan_memberId_idx" ON "Loan"("memberId")`,
      `CREATE INDEX IF NOT EXISTS "Loan_status_idx" ON "Loan"("status")`,
      `CREATE INDEX IF NOT EXISTS "LoanRepayment_loanId_idx" ON "LoanRepayment"("loanId")`,
      `CREATE INDEX IF NOT EXISTS "LoanRepayment_memberId_idx" ON "LoanRepayment"("memberId")`
    ];
    for (const q of indexQueries) {
      await prisma.$executeRawUnsafe(q);
    }

    globalForPrisma.schemaEnsured = true;
  } catch (err) {
    console.error('Warning during ensureDatabaseSchema:', err);
  }
}

/**
 * Synchronizes the Loan Portfolio table to contain strictly the 14 official loan records from PDF/Excel.
 * Completely replaces existing loans and loan repayments with the authoritative historical records.
 * Preserves all exact figures, decimal values, issue dates (02/07/2026 for L1076), and settlement dates.
 */
export async function syncOfficialLoansDataset(force: boolean = false): Promise<void> {
  try {
    const existingLoans = await prisma.loan.findMany({
      select: {
        id: true,
        status: true,
        principal: true,
        interest: true,
        totalPayable: true,
        completedPeriods: true
      }
    });
    const officialIds = new Set(OFFICIAL_LOAN_PORTFOLIO.map(l => l.id.toLowerCase()));

    // Check if exactly 14 records exist and their key figures match
    let isExact14 =
      existingLoans.length === 14 &&
      existingLoans.every(l => officialIds.has(l.id.toLowerCase()));

    if (isExact14 && !force) {
      for (const item of OFFICIAL_LOAN_PORTFOLIO) {
        const found = existingLoans.find(el => el.id.toLowerCase() === item.id.toLowerCase());
        if (
          !found ||
          found.status !== item.status ||
          Math.abs(found.principal - item.principal) > 0.01 ||
          Math.abs(found.interest - item.interestAccrued) > 0.01 ||
          Math.abs(found.totalPayable - item.totalLoanAmount) > 0.01
        ) {
          isExact14 = false;
          break;
        }
      }
    }

    if (!isExact14 || force) {
      console.log('[Official Loans Sync] Replacing Loan Portfolio dataset with the 14 official records from PDF...');

      // 1. Remove all existing repayments and loans
      await prisma.loanRepayment.deleteMany({});
      await prisma.loan.deleteMany({});

      // 2. Insert the 14 official records in exact descending order of issue date
      for (const item of OFFICIAL_LOAN_PORTFOLIO) {
        const issueDateUTC = toUTCMidnight(item.issueDateISO);
        const settlementDateUTC = item.settlementDateISO ? toUTCMidnight(item.settlementDateISO) : null;

        await prisma.loan.create({
          data: {
            id: item.id,
            memberId: item.memberId,
            issueDate: issueDateUTC,
            principal: item.principal,
            interest: item.interestAccrued,
            totalPayable: item.totalLoanAmount,
            paidAmount: item.totalPaid,
            principalPaid: item.principalRepaid,
            interestPaid: item.interestPaid,
            interestRate: item.monthlyInterestRate,
            interestMethod: item.interestMethod,
            compoundingFrequency: 'Monthly',
            durationMonths: item.durationMonths,
            repaymentTerms: 'Monthly Anniversary',
            allocationPolicy: 'Interest First',
            purpose: item.purpose,
            approvalRef: item.approvalRef,
            remarks: item.remarks,
            status: item.status,
            clearedDate: settlementDateUTC,
            completedPeriods: item.completedPeriods
          }
        });

        if (item.totalPaid > 0) {
          await prisma.loanRepayment.create({
            data: {
              loanId: item.id,
              memberId: item.memberId,
              paymentDate: settlementDateUTC || issueDateUTC,
              paymentDateStr: item.settlementDateStr || item.issueDateStr,
              amount: item.totalPaid,
              interestAllocated: item.interestPaid,
              principalAllocated: item.principalRepaid,
              paymentMethod: 'M-Pesa',
              reference: `SET-${item.id}`,
              remarks: 'Official Historical Settlement',
              recordedBy: 'Official Records'
            }
          });
        }
      }
      console.log('[Official Loans Sync] Successfully replaced loan portfolio with 14 official records.');
    }
  } catch (err) {
    console.error('Error during syncOfficialLoansDataset:', err);
  }
}

export { prisma };
