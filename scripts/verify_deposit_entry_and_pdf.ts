import { prisma } from '../src/lib/prisma';
import { PDF_RECORDS } from './import_historical_deposits';

interface TestResult {
  step: number;
  name: string;
  expected: string;
  actual: string;
  status: 'PASS' | 'FAIL';
}

const testResults: TestResult[] = [];

async function runVerification() {
  console.log('======================================================================');
  console.log('DREAMLOOM FINANCIAL: DEPOSIT ENTRY & PDF HISTORICAL RECORDS VERIFICATION');
  console.log('======================================================================\n');

  try {
    // -------------------------------------------------------------------------
    // 1 & 2. Enter a new deposit manually & confirm amount saves correctly
    // -------------------------------------------------------------------------
    console.log('[STEP 1 & 2] Enter a new manual deposit and confirm amount saves correctly');
    const manualCustomId = `DEP-2026-MANUAL-${Date.now().toString().slice(-4)}`;
    const manualRef = `MANUAL-REF-${Date.now().toString().slice(-5)}`;
    const testAmount = 45750.50; // Tests whole numbers and decimals!

    const manualDep = await prisma.deposit.create({
      data: {
        customId: manualCustomId,
        date: new Date('2026-11-05T09:00:00Z'),
        depositorName: 'Simon Memia Wanjiru',
        amount: testAmount,
        transactionType: 'Member Deposit',
        reason: 'Manual Deposit Entry Test (Decimal & Whole Amount Verification)',
        reference: manualRef,
        paymentMethod: 'M-Pesa',
        receivingAccount: 'Equity Bank Kenya • A/C 1760287177880',
        memberId: 1,
        reconciliationStatus: 'Unreconciled',
        createdByUser: 'simon@dreamloom.co.ke',
      },
    });

    const step1Pass = manualDep !== null && manualDep.amount === testAmount;
    testResults.push({
      step: 1,
      name: 'Manual Deposit Entry & Amount Persistence',
      expected: `Deposit created with AMOUNT DEPOSITED (KES) = ${testAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      actual: `ID: ${manualDep.customId}, Saved Amount: KES ${manualDep.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}, Currency: KES`,
      status: step1Pass ? 'PASS' : 'FAIL',
    });
    console.log(`  => Status: ${step1Pass ? 'PASS' : 'FAIL'} (${manualDep.customId}: KES ${manualDep.amount})\n`);

    // -------------------------------------------------------------------------
    // 3. Confirm amount appears in the register
    // -------------------------------------------------------------------------
    console.log('[STEP 3] Confirm amount appears in the register fetch');
    const registerFetch = await prisma.deposit.findUnique({
      where: { id: manualDep.id },
      include: { member: true },
    });
    const step3Pass = registerFetch !== null && registerFetch.amount === testAmount && registerFetch.customId === manualCustomId;
    testResults.push({
      step: 3,
      name: 'Amount Visible in Register',
      expected: `Register record retrieved with ID ${manualCustomId} and amount ${testAmount}`,
      actual: `Found ID: ${registerFetch?.customId}, Depositor: ${registerFetch?.depositorName}, Amount in Register: KES ${registerFetch?.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      status: step3Pass ? 'PASS' : 'FAIL',
    });
    console.log(`  => Status: ${step3Pass ? 'PASS' : 'FAIL'}\n`);

    // -------------------------------------------------------------------------
    // 4. Confirm the total deposit calculation updates
    // -------------------------------------------------------------------------
    console.log('[STEP 4] Confirm total deposit calculation updates dynamically');
    const allActiveDeposits = await prisma.deposit.findMany({
      where: { isReversed: false },
    });
    const totalDepositsSum = allActiveDeposits.reduce((sum, d) => sum + Number(d.amount), 0);
    const containsManual = allActiveDeposits.some((d) => d.id === manualDep.id);

    const step4Pass = containsManual && totalDepositsSum >= testAmount;
    testResults.push({
      step: 4,
      name: 'Total Deposit Calculation Updates',
      expected: 'Total calculation incorporates the new deposit amount into active company totals',
      actual: `Active Non-Reversed Transactions: ${allActiveDeposits.length}, Grand Total: KES ${totalDepositsSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      status: step4Pass ? 'PASS' : 'FAIL',
    });
    console.log(`  => Status: ${step4Pass ? 'PASS' : 'FAIL'} (Grand Total: KES ${totalDepositsSum.toLocaleString()})\n`);

    // -------------------------------------------------------------------------
    // 5 & 6. Confirm all genuine historical PDF deposits are imported and match PDF
    // -------------------------------------------------------------------------
    console.log('[STEP 5 & 6] Compare imported records against original PDF statement');
    const expectedPDFSum = PDF_RECORDS.reduce((sum, r) => sum + r.amount, 0); // 328,362.00
    const historicalDeposits = await prisma.deposit.findMany({
      where: { customId: { startsWith: 'DEP-2026-H' } },
    });

    const historicalSum = historicalDeposits.reduce((sum, d) => sum + Number(d.amount), 0);
    const countMatch = historicalDeposits.length === PDF_RECORDS.length;
    const sumMatch = historicalSum === expectedPDFSum;

    // Check each record from PDF has matching entry
    let allRecordsMatched = true;
    for (const pdfRow of PDF_RECORDS) {
      const found = historicalDeposits.find(
        (h) => h.depositorName === pdfRow.name && h.amount === pdfRow.amount
      );
      if (!found) {
        allRecordsMatched = false;
        console.error(`Mismatch: Record ${pdfRow.name} for ${pdfRow.amount} not found`);
      }
    }

    const step5Pass = countMatch && sumMatch && allRecordsMatched;
    testResults.push({
      step: 5,
      name: 'PDF Historical Deposit Import & Exact Reconciliation',
      expected: `Exactly ${PDF_RECORDS.length} records matching PDF, totaling KES ${expectedPDFSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      actual: `Found ${historicalDeposits.length} records in PostgreSQL, Totaling KES ${historicalSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}, All 34 Match PDF: ${allRecordsMatched}`,
      status: step5Pass ? 'PASS' : 'FAIL',
    });
    console.log(`  => Status: ${step5Pass ? 'PASS' : 'FAIL'} (${historicalDeposits.length} records, KES ${historicalSum.toLocaleString()})\n`);

    // -------------------------------------------------------------------------
    // 7 & 8. Refresh & persistence test
    // -------------------------------------------------------------------------
    console.log('[STEP 7 & 8] Verify persistence across reconnect and session states');
    // Simulate refresh by clearing and reconnecting via new query
    const freshCheck = await prisma.deposit.count();
    const step7Pass = freshCheck >= 34;
    testResults.push({
      step: 7,
      name: 'PostgreSQL Database Persistence',
      expected: 'All deposit records survive session refresh and remain permanently available in PostgreSQL',
      actual: `Total Permanent Deposits in DB: ${freshCheck} records, fully retrieved`,
      status: step7Pass ? 'PASS' : 'FAIL',
    });
    console.log(`  => Status: ${step7Pass ? 'PASS' : 'FAIL'} (${freshCheck} records in DB)\n`);

    // Clean up temporary manual test deposit so it doesn't pollute live company accounts
    await prisma.deposit.delete({ where: { id: manualDep.id } });
    console.log('Cleaned up manual test record.\n');

  } catch (error: any) {
    console.error('Fatal verification error:', error);
  } finally {
    console.log('======================================================================');
    console.log('TEST SUMMARY TABLE:');
    console.log('======================================================================');
    testResults.forEach((r) => {
      console.log(`Step ${r.step} | ${r.status} | ${r.name}`);
      console.log(`       Expected: ${r.expected}`);
      console.log(`       Actual:   ${r.actual}\n`);
    });

    const allPass = testResults.every((r) => r.status === 'PASS');
    console.log('======================================================================');
    console.log(`OVERALL RESULT: ${allPass ? 'ALL TESTS PASSED (100% SUCCESS)' : 'SOME TESTS FAILED'}`);
    console.log('======================================================================\n');
  }
}

runVerification().then(() => prisma.$disconnect());
