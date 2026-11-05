import { prisma } from '../src/lib/prisma';

interface TestResult {
  module: string;
  createPassed: boolean;
  updatePassed: boolean;
  deletePassed: boolean;
  persistenceVerified: boolean;
  details: string;
}

const results: TestResult[] = [];

async function runPersistenceSuite() {
  console.log('================================================================');
  console.log(' DREAMLOOM FINANCIAL SYSTEM - FULL MULTI-MODULE PERSISTENCE TEST ');
  console.log('================================================================\n');

  const testStamp = Date.now().toString().slice(-4);

  // 1. Members
  try {
    console.log('[1/10] Testing Members Persistence...');
    const memberName = `Test Member ${testStamp}`;
    const created = await prisma.member.create({
      data: {
        fullName: memberName,
        nationalId: `ID${testStamp}`,
        phone: `0700${testStamp}`,
        email: `test${testStamp}@dreamloom.co.ke`,
        role: 'Member'
      }
    });
    const found1 = await prisma.member.findUnique({ where: { id: created.id } });
    const createPassed = !!found1 && found1.fullName === memberName;

    const updated = await prisma.member.update({
      where: { id: created.id },
      data: { role: 'Auditor' }
    });
    const found2 = await prisma.member.findUnique({ where: { id: created.id } });
    const updatePassed = !!found2 && found2.role === 'Auditor';

    await prisma.member.delete({ where: { id: created.id } });
    const found3 = await prisma.member.findUnique({ where: { id: created.id } });
    const deletePassed = found3 === null;

    results.push({
      module: 'Members (Member Directory)',
      createPassed,
      updatePassed,
      deletePassed,
      persistenceVerified: createPassed && updatePassed && deletePassed,
      details: `Created id=${created.id}, updated role, deleted cleanly.`
    });
  } catch (err: any) {
    results.push({
      module: 'Members (Member Directory)',
      createPassed: false,
      updatePassed: false,
      deletePassed: false,
      persistenceVerified: false,
      details: err.message
    });
  }

  // 2. Contributions
  try {
    console.log('[2/10] Testing Contributions Persistence...');
    const customId = `CNT-TEST-${testStamp}`;
    const created = await prisma.contribution.create({
      data: {
        customId,
        monthYear: '01-Nov-2026',
        amount: 6000,
        unsettled: 0,
        remarks: 'Persistence Test Contribution'
      }
    });
    const found1 = await prisma.contribution.findUnique({ where: { customId } });
    const createPassed = !!found1 && found1.amount === 6000;

    await prisma.contribution.update({
      where: { customId },
      data: { amount: 7500, remarks: 'Updated Amount' }
    });
    const found2 = await prisma.contribution.findUnique({ where: { customId } });
    const updatePassed = !!found2 && found2.amount === 7500;

    await prisma.contribution.delete({ where: { customId } });
    const found3 = await prisma.contribution.findUnique({ where: { customId } });
    const deletePassed = found3 === null;

    results.push({
      module: 'Contributions (Register & Monthly)',
      createPassed,
      updatePassed,
      deletePassed,
      persistenceVerified: createPassed && updatePassed && deletePassed,
      details: `Created customId=${customId}, updated amount=7500, deleted cleanly.`
    });
  } catch (err: any) {
    results.push({
      module: 'Contributions (Register & Monthly)',
      createPassed: false,
      updatePassed: false,
      deletePassed: false,
      persistenceVerified: false,
      details: err.message
    });
  }

  // 3. Deposits
  try {
    console.log('[3/10] Testing Deposits Persistence...');
    const customId = `DEP-TEST-${testStamp}`;
    const created = await prisma.deposit.create({
      data: {
        customId,
        depositorName: 'Test Depositor',
        date: new Date(),
        amount: 25000,
        transactionType: 'Member Deposit',
        reason: 'Persistence Verification Deposit',
        paymentMethod: 'M-Pesa',
        reference: `REF${testStamp}`,
        receivingAccount: 'Equity Bank 1760287177880'
      }
    });
    const found1 = await prisma.deposit.findUnique({ where: { customId } });
    const createPassed = !!found1 && found1.amount === 25000;

    await prisma.deposit.update({
      where: { customId },
      data: { reconciliationStatus: 'Reconciled', amount: 26000 }
    });
    const found2 = await prisma.deposit.findUnique({ where: { customId } });
    const updatePassed = !!found2 && found2.reconciliationStatus === 'Reconciled' && found2.amount === 26000;

    await prisma.deposit.delete({ where: { customId } });
    const found3 = await prisma.deposit.findUnique({ where: { customId } });
    const deletePassed = found3 === null;

    results.push({
      module: 'Deposits (Register & Reversals)',
      createPassed,
      updatePassed,
      deletePassed,
      persistenceVerified: createPassed && updatePassed && deletePassed,
      details: `Created customId=${customId}, updated status=Reconciled, deleted cleanly.`
    });
  } catch (err: any) {
    results.push({
      module: 'Deposits (Register & Reversals)',
      createPassed: false,
      updatePassed: false,
      deletePassed: false,
      persistenceVerified: false,
      details: err.message
    });
  }

  // 4. Loans
  try {
    console.log('[4/10] Testing Loans Persistence...');
    // Use an existing member for foreign key
    const firstMember = await prisma.member.findFirst();
    if (!firstMember) throw new Error('No member found for loan test');

    const loanId = `L-TEST-${testStamp}`;
    const created = await prisma.loan.create({
      data: {
        id: loanId,
        memberId: firstMember.id,
        issueDate: new Date(),
        principal: 10000,
        interest: 1000,
        totalPayable: 11000,
        status: 'Active',
        paidAmount: 0
      }
    });
    const found1 = await prisma.loan.findUnique({ where: { id: loanId } });
    const createPassed = !!found1 && found1.principal === 10000;

    await prisma.loan.update({
      where: { id: loanId },
      data: { status: 'Settled', paidAmount: 11000 }
    });
    const found2 = await prisma.loan.findUnique({ where: { id: loanId } });
    const updatePassed = !!found2 && found2.status === 'Settled' && found2.paidAmount === 11000;

    await prisma.loan.delete({ where: { id: loanId } });
    const found3 = await prisma.loan.findUnique({ where: { id: loanId } });
    const deletePassed = found3 === null;

    results.push({
      module: 'Loans (Loan Portfolio)',
      createPassed,
      updatePassed,
      deletePassed,
      persistenceVerified: createPassed && updatePassed && deletePassed,
      details: `Created id=${loanId}, toggled to Settled, deleted cleanly.`
    });
  } catch (err: any) {
    results.push({
      module: 'Loans (Loan Portfolio)',
      createPassed: false,
      updatePassed: false,
      deletePassed: false,
      persistenceVerified: false,
      details: err.message
    });
  }

  // 5. Penalties
  try {
    console.log('[5/10] Testing Penalties Persistence...');
    const firstMember = await prisma.member.findFirst();
    if (!firstMember) throw new Error('No member found for penalty test');

    const created = await prisma.penalty.create({
      data: {
        memberId: firstMember.id,
        monthYear: `Month-${testStamp}`,
        dueDate: new Date(),
        dateLevied: new Date(),
        unsettledContribution: 6000,
        penaltyAmount: 500,
        paidAmount: 0,
        remainingBalance: 6500,
        status: 'UNPAID',
        reason: 'Persistence Test Fine',
        duesType: `Test-${testStamp}`
      }
    });
    const found1 = await prisma.penalty.findUnique({ where: { id: created.id } });
    const createPassed = !!found1 && found1.penaltyAmount === 500;

    await prisma.penalty.update({
      where: { id: created.id },
      data: { status: 'PAID', paidAmount: 6500, remainingBalance: 0 }
    });
    const found2 = await prisma.penalty.findUnique({ where: { id: created.id } });
    const updatePassed = !!found2 && found2.status === 'PAID';

    await prisma.penalty.delete({ where: { id: created.id } });
    const found3 = await prisma.penalty.findUnique({ where: { id: created.id } });
    const deletePassed = found3 === null;

    results.push({
      module: 'Fines & Late Payment Penalties',
      createPassed,
      updatePassed,
      deletePassed,
      persistenceVerified: createPassed && updatePassed && deletePassed,
      details: `Created id=${created.id}, settled dues, deleted cleanly.`
    });
  } catch (err: any) {
    results.push({
      module: 'Fines & Late Payment Penalties',
      createPassed: false,
      updatePassed: false,
      deletePassed: false,
      persistenceVerified: false,
      details: err.message
    });
  }

  // 6. Expenses
  try {
    console.log('[6/10] Testing Expenses Persistence...');
    const created = await prisma.expense.create({
      data: {
        expenseDate: new Date(),
        description: `Operational Test Expense ${testStamp}`,
        amount: 3200,
        expenseType: 'Operational',
        referenceDetails: 'Voucher 998'
      }
    });
    const found1 = await prisma.expense.findUnique({ where: { id: created.id } });
    const createPassed = !!found1 && found1.amount === 3200;

    await prisma.expense.update({
      where: { id: created.id },
      data: { amount: 3500, referenceDetails: 'Updated Vendor' }
    });
    const found2 = await prisma.expense.findUnique({ where: { id: created.id } });
    const updatePassed = !!found2 && found2.amount === 3500;

    await prisma.expense.delete({ where: { id: created.id } });
    const found3 = await prisma.expense.findUnique({ where: { id: created.id } });
    const deletePassed = found3 === null;

    results.push({
      module: 'Expenses (Operational Outflows)',
      createPassed,
      updatePassed,
      deletePassed,
      persistenceVerified: createPassed && updatePassed && deletePassed,
      details: `Created id=${created.id}, updated amount=3500, deleted cleanly.`
    });
  } catch (err: any) {
    results.push({
      module: 'Expenses (Operational Outflows)',
      createPassed: false,
      updatePassed: false,
      deletePassed: false,
      persistenceVerified: false,
      details: err.message
    });
  }

  // 7. Investments
  try {
    console.log('[7/10] Testing Investments Persistence...');
    const invId = `INV-TEST-${testStamp}`;
    const created = await prisma.investment.create({
      data: {
        id: invId,
        asset: 'Government Treasury Bonds',
        type: 'Securities',
        capital: 50000,
        status: 'Active',
        expectedReturn: '14%'
      }
    });
    const found1 = await prisma.investment.findUnique({ where: { id: invId } });
    const createPassed = !!found1 && found1.capital === 50000;

    await prisma.investment.update({
      where: { id: invId },
      data: { capital: 60000, status: 'Matured' }
    });
    const found2 = await prisma.investment.findUnique({ where: { id: invId } });
    const updatePassed = !!found2 && found2.capital === 60000 && found2.status === 'Matured';

    await prisma.investment.delete({ where: { id: invId } });
    const found3 = await prisma.investment.findUnique({ where: { id: invId } });
    const deletePassed = found3 === null;

    results.push({
      module: 'Investments (Strategic Capital)',
      createPassed,
      updatePassed,
      deletePassed,
      persistenceVerified: createPassed && updatePassed && deletePassed,
      details: `Created id=${invId}, updated capital=60000, deleted cleanly.`
    });
  } catch (err: any) {
    results.push({
      module: 'Investments (Strategic Capital)',
      createPassed: false,
      updatePassed: false,
      deletePassed: false,
      persistenceVerified: false,
      details: err.message
    });
  }

  // 8. Projects
  try {
    console.log('[8/10] Testing Projects Persistence...');
    const prjId = `PRJ-TEST-${testStamp}`;
    const created = await prisma.project.create({
      data: {
        id: prjId,
        name: 'Land Survey & Boundary Beaconing',
        budget: 45000,
        status: 'Active',
        manager: 'Simon Memia'
      }
    });
    const found1 = await prisma.project.findUnique({ where: { id: prjId } });
    const createPassed = !!found1 && found1.budget === 45000;

    await prisma.project.update({
      where: { id: prjId },
      data: { budget: 48000, status: 'Completed' }
    });
    const found2 = await prisma.project.findUnique({ where: { id: prjId } });
    const updatePassed = !!found2 && found2.status === 'Completed';

    await prisma.project.delete({ where: { id: prjId } });
    const found3 = await prisma.project.findUnique({ where: { id: prjId } });
    const deletePassed = found3 === null;

    results.push({
      module: 'Projects (Operations & Legal)',
      createPassed,
      updatePassed,
      deletePassed,
      persistenceVerified: createPassed && updatePassed && deletePassed,
      details: `Created id=${prjId}, updated status=Completed, deleted cleanly.`
    });
  } catch (err: any) {
    results.push({
      module: 'Projects (Operations & Legal)',
      createPassed: false,
      updatePassed: false,
      deletePassed: false,
      persistenceVerified: false,
      details: err.message
    });
  }

  // 9. Suppliers
  try {
    console.log('[9/10] Testing Suppliers Persistence...');
    const supId = `SUP-TEST-${testStamp}`;
    const created = await prisma.supplier.create({
      data: {
        id: supId,
        name: 'Nairobi Survey Services',
        category: 'Land Conveyancing',
        contact: '0711000000',
        status: 'Active'
      }
    });
    const found1 = await prisma.supplier.findUnique({ where: { id: supId } });
    const createPassed = !!found1 && found1.name === 'Nairobi Survey Services';

    await prisma.supplier.update({
      where: { id: supId },
      data: { contact: '0722000000' }
    });
    const found2 = await prisma.supplier.findUnique({ where: { id: supId } });
    const updatePassed = !!found2 && found2.contact === '0722000000';

    await prisma.supplier.delete({ where: { id: supId } });
    const found3 = await prisma.supplier.findUnique({ where: { id: supId } });
    const deletePassed = found3 === null;

    results.push({
      module: 'Suppliers (Vendors & Legal Partners)',
      createPassed,
      updatePassed,
      deletePassed,
      persistenceVerified: createPassed && updatePassed && deletePassed,
      details: `Created id=${supId}, updated contact, deleted cleanly.`
    });
  } catch (err: any) {
    results.push({
      module: 'Suppliers (Vendors & Legal Partners)',
      createPassed: false,
      updatePassed: false,
      deletePassed: false,
      persistenceVerified: false,
      details: err.message
    });
  }

  // 10. Documents
  try {
    console.log('[10/10] Testing Documents Persistence...');
    const docId = `DOC-TEST-${testStamp}`;
    const created = await prisma.document.create({
      data: {
        id: docId,
        name: 'Survey Beacon Certificate',
        category: 'Statutory',
        link: 'https://dreamloom.co.ke/docs/beacon.pdf',
        status: 'Available'
      }
    });
    const found1 = await prisma.document.findUnique({ where: { id: docId } });
    const createPassed = !!found1 && found1.name === 'Survey Beacon Certificate';

    await prisma.document.update({
      where: { id: docId },
      data: { status: 'Archived' }
    });
    const found2 = await prisma.document.findUnique({ where: { id: docId } });
    const updatePassed = !!found2 && found2.status === 'Archived';

    await prisma.document.delete({ where: { id: docId } });
    const found3 = await prisma.document.findUnique({ where: { id: docId } });
    const deletePassed = found3 === null;

    results.push({
      module: 'Documents (Statutory & Corporate)',
      createPassed,
      updatePassed,
      deletePassed,
      persistenceVerified: createPassed && updatePassed && deletePassed,
      details: `Created id=${docId}, updated status=Archived, deleted cleanly.`
    });
  } catch (err: any) {
    results.push({
      module: 'Documents (Statutory & Corporate)',
      createPassed: false,
      updatePassed: false,
      deletePassed: false,
      persistenceVerified: false,
      details: err.message
    });
  }

  console.log('\n================================================================');
  console.log(' PERSISTENCE TEST RESULTS SUMMARY ACROSS ALL 10 MODULES ');
  console.log('================================================================\n');

  let allPassed = true;
  for (const r of results) {
    const statusIcon = r.persistenceVerified ? '✅ PASS' : '❌ FAIL';
    if (!r.persistenceVerified) allPassed = false;
    console.log(`${statusIcon} | ${r.module.padEnd(36)} | Create: ${r.createPassed ? 'OK' : 'ERR'} | Update: ${r.updatePassed ? 'OK' : 'ERR'} | Delete: ${r.deletePassed ? 'OK' : 'ERR'}`);
    console.log(`       Details: ${r.details}`);
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`OVERALL STATUS: ${allPassed ? '🎉 100% PERSISTENCE VERIFIED ACROSS ALL MODULES' : '⚠️ FAILURES DETECTED'}`);
  console.log('----------------------------------------------------------------\n');
}

runPersistenceSuite()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
