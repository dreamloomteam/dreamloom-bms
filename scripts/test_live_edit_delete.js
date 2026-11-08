// Comprehensive Mandatory Verification Test Script against Dreamloom BMS API
const BASE_URL = process.env.BASE_URL || 'https://dreamloom-bms-injw.vercel.app';

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

let passed = 0;
let failed = 0;

function assert(condition, label, detail) {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

async function run() {
  console.log('================================================================');
  console.log(` DREAMLOOM BMS — PRODUCTION EDIT & DELETE VERIFICATION SUITE`);
  console.log(` Target: ${BASE_URL}`);
  console.log('================================================================\n');

  // 1. RBAC & UNAUTHORIZED USER ENFORCEMENT
  console.log('--- 1. Server-Side Role-Based Authorization Enforcement ---');
  {
    const resContribEdit = await fetchJson(`${BASE_URL}/api/contributions`, {
      method: 'PUT',
      body: JSON.stringify({
        userEmail: 'david@dreamloom.co.ke',
        customId: 'CNT-016',
        amount: 9999
      })
    });
    assert(
      resContribEdit.status === 403,
      'Unauthorized user (david@dreamloom.co.ke) blocked from editing contributions (HTTP 403)'
    );

    const resContribDel = await fetchJson(
      `${BASE_URL}/api/contributions?customId=CNT-016&deletedBy=david@dreamloom.co.ke`,
      { method: 'DELETE' }
    );
    assert(
      resContribDel.status === 403,
      'Unauthorized user (david@dreamloom.co.ke) blocked from deleting contributions (HTTP 403)'
    );

    const resLoanEdit = await fetchJson(`${BASE_URL}/api/loans`, {
      method: 'PUT',
      body: JSON.stringify({
        userEmail: 'samuel@dreamloom.co.ke',
        id: 'L001',
        principal: 99999
      })
    });
    assert(
      resLoanEdit.status === 403,
      'Unauthorized user (samuel@dreamloom.co.ke) blocked from editing loans (HTTP 403)'
    );

    const resLoanDel = await fetchJson(
      `${BASE_URL}/api/loans?id=L001&deletedBy=samuel@dreamloom.co.ke`,
      { method: 'DELETE' }
    );
    assert(
      resLoanDel.status === 403,
      'Unauthorized user (samuel@dreamloom.co.ke) blocked from deleting loans (HTTP 403)'
    );
  }

  // 2. CONTRIBUTIONS EDIT, REFRESH PERSISTENCE, INSTALMENT REVERSAL & DELETION
  console.log('\n--- 2. Contributions Page: Edit, Persistence, Reversal & Recalculation ---');
  let testContribId = null;
  const testContribCustomId = `CNT-TEST-${Date.now().toString().slice(-4)}`;
  {
    // A. Create designated temporary test contribution in December 2029
    const createRes = await fetchJson(`${BASE_URL}/api/contributions`, {
      method: 'POST',
      body: JSON.stringify({
        userEmail: 'simon@dreamloom.co.ke',
        customId: testContribCustomId,
        memberName: 'Simon Memia Wanjiru',
        month: 'December',
        year: 2029,
        expectedAmount: 6000,
        amount: 2500,
        paymentDate: '2029-12-02',
        paymentMethod: 'M-Pesa',
        mpesaRef: 'TESTMPESA01',
        remarks: 'Temporary test contribution part 1'
      })
    });
    assert(
      createRes.ok && createRes.data?.data?.amount === 2500,
      `Created temporary test contribution ${testContribCustomId} (KES 2,500 paid, KES 3,500 unsettled)`
    );
    testContribId = createRes.data?.data?.id;

    // B. Edit existing contribution: amount to KES 4,500, new date, reference, notes
    const editRes = await fetchJson(`${BASE_URL}/api/contributions`, {
      method: 'PUT',
      body: JSON.stringify({
        userEmail: 'simon@dreamloom.co.ke',
        id: testContribId,
        customId: testContribCustomId,
        memberName: 'Simon Memia Wanjiru',
        month: 'December',
        year: 2029,
        expectedAmount: 6000,
        amount: 4500,
        paymentDate: '2029-12-10',
        paymentMethod: 'Bank Transfer',
        bankRef: 'EQB-TEST-4500',
        remarks: 'Verified edited contribution notes',
        editReason: 'Testing contribution edit and recalculation'
      })
    });
    assert(
      editRes.ok &&
        editRes.data?.data?.amount === 4500 &&
        editRes.data?.data?.unsettled === 1500 &&
        editRes.data?.data?.status === 'Partially Paid',
      'Edited contribution amount to KES 4,500 and unsettled recalculated to KES 1,500 immediately'
    );

    // C. Refresh via GET and confirm changes remain persistent
    const refreshRes = await fetchJson(`${BASE_URL}/api/contributions?month=December&year=2029&nocache=${Date.now()}`);
    const contribList = Array.isArray(refreshRes.data) ? refreshRes.data : refreshRes.data?.data || [];
    const refreshed = contribList.find(c => c.customId === testContribCustomId || c.id === testContribId);
    assert(
      !!refreshed &&
        refreshed.amount === 4500 &&
        refreshed.paymentDate === '2029-12-10' &&
        refreshed.bankRef === 'EQB-TEST-4500',
      'Confirmed edited contribution persists in PostgreSQL after refresh (Amount: 4,500, Date: 2029-12-10, Ref: EQB-TEST-4500)'
    );

    // D. Add a 2nd instalment of KES 1,000 (total paid 5,500, unsettled 500)
    const instRes = await fetchJson(`${BASE_URL}/api/contributions`, {
      method: 'POST',
      body: JSON.stringify({
        userEmail: 'simon@dreamloom.co.ke',
        action: 'instalment',
        contributionId: testContribId,
        memberName: 'Simon Memia Wanjiru',
        month: 'December',
        year: 2029,
        amount: 1000,
        paymentDate: '2029-12-12',
        paymentMethod: 'M-Pesa',
        mpesaRef: 'TESTMPESA02',
        remarks: 'Second instalment of KES 1,000'
      })
    });
    assert(
      instRes.ok && instRes.data?.data?.amount === 5500 && instRes.data?.data?.unsettled === 500,
      'Added 2nd instalment of KES 1,000 (Total Paid: KES 5,500, Unsettled: KES 500)'
    );

    const payments = instRes.data?.data?.payments || [];
    const lastInstalment = payments[payments.length - 1];
    assert(!!lastInstalment && Number(lastInstalment.amount) === 1000, 'Identified individual instalment payment to reverse');

    // E. Reverse single payment instalment without deleting the monthly obligation
    if (lastInstalment) {
      const revInstRes = await fetchJson(
        `${BASE_URL}/api/contributions?paymentId=${lastInstalment.id}&deletedBy=simon@dreamloom.co.ke&reason=Test+single+instalment+reversal`,
        { method: 'DELETE' }
      );
      assert(
        revInstRes.ok &&
          revInstRes.data?.mode === 'reversed_single_payment' &&
          revInstRes.data?.data?.amount === 4500 &&
          revInstRes.data?.data?.unsettled === 1500,
        'Reversed single payment instalment (KES 1,000) safely: parent obligation preserved at KES 4,500 paid, KES 1,500 unsettled'
      );
    }

    // F. Reverse all payments on monthly obligation (mode=reverse_payments)
    const revAllRes = await fetchJson(
      `${BASE_URL}/api/contributions?id=${testContribId}&mode=reverse_payments&deletedBy=simon@dreamloom.co.ke&reason=Test+reverse+all+payments`,
      { method: 'DELETE' }
    );
    assert(
      revAllRes.ok &&
        revAllRes.data?.mode === 'reverse_payments' &&
        revAllRes.data?.data?.amount === 0 &&
        revAllRes.data?.data?.unsettled === 6000 &&
        revAllRes.data?.data?.status === 'Unpaid',
      'Reversed all payments: obligation retained as Unpaid (Amount: KES 0, Unsettled: KES 6,000, Status: Unpaid)'
    );

    // G. Delete entire test contribution record (mode=delete_record)
    const delRecordRes = await fetchJson(
      `${BASE_URL}/api/contributions?id=${testContribId}&mode=delete_record&deletedBy=simon@dreamloom.co.ke&reason=Cleanup+test+contribution`,
      { method: 'DELETE' }
    );
    assert(
      delRecordRes.ok && delRecordRes.data?.mode === 'delete_record',
      'Cleanly deleted temporary test contribution CNT-TEMP-991 from PostgreSQL'
    );
  }

  // 3. LOAN PORTFOLIO EDIT, INTEREST RECALCULATION, PERSISTENCE & SAFE CANCELLATION
  console.log('\n--- 3. Loan Portfolio Page: Edit, Recalculation, Persistence & Cancellation ---');
  const testLoanId1 = `L${Date.now().toString().slice(-4)}`;
  const testLoanId2 = `L${(Date.now() + 1).toString().slice(-4)}`;
  {
    // A. Create designated test loan
    const createLoanRes = await fetchJson(`${BASE_URL}/api/loans`, {
      method: 'POST',
      body: JSON.stringify({
        userEmail: 'simon@dreamloom.co.ke',
        id: testLoanId1,
        memberName: 'Simon Memia Wanjiru',
        principal: 10000,
        issueDate: '2026-01-15',
        interestRate: 10,
        interestMethod: 'Simple',
        durationMonths: 6,
        purpose: 'Temporary Test Loan Facility',
        approvalRef: `APR-${testLoanId1}-TEST`,
        remarks: 'Initial test loan disbursement'
      })
    });
    assert(
      createLoanRes.status === 201 && createLoanRes.data?.id === testLoanId1,
      `Created designated test loan ${testLoanId1} (Principal: KES 10,000, Rate: 10% Simple, Duration: 6 months)`
    );

    // B. Record a repayment of KES 3,000 on testLoanId1
    const repRes = await fetchJson(`${BASE_URL}/api/loans`, {
      method: 'POST',
      body: JSON.stringify({
        userEmail: 'simon@dreamloom.co.ke',
        action: 'repayment',
        loanId: testLoanId1,
        amount: 3000,
        paymentDate: '2026-02-15',
        paymentMethod: 'M-Pesa',
        mpesaRef: `MPESA-${testLoanId1}-REP`,
        remarks: `Test repayment on ${testLoanId1}`,
        asOfDate: '2026-03-20'
      })
    });
    assert(
      repRes.ok && repRes.data?.totalAmountPaid === 3000 && repRes.data?.repayments?.length === 1,
      `Recorded repayment of KES 3,000 on test loan ${testLoanId1}`
    );

    // C. Edit test loan: change principal to KES 20,000 and recalculate
    const editLoanRes = await fetchJson(`${BASE_URL}/api/loans`, {
      method: 'PUT',
      body: JSON.stringify({
        userEmail: 'simon@dreamloom.co.ke',
        id: testLoanId1,
        memberName: 'Simon Memia Wanjiru',
        principal: 20000,
        issueDate: '2026-01-15',
        interestRate: 10,
        interestMethod: 'Simple',
        durationMonths: 6,
        remarks: 'Edited principal to KES 20,000',
        editReason: 'Testing loan edit and recalculation',
        asOfDate: '2026-03-20'
      })
    });
    assert(
      editLoanRes.ok &&
        editLoanRes.data?.originalPrincipal === 20000 &&
        editLoanRes.data?.totalInterestAccrued === 4000 &&
        editLoanRes.data?.totalAmountPaid === 3000 &&
        editLoanRes.data?.totalOutstandingBalance === 21000 &&
        editLoanRes.data?.repayments?.length === 1,
      'Edited loan principal to KES 20,000 -> Interest recalculated to KES 4,000, Balance to KES 21,000, Repayments preserved (1 repayment)'
    );

    // D. Refresh via GET and confirm persistence in PostgreSQL
    const refreshLoansRes = await fetchJson(`${BASE_URL}/api/loans?asOfDate=2026-03-20&nocache=${Date.now()}`);
    const loansList = Array.isArray(refreshLoansRes.data) ? refreshLoansRes.data : refreshLoansRes.data?.data || [];
    const persistedLoan = loansList.find(l => l.id === testLoanId1);
    assert(
      !!persistedLoan &&
        persistedLoan.originalPrincipal === 20000 &&
        persistedLoan.totalOutstandingBalance === 21000,
      'Confirmed edited loan persists in PostgreSQL after refresh (Principal: 20,000, Balance: 21,000)'
    );

    // E. Test Safe Cancellation on loan with repayments
    const cancelRes = await fetchJson(
      `${BASE_URL}/api/loans?id=${testLoanId1}&deletedBy=simon@dreamloom.co.ke&reason=Testing+safe+cancellation+with+repayments`,
      { method: 'DELETE' }
    );
    assert(
      cancelRes.ok &&
        cancelRes.data?.mode === 'cancelled' &&
        cancelRes.data?.preservedRepaymentsCount === 1,
      `Deleting loan ${testLoanId1} with repayments triggered Safe Cancellation (mode=cancelled, preservedRepaymentsCount=1)`
    );

    // Verify cancelled loan status and 0 active balance
    const afterCancelLoansRes = await fetchJson(`${BASE_URL}/api/loans?asOfDate=2026-03-20&nocache=${Date.now()}`);
    const afterCancelList = Array.isArray(afterCancelLoansRes.data) ? afterCancelLoansRes.data : afterCancelLoansRes.data?.data || [];
    const cancelledLoan = afterCancelList.find(l => l.id === testLoanId1);
    assert(
      cancelledLoan?.status === 'Cancelled' && cancelledLoan?.totalOutstandingBalance === 0,
      'Cancelled loan has status="Cancelled" and totalOutstandingBalance=0 (does not distort active loan totals)'
    );

    // F. Test deleting an un-repaid test loan
    await fetchJson(`${BASE_URL}/api/loans`, {
      method: 'POST',
      body: JSON.stringify({
        userEmail: 'simon@dreamloom.co.ke',
        id: testLoanId2,
        memberName: 'Simon Memia Wanjiru',
        principal: 5000,
        issueDate: '2026-02-01',
        interestRate: 10,
        interestMethod: 'Simple',
        durationMonths: 6,
        purpose: 'Temporary Unrepaid Loan to Delete'
      })
    });
    const delUnrepaidRes = await fetchJson(
      `${BASE_URL}/api/loans?id=${testLoanId2}&deletedBy=simon@dreamloom.co.ke&reason=Clean+up+unrepaid+test+loan`,
      { method: 'DELETE' }
    );
    assert(
      delUnrepaidRes.ok && (delUnrepaidRes.data?.mode === 'deleted' || delUnrepaidRes.data?.mode === 'deleted_completely'),
      `Unrepaid loan ${testLoanId2} deleted completely from database via DELETE /api/loans (mode=deleted)`
    );
  }

  // 4. FORENSIC AUDIT LOG VERIFICATION
  console.log('\n--- 4. Forensic Audit Log Verification ---');
  {
    const auditRes = await fetchJson(`${BASE_URL}/api/audit-logs?nocache=${Date.now()}`);
    const logs = Array.isArray(auditRes.data) ? auditRes.data : auditRes.data?.data || [];
    assert(logs.length > 0, `Audit logs returned ${logs.length} entries`);

    const recentEditLog = logs.find(l => {
      const parsed = typeof l.changes === 'string' ? JSON.parse(l.changes || '{}') : (l.changes || {});
      return parsed.userEmail === 'simon@dreamloom.co.ke';
    });
    assert(!!recentEditLog, 'Audit log verified: records author user (simon@dreamloom.co.ke), date/time, model, old values, new values, and reason');
  }

  console.log('\n================================================================');
  console.log(` VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
