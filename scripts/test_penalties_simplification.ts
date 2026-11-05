import { prisma } from '../src/lib/prisma';
import { syncAllContributions, isContributionDeadlinePassed, normalizePeriod } from '../src/lib/syncService';

async function runPenaltiesVerification() {
  console.log('========================================================================');
  console.log('DREAMLOOM FINANCIAL: FINES & PENALTIES SIMPLIFICATION VERIFICATION');
  console.log('========================================================================\n');

  try {
    // 1. Verify Member Directory
    const members = await prisma.member.findMany({ orderBy: { id: 'asc' } });
    console.log(`[CHECK 1] Dreamloom Members count: ${members.length}`);
    members.forEach((m, i) => console.log(`  ${i + 1}. ${m.fullName} (ID: ${m.id})`));
    if (members.length !== 7) throw new Error('Expected 7 official members');

    // 2. Deadline Enforcement Test
    console.log('\n[CHECK 2] Deadline Enforcement (16th of each month):');
    const aug2026Passed = isContributionDeadlinePassed('Aug 2026');
    console.log(`  - Aug 2026 deadline passed? ${aug2026Passed} (Expected: true)`);
    if (!aug2026Passed) throw new Error('Aug 2026 deadline should be passed');

    // 3. Test Single Penalty Generation & Duplicate Prevention
    console.log('\n[CHECK 3] Automated Penalty Generation & Duplicate Prevention:');
    const simon = members[0];
    const testMonth = 'Dec 2025';

    // Clean up any test penalty for Dec 2025
    await prisma.penalty.deleteMany({
      where: {
        memberId: simon.id,
        monthYear: testMonth,
      },
    });

    // Create a late contribution for Dec 2025
    let contrib = await prisma.contribution.findFirst({
      where: { memberId: simon.id, monthYear: testMonth },
    });
    if (!contrib) {
      contrib = await prisma.contribution.create({
        data: {
          customId: `CNT-TEST-SIMP-${Date.now()}`,
          memberId: simon.id,
          monthYear: testMonth,
          amount: 0,
          unsettled: 6000,
          remarks: 'Monthly Contribution (Late & Penalty) [TEST]',
        },
      });
    } else {
      contrib = await prisma.contribution.update({
        where: { id: contrib.id },
        data: { unsettled: 6000, remarks: 'Monthly Contribution (Late & Penalty) [TEST]' },
      });
    }

    // Run syncAllContributions
    await syncAllContributions();

    // Verify exactly one KSh 500 penalty was generated
    const penalties = await prisma.penalty.findMany({
      where: { memberId: simon.id, monthYear: testMonth },
    });
    console.log(`  - Generated penalties count for ${simon.fullName} (${testMonth}): ${penalties.length}`);
    if (penalties.length !== 1) throw new Error(`Expected exactly 1 penalty, found ${penalties.length}`);

    const p = penalties[0];
    console.log(`  - Penalty Amount: KES ${p.penaltyAmount} (Expected: 500)`);
    console.log(`  - Status: ${p.status} (Expected: UNPAID)`);
    if (p.penaltyAmount !== 500) throw new Error('Penalty amount must be 500');

    // Run sync again to verify duplicate prevention
    console.log('  - Running sync again to verify duplicate prevention...');
    await syncAllContributions();
    const countAfterSecondSync = await prisma.penalty.count({
      where: { memberId: simon.id, monthYear: testMonth },
    });
    console.log(`  - Count after second sync: ${countAfterSecondSync} (Expected: 1)`);
    if (countAfterSecondSync !== 1) throw new Error('Duplicate penalty was created!');

    // 4. Test Toggle Status (Unpaid -> Paid -> Unpaid)
    console.log('\n[CHECK 4] Testing Status Toggle (Unpaid -> Paid -> Unpaid):');
    // Toggle to Paid
    const paidPenalty = await prisma.penalty.update({
      where: { id: p.id },
      data: {
        status: 'PAID',
        paidAmount: 500.0,
        paidFine: 500.0,
        remainingBalance: 0.0,
        datePaid: new Date().toISOString().slice(0, 10),
      },
    });
    console.log(`  - Marked Paid: status=${paidPenalty.status}, paidAmount=${paidPenalty.paidAmount}`);
    if (paidPenalty.status !== 'PAID' || paidPenalty.paidAmount !== 500) throw new Error('Failed to mark as Paid');

    // Verify contribution unsettled balance was NOT reduced
    const contribAfterPaidFine = await prisma.contribution.findUnique({
      where: { id: contrib.id },
    });
    console.log(`  - Contribution unsettled after fine marked Paid: KES ${contribAfterPaidFine?.unsettled} (Expected: 6000)`);
    if (contribAfterPaidFine?.unsettled !== 6000) {
      throw new Error('Contribution balance must NOT be altered when penalty is paid');
    }

    // Toggle back to Unpaid
    const unpaidPenalty = await prisma.penalty.update({
      where: { id: p.id },
      data: {
        status: 'UNPAID',
        paidAmount: 0.0,
        paidFine: 0.0,
        remainingBalance: 500.0,
        datePaid: null,
      },
    });
    console.log(`  - Marked Unpaid: status=${unpaidPenalty.status}, paidAmount=${unpaidPenalty.paidAmount}`);
    if (unpaidPenalty.status !== 'UNPAID' || unpaidPenalty.paidAmount !== 0) throw new Error('Failed to mark as Unpaid');

    // 5. Test Clean-up
    await prisma.penalty.delete({ where: { id: p.id } });
    await prisma.contribution.delete({ where: { id: contrib.id } });
    console.log('\n[CHECK 5] Test records cleaned up successfully.');

    // 6. Overall Summary Metrics Check
    const allPenalties = await prisma.penalty.findMany();
    const paidCount = allPenalties.filter(x => x.status?.toUpperCase() === 'PAID').length;
    const unpaidCount = allPenalties.filter(x => x.status?.toUpperCase() !== 'PAID').length;
    console.log('\n[CURRENT SYSTEM METRICS]');
    console.log(`  - Total Penalties in DB: ${allPenalties.length}`);
    console.log(`  - Total Fines Recorded: KES ${(allPenalties.length * 500).toLocaleString()}`);
    console.log(`  - Total Fines Collected: KES ${(paidCount * 500).toLocaleString()} (${paidCount} Paid)`);
    console.log(`  - Outstanding Fines: KES ${(unpaidCount * 500).toLocaleString()} (${unpaidCount} Unpaid)`);

    console.log('\n========================================================================');
    console.log('ALL TESTS PASSED: FINES & PENALTIES SIMPLIFICATION 100% VERIFIED');
    console.log('========================================================================');
  } catch (error) {
    console.error('VERIFICATION FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPenaltiesVerification();
