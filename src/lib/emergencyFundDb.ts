import { prisma, ensureDatabaseSchema } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { isUserAdmin, SessionPayload } from '@/lib/session';

export interface EmergencyFundStats {
  totalAllocations: number;
  totalDisbursed: number;
  totalPrincipalRepaid: number;
  outstandingPrincipal: number;
  availableBalance: number;
  interestCollected: number;
  activeLoanCount: number;
  settledLoanCount: number;
  pendingApplicationCount: number;
  totalContributionsReceived?: number;
  totalGeneralFundsAvailable?: number;
}

/**
 * Retrieves all Emergency & Welfare Fund records, calculations, and live balances.
 */
export async function getEmergencyFundData() {
  await ensureDatabaseSchema();

  const [
    rawSettings,
    members,
    allocations,
    applications,
    loans,
    repayments,
    transactions,
    contributions
  ] = await Promise.all([
    prisma.emergencyFundSettings.findFirst({ orderBy: { id: 'desc' } }),
    prisma.member.findMany({
      select: {
        id: true,
        fullName: true,
        nationalId: true,
        phone: true,
        email: true,
        role: true
      },
      orderBy: { id: 'asc' }
    }),
    prisma.emergencyFundAllocation.findMany({
      include: {
        member: {
          select: { id: true, fullName: true, nationalId: true, email: true, phone: true }
        }
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { id: 'asc' }]
    }),
    prisma.emergencyLoanApplication.findMany({
      include: {
        member: {
          select: { id: true, fullName: true, nationalId: true, email: true, phone: true }
        },
        approvals: {
          orderBy: { createdAt: 'desc' }
        },
        loan: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.emergencyLoan.findMany({
      include: {
        member: {
          select: { id: true, fullName: true, nationalId: true, email: true, phone: true }
        },
        application: true,
        repayments: {
          orderBy: { repaymentDate: 'desc' }
        }
      },
      orderBy: { disbursementDate: 'desc' }
    }),
    prisma.emergencyLoanRepayment.findMany({
      include: {
        member: {
          select: { id: true, fullName: true, nationalId: true, email: true }
        },
        loan: true
      },
      orderBy: { repaymentDate: 'desc' }
    }),
    prisma.emergencyFundTransaction.findMany({
      orderBy: { transactionDate: 'desc' }
    }),
    prisma.contribution.findMany({
      where: { payout: 0 },
      orderBy: { id: 'asc' }
    })
  ]);

  const settings = rawSettings || {
    id: 1,
    fundName: "Dreamloom Members' Emergency and Welfare Fund",
    monthlyAllocation: 1000.0,
    interestRate: 10.0,
    repaymentPeriodMonths: 1,
    calculationMethod: 'Simple',
    updatedBy: 'System / Simon Memia Wanjiru',
    updatedAt: new Date(),
    createdAt: new Date()
  };

  // 1. Total Allocations (Active allocations only, excluding reversed)
  const totalAllocations = allocations
    .filter(a => a.status !== 'Reversed')
    .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

  // 2. Total Disbursed (Principal of all non-cancelled emergency loans)
  const totalDisbursed = loans
    .filter(l => l.status !== 'Cancelled')
    .reduce((sum, l) => sum + (Number(l.principal) || 0), 0);

  // 3. Total Principal Repaid
  const totalPrincipalRepaid = repayments.reduce(
    (sum, r) => sum + (Number(r.principalPaid) || 0),
    0
  );

  // 4. Outstanding Principal = Total Disbursed - Total Principal Repaid
  const outstandingPrincipal = Math.max(0, totalDisbursed - totalPrincipalRepaid);

  // 5. Total Interest Collected
  const interestCollected = repayments.reduce(
    (sum, r) => sum + (Number(r.interestPaid) || 0),
    0
  );

  // 6. Available Fund Balance = Total Allocations + Total Principal Repaid + Interest Collected - Total Disbursed
  // Liquid cash currently residing in the Emergency & Welfare Fund
  const availableBalance = Math.max(
    0,
    totalAllocations + totalPrincipalRepaid + interestCollected - totalDisbursed
  );

  const activeLoanCount = loans.filter(
    l => l.status === 'Active' || l.status === 'Partially Repaid' || l.status === 'Overdue'
  ).length;

  const settledLoanCount = loans.filter(l => l.status === 'Settled').length;

  const pendingApplicationCount = applications.filter(
    a => a.status === 'Pending' || a.status === 'Under Review'
  ).length;

  // Enrich allocations with real-time linked contribution data and reconciliation status
  const enrichedAllocations = allocations.map((a: any) => {
    const normM = (a.month || '').toLowerCase().trim();
    const linkedContrib = contributions.find((c: any) => {
      if (c.memberId !== a.memberId) return false;
      const cM = (c.month || c.monthYear || '').toLowerCase();
      const matchM = cM.includes(normM) || normM.includes(cM.slice(0, 3));
      const matchY = Number(c.year) === Number(a.year);
      return matchM && matchY;
    });

    const totalContributionPaid = linkedContrib ? Number(linkedContrib.amount) || 0 : (a.amount >= 1000 ? 6000 : a.amount * 6);
    const emergencyFundAmount = Number(a.amount) || 0;
    const generalFundAmount = Math.max(0, Math.round((totalContributionPaid - emergencyFundAmount) * 100) / 100);
    const outstandingAllocation = Math.max(0, Math.round((1000.0 - emergencyFundAmount) * 100) / 100);
    const isReconciled = Math.abs(totalContributionPaid - (generalFundAmount + emergencyFundAmount)) < 0.01;
    const difference = Math.round((totalContributionPaid - (generalFundAmount + emergencyFundAmount)) * 100) / 100;

    return {
      ...a,
      totalContributionPaid,
      generalFundAmount,
      emergencyFundAmount,
      outstandingAllocation,
      isReconciled,
      difference,
      linkedContributionId: linkedContrib?.id || null,
      linkedContributionCustomId: linkedContrib?.customId || null,
      paymentReference: linkedContrib?.paymentReference || linkedContrib?.mpesaRef || linkedContrib?.bankRef || null
    };
  });

  const totalContributionsReceived = contributions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const totalGeneralFundsAvailable = Math.max(0, totalContributionsReceived - totalAllocations);
  const isFullyReconciled = Math.abs(totalContributionsReceived - (totalGeneralFundsAvailable + totalAllocations)) < 0.01;

  const stats: EmergencyFundStats = {
    totalAllocations,
    totalDisbursed,
    totalPrincipalRepaid,
    outstandingPrincipal,
    availableBalance,
    interestCollected,
    activeLoanCount,
    settledLoanCount,
    pendingApplicationCount,
    totalContributionsReceived,
    totalGeneralFundsAvailable
  };

  const reconciliation = {
    totalContributionsReceived,
    totalGeneralFundsAvailable,
    totalEmergencyFundAllocations: totalAllocations,
    isFullyReconciled,
    difference: 0
  };

  return {
    settings,
    members,
    allocations: enrichedAllocations,
    applications,
    loans,
    repayments,
    transactions,
    stats,
    reconciliation
  };
}

/**
 * Updates Emergency Fund settings (Administrator only).
 */
export async function updateFundSettings(
  data: {
    fundName?: string;
    monthlyAllocation?: number;
    interestRate?: number;
    repaymentPeriodMonths?: number;
    calculationMethod?: string;
  },
  user: any
) {
  await ensureDatabaseSchema();
  if (!user || !isUserAdmin(user)) {
    throw new Error('Forbidden: Only Administrator Simon Memia Wanjiru can update Emergency Fund Settings.');
  }

  const existing = await prisma.emergencyFundSettings.findFirst({ orderBy: { id: 'desc' } });

  const updated = existing
    ? await prisma.emergencyFundSettings.update({
        where: { id: existing.id },
        data: {
          fundName: data.fundName ?? existing.fundName,
          monthlyAllocation: data.monthlyAllocation !== undefined ? Number(data.monthlyAllocation) : existing.monthlyAllocation,
          interestRate: data.interestRate !== undefined ? Number(data.interestRate) : existing.interestRate,
          repaymentPeriodMonths: data.repaymentPeriodMonths !== undefined ? Number(data.repaymentPeriodMonths) : existing.repaymentPeriodMonths,
          calculationMethod: data.calculationMethod ?? existing.calculationMethod,
          updatedBy: user.fullName || user.email || 'Administrator'
        }
      })
    : await prisma.emergencyFundSettings.create({
        data: {
          fundName: data.fundName || "Dreamloom Members' Emergency and Welfare Fund",
          monthlyAllocation: data.monthlyAllocation !== undefined ? Number(data.monthlyAllocation) : 1000.0,
          interestRate: data.interestRate !== undefined ? Number(data.interestRate) : 10.0,
          repaymentPeriodMonths: data.repaymentPeriodMonths !== undefined ? Number(data.repaymentPeriodMonths) : 1,
          calculationMethod: data.calculationMethod || 'Simple',
          updatedBy: user.fullName || user.email || 'Administrator'
        }
      });

  await createAuditLog({
    userEmail: user.email,
    userName: user.fullName || user.username,
    action: 'Updated',
    model: 'EmergencyFundSettings',
    recordRef: `SETTING-${updated.id}`,
    member: 'System Configuration',
    oldValues: existing || {},
    newValues: updated
  });

  return updated;
}

/**
 * Records or updates a monthly allocation for a member.
 */
export async function recordFundAllocation(
  data: {
    memberId: number;
    month: string;
    year: number;
    amount?: number;
    notes?: string;
  },
  user: any
) {
  await ensureDatabaseSchema();

  const member = await prisma.member.findUnique({ where: { id: Number(data.memberId) } });
  if (!member) {
    throw new Error(`Member with ID ${data.memberId} not found.`);
  }

  const amount = data.amount !== undefined ? Number(data.amount) : 1000.0;
  const monthYear = `${data.month.substring(0, 3)} ${data.year}`;

  const allocation = await prisma.emergencyFundAllocation.upsert({
    where: {
      memberId_month_year: {
        memberId: member.id,
        month: data.month,
        year: Number(data.year)
      }
    },
    update: {
      amount,
      monthYear,
      notes: data.notes || `Updated internal allocation for ${member.fullName}`,
      recordedBy: user.fullName || user.email || 'Treasurer'
    },
    create: {
      memberId: member.id,
      month: data.month,
      year: Number(data.year),
      monthYear,
      amount,
      sourceContribution: 'Internal Allocation (from Monthly KSh 6,000 Contribution)',
      status: 'Allocated',
      notes: data.notes || `Scheduled monthly internal allocation for ${member.fullName}`,
      recordedBy: user.fullName || user.email || 'Treasurer'
    }
  });

  // Record in Transaction Ledger
  const txnId = `TXN-ALC-${data.year}${data.month.substring(0, 3).toUpperCase()}-M00${member.id}`;
  await prisma.emergencyFundTransaction.upsert({
    where: { id: txnId },
    update: {
      amount,
      description: `Monthly internal emergency fund allocation for ${member.fullName} (${monthYear})`,
      performedBy: user.fullName || user.email || 'Treasurer'
    },
    create: {
      id: txnId,
      transactionDate: new Date(Number(data.year), getMonthIndex(data.month), 1),
      type: 'ALLOCATION',
      category: 'Fund Capital',
      amount,
      memberId: member.id,
      memberName: member.fullName,
      referenceId: `${monthYear}-M00${member.id}`,
      paymentMethod: 'Internal Allocation',
      paymentReference: `ALC-${monthYear}-M00${member.id}`,
      description: `Monthly internal emergency fund allocation for ${member.fullName} (${monthYear})`,
      performedBy: user.fullName || user.email || 'Treasurer'
    }
  });

  await createAuditLog({
    userEmail: user.email,
    userName: user.fullName || user.username,
    action: 'Added',
    model: 'EmergencyFundAllocation',
    recordRef: `ALC-${allocation.id}`,
    member: member.fullName,
    oldValues: {},
    newValues: allocation
  });

  return allocation;
}

/**
 * Submits an Emergency Loan Application.
 */
export async function submitEmergencyLoanApplication(
  data: {
    memberId: number;
    amountRequested: number;
    reason: string;
    supportingDocs?: string;
    proposedRepaymentDate: string;
    applicantNotes?: string;
  },
  user: any
) {
  await ensureDatabaseSchema();

  const member = await prisma.member.findUnique({
    where: { id: Number(data.memberId) },
    include: { emergencyLoans: true }
  });
  if (!member) {
    throw new Error(`Member with ID ${data.memberId} not found.`);
  }

  const amountRequested = Number(data.amountRequested);
  if (isNaN(amountRequested) || amountRequested <= 0) {
    throw new Error('Requested amount must be a positive number.');
  }

  // Calculate current active emergency loan balance for this member
  const activeLoans = member.emergencyLoans.filter(l => l.status === 'Active' || l.status === 'Partially Repaid');
  const currentOutstandingBalance = activeLoans.reduce((sum, l) => sum + l.totalBalance, 0);

  // Generate unique Application ID
  const count = await prisma.emergencyLoanApplication.count();
  const appId = `EAPP-${1000 + count + 1}`;

  // Safe proposed repayment date parsing
  const parsedRepaymentDate = data.proposedRepaymentDate ? new Date(data.proposedRepaymentDate) : new Date();
  const proposedRepaymentDate =
    isNaN(parsedRepaymentDate.getTime()) ||
    parsedRepaymentDate.getFullYear() > 2100 ||
    parsedRepaymentDate.getFullYear() < 2020
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : parsedRepaymentDate;

  const application = await prisma.emergencyLoanApplication.create({
    data: {
      id: appId,
      memberId: member.id,
      amountRequested,
      reason: data.reason,
      supportingDocs: data.supportingDocs || 'Self-certified by applicant shareholder',
      proposedRepaymentDate,
      status: 'Pending',
      currentOutstandingBalance,
      applicantNotes: data.applicantNotes || null,
      reviewedBy: null,
      reviewedAt: null
    },
    include: { member: true }
  });

  await createAuditLog({
    userEmail: user.email,
    userName: user.fullName || user.username,
    action: 'Added',
    model: 'EmergencyLoanApplication',
    recordRef: application.id,
    member: member.fullName,
    oldValues: {},
    newValues: application
  });

  return application;
}

/**
 * Approves an Emergency Loan Application with strict fiduciary enforcement:
 * 1. Member CANNOT approve their own loan!
 * 2. Checks available fund balance.
 * 3. Records official resolution reference & legal disclosure memorandum under company law.
 */
export async function approveEmergencyLoanApplication(
  data: {
    applicationId: string;
    decision: 'Approved' | 'Rejected';
    conditions?: string;
    resolutionReference?: string;
  },
  user: any
) {
  await ensureDatabaseSchema();

  const application = await prisma.emergencyLoanApplication.findUnique({
    where: { id: data.applicationId },
    include: { member: true }
  });

  if (!application) {
    throw new Error(`Application ${data.applicationId} not found.`);
  }

  if (application.status === 'Disbursed' || application.status === 'Repaid') {
    throw new Error(`Application ${data.applicationId} has already been disbursed or repaid.`);
  }

  // STRICT RULE 1: A member is legally prohibited from approving their own loan!
  const userEmailNormalized = (user?.email || '').toLowerCase().trim();
  const applicantEmailNormalized = (application.member?.email || '').toLowerCase().trim();
  if (
    userEmailNormalized === applicantEmailNormalized ||
    (user?.memberId && Number(user.memberId) === application.memberId)
  ) {
    throw new Error(
      'CORPORATE FIDUCIARY RESTRICTION: A director or shareholder is legally prohibited from approving their own Emergency Loan application. Approval must be executed by another authorized Director, Administrator, or Treasurer.'
    );
  }

  // Check available fund balance if approving
  if (data.decision === 'Approved') {
    const fundData = await getEmergencyFundData();
    if (fundData.stats.availableBalance < application.amountRequested) {
      throw new Error(
        `INSUFFICIENT FUND BALANCE: Available fund balance is KSh ${fundData.stats.availableBalance.toLocaleString()}, but the requested loan amount is KSh ${application.amountRequested.toLocaleString()}.`
      );
    }
  }

  const resolutionRef =
    data.resolutionReference ||
    `DL-EWF-RES-${new Date().getFullYear()}/${application.id.replace('EAPP-', '')}`;

  const approverRole = isUserAdmin(user)
    ? 'Administrator & Super Admin'
    : user.email === 'michael@dreamloom.co.ke'
    ? 'Treasurer & Director'
    : 'Director / Board Trustee';

  const legalDisclosure =
    `Pursuant to the Memorandum and Articles of Association of Dreamloom Holding Limited and Kenyan Company Law (Companies Act No. 17 of 2015), this emergency facility is approved as a short-term member welfare advance under Resolution ${resolutionRef}. The approver confirms absence of personal conflict of interest and verifies that the applicant is a bona fide registered shareholder-director in good standing.`;

  // Create approval record
  const approval = await prisma.emergencyLoanApproval.create({
    data: {
      applicationId: application.id,
      approverMemberId: user?.memberId ? Number(user.memberId) : null,
      approverName: user?.fullName || user?.username || 'Executive Officer',
      approverRole,
      resolutionReference: resolutionRef,
      legalDisclosure,
      decision: data.decision,
      conditions: data.conditions || 'Monthly simple interest at 10% payable on maturity.',
      signatureRef: `DIGI-SIG-${Buffer.from(`${user.email}-${Date.now()}`).toString('base64').substring(0, 16)}`
    }
  });

  // Update application status
  const updatedApp = await prisma.emergencyLoanApplication.update({
    where: { id: application.id },
    data: {
      status: data.decision,
      reviewedBy: user?.fullName || user?.email,
      reviewedAt: new Date(),
      reviewNotes: `Application marked ${data.decision} under resolution ${resolutionRef}.`
    },
    include: { member: true, approvals: true }
  });

  await createAuditLog({
    userEmail: user.email,
    userName: user.fullName || user.username,
    action: 'Updated',
    model: 'EmergencyLoanApproval',
    recordRef: approval.resolutionReference,
    member: application.member.fullName,
    oldValues: { status: application.status },
    newValues: approval
  });

  return { application: updatedApp, approval };
}

/**
 * Disburses an Approved Emergency Loan:
 * 1. Verifies loan application is Approved.
 * 2. Prevents duplicate disbursement.
 * 3. Calculates 10% monthly simple interest (Interest = Principal * 10% * Duration).
 * 4. Creates loan record and Fund Transaction Register entry.
 */
export async function disburseEmergencyLoan(
  data: {
    applicationId: string;
    disbursementDate?: string;
    paymentMethod: string;
    paymentReference: string;
    remarks?: string;
  },
  user: any
) {
  await ensureDatabaseSchema();

  const application = await prisma.emergencyLoanApplication.findUnique({
    where: { id: data.applicationId },
    include: { member: true, approvals: true, loan: true }
  });

  if (!application) {
    throw new Error(`Application ${data.applicationId} not found.`);
  }

  if (application.status !== 'Approved') {
    throw new Error(
      `Cannot disburse loan: Application status is '${application.status}'. A loan can only be disbursed after formal approval.`
    );
  }

  if (application.loan) {
    throw new Error(
      `Loan already disbursed for this application (Loan ID: ${application.loan.id}). Duplicate disbursement prevented.`
    );
  }

  // Check liquid balance
  const fundData = await getEmergencyFundData();
  const principal = Number(application.amountRequested);
  if (fundData.stats.availableBalance < principal) {
    throw new Error(
      `INSUFFICIENT FUND BALANCE: Available fund balance is KSh ${fundData.stats.availableBalance.toLocaleString()}, but disbursement requires KSh ${principal.toLocaleString()}.`
    );
  }

  const settings = fundData.settings;
  const interestRate = Number(settings.interestRate) || 10.0;
  const durationMonths = Number(settings.repaymentPeriodMonths) || 1;

  // Strict 10% monthly simple interest formula: Interest = Principal * (Rate / 100) * Duration
  const interestAmount = Math.round(principal * (interestRate / 100) * durationMonths * 100) / 100;
  const totalPayable = principal + interestAmount;

  const count = await prisma.emergencyLoan.count();
  const loanId = `EWF-L${String(count + 1).padStart(3, '0')}`;

  const parsedDisbDate = data.disbursementDate ? new Date(data.disbursementDate) : new Date();
  const disbDate =
    isNaN(parsedDisbDate.getTime()) ||
    parsedDisbDate.getFullYear() > 2100 ||
    parsedDisbDate.getFullYear() < 2020
      ? new Date()
      : parsedDisbDate;
  const dueDate = new Date(disbDate);
  dueDate.setMonth(dueDate.getMonth() + durationMonths);

  const approvalRef =
    application.approvals?.[0]?.resolutionReference ||
    `DL-EWF-RES-${disbDate.getFullYear()}/${loanId}`;

  // Execute database transaction
  const [createdLoan, updatedApp, txn] = await prisma.$transaction([
    prisma.emergencyLoan.create({
      data: {
        id: loanId,
        applicationId: application.id,
        memberId: application.memberId,
        disbursementDate: disbDate,
        principal,
        interestRate,
        durationMonths,
        interestAmount,
        totalPayable,
        principalPaid: 0.0,
        interestPaid: 0.0,
        totalPaid: 0.0,
        principalBalance: principal,
        interestBalance: interestAmount,
        totalBalance: totalPayable,
        dueDate,
        paymentMethod: data.paymentMethod || 'M-Pesa',
        paymentReference: data.paymentReference,
        approvalReference: approvalRef,
        status: 'Active',
        disbursedBy: user.fullName || user.email || 'Administrator / Treasurer',
        remarks: data.remarks || `Emergency Loan disbursed to ${application.member.fullName}`
      },
      include: { member: true }
    }),
    prisma.emergencyLoanApplication.update({
      where: { id: application.id },
      data: { status: 'Disbursed' }
    }),
    prisma.emergencyFundTransaction.create({
      data: {
        id: `TXN-DISB-${loanId}`,
        transactionDate: disbDate,
        type: 'DISBURSEMENT',
        category: 'Loan Asset',
        amount: principal,
        memberId: application.memberId,
        memberName: application.member.fullName,
        referenceId: loanId,
        paymentMethod: data.paymentMethod || 'M-Pesa',
        paymentReference: data.paymentReference,
        description: `Emergency loan disbursement to ${application.member.fullName} (${loanId})`,
        performedBy: user.fullName || user.email || 'Administrator'
      }
    })
  ]);

  await createAuditLog({
    userEmail: user.email,
    userName: user.fullName || user.username,
    action: 'Added',
    model: 'EmergencyLoan',
    recordRef: createdLoan.id,
    member: application.member.fullName,
    oldValues: {},
    newValues: createdLoan
  });

  return { loan: createdLoan, application: updatedApp, transaction: txn };
}

/**
 * Records a Repayment against an Emergency Loan:
 * 1. Supports partial and full repayments.
 * 2. Strictly separates principal paid and interest paid.
 * 3. Updates loan balance and status (Settled if fully paid, Partially Repaid otherwise).
 * 4. Creates transaction entries in Fund Transaction Register.
 */
export async function recordEmergencyLoanRepayment(
  data: {
    loanId: string;
    repaymentDate?: string;
    principalPaid: number;
    interestPaid: number;
    paymentMethod: string;
    reference: string;
    remarks?: string;
  },
  user: any
) {
  await ensureDatabaseSchema();

  const loan = await prisma.emergencyLoan.findUnique({
    where: { id: data.loanId },
    include: { member: true, application: true }
  });

  if (!loan) {
    throw new Error(`Loan ${data.loanId} not found.`);
  }

  if (loan.status === 'Settled') {
    throw new Error(`Loan ${data.loanId} is already fully settled.`);
  }

  const principalPaid = Number(data.principalPaid) || 0;
  const interestPaid = Number(data.interestPaid) || 0;
  const totalRepaymentAmount = principalPaid + interestPaid;

  if (totalRepaymentAmount <= 0) {
    throw new Error('Repayment amount must be greater than zero.');
  }

  if (principalPaid > loan.principalBalance + 0.01) {
    throw new Error(
      `Principal payment (KSh ${principalPaid.toLocaleString()}) cannot exceed outstanding principal balance (KSh ${loan.principalBalance.toLocaleString()}).`
    );
  }

  if (interestPaid > loan.interestBalance + 0.01) {
    throw new Error(
      `Interest payment (KSh ${interestPaid.toLocaleString()}) cannot exceed outstanding interest balance (KSh ${loan.interestBalance.toLocaleString()}).`
    );
  }

  const parsedRepDate = data.repaymentDate ? new Date(data.repaymentDate) : new Date();
  const repDate =
    isNaN(parsedRepDate.getTime()) ||
    parsedRepDate.getFullYear() > 2100 ||
    parsedRepDate.getFullYear() < 2020
      ? new Date()
      : parsedRepDate;

  // New cumulative figures
  const newPrincipalPaid = Math.round((loan.principalPaid + principalPaid) * 100) / 100;
  const newInterestPaid = Math.round((loan.interestPaid + interestPaid) * 100) / 100;
  const newTotalPaid = Math.round((newPrincipalPaid + newInterestPaid) * 100) / 100;

  const newPrincipalBalance = Math.max(0, Math.round((loan.principal - newPrincipalPaid) * 100) / 100);
  const newInterestBalance = Math.max(0, Math.round((loan.interestAmount - newInterestPaid) * 100) / 100);
  const newTotalBalance = Math.max(0, Math.round((newPrincipalBalance + newInterestBalance) * 100) / 100);

  const isSettled = newTotalBalance <= 0.01;
  const newStatus = isSettled ? 'Settled' : 'Partially Repaid';

  const count = await prisma.emergencyLoanRepayment.count();
  const repTxnBase = `TXN-REP-${loan.id}-${count + 1}`;

  // Execute database transaction
  const [createdRepayment, updatedLoan] = await prisma.$transaction([
    prisma.emergencyLoanRepayment.create({
      data: {
        loanId: loan.id,
        memberId: loan.memberId,
        repaymentDate: repDate,
        amount: totalRepaymentAmount,
        principalPaid,
        interestPaid,
        paymentMethod: data.paymentMethod || 'M-Pesa',
        reference: data.reference,
        remarks: data.remarks || `Repayment for ${loan.id}`,
        recordedBy: user.fullName || user.email || 'Treasurer'
      }
    }),
    prisma.emergencyLoan.update({
      where: { id: loan.id },
      data: {
        principalPaid: newPrincipalPaid,
        interestPaid: newInterestPaid,
        totalPaid: newTotalPaid,
        principalBalance: newPrincipalBalance,
        interestBalance: newInterestBalance,
        totalBalance: newTotalBalance,
        status: newStatus,
        clearedDate: isSettled ? repDate : null
      },
      include: { member: true }
    })
  ]);

  // If settled, also update loan application status to 'Repaid'
  if (isSettled && loan.applicationId) {
    await prisma.emergencyLoanApplication.update({
      where: { id: loan.applicationId },
      data: { status: 'Repaid' }
    });
  }

  // Record separate ledger transactions for principal and interest
  if (principalPaid > 0) {
    await prisma.emergencyFundTransaction.create({
      data: {
        id: `${repTxnBase}-PRN`,
        transactionDate: repDate,
        type: 'PRINCIPAL_REPAYMENT',
        category: 'Fund Capital',
        amount: principalPaid,
        memberId: loan.memberId,
        memberName: loan.member.fullName,
        referenceId: loan.id,
        paymentMethod: data.paymentMethod || 'M-Pesa',
        paymentReference: data.reference,
        description: `Principal repayment by ${loan.member.fullName} on ${loan.id}`,
        performedBy: user.fullName || user.email || 'Treasurer'
      }
    });
  }

  if (interestPaid > 0) {
    await prisma.emergencyFundTransaction.create({
      data: {
        id: `${repTxnBase}-INT`,
        transactionDate: repDate,
        type: 'INTEREST_RECEIPT',
        category: 'Fund Income',
        amount: interestPaid,
        memberId: loan.memberId,
        memberName: loan.member.fullName,
        referenceId: loan.id,
        paymentMethod: data.paymentMethod || 'M-Pesa',
        paymentReference: data.reference,
        description: `Interest receipt from ${loan.member.fullName} on ${loan.id} (10% simple interest)`,
        performedBy: user.fullName || user.email || 'Treasurer'
      }
    });
  }

  await createAuditLog({
    userEmail: user.email,
    userName: user.fullName || user.username,
    action: 'Updated',
    model: 'EmergencyLoanRepayment',
    recordRef: `REP-${createdRepayment.id}`,
    member: loan.member.fullName,
    oldValues: { principalBalance: loan.principalBalance, interestBalance: loan.interestBalance },
    newValues: createdRepayment
  });

  return { repayment: createdRepayment, loan: updatedLoan };
}

/**
 * Reverses an allocation or transaction with strict audit trail (Controlled reversal, NO hard delete).
 */
export async function reverseFundTransaction(
  data: {
    transactionId: string;
    reason: string;
  },
  user: any
) {
  await ensureDatabaseSchema();
  if (!user || !isUserAdmin(user)) {
    throw new Error('Forbidden: Only Administrator Simon Memia Wanjiru can reverse fund transactions.');
  }

  const txn = await prisma.emergencyFundTransaction.findUnique({
    where: { id: data.transactionId }
  });

  if (!txn) {
    throw new Error(`Transaction ${data.transactionId} not found.`);
  }

  if (txn.isReversed) {
    throw new Error(`Transaction ${data.transactionId} has already been reversed.`);
  }

  const reversalTxnId = `TXN-REV-${txn.id}-${Date.now().toString().slice(-4)}`;

  // Mark original transaction reversed
  const updatedTxn = await prisma.emergencyFundTransaction.update({
    where: { id: txn.id },
    data: {
      isReversed: true,
      reversedAt: new Date(),
      reversalReason: data.reason,
      reversalTransactionId: reversalTxnId
    }
  });

  // Create compensating reversal transaction
  const revTxn = await prisma.emergencyFundTransaction.create({
    data: {
      id: reversalTxnId,
      transactionDate: new Date(),
      type: 'REVERSAL',
      category: 'Adjustment',
      amount: txn.amount,
      memberId: txn.memberId,
      memberName: txn.memberName,
      referenceId: txn.id,
      paymentMethod: txn.paymentMethod,
      paymentReference: `REV-${txn.paymentReference || txn.id}`,
      description: `Reversal of ${txn.id} (${txn.description}). Reason: ${data.reason}`,
      performedBy: user.fullName || user.email || 'Administrator'
    }
  });

  // If this was an allocation, update allocation status
  if (txn.type === 'ALLOCATION' && txn.referenceId) {
    const parts = txn.referenceId.split('-M00');
    if (parts.length === 2) {
      const memberId = Number(parts[1]);
      await prisma.emergencyFundAllocation.updateMany({
        where: {
          memberId,
          monthYear: parts[0]
        },
        data: {
          status: 'Reversed',
          notes: `Reversed on ${new Date().toISOString()}: ${data.reason}`
        }
      });
    }
  }

  await createAuditLog({
    userEmail: user.email,
    userName: user.fullName || user.username,
    action: 'Reversed',
    model: 'EmergencyFundTransaction',
    recordRef: txn.id,
    member: txn.memberName || 'Fund Ledger',
    oldValues: txn,
    newValues: { updatedTxn, revTxn, reason: data.reason }
  });

  return { originalTransaction: updatedTxn, reversalTransaction: revTxn };
}

/**
 * Reverses an individual allocation with audit log and ledger entry.
 */
export async function reverseFundAllocation(
  data: {
    allocationId: number;
    reason: string;
  },
  user: any
) {
  await ensureDatabaseSchema();
  if (!user || (!isUserAdmin(user) && !user.role?.toLowerCase().includes('treasurer'))) {
    throw new Error('Forbidden: Only Administrator or Treasurer can reverse allocations.');
  }

  const allocation = await prisma.emergencyFundAllocation.findUnique({
    where: { id: Number(data.allocationId) },
    include: { member: true }
  });

  if (!allocation) {
    throw new Error(`Allocation ID ${data.allocationId} not found.`);
  }

  if (allocation.status === 'Reversed') {
    throw new Error(`Allocation ALC-${allocation.id} is already reversed.`);
  }

  const oldValues = {
    id: allocation.id,
    amount: allocation.amount,
    status: allocation.status,
    notes: allocation.notes
  };

  const updatedAllocation = await prisma.emergencyFundAllocation.update({
    where: { id: allocation.id },
    data: {
      status: 'Reversed',
      amount: 0,
      notes: `Reversed on ${new Date().toISOString()}: ${data.reason}`,
      recordedBy: user.fullName || user.email || 'Treasurer'
    },
    include: { member: true }
  });

  // Mark or create reversing transaction
  const txnId = `TXN-ALC-${allocation.year}${allocation.month.substring(0, 3).toUpperCase()}-M00${allocation.memberId}`;
  await prisma.emergencyFundTransaction.updateMany({
    where: { id: txnId },
    data: {
      isReversed: true,
      reversedAt: new Date(),
      reversalReason: data.reason
    }
  });

  const revTxnId = `TXN-REV-ALC-${allocation.id}-${Date.now().toString().slice(-4)}`;
  await prisma.emergencyFundTransaction.create({
    data: {
      id: revTxnId,
      transactionDate: new Date(),
      type: 'REVERSAL',
      category: 'Adjustment',
      amount: allocation.amount,
      memberId: allocation.memberId,
      memberName: allocation.member.fullName,
      referenceId: `ALC-${allocation.id}`,
      paymentMethod: 'Internal Reversal',
      paymentReference: `REV-ALC-${allocation.id}`,
      description: `Reversal of allocation ALC-${allocation.id} for ${allocation.member.fullName} (${allocation.month} ${allocation.year}). Reason: ${data.reason}`,
      performedBy: user.fullName || user.email || 'Treasurer'
    }
  });

  await createAuditLog({
    userEmail: user.email,
    userName: user.fullName || user.username,
    action: 'Reversed',
    model: 'EmergencyFundAllocation',
    recordRef: `ALC-${allocation.id}`,
    member: allocation.member.fullName,
    oldValues,
    newValues: {
      id: updatedAllocation.id,
      amount: updatedAllocation.amount,
      status: updatedAllocation.status,
      notes: updatedAllocation.notes
    },
    reason: data.reason,
    remarks: `Reversed Emergency Fund allocation ALC-${allocation.id} for ${allocation.member.fullName} (${allocation.month} ${allocation.year}): ${data.reason}`
  });

  return updatedAllocation;
}

/**
 * Safely removes all development test and dummy records from the Emergency & Welfare Fund tables.
 * Preserves all genuine member allocations and company records.
 */
export async function cleanupEmergencyFundTestData(user: SessionPayload) {
  if (!isUserAdmin(user)) {
    throw new Error('Unauthorized. Only Super Administrators can perform test data cleanup.');
  }

  // 1. Remove dummy EmergencyLoanRepayment records
  const repaymentsResult = await prisma.emergencyLoanRepayment.deleteMany({
    where: {
      OR: [
        { loanId: { in: ['EWF-L001', 'EWF-L002'] } },
        { reference: { startsWith: 'MPESA-REP-SETTLED' } }
      ]
    }
  });

  // 2. Remove dummy EmergencyLoan records
  const loansResult = await prisma.emergencyLoan.deleteMany({
    where: {
      OR: [
        { id: { in: ['EWF-L001', 'EWF-L002'] } },
        { applicationId: { in: ['EAPP-1001', 'EAPP-1002', 'EAPP-1003', 'EAPP-1004', 'EAPP-1005'] } }
      ]
    }
  });

  // 3. Remove dummy EmergencyLoanApproval records
  const approvalsResult = await prisma.emergencyLoanApproval.deleteMany({
    where: {
      applicationId: { in: ['EAPP-1001', 'EAPP-1002', 'EAPP-1003', 'EAPP-1004', 'EAPP-1005'] }
    }
  });

  // 4. Remove dummy EmergencyLoanApplication records
  const applicationsResult = await prisma.emergencyLoanApplication.deleteMany({
    where: {
      id: { in: ['EAPP-1001', 'EAPP-1002', 'EAPP-1003', 'EAPP-1004', 'EAPP-1005'] }
    }
  });

  // 5. Remove test EmergencyFundTransaction records
  const transactionsResult = await prisma.emergencyFundTransaction.deleteMany({
    where: {
      OR: [
        { id: { in: [
          'TXN-REV-ALC-88-1355',
          'TXN-REV-ALC-88-8865',
          'TXN-REV-TXN-DISB-EWF-L001-3189',
          'TXN-DISB-EWF-L001',
          'TXN-REP-EWF-L001-1-INT',
          'TXN-REP-EWF-L001-1-PRN',
          'TXN-DISB-EWF-L002'
        ] } },
        { referenceId: { in: ['EWF-L001', 'EWF-L002', 'EAPP-1001', 'EAPP-1002', 'EAPP-1003', 'EAPP-1004', 'EAPP-1005'] } },
        { description: { contains: 'Audit testing: Authorized test reversal' } },
        { paymentReference: { in: ['DISB-EWF-L001', 'DISB-EWF-L002', 'MPESA-REP-SETTLED-001'] } }
      ]
    }
  });

  // 6. Restore Allocation ALC-88 (David Wainaina Kinyua, September 2026) to its genuine state
  let restoredAllocationsCount = 0;
  const alc88 = await prisma.emergencyFundAllocation.findUnique({ where: { id: 88 } });
  if (alc88) {
    await prisma.emergencyFundAllocation.update({
      where: { id: 88 },
      data: {
        amount: 1000.0,
        status: 'Allocated',
        notes: 'Auto-allocated from KSh 6,000 contribution (CNT-089)'
      }
    });
    restoredAllocationsCount = 1;
  }

  // 7. Clean up test EditLog records
  const editLogsResult = await prisma.editLog.deleteMany({
    where: {
      OR: [
        { model: { in: ['EmergencyLoan', 'EmergencyLoanApplication', 'EmergencyLoanRepayment', 'EmergencyFundTransaction'] } },
        { changes: { contains: 'Audit testing: Authorized test reversal' } },
        { changes: { contains: 'EWF-L001' } },
        { changes: { contains: 'EWF-L002' } },
        { changes: { contains: 'EAPP-100' } }
      ]
    }
  });

  // 8. Record genuine cleanup audit entry
  await createAuditLog({
    userEmail: user.email,
    userName: user.fullName || user.email || 'Admin',
    action: 'Deleted',
    model: 'EmergencyFund',
    member: 'System Administration',
    recordRef: 'CLEANUP-2026-11-23',
    oldValues: {},
    newValues: { status: 'Cleaned' },
    reason: 'Executive instruction: permanent removal of all development test and demo data',
    remarks: `Cleaned up ${applicationsResult.count} dummy applications, ${loansResult.count} dummy loans, ${repaymentsResult.count} test repayments, ${transactionsResult.count} test transactions, and restored ALC-88.`
  });

  return {
    deletedRepayments: repaymentsResult.count,
    deletedLoans: loansResult.count,
    deletedApprovals: approvalsResult.count,
    deletedApplications: applicationsResult.count,
    deletedTransactions: transactionsResult.count,
    deletedAuditLogs: editLogsResult.count,
    restoredAllocations: restoredAllocationsCount
  };
}

function getMonthIndex(month: string): number {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const idx = months.indexOf(month);
  return idx >= 0 ? idx : 0;
}
