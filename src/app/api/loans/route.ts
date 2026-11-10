import { NextResponse } from 'next/server';
import { prisma, ensureDatabaseSchema } from '@/lib/prisma';
import {
  calculateLoanProfile,
  toUTCMidnight,
  formatISODate
} from '@/lib/loanCalculator';
import { ALL_MONTHS, MONTH_ABBRS } from '@/lib/dateUtils';
import { createAuditLog, isAuthorizedEditor, resolveEditorName } from '@/lib/audit';

function enrichLoanForResponse(loan: any, asOfDate?: Date | string | null) {
  const memberName = loan.member?.fullName || loan.borrower || 'Member';
  const profile = calculateLoanProfile(
    {
      ...loan,
      memberName,
      repayments: loan.repayments || []
    },
    asOfDate
  );

  return {
    ...loan,
    borrower: memberName,
    memberName,
    issueDate: profile.issueDate,
    issueDateFormatted: profile.issueDateFormatted,
    principal: profile.originalPrincipal,
    originalPrincipal: profile.originalPrincipal,
    interestRate: profile.monthlyInterestRate,
    monthlyInterestRate: profile.monthlyInterestRate,
    interestMethod: profile.interestMethod,
    compoundingFrequency: profile.compoundingFrequency,
    durationMonths: profile.loanDuration,
    loanDuration: profile.loanDuration,
    repaymentTerms: profile.repaymentTerms,
    allocationPolicy: profile.allocationPolicy,
    purpose: profile.purpose,
    approvalRef: profile.approvalRef,
    remarks: profile.remarks,
    completedPeriods: profile.completedPeriods,
    interest: profile.totalInterestAccrued,
    totalInterestAccrued: profile.totalInterestAccrued,
    interestPaid: profile.interestPaid,
    unpaidInterest: profile.unpaidInterest,
    principalPaid: profile.principalRepaid,
    principalRepaid: profile.principalRepaid,
    remainingPrincipal: profile.remainingPrincipal,
    totalPayable: profile.totalLoanAmount,
    totalLoan: profile.totalLoanAmount,
    totalLoanAmount: profile.totalLoanAmount,
    paidAmount: profile.totalAmountPaid,
    paid: profile.totalAmountPaid,
    totalAmountPaid: profile.totalAmountPaid,
    balance: profile.totalOutstandingBalance,
    totalOutstandingBalance: profile.totalOutstandingBalance,
    status: profile.status,
    clearedDate: profile.settlementDate,
    settlementDate: profile.settlementDate,
    schedule: profile.schedule,
    repayments: profile.repayments
  };
}

function buildLoanAuditSnapshot(loan: any, asOfDate?: Date | string | null) {
  const enriched = enrichLoanForResponse(loan, asOfDate);
  return {
    'Loan ID': enriched.id,
    'Approval Ref': enriched.approvalRef || `APR-${enriched.id}`,
    'Member Name': enriched.memberName,
    'Issue Date': enriched.issueDate,
    'Principal Amount': `KES ${Number(enriched.principal || 0).toLocaleString()}`,
    'Interest Rate': `${enriched.interestRate}% / month`,
    'Interest Method': enriched.interestMethod,
    'Duration': `${enriched.durationMonths} Months`,
    'Interest Accrued': `KES ${Number(enriched.totalInterestAccrued || 0).toLocaleString()}`,
    'Total Paid': `KES ${Number(enriched.totalAmountPaid || 0).toLocaleString()}`,
    'Outstanding Principal': `KES ${Number(enriched.remainingPrincipal || 0).toLocaleString()}`,
    'Outstanding Interest': `KES ${Number(enriched.unpaidInterest || 0).toLocaleString()}`,
    'Total Outstanding Balance': `KES ${Number(enriched.totalOutstandingBalance || 0).toLocaleString()}`,
    'Status': enriched.status,
    'Repayment Records': Array.isArray(enriched.repayments) ? enriched.repayments.length : 0,
    'Notes': enriched.remarks || '-'
  };
}

function resolveAsOfDateFromParams(searchParams: URLSearchParams): Date | null {
  const explicitAsOf = searchParams.get('asOfDate');
  if (explicitAsOf) {
    return toUTCMidnight(explicitAsOf);
  }
  const reportMonth = searchParams.get('reportMonth');
  const reportYear = searchParams.get('reportYear');
  if (reportMonth && reportMonth !== 'All' && reportYear && reportYear !== 'All') {
    const mIdx = ALL_MONTHS.findIndex(
      (m, i) =>
        m.toLowerCase() === reportMonth.toLowerCase() ||
        MONTH_ABBRS[i].toLowerCase() === reportMonth.slice(0, 3).toLowerCase()
    );
    const yNum = parseInt(reportYear, 10);
    if (mIdx >= 0 && !isNaN(yNum)) {
      return new Date(Date.UTC(yNum, mIdx + 1, 0));
    }
  }
  return null;
}

