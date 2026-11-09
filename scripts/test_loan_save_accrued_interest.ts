import { prisma, ensureDatabaseSchema } from '../src/lib/prisma';
import {
  calculateLoanProfile,
  toUTCMidnight,
  formatISODate,
  getCompletedMonthlyPeriods
} from '../src/lib/loanCalculator';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

async function run() {
  console.log('========================================================================');
  console.log(' DREAMLOOM FINANCIAL — CRITICAL LOAN INTEREST CALCULATION & SAVE TEST');
  console.log('========================================================================\n');

  await ensureDatabaseSchema();

  // Test 1: Authoritative Calculation Engine Verification
  console.log('--- 1. Testing Authoritative Calculation Engine (Prompt Spec) ---');
  const asOfDate = toUTCMidnight('2026-11-09');
  const issueDate3MonthsAgo = toUTCMidnight('2026-08-09');
  const issueDateToday = toUTCMidnight('2026-11-09');

  const completed3 = getCompletedMonthlyPeriods(issueDate3MonthsAgo, asOfDate);
  assert(completed3 === 3, 'Completed months between 2026-08-09 and 2026-11-09 is 3', `Got ${completed3}`);

  const profile3 = calculateLoanProfile({
    id: 'TEST-PREVIEW-3M',
    memberId: 1,
    memberName: 'Simon Memia Wanjiru',
    issueDate: issueDate3MonthsAgo,
    principal: 10000,
    interestRate: 10,
    interestMethod: 'Simple',
    durationMonths: 6,
    status: 'Active',
    repayments: []
  }, asOfDate);

  assert(profile3.completedPeriods === 3, 'Profile completed periods is 3');
  assert(profile3.totalInterestAccrued === 3000, 'Calculated interest for 3 completed months = KES 3,000', `Got ${profile3.totalInterestAccrued}`);
  assert(profile3.totalLoanAmount === 13000, 'Total loan payable for 3 completed months = KES 13,000', `Got ${profile3.totalLoanAmount}`);
  assert(profile3.monthlyInterestRate === 10, 'Monthly rate preserved as 10%');

  // Test 0 completed months
  const completed0 = getCompletedMonthlyPeriods(issueDateToday, asOfDate);
  assert(completed0 === 0, 'Completed months for loan issued today is 0', `Got ${completed0}`);

  const profile0 = calculateLoanProfile({
    id: 'TEST-PREVIEW-0M',
    memberId: 1,
    memberName: 'Simon Memia Wanjiru',
    issueDate: issueDateToday,
    principal: 10000,
    interestRate: 10,
    interestMethod: 'Simple',
    durationMonths: 6,
    status: 'Active',
    repayments: []
  }, asOfDate);

  assert(profile0.completedPeriods === 0, 'Profile completed periods is 0');
  assert(profile0.totalInterestAccrued === 0, 'Calculated interest for 0 completed months = KES 0', `Got ${profile0.totalInterestAccrued}`);
  assert(profile0.totalLoanAmount === 10000, 'Total loan payable for 0 completed months = KES 10,000 (equal to principal)', `Got ${profile0.totalLoanAmount}`);
  assert(profile0.monthlyInterestRate === 10, 'Selected rate preserved as 10% (NOT 0%)');

  // Test 2: Database Persistence & API Simulation
  console.log('\n--- 2. Testing Database Persistence of Saved Loan (3 Completed Months) ---');
  const member = await prisma.member.findFirst({ where: { fullName: { contains: 'Simon Memia' } } });
  if (!member) {
    console.error('Member Simon Memia Wanjiru not found in DB!');
    process.exit(1);
  }

  const testLoanId = `TEST-SAVE-3M-${Date.now().toString().slice(-4)}`;

  // Simulating POST /api/loans logic
  const tempProfile3 = calculateLoanProfile({
    id: testLoanId,
    memberId: member.id,
    memberName: member.fullName,
    issueDate: issueDate3MonthsAgo,
    principal: 10000,
    interestRate: 10,
    interestMethod: 'Simple',
    durationMonths: 6,
    status: 'Active',
    repayments: []
  }, asOfDate);

  const createdLoan3 = await prisma.loan.create({
    data: {
      id: testLoanId,
      memberId: member.id,
      issueDate: issueDate3MonthsAgo,
      principal: 10000,
      interest: tempProfile3.totalInterestAccrued,
      totalPayable: tempProfile3.totalLoanAmount,
      paidAmount: 0,
      interestPaid: 0,
      principalPaid: 0,
      interestRate: 10,
      interestMethod: tempProfile3.interestMethod,
      compoundingFrequency: 'Monthly',
      durationMonths: 6,
      repaymentTerms: 'Monthly Anniversary',
      allocationPolicy: tempProfile3.allocationPolicy,
      purpose: 'Verification Test',
      approvalRef: `APR-${testLoanId}`,
      status: 'Active'
    }
  });

  // Verify DB record directly
  const dbSaved3 = await prisma.loan.findUnique({
    where: { id: testLoanId },
    include: { member: true, repayments: true }
  });

  assert(dbSaved3 !== null, `Loan ${testLoanId} saved in PostgreSQL`);
  assert(Number(dbSaved3?.principal) === 10000, 'DB Principal = KES 10,000', `Got ${dbSaved3?.principal}`);
  assert(Number(dbSaved3?.interestRate) === 10, 'DB Interest Rate = 10%', `Got ${dbSaved3?.interestRate}`);
  assert(dbSaved3?.interestMethod === 'Simple', 'DB Interest Method = Simple', `Got ${dbSaved3?.interestMethod}`);
  assert(Number(dbSaved3?.interest) === 3000, 'DB Stored Interest = KES 3,000 (NOT 0!)', `Got ${dbSaved3?.interest}`);
  assert(Number(dbSaved3?.totalPayable) === 13000, 'DB Stored Total Payable = KES 13,000 (NOT 10,000!)', `Got ${dbSaved3?.totalPayable}`);

  // Test 3: Simulating Loan Portfolio Register Evaluation
  console.log('\n--- 3. Testing Loan Portfolio Register Retrieval with Valuation Date ---');
  const evaluated3 = calculateLoanProfile({
    ...dbSaved3!,
    memberName: dbSaved3!.member?.fullName || 'Member',
    repayments: dbSaved3!.repayments
  }, asOfDate);

  assert(evaluated3.totalInterestAccrued === 3000, 'Register Interest Accrued column displays KES 3,000', `Got ${evaluated3.totalInterestAccrued}`);
  assert(evaluated3.totalLoanAmount === 13000, 'Register Total Loan column displays KES 13,000', `Got ${evaluated3.totalLoanAmount}`);
  assert(evaluated3.totalOutstandingBalance === 13000, 'Register Outstanding Balance displays KES 13,000', `Got ${evaluated3.totalOutstandingBalance}`);

  // Test 4: Testing Rate Modification (PUT)
  console.log('\n--- 4. Testing Loan Edit (Rate Changed from 10% to 15%) ---');
  const newRate = 15;
  const updatedProfile = calculateLoanProfile({
    ...dbSaved3!,
    interestRate: newRate,
    memberName: dbSaved3!.member?.fullName || 'Member',
    repayments: dbSaved3!.repayments
  }, asOfDate);

  const updatedLoan = await prisma.loan.update({
    where: { id: testLoanId },
    data: {
      interestRate: newRate,
      interest: updatedProfile.totalInterestAccrued,
      totalPayable: updatedProfile.totalLoanAmount
    }
  });

  assert(Number(updatedLoan.interestRate) === 15, 'Updated rate in DB is 15%');
  assert(Number(updatedLoan.interest) === 4500, 'Updated interest in DB is KES 4,500 (10,000 × 15% × 3)', `Got ${updatedLoan.interest}`);
  assert(Number(updatedLoan.totalPayable) === 14500, 'Updated total payable in DB is KES 14,500', `Got ${updatedLoan.totalPayable}`);

  // Test 5: Newly Issued Loan (0 Completed Months)
  console.log('\n--- 5. Testing Newly Issued Loan (0 Completed Months) ---');
  const testLoanId0 = `TEST-SAVE-0M-${Date.now().toString().slice(-4)}`;
  const tempProfile0 = calculateLoanProfile({
    id: testLoanId0,
    memberId: member.id,
    memberName: member.fullName,
    issueDate: issueDateToday,
    principal: 10000,
    interestRate: 10,
    interestMethod: 'Simple',
    durationMonths: 6,
    status: 'Active',
    repayments: []
  }, asOfDate);

  const createdLoan0 = await prisma.loan.create({
    data: {
      id: testLoanId0,
      memberId: member.id,
      issueDate: issueDateToday,
      principal: 10000,
      interest: tempProfile0.totalInterestAccrued,
      totalPayable: tempProfile0.totalLoanAmount,
      paidAmount: 0,
      interestPaid: 0,
      principalPaid: 0,
      interestRate: 10,
      interestMethod: tempProfile0.interestMethod,
      compoundingFrequency: 'Monthly',
      durationMonths: 6,
      repaymentTerms: 'Monthly Anniversary',
      allocationPolicy: tempProfile0.allocationPolicy,
      purpose: 'Verification Test 0M',
      approvalRef: `APR-${testLoanId0}`,
      status: 'Active'
    }
  });

  const dbSaved0 = await prisma.loan.findUnique({ where: { id: testLoanId0 } });
  assert(Number(dbSaved0?.interestRate) === 10, 'DB Interest Rate preserved as 10% (NOT 0%)', `Got ${dbSaved0?.interestRate}`);
  assert(Number(dbSaved0?.interest) === 0, 'DB Stored Interest is correctly KES 0 for 0 completed months', `Got ${dbSaved0?.interest}`);
  assert(Number(dbSaved0?.totalPayable) === 10000, 'DB Stored Total Payable is correctly KES 10,000 for 0 completed months', `Got ${dbSaved0?.totalPayable}`);

  // Clean up test records
  console.log('\n--- 6. Cleaning Up Test Loans ---');
  await prisma.loan.delete({ where: { id: testLoanId } });
  await prisma.loan.delete({ where: { id: testLoanId0 } });
  console.log('  Cleaned up temporary test loans.');

  // Test 7: Historical loan preservation
  console.log('\n--- 7. Verifying Preservation of Historical Loans ---');
  const allLoans = await prisma.loan.findMany({ orderBy: { id: 'asc' } });
  console.log(`  Total historical loans in DB: ${allLoans.length}`);
  const hasZeroRateOverride = allLoans.some(l => Number(l.principal) > 0 && Number(l.interestRate) <= 0);
  assert(!hasZeroRateOverride, 'No historical loans have their interest rates overridden to 0%');

  console.log('\n========================================================================');
  console.log(` SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================');

  if (failed > 0) process.exit(1);
}

run()
  .catch(e => {
    console.error('Test run failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
