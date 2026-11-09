'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Download,
  Printer,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  FileText,
  Settings,
  Users,
  ArrowLeft,
  Calendar,
  TrendingUp,
  CreditCard,
  SlidersHorizontal,
  ArrowUpDown,
  RefreshCw,
  ShieldCheck,
  History,
  MoreVertical,
  Ban,
  RotateCcw,
  X,
  Coins,
  ChevronDown,
  Check
} from 'lucide-react';
import {
  calculateLoanProfile,
  CalculatedLoanProfile,
  InterestMethod,
  AllocationPolicy,
  roundCurrency
} from '@/lib/loanCalculator';
import { ALL_MONTHS, AVAILABLE_YEARS, getEATISODate } from '@/lib/dateUtils';
import { getMemberAvatar } from '@/lib/memberAvatars';

interface LoanPortfolioTabProps {
  loans: any[];
  members: any[];
  canEdit: boolean;
  userEmail: string;
  onRefreshLoans: (asOfDate?: string) => Promise<void>;
  onNavigateTab: (tabId: string) => void;
  showToast: (msg: string) => void;
}

type LoanSubView =
  | 'register'
  | 'loan-profile'
  | 'member-profile'
  | 'repayments'
  | 'settled-history'
  | 'reports'
  | 'settings';

export default function LoanPortfolioTab({
  loans,
  members,
  canEdit,
  userEmail,
  onRefreshLoans,
  onNavigateTab,
  showToast
}: LoanPortfolioTabProps) {
  // Navigation state
  const [subView, setSubView] = useState<LoanSubView>('register');
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [selectedMemberName, setSelectedMemberName] = useState<string>(
    members[0]?.fullName || 'Simon Memia Wanjiru'
  );
  const [openActionMenuLoanId, setOpenActionMenuLoanId] = useState<string | null>(null);

  // Close actions menu on click outside
  React.useEffect(() => {
    const handleClickOutside = () => setOpenActionMenuLoanId(null);
    if (openActionMenuLoanId) {
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
    }
  }, [openActionMenuLoanId]);

  // Calculation Settings (defaults for NEW loans only; never alters existing loans' agreed methods)
  const [defaultInterestRate, setDefaultInterestRate] = useState<number>(10.0);
  const [defaultInterestMethod, setDefaultInterestMethod] = useState<InterestMethod>('Simple');
  const [defaultCompoundingFreq, setDefaultCompoundingFreq] = useState<string>('Monthly');
  const [defaultAllocationPolicy, setDefaultAllocationPolicy] =
    useState<AllocationPolicy>('Interest First');
  const [defaultDurationMonths, setDefaultDurationMonths] = useState<number>(6);
  const [reportingAsOfDate, setReportingAsOfDate] = useState<string>(getEATISODate());

  // Search, Filters & Sorting (Section 2.10)
  const [filterMember, setFilterMember] = useState<string>('All');
  const [filterLoanId, setFilterLoanId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterInterestRate, setFilterInterestRate] = useState<string>('All');
  const [filterMonth, setFilterMonth] = useState<string>('All');
  const [filterYear, setFilterYear] = useState<string>('All');
  const [filterIssueDate, setFilterIssueDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'issueDate' | 'principal' | 'interest' | 'balance'>(
    'issueDate'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Reports State (Section 2.11)
  const [reportType, setReportType] = useState<
    'member-statement' | 'active-loans' | 'settled-loans' | 'monthly-interest' | 'repayments'
  >('active-loans');
  const [reportMemberFilter, setReportMemberFilter] = useState<string>('All');

  // Disburse / Edit Loan Modal State (Section 2.3)
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [loanForm, setLoanForm] = useState({
    id: '',
    memberName: members[0]?.fullName || 'Simon Memia Wanjiru',
    principal: '',
    issueDate: getEATISODate(),
    interestRate: '10',
    interestMethod: 'Simple' as InterestMethod,
    compoundingFrequency: 'Monthly',
    durationMonths: '6',
    repaymentTerms: 'Monthly Anniversary',
    allocationPolicy: 'Interest First' as AllocationPolicy,
    purpose: 'Personal / Business Development',
    approvalRef: '',
    status: 'Active',
    remarks: '',
    editReason: ''
  });
  const [loanFormError, setLoanFormError] = useState<string | null>(null);
  const [isSubmittingLoan, setIsSubmittingLoan] = useState(false);

  // Delete / Cancel Loan Confirmation Modal State
  const [deleteLoanTarget, setDeleteLoanTarget] = useState<CalculatedLoanProfile | null>(null);
  const [deleteLoanReason, setDeleteLoanReason] = useState<string>('');
  const [deleteLoanError, setDeleteLoanError] = useState<string | null>(null);
  const [isDeletingLoan, setIsDeletingLoan] = useState<boolean>(false);

  // Record Repayment Modal State (Section 2.7)
  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
  const [repaymentForm, setRepaymentForm] = useState({
    memberName: '',
    loanId: '',
    paymentDate: getEATISODate(),
    amount: '',
    paymentMethod: 'M-Pesa',
    mpesaRef: '',
    bankRef: '',
    remarks: ''
  });
  const [repaymentError, setRepaymentError] = useState<string | null>(null);
  const [isSubmittingRepayment, setIsSubmittingRepayment] = useState(false);

  // Edit Individual Repayment Modal State
  const [editingRepaymentTarget, setEditingRepaymentTarget] = useState<any | null>(null);
  const [editRepaymentForm, setEditRepaymentForm] = useState({
    paymentDate: '',
    amount: '',
    paymentMethod: 'M-Pesa',
    mpesaRef: '',
    bankRef: '',
    remarks: '',
    editReason: ''
  });
  const [isSavingRepaymentEdit, setIsSavingRepaymentEdit] = useState(false);

  // Reverse Individual Repayment Confirmation Modal State
  const [reverseRepaymentTarget, setReverseRepaymentTarget] = useState<any | null>(null);
  const [reverseRepaymentReason, setReverseRepaymentReason] = useState<string>('');
  const [isReversingRepayment, setIsReversingRepayment] = useState(false);

  // Compute authoritative profiles for all loans using reportingAsOfDate
  const calculatedLoans: CalculatedLoanProfile[] = useMemo(() => {
    return loans.map(l =>
      calculateLoanProfile(
        {
          id: l.id,
          memberId: l.memberId || 1,
          memberName: l.borrower || l.memberName || l.member?.fullName || 'Member',
          issueDate: l.issueDate,
          principal: Number(l.principal) || 0,
          interest: Number(l.interest) || 0,
          totalPayable: Number(l.totalLoan || l.totalPayable) || 0,
          paidAmount: Number(l.paid ?? l.paidAmount) || 0,
          principalPaid: Number(l.principalPaid) || 0,
          interestPaid: Number(l.interestPaid) || 0,
          interestRate:
            l.interestRate !== undefined && l.interestRate !== null && l.interestRate !== ''
              ? Number(l.interestRate)
              : l.interest && Number(l.principal) > 0
              ? Math.round((Number(l.interest) / Number(l.principal)) * 100 * 100) / 100
              : 10.0,
          interestMethod: l.interestMethod || 'Simple',
          compoundingFrequency: l.compoundingFrequency || 'Monthly',
          durationMonths: Number(l.durationMonths) || 6,
          repaymentTerms: l.repaymentTerms || 'Monthly Anniversary',
          allocationPolicy: l.allocationPolicy || 'Interest First',
          purpose: l.purpose || 'Personal / Business Development',
          approvalRef: l.approvalRef || `APR-${l.id}`,
          remarks: l.remarks || '',
          status: l.status,
          clearedDate: l.clearedDate !== '-' ? l.clearedDate : null,
          repayments: l.repayments || []
        },
        reportingAsOfDate
      )
    );
  }, [loans, reportingAsOfDate]);

  // Authoritative live preview calculation for the Disburse / Edit Loan modal
  const modalPreviewProfile: CalculatedLoanProfile | null = useMemo(() => {
    const p = Number(loanForm.principal);
    if (!p || p <= 0 || !loanForm.issueDate) return null;
    const r = loanForm.interestRate !== '' ? Number(loanForm.interestRate) : 10;
    const existingLoan = editingLoanId ? loans.find(l => l.id === editingLoanId) : null;
    return calculateLoanProfile(
      {
        id: loanForm.id || 'PREVIEW',
        memberId: 1,
        memberName: loanForm.memberName || 'Member',
        issueDate: loanForm.issueDate,
        principal: p,
        interestRate: r,
        interestMethod: loanForm.interestMethod,
        compoundingFrequency: loanForm.compoundingFrequency,
        durationMonths: Number(loanForm.durationMonths) || 6,
        repaymentTerms: loanForm.repaymentTerms,
        allocationPolicy: loanForm.allocationPolicy,
        purpose: loanForm.purpose,
        remarks: loanForm.remarks,
        status: editingLoanId ? loanForm.status : 'Active',
        repayments: existingLoan?.repayments || []
      },
      reportingAsOfDate
    );
  }, [
    loanForm.principal,
    loanForm.interestRate,
    loanForm.issueDate,
    loanForm.interestMethod,
    loanForm.compoundingFrequency,
    loanForm.durationMonths,
    loanForm.repaymentTerms,
    loanForm.allocationPolicy,
    loanForm.purpose,
    loanForm.remarks,
    loanForm.status,
    loanForm.id,
    editingLoanId,
    loans,
    reportingAsOfDate
  ]);

  // Separate Active (Active / Partially Paid / Overdue) vs Settled vs Cancelled loans
  // Cancelled loans never appear as active loans or distort Dashboard totals
  const activePortfolioLoans = useMemo(
    () => calculatedLoans.filter(l => l.status !== 'Settled' && l.status !== 'Cancelled'),
    [calculatedLoans]
  );
  const settledHistoryLoans = useMemo(
    () => calculatedLoans.filter(l => l.status === 'Settled'),
    [calculatedLoans]
  );
  const cancelledLoans = useMemo(
    () => calculatedLoans.filter(l => l.status === 'Cancelled'),
    [calculatedLoans]
  );
  const nonCancelledLoans = useMemo(
    () => calculatedLoans.filter(l => l.status !== 'Cancelled'),
    [calculatedLoans]
  );

  // Filtered and sorted loans for Main Register
  const filteredLoans = useMemo(() => {
    const baseList =
      filterStatus === 'Settled'
        ? settledHistoryLoans
        : filterStatus === 'Cancelled'
        ? cancelledLoans
        : filterStatus === 'All'
        ? nonCancelledLoans
        : calculatedLoans.filter(l => l.status === filterStatus);

    const filtered = baseList.filter(l => {
      if (
        filterMember !== 'All' &&
        l.memberName.toLowerCase().trim() !== filterMember.toLowerCase().trim()
      ) {
        return false;
      }
      if (filterLoanId.trim() !== '') {
        const q = filterLoanId.trim().toLowerCase();
        if (
          !l.id.toLowerCase().includes(q) &&
          !l.memberName.toLowerCase().includes(q) &&
          !l.approvalRef.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (filterInterestRate !== 'All') {
        const rateNum = Number(l.monthlyInterestRate);
        if (filterInterestRate === '0' && rateNum !== 0) return false;
        if (filterInterestRate === '5' && rateNum !== 5) return false;
        if (filterInterestRate === '10' && rateNum !== 10) return false;
        if (filterInterestRate === '15' && rateNum !== 15) return false;
        if (filterInterestRate === 'Custom' && [0, 5, 10, 15].includes(rateNum)) return false;
      }
      if (filterIssueDate.trim() !== '' && l.issueDate !== filterIssueDate.trim()) {
        return false;
      }
      if (filterYear !== 'All' || filterMonth !== 'All') {
        const [yStr, mStr] = l.issueDate.split('-');
        const yNum = parseInt(yStr, 10);
        const mIdx = parseInt(mStr, 10) - 1;
        if (filterYear !== 'All' && yNum !== parseInt(filterYear, 10)) return false;
        if (filterMonth !== 'All' && ALL_MONTHS[mIdx]?.toLowerCase() !== filterMonth.toLowerCase()) {
          return false;
        }
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'issueDate') {
        cmp = a.issueDate.localeCompare(b.issueDate);
      } else if (sortBy === 'principal') {
        cmp = a.originalPrincipal - b.originalPrincipal;
      } else if (sortBy === 'interest') {
        cmp = a.totalInterestAccrued - b.totalInterestAccrued;
      } else if (sortBy === 'balance') {
        cmp = a.totalOutstandingBalance - b.totalOutstandingBalance;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [
    calculatedLoans,
    settledHistoryLoans,
    cancelledLoans,
    nonCancelledLoans,
    filterMember,
    filterLoanId,
    filterStatus,
    filterInterestRate,
    filterMonth,
    filterYear,
    filterIssueDate,
    sortBy,
    sortOrder
  ]);

  // Portfolio Aggregate Metrics (Settled & Cancelled loans strictly excluded from active exposure)
  const portfolioStats = useMemo(() => {
    const totalDisbursedAll = nonCancelledLoans.reduce((s, l) => s + l.originalPrincipal, 0);
    const activePrincipal = activePortfolioLoans.reduce((s, l) => s + l.remainingPrincipal, 0);
    const activeUnpaidInterest = activePortfolioLoans.reduce((s, l) => s + l.unpaidInterest, 0);
    const activeOutstandingTotal = activePortfolioLoans.reduce(
      (s, l) => s + l.totalOutstandingBalance,
      0
    );
    const totalInterestAccruedAll = nonCancelledLoans.reduce(
      (s, l) => s + l.totalInterestAccrued,
      0
    );
    const totalLoansAmount = nonCancelledLoans.reduce((s, l) => s + l.totalLoanAmount, 0);
    const totalRepaidAll = nonCancelledLoans.reduce((s, l) => s + l.totalAmountPaid, 0);
    const settledPrincipalTotal = settledHistoryLoans.reduce((s, l) => s + l.principalRepaid, 0);
    const settledInterestTotal = settledHistoryLoans.reduce((s, l) => s + l.interestPaid, 0);
    const totalInterestPaidAll = nonCancelledLoans.reduce((s, l) => s + (Number(l.interestPaid) || 0), 0);

    return {
      totalLoansCount: nonCancelledLoans.length,
      activeCount: activePortfolioLoans.length,
      settledCount: settledHistoryLoans.length,
      cancelledCount: cancelledLoans.length,
      partiallyPaidCount: activePortfolioLoans.filter(l => l.status === 'Partially Paid').length,
      overdueCount: activePortfolioLoans.filter(l => l.status === 'Overdue').length,
      totalDisbursedAll,
      activePrincipal,
      activeUnpaidInterest,
      activeOutstandingTotal,
      totalInterestAccruedAll,
      totalLoansAmount,
      totalRepaidAll,
      settledPrincipalTotal,
      settledInterestTotal,
      totalInterestPaidAll
    };
  }, [nonCancelledLoans, activePortfolioLoans, settledHistoryLoans, cancelledLoans]);

  // Flatten all repayments across all loans for the Repayments Register
  const allRepaymentsList = useMemo(() => {
    const list: Array<{
      id: number | string;
      loanId: string;
      memberName: string;
      paymentDate: string;
      amount: number;
      interestAllocated: number;
      principalAllocated: number;
      runningBalanceAfter: number;
      paymentMethod: string;
      mpesaRef: string;
      bankRef: string;
      reference: string;
      remarks: string;
      loanStatus: string;
    }> = [];

    for (const loan of calculatedLoans) {
      for (const rep of loan.repayments) {
        list.push({
          id: rep.id || `${loan.id}-${rep.paymentDateStr}`,
          loanId: loan.id,
          memberName: loan.memberName,
          paymentDate: rep.paymentDateStr || String(rep.paymentDate).slice(0, 10),
          amount: rep.amount,
          interestAllocated: rep.computedInterestAllocated,
          principalAllocated: rep.computedPrincipalAllocated,
          runningBalanceAfter: rep.runningBalanceAfter,
          paymentMethod: rep.paymentMethod || 'M-Pesa',
          mpesaRef: rep.mpesaRef || '-',
          bankRef: rep.bankRef || '-',
          reference: rep.reference || rep.mpesaRef || rep.bankRef || '-',
          remarks: rep.remarks || 'Loan repayment',
          loanStatus: loan.status
        });
      }
    }
    return list.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
  }, [calculatedLoans]);

  // Currently selected loan profile
  const activeSelectedLoan = useMemo(() => {
    if (!selectedLoanId) return calculatedLoans[0] || null;
    return calculatedLoans.find(l => l.id === selectedLoanId) || calculatedLoans[0] || null;
  }, [calculatedLoans, selectedLoanId]);

  // Next auto-generated Loan ID
  const nextAutoLoanId = useMemo(() => {
    let maxNum = 15;
    for (const l of calculatedLoans) {
      const m = l.id.match(/^L0*(\d+)$/i);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    return `L${String(maxNum + 1).padStart(3, '0')}`;
  }, [calculatedLoans]);

  // Handlers
  const handleOpenDisburseModal = (loanToEdit?: CalculatedLoanProfile) => {
    setLoanFormError(null);
    setOpenActionMenuLoanId(null);
    if (loanToEdit) {
      setEditingLoanId(loanToEdit.id);
      setLoanForm({
        id: loanToEdit.id,
        memberName: loanToEdit.memberName,
        principal: String(loanToEdit.originalPrincipal),
        issueDate: loanToEdit.issueDate,
        interestRate: String(loanToEdit.monthlyInterestRate ?? (loanToEdit as any).interestRate ?? 10),
        interestMethod: loanToEdit.interestMethod,
        compoundingFrequency: loanToEdit.compoundingFrequency || 'Monthly',
        durationMonths: String(loanToEdit.loanDuration || 6),
        repaymentTerms: loanToEdit.repaymentTerms || 'Monthly Anniversary',
        allocationPolicy: loanToEdit.allocationPolicy || 'Interest First',
        purpose: loanToEdit.purpose || 'Personal / Business Development',
        approvalRef: loanToEdit.approvalRef || `APR-${loanToEdit.id}`,
        status: loanToEdit.status || 'Active',
        remarks: loanToEdit.remarks || '',
        editReason: ''
      });
    } else {
      const autoId = nextAutoLoanId;
      setEditingLoanId(null);
      setLoanForm({
        id: autoId,
        memberName: members[0]?.fullName || 'Simon Memia Wanjiru',
        principal: '',
        issueDate: getEATISODate(),
        interestRate: String(defaultInterestRate),
        interestMethod: defaultInterestMethod,
        compoundingFrequency: defaultCompoundingFreq,
        durationMonths: String(defaultDurationMonths),
        repaymentTerms: 'Monthly Anniversary',
        allocationPolicy: defaultAllocationPolicy,
        purpose: 'Personal / Business Development',
        approvalRef: `APR-${autoId}-${new Date().getFullYear()}`,
        status: 'Active',
        remarks: '',
        editReason: ''
      });
    }
    setIsDisburseModalOpen(true);
  };

  const handleSaveLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoanFormError(null);

    const principalVal = Number(loanForm.principal);
    const rateVal = Number(loanForm.interestRate);
    const durVal = Number(loanForm.durationMonths);

    if (!loanForm.memberName) {
      setLoanFormError('Please select a valid Dreamloom Member.');
      return;
    }
    if (!loanForm.principal || isNaN(principalVal) || principalVal <= 0) {
      setLoanFormError('Principal Amount must be greater than KES 0.');
      return;
    }
    if (loanForm.interestRate === '' || isNaN(rateVal) || rateVal < 0) {
      setLoanFormError('Monthly Interest Rate cannot be negative.');
      return;
    }
    if (!loanForm.issueDate) {
      setLoanFormError('Disbursement Date is required.');
      return;
    }
    if (isNaN(durVal) || durVal < 1) {
      setLoanFormError('Loan Duration must be at least 1 month.');
      return;
    }

    setIsSubmittingLoan(true);
    try {
      const matchedMember = members.find(
        m => m.fullName.toLowerCase().trim() === loanForm.memberName.toLowerCase().trim()
      );
      const res = await fetch('/api/loans', {
        method: editingLoanId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: loanForm.id.trim() || undefined,
          memberId: matchedMember?.dbId || undefined,
          borrower: loanForm.memberName,
          memberName: loanForm.memberName,
          principal: principalVal,
          issueDate: loanForm.issueDate,
          interestRate: rateVal,
          interestMethod: loanForm.interestMethod,
          compoundingFrequency: loanForm.compoundingFrequency,
          durationMonths: durVal,
          repaymentTerms: loanForm.repaymentTerms,
          allocationPolicy: loanForm.allocationPolicy,
          purpose: loanForm.purpose,
          approvalRef: loanForm.approvalRef.trim(),
          status: editingLoanId ? loanForm.status : undefined,
          remarks: loanForm.remarks.trim(),
          editReason: loanForm.editReason.trim() || undefined,
          asOfDate: reportingAsOfDate,
          userEmail,
          createdBy: userEmail,
          updatedBy: userEmail
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setLoanFormError(data.error || 'Failed to save loan to database.');
        setIsSubmittingLoan(false);
        return;
      }

      await onRefreshLoans(reportingAsOfDate);
      setIsDisburseModalOpen(false);
      setSelectedLoanId(data.id);
      showToast(
        editingLoanId
          ? `Loan ${data.id} updated and interest recalculated in PostgreSQL.`
          : `Loan ${data.id} disbursed to ${loanForm.memberName} (KES ${principalVal.toLocaleString()}).`
      );
    } catch (err: any) {
      setLoanFormError(err?.message || 'Network error while saving loan.');
    } finally {
      setIsSubmittingLoan(false);
    }
  };

  const handleOpenRepaymentModal = (loan?: CalculatedLoanProfile) => {
    setRepaymentError(null);
    setOpenActionMenuLoanId(null);
    const targetLoan =
      loan || activePortfolioLoans[0] || calculatedLoans[0] || null;
    setRepaymentForm({
      memberName: targetLoan?.memberName || members[0]?.fullName || '',
      loanId: targetLoan?.id || '',
      paymentDate: getEATISODate(),
      amount: targetLoan ? String(targetLoan.totalOutstandingBalance) : '',
      paymentMethod: 'M-Pesa',
      mpesaRef: '',
      bankRef: '',
      remarks: ''
    });
    setIsRepaymentModalOpen(true);
  };

  // Live repayment allocation preview inside the Record Repayment Modal
  const repaymentAllocationPreview = useMemo(() => {
    const loan = calculatedLoans.find(l => l.id === repaymentForm.loanId);
    const amt = Number(repaymentForm.amount) || 0;
    if (!loan || amt <= 0) {
      return { interestAllocated: 0, principalAllocated: 0, remainingAfter: loan?.totalOutstandingBalance || 0 };
    }
    const iDue = loan.unpaidInterest;
    const pDue = loan.remainingPrincipal;
    let iPaid = 0;
    let pPaid = 0;
    if (loan.allocationPolicy === 'Principal First') {
      pPaid = Math.min(pDue, amt);
      iPaid = Math.min(iDue, Math.max(0, amt - pPaid));
    } else if (loan.allocationPolicy === 'Proportional') {
      const tot = iDue + pDue;
      iPaid = tot > 0 ? Math.min(iDue, Math.round(amt * (iDue / tot) * 100) / 100) : 0;
      pPaid = Math.min(pDue, Math.max(0, amt - iPaid));
    } else {
      iPaid = Math.min(iDue, amt);
      pPaid = Math.min(pDue, Math.max(0, amt - iPaid));
    }
    const remainingAfter = Math.max(0, loan.totalOutstandingBalance - (iPaid + pPaid));
    return {
      interestAllocated: iPaid,
      principalAllocated: pPaid,
      remainingAfter
    };
  }, [calculatedLoans, repaymentForm.loanId, repaymentForm.amount]);

  const handleSaveRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setRepaymentError(null);

    const amt = Number(repaymentForm.amount);
    if (!repaymentForm.loanId) {
      setRepaymentError('Please select a Loan ID.');
      return;
    }
    if (!repaymentForm.amount || isNaN(amt) || amt <= 0) {
      setRepaymentError('Payment Amount must be greater than KES 0.');
      return;
    }
    if (!repaymentForm.paymentDate) {
      setRepaymentError('Payment Date is required.');
      return;
    }

    setIsSubmittingRepayment(true);
    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'repayment',
          loanId: repaymentForm.loanId,
          amount: amt,
          paymentDate: repaymentForm.paymentDate,
          paymentMethod: repaymentForm.paymentMethod,
          mpesaRef: repaymentForm.mpesaRef.trim() || undefined,
          bankRef: repaymentForm.bankRef.trim() || undefined,
          remarks: repaymentForm.remarks.trim() || 'Loan repayment',
          userEmail,
          recordedBy: userEmail,
          asOfDate: reportingAsOfDate
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setRepaymentError(data.error || 'Failed to record loan repayment.');
        setIsSubmittingRepayment(false);
        return;
      }

      await onRefreshLoans(reportingAsOfDate);
      setIsRepaymentModalOpen(false);
      showToast(
        data.status === 'Settled'
          ? `Loan ${data.id} fully repaid and moved to Settled Loans History!`
          : `Repayment of KES ${amt.toLocaleString()} recorded on Loan ${data.id}.`
      );
    } catch (err: any) {
      setRepaymentError(err?.message || 'Network error while recording repayment.');
    } finally {
      setIsSubmittingRepayment(false);
    }
  };

  // Open Delete / Cancel Loan Confirmation Modal
  const handlePromptDeleteLoan = (loan: CalculatedLoanProfile) => {
    if (!canEdit) return;
    setOpenActionMenuLoanId(null);
    setDeleteLoanTarget(loan);
    setDeleteLoanReason('');
    setDeleteLoanError(null);
  };

  // Execute Confirmed Loan Delete / Safe Cancellation
  const handleConfirmDeleteLoan = async () => {
    if (!deleteLoanTarget) return;
    setIsDeletingLoan(true);
    setDeleteLoanError(null);
    try {
      const hasRepayments =
        (deleteLoanTarget.repayments && deleteLoanTarget.repayments.length > 0) ||
        deleteLoanTarget.totalAmountPaid > 0;
      const modeParam = hasRepayments ? 'cancel' : 'delete';
      const url = `/api/loans?id=${encodeURIComponent(deleteLoanTarget.id)}&mode=${modeParam}&deletedBy=${encodeURIComponent(userEmail)}&reason=${encodeURIComponent(deleteLoanReason.trim() || (hasRepayments ? 'Safe loan cancellation preserving repayment audit history' : 'Authorized loan deletion'))}`;
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setDeleteLoanError(data.error || 'Failed to delete or cancel loan.');
        setIsDeletingLoan(false);
        return;
      }
      await onRefreshLoans(reportingAsOfDate);
      setDeleteLoanTarget(null);
      showToast(
        data.mode === 'cancelled'
          ? `Loan ${deleteLoanTarget.id} safely cancelled in PostgreSQL (${data.preservedRepaymentsCount || deleteLoanTarget.repayments.length} repayment record(s) preserved in audit history).`
          : `Loan ${deleteLoanTarget.id} deleted from PostgreSQL and logged.`
      );
    } catch (e: any) {
      setDeleteLoanError(e?.message || 'Network error while deleting/cancelling loan.');
    } finally {
      setIsDeletingLoan(false);
    }
  };

  // Open Edit Repayment Modal
  const handleOpenEditRepayment = (rep: any, loanId?: string, memberName?: string) => {
    if (!canEdit) return;
    setEditingRepaymentTarget({
      ...rep,
      loanId: rep.loanId || loanId || activeSelectedLoan?.id,
      memberName: rep.memberName || memberName || activeSelectedLoan?.memberName
    });
    setEditRepaymentForm({
      paymentDate: rep.paymentDate || rep.paymentDateStr || String(rep.paymentDate || '').slice(0, 10) || getEATISODate(),
      amount: String(rep.amount ?? 0),
      paymentMethod: rep.paymentMethod || 'M-Pesa',
      mpesaRef: rep.mpesaRef && rep.mpesaRef !== '-' ? rep.mpesaRef : '',
      bankRef: rep.bankRef && rep.bankRef !== '-' ? rep.bankRef : '',
      remarks: rep.remarks || 'Loan repayment',
      editReason: ''
    });
  };

  // Save Edited Repayment
  const handleSaveEditedRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRepaymentTarget) return;
    setIsSavingRepaymentEdit(true);
    try {
      const res = await fetch('/api/loans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit_repayment',
          repaymentId: editingRepaymentTarget.id,
          amount: Number(editRepaymentForm.amount),
          paymentDate: editRepaymentForm.paymentDate,
          paymentMethod: editRepaymentForm.paymentMethod,
          mpesaRef: editRepaymentForm.mpesaRef.trim() || null,
          bankRef: editRepaymentForm.bankRef.trim() || null,
          remarks: editRepaymentForm.remarks.trim(),
          editReason: editRepaymentForm.editReason.trim() || 'Repayment correction',
          userEmail,
          updatedBy: userEmail
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to update repayment.');
        setIsSavingRepaymentEdit(false);
        return;
      }
      await onRefreshLoans(reportingAsOfDate);
      setEditingRepaymentTarget(null);
      showToast(`Repayment on Loan ${editingRepaymentTarget.loanId} updated and balance recalculated.`);
    } catch (e: any) {
      showToast(e?.message || 'Error updating repayment.');
    } finally {
      setIsSavingRepaymentEdit(false);
    }
  };

  // Prompt Reverse Individual Repayment
  const handlePromptReverseRepayment = (rep: any, loanId?: string, memberName?: string) => {
    if (!canEdit || !rep?.id || Number(rep.id) <= 0) return;
    setReverseRepaymentTarget({
      ...rep,
      loanId: rep.loanId || loanId || activeSelectedLoan?.id,
      memberName: rep.memberName || memberName || activeSelectedLoan?.memberName
    });
    setReverseRepaymentReason('');
  };

  // Execute Confirmed Repayment Reversal
  const handleConfirmReverseRepayment = async () => {
    if (!reverseRepaymentTarget) return;
    setIsReversingRepayment(true);
    try {
      const res = await fetch(
        `/api/loans?repaymentId=${encodeURIComponent(String(reverseRepaymentTarget.id))}&deletedBy=${encodeURIComponent(userEmail)}&reason=${encodeURIComponent(reverseRepaymentReason.trim() || 'Repayment reversal')}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        showToast('Failed to reverse repayment.');
        setIsReversingRepayment(false);
        return;
      }
      await onRefreshLoans(reportingAsOfDate);
      setReverseRepaymentTarget(null);
      showToast('Repayment transaction reversed and loan schedule updated.');
    } catch (e) {
      showToast('Error reversing repayment.');
    } finally {
      setIsReversingRepayment(false);
    }
  };

  // CSV Export Helper (Section 2.11)
  const handleExportLoansCSV = (rows: CalculatedLoanProfile[], filename: string) => {
    const headers = [
      'Loan ID',
      'Issue Date',
      'Member Name',
      'Principal (KES)',
      'Monthly Interest Rate (%)',
      'Interest Method',
      'Completed Periods',
      'Interest Accrued (KES)',
      'Total Loan Amount (KES)',
      'Interest Paid (KES)',
      'Principal Repaid (KES)',
      'Total Paid (KES)',
      'Outstanding Balance (KES)',
      'Status',
      'Settlement Date'
    ];
    const csvLines = [
      headers.join(','),
      ...rows.map(l =>
        [
          l.id,
          l.issueDate,
          `"${l.memberName}"`,
          l.originalPrincipal,
          l.monthlyInterestRate,
          `"${l.interestMethod}"`,
          l.completedPeriods,
          l.totalInterestAccrued,
          l.totalLoanAmount,
          l.interestPaid,
          l.principalRepaid,
          l.totalAmountPaid,
          l.totalOutstandingBalance,
          l.status,
          l.settlementDate
        ].join(',')
      )
    ];
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filename}`);
  };

  const renderStatusBadge = (status: CalculatedLoanProfile['status']) => {
    if (status === 'Settled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Settled
        </span>
      );
    }
    if (status === 'Cancelled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-700/50 text-slate-300 border border-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Cancelled
        </span>
      );
    }
    if (status === 'Partially Paid') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Partially Paid
        </span>
      );
    }
    if (status === 'Overdue') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
          Overdue
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
        Active
      </span>
    );
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Top Module Sub-Navigation Bar */}
      <div className="bg-white/95 backdrop-blur border border-slate-200/90 rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'register', label: 'Loan Portfolio', icon: DollarSign },
            { id: 'loan-profile', label: 'Individual Loan Details', icon: Eye },
            { id: 'member-profile', label: 'Member Loan Profile', icon: Users },
            { id: 'repayments', label: 'Repayments Register', icon: CreditCard },
            { id: 'settled-history', label: 'Settled Loans History', icon: History },
            { id: 'reports', label: 'Loan Reports', icon: FileText },
            { id: 'settings', label: 'Calculation Settings', icon: Settings }
          ].map(item => {
            const Icon = item.icon;
            const active = subView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSubView(item.id as LoanSubView)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[#0A5C36] text-white font-bold shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => onNavigateTab('members')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 hover:bg-emerald-50 border border-emerald-600/30 transition-all"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Member Directory</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-emerald-700" />
            <span className="text-slate-600 font-medium">Valuation Date:</span>
            <input
              type="date"
              value={reportingAsOfDate}
              onChange={e => {
                setReportingAsOfDate(e.target.value);
                onRefreshLoans(e.target.value);
              }}
              className="bg-transparent text-emerald-800 font-bold focus:outline-none"
            />
          </div>
          {canEdit && (
            <>
              <button
                onClick={() => handleOpenRepaymentModal()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold transition-all"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record Repayment</span>
              </button>
              <button
                onClick={() => handleOpenDisburseModal()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0A5C36] hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Disburse Loan</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SUBVIEW 1: MAIN LOAN PORTFOLIO REGISTER (EXACT 3D REFERENCE MATCH)    */}
      {/* ===================================================================== */}
      {subView === 'register' && (
        <div className="space-y-5">
          {/* 1. LUSH 3D GREEN WAVE BANNER CARD */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#064E3B] via-[#0A5C36] to-[#2E9E5B] p-6 md:p-8 text-white shadow-xl">
            {/* Subtle 3D wave gloss reflection */}
            <div className="absolute -right-20 -bottom-24 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute top-0 right-1/4 w-96 h-28 bg-emerald-400/15 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                  {/* White 3D Money Bag Icon */}
                  <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 14h12" />
                    <path d="M4 8h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" />
                    <path d="M12 4v4" />
                    <path d="M8 4h8" />
                    <circle cx="12" cy="14" r="2" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Loan Portfolio</h1>
                  <p className="text-xs md:text-sm text-emerald-100 font-medium mt-0.5">Register of all company loans</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => handleOpenDisburseModal()}
                    className="bg-white hover:bg-slate-50 text-[#064E3B] font-extrabold text-sm px-5 py-2.5 rounded-2xl shadow-md hover:shadow-lg flex items-center gap-2 transition active:scale-95"
                  >
                    <Plus className="w-4 h-4 text-[#064E3B] stroke-[3]" />
                    <span>New Loan</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. FILTER & CONTROLS BAR (WHITE ROUNDED CARD) */}
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Search member or loan ref..."
                value={filterLoanId}
                onChange={e => setFilterLoanId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
              />
              {filterLoanId && (
                <button
                  type="button"
                  onClick={() => setFilterLoanId('')}
                  className="absolute right-3 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdowns & Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* All Members */}
              <div className="relative">
                <select
                  value={filterMember}
                  onChange={e => setFilterMember(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 hover:border-slate-300 rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:border-emerald-500"
                >
                  <option value="All">All Members</option>
                  {members.map(m => (
                    <option key={m.id || m.fullName} value={m.fullName}>
                      {m.fullName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>

              {/* All Status */}
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 hover:border-slate-300 rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:border-emerald-500"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Settled">Settled</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>

              {/* All Interest Rates */}
              <div className="relative">
                <select
                  value={filterInterestRate}
                  onChange={e => setFilterInterestRate(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 hover:border-slate-300 rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:border-emerald-500"
                >
                  <option value="All">All Interest Rates</option>
                  <option value="0">0% Interest</option>
                  <option value="5">5% Interest</option>
                  <option value="10">10% Interest</option>
                  <option value="15">15% Interest</option>
                  <option value="Custom">Custom Rates</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>

              {/* Select Date Button */}
              <div className="relative">
                <label className="border border-emerald-600/70 hover:border-emerald-600 bg-white hover:bg-emerald-50/50 text-emerald-800 rounded-xl px-3.5 py-2 text-xs font-semibold flex items-center gap-2 cursor-pointer transition">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{filterIssueDate ? filterIssueDate : 'Select Date'}</span>
                  <input
                    type="date"
                    value={filterIssueDate}
                    onChange={e => setFilterIssueDate(e.target.value)}
                    className="sr-only"
                  />
                </label>
                {filterIssueDate && (
                  <button
                    type="button"
                    onClick={() => setFilterIssueDate('')}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-500 text-white flex items-center justify-center text-[10px]"
                    title="Clear date filter"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Export Button */}
              <button
                type="button"
                onClick={() => handleExportLoansCSV(filteredLoans, 'dreamloom_loan_portfolio.csv')}
                className="bg-[#0A5C36] hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* 3. LIGHT MINT LOAN REGISTER TABLE CONTAINER */}
          <div className="bg-[#EBF3EC] rounded-2xl p-4 shadow-sm border border-emerald-900/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-slate-800 min-w-[960px]">
                <thead>
                  <tr className="border-b border-emerald-900/10 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    <th className="py-3.5 px-3 w-10">#</th>
                    <th className="py-3.5 px-4">Member Name</th>
                    <th className="py-3.5 px-4">Loan Ref</th>
                    <th className="py-3.5 px-4 text-right">Principal (KSh)</th>
                    <th className="py-3.5 px-4 text-center">Interest Rate</th>
                    <th className="py-3.5 px-4 text-right">Interest Accrued (KSh)</th>
                    <th className="py-3.5 px-4 text-right">Total Loan (KSh)</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/5">
                  {filteredLoans.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500 font-medium">
                        No loan records found matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredLoans.map((loan, idx) => {
                      const loanRef = loan.approvalRef || loan.id;
                      const isMenuOpen = openActionMenuLoanId === loan.id;

                      return (
                        <tr
                          key={loan.id}
                          className="hover:bg-emerald-100/50 transition-colors"
                        >
                          {/* # Index */}
                          <td className="py-3.5 px-3 font-semibold text-slate-700">
                            {idx + 1}
                          </td>

                          {/* Member Name with Avatar */}
                          <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 ring-1 ring-emerald-500/40 bg-slate-200">
                                <img
                                  src={getMemberAvatar(loan.memberName)}
                                  alt={loan.memberName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMemberName(loan.memberName);
                                  setSubView('member-profile');
                                }}
                                className="hover:text-emerald-700 transition text-left"
                              >
                                {loan.memberName}
                              </button>
                            </div>
                          </td>

                          {/* Loan Ref */}
                          <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLoanId(loan.id);
                                setSubView('loan-profile');
                              }}
                              className="hover:text-emerald-700 hover:underline font-semibold"
                            >
                              {loanRef}
                            </button>
                          </td>

                          {/* Principal (KSh) */}
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                            {loan.originalPrincipal.toLocaleString()}
                          </td>

                          {/* Interest Rate */}
                          <td className="py-3.5 px-4 text-center font-semibold text-slate-800 whitespace-nowrap">
                            {loan.monthlyInterestRate}%
                          </td>

                          {/* Interest Accrued (KSh) */}
                          <td className="py-3.5 px-4 text-right font-semibold text-slate-900 whitespace-nowrap">
                            {loan.totalInterestAccrued.toLocaleString()}
                          </td>

                          {/* Total Loan (KSh) */}
                          <td className="py-3.5 px-4 text-right font-black text-slate-950 whitespace-nowrap">
                            {loan.totalLoanAmount.toLocaleString()}
                          </td>

                          {/* Status Pill */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide ${
                                loan.status === 'Settled'
                                  ? 'bg-[#E0F2FE] text-[#0284C7]'
                                  : loan.status === 'Partially Paid'
                                  ? 'bg-[#FEF3C7] text-[#D97706]'
                                  : loan.status === 'Cancelled'
                                  ? 'bg-slate-200 text-slate-600'
                                  : 'bg-[#DCFCE7] text-[#16A34A]'
                              }`}
                            >
                              {loan.status}
                            </span>
                          </td>

                          {/* Actions Menu Pill Button (EXACT MATCH TO 3D IMAGE) */}
                          <td className="py-3.5 px-4 text-center relative whitespace-nowrap">
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionMenuLoanId(prev => (prev === loan.id ? null : loan.id));
                                }}
                                className="bg-[#0A5C36] hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-sm transition active:scale-95"
                                title="Actions"
                                aria-label="Loan Actions"
                              >
                                <span>Actions</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>

                              {/* Dropdown Menu Card (White, Rounded-2xl, Shadow-2xl) */}
                              {isMenuOpen && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="origin-top-right absolute right-0 mt-2 w-36 bg-white rounded-2xl shadow-2xl border border-slate-100 py-1.5 z-50 text-left divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100"
                                >
                                  <div className="py-1">
                                    {/* 1. View */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenuLoanId(null);
                                        setSelectedLoanId(loan.id);
                                        setSubView('loan-profile');
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition"
                                    >
                                      <Eye className="w-4 h-4 text-slate-700" />
                                      <span>View</span>
                                    </button>

                                    {/* 2. Pay */}
                                    {loan.status !== 'Settled' && loan.status !== 'Cancelled' && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenActionMenuLoanId(null);
                                          if (!canEdit) {
                                            showToast('Editor access required: Please log in as an authorized director or officer.');
                                            return;
                                          }
                                          handleOpenRepaymentModal(loan);
                                        }}
                                        className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition"
                                      >
                                        <CreditCard className="w-4 h-4 text-slate-700" />
                                        <span>Pay</span>
                                      </button>
                                    )}

                                    {/* 3. Edit */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenuLoanId(null);
                                        if (!canEdit) {
                                          showToast('Editor access required: Please log in as an authorized director or officer.');
                                          return;
                                        }
                                        handleOpenDisburseModal(loan);
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition"
                                    >
                                      <Edit2 className="w-4 h-4 text-slate-700" />
                                      <span>Edit</span>
                                    </button>
                                  </div>

                                  {/* 4. Delete */}
                                  {loan.status !== 'Cancelled' && (
                                    <div className="py-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenActionMenuLoanId(null);
                                          if (!canEdit) {
                                            showToast('Editor access required: Please log in as an authorized director or officer.');
                                            return;
                                          }
                                          handlePromptDeleteLoan(loan);
                                        }}
                                        className="w-full text-left px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition"
                                      >
                                        <Trash2 className="w-4 h-4 text-rose-600" />
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. SUMMARY METRIC CARDS AT BOTTOM & PAGINATION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {/* Card 1: Total Loans */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Loans</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">
                  KSh {portfolioStats.totalLoansAmount.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Card 2: Settled Loans */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Settled Loans</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">
                  {portfolioStats.settledCount}
                </p>
              </div>
            </div>

            {/* Card 3: Active Loans */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
                <DollarSign className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Loans</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">
                  {portfolioStats.activeCount}
                </p>
              </div>
            </div>

            {/* Card 4: Outstanding */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
                <span className="text-xl font-black text-[#16A34A]">%</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">
                  KSh {portfolioStats.activeOutstandingTotal.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Pagination Controls on Bottom Right */}
          <div className="flex items-center justify-end gap-1.5 pt-1">
            <button
              type="button"
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 text-xs font-semibold transition"
            >
              &lt;
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded-lg bg-[#0A5C36] text-white font-bold flex items-center justify-center text-xs shadow-sm"
            >
              1
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 text-xs font-semibold transition"
            >
              &gt;
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBVIEW 2: INDIVIDUAL LOAN PROFILE & MONTHLY SCHEDULE (Section 2.6)   */}
      {/* ===================================================================== */}
      {subView === 'loan-profile' && activeSelectedLoan && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSubView('register')}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Register</span>
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Select Loan:</span>
                <select
                  value={activeSelectedLoan.id}
                  onChange={e => setSelectedLoanId(e.target.value)}
                  className="bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-emerald-400"
                >
                  {calculatedLoans.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.id} — {l.memberName} (KES {l.originalPrincipal.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canEdit && activeSelectedLoan.status !== 'Settled' && activeSelectedLoan.status !== 'Cancelled' && (
                <button
                  onClick={() => handleOpenRepaymentModal(activeSelectedLoan)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Record Repayment</span>
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => handleOpenDisburseModal(activeSelectedLoan)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Loan</span>
                </button>
              )}
              {canEdit && activeSelectedLoan.status !== 'Cancelled' && (
                <button
                  onClick={() => handlePromptDeleteLoan(activeSelectedLoan)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete / Cancel Loan</span>
                </button>
              )}
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>

          {/* 15-Field Individual Loan Summary Card (Section 2.6) */}
          <div className="bg-[#0F172A] border border-slate-800/90 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-emerald-400">
                    {activeSelectedLoan.id}
                  </span>
                  {renderStatusBadge(activeSelectedLoan.status)}
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  {activeSelectedLoan.memberName}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Purpose: {activeSelectedLoan.purpose} • Approval Ref:{' '}
                  <span className="text-slate-300 font-semibold">
                    {activeSelectedLoan.approvalRef}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                  Total Outstanding Balance
                </p>
                <p className="text-3xl font-black text-amber-400">
                  KES {activeSelectedLoan.totalOutstandingBalance.toLocaleString()}
                </p>
                {activeSelectedLoan.status === 'Settled' && (
                  <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                    Settled on {activeSelectedLoan.settlementDate}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-xs">
              <div className="bg-[#090F1D] border border-slate-800/80 p-3.5 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  1. Member Name
                </span>
                <span className="text-white font-bold mt-1 block">
                  {activeSelectedLoan.memberName}
                </span>
              </div>
              <div className="bg-[#090F1D] border border-slate-800/80 p-3.5 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  2. Loan ID
                </span>
                <span className="text-emerald-400 font-extrabold mt-1 block">
                  {activeSelectedLoan.id}
                </span>
              </div>
              <div className="bg-[#090F1D] border border-slate-800/80 p-3.5 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  3. Original Principal
                </span>
                <span className="text-white font-bold mt-1 block">
                  KES {activeSelectedLoan.originalPrincipal.toLocaleString()}
                </span>
              </div>
              <div className="bg-[#090F1D] border border-slate-800/80 p-3.5 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  4. Disbursement Date
                </span>
                <span className="text-white font-bold mt-1 block">
                  {activeSelectedLoan.issueDateFormatted} ({activeSelectedLoan.issueDate})
                </span>
              </div>
              <div className="bg-[#090F1D] border border-slate-800/80 p-3.5 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  5. Monthly Interest Rate
                </span>
                <span className="text-amber-400 font-bold mt-1 block">
                  {activeSelectedLoan.monthlyInterestRate}% / month
                </span>
              </div>
              <div className="bg-[#090F1D] border border-slate-800/80 p-3.5 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  6. Interest Method
                </span>
                <span className="text-emerald-400 font-bold mt-1 block">
                  {activeSelectedLoan.interestMethod}
                </span>
              </div>
              <div className="bg-[#090F1D] border border-slate-800/80 p-3.5 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  7. Loan Duration
                </span>
                <span className="text-white font-bold mt-1 block">
                  {activeSelectedLoan.loanDuration} Months
                </span>
              </div>
              <div className="bg-[#090F1D] border border-slate-800/80 p-3.5 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  8. Completed Interest Periods
                </span>
                <span className="text-blue-400 font-extrabold mt-1 block">
                  {activeSelectedLoan.completedPeriods} Completed Period(s)
                </span>
              </div>
              <div className="bg-[#090F1D] border border-slate-800/80 p-3.5 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  9. Total Interest Accrued
                </span>
                <span className="text-amber-400 font-extrabold mt-1 block">
                  KES {activeSelectedLoan.totalInterestAccrued.toLocaleString()}
                </span>
              </div>
              <div className="bg-[#090F1D] border border-slate-800/80 p-3.5 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  10. Interest Paid
                </span>
                <span className="text-emerald-400 font-bold mt-1 block">
                  KES {activeSelectedLoan.interestPaid.toLocaleString()}
                </span>
              </div>
              <div className="bg-[#090F1D] border border-slate-800/80 p-3.5 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  11. Unpaid Interest
                </span>
                <span className="text-amber-400 font-bold mt-1 block">
                  KES {activeSelectedLoan.unpaidInterest.toLocaleString()}
                </span>
              </div>
              <div className="bg-[#090F1D] border border-slate-800/80 p-3.5 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  12. Principal Repaid
                </span>
                <span className="text-emerald-400 font-bold mt-1 block">
                  KES {activeSelectedLoan.principalRepaid.toLocaleString()}
                </span>
              </div>
              <div className="bg-[#090F1D] border border-slate-800/80 p-3.5 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  13. Remaining Principal
                </span>
                <span className="text-white font-bold mt-1 block">
                  KES {activeSelectedLoan.remainingPrincipal.toLocaleString()}
                </span>
              </div>
              <div className="bg-[#090F1D] border border-slate-800/80 p-3.5 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  14. Total Amount Paid
                </span>
                <span className="text-emerald-400 font-extrabold mt-1 block">
                  KES {activeSelectedLoan.totalAmountPaid.toLocaleString()}
                </span>
              </div>
              <div className="bg-[#090F1D] border border-amber-500/30 p-3.5 rounded-xl">
                <span className="text-amber-300 block text-[10px] uppercase font-bold">
                  15. Total Outstanding Balance
                </span>
                <span className="text-amber-400 font-black mt-1 block">
                  KES {activeSelectedLoan.totalOutstandingBalance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 11-Column Detailed Monthly Anniversary Schedule Table (Section 2.6) */}
          <div className="bg-[#0F172A] border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white">
                  Monthly Anniversary Interest & Repayment Schedule
                </h3>
                <p className="text-xs text-slate-400">
                  Calculated from actual disbursement date ({activeSelectedLoan.issueDateFormatted})
                  using <span className="text-emerald-400 font-semibold">{activeSelectedLoan.interestMethod}</span>{' '}
                  method & <span className="text-amber-400 font-semibold">{activeSelectedLoan.allocationPolicy}</span>{' '}
                  allocation. Incomplete periods are excluded from accrued balance.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#090F1D] border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-3">Month #</th>
                    <th className="py-3 px-3">Interest Period</th>
                    <th className="py-3 px-3 text-right">Opening Principal</th>
                    <th className="py-3 px-3 text-right">Interest Charged</th>
                    <th className="py-3 px-3 text-right">Payment Received</th>
                    <th className="py-3 px-3 text-right">Interest Paid</th>
                    <th className="py-3 px-3 text-right">Principal Paid</th>
                    <th className="py-3 px-3 text-right">Closing Principal</th>
                    <th className="py-3 px-3 text-right">Outstanding Interest</th>
                    <th className="py-3 px-3 text-right">Total Balance</th>
                    <th className="py-3 px-3 text-center">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {activeSelectedLoan.schedule.map(row => (
                    <tr
                      key={row.monthNumber}
                      className={
                        row.isCompleted
                          ? 'hover:bg-slate-800/35'
                          : 'bg-slate-900/40 text-slate-500 italic'
                      }
                    >
                      <td className="py-3 px-3 font-bold text-emerald-400">
                        Month {row.monthNumber}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-200">
                        {row.interestPeriod}
                      </td>
                      <td className="py-3 px-3 text-right">
                        KES {row.openingPrincipal.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-amber-400">
                        KES {row.interestCharged.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-emerald-400">
                        KES {row.paymentReceived.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-300">
                        KES {row.interestPaid.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right text-teal-300">
                        KES {row.principalPaid.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-200">
                        KES {row.closingPrincipal.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right text-amber-300">
                        KES {row.outstandingInterest.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-white">
                        KES {row.totalOutstandingBalance.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            row.paymentStatus === 'Settled' || row.paymentStatus === 'Paid'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : row.paymentStatus === 'Partially Paid'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : row.paymentStatus === 'Unpaid'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {row.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Individual Loan Repayment History */}
          <div className="bg-[#0F172A] border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                Recorded Repayment Transactions for Loan {activeSelectedLoan.id} (
                {activeSelectedLoan.repayments.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#090F1D] border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                    <th className="py-3 px-4">Payment Date</th>
                    <th className="py-3 px-4 text-right">Amount Paid</th>
                    <th className="py-3 px-4 text-right">Interest Allocated</th>
                    <th className="py-3 px-4 text-right">Principal Allocated</th>
                    <th className="py-3 px-4 text-right">Balance After</th>
                    <th className="py-3 px-4">Method & Reference</th>
                    <th className="py-3 px-4">Remarks</th>
                    {canEdit && (
                      <th className="py-3 px-4 text-center sticky right-0 bg-[#090F1D] border-l border-slate-800/80">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {activeSelectedLoan.repayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-500">
                        No repayments recorded yet for this loan.
                      </td>
                    </tr>
                  ) : (
                    activeSelectedLoan.repayments.map((rep, idx) => (
                      <tr key={rep.id || idx} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-semibold text-white">
                          {rep.paymentDateStr || String(rep.paymentDate).slice(0, 10)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-400">
                          KES {rep.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-amber-300">
                          KES {rep.computedInterestAllocated.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-teal-300">
                          KES {rep.computedPrincipalAllocated.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-white">
                          KES {rep.runningBalanceAfter.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {rep.paymentMethod} •{' '}
                          <span className="text-emerald-400 font-mono">
                            {rep.mpesaRef || rep.bankRef || rep.reference || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{rep.remarks || '-'}</td>
                        {canEdit && (
                          <td className="py-3 px-4 text-center sticky right-0 bg-[#0F172A] border-l border-slate-800/80 whitespace-nowrap">
                            {Number(rep.id) > 0 && (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() =>
                                    handleOpenEditRepayment(
                                      rep,
                                      activeSelectedLoan.id,
                                      activeSelectedLoan.memberName
                                    )
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 rounded-lg text-[11px] font-bold"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() =>
                                    handlePromptReverseRepayment(
                                      rep,
                                      activeSelectedLoan.id,
                                      activeSelectedLoan.memberName
                                    )
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] font-bold"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Reverse</span>
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBVIEW 3: INDIVIDUAL MEMBER LOAN PROFILE (Section 8)                 */}
      {/* ===================================================================== */}
      {subView === 'member-profile' && (
        <div className="space-y-6">
          <div className="bg-[#0F172A] border border-slate-800/90 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 ring-2 ring-emerald-500/50 bg-slate-800 shadow-xl">
                <img
                  src={getMemberAvatar(selectedMemberName)}
                  alt={selectedMemberName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white">
                  {selectedMemberName} — Loan Profile
                </h2>
                <p className="text-xs text-slate-400">
                  Official borrowing portfolio & payment history register
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedMemberName}
                onChange={e => setSelectedMemberName(e.target.value)}
                className="bg-[#070D18] border border-slate-700 rounded-xl px-4 py-2 text-xs font-bold text-emerald-400"
              >
                {members.map(m => (
                  <option key={m.id || m.fullName} value={m.fullName}>
                    {m.fullName}
                  </option>
                ))}
              </select>
              {canEdit && (
                <button
                  onClick={() => {
                    handleOpenDisburseModal();
                    setLoanForm(prev => ({ ...prev, memberName: selectedMemberName }));
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold"
                >
                  + Disburse New Loan to {selectedMemberName.split(' ')[0]}
                </button>
              )}
            </div>
          </div>

          {(() => {
            const memberLoans = calculatedLoans.filter(
              l => l.memberName.toLowerCase().trim() === selectedMemberName.toLowerCase().trim()
            );
            const activeMemberLoans = memberLoans.filter(
              l => l.status !== 'Settled' && l.status !== 'Cancelled'
            );
            const settledMemberLoans = memberLoans.filter(l => l.status === 'Settled');
            const totalBorrowed = memberLoans
              .filter(l => l.status !== 'Cancelled')
              .reduce((s, l) => s + l.originalPrincipal, 0);
            const totalPaid = memberLoans.reduce((s, l) => s + l.totalAmountPaid, 0);
            const activeBalance = activeMemberLoans.reduce(
              (s, l) => s + l.totalOutstandingBalance,
              0
            );

            return (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl">
                    <span className="text-[11px] text-slate-400 uppercase font-bold">
                      Total Facilities Held
                    </span>
                    <p className="text-2xl font-black text-white mt-1">
                      {memberLoans.length} Loans
                    </p>
                    <span className="text-xs text-slate-400">
                      {activeMemberLoans.length} Active • {settledMemberLoans.length} Settled
                    </span>
                  </div>
                  <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl">
                    <span className="text-[11px] text-slate-400 uppercase font-bold">
                      Cumulative Principal Borrowed
                    </span>
                    <p className="text-2xl font-black text-white mt-1">
                      KES {totalBorrowed.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl">
                    <span className="text-[11px] text-slate-400 uppercase font-bold">
                      Cumulative Repaid
                    </span>
                    <p className="text-2xl font-black text-emerald-400 mt-1">
                      KES {totalPaid.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-[#0F172A] border border-amber-500/30 p-4 rounded-2xl">
                    <span className="text-[11px] text-amber-300 uppercase font-bold">
                      Current Active Loan Exposure
                    </span>
                    <p className="text-2xl font-black text-amber-400 mt-1">
                      KES {activeBalance.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-white">
                      All Independent Loans for {selectedMemberName} ({memberLoans.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#090F1D] border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                          <th className="py-3 px-4">Loan ID</th>
                          <th className="py-3 px-4">Disbursement Date</th>
                          <th className="py-3 px-4">Method & Rate</th>
                          <th className="py-3 px-4 text-right">Principal</th>
                          <th className="py-3 px-4 text-right">Interest Accrued</th>
                          <th className="py-3 px-4 text-right">Total Paid</th>
                          <th className="py-3 px-4 text-right">Outstanding Balance</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-center sticky right-0 bg-[#090F1D] border-l border-slate-800/80">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {memberLoans.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-8 text-center text-slate-500">
                              No loans recorded for {selectedMemberName}.
                            </td>
                          </tr>
                        ) : (
                          memberLoans.map(l => (
                            <tr key={l.id} className="hover:bg-slate-800/30">
                              <td className="py-3 px-4 font-bold text-emerald-400">{l.id}</td>
                              <td className="py-3 px-4 text-slate-300">{l.issueDate}</td>
                              <td className="py-3 px-4 text-slate-300">
                                {l.interestMethod} ({l.monthlyInterestRate}% / mo)
                              </td>
                              <td className="py-3 px-4 text-right font-semibold">
                                KES {l.originalPrincipal.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-right text-amber-400 font-semibold">
                                KES {l.totalInterestAccrued.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-right text-emerald-400 font-semibold">
                                KES {l.totalAmountPaid.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-amber-400">
                                KES {l.totalOutstandingBalance.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-center">{renderStatusBadge(l.status)}</td>
                              <td className="py-3 px-4 text-center sticky right-0 bg-[#0F172A] border-l border-slate-800/80 whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setSelectedLoanId(l.id);
                                      setSubView('loan-profile');
                                    }}
                                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg font-bold"
                                  >
                                    Schedule
                                  </button>
                                  {canEdit && (
                                    <button
                                      onClick={() => handleOpenDisburseModal(l)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 rounded-lg font-bold"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                      <span>Edit</span>
                                    </button>
                                  )}
                                  {canEdit && l.status !== 'Cancelled' && (
                                    <button
                                      onClick={() => handlePromptDeleteLoan(l)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-lg font-bold"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Delete</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBVIEW 4: REPAYMENTS REGISTER (Section 2.7)                          */}
      {/* ===================================================================== */}
      {subView === 'repayments' && (
        <div className="space-y-6">
          <div className="bg-[#0F172A] border border-slate-800/90 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-white">
                Loan Repayments & Allocation Register
              </h2>
              <p className="text-xs text-slate-400">
                Auditable transaction ledger showing Interest-First / Configured allocation across
                all member loans
              </p>
            </div>
            {canEdit && (
              <button
                onClick={() => handleOpenRepaymentModal()}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>RECORD LOAN REPAYMENT</span>
              </button>
            )}
          </div>

          <div className="bg-[#0F172A] border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#090F1D] border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                    <th className="py-3.5 px-4">Loan ID</th>
                    <th className="py-3.5 px-4">Member Name</th>
                    <th className="py-3.5 px-4">Payment Date</th>
                    <th className="py-3.5 px-4 text-right">Payment Amount (KES)</th>
                    <th className="py-3.5 px-4 text-right">Interest Allocated</th>
                    <th className="py-3.5 px-4 text-right">Principal Allocated</th>
                    <th className="py-3.5 px-4 text-right">Balance After</th>
                    <th className="py-3.5 px-4">Method</th>
                    <th className="py-3.5 px-4">M-Pesa / Bank Ref</th>
                    <th className="py-3.5 px-4">Remarks</th>
                    {canEdit && (
                      <th className="py-3.5 px-4 text-center sticky right-0 bg-[#090F1D] border-l border-slate-800/80">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {allRepaymentsList.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-10 text-center text-slate-500">
                        No repayment transactions recorded.
                      </td>
                    </tr>
                  ) : (
                    allRepaymentsList.map((r, i) => (
                      <tr key={`${r.id}-${i}`} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-bold text-emerald-400">
                          <button
                            onClick={() => {
                              setSelectedLoanId(r.loanId);
                              setSubView('loan-profile');
                            }}
                            className="hover:underline"
                          >
                            {r.loanId}
                          </button>
                        </td>
                        <td className="py-3 px-4 font-semibold text-white">{r.memberName}</td>
                        <td className="py-3 px-4 text-slate-300">{r.paymentDate}</td>
                        <td className="py-3 px-4 text-right font-extrabold text-emerald-400">
                          KES {r.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-amber-300">
                          KES {r.interestAllocated.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-teal-300">
                          KES {r.principalAllocated.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-white">
                          KES {r.runningBalanceAfter.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-slate-300">{r.paymentMethod}</td>
                        <td className="py-3 px-4 font-mono text-emerald-400">{r.reference}</td>
                        <td className="py-3 px-4 text-slate-400">{r.remarks}</td>
                        {canEdit && (
                          <td className="py-3 px-4 text-center sticky right-0 bg-[#0F172A] border-l border-slate-800/80 whitespace-nowrap">
                            {Number(r.id) > 0 && (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEditRepayment(r)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 rounded-lg text-[11px] font-bold"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handlePromptReverseRepayment(r)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] font-bold"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Reverse</span>
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBVIEW 5: SETTLED LOANS HISTORY (Section 2.9)                        */}
      {/* ===================================================================== */}
      {subView === 'settled-history' && (
        <div className="space-y-6">
          <div className="bg-[#0F172A] border border-slate-800/90 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-white">
                Settled Loans History ({settledHistoryLoans.length})
              </h2>
              <p className="text-xs text-slate-400">
                Fully repaid facilities archived from active exposure while preserving full
                repayment schedules
              </p>
            </div>
            <button
              onClick={() =>
                handleExportLoansCSV(settledHistoryLoans, 'dreamloom_settled_loans_history.csv')
              }
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Settled CSV</span>
            </button>
          </div>

          <div className="bg-[#0F172A] border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[960px]">
                <thead>
                  <tr className="bg-[#090F1D] border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                    <th className="py-3.5 px-4">Loan ID</th>
                    <th className="py-3.5 px-4">Issue Date</th>
                    <th className="py-3.5 px-4">Member Name</th>
                    <th className="py-3.5 px-4 text-right">Principal Repaid (KES)</th>
                    <th className="py-3.5 px-4 text-right">Interest Paid (KES)</th>
                    <th className="py-3.5 px-4 text-right">Total Paid (KES)</th>
                    <th className="py-3.5 px-4">Settlement Date</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center sticky right-0 bg-[#090F1D] border-l border-slate-800/80 min-w-[200px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {settledHistoryLoans.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-500">
                        No settled loans found.
                      </td>
                    </tr>
                  ) : (
                    settledHistoryLoans.map(loan => (
                      <tr key={loan.id} className="hover:bg-slate-800/30">
                        <td className="py-3.5 px-4 font-bold text-emerald-400">{loan.id}</td>
                        <td className="py-3.5 px-4 text-slate-300">{loan.issueDate}</td>
                        <td className="py-3.5 px-4 font-bold text-white">{loan.memberName}</td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-200">
                          KES {loan.principalRepaid.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-amber-400">
                          KES {loan.interestPaid.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400">
                          KES {loan.totalAmountPaid.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-emerald-300 font-semibold">
                          {loan.settlementDate}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {renderStatusBadge('Settled')}
                        </td>
                        <td className="py-3.5 px-4 text-center sticky right-0 bg-[#0F172A] border-l border-slate-800/80 whitespace-nowrap min-w-[200px]">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedLoanId(loan.id);
                                setSubView('loan-profile');
                              }}
                              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-[11px] font-bold"
                            >
                              View Schedule
                            </button>
                            {canEdit && (
                              <button
                                onClick={() => handleOpenDisburseModal(loan)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 rounded-lg text-[11px] font-bold"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                            )}
                            {canEdit && (
                              <button
                                onClick={() => handlePromptDeleteLoan(loan)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] font-bold"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBVIEW 6: LOAN REPORTS & STATEMENTS (Section 2.11)                   */}
      {/* ===================================================================== */}
      {subView === 'reports' && (
        <div className="space-y-6">
          <div className="bg-[#0F172A] border border-slate-800/90 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'active-loans', label: 'Active Loan Report' },
                { id: 'settled-loans', label: 'Settled Loan Report' },
                { id: 'member-statement', label: 'Individual Member Statement' },
                { id: 'monthly-interest', label: 'Monthly Interest Report' },
                { id: 'repayments', label: 'Repayment Report' }
              ].map(rt => (
                <button
                  key={rt.id}
                  onClick={() => setReportType(rt.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    reportType === rt.id
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-[#070D18] text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {rt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {reportType === 'member-statement' && (
                <select
                  value={reportMemberFilter}
                  onChange={e => setReportMemberFilter(e.target.value)}
                  className="bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="All">All Members</option>
                  {members.map(m => (
                    <option key={m.id || m.fullName} value={m.fullName}>
                      {m.fullName}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => {
                  const targetRows =
                    reportType === 'active-loans'
                      ? activePortfolioLoans
                      : reportType === 'settled-loans'
                      ? settledHistoryLoans
                      : reportMemberFilter !== 'All'
                      ? nonCancelledLoans.filter(l => l.memberName === reportMemberFilter)
                      : nonCancelledLoans;
                  handleExportLoansCSV(targetRows, `dreamloom_${reportType}_${reportingAsOfDate}.csv`);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>

          <div className="bg-[#0F172A] border border-slate-800/90 rounded-2xl p-6 shadow-xl">
            <div className="border-b border-slate-800 pb-4 mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white uppercase tracking-wide">
                  DREAMLOOM HOLDING LIMITED — OFFICIAL {reportType.replace('-', ' ').toUpperCase()}
                </h3>
                <p className="text-xs text-slate-400">
                  Generated from authoritative PostgreSQL records as of {reportingAsOfDate}
                </p>
              </div>
              <div className="text-right text-xs text-slate-400">
                <span>Account: 1760287177880</span>
              </div>
            </div>

            {reportType === 'repayments' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#090F1D] border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                      <th className="py-3 px-4">Payment Date</th>
                      <th className="py-3 px-4">Loan ID</th>
                      <th className="py-3 px-4">Member Name</th>
                      <th className="py-3 px-4 text-right">Amount Paid</th>
                      <th className="py-3 px-4 text-right">Interest Allocated</th>
                      <th className="py-3 px-4 text-right">Principal Allocated</th>
                      <th className="py-3 px-4">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {allRepaymentsList.map((r, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-4">{r.paymentDate}</td>
                        <td className="py-2.5 px-4 font-bold text-emerald-400">{r.loanId}</td>
                        <td className="py-2.5 px-4 text-white">{r.memberName}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-emerald-400">
                          KES {r.amount.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-right text-amber-300">
                          KES {r.interestAllocated.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-right text-teal-300">
                          KES {r.principalAllocated.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 font-mono">{r.reference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#090F1D] border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                      <th className="py-3 px-4">Loan ID</th>
                      <th className="py-3 px-4">Issue Date</th>
                      <th className="py-3 px-4">Member Name</th>
                      <th className="py-3 px-4">Method & Rate</th>
                      <th className="py-3 px-4 text-center">Periods</th>
                      <th className="py-3 px-4 text-right">Principal</th>
                      <th className="py-3 px-4 text-right">Interest Accrued</th>
                      <th className="py-3 px-4 text-right">Total Paid</th>
                      <th className="py-3 px-4 text-right">Outstanding</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {(reportType === 'active-loans'
                      ? activePortfolioLoans
                      : reportType === 'settled-loans'
                      ? settledHistoryLoans
                      : reportMemberFilter !== 'All'
                      ? nonCancelledLoans.filter(l => l.memberName === reportMemberFilter)
                      : nonCancelledLoans
                    ).map(l => (
                      <tr key={l.id}>
                        <td className="py-2.5 px-4 font-bold text-emerald-400">{l.id}</td>
                        <td className="py-2.5 px-4">{l.issueDate}</td>
                        <td className="py-2.5 px-4 font-bold text-white">{l.memberName}</td>
                        <td className="py-2.5 px-4">
                          {l.interestMethod} ({l.monthlyInterestRate}%)
                        </td>
                        <td className="py-2.5 px-4 text-center">{l.completedPeriods}</td>
                        <td className="py-2.5 px-4 text-right">
                          KES {l.originalPrincipal.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-right text-amber-400 font-bold">
                          KES {l.totalInterestAccrued.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-right text-emerald-400 font-bold">
                          KES {l.totalAmountPaid.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-right text-amber-400 font-extrabold">
                          KES {l.totalOutstandingBalance.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-center">{l.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBVIEW 7: CALCULATION SETTINGS (Section 2.4 & Section 8)             */}
      {/* ===================================================================== */}
      {subView === 'settings' && (
        <div className="bg-[#0F172A] border border-slate-800/90 rounded-2xl p-6 max-w-3xl space-y-6 shadow-xl">
          <div>
            <h2 className="text-lg font-extrabold text-white">
              Loan Portfolio Calculation Settings
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Configure default parameters for newly disbursed loans. Per Dreamloom financial
              policy, changing default settings here will{' '}
              <span className="text-emerald-400 font-bold">never alter</span> an existing loan&apos;s
              agreed interest method or rate.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1.5">
                Default Monthly Interest Rate (%)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={defaultInterestRate}
                onChange={e => setDefaultInterestRate(Number(e.target.value))}
                className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1.5">
                Default Interest Calculation Method
              </label>
              <select
                value={defaultInterestMethod}
                onChange={e => setDefaultInterestMethod(e.target.value as InterestMethod)}
                className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold"
              >
                <option value="Simple">
                  Simple Interest (Original Principal × Monthly Rate)
                </option>
                <option value="Reducing Balance">
                  Reducing-Balance Interest (Outstanding Principal × Monthly Rate)
                </option>
                <option value="Compound">
                  Compound Interest (Capitalised per Compounding Frequency)
                </option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1.5">
                Default Repayment Allocation Policy
              </label>
              <select
                value={defaultAllocationPolicy}
                onChange={e => setDefaultAllocationPolicy(e.target.value as AllocationPolicy)}
                className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold"
              >
                <option value="Interest First">Interest First, then Principal (Recommended)</option>
                <option value="Principal First">Principal First, then Interest</option>
                <option value="Proportional">Proportional Split</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1.5">
                Default Loan Duration (Months)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={defaultDurationMonths}
                onChange={e => setDefaultDurationMonths(Number(e.target.value))}
                className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
            <strong>Anniversary Accrual Engine Active:</strong> Monthly interest periods are
            computed strictly from each loan&apos;s individual disbursement date (handling 28/29/30/31
            month lengths and leap years) and exclude incomplete periods.
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: DISBURSE / EDIT LOAN FORM (Section 2.3)                      */}
      {/* ===================================================================== */}
      {isDisburseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0F172A] border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-white">
                  {editingLoanId ? `Edit Loan Facility ${editingLoanId}` : 'Disburse New Member Loan'}
                </h3>
                <p className="text-xs text-slate-400">
                  {editingLoanId
                    ? 'Modify member, principal, issue date, interest settings, duration, status, or notes — interest & balances recalculate automatically'
                    : 'All fields are validated and saved permanently to PostgreSQL'}
                </p>
              </div>
              <button
                onClick={() => setIsDisburseModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold px-2.5 py-1 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            {loanFormError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loanFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveLoan} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    1. Member Name *
                  </label>
                  <select
                    value={loanForm.memberName}
                    onChange={e => setLoanForm({ ...loanForm, memberName: e.target.value })}
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold"
                    required
                  >
                    {members.map(m => (
                      <option key={m.id || m.fullName} value={m.fullName}>
                        {m.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Auto-Generated Loan ID *
                  </label>
                  <input
                    type="text"
                    value={loanForm.id}
                    onChange={e => setLoanForm({ ...loanForm, id: e.target.value })}
                    disabled={!!editingLoanId}
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-emerald-400 font-extrabold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    2. Principal Amount (KES) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    placeholder="e.g. 100000"
                    value={loanForm.principal}
                    onChange={e => setLoanForm({ ...loanForm, principal: e.target.value })}
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    3. Disbursement Date *
                  </label>
                  <input
                    type="date"
                    value={loanForm.issueDate}
                    onChange={e => setLoanForm({ ...loanForm, issueDate: e.target.value })}
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold"
                    required
                  />
                </div>

                <div className="col-span-1 sm:col-span-2 bg-[#090F1D]/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="block font-bold text-slate-200 text-xs">
                      4. Monthly Interest Rate (%) — User Controlled *
                    </label>
                    <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                      Selected: {loanForm.interestRate !== '' ? `${loanForm.interestRate}% / month` : 'Not Set'}
                    </span>
                  </div>

                  {/* Preset Selection Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                      Presets:
                    </span>
                    {[
                      { label: '0% (Interest-Free)', val: '0' },
                      { label: '5%', val: '5' },
                      { label: '10%', val: '10' },
                      { label: '15%', val: '15' },
                      { label: '20%', val: '20' }
                    ].map(preset => {
                      const isSelected = String(loanForm.interestRate) === preset.val;
                      return (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => setLoanForm({ ...loanForm, interestRate: preset.val })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 ring-1 ring-amber-300'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={loanForm.interestRate}
                        onChange={e => setLoanForm({ ...loanForm, interestRate: e.target.value })}
                        placeholder="Enter percentage (e.g. 0, 5, 10, 15, 20 or custom)"
                        className="w-full bg-[#070D18] border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-amber-400 font-bold font-mono text-sm"
                        required
                      />
                      <span className="absolute right-3 top-2 text-slate-400 text-xs font-bold pointer-events-none">
                        % / month
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Manually selected for this individual loan only. Saved directly to the database. Does not alter company defaults or other member facilities.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    5. Interest Calculation Method *
                  </label>
                  <select
                    value={loanForm.interestMethod}
                    onChange={e =>
                      setLoanForm({
                        ...loanForm,
                        interestMethod: e.target.value as InterestMethod
                      })
                    }
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold"
                  >
                    <option value="Simple">Simple Interest</option>
                    <option value="Reducing Balance">Reducing-Balance Interest</option>
                    <option value="Compound">Compound Interest</option>
                  </select>
                </div>

                {loanForm.interestMethod === 'Compound' && (
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Compounding Frequency
                    </label>
                    <select
                      value={loanForm.compoundingFrequency}
                      onChange={e =>
                        setLoanForm({ ...loanForm, compoundingFrequency: e.target.value })
                      }
                      className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Semi-Annually">Semi-Annually</option>
                      <option value="Annually">Annually</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    6. Loan Duration (Months)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={loanForm.durationMonths}
                    onChange={e => setLoanForm({ ...loanForm, durationMonths: e.target.value })}
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    7. Repayment Terms & Allocation
                  </label>
                  <select
                    value={loanForm.repaymentTerms}
                    onChange={e => setLoanForm({ ...loanForm, repaymentTerms: e.target.value })}
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                  >
                    <option value="Monthly Anniversary">Monthly Anniversary</option>
                    <option value="Flexible / On-Demand">Flexible / On-Demand</option>
                    <option value="Monthly Instalments">Monthly Instalments</option>
                    <option value="Lump Sum at Maturity">Lump Sum at Maturity</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    8. Loan Purpose
                  </label>
                  <input
                    type="text"
                    value={loanForm.purpose}
                    onChange={e => setLoanForm({ ...loanForm, purpose: e.target.value })}
                    placeholder="e.g. Business Working Capital"
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    9. Approval Reference
                  </label>
                  <input
                    type="text"
                    value={loanForm.approvalRef}
                    onChange={e => setLoanForm({ ...loanForm, approvalRef: e.target.value })}
                    placeholder="e.g. APR-L016-2026"
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                  />
                </div>

                {editingLoanId && (
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-emerald-300 mb-1">
                      10. Loan Status
                    </label>
                    <select
                      value={loanForm.status}
                      onChange={e => setLoanForm({ ...loanForm, status: e.target.value })}
                      className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold"
                    >
                      <option value="Active">Active (Recalculate from Schedule)</option>
                      <option value="Partially Paid">Partially Paid</option>
                      <option value="Overdue">Overdue</option>
                      <option value="Settled">Settled (Fully Cleared)</option>
                      <option value="Cancelled">Cancelled (Archived — Excluded from Active Totals)</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  {editingLoanId ? '11. Notes or Remarks' : '10. Notes or Remarks'}
                </label>
                <textarea
                  rows={2}
                  value={loanForm.remarks}
                  onChange={e => setLoanForm({ ...loanForm, remarks: e.target.value })}
                  placeholder="Optional disbursement notes or collateral remarks..."
                  className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              {editingLoanId && (
                <div>
                  <label className="block font-bold text-amber-300 mb-1">
                    12. Reason for Correction / Edit (Audit Trail)
                  </label>
                  <input
                    type="text"
                    value={loanForm.editReason}
                    onChange={e => setLoanForm({ ...loanForm, editReason: e.target.value })}
                    placeholder="e.g. Corrected principal / issue date / interest method per member statement"
                    className="w-full bg-[#070D18] border border-amber-500/40 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              )}

              {/* Live Calculation Preview */}
              {Number(loanForm.principal) > 0 && modalPreviewProfile && (
                <div className="bg-[#090F1D] border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Monthly Interest Accrual ({modalPreviewProfile.monthlyInterestRate}% / month)
                      </span>
                      {modalPreviewProfile.monthlyInterestRate === 0 ? (
                        <span className="text-sm font-extrabold text-emerald-400">
                          KES 0 <span className="text-xs font-normal text-slate-400">(0% Interest-Free Loan)</span>
                        </span>
                      ) : (
                        <span className="text-sm font-extrabold text-amber-400">
                          KES{' '}
                          {roundCurrency(
                            (Number(loanForm.principal) * modalPreviewProfile.monthlyInterestRate) / 100
                          ).toLocaleString()}{' '}
                          <span className="text-xs font-normal text-slate-400">/ completed month</span>
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Valuation / As-Of Date
                      </span>
                      <span className="text-xs font-bold text-emerald-400">
                        {reportingAsOfDate} ({modalPreviewProfile.completedPeriods} Completed Month{modalPreviewProfile.completedPeriods === 1 ? '' : 's'})
                      </span>
                    </div>
                  </div>

                  {/* Authoritative Calculated Figures (Exact Match to Register & DB) */}
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans font-bold">1. Principal</span>
                      <span className="font-extrabold text-white text-sm">
                        KES {Number(loanForm.principal || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5">
                      <span className="text-[10px] text-amber-300 block font-sans font-bold">
                        2. Accrued Interest ({modalPreviewProfile.completedPeriods}m)
                      </span>
                      <span className="font-extrabold text-amber-400 text-sm">
                        KES {modalPreviewProfile.totalInterestAccrued.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-sans mt-0.5">
                        {modalPreviewProfile.completedPeriods === 0
                          ? '0 completed months (new loan)'
                          : `${modalPreviewProfile.completedPeriods} × KES ${roundCurrency(
                              (Number(loanForm.principal) * modalPreviewProfile.monthlyInterestRate) / 100
                            ).toLocaleString()}`}
                      </span>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                      <span className="text-[10px] text-emerald-300 block font-sans font-bold">
                        3. Total Loan Payable
                      </span>
                      <span className="font-extrabold text-emerald-400 text-sm">
                        KES {modalPreviewProfile.totalLoanAmount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-sans mt-0.5">
                        Principal + Accrued
                      </span>
                    </div>
                  </div>

                  {/* Supplementary Full-Term Forecast */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                    <span className="font-medium">
                      Full-Term Estimate ({loanForm.durationMonths || 1} months at {modalPreviewProfile.monthlyInterestRate}% {loanForm.interestMethod}):
                    </span>
                    <span className="font-mono font-semibold text-slate-300">
                      Projected Interest: KES{' '}
                      {modalPreviewProfile.monthlyInterestRate === 0
                        ? '0'
                        : roundCurrency(
                            ((Number(loanForm.principal || 0) * modalPreviewProfile.monthlyInterestRate) / 100) *
                              Number(loanForm.durationMonths || 1)
                          ).toLocaleString()}{' '}
                      | Projected Maturity Total: KES{' '}
                      {modalPreviewProfile.monthlyInterestRate === 0
                        ? Number(loanForm.principal || 0).toLocaleString()
                        : roundCurrency(
                            Number(loanForm.principal || 0) +
                              ((Number(loanForm.principal || 0) * modalPreviewProfile.monthlyInterestRate) / 100) *
                                Number(loanForm.durationMonths || 1)
                          ).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDisburseModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLoan}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isSubmittingLoan
                    ? 'Saving to Database...'
                    : editingLoanId
                    ? 'Save Loan Changes'
                    : 'Confirm & Disburse Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: RECORD LOAN REPAYMENT FORM (Section 2.7)                     */}
      {/* ===================================================================== */}
      {isRepaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0F172A] border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-white">Record Loan Repayment</h3>
                <p className="text-xs text-slate-400">
                  Supports partial or full repayment with automatic interest & principal allocation
                </p>
              </div>
              <button
                onClick={() => setIsRepaymentModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold px-2.5 py-1 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            {repaymentError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{repaymentError}</span>
              </div>
            )}

            <form onSubmit={handleSaveRepayment} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">1. Member Name *</label>
                  <select
                    value={repaymentForm.memberName}
                    onChange={e => {
                      const mName = e.target.value;
                      const firstLoan = calculatedLoans.find(
                        l =>
                          l.memberName === mName &&
                          l.status !== 'Settled' &&
                          l.status !== 'Cancelled'
                      );
                      setRepaymentForm({
                        ...repaymentForm,
                        memberName: mName,
                        loanId: firstLoan ? firstLoan.id : repaymentForm.loanId,
                        amount: firstLoan ? String(firstLoan.totalOutstandingBalance) : repaymentForm.amount
                      });
                    }}
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold"
                  >
                    {members.map(m => (
                      <option key={m.id || m.fullName} value={m.fullName}>
                        {m.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">2. Loan ID *</label>
                  <select
                    value={repaymentForm.loanId}
                    onChange={e => {
                      const lId = e.target.value;
                      const found = calculatedLoans.find(l => l.id === lId);
                      setRepaymentForm({
                        ...repaymentForm,
                        loanId: lId,
                        memberName: found ? found.memberName : repaymentForm.memberName,
                        amount: found ? String(found.totalOutstandingBalance) : repaymentForm.amount
                      });
                    }}
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-emerald-400 font-extrabold"
                    required
                  >
                    <option value="">-- Select Loan --</option>
                    {calculatedLoans
                      .filter(
                        l =>
                          (l.status !== 'Settled' && l.status !== 'Cancelled') ||
                          l.id === repaymentForm.loanId
                      )
                      .map(l => (
                        <option key={l.id} value={l.id}>
                          {l.id} — {l.memberName} (Bal: KES {l.totalOutstandingBalance.toLocaleString()})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">3. Payment Date *</label>
                  <input
                    type="date"
                    value={repaymentForm.paymentDate}
                    onChange={e =>
                      setRepaymentForm({ ...repaymentForm, paymentDate: e.target.value })
                    }
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    4. Payment Amount (KES) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={repaymentForm.amount}
                    onChange={e => setRepaymentForm({ ...repaymentForm, amount: e.target.value })}
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-emerald-400 font-extrabold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">5. Payment Method</label>
                  <select
                    value={repaymentForm.paymentMethod}
                    onChange={e =>
                      setRepaymentForm({ ...repaymentForm, paymentMethod: e.target.value })
                    }
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                  >
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash Deposit</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    6. M-Pesa Transaction Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SK82910MPA"
                    value={repaymentForm.mpesaRef}
                    onChange={e => setRepaymentForm({ ...repaymentForm, mpesaRef: e.target.value })}
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-300 mb-1">
                    7. Bank Reference (if applicable)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EQB-9928310"
                    value={repaymentForm.bankRef}
                    onChange={e => setRepaymentForm({ ...repaymentForm, bankRef: e.target.value })}
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">8. Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Partial instalment / Full loan clearance"
                  value={repaymentForm.remarks}
                  onChange={e => setRepaymentForm({ ...repaymentForm, remarks: e.target.value })}
                  className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                />
              </div>

              {/* Allocation Preview Box */}
              <div className="bg-[#090F1D] border border-slate-800 rounded-xl p-4 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Automatic Allocation Preview (Interest-First Policy)
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Interest Allocated</span>
                    <span className="font-bold text-amber-400">
                      KES {repaymentAllocationPreview.interestAllocated.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Principal Allocated</span>
                    <span className="font-bold text-emerald-400">
                      KES {repaymentAllocationPreview.principalAllocated.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Remaining Balance</span>
                    <span className="font-extrabold text-white">
                      KES {repaymentAllocationPreview.remainingAfter.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRepaymentModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRepayment}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isSubmittingRepayment ? 'Recording...' : 'Confirm & Record Repayment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: CONFIRM LOAN DELETION / SAFE CANCELLATION                    */}
      {/* ===================================================================== */}
      {deleteLoanTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0F172A] border border-rose-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {(deleteLoanTarget.repayments && deleteLoanTarget.repayments.length > 0) ||
                    deleteLoanTarget.totalAmountPaid > 0
                      ? `Confirm Safe Cancellation of Loan ${deleteLoanTarget.id}`
                      : `Confirm Deletion of Loan ${deleteLoanTarget.id}`}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Please verify the loan reference, member, and balance before proceeding
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeleteLoanTarget(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {deleteLoanError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 font-semibold">
                {deleteLoanError}
              </div>
            )}

            <div className="bg-[#090F1D] border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Loan Reference:</span>
                <span className="font-extrabold text-emerald-400">
                  {deleteLoanTarget.id} ({deleteLoanTarget.approvalRef})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Member Name:</span>
                <span className="font-bold text-white">{deleteLoanTarget.memberName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Issue Date & Principal:</span>
                <span className="font-semibold text-slate-200">
                  {deleteLoanTarget.issueDate} • KES {deleteLoanTarget.originalPrincipal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Repaid to Date:</span>
                <span className="font-bold text-emerald-400">
                  KES {deleteLoanTarget.totalAmountPaid.toLocaleString()} (
                  {deleteLoanTarget.repayments?.length || 0} repayment record(s))
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400">Current Outstanding Amount:</span>
                <span className="font-extrabold text-amber-400">
                  KES {deleteLoanTarget.totalOutstandingBalance.toLocaleString()}
                </span>
              </div>
            </div>

            {((deleteLoanTarget.repayments && deleteLoanTarget.repayments.length > 0) ||
              deleteLoanTarget.totalAmountPaid > 0) ? (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
                <strong className="text-amber-300 block mb-1">
                  Audit Safeguard — Repayment History Detected:
                </strong>
                Because this loan has recorded repayments (KES{' '}
                {deleteLoanTarget.totalAmountPaid.toLocaleString()}), it will be{' '}
                <strong>safely cancelled (`Status = Cancelled`)</strong> rather than erased. All
                repayment records and audit logs will remain preserved in PostgreSQL, and the loan
                will be removed from active loan exposure and Dashboard totals.
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                This loan has <strong className="text-white">KES 0</strong> in repayments. Confirming
                will permanently remove this un-repaid loan facility from PostgreSQL and record the
                deletion in the Forensic Audit Log.
              </div>
            )}

            <div className="text-xs">
              <label className="block font-bold text-slate-300 mb-1">
                Reason for Cancellation / Deletion (Recorded in Audit Log)
              </label>
              <input
                type="text"
                value={deleteLoanReason}
                onChange={e => setDeleteLoanReason(e.target.value)}
                placeholder="e.g. Duplicate disbursement entry / Cancelled by board resolution"
                className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setDeleteLoanTarget(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
              >
                Keep Loan
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteLoan}
                disabled={isDeletingLoan}
                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-extrabold shadow-lg shadow-rose-500/20 disabled:opacity-50"
              >
                {isDeletingLoan
                  ? 'Processing...'
                  : (deleteLoanTarget.repayments && deleteLoanTarget.repayments.length > 0) ||
                    deleteLoanTarget.totalAmountPaid > 0
                  ? 'Confirm Safe Loan Cancellation'
                  : 'Confirm Loan Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: EDIT INDIVIDUAL LOAN REPAYMENT                               */}
      {/* ===================================================================== */}
      {editingRepaymentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0F172A] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Edit Repayment on Loan {editingRepaymentTarget.loanId}
                </h3>
                <p className="text-xs text-slate-400">{editingRepaymentTarget.memberName}</p>
              </div>
              <button
                onClick={() => setEditingRepaymentTarget(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedRepayment} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    value={editRepaymentForm.paymentDate}
                    onChange={e =>
                      setEditRepaymentForm({ ...editRepaymentForm, paymentDate: e.target.value })
                    }
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Amount (KES) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={editRepaymentForm.amount}
                    onChange={e =>
                      setEditRepaymentForm({ ...editRepaymentForm, amount: e.target.value })
                    }
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-extrabold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Payment Method</label>
                <select
                  value={editRepaymentForm.paymentMethod}
                  onChange={e =>
                    setEditRepaymentForm({ ...editRepaymentForm, paymentMethod: e.target.value })
                  }
                  className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash Deposit</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">M-Pesa Ref</label>
                  <input
                    type="text"
                    value={editRepaymentForm.mpesaRef}
                    onChange={e =>
                      setEditRepaymentForm({ ...editRepaymentForm, mpesaRef: e.target.value })
                    }
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Bank Ref</label>
                  <input
                    type="text"
                    value={editRepaymentForm.bankRef}
                    onChange={e =>
                      setEditRepaymentForm({ ...editRepaymentForm, bankRef: e.target.value })
                    }
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Remarks</label>
                <input
                  type="text"
                  value={editRepaymentForm.remarks}
                  onChange={e =>
                    setEditRepaymentForm({ ...editRepaymentForm, remarks: e.target.value })
                  }
                  className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-amber-300 mb-1">
                  Reason for Correction (Audit Log)
                </label>
                <input
                  type="text"
                  value={editRepaymentForm.editReason}
                  onChange={e =>
                    setEditRepaymentForm({ ...editRepaymentForm, editReason: e.target.value })
                  }
                  placeholder="e.g. Updated payment date / reference"
                  className="w-full bg-[#070D18] border border-amber-500/40 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingRepaymentTarget(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingRepaymentEdit}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold disabled:opacity-50"
                >
                  {isSavingRepaymentEdit ? 'Saving...' : 'Save Repayment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 5: CONFIRM REPAYMENT REVERSAL                                   */}
      {/* ===================================================================== */}
      {reverseRepaymentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0F172A] border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-extrabold text-white">
                  Confirm Repayment Reversal
                </h3>
              </div>
              <button
                onClick={() => setReverseRepaymentTarget(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#090F1D] border border-slate-800 rounded-xl p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Loan Reference:</span>
                <span className="font-extrabold text-emerald-400">
                  {reverseRepaymentTarget.loanId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Member:</span>
                <span className="font-bold text-white">{reverseRepaymentTarget.memberName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Repayment Amount:</span>
                <span className="font-extrabold text-amber-400">
                  KES {Number(reverseRepaymentTarget.amount || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Date:</span>
                <span className="text-slate-200">
                  {reverseRepaymentTarget.paymentDate || reverseRepaymentTarget.paymentDateStr}
                </span>
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-bold text-slate-300 mb-1">
                Reason for Reversing Repayment
              </label>
              <input
                type="text"
                value={reverseRepaymentReason}
                onChange={e => setReverseRepaymentReason(e.target.value)}
                placeholder="e.g. Duplicate repayment entry reversal"
                className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setReverseRepaymentTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
              >
                Keep Repayment
              </button>
              <button
                type="button"
                onClick={handleConfirmReverseRepayment}
                disabled={isReversingRepayment}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-extrabold disabled:opacity-50"
              >
                {isReversingRepayment ? 'Reversing...' : 'Confirm Reversal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