export async function GET(request: Request) {
  try {
    await ensureDatabaseSchema();
    const { searchParams } = new URL(request.url);
    const asOfDate = resolveAsOfDateFromParams(searchParams);
    const filterMemberId = searchParams.get('memberId');

    const loans = await prisma.loan.findMany({
      include: {
        member: true,
        repayments: {
          orderBy: [{ paymentDate: 'asc' }, { id: 'asc' }]
        }
      },
      orderBy: { issueDate: 'desc' }
    });

    // Synchronize authoritative computed values back into PostgreSQL for loans with repayments
    for (const l of loans) {
      if (l.status === 'Cancelled') continue;
      const profile = calculateLoanProfile(
        { ...l, memberName: l.member?.fullName, repayments: l.repayments || [] },
        asOfDate
      );
      const isSettled = profile.status === 'Settled';
      const statusChanged = l.status !== profile.status;
      const paidChanged = Math.abs(Number(l.paidAmount) - profile.totalAmountPaid) > 0.01;
      const interestChanged = Math.abs(Number(l.interest) - profile.totalInterestAccrued) > 0.01;

      if (statusChanged || paidChanged || interestChanged) {
        await prisma.loan.update({
          where: { id: l.id },
          data: {
            status: profile.status,
            paidAmount: profile.totalAmountPaid,
            interestPaid: profile.interestPaid,
            principalPaid: profile.principalRepaid,
            interest: profile.totalInterestAccrued,
            totalPayable: profile.totalLoanAmount,
            clearedDate: isSettled ? (l.clearedDate || toUTCMidnight(profile.settlementDate)) : null
          }
        });

        for (const ep of profile.repayments) {
          if (ep.id && Number(ep.id) > 0) {
            await prisma.loanRepayment.update({
              where: { id: Number(ep.id) },
              data: {
                interestAllocated: ep.computedInterestAllocated,
                principalAllocated: ep.computedPrincipalAllocated
              }
            });
          }
        }
        l.status = profile.status;
        l.paidAmount = profile.totalAmountPaid;
        l.interestPaid = profile.interestPaid;
        l.principalPaid = profile.principalRepaid;
        l.interest = profile.totalInterestAccrued;
        l.totalPayable = profile.totalLoanAmount;
        l.clearedDate = isSettled ? (l.clearedDate || toUTCMidnight(profile.settlementDate)) : null;
      }
    }

    let enriched = loans.map(l => enrichLoanForResponse(l, asOfDate));
    if (filterMemberId) {
      const mId = parseInt(filterMemberId, 10);
      if (!isNaN(mId)) {
        enriched = enriched.filter(l => l.memberId === mId);
      }
    }
    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Failed to fetch loans:', error);
    return NextResponse.json({ error: 'Failed to load loans' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await request.json();
    const { action } = body;

    const authUser =
      body.userEmail ||
      body.updatedBy ||
      body.createdBy ||
      body.recordedBy ||
      request.headers.get('x-user-email');

    if (!isAuthorizedEditor(authUser)) {
      return NextResponse.json(
        { error: 'Forbidden: Only authorized administrators can disburse loans or record repayments.' },
        { status: 403 }
      );
    }

    // -------------------------------------------------------------------------
    // MODE 1: Record Loan Repayment (Partial or Full)
    // -------------------------------------------------------------------------
    if (action === 'repayment') {
      const {
        loanId,
        amount,
        paymentDate,
        paymentMethod,
        mpesaRef,
        bankRef,
        reference,
        remarks,
        recordedBy,
        asOfDate
      } = body;

      if (!loanId || String(loanId).trim() === '') {
        return NextResponse.json({ error: 'Loan ID is required for repayment.' }, { status: 400 });
      }

      const payAmt = Number(amount);
      if (isNaN(payAmt) || payAmt <= 0) {
        return NextResponse.json(
          { error: 'Repayment amount must be a positive number greater than 0.' },
          { status: 400 }
        );
      }

      if (!paymentDate || String(paymentDate).trim() === '') {
        return NextResponse.json(
          { error: 'Payment Date is required for repayment.' },
          { status: 400 }
        );
      }

      const parsedPayDate = new Date(
        String(paymentDate).includes('T') ? paymentDate : `${paymentDate} UTC`
      );
      if (isNaN(parsedPayDate.getTime())) {
        return NextResponse.json(
          { error: `Invalid payment date: "${paymentDate}".` },
          { status: 400 }
        );
      }

      const loan = await prisma.loan.findUnique({
        where: { id: String(loanId).trim() },
        include: {
          member: true,
          repayments: { orderBy: [{ paymentDate: 'asc' }, { id: 'asc' }] }
        }
      });

      if (!loan) {
        return NextResponse.json(
          { error: `Loan "${loanId}" not found in database.` },
          { status: 404 }
        );
      }

      const refToCheck = (mpesaRef || bankRef || reference || '').trim();
      if (refToCheck && refToCheck !== '-') {
        const dupRep = await prisma.loanRepayment.findFirst({
          where: {
            OR: [{ mpesaRef: refToCheck }, { bankRef: refToCheck }, { reference: refToCheck }]
          }
        });
        if (dupRep) {
          return NextResponse.json(
            { error: `Duplicate repayment reference "${refToCheck}" already exists.` },
            { status: 409 }
          );
        }
      }

      const payDateUTC = toUTCMidnight(paymentDate);
      const payDateStr = formatISODate(payDateUTC);
      const evalDate = asOfDate
        ? (payDateUTC.getTime() > toUTCMidnight(asOfDate).getTime() ? payDateUTC : toUTCMidnight(asOfDate))
        : payDateUTC.getTime() > Date.now()
        ? payDateUTC
        : toUTCMidnight(new Date());

      const oldSnapshot = buildLoanAuditSnapshot(loan, evalDate);

      if (loan.repayments.length === 0 && Number(loan.paidAmount) > 0) {
        await prisma.loanRepayment.create({
          data: {
            loanId: loan.id,
            memberId: loan.memberId,
            paymentDate: loan.clearedDate || loan.issueDate,
            paymentDateStr: formatISODate(toUTCMidnight(loan.clearedDate || loan.issueDate)),
            amount: Number(loan.paidAmount),
            interestAllocated: Number(loan.interestPaid) || 0,
            principalAllocated: Number(loan.principalPaid) || 0,
            paymentMethod: 'M-Pesa',
            reference: `INIT-${loan.id}`,
            remarks: 'Previously recorded loan payment',
            recordedBy: 'System'
          }
        });
      }

      const createdRepayment = await prisma.loanRepayment.create({
        data: {
          loanId: loan.id,
          memberId: loan.memberId,
          paymentDate: payDateUTC,
          paymentDateStr: payDateStr,
          amount: payAmt,
          interestAllocated: 0,
          principalAllocated: 0,
          paymentMethod: paymentMethod || 'M-Pesa',
          mpesaRef: mpesaRef || null,
          bankRef: bankRef || null,
          reference: refToCheck || `REP-${loan.id}-${Date.now().toString().slice(-5)}`,
          remarks: remarks || 'Loan repayment',
          recordedBy: recordedBy || resolveEditorName(authUser)
        }
      });

      const loanWithReps = await prisma.loan.findUnique({
        where: { id: loan.id },
        include: {
          member: true,
          repayments: { orderBy: [{ paymentDate: 'asc' }, { id: 'asc' }] }
        }
      });

      const profile = calculateLoanProfile(
        {
          ...loanWithReps!,
          memberName: loanWithReps!.member?.fullName,
          repayments: loanWithReps!.repayments
        },
        evalDate
      );

      for (const ep of profile.repayments) {
        if (ep.id && Number(ep.id) > 0) {
          await prisma.loanRepayment.update({
            where: { id: Number(ep.id) },
            data: {
              interestAllocated: ep.computedInterestAllocated,
              principalAllocated: ep.computedPrincipalAllocated
            }
          });
        }
      }

      const isNowSettled = profile.status === 'Settled';
      const updatedLoan = await prisma.loan.update({
        where: { id: loan.id },
        data: {
          interest: profile.totalInterestAccrued,
          totalPayable: profile.totalLoanAmount,
          paidAmount: profile.totalAmountPaid,
          interestPaid: profile.interestPaid,
          principalPaid: profile.principalRepaid,
          status: profile.status,
          clearedDate: isNowSettled ? payDateUTC : null
        },
        include: {
          member: true,
          repayments: { orderBy: [{ paymentDate: 'asc' }, { id: 'asc' }] }
        }
      });

      await createAuditLog({
        model: 'LoanRepayment',
        action: 'Added',
        recordId: createdRepayment.id,
        recordRef: `${loan.id} (REP-${createdRepayment.id})`,
        userEmail: authUser,
        userName: resolveEditorName(authUser),
        member: updatedLoan.member?.fullName || 'Member',
        oldValues: oldSnapshot,
        newValues: {
          ...buildLoanAuditSnapshot(updatedLoan, evalDate),
          'Repayment Amount': `KES ${payAmt.toLocaleString()}`,
          'Payment Date': payDateStr,
          'Reference': createdRepayment.reference || '-'
        },
        remarks: `Recorded KES ${payAmt.toLocaleString()} repayment on Loan ${loan.id} (${updatedLoan.member?.fullName || 'Member'})`
      });

      const enrichedUpdated = enrichLoanForResponse(updatedLoan, evalDate);
      return NextResponse.json({ ...enrichedUpdated, success: true, data: enrichedUpdated }, { status: 200 });
    }

    // -------------------------------------------------------------------------
    // MODE 2: Disburse / Create New Loan
    // -------------------------------------------------------------------------
    const {
      id,
      memberId,
      borrower,
      memberName,
      issueDate,
      principal,
      interestRate,
      interestMethod,
      compoundingFrequency,
      durationMonths,
      loanDurationMonths,
      repaymentTerms,
      allocationPolicy,
      purpose,
      loanPurpose,
      approvalRef,
      remarks,
      paid,
      status,
      clearedDate,
      createdBy,
      asOfDate
    } = body;

    const evalDate = asOfDate ? toUTCMidnight(asOfDate) : toUTCMidnight(new Date());

    const principalNum = Number(principal);
    if (principal === undefined || principal === null || principal === '' || isNaN(principalNum) || principalNum <= 0) {
      return NextResponse.json(
        { error: 'Principal Amount must be a valid positive number greater than 0.' },
        { status: 400 }
      );
    }

    const rateNum = interestRate !== undefined && interestRate !== null && interestRate !== '' ? Number(interestRate) : 10.0;
    if (isNaN(rateNum) || rateNum < 0) {
      return NextResponse.json(
        { error: 'Monthly Interest Rate cannot be negative or invalid.' },
        { status: 400 }
      );
    }

    if (!issueDate || String(issueDate).trim() === '' || String(issueDate).trim() === '-') {
      return NextResponse.json(
        { error: 'Disbursement Date is required.' },
        { status: 400 }
      );
    }
    const parsedIssueCheck = new Date(
      String(issueDate).includes('T') ? issueDate : `${issueDate} UTC`
    );
    if (isNaN(parsedIssueCheck.getTime())) {
      return NextResponse.json(
        { error: `Invalid Disbursement Date: "${issueDate}".` },
        { status: 400 }
      );
    }
    const issueDateUTC = toUTCMidnight(issueDate);

    const members = await prisma.member.findMany();
    let memberObj = null;
    if (memberId !== undefined && memberId !== null && memberId !== '') {
      memberObj = members.find(m => m.id === Number(memberId)) || null;
      if (!memberObj) {
        return NextResponse.json(
          { error: `Invalid memberId: ${memberId}. Member not found in database.` },
          { status: 400 }
        );
      }
    } else if (borrower || memberName) {
      const targetName = String(borrower || memberName).toLowerCase().trim();
      memberObj =
        members.find(
          m =>
            m.fullName.toLowerCase().trim() === targetName ||
            m.fullName.toLowerCase().includes(targetName) ||
            targetName.includes(m.fullName.toLowerCase().trim())
        ) || null;
    }

    if (!memberObj) {
      return NextResponse.json(
        { error: 'Valid Member Name or Member ID is required to disburse a loan.' },
        { status: 400 }
      );
    }

    let finalLoanId = id && String(id).trim() !== '' && String(id).trim() !== 'AUTO' ? String(id).trim() : '';
    if (finalLoanId) {
      const existingById = await prisma.loan.findUnique({ where: { id: finalLoanId } });
      if (existingById) {
        return NextResponse.json(
          { error: `Duplicate Loan ID "${finalLoanId}" already exists.` },
          { status: 409 }
        );
      }
    } else {
      const allLoans = await prisma.loan.findMany({ select: { id: true } });
      let maxNum = 15;
      for (const l of allLoans) {
        const m = l.id.match(/^L0*(\d+)$/i);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n > maxNum) maxNum = n;
        }
      }
      finalLoanId = `L${String(maxNum + 1).padStart(3, '0')}`;
      while (allLoans.some(l => l.id === finalLoanId)) {
        maxNum++;
        finalLoanId = `L${String(maxNum + 1).padStart(3, '0')}`;
      }
    }

    if (approvalRef && String(approvalRef).trim() !== '') {
      const cleanRef = String(approvalRef).trim();
      const dupApproval = await prisma.loan.findFirst({
        where: { approvalRef: cleanRef }
      });
      if (dupApproval) {
        return NextResponse.json(
          { error: `Duplicate Approval Reference "${cleanRef}" already exists on Loan ${dupApproval.id}.` },
          { status: 409 }
        );
      }
    }

    const methodStr = interestMethod || 'Simple';
    const compFreq = compoundingFrequency || 'Monthly';
    const durMonths = Math.max(1, Number(durationMonths ?? loanDurationMonths) || 6);
    const allocPolicy = allocationPolicy || 'Interest First';
    const initialPaid = Math.max(0, Number(paid) || 0);
    const finalPurpose = purpose || loanPurpose || 'Personal / Business Development';

    const tempProfile = calculateLoanProfile({
      id: finalLoanId,
      memberId: memberObj.id,
      memberName: memberObj.fullName,
      issueDate: issueDateUTC,
      principal: principalNum,
      interestRate: rateNum,
      interestMethod: methodStr,
      compoundingFrequency: compFreq,
      durationMonths: durMonths,
      repaymentTerms: repaymentTerms || 'Monthly Anniversary',
      allocationPolicy: allocPolicy,
      purpose: finalPurpose,
      approvalRef: approvalRef || `APR-${finalLoanId}`,
      remarks: remarks || '',
      paidAmount: initialPaid,
      status: status || 'Active',
      clearedDate: clearedDate && clearedDate !== '-' ? toUTCMidnight(clearedDate) : null
    }, evalDate);

    const newLoan = await prisma.loan.create({
      data: {
        id: finalLoanId,
        memberId: memberObj.id,
        issueDate: issueDateUTC,
        principal: principalNum,
        interest: tempProfile.totalInterestAccrued,
        totalPayable: tempProfile.totalLoanAmount,
        paidAmount: tempProfile.totalAmountPaid,
        principalPaid: tempProfile.principalRepaid,
        interestPaid: tempProfile.interestPaid,
        interestRate: rateNum,
        interestMethod: tempProfile.interestMethod,
        compoundingFrequency: compFreq,
        durationMonths: durMonths,
        repaymentTerms: repaymentTerms || 'Monthly Anniversary',
        allocationPolicy: tempProfile.allocationPolicy,
        purpose: finalPurpose,
        approvalRef: approvalRef && String(approvalRef).trim() !== '' ? String(approvalRef).trim() : `APR-${finalLoanId}`,
        remarks: remarks || null,
        status: status || tempProfile.status,
        clearedDate:
          tempProfile.status === 'Settled'
            ? clearedDate && clearedDate !== '-'
              ? toUTCMidnight(clearedDate)
              : toUTCMidnight(new Date())
            : null
      },
      include: {
        member: true,
        repayments: true
      }
    });

    if (initialPaid > 0) {
      await prisma.loanRepayment.create({
        data: {
          loanId: newLoan.id,
          memberId: memberObj.id,
          paymentDate: issueDateUTC,
          paymentDateStr: formatISODate(issueDateUTC),
          amount: initialPaid,
          interestAllocated: tempProfile.interestPaid,
          principalAllocated: tempProfile.principalRepaid,
          paymentMethod: 'M-Pesa',
          reference: `INIT-${newLoan.id}`,
          remarks: 'Initial payment recorded at loan entry',
          recordedBy: createdBy || resolveEditorName(authUser)
        }
      });
    }

    const refreshedLoan = await prisma.loan.findUnique({
      where: { id: newLoan.id },
      include: {
        member: true,
        repayments: { orderBy: [{ paymentDate: 'asc' }, { id: 'asc' }] }
      }
    });

    await createAuditLog({
      model: 'Loan',
      action: 'Added',
      recordRef: newLoan.id,
      userEmail: authUser,
      userName: resolveEditorName(authUser),
      member: memberObj.fullName,
      oldValues: {},
      newValues: buildLoanAuditSnapshot(refreshedLoan, evalDate),
      remarks: `Disbursed new loan ${newLoan.id} for ${memberObj.fullName} (Principal: KES ${principalNum.toLocaleString()}, ${rateNum}%/mo ${tempProfile.interestMethod})`
    });

    const enrichedRefreshed = enrichLoanForResponse(refreshedLoan, evalDate);
    return NextResponse.json({ ...enrichedRefreshed, success: true, data: enrichedRefreshed }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create loan or repayment:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process loan request' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await request.json();

    const authUser =
      body.userEmail ||
      body.updatedBy ||
      body.createdBy ||
      body.recordedBy ||
      request.headers.get('x-user-email');

    if (!isAuthorizedEditor(authUser)) {
      return NextResponse.json(
        { error: 'Forbidden: Only authorized administrators can edit loans or repayments.' },
        { status: 403 }
      );
    }

    // -------------------------------------------------------------------------
    // SUB-ACTION: Edit an Individual Loan Repayment Record
    // -------------------------------------------------------------------------
    if (body.action === 'edit_repayment' || (body.repaymentId && !body.id)) {
      const repaymentId = Number(body.repaymentId);
      const existingRep = await prisma.loanRepayment.findUnique({
        where: { id: repaymentId }
      });
      if (!existingRep) {
        return NextResponse.json({ error: 'Loan repayment record not found.' }, { status: 404 });
      }

      const newRepAmt = body.amount !== undefined ? Number(body.amount) : Number(existingRep.amount);
      if (isNaN(newRepAmt) || newRepAmt <= 0) {
        return NextResponse.json({ error: 'Repayment amount must be greater than 0.' }, { status: 400 });
      }

      const oldRepValues = {
        'Repayment ID': `REP-${existingRep.id}`,
        'Loan ID': existingRep.loanId,
        'Amount': `KES ${Number(existingRep.amount).toLocaleString()}`,
        'Payment Date': existingRep.paymentDateStr || formatISODate(toUTCMidnight(existingRep.paymentDate)),
        'Method': existingRep.paymentMethod || 'M-Pesa',
        'Reference': existingRep.reference || existingRep.mpesaRef || existingRep.bankRef || '-',
        'Remarks': existingRep.remarks || '-'
      };

      const newPayDateUTC = body.paymentDate ? toUTCMidnight(body.paymentDate) : existingRep.paymentDate;
      const newPayDateStr = formatISODate(toUTCMidnight(newPayDateUTC));
      const refVal = (body.reference || body.mpesaRef || body.bankRef || existingRep.reference || '').trim();

      const updatedRep = await prisma.loanRepayment.update({
        where: { id: existingRep.id },
        data: {
          amount: newRepAmt,
          paymentDate: newPayDateUTC,
          paymentDateStr: newPayDateStr,
          paymentMethod: body.paymentMethod || existingRep.paymentMethod || 'M-Pesa',
          mpesaRef: body.mpesaRef !== undefined ? body.mpesaRef : existingRep.mpesaRef,
          bankRef: body.bankRef !== undefined ? body.bankRef : existingRep.bankRef,
          reference: refVal || existingRep.reference,
          remarks: body.remarks ?? body.notes ?? existingRep.remarks
        }
      });

      const parentLoan = await prisma.loan.findUnique({
        where: { id: existingRep.loanId },
        include: {
          member: true,
          repayments: { orderBy: [{ paymentDate: 'asc' }, { id: 'asc' }] }
        }
      });

      if (parentLoan) {
        const evalDate = body.asOfDate ? toUTCMidnight(body.asOfDate) : toUTCMidnight(new Date());
        const profile = calculateLoanProfile(
          {
            ...parentLoan,
            status: parentLoan.status === 'Cancelled' ? 'Cancelled' : 'Active',
            repayments: parentLoan.repayments
          },
          evalDate
        );

        for (const ep of profile.repayments) {
          if (ep.id && Number(ep.id) > 0) {
            await prisma.loanRepayment.update({
              where: { id: Number(ep.id) },
              data: {
                interestAllocated: ep.computedInterestAllocated,
                principalAllocated: ep.computedPrincipalAllocated
              }
            });
          }
        }

        const updatedParent = await prisma.loan.update({
          where: { id: parentLoan.id },
          data: {
            interest: profile.totalInterestAccrued,
            totalPayable: profile.totalLoanAmount,
            paidAmount: profile.totalAmountPaid,
            interestPaid: profile.interestPaid,
            principalPaid: profile.principalRepaid,
            status: profile.status,
            clearedDate: profile.status === 'Settled' ? toUTCMidnight(profile.settlementDate) : null
          },
          include: {
            member: true,
            repayments: { orderBy: [{ paymentDate: 'asc' }, { id: 'asc' }] }
          }
        });

        await createAuditLog({
          model: 'LoanRepayment',
          action: 'Updated',
          recordId: updatedRep.id,
          recordRef: `${parentLoan.id} (REP-${updatedRep.id})`,
          userEmail: authUser,
          userName: resolveEditorName(authUser),
          member: updatedParent.member?.fullName || 'Member',
          oldValues: oldRepValues,
          newValues: {
            'Repayment ID': `REP-${updatedRep.id}`,
            'Loan ID': updatedRep.loanId,
            'Amount': `KES ${Number(updatedRep.amount).toLocaleString()}`,
            'Payment Date': updatedRep.paymentDateStr || newPayDateStr,
            'Method': updatedRep.paymentMethod || 'M-Pesa',
            'Reference': updatedRep.reference || updatedRep.mpesaRef || updatedRep.bankRef || '-',
            'Remarks': updatedRep.remarks || '-'
          },
          reason: body.editReason || body.reason || null,
          remarks: body.editReason || body.reason || `Edited loan repayment REP-${updatedRep.id} on Loan ${parentLoan.id}`
        });

        const enriched = enrichLoanForResponse(updatedParent, evalDate);
        return NextResponse.json({ ...enriched, success: true, data: enriched });
      }

      return NextResponse.json({ success: true });
    }

    const {
      id,
      borrower,
      memberName,
      memberId,
      issueDate,
      principal,
      interestRate,
      interestMethod,
      compoundingFrequency,
      durationMonths,
      loanDurationMonths,
      repaymentTerms,
      allocationPolicy,
      purpose,
      loanPurpose,
      approvalRef,
      remarks,
      notes,
      paid,
      paidAmount,
      status,
      clearedDate,
      asOfDate,
      editReason,
      reason,
      updatedBy
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Loan ID is required' }, { status: 400 });
    }

    const existing = await prisma.loan.findUnique({
      where: { id: String(id) },
      include: {
        member: true,
        repayments: { orderBy: [{ paymentDate: 'asc' }, { id: 'asc' }] }
      }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    const evalDate = asOfDate ? toUTCMidnight(asOfDate) : toUTCMidnight(new Date());
    const oldSnapshot = buildLoanAuditSnapshot(existing, evalDate);

    const members = await prisma.member.findMany();
    let resolvedMemberId = existing.memberId;
    if (memberId !== undefined && memberId !== null && memberId !== '') {
      const found = members.find(m => m.id === Number(memberId));
      if (!found) {
        return NextResponse.json({ error: `Invalid memberId: ${memberId}` }, { status: 400 });
      }
      resolvedMemberId = found.id;
    } else if (borrower || memberName) {
      const targetName = String(borrower || memberName).toLowerCase().trim();
      const m = members.find(
        mem =>
          mem.fullName.toLowerCase().trim() === targetName ||
          mem.fullName.toLowerCase().includes(targetName) ||
          targetName.includes(mem.fullName.toLowerCase().trim())
      );
      if (m) resolvedMemberId = m.id;
    }

    const newPrincipal = principal !== undefined ? Number(principal) : existing.principal;
    if (isNaN(newPrincipal) || newPrincipal <= 0) {
      return NextResponse.json({ error: 'Principal Amount must be greater than 0.' }, { status: 400 });
    }

    const newRate = interestRate !== undefined && interestRate !== null && interestRate !== '' ? Number(interestRate) : existing.interestRate;
    if (isNaN(newRate) || newRate < 0) {
      return NextResponse.json({ error: 'Interest Rate cannot be negative.' }, { status: 400 });
    }

    const newMethod = interestMethod || existing.interestMethod || 'Simple';
    const newIssueDate = issueDate ? toUTCMidnight(issueDate) : existing.issueDate;
    const newDuration =
      durationMonths !== undefined
        ? Number(durationMonths)
        : loanDurationMonths !== undefined
        ? Number(loanDurationMonths)
        : existing.durationMonths;
    const newPolicy = allocationPolicy || existing.allocationPolicy || 'Interest First';
    const newPurpose = purpose ?? loanPurpose ?? existing.purpose;
    const newRemarks = remarks ?? notes ?? existing.remarks;

    // Preserve existing repayments unless caller explicitly settles an un-repaid loan via quick-settle
    const currentReps = [...existing.repayments];
    const effectivePaid = paid !== undefined ? paid : paidAmount;
    if (
      status === 'Settled' &&
      existing.status !== 'Settled' &&
      currentReps.length === 0 &&
      effectivePaid !== undefined &&
      Number(effectivePaid) > 0
    ) {
      const settleAmt = Number(effectivePaid);
      const settleDt =
        clearedDate && clearedDate !== '-' ? toUTCMidnight(clearedDate) : toUTCMidnight(new Date());

      await prisma.loanRepayment.create({
        data: {
          loanId: existing.id,
          memberId: resolvedMemberId,
          paymentDate: settleDt,
          paymentDateStr: formatISODate(settleDt),
          amount: settleAmt,
          interestAllocated: Math.max(0, settleAmt - newPrincipal),
          principalAllocated: newPrincipal,
          paymentMethod: 'M-Pesa',
          reference: `SET-${existing.id}-${Date.now().toString().slice(-4)}`,
          remarks: 'Full loan settlement',
          recordedBy: updatedBy || resolveEditorName(authUser)
        }
      });
    }

    const reloadedReps = await prisma.loanRepayment.findMany({
      where: { loanId: existing.id },
      orderBy: [{ paymentDate: 'asc' }, { id: 'asc' }]
    });

    // If memberId was changed on the loan, keep repayment memberId aligned
    if (resolvedMemberId !== existing.memberId && reloadedReps.length > 0) {
      await prisma.loanRepayment.updateMany({
        where: { loanId: existing.id },
        data: { memberId: resolvedMemberId }
      });
    }

    const requestedStatus = status || existing.status;

    const profile = calculateLoanProfile(
      {
        ...existing,
        memberId: resolvedMemberId,
        issueDate: newIssueDate,
        principal: newPrincipal,
        interestRate: newRate,
        interestMethod: newMethod,
        compoundingFrequency: compoundingFrequency || existing.compoundingFrequency,
        durationMonths: newDuration,
        repaymentTerms: repaymentTerms ?? existing.repaymentTerms,
        allocationPolicy: newPolicy,
        purpose: newPurpose,
        approvalRef: approvalRef ?? existing.approvalRef,
        remarks: newRemarks,
        status: requestedStatus,
        clearedDate:
          clearedDate && clearedDate !== '-'
            ? toUTCMidnight(clearedDate)
            : requestedStatus === 'Settled' || requestedStatus === 'Cancelled'
            ? existing.clearedDate || toUTCMidnight(new Date())
            : null,
        repayments: reloadedReps
      },
      evalDate
    );

    // Update each repayment's computed allocation in DB after loan parameter changes
    for (const ep of profile.repayments) {
      if (ep.id && Number(ep.id) > 0) {
        await prisma.loanRepayment.update({
          where: { id: Number(ep.id) },
          data: {
            interestAllocated: ep.computedInterestAllocated,
            principalAllocated: ep.computedPrincipalAllocated
          }
        });
      }
    }

    // If user explicitly set status to 'Cancelled', keep 'Cancelled'; otherwise use recalculated profile.status
    const finalStatus = requestedStatus === 'Cancelled' ? 'Cancelled' : profile.status;

    const updatedLoan = await prisma.loan.update({
      where: { id: existing.id },
      data: {
        memberId: resolvedMemberId,
        issueDate: newIssueDate,
        principal: newPrincipal,
        interest: profile.totalInterestAccrued,
        totalPayable: profile.totalLoanAmount,
        paidAmount: profile.totalAmountPaid,
        principalPaid: profile.principalRepaid,
        interestPaid: profile.interestPaid,
        interestRate: newRate,
        interestMethod: profile.interestMethod,
        compoundingFrequency: compoundingFrequency || existing.compoundingFrequency,
        durationMonths: newDuration,
        repaymentTerms: repaymentTerms ?? existing.repaymentTerms,
        allocationPolicy: profile.allocationPolicy,
        purpose: newPurpose,
        approvalRef: approvalRef ?? existing.approvalRef,
        remarks: newRemarks,
        status: finalStatus,
        clearedDate:
          finalStatus === 'Settled' || finalStatus === 'Cancelled'
            ? profile.settlementDate !== '-'
              ? toUTCMidnight(profile.settlementDate)
              : toUTCMidnight(new Date())
            : null
      },
      include: {
        member: true,
        repayments: { orderBy: [{ paymentDate: 'asc' }, { id: 'asc' }] }
      }
    });

    await createAuditLog({
      model: 'Loan',
      action: finalStatus === 'Cancelled' && existing.status !== 'Cancelled' ? 'Cancelled' : 'Updated',
      recordRef: updatedLoan.id,
      userEmail: authUser,
      userName: resolveEditorName(authUser),
      member: updatedLoan.member?.fullName || 'Member',
      oldValues: oldSnapshot,
      newValues: buildLoanAuditSnapshot(updatedLoan, evalDate),
      reason: editReason || reason || null,
      remarks:
        editReason ||
        reason ||
        `Edited Loan ${updatedLoan.id} for ${updatedLoan.member?.fullName || 'Member'} (Principal: KES ${Number(updatedLoan.principal).toLocaleString()}, Rate: ${updatedLoan.interestRate}% ${updatedLoan.interestMethod}, Status: ${updatedLoan.status})`
    });

    const enrichedUpdated = enrichLoanForResponse(updatedLoan, evalDate);
    return NextResponse.json({ ...enrichedUpdated, success: true, data: enrichedUpdated });
  } catch (error: any) {
    console.error('Failed to update loan:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update loan' },
      { status: 500 }
    );
  }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export async function DELETE(request: Request) {
  try {
    await ensureDatabaseSchema();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const repaymentId = searchParams.get('repaymentId');
    const mode = searchParams.get('mode'); // 'cancel' | 'delete'
    const forcePermanentDelete = searchParams.get('forcePermanentDelete') === 'true';
    const reason = searchParams.get('reason') || '';
    const authUser =
      searchParams.get('userEmail') ||
      searchParams.get('deletedBy') ||
      request.headers.get('x-user-email');

    if (!isAuthorizedEditor(authUser)) {
      return NextResponse.json(
        { error: 'Forbidden: Only authorized administrators can delete or cancel loans.' },
        { status: 403 }
      );
    }

    // -------------------------------------------------------------------------
    // MODE 1: Reverse / Delete a Specific Loan Repayment Record
    // -------------------------------------------------------------------------
    if (repaymentId) {
      const rep = await prisma.loanRepayment.findUnique({
        where: { id: Number(repaymentId) }
      });
      if (!rep) {
        return NextResponse.json({ error: 'Loan repayment not found' }, { status: 404 });
      }

      const parentBefore = await prisma.loan.findUnique({
        where: { id: rep.loanId },
        include: {
          member: true,
          repayments: { orderBy: [{ paymentDate: 'asc' }, { id: 'asc' }] }
        }
      });
      const oldSnapshot = parentBefore ? buildLoanAuditSnapshot(parentBefore) : {};

      await prisma.loanRepayment.delete({ where: { id: rep.id } });

      const parentLoan = await prisma.loan.findUnique({
        where: { id: rep.loanId },
        include: {
          member: true,
          repayments: { orderBy: [{ paymentDate: 'asc' }, { id: 'asc' }] }
        }
      });

      if (parentLoan) {
        const profile = calculateLoanProfile({
          ...parentLoan,
          status: parentLoan.status === 'Cancelled' ? 'Cancelled' : 'Active',
          clearedDate: null,
          paidAmount: 0,
          repayments: parentLoan.repayments
        });

        for (const ep of profile.repayments) {
          if (ep.id && Number(ep.id) > 0) {
            await prisma.loanRepayment.update({
              where: { id: Number(ep.id) },
              data: {
                interestAllocated: ep.computedInterestAllocated,
                principalAllocated: ep.computedPrincipalAllocated
              }
            });
          }
        }

        const updatedParent = await prisma.loan.update({
          where: { id: parentLoan.id },
          data: {
            interest: profile.totalInterestAccrued,
            totalPayable: profile.totalLoanAmount,
            paidAmount: profile.totalAmountPaid,
            interestPaid: profile.interestPaid,
            principalPaid: profile.principalRepaid,
            status: profile.status,
            clearedDate: profile.status === 'Settled' ? toUTCMidnight(profile.settlementDate) : null
          },
          include: {
            member: true,
            repayments: { orderBy: [{ paymentDate: 'asc' }, { id: 'asc' }] }
          }
        });

        await createAuditLog({
          model: 'LoanRepayment',
          action: 'Reversed',
          recordId: rep.id,
          recordRef: `${parentLoan.id} (REP-${rep.id})`,
          userEmail: authUser,
          userName: resolveEditorName(authUser),
          member: updatedParent.member?.fullName || 'Member',
          oldValues: {
            ...oldSnapshot,
            'Reversed Repayment': `KES ${Number(rep.amount).toLocaleString()} (${rep.paymentDateStr || formatISODate(toUTCMidnight(rep.paymentDate))}, Ref: ${rep.reference || rep.mpesaRef || rep.bankRef || '-'})`
          },
          newValues: buildLoanAuditSnapshot(updatedParent),
          reason: reason || null,
          remarks:
            reason ||
            `Reversed loan repayment of KES ${Number(rep.amount).toLocaleString()} on Loan ${parentLoan.id} (${updatedParent.member?.fullName || 'Member'})`
        });

        return NextResponse.json({
          success: true,
          loan: enrichLoanForResponse(updatedParent)
        });
      }

      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ error: 'Loan ID is required' }, { status: 400 });
    }

    const existing = await prisma.loan.findUnique({
      where: { id: String(id) },
      include: {
        member: true,
        repayments: { orderBy: [{ paymentDate: 'asc' }, { id: 'asc' }] }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    const oldSnapshot = buildLoanAuditSnapshot(existing);
    const hasRepayments =
      (Array.isArray(existing.repayments) && existing.repayments.length > 0) ||
      Number(existing.paidAmount) > 0;

    // -------------------------------------------------------------------------
    // MODE 2: Safe Cancellation for Loans with Repayment History (or explicit mode=cancel)
    // Never silently erase repayment records!
    // -------------------------------------------------------------------------
    if ((hasRepayments || mode === 'cancel') && !forcePermanentDelete) {
      const cancelNote = reason
        ? `${existing.remarks || ''} [Cancelled: ${reason}]`.trim()
        : `${existing.remarks || ''} [Cancelled - Repayment History Preserved]`.trim();

      const cancelledLoan = await prisma.loan.update({
        where: { id: existing.id },
        data: {
          status: 'Cancelled',
          clearedDate: existing.clearedDate || toUTCMidnight(new Date()),
          remarks: cancelNote
        },
        include: {
          member: true,
          repayments: { orderBy: [{ paymentDate: 'asc' }, { id: 'asc' }] }
        }
      });

      await createAuditLog({
        model: 'Loan',
        action: 'Cancelled',
        recordRef: cancelledLoan.id,
        userEmail: authUser,
        userName: resolveEditorName(authUser),
        member: cancelledLoan.member?.fullName || oldSnapshot['Member Name'],
        oldValues: oldSnapshot,
        newValues: buildLoanAuditSnapshot(cancelledLoan),
        reason: reason || null,
        remarks:
          reason ||
          `Safely cancelled Loan ${cancelledLoan.id} (${oldSnapshot['Member Name']}) preserving ${cancelledLoan.repayments.length} repayment record(s) in audit history`
      });

      const enrichedCancelled = enrichLoanForResponse(cancelledLoan);
      return NextResponse.json({
        success: true,
        mode: 'cancelled',
        preservedRepaymentsCount: cancelledLoan.repayments.length,
        loan: enrichedCancelled,
        data: enrichedCancelled
      });
    }

    // -------------------------------------------------------------------------
    // MODE 3: Delete Un-Repaid Loan Record
    // -------------------------------------------------------------------------
    await prisma.loan.delete({ where: { id: existing.id } });

    await createAuditLog({
      model: 'Loan',
      action: 'Deleted',
      recordRef: existing.id,
      userEmail: authUser,
      userName: resolveEditorName(authUser),
      member: existing.member?.fullName || oldSnapshot['Member Name'],
      oldValues: oldSnapshot,
      newValues: { Status: 'Deleted from Loan Portfolio' },
      reason: reason || null,
      remarks:
        reason ||
        `Deleted Loan ${existing.id} (${oldSnapshot['Member Name']}, Principal: ${oldSnapshot['Principal Amount']})`
    });

    return NextResponse.json({ success: true, mode: 'deleted' });
  } catch (error) {
    console.error('Failed to delete loan:', error);
    return NextResponse.json({ error: 'Failed to delete loan' }, { status: 500 });
  }
}

