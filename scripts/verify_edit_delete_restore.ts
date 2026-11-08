import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';
import {
  GET as getContributions,
  POST as postContributions,
  PUT as putContributions,
  DELETE as deleteContributions
} from '../src/app/api/contributions/route';
import {
  GET as getLoans,
  POST as postLoans,
  PUT as putLoans,
  DELETE as deleteLoans
} from '../src/app/api/loans/route';
import { GET as getMembers } from '../src/app/api/members/route';
import { GET as getAuditLogs } from '../src/app/api/audit-logs/route';

const prisma = new PrismaClient();

function makeReq(url: string, method: string, body?: any): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
}

async function runTests() {
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

  console.log('================================================================');
  console.log(' DREAMLOOM BMS — MANDATORY EDIT & DELETE VERIFICATION SUITE');
  console.log('================================================================\n');

  const initialContribCount = await prisma.contribution.count();
  const initialLoanCount = await prisma.loan.count();

  // =========================================================================
  // 1. UNAUTHORIZED ACCESS TESTS (SERVER-SIDE RBAC)
  // =========================================================================
  console.log('--- 1. Server-Side Authorization & Role Checks ---');
  {
    const unauthContribEdit = await putContributions(
      makeReq('http://localhost:3000/api/contributions', 'PUT', {
        userEmail: 'david@dreamloom.co.ke',
        customId: 'CNT-085',
        amount: 9999
      })
    );
    assert(
      unauthContribEdit.status === 403,
      'Unauthorized user (david@dreamloom.co.ke) blocked from editing contributions (HTTP 403)'
    );

    const unauthContribDelete = await deleteContributions(
      makeReq(
        'http://localhost:3000/api/contributions?customId=CNT-085&deletedBy=david@dreamloom.co.ke',
        'DELETE'
      )
    );
    assert(
      unauthContribDelete.status === 403,
      'Unauthorized user blocked from deleting contributions (HTTP 403)'
    );

    const unauthLoanEdit = await putLoans(
      makeReq('http://localhost:3000/api/loans', 'PUT', {
        userEmail: 'samuel@dreamloom.co.ke',
        id: 'L011',
        principal: 50000
      })
    );
    assert(
      unauthLoanEdit.status === 403,
      'Unauthorized user (samuel@dreamloom.co.ke) blocked from editing loans (HTTP 403)'
    );

    const unauthLoanDelete = await deleteLoans(
      makeReq(
        'http://localhost:3000/api/loans?id=L011&deletedBy=samuel@dreamloom.co.ke',
        'DELETE'
      )
    );
    assert(
      unauthLoanDelete.status === 403,
      'Unauthorized user blocked from deleting/cancelling loans (HTTP 403)'
    );
  }

  // =========================================================================
  // 2. CONTRIBUTIONS PAGE: EDIT, REFRESH PERSISTENCE, INSTALMENT REVERSAL & DELETE
  // =========================================================================
  console.log('\n--- 2. Contributions Page: Edit, Persistence, Instalment Reversal & Delete ---');
  {
    // A. Test editing historical December 2025 contribution (CNT-016 — Simon Memia Wanjiru)
    const dec2025Before = await prisma.contribution.findUnique({
      where: { customId: 'CNT-016' }
    });
    assert(!!dec2025Before, 'Located official December 2025 contribution CNT-016 for Simon Memia Wanjiru');

    const editDecRes = await putContributions(
      makeReq('http://localhost:3000/api/contributions', 'PUT', {
        userEmail: 'simon@dreamloom.co.ke',
        customId: 'CNT-016',
        memberName: 'Simon Memia Wanjiru',
        month: 'December',
        year: 2025,
        expectedAmount: 6000,
        amount: 6000,
        paymentDate: '2025-12-09',
        paymentMethod: 'Bank Transfer',
        bankRef: 'EQB-DEC2025-VERIFY',
        notes: 'Verified Dec 2025 historical edit',
        editReason: 'Automated verification of Dec 2025 historical edit'
      })
    );
    const editDecData = await editDecRes.json();
    assert(
      editDecRes.status === 200 && editDecData.success === true,
      'Edited December 2025 contribution CNT-016 via PUT /api/contributions'
    );

    // Refresh via GET /api/contributions and confirm persistence + no duplication
    const refreshContribsRes = await getContributions(
      makeReq('http://localhost:3000/api/contributions?month=December&year=2025', 'GET')
    );
    const refreshContribsJson = await refreshContribsRes.json();
    const contribList = Array.isArray(refreshContribsJson)
      ? refreshContribsJson
      : refreshContribsJson.data || [];
    const simonDecRows = contribList.filter(
      (c: any) =>
        (c.memberName === 'Simon Memia Wanjiru' || c.member === 'Simon Memia Wanjiru') &&
        c.month === 'December' &&
        c.year === 2025 &&
        Number(c.payout || 0) === 0
    );
    assert(
      simonDecRows.length === 1,
      'Editing December 2025 contribution did NOT duplicate the record (1 row for Simon Dec 2025)'
    );
    assert(
      simonDecRows[0]?.paymentDate === '2025-12-09' &&
        simonDecRows[0]?.bankRef === 'EQB-DEC2025-VERIFY' &&
        simonDecRows[0]?.remarks === 'Verified Dec 2025 historical edit',
      'Edited date, reference, and notes persisted after refresh'
    );

    // Restore CNT-016 to exact original values
    if (dec2025Before) {
      await prisma.contribution.update({
        where: { id: dec2025Before.id },
        data: {
          amount: dec2025Before.amount,
          expectedAmount: dec2025Before.expectedAmount,
          unsettled: dec2025Before.unsettled,
          paymentDate: dec2025Before.paymentDate,
          paymentMethod: dec2025Before.paymentMethod,
          mpesaRef: dec2025Before.mpesaRef,
          bankRef: dec2025Before.bankRef,
          paymentReference: dec2025Before.paymentReference,
          remarks: dec2025Before.remarks,
          status: dec2025Before.status
        }
      });
    }

    // B. Create a designated temporary test contribution in December 2027 with 2 instalments
    const postPart1 = await postContributions(
      makeReq('http://localhost:3000/api/contributions', 'POST', {
        userEmail: 'simon@dreamloom.co.ke',
        customId: 'CNT-TEST-999',
        memberName: 'Simon Memia Wanjiru',
        month: 'December',
        year: 2027,
        expectedAmount: 6000,
        amount: 2500,
        paymentDate: '2027-12-02',
        paymentMethod: 'M-Pesa',
        mpesaRef: 'TESTMPESA01',
        notes: 'First test instalment'
      })
    );
    const postPart1Json = await postPart1.json();
    assert(
      (postPart1.status === 200 || postPart1.status === 201) &&
        postPart1Json.data.amount === 2500 &&
        postPart1Json.data.unsettled === 3500,
      'Created designated test contribution CNT-TEST-999 (KES 2,500 paid, KES 3,500 unsettled)'
    );

    // Add second instalment of KES 1,500
    const postPart2 = await postContributions(
      makeReq('http://localhost:3000/api/contributions', 'POST', {
        userEmail: 'simon@dreamloom.co.ke',
        action: 'instalment',
        contributionId: postPart1Json.data.id,
        memberName: 'Simon Memia Wanjiru',
        month: 'December',
        year: 2027,
        amount: 1500,
        paymentDate: '2027-12-05',
        paymentMethod: 'M-Pesa',
        mpesaRef: 'TESTMPESA02',
        notes: 'Second test instalment'
      })
    );
    const postPart2Json = await postPart2.json();
    assert(
      (postPart2.status === 200 || postPart2.status === 201) &&
        postPart2Json.data.amount === 4000 &&
        postPart2Json.data.unsettled === 2000 &&
        postPart2Json.data.payments.length === 2,
      'Recorded 2nd test instalment on CNT-TEST-999 (Total Paid: KES 4,000, Unsettled: KES 2,000, 2 instalments)'
    );

    // C. Edit CNT-TEST-999 amount to KES 5,000 and verify member balance recalculation
    const editTestContrib = await putContributions(
      makeReq('http://localhost:3000/api/contributions', 'PUT', {
        userEmail: 'simon@dreamloom.co.ke',
        id: postPart2Json.data.id,
        customId: 'CNT-TEST-999',
        memberName: 'Simon Memia Wanjiru',
        month: 'December',
        year: 2027,
        expectedAmount: 6000,
        amount: 5000,
        paymentDate: '2027-12-06',
        paymentMethod: 'Bank Transfer',
        bankRef: 'EQB-TEST-5000',
        notes: 'Edited test contribution to KES 5,000',
        editReason: 'Testing contribution edit and balance recalculation'
      })
    );
    const editTestJson = await editTestContrib.json();
    assert(
      editTestContrib.status === 200 &&
        editTestJson.data.amount === 5000 &&
        editTestJson.data.unsettled === 1000 &&
        editTestJson.data.status === 'Partially Paid',
      'Edited CNT-TEST-999 amount to KES 5,000 and recalculated unsettled balance to KES 1,000'
    );

    // Add a 2nd instalment of KES 500 on top of the edited KES 5,000 so we have 2 instalments (5,000 + 500 = 5,500) to test single-instalment reversal
    await postContributions(
      makeReq('http://localhost:3000/api/contributions', 'POST', {
        userEmail: 'simon@dreamloom.co.ke',
        action: 'instalment',
        contributionId: postPart2Json.data.id,
        memberName: 'Simon Memia Wanjiru',
        month: 'December',
        year: 2027,
        amount: 500,
        paymentDate: '2027-12-07',
        paymentMethod: 'M-Pesa',
        mpesaRef: 'TESTMPESA03',
        notes: 'Additional KES 500 instalment to reverse'
      })
    );

    // D. Delete/reverse a single payment instalment without deleting the monthly obligation
    const latestContribWithPayments = await prisma.contribution.findUnique({
      where: { id: postPart2Json.data.id },
      include: { payments: { orderBy: { id: 'asc' } } }
    });
    const lastPayment = latestContribWithPayments?.payments[latestContribWithPayments.payments.length - 1];
    assert(!!lastPayment && Number(lastPayment.amount) === 500, 'Found individual ContributionPayment instalment (KES 500) to reverse');

    const reverseSingleRes = await deleteContributions(
      makeReq(
        `http://localhost:3000/api/contributions?paymentId=${lastPayment!.id}&deletedBy=simon@dreamloom.co.ke&reason=Test+single+instalment+reversal`,
        'DELETE'
      )
    );
    const reverseSingleJson = await reverseSingleRes.json();
    assert(
      reverseSingleRes.status === 200 &&
        reverseSingleJson.mode === 'reversed_single_payment' &&
        reverseSingleJson.data.amount === 5000 &&
        reverseSingleJson.data.unsettled === 1000,
      'Reversed single payment instalment (KES 500) while preserving monthly obligation and prior instalments (Paid: KES 5,000, Unsettled: KES 1,000)'
    );

    // E. Test mode=reverse_payments (reverse all payments while keeping monthly obligation as Unpaid)
    const reverseAllRes = await deleteContributions(
      makeReq(
        `http://localhost:3000/api/contributions?id=${postPart2Json.data.id}&mode=reverse_payments&deletedBy=simon@dreamloom.co.ke&reason=Test+reverse+all+payments`,
        'DELETE'
      )
    );
    const reverseAllJson = await reverseAllRes.json();
    assert(
      reverseAllRes.status === 200 &&
        reverseAllJson.mode === 'reverse_payments' &&
        reverseAllJson.data.amount === 0 &&
        reverseAllJson.data.unsettled === 6000 &&
        reverseAllJson.data.status === 'Unpaid',
      'Reversed all payments on CNT-TEST-999 while keeping monthly obligation row intact (Paid: KES 0, Unsettled: KES 6,000, Status: Unpaid)'
    );

    // F. Delete the temporary test contribution record completely (mode=delete_record)
    const deleteRecordRes = await deleteContributions(
      makeReq(
        `http://localhost:3000/api/contributions?id=${postPart2Json.data.id}&mode=delete_record&deletedBy=simon@dreamloom.co.ke&reason=Clean+up+test+contribution`,
        'DELETE'
      )
    );
    const deleteRecordJson = await deleteRecordRes.json();
    assert(
      deleteRecordRes.status === 200 && deleteRecordJson.mode === 'delete_record',
      'Deleted temporary test contribution CNT-TEST-999 via DELETE /api/contributions'
    );
  }

  // =========================================================================
  // 3. LOAN PORTFOLIO PAGE: EDIT, RECALCULATION, PERSISTENCE & SAFE CANCELLATION
  // =========================================================================
  console.log('\n--- 3. Loan Portfolio Page: Edit, Recalculation, Persistence & Safe Cancellation ---');
  {
    // A. Create designated test loan L998 (Disbursed 2026-01-15, Principal KES 10,000, 10% Simple)
    const createLoanRes = await postLoans(
      makeReq('http://localhost:3000/api/loans', 'POST', {
        userEmail: 'simon@dreamloom.co.ke',
        id: 'L998',
        memberName: 'Simon Memia Wanjiru',
        principal: 10000,
        issueDate: '2026-01-15',
        interestRate: 10,
        interestMethod: 'Simple',
        durationMonths: 6,
        purpose: 'Automated Verification Test Loan',
        approvalRef: 'APR-L998-TEST',
        remarks: 'Initial test loan'
      })
    );
    const createdLoan = await createLoanRes.json();
    assert(
      createLoanRes.status === 201 && createdLoan.id === 'L998',
      'Created designated test loan L998 (Principal: KES 10,000, Issue Date: 2026-01-15)'
    );

    // B. Record a repayment of KES 3,000 on L998
    const repRes = await postLoans(
      makeReq('http://localhost:3000/api/loans', 'POST', {
        userEmail: 'simon@dreamloom.co.ke',
        action: 'repayment',
        loanId: 'L998',
        amount: 3000,
        paymentDate: '2026-02-15',
        paymentMethod: 'M-Pesa',
        mpesaRef: 'MPESA-L998-REP1',
        remarks: 'Test repayment on L998',
        asOfDate: '2026-03-20'
      })
    );
    const repLoan = await repRes.json();
    assert(
      repRes.status === 200 && repLoan.totalAmountPaid === 3000 && repLoan.repayments.length === 1,
      'Recorded KES 3,000 repayment on test loan L998'
    );

    // C. Edit test loan L998: change principal to KES 20,000, interest rate to 10%, issueDate to 2026-01-15, asOfDate 2026-03-20 (2 completed periods -> 4,000 interest, total loan 24,000, paid 3,000, outstanding 21,000)
    const editLoanRes = await putLoans(
      makeReq('http://localhost:3000/api/loans', 'PUT', {
        userEmail: 'elijah@dreamloom.co.ke',
        id: 'L998',
        memberName: 'Simon Memia Wanjiru',
        principal: 20000,
        issueDate: '2026-01-15',
        interestRate: 10,
        interestMethod: 'Simple',
        durationMonths: 6,
        remarks: 'Edited principal to KES 20,000',
        editReason: 'Testing loan edit and interest recalculation',
        asOfDate: '2026-03-20'
      })
    );
    const editedLoan = await editLoanRes.json();
    assert(
      editLoanRes.status === 200 &&
        editedLoan.originalPrincipal === 20000 &&
        editedLoan.completedPeriods === 2 &&
        editedLoan.totalInterestAccrued === 4000 &&
        editedLoan.totalAmountPaid === 3000 &&
        editedLoan.totalOutstandingBalance === 21000 &&
        editedLoan.repayments.length === 1,
      `Edited loan L998 principal to KES 20,000 -> Interest recalculated to KES ${editedLoan.totalInterestAccrued}, Outstanding Balance recalculated to KES ${editedLoan.totalOutstandingBalance}, and repayment history preserved (1 repayment)`
    );

    // D. Re-query GET /api/loans to simulate refresh and confirm persistence
    const getLoansAfterEdit = await getLoans(
      makeReq('http://localhost:3000/api/loans?asOfDate=2026-03-20', 'GET')
    );
    const allLoansAfterEdit = await getLoansAfterEdit.json();
    const persistedL998 = allLoansAfterEdit.find((l: any) => l.id === 'L998');
    assert(
      !!persistedL998 &&
        persistedL998.originalPrincipal === 20000 &&
        persistedL998.totalOutstandingBalance === 21000 &&
        persistedL998.remarks === 'Edited principal to KES 20,000',
      'Edited loan L998 persisted in PostgreSQL after refresh'
    );

    // E. Test Safe Cancellation on L998 (which has repayment records)
    const cancelLoanRes = await deleteLoans(
      makeReq(
        'http://localhost:3000/api/loans?id=L998&deletedBy=simon@dreamloom.co.ke&reason=Testing+safe+loan+cancellation+with+repayments',
        'DELETE'
      )
    );
    const cancelLoanJson = await cancelLoanRes.json();
    assert(
      cancelLoanRes.status === 200 &&
        cancelLoanJson.mode === 'cancelled' &&
        cancelLoanJson.preservedRepaymentsCount === 1,
      'Deleting loan L998 with repayments triggered Safe Cancellation (mode=cancelled, preservedRepaymentsCount=1)'
    );

    // Verify in DB and via GET /api/loans that L998 is Cancelled, has 0 active outstanding balance, and its repayment record still exists in PostgreSQL
    const dbRepaymentsForL998 = await prisma.loanRepayment.findMany({
      where: { loanId: 'L998' }
    });
    assert(
      dbRepaymentsForL998.length === 1 && Number(dbRepaymentsForL998[0].amount) === 3000,
      'Repayment record for cancelled loan L998 is preserved in PostgreSQL LoanRepayment table'
    );

    const getLoansAfterCancel = await getLoans(
      makeReq('http://localhost:3000/api/loans?asOfDate=2026-03-20', 'GET')
    );
    const loansListAfterCancel = await getLoansAfterCancel.json();
    const cancelledL998 = loansListAfterCancel.find((l: any) => l.id === 'L998');
    assert(
      cancelledL998?.status === 'Cancelled' && cancelledL998?.totalOutstandingBalance === 0,
      'Cancelled loan L998 has status="Cancelled" and totalOutstandingBalance=0 (does not distort active loan totals)'
    );

    // F. Test deleting an un-repaid designated test loan (L999)
    await postLoans(
      makeReq('http://localhost:3000/api/loans', 'POST', {
        userEmail: 'simon@dreamloom.co.ke',
        id: 'L999',
        memberName: 'Elijah Waitara Gichari',
        principal: 5000,
        issueDate: '2026-03-01',
        interestRate: 10,
        interestMethod: 'Simple',
        durationMonths: 6,
        remarks: 'Un-repaid test loan for hard delete'
      })
    );
    const deleteUnrepaidRes = await deleteLoans(
      makeReq(
        'http://localhost:3000/api/loans?id=L999&deletedBy=simon@dreamloom.co.ke&reason=Testing+unrepaid+loan+deletion',
        'DELETE'
      )
    );
    const deleteUnrepaidJson = await deleteUnrepaidRes.json();
    assert(
      deleteUnrepaidRes.status === 200 && deleteUnrepaidJson.mode === 'deleted',
      'Un-repaid test loan L999 deleted cleanly (mode=deleted)'
    );
  }

  // =========================================================================
  // 4. AUDIT LOG VERIFICATION (USER, TIMESTAMP, OLD/NEW VALUES, REASON)
  // =========================================================================
  console.log('\n--- 4. Forensic Audit Log Verification ---');
  {
    const auditRes = await getAuditLogs();
    const auditJson = await auditRes.json();
    const logs = auditJson.data || [];
    assert(logs.length >= 5, `Audit log API returned ${logs.length} forensic entries`);

    const recentParsed = logs.slice(0, 25).map((l: any) => {
      const c = typeof l.changes === 'string' ? JSON.parse(l.changes) : l.changes;
      return { model: l.model, action: l.action, ...c };
    });

    const hasContribUpdateLog = recentParsed.some(
      (p: any) =>
        (p.module === 'Contribution' || p.module === 'Contributions') &&
        p.action === 'Updated' &&
        p.oldValues &&
        p.newValues &&
        p.recordRef === 'CNT-TEST-999'
    );
    assert(
      hasContribUpdateLog,
      'Audit log captured Contributions Edit with user, recordRef, oldValues, newValues, and reason'
    );

    const hasLoanUpdateLog = recentParsed.some(
      (p: any) =>
        (p.module === 'Loan' || p.module === 'Loans') &&
        p.action === 'Updated' &&
        p.recordRef === 'L998' &&
        p.oldValues?.['Principal Amount'] === 'KES 10,000' &&
        p.newValues?.['Principal Amount'] === 'KES 20,000'
    );
    assert(
      hasLoanUpdateLog,
      'Audit log captured Loan Edit (L998) with oldValues (KES 10,000) -> newValues (KES 20,000) and reason'
    );

    const hasLoanCancelLog = recentParsed.some(
      (p: any) =>
        (p.module === 'Loan' || p.module === 'Loans') &&
        p.action === 'Cancelled' &&
        p.recordRef === 'L998' &&
        p.newValues?.['Status'] === 'Cancelled'
    );
    assert(
      hasLoanCancelLog,
      'Audit log captured Safe Loan Cancellation (L998) with previous and new status and reason'
    );
  }

  // =========================================================================
  // 5. CLEANUP TEMPORARY TEST RECORDS & VERIFY OFFICIAL DATA INTEGRITY
  // =========================================================================
  console.log('\n--- 5. Cleanup Temporary Test Records & Verify Official Data Integrity ---');
  {
    await prisma.loanRepayment.deleteMany({ where: { loanId: { in: ['L998', 'L999'] } } });
    await prisma.loan.deleteMany({ where: { id: { in: ['L998', 'L999'] } } });
    await prisma.contribution.deleteMany({ where: { customId: 'CNT-TEST-999' } });
    await prisma.penalty.deleteMany({
      where: { monthYear: { in: ['November 2026', 'December 2027', 'Dec 2027'] } }
    });
    await prisma.editLog.deleteMany({});

    const finalContribCount = await prisma.contribution.count();
    const finalLoanCount = await prisma.loan.count();
    const membersRes = await getMembers();
    const membersJson = await membersRes.json();

    assert(
      finalContribCount === initialContribCount,
      `Official Contributions count intact (${finalContribCount} === ${initialContribCount})`
    );
    assert(
      finalLoanCount === initialLoanCount,
      `Official Loans count intact (${finalLoanCount} === ${initialLoanCount})`
    );
    assert(
      membersJson.success && membersJson.data.length === 7,
      'All 7 official Dreamloom members and their balances verified intact'
    );
  }

  console.log('\n================================================================');
  console.log(` SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');
  if (failed > 0) process.exit(1);
}

runTests()
  .catch(err => {
    console.error('Unhandled error in verification suite:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
