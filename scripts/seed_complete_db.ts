import { PrismaClient } from '@prisma/client';
import {
  initialMembers,
  initialContributions,
  initialLoans,
  initialExpenses,
  initialFines
} from '../src/lib/initialData';
import { normalizeMonthYear } from '../src/lib/dateUtils';
import { ensureDatabaseSchema } from '../src/lib/prisma';

const prisma = new PrismaClient();

function parseCustomDate(dateStr: string): Date {
  if (!dateStr || dateStr === '-') return new Date('2025-10-01T00:00:00.000Z');
  const d = new Date(dateStr + ' UTC');
  if (isNaN(d.getTime())) return new Date('2025-10-01T00:00:00.000Z');
  return d;
}

async function main() {
  console.log('Ensuring schema and seeding authoritative Dreamloom BMS database...');
  await ensureDatabaseSchema();

  // 1. Seed 7 official members preserving exact IDs 1-7
  for (let i = 0; i < initialMembers.length; i++) {
    const m = initialMembers[i];
    const numId = i + 1;
    const user = await prisma.user.upsert({
      where: { username: m.email },
      update: { fullName: m.fullName, role: m.role },
      create: {
        username: m.email,
        passwordHash: 'Dreamloom2026!',
        fullName: m.fullName,
        role: m.role,
        isActive: true,
        mustChangePass: false
      }
    });

    await prisma.member.upsert({
      where: { id: numId },
      update: {
        fullName: m.fullName,
        nationalId: m.nationalId,
        phone: m.phone,
        email: m.email,
        role: m.role,
        userId: user.id
      },
      create: {
        id: numId,
        fullName: m.fullName,
        nationalId: m.nationalId,
        phone: m.phone,
        email: m.email,
        role: m.role,
        userId: user.id
      }
    });
  }
  await prisma.$executeRawUnsafe(`SELECT setval('"Member_id_seq"', (SELECT MAX(id) FROM "Member"));`);
  console.log('✔ Seeded 7 official Dreamloom members (IDs 1–7).');

  const members = await prisma.member.findMany();
  const findMember = (name: string | undefined) => {
    if (!name) return undefined;
    return members.find(
      m =>
        m.fullName.toLowerCase().trim() === name.toLowerCase().trim() ||
        m.fullName.toLowerCase().includes(name.toLowerCase().trim()) ||
        name.toLowerCase().includes(m.fullName.toLowerCase().trim())
    );
  };

  // 2. Seed all initial contributions
  for (const c of initialContributions) {
    const isPayout = (c.payout && c.payout > 0) || c.member.toLowerCase().includes('payout');
    const memberObj = isPayout ? null : findMember(c.member);
    const norm = normalizeMonthYear(null, null, c.month);
    const paidAmt = Number(c.amount) || 0;
    const unsettledAmt = Number(c.unsettled) || 0;
    const expectedAmt = isPayout ? 0 : paidAmt + unsettledAmt > 0 ? paidAmt + unsettledAmt : 6000;
    const status = isPayout
      ? 'Payout'
      : paidAmt >= expectedAmt && expectedAmt > 0
      ? 'Fully Paid'
      : paidAmt > 0
      ? 'Partially Paid'
      : 'Unpaid';

    const contrib = await prisma.contribution.upsert({
      where: { customId: c.id },
      update: {
        memberId: memberObj ? memberObj.id : null,
        monthYear: c.month,
        month: norm.monthName,
        year: norm.year,
        expectedAmount: expectedAmt,
        amount: paidAmt,
        unsettled: unsettledAmt,
        payout: Number(c.payout) || 0,
        paymentDate: paidAmt > 0 ? norm.defaultDateStr : null,
        paymentMethod: 'M-Pesa',
        status,
        remarks: (c as any).notes || (c as any).remarks || ''
      },
      create: {
        customId: c.id,
        memberId: memberObj ? memberObj.id : null,
        monthYear: c.month,
        month: norm.monthName,
        year: norm.year,
        expectedAmount: expectedAmt,
        amount: paidAmt,
        unsettled: unsettledAmt,
        payout: Number(c.payout) || 0,
        paymentDate: paidAmt > 0 ? norm.defaultDateStr : null,
        paymentMethod: 'M-Pesa',
        status,
        remarks: (c as any).notes || (c as any).remarks || ''
      }
    });

    if (!isPayout && paidAmt > 0) {
      const existingPayments = await prisma.contributionPayment.count({
        where: { contributionId: contrib.id }
      });
      if (existingPayments === 0) {
        await prisma.contributionPayment.create({
          data: {
            contributionId: contrib.id,
            memberId: memberObj ? memberObj.id : null,
            amount: paidAmt,
            paymentDate: norm.defaultDateStr,
            paymentMethod: 'M-Pesa',
            reference: `REF-${c.id}`,
            remarks: (c as any).notes || 'Initial recorded contribution payment',
            recordedBy: 'System Seed'
          }
        });
      }
    }
  }
  console.log(`✔ Seeded ${initialContributions.length} historical contribution & payout records.`);

  // 3. Seed all official loans
  for (const l of initialLoans) {
    const memberObj = findMember((l as any).borrower || (l as any).member);
    if (!memberObj) continue;

    const isSettled = l.status === 'Settled';
    const principalPaid = isSettled ? l.principal : 0;
    const interestPaid = isSettled ? l.interest : 0;
    const totalPayable = Number((l as any).totalLoan ?? (l as any).totalPayable ?? l.principal + l.interest);
    const rate = l.principal > 0 ? Math.round((l.interest / l.principal) * 100 * 100) / 100 : 10.0;

    await prisma.loan.upsert({
      where: { id: l.id },
      update: {
        memberId: memberObj.id,
        issueDate: parseCustomDate(l.issueDate),
        principal: l.principal,
        interest: l.interest,
        totalPayable,
        paidAmount: l.paid,
        principalPaid,
        interestPaid,
        interestRate: rate || 10.0,
        interestMethod: 'Simple',
        compoundingFrequency: 'Monthly',
        durationMonths: 6,
        repaymentTerms: 'Monthly Anniversary',
        allocationPolicy: 'Interest First',
        purpose: 'Member Credit Facility',
        approvalRef: `APR-${l.id}`,
        status: l.status,
        clearedDate: l.clearedDate && l.clearedDate !== '-' ? parseCustomDate(l.clearedDate) : null
      },
      create: {
        id: l.id,
        memberId: memberObj.id,
        issueDate: parseCustomDate(l.issueDate),
        principal: l.principal,
        interest: l.interest,
        totalPayable,
        paidAmount: l.paid,
        principalPaid,
        interestPaid,
        interestRate: rate || 10.0,
        interestMethod: 'Simple',
        compoundingFrequency: 'Monthly',
        durationMonths: 6,
        repaymentTerms: 'Monthly Anniversary',
        allocationPolicy: 'Interest First',
        purpose: 'Member Credit Facility',
        approvalRef: `APR-${l.id}`,
        status: l.status,
        clearedDate: l.clearedDate && l.clearedDate !== '-' ? parseCustomDate(l.clearedDate) : null
      }
    });

    if (isSettled && l.paid > 0) {
      const existingRepayments = await prisma.loanRepayment.count({
        where: { loanId: l.id }
      });
      if (existingRepayments === 0) {
        await prisma.loanRepayment.create({
          data: {
            loanId: l.id,
            memberId: memberObj.id,
            paymentDate: l.clearedDate && l.clearedDate !== '-' ? parseCustomDate(l.clearedDate) : parseCustomDate(l.issueDate),
            paymentDateStr: l.clearedDate && l.clearedDate !== '-' ? l.clearedDate : l.issueDate,
            amount: l.paid,
            interestAllocated: l.interest,
            principalAllocated: l.principal,
            paymentMethod: 'M-Pesa',
            mpesaRef: `SET-${l.id}`,
            reference: `SET-${l.id}`,
            remarks: 'Full loan settlement',
            recordedBy: 'System Seed'
          }
        });
      }
    }
  }
  console.log(`✔ Seeded ${initialLoans.length} official loans.`);

  // 4. Seed Expenses if empty
  const expCount = await prisma.expense.count();
  if (expCount === 0) {
    for (const e of initialExpenses) {
      await prisma.expense.create({
        data: {
          expenseDate: parseCustomDate(e.date),
          description: e.description,
          amount: e.amount,
          expenseType: (e as any).category || (e as any).type || 'Operational',
          referenceDetails: (e as any).paidTo || (e as any).ref || ''
        }
      });
    }
    console.log(`✔ Seeded ${initialExpenses.length} expenses.`);
  }

  // 5. Seed Penalties/Fines if empty
  const penCount = await prisma.penalty.count();
  if (penCount === 0) {
    for (const f of initialFines) {
      const memberObj = findMember(f.member);
      if (!memberObj) continue;
      const unsettledContrib = Math.max(0, (f.totalWithContrib || 6500) - f.amount);
      const isPaid = f.status === 'Paid';
      await prisma.penalty.upsert({
        where: {
          memberId_monthYear_duesType: {
            memberId: memberObj.id,
            monthYear: f.date,
            duesType: 'Contribution & Fine'
          }
        },
        update: {},
        create: {
          memberId: memberObj.id,
          monthYear: f.date,
          dueDate: parseCustomDate(f.date),
          dateLevied: parseCustomDate(f.date),
          unsettledContribution: unsettledContrib,
          penaltyAmount: f.amount,
          paidAmount: isPaid ? f.totalWithContrib : 0,
          paidContribution: isPaid ? unsettledContrib : 0,
          paidFine: isPaid ? f.amount : 0,
          remainingBalance: isPaid ? 0 : f.totalWithContrib,
          status: isPaid ? 'PAID' : 'UNPAID',
          reason: f.reason,
          duesType: 'Contribution & Fine',
          datePaid: f.datePaid
        }
      });
    }
    console.log(`✔ Seeded ${initialFines.length} penalties.`);
  }

  // 6. Seed Official Strategic Investments
  const initialInvestments = [
    { id: 'INV-01', asset: 'Mawega Land Parcel', type: 'Real Estate', capital: 340000.00, status: 'Active', expectedReturn: '15%' },
    { id: 'INV-02', asset: 'Equity Bank Primary Liquidity', type: 'Treasury & Reserves', capital: 51850.00, status: 'Active', expectedReturn: '12%' },
  ];
  for (const inv of initialInvestments) {
    await prisma.investment.upsert({
      where: { id: inv.id },
      update: inv,
      create: inv
    });
  }
  console.log(`✔ Seeded ${initialInvestments.length} official investments.`);

  // 7. Seed Official Operations & Legal Projects
  const initialProjects = [
    { id: 'PRJ-01', name: 'Mawega Land Title Processing & Survey Works', budget: 40000.00, status: 'Active', manager: 'Elijah Waitara & Daniel Kamau' },
    { id: 'PRJ-02', name: 'Company Statutory Registration (CR12 & KRA PIN)', budget: 15514.00, status: 'Completed', manager: 'Simon Memia Wanjiru' },
  ];
  for (const prj of initialProjects) {
    await prisma.project.upsert({
      where: { id: prj.id },
      update: prj,
      create: prj
    });
  }
  console.log(`✔ Seeded ${initialProjects.length} official projects.`);

  // 8. Seed Official Suppliers
  const initialSuppliers = [
    { id: 'SUP-01', name: 'Mawega Land Registry Office', category: 'Conveyancing & Land Registry', contact: 'Nairobi Office', status: 'Active' },
    { id: 'SUP-02', name: 'Equity Bank Kenya Limited', category: 'Banking & Financial Operations', contact: 'A/C 1760287177880', status: 'Active' },
  ];
  for (const sup of initialSuppliers) {
    await prisma.supplier.upsert({
      where: { id: sup.id },
      update: sup,
      create: sup
    });
  }
  console.log(`✔ Seeded ${initialSuppliers.length} official suppliers.`);

  // 9. Seed Official Documents
  const initialDocuments = [
    { id: 'DOC-01', name: 'Company Registration Certificate', category: 'Statutory', link: '#', status: 'Available' },
    { id: 'DOC-02', name: 'KRA Pin Certificate', category: 'Statutory', link: '#', status: 'Available' },
    { id: 'DOC-03', name: 'CR12 Official Search 2026', category: 'Statutory', link: '#', status: 'Available' },
    { id: 'DOC-04', name: 'Mawega Land Sale & Conveyancing Agreement', category: 'Legal Contract', link: '#', status: 'Available' },
    { id: 'DOC-05', name: 'Official Membership & Contact Directory', category: 'Governance', link: '#', status: 'Available' },
  ];
  for (const doc of initialDocuments) {
    await prisma.document.upsert({
      where: { id: doc.id },
      update: doc,
      create: doc
    });
  }
  console.log(`✔ Seeded ${initialDocuments.length} official documents.`);

  // 10. Seed Official Assets
  const initialAssets = [
    { id: 'AST-01', name: 'Mawega Land Parcel (Title Processing)', category: 'Real Estate & Land', valuation: 340000.00, location: 'Mawega, Kenya', status: 'Active' },
    { id: 'AST-02', name: 'Equity Bank Corporate Reserve Account', category: 'Liquid Treasury Asset', valuation: 51850.00, location: 'Equity Bank (A/C 1760287177880)', status: 'Active' },
  ];
  for (const ast of initialAssets) {
    await prisma.asset.upsert({
      where: { id: ast.id },
      update: ast,
      create: ast
    });
  }
  console.log(`✔ Seeded ${initialAssets.length} official corporate assets.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
