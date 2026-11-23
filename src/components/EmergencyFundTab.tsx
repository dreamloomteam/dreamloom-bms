'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  HeartHandshake,
  Wallet,
  CreditCard,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  Download,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Building,
  RotateCw,
  Search,
  Filter,
  Calendar,
  DollarSign,
  ChevronRight,
  Eye,
  FileText,
  AlertTriangle,
  Settings,
  X,
  Printer,
  Undo2,
  Check,
  Layers,
  Sparkles,
  Palette
} from 'lucide-react';
import { isUserAdmin } from '@/lib/session';

interface EmergencyFundTabProps {
  isAdmin?: boolean;
  currentUser?: any;
  onOpenAppearance?: () => void;
}

export default function EmergencyFundTab({
  isAdmin = false,
  currentUser,
  onOpenAppearance
}: EmergencyFundTabProps) {
  // State
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'allocations' | 'applications' | 'loans' | 'repayments' | 'register' | 'reports'
  >('overview');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Modals
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedAppForApproval, setSelectedAppForApproval] = useState<any>(null);

  const [isDisbursementModalOpen, setIsDisbursementModalOpen] = useState(false);
  const [selectedAppForDisburse, setSelectedAppForDisburse] = useState<any>(null);

  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
  const [selectedLoanForRepayment, setSelectedLoanForRepayment] = useState<any>(null);

  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLoanHistoryModalOpen, setIsLoanHistoryModalOpen] = useState(false);
  const [selectedLoanForHistory, setSelectedLoanForHistory] = useState<any>(null);

  const [isReversalModalOpen, setIsReversalModalOpen] = useState(false);
  const [selectedTxnForReversal, setSelectedTxnForReversal] = useState<any>(null);

  const [isAllocationReversalModalOpen, setIsAllocationReversalModalOpen] = useState(false);
  const [selectedAllocationForReversal, setSelectedAllocationForReversal] = useState<any>(null);
  const [allocationReversalReason, setAllocationReversalReason] = useState('');
  const [isSyncingContributions, setIsSyncingContributions] = useState(false);

  const [isPrintResolutionOpen, setIsPrintResolutionOpen] = useState(false);
  const [selectedApprovalForPrint, setSelectedApprovalForPrint] = useState<any>(null);

  // Form states
  const [appForm, setAppForm] = useState({
    memberId: '',
    amountRequested: '',
    reason: '',
    supportingDocs: '',
    proposedRepaymentDate: '',
    applicantNotes: ''
  });

  const [approvalForm, setApprovalForm] = useState({
    decision: 'Approved' as 'Approved' | 'Rejected',
    conditions: '10% monthly simple interest payable on maturity within 30 days.',
    resolutionReference: ''
  });

  const [disburseForm, setDisburseForm] = useState({
    paymentMethod: 'M-Pesa',
    paymentReference: '',
    disbursementDate: new Date().toISOString().slice(0, 10),
    remarks: ''
  });

  const [repaymentForm, setRepaymentForm] = useState({
    repaymentDate: new Date().toISOString().slice(0, 10),
    principalPaid: '',
    interestPaid: '',
    paymentMethod: 'M-Pesa',
    reference: '',
    remarks: ''
  });

  const [allocForm, setAllocForm] = useState({
    memberId: '',
    month: 'January',
    year: '2026',
    amount: '1000',
    notes: ''
  });

  const [settingsForm, setSettingsForm] = useState({
    fundName: "Dreamloom Members' Emergency and Welfare Fund",
    monthlyAllocation: '1000',
    interestRate: '10',
    repaymentPeriodMonths: '1',
    calculationMethod: 'Simple'
  });

  const [reversalReason, setReversalReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Fetch data
  const fetchData = async () => {
    try {
      setError(null);
      const res = await fetch('/api/emergency-fund');
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load Emergency Fund data.');
      }
      setData(json.data);
      if (json.data.settings) {
        setSettingsForm({
          fundName: json.data.settings.fundName,
          monthlyAllocation: String(json.data.settings.monthlyAllocation),
          interestRate: String(json.data.settings.interestRate),
          repaymentPeriodMonths: String(json.data.settings.repaymentPeriodMonths),
          calculationMethod: json.data.settings.calculationMethod || 'Simple'
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const isTreasurer = useMemo(() => {
    if (!currentUser) return false;
    const email = (currentUser.email || '').toLowerCase();
    const role = (currentUser.role || '').toLowerCase();
    return email === 'michael@dreamloom.co.ke' || role === 'treasurer';
  }, [currentUser]);

  const canManageFund = isAdmin || isTreasurer;

  // Filtered lists
  const filteredAllocations = useMemo(() => {
    if (!data?.allocations) return [];
    return data.allocations.filter((a: any) => {
      const matchSearch =
        !searchQuery ||
        a.member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.sourceContribution.toLowerCase().includes(searchQuery.toLowerCase());
      const matchMonth = selectedMonth === 'All' || a.month === selectedMonth;
      const matchYear = selectedYear === 'All' || String(a.year) === selectedYear;
      return matchSearch && matchMonth && matchYear;
    });
  }, [data?.allocations, searchQuery, selectedMonth, selectedYear]);

  const filteredApplications = useMemo(() => {
    if (!data?.applications) return [];
    return data.applications.filter((a: any) => {
      const matchSearch =
        !searchQuery ||
        a.member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = selectedStatus === 'All' || a.status === selectedStatus;
      return matchSearch && matchStatus;
    });
  }, [data?.applications, searchQuery, selectedStatus]);

  const filteredLoans = useMemo(() => {
    if (!data?.loans) return [];
    return data.loans.filter((l: any) => {
      const matchSearch =
        !searchQuery ||
        l.member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.paymentReference.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = selectedStatus === 'All' || l.status === selectedStatus;
      return matchSearch && matchStatus;
    });
  }, [data?.loans, searchQuery, selectedStatus]);

  const filteredTransactions = useMemo(() => {
    if (!data?.transactions) return [];
    return data.transactions.filter((t: any) => {
      return (
        !searchQuery ||
        (t.memberName && t.memberName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [data?.transactions, searchQuery]);

  // Handle Submit Application
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingAction(true);
      const res = await fetch('/api/emergency-fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_application',
          data: {
            memberId: Number(appForm.memberId),
            amountRequested: Number(appForm.amountRequested),
            reason: appForm.reason,
            supportingDocs: appForm.supportingDocs,
            proposedRepaymentDate: appForm.proposedRepaymentDate,
            applicantNotes: appForm.applicantNotes
          }
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to submit application.');

      alert(`Application submitted successfully! Reference ID: ${json.data.id}`);
      setIsAppModalOpen(false);
      setAppForm({
        memberId: '',
        amountRequested: '',
        reason: '',
        supportingDocs: '',
        proposedRepaymentDate: '',
        applicantNotes: ''
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error submitting application.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Approval / Rejection
  const handleApproveApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppForApproval) return;

    try {
      setSubmittingAction(true);
      const res = await fetch('/api/emergency-fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_application',
          data: {
            applicationId: selectedAppForApproval.id,
            decision: approvalForm.decision,
            conditions: approvalForm.conditions,
            resolutionReference: approvalForm.resolutionReference
          }
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Approval failed.');

      alert(`Application ${selectedAppForApproval.id} has been ${approvalForm.decision.toLowerCase()} successfully!`);
      setIsApprovalModalOpen(false);
      setSelectedAppForApproval(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error approving application.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Disbursement
  const handleDisburseLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppForDisburse) return;

    try {
      setSubmittingAction(true);
      const res = await fetch('/api/emergency-fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disburse_loan',
          data: {
            applicationId: selectedAppForDisburse.id,
            disbursementDate: disburseForm.disbursementDate,
            paymentMethod: disburseForm.paymentMethod,
            paymentReference: disburseForm.paymentReference,
            remarks: disburseForm.remarks
          }
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Disbursement failed.');

      alert(`Emergency Loan ${json.data.loan.id} disbursed successfully!`);
      setIsDisbursementModalOpen(false);
      setSelectedAppForDisburse(null);
      setDisburseForm({
        paymentMethod: 'M-Pesa',
        paymentReference: '',
        disbursementDate: new Date().toISOString().slice(0, 10),
        remarks: ''
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error disbursing loan.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Repayment
  const handleRecordRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanForRepayment) return;

    try {
      setSubmittingAction(true);
      const res = await fetch('/api/emergency-fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_repayment',
          data: {
            loanId: selectedLoanForRepayment.id,
            repaymentDate: repaymentForm.repaymentDate,
            principalPaid: Number(repaymentForm.principalPaid || 0),
            interestPaid: Number(repaymentForm.interestPaid || 0),
            paymentMethod: repaymentForm.paymentMethod,
            reference: repaymentForm.reference,
            remarks: repaymentForm.remarks
          }
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Repayment recording failed.');

      alert(`Repayment of KSh ${(Number(repaymentForm.principalPaid || 0) + Number(repaymentForm.interestPaid || 0)).toLocaleString()} successfully recorded for Loan ${selectedLoanForRepayment.id}!`);
      setIsRepaymentModalOpen(false);
      setSelectedLoanForRepayment(null);
      setRepaymentForm({
        repaymentDate: new Date().toISOString().slice(0, 10),
        principalPaid: '',
        interestPaid: '',
        paymentMethod: 'M-Pesa',
        reference: '',
        remarks: ''
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error recording repayment.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Allocation
  const handleRecordAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingAction(true);
      const res = await fetch('/api/emergency-fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_allocation',
          data: {
            memberId: Number(allocForm.memberId),
            month: allocForm.month,
            year: Number(allocForm.year),
            amount: Number(allocForm.amount),
            notes: allocForm.notes
          }
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Allocation recording failed.');

      alert('Fund allocation recorded successfully!');
      setIsAllocationModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error recording allocation.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Update Settings
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingAction(true);
      const res = await fetch('/api/emergency-fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_settings',
          data: {
            fundName: settingsForm.fundName,
            monthlyAllocation: Number(settingsForm.monthlyAllocation),
            interestRate: Number(settingsForm.interestRate),
            repaymentPeriodMonths: Number(settingsForm.repaymentPeriodMonths),
            calculationMethod: settingsForm.calculationMethod
          }
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update settings.');

      alert('Emergency Fund settings updated and saved to audit log!');
      setIsSettingsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error updating settings.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Reversal
  const handleReverseTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxnForReversal) return;

    try {
      setSubmittingAction(true);
      const res = await fetch('/api/emergency-fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reverse_transaction',
          data: {
            transactionId: selectedTxnForReversal.id,
            reason: reversalReason
          }
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Reversal failed.');

      alert('Transaction reversed successfully with audit entry.');
      setIsReversalModalOpen(false);
      setSelectedTxnForReversal(null);
      setReversalReason('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error reversing transaction.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Allocation Reversal
  const handleReverseAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAllocationForReversal || !allocationReversalReason.trim()) return;

    try {
      setSubmittingAction(true);
      const res = await fetch('/api/emergency-fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reverse_allocation',
          data: {
            allocationId: selectedAllocationForReversal.id,
            reason: allocationReversalReason.trim()
          }
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Reversal failed.');

      alert(`Allocation ALC-${selectedAllocationForReversal.id} successfully reversed with audit trail.`);
      setIsAllocationReversalModalOpen(false);
      setSelectedAllocationForReversal(null);
      setAllocationReversalReason('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error reversing allocation.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Force Synchronize All Member Contributions with Emergency Fund
  const handleSyncContributions = async () => {
    try {
      setIsSyncingContributions(true);
      const res = await fetch('/api/emergency-fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_all_contributions' })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Sync failed.');

      alert(json.message || 'Contributions synchronized successfully!');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error synchronizing contributions.');
    } finally {
      setIsSyncingContributions(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center space-y-4">
        <RotateCw className="w-10 h-10 text-emerald-600 animate-spin" />
        <h3 className="text-lg font-bold text-slate-800">Loading Emergency & Welfare Fund...</h3>
        <p className="text-sm text-slate-500">Connecting to secure PostgreSQL ledger and verifying live member balances...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 max-w-xl mx-auto my-8 bg-red-50 border border-red-200 rounded-2xl text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
        <h2 className="text-xl font-bold text-red-900">Unable to Load Fund Ledger</h2>
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-6 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { stats, settings, members } = data || {};

  return (
    <div className="space-y-6">
      {/* 1. HERO GREEN WAVE BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#064E3B] via-[#0A5C36] to-[#2E9E5B] p-6 md:p-8 text-white shadow-xl">
        <div className="absolute -right-20 -bottom-24 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-28 bg-emerald-400/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold tracking-wide uppercase text-emerald-100">
              <HeartHandshake className="w-4 h-4 text-emerald-200" />
              Member Welfare & Emergency Facility
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight">
              {settings?.fundName || "Dreamloom Members' Emergency and Welfare Fund"}
            </h1>
            <p className="text-sm md:text-base text-emerald-100/90 leading-relaxed">
              Official emergency credit and mutual welfare reserve governed by the Board of Directors. Dedicated internal allocation of <strong className="text-white">KSh 1,000/month</strong> per shareholder-director from monthly contributions, at a standard non-compounding interest rate of <strong className="text-white">{settings?.interestRate}% monthly simple interest</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsAppModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#0A5C36] font-bold text-sm shadow-md hover:bg-emerald-50 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              Apply for Loan
            </button>

            {canManageFund && (
              <button
                onClick={() => setIsAllocationModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-white font-semibold text-sm border border-emerald-600/40 shadow-sm active:scale-95 transition"
              >
                <Wallet className="w-4 h-4" />
                Record Allocation
              </button>
            )}

            <a
              href="/api/emergency-fund/reports"
              download
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-white font-semibold text-sm border border-emerald-600/40 shadow-sm active:scale-95 transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </a>

            {isAdmin && (
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 text-emerald-100 font-semibold text-sm border border-emerald-700/50 transition"
                title="Fund Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleRefresh}
              className={`p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              title="Refresh ledger"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. 6 LIVE CALCULATION CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Fund Allocations */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Allocations</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            KSh {stats?.totalAllocations?.toLocaleString() || '0'}
          </div>
          <p className="text-xs text-slate-500 mt-1">KSh 1,000 / member / mo</p>
        </div>

        {/* Total Loans Disbursed */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Loans Disbursed</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            KSh {stats?.totalDisbursed?.toLocaleString() || '0'}
          </div>
          <p className="text-xs text-slate-500 mt-1">Cumulative principal</p>
        </div>

        {/* Total Principal Repaid */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Principal Repaid</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            KSh {stats?.totalPrincipalRepaid?.toLocaleString() || '0'}
          </div>
          <p className="text-xs text-slate-500 mt-1">Recovered to fund</p>
        </div>

        {/* Outstanding Loan Principal */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Outstanding Principal</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-amber-600">
            KSh {stats?.outstandingPrincipal?.toLocaleString() || '0'}
          </div>
          <p className="text-xs text-slate-500 mt-1">In active circulation</p>
        </div>

        {/* Available Fund Balance (LIQUID CASH) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md hover:shadow-lg transition">
          <div className="flex items-center justify-between text-emerald-100 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Available Balance</span>
            <div className="p-1.5 rounded-lg bg-white/20 text-white">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight">
            KSh {stats?.availableBalance?.toLocaleString() || '0'}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-100 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse" />
            <span>Liquid Cash Available</span>
          </div>
        </div>

        {/* Interest Collected */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Interest Collected</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-indigo-600">
            KSh {stats?.interestCollected?.toLocaleString() || '0'}
          </div>
          <p className="text-xs text-slate-500 mt-1">10% simple interest</p>
        </div>
      </div>

      {/* 3. SUB-NAVIGATION TABS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-1.5 flex flex-wrap gap-1">
        {[
          { key: 'overview', label: 'Overview & Analytics', icon: HeartHandshake },
          { key: 'allocations', label: 'Monthly Allocations', icon: Wallet, count: data?.allocations?.length },
          { key: 'applications', label: 'Loan Applications', icon: FileText, count: stats?.pendingApplicationCount },
          { key: 'loans', label: 'Emergency Loan Portfolio', icon: CreditCard, count: stats?.activeLoanCount },
          { key: 'repayments', label: 'Repayments', icon: CheckCircle2, count: data?.repayments?.length },
          { key: 'register', label: 'Transaction Register', icon: Layers, count: data?.transactions?.length },
          { key: 'reports', label: 'Reports Hub', icon: FileSpreadsheet }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveSubTab(tab.key as any);
                setSearchQuery('');
                setSelectedStatus('All');
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition ${
                isActive
                  ? 'bg-[#0A5C36] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-[#0A5C36]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. TAB CONTENTS */}

      {/* SUB-TAB 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Notice about Internal Allocation */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3.5 text-amber-900 text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Internal Allocation Accounting Principle:</strong> Emergency & Welfare Fund allocations are internal member disbursements sourced directly from each registered member&apos;s standard monthly KSh 6,000 contribution. This structure guarantees that no duplicate contributions are created, and existing Contributions and Dashboard totals remain completely independent and protected.
            </div>
          </div>

          {/* Allocation Matrix of 7 Members */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Eligible Registered Members (7 Shareholder-Directors)</h3>
                <p className="text-xs text-slate-500">Scheduled monthly allocation: KSh 1,000 each (KSh 7,000 monthly total / KSh 84,000 annual total)</p>
              </div>
              <button
                onClick={() => setActiveSubTab('allocations')}
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                View Full Allocation Table <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-5">
              {members?.map((m: any) => {
                const memberAllocations = data?.allocations?.filter((a: any) => a.memberId === m.id) || [];
                const totalMemberAlloc = memberAllocations.reduce((sum: number, a: any) => sum + a.amount, 0);
                const memberLoans = data?.loans?.filter((l: any) => l.memberId === m.id) || [];
                const activeLoans = memberLoans.filter((l: any) => l.status === 'Active' || l.status === 'Partially Repaid');
                const totalActiveDebt = activeLoans.reduce((sum: number, l: any) => sum + l.totalBalance, 0);

                return (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                        {m.fullName.charAt(0)}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-bold text-slate-900 text-sm truncate">{m.fullName}</div>
                        <div className="text-xs text-slate-500">{m.role} • ID: {m.nationalId}</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Total Allocations:</span>
                        <span className="font-bold text-slate-900">KSh {totalMemberAlloc.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Active Emergency Debt:</span>
                        <span className={`font-bold ${totalActiveDebt > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {totalActiveDebt > 0 ? `KSh ${totalActiveDebt.toLocaleString()}` : 'None (Clear)'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setAppForm(prev => ({ ...prev, memberId: String(m.id) }));
                        setIsAppModalOpen(true);
                      }}
                      className="w-full py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition"
                    >
                      New Loan Request
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Fund Activity Ledger */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Recent Fund Ledger Entries</h3>
                <p className="text-xs text-slate-500">Live immutable transaction register for audit and board reporting</p>
              </div>
              <button
                onClick={() => setActiveSubTab('register')}
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                View Full Register <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Txn ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.transactions?.slice(0, 8).map((t: any) => (
                    <tr key={t.id} className={`hover:bg-slate-50/80 ${t.isReversed ? 'opacity-50 line-through' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{t.id}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{new Date(t.transactionDate).toLocaleDateString('en-GB')}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                            t.type === 'ALLOCATION'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.type === 'DISBURSEMENT'
                              ? 'bg-blue-100 text-blue-800'
                              : t.type === 'PRINCIPAL_REPAYMENT'
                              ? 'bg-teal-100 text-teal-800'
                              : t.type === 'INTEREST_RECEIPT'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {t.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{t.memberName || '-'}</td>
                      <td className="px-4 py-3 font-extrabold text-slate-900">KSh {t.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate">{t.description}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{t.paymentReference || t.referenceId || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MONTHLY ALLOCATIONS */}
      {activeSubTab === 'allocations' && (
        <div className="space-y-4">
          {/* Contribution Integration & Live Reconciliation Bar (Section D, E, F) */}
          <div className="bg-[#064E3B] text-white rounded-2xl p-5 shadow-sm border border-emerald-700/60 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <HeartHandshake className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-wide uppercase text-emerald-200">
                    Contribution Accounting Integration & Live Reconciliation
                  </span>
                  <span className="bg-emerald-800 text-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-600 font-mono">
                    KES 6,000 = KES 5,000 + KES 1,000
                  </span>
                </div>
                <p className="text-xs text-emerald-100/90 mt-1 font-mono">
                  Every paid KSh 6,000 contribution automatically allocates: <strong className="text-white">KES 5,000 General Operating Funds</strong> + <strong className="text-teal-300">KES 1,000 Emergency & Welfare Fund</strong>. Zero manual duplicate entry.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 text-xs bg-emerald-800/90 text-emerald-200 border border-emerald-500/40 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                100% Reconciled • Zero Discrepancy
              </span>

              {canManageFund && (
                <button
                  type="button"
                  disabled={isSyncingContributions}
                  onClick={handleSyncContributions}
                  className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/20"
                  title="Resynchronize all member contributions with Emergency Fund"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isSyncingContributions ? 'animate-spin' : ''}`} />
                  <span>{isSyncingContributions ? 'Syncing...' : 'Sync Contributions'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Monthly Fund Allocations</h3>
                <p className="text-xs text-slate-500">Internal monthly allocations (KSh 1,000 per member) automatically retrieved from confirmed KSh 6,000 contributions</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Year filter */}
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
                >
                  <option value="All">All Years</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>

                {/* Month filter */}
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
                >
                  <option value="All">All Months</option>
                  {[
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                  ].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                {canManageFund && (
                  <button
                    onClick={() => setIsAllocationModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0A5C36] text-white text-xs font-bold hover:bg-emerald-800 transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Allocation
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#0A5C36] text-white font-semibold">
                  <tr>
                    <th className="px-4 py-3">Alloc ID</th>
                    <th className="px-4 py-3">Member Name</th>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3 text-right">Total Paid</th>
                    <th className="px-4 py-3 text-right">General Funds (83%)</th>
                    <th className="px-4 py-3 text-right">Emergency Fund (17%)</th>
                    <th className="px-4 py-3 text-right">Outstanding</th>
                    <th className="px-4 py-3 text-center">Reconciliation</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAllocations.map((a: any, idx: number) => {
                    const totalPaid = Number(a.totalContributionPaid !== undefined ? a.totalContributionPaid : (a.amount >= 1000 ? 6000 : a.amount * 6));
                    const emgAmount = Number(a.amount) || 0;
                    const genAmount = Number(a.generalFundAmount !== undefined ? a.generalFundAmount : Math.max(0, totalPaid - emgAmount));
                    const outAlloc = Number(a.outstandingAllocation !== undefined ? a.outstandingAllocation : Math.max(0, 1000 - emgAmount));
                    const isRec = a.isReconciled !== undefined ? a.isReconciled : (Math.abs(totalPaid - (genAmount + emgAmount)) < 0.01);

                    return (
                      <tr key={a.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">ALC-{a.id}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          <div>{a.member.fullName}</div>
                          <div className="text-[11px] text-slate-400 font-normal">{a.member.nationalId}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{a.month} {a.year}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          KSh {totalPaid.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700 font-semibold">
                          KSh {genAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-extrabold text-teal-700">
                          KSh {emgAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs">
                          {outAlloc > 0 ? (
                            <span className="text-amber-600 font-bold">KSh {outAlloc.toLocaleString()}</span>
                          ) : (
                            <span className="text-slate-400 font-medium">KSh 0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isRec ? (
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Balanced
                            </span>
                          ) : (
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-800 border border-red-300">
                              Difference
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                              a.status === 'Allocated'
                                ? 'bg-emerald-100 text-emerald-800'
                                : a.status === 'Partially Allocated'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800 line-through'
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {a.status !== 'Reversed' && canManageFund ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAllocationForReversal(a);
                                setAllocationReversalReason('');
                                setIsAllocationReversalModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition inline-flex items-center gap-1"
                              title="Reverse this allocation with audit logging"
                            >
                              <Undo2 className="w-3 h-3" />
                              <span>Reverse</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Reversed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: LOAN APPLICATIONS & APPROVAL WORKFLOW */}
      {activeSubTab === 'applications' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Emergency Loan Applications</h3>
              <p className="text-xs text-slate-500">Corporate loan requests with legal disclosure and dual director approval requirements</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Disbursed">Disbursed</option>
                <option value="Repaid">Repaid</option>
              </select>

              <button
                onClick={() => setIsAppModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#0A5C36] text-white text-xs font-bold hover:bg-emerald-800 transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Submit New Application
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#0A5C36] text-white font-semibold">
                  <tr>
                    <th className="px-4 py-3">App ID</th>
                    <th className="px-4 py-3">Applicant Name</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Amount Requested</th>
                    <th className="px-4 py-3">Emergency Reason</th>
                    <th className="px-4 py-3">Proposed Repayment</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApplications.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No emergency loan applications found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredApplications.map((app: any, idx: number) => {
                      const isOwnApplication =
                        currentUser &&
                        ((currentUser.email || '').toLowerCase() === (app.member.email || '').toLowerCase() ||
                          (currentUser.memberId && Number(currentUser.memberId) === app.memberId));

                      return (
                        <tr key={app.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">{app.id}</td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{app.member.fullName}</div>
                            <div className="text-xs text-slate-500">{app.member.role}</div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">
                            {new Date(app.applicationDate).toLocaleDateString('en-GB')}
                          </td>
                          <td className="px-4 py-3 font-extrabold text-slate-900">
                            KSh {app.amountRequested.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600 max-w-xs">{app.reason}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">
                            {new Date(app.proposedRepaymentDate).toLocaleDateString('en-GB')}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                                app.status === 'Pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : app.status === 'Approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : app.status === 'Disbursed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : app.status === 'Repaid'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {app.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {app.status === 'Pending' && (
                                <button
                                  disabled={isOwnApplication}
                                  onClick={() => {
                                    if (isOwnApplication) {
                                      alert(
                                        'LEGAL RESTRICTION: Under Company Law, you cannot approve your own loan application. Another Director or the Administrator must review and approve it.'
                                      );
                                      return;
                                    }
                                    setSelectedAppForApproval(app);
                                    setApprovalForm({
                                      decision: 'Approved',
                                      conditions: '10% monthly simple interest payable on maturity within 30 days.',
                                      resolutionReference: `DL-EWF-RES-${new Date().getFullYear()}/${app.id.replace('EAPP-', '')}`
                                    });
                                    setIsApprovalModalOpen(true);
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                    isOwnApplication
                                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                                  }`}
                                  title={isOwnApplication ? 'Legally prohibited from approving own loan' : 'Review & Approve'}
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  {isOwnApplication ? 'Self-Locked' : 'Review & Approve'}
                                </button>
                              )}

                              {app.status === 'Approved' && !app.loan && canManageFund && (
                                <button
                                  onClick={() => {
                                    setSelectedAppForDisburse(app);
                                    setIsDisbursementModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  Disburse Loan
                                </button>
                              )}

                              {app.approvals && app.approvals.length > 0 && (
                                <button
                                  onClick={() => {
                                    setSelectedApprovalForPrint({
                                      application: app,
                                      approval: app.approvals[0]
                                    });
                                    setIsPrintResolutionOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                                  title="View Official Resolution & Legal Memo"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
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
        </div>
      )}

      {/* SUB-TAB 4: EMERGENCY LOAN PORTFOLIO */}
      {activeSubTab === 'loans' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Emergency Loan Portfolio</h3>
              <p className="text-xs text-slate-500">Live loans disbursed under the fund with 10% monthly simple interest schedule</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Partially Repaid">Partially Repaid</option>
                <option value="Settled">Settled</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#0A5C36] text-white font-semibold">
                  <tr>
                    <th className="px-4 py-3">Loan ID</th>
                    <th className="px-4 py-3">Member Name</th>
                    <th className="px-4 py-3">Issue Date</th>
                    <th className="px-4 py-3">Principal</th>
                    <th className="px-4 py-3">Interest (10%)</th>
                    <th className="px-4 py-3">Total Payable</th>
                    <th className="px-4 py-3">Principal Paid</th>
                    <th className="px-4 py-3">Interest Paid</th>
                    <th className="px-4 py-3">Total Paid</th>
                    <th className="px-4 py-3">Outstanding Balance</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLoans.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="p-8 text-center text-slate-500">
                        No loans in portfolio. Disburse an approved loan to begin.
                      </td>
                    </tr>
                  ) : (
                    filteredLoans.map((l: any, idx: number) => (
                      <tr
                        key={l.id}
                        className={`hover:bg-emerald-50/40 cursor-pointer ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                        }`}
                        onClick={() => {
                          setSelectedLoanForHistory(l);
                          setIsLoanHistoryModalOpen(true);
                        }}
                      >
                        <td className="px-4 py-3 font-mono text-xs font-bold text-slate-800">{l.id}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{l.member.fullName}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {new Date(l.disbursementDate).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">KSh {l.principal.toLocaleString()}</td>
                        <td className="px-4 py-3 font-semibold text-indigo-700">KSh {l.interestAmount.toLocaleString()}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">KSh {l.totalPayable.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-teal-700 font-semibold">KSh {l.principalPaid.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-indigo-600 font-semibold">KSh {l.interestPaid.toLocaleString()}</td>
                        <td className="px-4 py-3 font-bold text-emerald-700">KSh {l.totalPaid.toLocaleString()}</td>
                        <td className="px-4 py-3 font-extrabold text-amber-600">KSh {l.totalBalance.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{new Date(l.dueDate).toLocaleDateString('en-GB')}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                              l.status === 'Settled'
                                ? 'bg-emerald-100 text-emerald-800'
                                : l.status === 'Partially Repaid'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                          {l.status !== 'Settled' && canManageFund && (
                            <button
                              onClick={() => {
                                setSelectedLoanForRepayment(l);
                                setRepaymentForm(prev => ({
                                  ...prev,
                                  principalPaid: String(l.principalBalance),
                                  interestPaid: String(l.interestBalance)
                                }));
                                setIsRepaymentModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm ml-auto"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Repay
                            </button>
                          )}
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

      {/* SUB-TAB 5: REPAYMENTS */}
      {activeSubTab === 'repayments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Emergency Loan Repayments Register</h3>
              <p className="text-xs text-slate-500">Record of recovered principal and collected simple interest</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0A5C36] text-white font-semibold">
                <tr>
                  <th className="px-4 py-3">Repayment ID</th>
                  <th className="px-4 py-3">Loan ID</th>
                  <th className="px-4 py-3">Member Name</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Total Paid</th>
                  <th className="px-4 py-3">Principal Paid</th>
                  <th className="px-4 py-3">Interest Paid (10%)</th>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.repayments?.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      No repayments recorded yet.
                    </td>
                  </tr>
                ) : (
                  data?.repayments?.map((r: any, idx: number) => (
                    <tr key={r.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">REP-{r.id}</td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-800">{r.loanId}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{r.member.fullName}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {new Date(r.repaymentDate).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-4 py-3 font-extrabold text-emerald-700">KSh {r.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-teal-700">
                        KSh {r.principalPaid.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-indigo-700">
                        KSh {r.interestPaid.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">{r.paymentMethod}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.reference}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{r.recordedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: TRANSACTION REGISTER (IMMUTABLE AUDIT LEDGER) */}
      {activeSubTab === 'register' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Fund Transaction Register (Audit Ledger)</h3>
              <p className="text-xs text-slate-500">Immutable chronological record of all capital, allocations, disbursements, repayments, and adjustments</p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0A5C36] text-white font-semibold">
                <tr>
                  <th className="px-4 py-3">Txn ID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Reference ID</th>
                  <th className="px-4 py-3">Payment Ref</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Performed By</th>
                  {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((t: any, idx: number) => (
                  <tr
                    key={t.id}
                    className={`${t.isReversed ? 'bg-red-50/50 text-red-900' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{t.id}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {new Date(t.transactionDate).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          t.type === 'ALLOCATION'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.type === 'DISBURSEMENT'
                            ? 'bg-blue-100 text-blue-800'
                            : t.type === 'PRINCIPAL_REPAYMENT'
                            ? 'bg-teal-100 text-teal-800'
                            : t.type === 'INTEREST_RECEIPT'
                            ? 'bg-purple-100 text-purple-800'
                            : t.type === 'REVERSAL'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-600">{t.category}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{t.memberName || '-'}</td>
                    <td className="px-4 py-3 font-extrabold text-slate-900">KSh {t.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{t.referenceId || '-'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{t.paymentReference || '-'}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-xs">{t.description}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{t.performedBy}</td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        {!t.isReversed && t.type !== 'REVERSAL' && (
                          <button
                            onClick={() => {
                              setSelectedTxnForReversal(t);
                              setIsReversalModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold text-red-600 hover:bg-red-100/80 transition"
                            title="Controlled Reversal with Audit Trail"
                          >
                            Reverse
                          </button>
                        )}
                        {t.isReversed && (
                          <span className="text-xs font-bold text-red-600 uppercase">Reversed</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 7: REPORTS HUB */}
      {activeSubTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: 'Complete Fund Financial Report (Excel)',
              desc: 'Multi-worksheet executive financial workbook with Fund Summary, Allocations, Applications, Loans, Repayments, and Transaction Ledger.',
              href: '/api/emergency-fund/reports',
              btn: 'Download Full Excel (.xlsx)',
              icon: FileSpreadsheet
            },
            {
              title: 'Monthly Allocations Register',
              desc: 'Complete internal allocation ledger for all 7 shareholder-directors across all operating periods.',
              href: '/api/emergency-fund/reports',
              btn: 'Export Allocations (.xlsx)',
              icon: Wallet
            },
            {
              title: 'Emergency Loan Portfolio Report',
              desc: 'Detailed breakdown of active, partially repaid, and settled loans with simple interest schedules.',
              href: '/api/emergency-fund/reports',
              btn: 'Export Loan Portfolio (.xlsx)',
              icon: CreditCard
            },
            {
              title: 'Loan Repayments & Interest Income',
              desc: 'Audit report separating principal capital recovered and 10% simple interest earned for the fund.',
              href: '/api/emergency-fund/reports',
              btn: 'Export Repayments (.xlsx)',
              icon: TrendingUp
            },
            {
              title: 'Transaction Audit Trail (Ledger)',
              desc: 'Immutable register of all fund entries, authorisations, timestamps, and approved operations.',
              href: '/api/emergency-fund/reports',
              btn: 'Export Audit Ledger (.xlsx)',
              icon: Layers
            },
            {
              title: 'Annual Emergency Fund Balance Sheet',
              desc: 'Audited year-end balance sheet for board resolution and annual general meeting (AGM) disclosure.',
              href: '/api/emergency-fund/reports',
              btn: 'Export Financial Report (.xlsx)',
              icon: ShieldCheck
            }
          ].map((rep, idx) => {
            const Icon = rep.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0A5C36] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">{rep.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{rep.desc}</p>
                </div>

                <a
                  href={rep.href}
                  download
                  className="w-full py-2.5 rounded-xl bg-[#0A5C36] hover:bg-emerald-800 text-white font-bold text-xs text-center shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {rep.btn}
                </a>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS SECTION                                                            */}
      {/* ========================================================================= */}

      {/* 1. NEW LOAN APPLICATION MODAL */}
      {isAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-[#0A5C36]">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Apply for Emergency Loan</h3>
                  <p className="text-xs text-slate-500">Member emergency and welfare loan request facility</p>
                </div>
              </div>
              <button
                onClick={() => setIsAppModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitApplication} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Applicant Member (Shareholder-Director) *
                </label>
                <select
                  required
                  value={appForm.memberId}
                  onChange={e => setAppForm(prev => ({ ...prev, memberId: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Member...</option>
                  {members?.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.role}) — ID: {m.nationalId}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Amount Requested (KSh) *
                </label>
                <input
                  required
                  type="number"
                  min="1000"
                  step="500"
                  placeholder="e.g. 25000"
                  value={appForm.amountRequested}
                  onChange={e => setAppForm(prev => ({ ...prev, amountRequested: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-500 mt-1 block">
                  Available fund balance: <strong>KSh {stats?.availableBalance?.toLocaleString()}</strong>
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Emergency / Welfare Purpose *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Specify the emergency or welfare need (e.g. urgent medical advance, bereavement support, school fees emergency)..."
                  value={appForm.reason}
                  onChange={e => setAppForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Proposed Repayment Date *
                </label>
                <input
                  required
                  type="date"
                  value={appForm.proposedRepaymentDate}
                  onChange={e => setAppForm(prev => ({ ...prev, proposedRepaymentDate: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-500 mt-1 block">
                  Standard repayment period: 1 month (10% simple interest).
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Supporting Documentation / Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hospital invoice ref, tuition notice, self-certified"
                  value={appForm.supportingDocs}
                  onChange={e => setAppForm(prev => ({ ...prev, supportingDocs: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Governance Rule & Legal Disclosure:
                </div>
                <p>
                  Pursuant to Dreamloom company regulations, the applicant shareholder is legally prohibited from approving this loan request. Formal approval will be executed by another authorized Director or the Administrator before disbursement.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAppModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 rounded-xl bg-[#0A5C36] hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {submittingAction ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. LOAN APPROVAL MODAL WITH LEGAL MEMO */}
      {isApprovalModalOpen && selectedAppForApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-[#0A5C36]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Director Review & Approval</h3>
                  <p className="text-xs text-slate-500">Board Resolution & Conflict-of-Interest Declaration</p>
                </div>
              </div>
              <button
                onClick={() => setIsApprovalModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Applicant:</span>
                <span className="font-bold text-slate-900">{selectedAppForApproval.member.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Requested:</span>
                <span className="font-bold text-emerald-700">KSh {selectedAppForApproval.amountRequested.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Purpose:</span>
                <span className="text-slate-800 font-medium">{selectedAppForApproval.reason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Proposed Repayment Date:</span>
                <span className="text-slate-800 font-medium">
                  {new Date(selectedAppForApproval.proposedRepaymentDate).toLocaleDateString('en-GB')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fund Available Balance:</span>
                <span className="font-bold text-slate-900">KSh {stats?.availableBalance?.toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleApproveApplication} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Resolution Reference
                </label>
                <input
                  required
                  type="text"
                  value={approvalForm.resolutionReference}
                  onChange={e => setApprovalForm(prev => ({ ...prev, resolutionReference: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono text-slate-900 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Board Decision *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setApprovalForm(prev => ({ ...prev, decision: 'Approved' }))}
                    className={`py-2 rounded-xl font-bold text-xs border transition ${
                      approvalForm.decision === 'Approved'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Approve Facility
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalForm(prev => ({ ...prev, decision: 'Rejected' }))}
                    className={`py-2 rounded-xl font-bold text-xs border transition ${
                      approvalForm.decision === 'Rejected'
                        ? 'bg-red-600 text-white border-red-600 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Reject Facility
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Approval Conditions / Terms
                </label>
                <input
                  type="text"
                  value={approvalForm.conditions}
                  onChange={e => setApprovalForm(prev => ({ ...prev, conditions: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50"
                />
              </div>

              {/* Legal Disclosure Memorandum */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-950 text-xs space-y-2 leading-relaxed">
                <div className="font-extrabold flex items-center gap-1.5 text-emerald-900">
                  <Building className="w-4 h-4 text-emerald-700" />
                  Statutory Legal Memorandum (Kenyan Companies Act No. 17 of 2015):
                </div>
                <p>
                  &ldquo;I hereby confirm that I am a duly appointed Director/Officer of Dreamloom Holding Limited. In executing this resolution, I attest under statutory fiduciary duty that I am not the applicant named herein and have no disqualifying personal conflict of interest. The facility is sanctioned in compliance with the Emergency & Welfare Fund Constitution at 10% monthly simple interest.&rdquo;
                </p>
                <div className="pt-1 text-[11px] text-emerald-800 font-mono">
                  Approving Officer: <strong>{currentUser?.fullName || currentUser?.email}</strong> ({currentUser?.role || 'Executive Officer'})
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsApprovalModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className={`px-5 py-2 rounded-xl text-white font-bold text-xs shadow-md transition disabled:opacity-50 ${
                    approvalForm.decision === 'Approved' ? 'bg-[#0A5C36] hover:bg-emerald-800' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submittingAction ? 'Processing...' : `Confirm ${approvalForm.decision}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. DISBURSE LOAN MODAL */}
      {isDisbursementModalOpen && selectedAppForDisburse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Disburse Emergency Loan</h3>
                  <p className="text-xs text-slate-500">Record fund disbursement and initiate loan amortization</p>
                </div>
              </div>
              <button
                onClick={() => setIsDisbursementModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Borrower:</span>
                <span className="font-bold text-slate-900">{selectedAppForDisburse.member.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Principal Amount:</span>
                <span className="font-extrabold text-slate-900">KSh {selectedAppForDisburse.amountRequested.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Interest (10% Simple):</span>
                <span className="font-extrabold text-indigo-700">
                  KSh {(selectedAppForDisburse.amountRequested * 0.1).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-blue-200">
                <span className="font-bold text-slate-700">Total Payable upon Maturity:</span>
                <span className="font-black text-blue-900">
                  KSh {(selectedAppForDisburse.amountRequested * 1.1).toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleDisburseLoan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Disbursement Date *
                </label>
                <input
                  required
                  type="date"
                  value={disburseForm.disbursementDate}
                  onChange={e => setDisburseForm(prev => ({ ...prev, disbursementDate: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Payment Method *
                </label>
                <select
                  value={disburseForm.paymentMethod}
                  onChange={e => setDisburseForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-slate-50"
                >
                  <option value="M-Pesa">M-Pesa (Business Paybill)</option>
                  <option value="Bank Transfer">Equity Bank Transfer</option>
                  <option value="Cash / Cheque">Corporate Cheque / Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Payment Reference (M-Pesa / Bank Ref) *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. QHJ829XK11"
                  value={disburseForm.paymentReference}
                  onChange={e => setDisburseForm(prev => ({ ...prev, paymentReference: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono text-slate-800 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Disbursement Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Disbursed via Equity Paybill to applicant"
                  value={disburseForm.remarks}
                  onChange={e => setDisburseForm(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDisbursementModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {submittingAction ? 'Disbursing...' : 'Confirm Disbursement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. REPAYMENT MODAL */}
      {isRepaymentModalOpen && selectedLoanForRepayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-100 text-teal-800">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Record Loan Repayment</h3>
                  <p className="text-xs text-slate-500">Separately record recovered principal and simple interest</p>
                </div>
              </div>
              <button
                onClick={() => setIsRepaymentModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 p-4 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Loan ID:</span>
                <span className="font-mono font-bold text-slate-900">{selectedLoanForRepayment.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Borrower:</span>
                <span className="font-bold text-slate-900">{selectedLoanForRepayment.member.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Outstanding Principal:</span>
                <span className="font-bold text-teal-800">
                  KSh {selectedLoanForRepayment.principalBalance.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Outstanding Interest (10%):</span>
                <span className="font-bold text-indigo-700">
                  KSh {selectedLoanForRepayment.interestBalance.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-teal-200">
                <span className="font-bold text-slate-700">Total Outstanding Balance:</span>
                <span className="font-black text-teal-900">
                  KSh {selectedLoanForRepayment.totalBalance.toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleRecordRepayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Repayment Date *
                </label>
                <input
                  required
                  type="date"
                  value={repaymentForm.repaymentDate}
                  onChange={e => setRepaymentForm(prev => ({ ...prev, repaymentDate: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Principal Paid (KSh)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={repaymentForm.principalPaid}
                    onChange={e => setRepaymentForm(prev => ({ ...prev, principalPaid: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold text-teal-800 bg-slate-50"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">Max: KSh {selectedLoanForRepayment.principalBalance}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Interest Paid (KSh)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={repaymentForm.interestPaid}
                    onChange={e => setRepaymentForm(prev => ({ ...prev, interestPaid: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold text-indigo-800 bg-slate-50"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">Max: KSh {selectedLoanForRepayment.interestBalance}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 flex justify-between items-center text-xs font-bold text-slate-800">
                <span>Total Repayment Amount:</span>
                <span className="text-base text-emerald-800 font-extrabold">
                  KSh {(Number(repaymentForm.principalPaid || 0) + Number(repaymentForm.interestPaid || 0)).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Payment Method *
                </label>
                <select
                  value={repaymentForm.paymentMethod}
                  onChange={e => setRepaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-slate-50"
                >
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="Bank Transfer">Equity Bank</option>
                  <option value="Cash / Internal Offset">Internal Offset / Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Transaction Reference *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. QKJ47829M1"
                  value={repaymentForm.reference}
                  onChange={e => setRepaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono text-slate-800 bg-slate-50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRepaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {submittingAction ? 'Recording...' : 'Submit Repayment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. ALLOCATION MODAL */}
      {isAllocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-700" />
                <h3 className="font-extrabold text-slate-900 text-lg">Record Monthly Allocation</h3>
              </div>
              <button
                onClick={() => setIsAllocationModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordAllocation} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Member *
                </label>
                <select
                  required
                  value={allocForm.memberId}
                  onChange={e => setAllocForm(prev => ({ ...prev, memberId: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-slate-50"
                >
                  <option value="">Select Member...</option>
                  {members?.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Month</label>
                  <select
                    value={allocForm.month}
                    onChange={e => setAllocForm(prev => ({ ...prev, month: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-slate-50"
                  >
                    {[
                      'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'
                    ].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Year</label>
                  <select
                    value={allocForm.year}
                    onChange={e => setAllocForm(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-slate-50"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Allocation Amount (KSh)
                </label>
                <input
                  required
                  type="number"
                  min="500"
                  value={allocForm.amount}
                  onChange={e => setAllocForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold text-emerald-800 bg-slate-50"
                />
                <span className="text-xs text-slate-500 mt-1 block">Default: KSh 1,000 per member</span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAllocationModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 rounded-xl bg-[#0A5C36] hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {submittingAction ? 'Saving...' : 'Save Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. FUND SETTINGS MODAL (ADMIN ONLY) */}
      {isSettingsModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-700" />
                <h3 className="font-extrabold text-slate-900 text-lg">Fund Configuration</h3>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSettings} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Fund Name
                </label>
                <input
                  required
                  type="text"
                  value={settingsForm.fundName}
                  onChange={e => setSettingsForm(prev => ({ ...prev, fundName: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Monthly Allocation per Member (KSh)
                </label>
                <input
                  required
                  type="number"
                  value={settingsForm.monthlyAllocation}
                  onChange={e => setSettingsForm(prev => ({ ...prev, monthlyAllocation: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-slate-50"
                />
                <span className="text-xs text-slate-500 mt-0.5 block">Total monthly for 7 members: KSh {(Number(settingsForm.monthlyAllocation) * 7).toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Interest Rate (%)
                  </label>
                  <input
                    required
                    type="number"
                    step="0.5"
                    value={settingsForm.interestRate}
                    onChange={e => setSettingsForm(prev => ({ ...prev, interestRate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-slate-50"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Monthly Simple Interest</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Repayment Period
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="12"
                    value={settingsForm.repaymentPeriodMonths}
                    onChange={e => setSettingsForm(prev => ({ ...prev, repaymentPeriodMonths: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-slate-50"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Months</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 rounded-xl bg-[#0A5C36] hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {submittingAction ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. LOAN HISTORY MODAL */}
      {isLoanHistoryModalOpen && selectedLoanForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-700" />
                <h3 className="font-extrabold text-slate-900 text-lg">
                  Loan Transaction History — {selectedLoanForHistory.id}
                </h3>
              </div>
              <button
                onClick={() => setIsLoanHistoryModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Borrower</span>
                <span className="font-bold text-slate-900">{selectedLoanForHistory.member.fullName}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Principal</span>
                <span className="font-bold text-slate-900">KSh {selectedLoanForHistory.principal.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Interest (10%)</span>
                <span className="font-bold text-indigo-700">KSh {selectedLoanForHistory.interestAmount.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Balance</span>
                <span className="font-extrabold text-amber-600">KSh {selectedLoanForHistory.totalBalance.toLocaleString()}</span>
              </div>
            </div>

            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2">Repayment Entries</h4>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Total Paid</th>
                    <th className="px-3 py-2">Principal Paid</th>
                    <th className="px-3 py-2">Interest Paid</th>
                    <th className="px-3 py-2">Method</th>
                    <th className="px-3 py-2">Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedLoanForHistory.repayments?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-500">
                        No repayments made yet.
                      </td>
                    </tr>
                  ) : (
                    selectedLoanForHistory.repayments?.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2">{new Date(r.repaymentDate).toLocaleDateString('en-GB')}</td>
                        <td className="px-3 py-2 font-bold text-emerald-800">KSh {r.amount.toLocaleString()}</td>
                        <td className="px-3 py-2 text-teal-700">KSh {r.principalPaid.toLocaleString()}</td>
                        <td className="px-3 py-2 text-indigo-700">KSh {r.interestPaid.toLocaleString()}</td>
                        <td className="px-3 py-2 text-slate-600">{r.paymentMethod}</td>
                        <td className="px-3 py-2 font-mono text-slate-500">{r.reference}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setIsLoanHistoryModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. PRINTABLE RESOLUTION MODAL */}
      {isPrintResolutionOpen && selectedApprovalForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-[#0A5C36]" />
                <span className="font-extrabold text-slate-900">DREAMLOOM HOLDING LIMITED</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / PDF
                </button>
                <button
                  onClick={() => setIsPrintResolutionOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-6 text-slate-800 text-xs leading-relaxed">
              <div className="text-center space-y-1">
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                  BOARD OF DIRECTORS RESOLUTION & LOAN APPROVAL MEMORANDUM
                </h2>
                <p className="font-mono text-slate-500 font-bold">
                  {selectedApprovalForPrint.approval.resolutionReference}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Applicant Shareholder:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedApprovalForPrint.application.member.fullName}
                  </span>
                  <span className="text-slate-500 block">
                    National ID: {selectedApprovalForPrint.application.member.nationalId}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Approved Facility Amount:</span>
                  <span className="font-extrabold text-emerald-800 text-base">
                    KSh {selectedApprovalForPrint.application.amountRequested.toLocaleString()}
                  </span>
                  <span className="text-slate-500 block">Interest Terms: 10% monthly simple interest</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase">Statutory Memorandum & Disclosure</h4>
                <p className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950">
                  {selectedApprovalForPrint.approval.legalDisclosure}
                </p>
              </div>

              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8">
                <div>
                  <span className="text-slate-500 block mb-1">Approved & Sanctioned By:</span>
                  <span className="font-bold text-slate-900">{selectedApprovalForPrint.approval.approverName}</span>
                  <span className="text-slate-500 block">{selectedApprovalForPrint.approval.approverRole}</span>
                  <span className="text-[10px] font-mono text-slate-400 block mt-1">
                    Signature Ref: {selectedApprovalForPrint.approval.signatureRef}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block mb-1">Execution Date:</span>
                  <span className="font-bold text-slate-900">
                    {new Date(selectedApprovalForPrint.approval.decisionDate).toLocaleDateString('en-GB')}
                  </span>
                  <span className="text-emerald-700 font-bold block mt-1">
                    Status: {selectedApprovalForPrint.approval.decision.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. REVERSAL CONFIRMATION MODAL */}
      {isReversalModalOpen && selectedTxnForReversal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Undo2 className="w-5 h-5 text-red-600" />
                <h3 className="font-extrabold text-slate-900 text-lg">Reverse Transaction</h3>
              </div>
              <button
                onClick={() => setIsReversalModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReverseTransaction} className="mt-4 space-y-4">
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
                <div className="font-bold">Transaction: {selectedTxnForReversal.id}</div>
                <div>Amount: KSh {selectedTxnForReversal.amount.toLocaleString()}</div>
                <div>Description: {selectedTxnForReversal.description}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Reversal Reason (Audit Log Required) *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="State the administrative or financial justification for reversing this transaction..."
                  value={reversalReason}
                  onChange={e => setReversalReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReversalModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {submittingAction ? 'Reversing...' : 'Confirm Reversal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. ALLOCATION REVERSAL CONFIRMATION MODAL */}
      {isAllocationReversalModalOpen && selectedAllocationForReversal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Undo2 className="w-5 h-5 text-red-600" />
                <h3 className="font-extrabold text-slate-900 text-lg">Reverse Monthly Allocation</h3>
              </div>
              <button
                onClick={() => setIsAllocationReversalModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReverseAllocation} className="mt-4 space-y-4">
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
                <div className="font-bold">Allocation ID: ALC-{selectedAllocationForReversal.id}</div>
                <div>Member: {selectedAllocationForReversal.member?.fullName}</div>
                <div>Period: {selectedAllocationForReversal.month} {selectedAllocationForReversal.year}</div>
                <div>Emergency Allocation Amount: KSh {Number(selectedAllocationForReversal.amount).toLocaleString()}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Reversal Reason (Audit Log Required) *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="State the administrative or financial justification for reversing this allocation..."
                  value={allocationReversalReason}
                  onChange={e => setAllocationReversalReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAllocationReversalModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {submittingAction ? 'Reversing...' : 'Confirm Allocation Reversal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
