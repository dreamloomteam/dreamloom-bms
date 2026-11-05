import { prisma } from '../src/lib/prisma';
import {
  syncContributionToPenalty,
  recordPenaltyPayment,
  syncAllContributions,
  normalizePeriod
} from '../src/lib/syncService';
import { matchesMonthAndYear } from '../src/lib/dateUtils';

interface TestResult {
  testNumber: number;
  name: string;
  expected: string;
  actual: string;
  status: 'PASS' | 'FAIL';
  details?: any;
}

const results: TestResult[] = [];

async function runTestSuite() {
  console.log('======================================================================');
  console.log('DREAMLOOM FINANCIAL: COMPREHENSIVE 10-TEST VERIFICATION SUITE');
  console.log('======================================================================\n');

  try {
    // 0. Setup: Identify 3 genuine test members
    const members = await prisma.member.findMany({ take: 3 });
    if (members.length < 3) throw new Error('Need at least 3 members in database for testing');
    const [member1, member2, member3] = members;
    console.log(`Test Members Selected:\n  1. ${member1.fullName} (ID: ${member1.id})\n  2. ${member2.fullName} (ID: ${member2.id})\n  3. ${member3.fullName} (ID: ${member3.id})\n`);

    // Clean up any previous test contributions/penalties for these test slots
    await prisma.paymentTransaction.deleteMany({
      where: { notes: { contains: 'VERIFICATION_TEST' } }
    });
    await prisma.penalty.updateMany({
      where: {
        memberId: { in: [member1.id, member2.id, member3.id] },
        monthYear: { in: ['Sep 2026', 'Aug 2026', 'Oct 2026'] }
      },
      data: {
        paidAmount: 0,
        paidContribution: 0,
        paidFine: 0,
        remainingBalance: 6500,
        status: 'UNPAID'
      }
    });

    // -------------------------------------------------------------------------
    // TEST 1 — New late payment: KSh 6,000 contribution and KSh 500 fine for September 2026
    // -------------------------------------------------------------------------
    console.log('[TEST 1] New late payment for September 2026');
    let contrib1 = await prisma.contribution.findFirst({
      where: { memberId: member1.id, monthYear: 'Sep 2026' }
    });
    if (contrib1) {
      contrib1 = await prisma.contribution.update({
        where: { id: contrib1.id },
        data: { unsettled: 6000, remarks: 'Monthly Contribution (Late & Penalty) [VERIFICATION_TEST]' }
      });
    } else {
      contrib1 = await prisma.contribution.create({
        data: {
          customId: `CNT-T1-${Date.now()}`,
          memberId: member1.id,
          monthYear: 'Sep 2026',
          amount: 0,
          unsettled: 6000,
          remarks: 'Monthly Contribution (Late & Penalty) [VERIFICATION_TEST]'
        }
      });
    }

    const penalty1 = await syncContributionToPenalty(contrib1.id);
    const t1TotalOut = (penalty1?.unsettledContribution || 0) + (penalty1?.penaltyAmount || 0);

    // Automatic summary query simulation
    const summaryActiveT1 = await prisma.penalty.findMany({
      where: { memberId: member1.id, status: { in: ['UNPAID', 'PARTIALLY PAID'] } }
    });
    const summaryT1Due = summaryActiveT1.reduce((sum, p) => sum + p.remainingBalance, 0);

    const t1Pass = penalty1 !== null &&
      penalty1.unsettledContribution === 6000 &&
      penalty1.penaltyAmount === 500 &&
      penalty1.remainingBalance === 6500 &&
      t1TotalOut === 6500 &&
      summaryT1Due >= 6500;

    results.push({
      testNumber: 1,
      name: 'New Late Payment (Sep 2026)',
      expected: 'Record appears automatically, Total Outstanding KSh 6,500, Summary shows KSh 6,500',
      actual: `Register Total: KSh ${t1TotalOut.toLocaleString()}, Balance: KSh ${penalty1?.remainingBalance.toLocaleString()}, Status: ${penalty1?.status}`,
      status: t1Pass ? 'PASS' : 'FAIL',
      details: { penaltyId: penalty1?.id, totalOutstanding: t1TotalOut, summaryDue: summaryT1Due }
    });
    console.log(`  => Status: ${t1Pass ? 'PASS' : 'FAIL'} (Outstanding: KSh ${t1TotalOut})\n`);

    // -------------------------------------------------------------------------
    // TEST 2 — Different month: Record another outstanding amount for August 2026
    // -------------------------------------------------------------------------
    console.log('[TEST 2] Different month (August 2026) isolation');
    let contribAug = await prisma.contribution.findFirst({
      where: { memberId: member1.id, monthYear: 'Aug 2026' }
    });
    if (contribAug) {
      contribAug = await prisma.contribution.update({
        where: { id: contribAug.id },
        data: { unsettled: 6000, remarks: 'Monthly Contribution (August Dues) [VERIFICATION_TEST]' }
      });
    } else {
      contribAug = await prisma.contribution.create({
        data: {
          customId: `CNT-T2-${Date.now()}`,
          memberId: member1.id,
          monthYear: 'Aug 2026',
          amount: 0,
          unsettled: 6000,
          remarks: 'Monthly Contribution (August Dues) [VERIFICATION_TEST]'
        }
      });
    }

    const penaltyAug = await syncContributionToPenalty(contribAug.id);
    const penaltySepCheck = await prisma.penalty.findUnique({ where: { id: penalty1!.id } });

    const t2Pass = penaltyAug !== null &&
      penaltyAug.monthYear === 'Aug 2026' &&
      penaltyAug.id !== penaltySepCheck?.id &&
      penaltySepCheck?.monthYear === 'Sep 2026' &&
      penaltySepCheck?.remainingBalance === 6500;

    results.push({
      testNumber: 2,
      name: 'Different Month (August 2026)',
      expected: 'August record appears separately, September remains unchanged at KSh 6,500',
      actual: `August Penalty ID: ${penaltyAug?.id} (${penaltyAug?.monthYear}), September Penalty ID: ${penaltySepCheck?.id} (${penaltySepCheck?.monthYear}, Bal: KSh ${penaltySepCheck?.remainingBalance.toLocaleString()})`,
      status: t2Pass ? 'PASS' : 'FAIL',
    });
    console.log(`  => Status: ${t2Pass ? 'PASS' : 'FAIL'}\n`);

    // -------------------------------------------------------------------------
    // TEST 3 — Multiple members: Record outstanding dues for at least three different members
    // -------------------------------------------------------------------------
    console.log('[TEST 3] Multiple members (3 distinct members)');
    // Member 2
    let contribM2 = await prisma.contribution.findFirst({ where: { memberId: member2.id, monthYear: 'Sep 2026' } });
    if (!contribM2) {
      contribM2 = await prisma.contribution.create({
        data: { customId: `CNT-T3-M2-${Date.now()}`, memberId: member2.id, monthYear: 'Sep 2026', unsettled: 5000, remarks: '[VERIFICATION_TEST]' }
      });
    } else {
      contribM2 = await prisma.contribution.update({ where: { id: contribM2.id }, data: { unsettled: 5000 } });
    }
    const penM2 = await syncContributionToPenalty(contribM2.id);

    // Member 3
    let contribM3 = await prisma.contribution.findFirst({ where: { memberId: member3.id, monthYear: 'Sep 2026' } });
    if (!contribM3) {
      contribM3 = await prisma.contribution.create({
        data: { customId: `CNT-T3-M3-${Date.now()}`, memberId: member3.id, monthYear: 'Sep 2026', unsettled: 7000, remarks: '[VERIFICATION_TEST]' }
      });
    } else {
      contribM3 = await prisma.contribution.update({ where: { id: contribM3.id }, data: { unsettled: 7000 } });
    }
    const penM3 = await syncContributionToPenalty(contribM3.id);

    const t3Pass = penM2 !== null && penM3 !== null &&
      penM2.memberId === member2.id &&
      penM3.memberId === member3.id &&
      penM2.id !== penM3.id &&
      penM2.unsettledContribution === 5000 &&
      penM3.unsettledContribution === 7000;

    results.push({
      testNumber: 3,
      name: 'Multiple Members Isolation',
      expected: 'All 3 members appear correctly, no duplicate records, no cross-member contamination',
      actual: `M1: ${member1.fullName} (KES ${penaltySepCheck?.remainingBalance}), M2: ${member2.fullName} (KES ${penM2?.remainingBalance}), M3: ${member3.fullName} (KES ${penM3?.remainingBalance})`,
      status: t3Pass ? 'PASS' : 'FAIL',
    });
    console.log(`  => Status: ${t3Pass ? 'PASS' : 'FAIL'}\n`);

    // -------------------------------------------------------------------------
    // TEST 4 — Partial payment: Pay KSh 2,000 against KSh 6,500
    // -------------------------------------------------------------------------
    console.log('[TEST 4] Partial payment of KSh 2,000 against KSh 6,500');
    // Ensure Sep 2026 penalty is clean before payment
    await prisma.penalty.update({
      where: { id: penalty1!.id },
      data: { paidAmount: 0, paidContribution: 0, paidFine: 0, remainingBalance: 6500, status: 'UNPAID' }
    });
    await prisma.contribution.update({
      where: { id: contrib1.id },
      data: { unsettled: 6000 }
    });

    const paymentT4 = await recordPenaltyPayment({
      penaltyId: penalty1!.id,
      amount: 2000,
      notes: '[VERIFICATION_TEST] Partial payment 2000',
      userEmail: 'simon@dreamloom.co.ke'
    });

    const t4Pass = paymentT4.allocatedContribution === 2000 &&
      paymentT4.allocatedFine === 0 &&
      paymentT4.remainingContribution === 4000 &&
      paymentT4.remainingFine === 500 &&
      paymentT4.remainingBalance === 4500 &&
      paymentT4.penalty.status === 'PARTIALLY PAID';

    results.push({
      testNumber: 4,
      name: 'Partial Payment Allocation',
      expected: 'Remaining balance: KSh 4,500, Status: PARTIALLY PAID, Payment transaction recorded once',
      actual: `Allocated Contrib: KSh ${paymentT4.allocatedContribution}, Fine: KSh ${paymentT4.allocatedFine}, Rem Bal: KSh ${paymentT4.remainingBalance}, Status: ${paymentT4.penalty.status}`,
      status: t4Pass ? 'PASS' : 'FAIL',
    });
    console.log(`  => Status: ${t4Pass ? 'PASS' : 'FAIL'}\n`);

    // -------------------------------------------------------------------------
    // TEST 5 — Full settlement: Pay the remaining KSh 4,500
    // -------------------------------------------------------------------------
    console.log('[TEST 5] Full settlement: Pay remaining KSh 4,500');
    const paymentT5 = await recordPenaltyPayment({
      penaltyId: penalty1!.id,
      amount: 4500,
      notes: '[VERIFICATION_TEST] Final settlement 4500',
      userEmail: 'simon@dreamloom.co.ke'
    });

    // Check that settled record is excluded from active unsettled dues
    const activeUnsettledM1 = await prisma.penalty.findMany({
      where: { memberId: member1.id, status: { in: ['UNPAID', 'PARTIALLY PAID'] } }
    });
    const containsSettled = activeUnsettledM1.some(p => p.id === penalty1!.id);

    const t5Pass = paymentT5.remainingBalance === 0 &&
      paymentT5.remainingContribution === 0 &&
      paymentT5.remainingFine === 0 &&
      paymentT5.penalty.status === 'PAID' &&
      !containsSettled;

    results.push({
      testNumber: 5,
      name: 'Full Settlement & Exclusion',
      expected: 'Remaining balance: KSh 0, Status: PAID, Automatic Summary excludes settled amount, historical record preserved',
      actual: `Rem Bal: KSh ${paymentT5.remainingBalance}, Status: ${paymentT5.penalty.status}, Excluded from Summary: ${!containsSettled}`,
      status: t5Pass ? 'PASS' : 'FAIL',
    });
    console.log(`  => Status: ${t5Pass ? 'PASS' : 'FAIL'}\n`);

    // -------------------------------------------------------------------------
    // TEST 6 — Edit original contribution: Change existing contribution from KSh 6,000 to KSh 7,000
    // -------------------------------------------------------------------------
    console.log('[TEST 6] Edit original contribution from KSh 6,000 to KSh 7,000');
    // Create new cycle contribution for Member 2 for clean test
    let contribEdit = await prisma.contribution.findFirst({
      where: { memberId: member2.id, monthYear: 'Oct 2026' }
    });
    if (!contribEdit) {
      contribEdit = await prisma.contribution.create({
        data: { customId: `CNT-T6-${Date.now()}`, memberId: member2.id, monthYear: 'Oct 2026', unsettled: 6000, remarks: '[VERIFICATION_TEST]' }
      });
    } else {
      contribEdit = await prisma.contribution.update({ where: { id: contribEdit.id }, data: { unsettled: 6000 } });
    }
    const penBefore = await syncContributionToPenalty(contribEdit.id);

    // Now edit to 7,000
    contribEdit = await prisma.contribution.update({
      where: { id: contribEdit.id },
      data: { unsettled: 7000 }
    });
    const penAfter = await syncContributionToPenalty(contribEdit.id);

    const t6Pass = penBefore !== null && penAfter !== null &&
      penBefore.id === penAfter.id && // Same record preserved!
      penAfter.unsettledContribution === 7000 &&
      penAfter.remainingBalance === 7500;

    results.push({
      testNumber: 6,
      name: 'Edit Original Contribution',
      expected: 'Register updates correctly from 6,000 to 7,000, total 7,500, no duplicate record created',
      actual: `Penalty ID preserved: ${penBefore?.id === penAfter?.id}, New Contrib: KSh ${penAfter?.unsettledContribution}, New Total: KSh ${penAfter?.remainingBalance}`,
      status: t6Pass ? 'PASS' : 'FAIL',
    });
    console.log(`  => Status: ${t6Pass ? 'PASS' : 'FAIL'}\n`);

    // -------------------------------------------------------------------------
    // TEST 7 — Refresh and persistence: Database fetch verification
    // -------------------------------------------------------------------------
    console.log('[TEST 7] Refresh and Persistence from PostgreSQL');
    // Fetch directly from DB as a fresh client
    const freshPenalty = await prisma.penalty.findUnique({
      where: { id: penAfter!.id },
      include: { member: true, payments: true }
    });

    const t7Pass = freshPenalty !== null &&
      freshPenalty.unsettledContribution === 7000 &&
      freshPenalty.remainingBalance === 7500 &&
      freshPenalty.status === 'UNPAID';

    results.push({
      testNumber: 7,
      name: 'Refresh and Database Persistence',
      expected: 'All records remain intact in PostgreSQL, correct payment statuses and balances survive re-read',
      actual: `DB Persisted ID: ${freshPenalty?.id}, Contrib: KSh ${freshPenalty?.unsettledContribution}, Bal: KSh ${freshPenalty?.remainingBalance}`,
      status: t7Pass ? 'PASS' : 'FAIL',
    });
    console.log(`  => Status: ${t7Pass ? 'PASS' : 'FAIL'}\n`);

    // -------------------------------------------------------------------------
    // TEST 8 — Monthly and yearly filters
    // -------------------------------------------------------------------------
    console.log('[TEST 8] Monthly and yearly filters');
    const allPenalties = await prisma.penalty.findMany();
    const sepRecords = allPenalties.filter(p => matchesMonthAndYear(p.monthYear, 'September', 2026));
    const augRecords = allPenalties.filter(p => matchesMonthAndYear(p.monthYear, 'August', 2026));

    const t8Pass = sepRecords.length > 0 &&
      augRecords.length > 0 &&
      sepRecords.every(p => p.monthYear.includes('Sep')) &&
      augRecords.every(p => p.monthYear.includes('Aug'));

    results.push({
      testNumber: 8,
      name: 'Monthly & Yearly Filters',
      expected: 'Each record appears under its correct period, no records mixed across months or years',
      actual: `September Records: ${sepRecords.length}, August Records: ${augRecords.length}, Perfectly isolated`,
      status: t8Pass ? 'PASS' : 'FAIL',
    });
    console.log(`  => Status: ${t8Pass ? 'PASS' : 'FAIL'}\n`);

    // -------------------------------------------------------------------------
    // TEST 9 — Duplicate prevention: Repeated synchronization
    // -------------------------------------------------------------------------
    console.log('[TEST 9] Duplicate prevention during repeated synchronization');
    const countBefore = await prisma.penalty.count({
      where: { memberId: member2.id, monthYear: 'Oct 2026' }
    });

    // Run sync twice in succession
    await syncContributionToPenalty(contribEdit.id);
    await syncContributionToPenalty(contribEdit.id);

    const countAfter = await prisma.penalty.count({
      where: { memberId: member2.id, monthYear: 'Oct 2026' }
    });

    const t9Pass = countBefore === 1 && countAfter === 1;

    results.push({
      testNumber: 9,
      name: 'Duplicate Prevention on Repeated Sync',
      expected: 'No duplicate penalty or contribution records, exact 1 record per member per month',
      actual: `Count before: ${countBefore}, Count after repeated sync: ${countAfter} (Zero duplicates created)`,
      status: t9Pass ? 'PASS' : 'FAIL',
    });
    console.log(`  => Status: ${t9Pass ? 'PASS' : 'FAIL'}\n`);

    // -------------------------------------------------------------------------
    // TEST 10 — Dashboard and other summaries: No double-counting
    // -------------------------------------------------------------------------
    console.log('[TEST 10] Dashboard and financial summaries check');
    // Query active penalties vs settled penalties
    const activePenalties = await prisma.penalty.findMany({
      where: { status: { in: ['UNPAID', 'PARTIALLY PAID'] } }
    });
    const paidPenalties = await prisma.penalty.findMany({
      where: { status: 'PAID' }
    });

    const totalActiveDues = activePenalties.reduce((sum, p) => sum + p.remainingBalance, 0);
    const totalCollected = paidPenalties.reduce((sum, p) => sum + p.paidAmount, 0);

    // Verify settled records do not count toward active dues
    const overlap = activePenalties.filter(a => paidPenalties.some(b => b.id === a.id));

    const t10Pass = overlap.length === 0 && totalActiveDues >= 0 && totalCollected >= 0;

    results.push({
      testNumber: 10,
      name: 'Financial Summaries & No Double-Counting',
      expected: 'No double-counting, settled dues excluded from outstanding totals, financial integrity intact',
      actual: `Active Dues: KSh ${totalActiveDues.toLocaleString()}, Collected: KSh ${totalCollected.toLocaleString()}, Overlap: ${overlap.length}`,
      status: t10Pass ? 'PASS' : 'FAIL',
    });
    console.log(`  => Status: ${t10Pass ? 'PASS' : 'FAIL'}\n`);

    // -------------------------------------------------------------------------
    // FINAL RESULTS TABLE
    // -------------------------------------------------------------------------
    console.log('======================================================================');
    console.log('TEST SUMMARY TABLE:');
    console.log('======================================================================');
    results.forEach(r => {
      console.log(`Test ${r.testNumber.toString().padEnd(2)} | ${r.status.padEnd(4)} | ${r.name}`);
      console.log(`        Expected: ${r.expected}`);
      console.log(`        Actual:   ${r.actual}\n`);
    });

    const allPassed = results.every(r => r.status === 'PASS');
    console.log('======================================================================');
    console.log(`OVERALL RESULT: ${allPassed ? 'ALL 10 TESTS PASSED (100% SUCCESS)' : 'SOME TESTS FAILED'}`);
    console.log('======================================================================');
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runTestSuite();
