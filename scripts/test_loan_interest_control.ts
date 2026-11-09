import { calculateLoanProfile, toUTCMidnight, getAnniversaryDate, formatISODate } from '../src/lib/loanCalculator';

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

async function runTests() {
  console.log('================================================================');
  console.log(' DREAMLOOM FINANCIAL — LOAN INTEREST RATE CONTROL VERIFICATION');
  console.log('================================================================\n');

  console.log('--- TEST 1: User Explicit Calculation Example ---');
  // Calculation example from prompt:
  // Principal: KSh 10,000
  // Selected rate: 10% monthly
  // Interest method: Simple interest
  // Completed months: 3
  // Interest = 10,000 × 10% × 3 = KSh 3,000.
  // Total loan = KSh 13,000.

  const issueDate = toUTCMidnight('2026-08-01');
  const asOfDate = toUTCMidnight('2026-11-01'); // exactly 3 completed months (Aug-Sep, Sep-Oct, Oct-Nov)

  // 1.1 Selected Rate = 10%
  {
    const profile = calculateLoanProfile({
      id: 'TEST-10PCT',
      memberId: 1,
      memberName: 'Simon Memia Wanjiru',
      issueDate,
      principal: 10000,
      interestRate: 10,
      interestMethod: 'Simple',
      durationMonths: 6,
      status: 'Active',
      repayments: []
    }, asOfDate);

    assert(profile.completedPeriods === 3, 'Completed monthly periods is exactly 3');
    assert(profile.monthlyInterestRate === 10, 'Selected rate is 10%');
    assert(profile.totalInterestAccrued === 3000, 'Interest = 10,000 × 10% × 3 = KES 3,000', `Got ${profile.totalInterestAccrued}`);
    assert(profile.totalLoanAmount === 13000, 'Total loan = 10,000 + 3,000 = KES 13,000', `Got ${profile.totalLoanAmount}`);
  }

  // 1.2 Selected Rate = 15%
  {
    const profile = calculateLoanProfile({
      id: 'TEST-15PCT',
      memberId: 1,
      memberName: 'Simon Memia Wanjiru',
      issueDate,
      principal: 10000,
      interestRate: 15,
      interestMethod: 'Simple',
      durationMonths: 6,
      status: 'Active',
      repayments: []
    }, asOfDate);

    assert(profile.monthlyInterestRate === 15, 'Selected rate is 15%');
    assert(profile.totalInterestAccrued === 4500, 'Interest = 10,000 × 15% × 3 = KES 4,500', `Got ${profile.totalInterestAccrued}`);
    assert(profile.totalLoanAmount === 14500, 'Total loan = 10,000 + 4,500 = KES 14,500', `Got ${profile.totalLoanAmount}`);
  }

  // 1.3 Selected Rate = 0% (Interest-Free)
  {
    const profile = calculateLoanProfile({
      id: 'TEST-0PCT',
      memberId: 1,
      memberName: 'Simon Memia Wanjiru',
      issueDate,
      principal: 10000,
      interestRate: 0,
      interestMethod: 'Simple',
      durationMonths: 6,
      status: 'Active',
      repayments: []
    }, asOfDate);

    assert(profile.monthlyInterestRate === 0, 'Selected rate is 0%');
    assert(profile.totalInterestAccrued === 0, 'Interest for 0% rate is strictly KES 0', `Got ${profile.totalInterestAccrued}`);
    assert(profile.totalLoanAmount === 10000, 'Total loan for 0% rate is strictly principal KES 10,000', `Got ${profile.totalLoanAmount}`);
  }

  // 1.4 Selected Rate = 5%
  {
    const profile = calculateLoanProfile({
      id: 'TEST-5PCT',
      memberId: 1,
      memberName: 'Simon Memia Wanjiru',
      issueDate,
      principal: 10000,
      interestRate: 5,
      interestMethod: 'Simple',
      durationMonths: 6,
      status: 'Active',
      repayments: []
    }, asOfDate);

    assert(profile.monthlyInterestRate === 5, 'Selected rate is 5%');
    assert(profile.totalInterestAccrued === 1500, 'Interest = 10,000 × 5% × 3 = KES 1,500', `Got ${profile.totalInterestAccrued}`);
    assert(profile.totalLoanAmount === 11500, 'Total loan = KES 11,500', `Got ${profile.totalLoanAmount}`);
  }

  // 1.5 Selected Rate = 20%
  {
    const profile = calculateLoanProfile({
      id: 'TEST-20PCT',
      memberId: 1,
      memberName: 'Simon Memia Wanjiru',
      issueDate,
      principal: 10000,
      interestRate: 20,
      interestMethod: 'Simple',
      durationMonths: 6,
      status: 'Active',
      repayments: []
    }, asOfDate);

    assert(profile.monthlyInterestRate === 20, 'Selected rate is 20%');
    assert(profile.totalInterestAccrued === 6000, 'Interest = 10,000 × 20% × 3 = KES 6,000', `Got ${profile.totalInterestAccrued}`);
    assert(profile.totalLoanAmount === 16000, 'Total loan = KES 16,000', `Got ${profile.totalLoanAmount}`);
  }

  // 1.6 Custom Decimal Rate = 7.5%
  {
    const profile = calculateLoanProfile({
      id: 'TEST-7_5PCT',
      memberId: 1,
      memberName: 'Simon Memia Wanjiru',
      issueDate,
      principal: 10000,
      interestRate: 7.5,
      interestMethod: 'Simple',
      durationMonths: 6,
      status: 'Active',
      repayments: []
    }, asOfDate);

    assert(profile.monthlyInterestRate === 7.5, 'Selected custom rate is 7.5%');
    assert(profile.totalInterestAccrued === 2250, 'Interest = 10,000 × 7.5% × 3 = KES 2,250', `Got ${profile.totalInterestAccrued}`);
    assert(profile.totalLoanAmount === 12250, 'Total loan = KES 12,250', `Got ${profile.totalLoanAmount}`);
  }

  console.log('\n--- TEST 2: Individual Loan Isolation (Rate Does NOT Affect Other Loans) ---');
  {
    const loanA = calculateLoanProfile({
      id: 'LOAN-A',
      memberId: 1,
      issueDate,
      principal: 10000,
      interestRate: 5,
      interestMethod: 'Simple'
    }, asOfDate);

    const loanB = calculateLoanProfile({
      id: 'LOAN-B',
      memberId: 2,
      issueDate,
      principal: 10000,
      interestRate: 15,
      interestMethod: 'Simple'
    }, asOfDate);

    assert(loanA.monthlyInterestRate === 5 && loanB.monthlyInterestRate === 15, 'Loan A has 5% and Loan B has 15% independently');
    assert(loanA.totalInterestAccrued === 1500 && loanB.totalInterestAccrued === 4500, 'Loan A accrued KES 1,500 while Loan B accrued KES 4,500 independently');
  }

  console.log('\n--- TEST 3: Rate Change Immediately Recalculates Loan ---');
  {
    const originalLoan = calculateLoanProfile({
      id: 'LOAN-EDIT-TEST',
      memberId: 1,
      issueDate,
      principal: 20000,
      interestRate: 10,
      interestMethod: 'Simple'
    }, asOfDate);

    assert(originalLoan.totalInterestAccrued === 6000, 'Original 10% rate accrues KES 6,000');

    // Simulate edit to 20%
    const editedLoan = calculateLoanProfile({
      id: 'LOAN-EDIT-TEST',
      memberId: 1,
      issueDate,
      principal: 20000,
      interestRate: 20,
      interestMethod: 'Simple'
    }, asOfDate);

    assert(editedLoan.monthlyInterestRate === 20, 'Edited loan reflects new 20% rate');
    assert(editedLoan.totalInterestAccrued === 12000, 'Edited loan recalculates accrued interest immediately to KES 12,000');
    assert(editedLoan.totalLoanAmount === 32000, 'Edited loan total payable is KES 32,000');
  }

  console.log('\n================================================================');
  console.log(` SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

runTests();
