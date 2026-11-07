import { NextResponse } from 'next/server';
import { prisma, ensureDatabaseSchema } from '@/lib/prisma';
import {
  calculateLoanProfile,
  toUTCMidnight,
  formatISODate
} from '@/lib/loanCalculator';
import { ALL_MONTHS, MONTH_ABBRS } from '@/lib/dateUtils';

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
      // End of the selected reporting month
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

    const loans = await prisma.loan.findMany({
      include: {
        member: true,
        repayments: {
          orderBy: [{ paymentDate: 'asc' }, { id: 'asc' }]
        }
      },
      orderBy: { issueDate: 'desc' }
    });

    const enriched = loans.map(l => enrichLoanForResponse(l, asOfDate));
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

      // Check for duplicate transaction reference if provided
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

      // If loan had legacy paidAmount > 0 and 0 repayment rows, materialize the initial repayment row first
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

      // Create the new repayment row
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
          recordedBy: recordedBy || 'System'
        }
      });

      // Re-fetch loan with all repayments and compute authoritative profile
      const loanWithReps = await prisma.loan.findUnique({
        where: { id: loan.id },
        include: {
          member: true,
          repayments: { orderBy: [{ paymentDate: 'asc' }, { id: 'asc' }] }
        }
      });

      const evalDate = asOfDate
        ? toUTCMidnight(asOfDate)
        : payDateUTC.getTime() > Date.now()
        ? payDateUTC
        : toUTCMidnight(new Date());

      const profile = calculateLoanProfile(
        {
          ...loanWithReps!,
          memberName: loanWithReps!.member?.fullName,
          repayments: loanWithReps!.repayments
        },
        evalDate
      );

      // Update each repayment's computed allocation in DB
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

      await prisma.editLog.create({
        data: {
          model: 'LoanRepayment',
          action: 'create',
          changes: JSON.stringify({
            loanId: loan.id,
            repaymentId: createdRepayment.id,
            amount: payAmt,
            paymentDate: payDateStr,
            newStatus: profile.status,
            remainingBalance: profile.totalOutstandingBalance,
            recordedBy: recordedBy || 'System'
          })
        }
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
      repaymentTerms,
      allocationPolicy,
      purpose,
      approvalRef,
      remarks,
      paid,
      status,
      clearedDate,
      createdBy
    } = body;

    // Validate Principal
    const principalNum = Number(principal);
    if (principal === undefined || principal === null || principal === '' || isNaN(principalNum) || principalNum <= 0) {
      return NextResponse.json(
        { error: 'Principal Amount must be a valid positive number greater than 0.' },
        { status: 400 }
      );
    }

    // Validate Interest Rate
    const rateNum = interestRate !== undefined && interestRate !== null && interestRate !== '' ? Number(interestRate) : 10.0;
    if (isNaN(rateNum) || rateNum < 0) {
      return NextResponse.json(
        { error: 'Monthly Interest Rate cannot be negative or invalid.' },
        { status: 400 }
      );
    }

    // Validate Disbursement Date
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

    // Validate Member
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

    // Check duplicate Loan ID or duplicate Approval Reference
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
    const durMonths = Math.max(1, Number(durationMonths) || 6);
    const allocPolicy = allocationPolicy || 'Interest First';
    const initialPaid = Math.max(0, Number(paid) || 0);

    // Calculate initial profile
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
      purpose: purpose || 'Personal / Business Development',
      approvalRef: approvalRef || `APR-${finalLoanId}`,
      remarks: remarks || '',
      paidAmount: initialPaid,
      status: status || 'Active',
      clearedDate: clearedDate && clearedDate !== '-' ? toUTCMidnight(clearedDate) : null
    });

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
        purpose: purpose || 'Personal / Business Development',
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
          recordedBy: createdBy || 'System'
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

    await prisma.editLog.create({
      data: {
        model: 'Loan',
        action: 'create',
        changes: JSON.stringify({
          id: newLoan.id,
          borrower: memberObj.fullName,
          principal: principalNum,
          interestRate: rateNum,
          interestMethod: tempProfile.interestMethod,
          issueDate: formatISODate(issueDateUTC),
          createdBy: createdBy || 'System'
        })
      }
    });

    const enrichedRefreshed = enrichLoanForResponse(refreshedLoan);
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
    const {
      id,
      borrower,
      memberId,
      issueDate,
      principal,
      interestRate,
      interestMethod,
      compoundingFrequency,
      durationMonths,
      repaymentTerms,
      allocationPolicy,
      purpose,
      approvalRef,
      remarks,
      paid,
      status,
      clearedDate,
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

    let resolvedMemberId = existing.memberId;
    if (memberId) {
      resolvedMemberId = Number(memberId);
    } else if (borrower) {
      const members = await prisma.member.findMany();
      const m = members.find(
        mem =>
          mem.fullName.toLowerCase().trim() === String(borrower).toLowerCase().trim() ||
          mem.fullName.toLowerCase().includes(String(borrower).toLowerCase().trim())
      );
      if (m) resolvedMemberId = m.id;
    }

    const newPrincipal = principal !== undefined ? Number(principal) : existing.principal;
    const newRate = interestRate !== undefined ? Number(interestRate) : existing.interestRate;
    const newMethod = interestMethod || existing.interestMethod || 'Simple';
    const newIssueDate = issueDate ? toUTCMidnight(issueDate) : existing.issueDate;
    const newDuration = durationMonths !== undefined ? Number(durationMonths) : existing.durationMonths;
    const newPolicy = allocationPolicy || existing.allocationPolicy || 'Interest First';

    // If caller explicitly marks loan Settled (e.g. quick settle button) and paid matches full balance
    let currentReps = [...existing.repayments];
    if (status === 'Settled' && currentReps.length === 0 && (paid === undefined || Number(paid) > 0)) {
      const preProfile = calculateLoanProfile({
        ...existing,
        principal: newPrincipal,
        interestRate: newRate,
        interestMethod: newMethod,
        issueDate: newIssueDate,
        durationMonths: newDuration,
        allocationPolicy: newPolicy,
        repayments: []
      });
      const settleAmt =
        paid !== undefined && Number(paid) > 0
          ? Number(paid)
          : preProfile.totalLoanAmount > preProfile.originalPrincipal
          ? preProfile.totalLoanAmount
          : round2(newPrincipal * (1 + newRate / 100));
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
          recordedBy: updatedBy || 'System'
        }
      });
    } else if (status === 'Active' && existing.status === 'Settled' && Number(paid) === 0) {
      // Reactivating a settled loan via status toggle
      await prisma.loanRepayment.deleteMany({ where: { loanId: existing.id } });
    }

    const reloadedReps = await prisma.loanRepayment.findMany({
      where: { loanId: existing.id },
      orderBy: [{ paymentDate: 'asc' }, { id: 'asc' }]
    });

    const profile = calculateLoanProfile({
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
      purpose: purpose ?? existing.purpose,
      approvalRef: approvalRef ?? existing.approvalRef,
      remarks: remarks ?? existing.remarks,
      status: status || existing.status,
      clearedDate:
        clearedDate && clearedDate !== '-'
          ? toUTCMidnight(clearedDate)
          : status === 'Settled'
          ? toUTCMidnight(new Date())
          : null,
      repayments: reloadedReps
    });

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
        purpose: purpose ?? existing.purpose,
        approvalRef: approvalRef ?? existing.approvalRef,
        remarks: remarks ?? existing.remarks,
        status: profile.status,
        clearedDate:
          profile.status === 'Settled'
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

    await prisma.editLog.create({
      data: {
        model: 'Loan',
        action: 'update',
        changes: JSON.stringify({
          id: updatedLoan.id,
          principal: updatedLoan.principal,
          interestRate: updatedLoan.interestRate,
          interestMethod: updatedLoan.interestMethod,
          paidAmount: updatedLoan.paidAmount,
          status: updatedLoan.status,
          updatedBy: updatedBy || 'System'
        })
      }
    });

    const enrichedUpdated = enrichLoanForResponse(updatedLoan);
    return NextResponse.json({ ...enrichedUpdated, success: true, data: enrichedUpdated });
  } catch (error) {
    console.error('Failed to update loan:', error);
    return NextResponse.json({ error: 'Failed to update loan' }, { status: 500 });
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
    const deletedBy = searchParams.get('deletedBy');

    if (repaymentId) {
      const rep = await prisma.loanRepayment.findUnique({
        where: { id: Number(repaymentId) }
      });
      if (!rep) {
        return NextResponse.json({ error: 'Loan repayment not found' }, { status: 404 });
      }
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
          status: 'Active',
          clearedDate: null,
          paidAmount: 0,
          repayments: parentLoan.repayments
        });

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

        await prisma.editLog.create({
          data: {
            model: 'LoanRepayment',
            action: 'delete',
            changes: JSON.stringify({
              loanId: parentLoan.id,
              deletedRepaymentId: rep.id,
              amount: rep.amount,
              deletedBy: deletedBy || 'System'
            })
          }
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

    await prisma.loan.delete({ where: { id } });

    await prisma.editLog.create({
      data: {
        model: 'Loan',
        action: 'delete',
        changes: JSON.stringify({ deletedLoanId: id, deletedBy: deletedBy || 'System' })
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete loan:', error);
    return NextResponse.json({ error: 'Failed to delete loan' }, { status: 500 });
  }
}
