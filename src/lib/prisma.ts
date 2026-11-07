import { PrismaClient } from '@prisma/client';
import { initialContributions } from './initialData';
import { normalizeMonthYear } from './dateUtils';

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
        ADD COLUMN IF NOT EXISTS "remarks" TEXT;
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

    // 6. Ensure official loans are present if Loan table is empty
    const loanCount = await prisma.loan.count();
    if (loanCount === 0) {
      const { initialLoans } = await import('./initialData');
      const members = await prisma.member.findMany();
      for (const l of initialLoans) {
        const borrowerName = (l as any).borrower || (l as any).member || '';
        const memberObj = members.find(
          m =>
            m.fullName.toLowerCase().trim() === borrowerName.toLowerCase().trim() ||
            m.fullName.toLowerCase().includes(borrowerName.toLowerCase().trim())
        );
        if (!memberObj) continue;
        const isSettled = l.status === 'Settled';
        const totalPayable = Number((l as any).totalLoan ?? l.principal + l.interest);
        const rate = l.principal > 0 ? Math.round((l.interest / l.principal) * 100 * 100) / 100 : 10.0;
        const issueDt = new Date(l.issueDate + ' UTC');
        const clearedDt =
          l.clearedDate && l.clearedDate !== '-' ? new Date(l.clearedDate + ' UTC') : null;

        await prisma.loan.create({
          data: {
            id: l.id,
            memberId: memberObj.id,
            issueDate: isNaN(issueDt.getTime()) ? new Date('2026-01-14T00:00:00.000Z') : issueDt,
            principal: l.principal,
            interest: l.interest,
            totalPayable,
            paidAmount: l.paid,
            principalPaid: isSettled ? l.principal : 0,
            interestPaid: isSettled ? l.interest : 0,
            interestRate: rate || 10.0,
            interestMethod: 'Simple',
            compoundingFrequency: 'Monthly',
            durationMonths: 6,
            repaymentTerms: 'Monthly Anniversary',
            allocationPolicy: 'Interest First',
            purpose: 'Member Credit Facility',
            approvalRef: `APR-${l.id}`,
            status: l.status,
            clearedDate: clearedDt && !isNaN(clearedDt.getTime()) ? clearedDt : null
          }
        });
      }
    }

    globalForPrisma.schemaEnsured = true;
  } catch (err) {
    console.error('Warning during ensureDatabaseSchema:', err);
  }
}

export { prisma };
