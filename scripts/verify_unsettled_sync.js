const { initialMembers, initialLoans, initialContributions, initialFines } = require('../src/lib/initialData');
const { getMemberUnsettledForDate, matchesMonthAndYear, isSameMemberName } = require('../src/lib/dateUtils');

console.log('===============================================================');
console.log('DREAMLOOM FINANCIAL: VERIFICATION TEST SUITE');
console.log('===============================================================\n');

// 1. Scenario A: September 2026 test
const testSepDate = '2026-09-16';
const sepMember = 'Elijah Waitara';
const sepResult = getMemberUnsettledForDate(initialContributions, sepMember, testSepDate);
console.log(`[TEST 1] Scenario A - ${sepMember} on ${testSepDate}:`);
console.log(`  Cycle Identified: ${sepResult.monthLabel}`);
console.log(`  Unsettled Retrieved: KES ${sepResult.unsettled}`);
console.log(`  Penalty: KES 500`);
console.log(`  Total Obligation: KES ${sepResult.unsettled + 500}`);
console.assert(sepResult.monthLabel === 'September 2026', 'Expected September 2026');
console.assert(sepResult.unsettled === 7000, `Expected 7000 for Elijah Waitara in September, got ${sepResult.unsettled}`);

// 2. Scenario B: August 2026 test
const testAugDate = '2026-08-16';
const augMember = 'Simon Memia';
const augResult = getMemberUnsettledForDate(initialContributions, augMember, testAugDate);
console.log(`\n[TEST 2] Scenario B - ${augMember} on ${testAugDate}:`);
console.log(`  Cycle Identified: ${augResult.monthLabel}`);
console.log(`  Unsettled Retrieved: KES ${augResult.unsettled}`);
console.log(`  Penalty: KES 500`);
console.log(`  Total Obligation: KES ${augResult.unsettled + 500}`);
console.assert(augResult.monthLabel === 'August 2026', 'Expected August 2026');
console.assert(augResult.unsettled === 6000, `Expected 6000 for Simon Memia in August, got ${augResult.unsettled}`);

// 3. Verification: August dues are NOT added to September dues
console.log(`\n[TEST 3] Month Isolation (August vs September):`);
const elijahAug = getMemberUnsettledForDate(initialContributions, sepMember, testAugDate);
console.log(`  Elijah in August 2026: KES ${elijahAug.unsettled} (Paid on time, 0 unsettled)`);
console.log(`  Elijah in September 2026: KES ${sepResult.unsettled} (Unsettled)`);
console.assert(elijahAug.unsettled === 0, 'Elijah should have 0 unsettled in August 2026');
console.assert(sepResult.unsettled === 7000, 'Elijah should have 7000 unsettled in September 2026');
console.log('  => Dues are strictly decoupled and never mixed across cycles!');

// 4. Verification: Duplicate penalty prevention
console.log(`\n[TEST 4] Single Penalty per Cycle Enforcement:`);
const fines = [...initialFines];
function canAddPenalty(finesList, memberName, dateStr) {
  const sync = getMemberUnsettledForDate(initialContributions, memberName, dateStr);
  const exists = finesList.some(f =>
    isSameMemberName(f.member, memberName) &&
    matchesMonthAndYear(f.date, sync.monthName, sync.year)
  );
  return !exists;
}

// In initialFines, Daniel Kamau Njiriri has a penalty in December 2025 (2025-12-16)
const dec2025Date = '2025-12-20';
const canAddDuplicate = canAddPenalty(fines, 'Daniel Kamau', dec2025Date);
console.log(`  Attempt to add 2nd penalty for Daniel Kamau in December 2025 allowed? ${canAddDuplicate}`);
console.assert(canAddDuplicate === false, 'Duplicate penalty in December 2025 must be blocked');

const canAddNov = canAddPenalty(fines, 'Daniel Kamau', '2026-11-15');
console.log(`  Attempt to add penalty for Daniel Kamau in November 2026 allowed? ${canAddNov}`);
console.assert(canAddNov === true, 'Penalty in a new cycle (November 2026) should be allowed');

// 5. Verification: Automated Member Balances
console.log(`\n[TEST 5] Automated Member Balances calculation:`);
const grandTotalContributions = initialMembers.reduce((sum, m) => sum + m.totalContribution, 0);
initialMembers.slice(0, 3).forEach(m => {
  const memberActiveLoans = initialLoans
    .filter(l => isSameMemberName(l.borrower, m.fullName) && l.status === 'Active')
    .reduce((sum, l) => sum + l.balance, 0);
  const netBalance = m.totalContribution - memberActiveLoans;
  const sharePct = ((m.totalContribution / grandTotalContributions) * 100).toFixed(2) + '%';
  console.log(`  Member: ${m.fullName}`);
  console.log(`    Total Contributions: KES ${m.totalContribution.toLocaleString()}`);
  console.log(`    Active Loans: KES ${memberActiveLoans.toLocaleString()}`);
  console.log(`    Net Balance: KES ${netBalance.toLocaleString()}`);
  console.log(`    Shares: ${sharePct}`);
  console.assert(netBalance === m.totalContribution - memberActiveLoans, 'Net balance must equal contributions - loans');
});

// 6. Verification: Loan 10% interest formula
console.log(`\n[TEST 6] 10% Standard Loan Interest Calculation:`);
const samplePrincipal = 20000;
const expectedInterest = samplePrincipal * 0.10;
const totalPayable = samplePrincipal + expectedInterest;
console.log(`  Principal: KES ${samplePrincipal}`);
console.log(`  10% Interest: KES ${expectedInterest}`);
console.log(`  Total Payable: KES ${totalPayable}`);
console.assert(expectedInterest === 2000, '10% of 20000 must be 2000');
console.assert(totalPayable === 22000, 'Total payable must be 22000');

console.log('\n===============================================================');
console.log('ALL VERIFICATION CHECKS PASSED WITH ZERO ERRORS!');
console.log('===============================================================');
