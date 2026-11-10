'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Wallet, Plus, Search, Filter, Download, FileText, CheckCircle2,
  AlertTriangle, Clock, ArrowDownCircle, RotateCcw, RotateCw, Eye,
  Edit3, Check, X, ShieldAlert, FileSpreadsheet, ExternalLink, Paperclip,
  Landmark, CreditCard, Building2, User, Calendar, Coins, ArrowUpRight
} from 'lucide-react';
import MemberAutocomplete from '@/components/MemberAutocomplete';
import ActionsDropdown from '@/components/ActionsDropdown';
import {
  ALL_MONTHS,
  AVAILABLE_YEARS,
  getEATISODate,
  getEATCurrentMonthName,
  getEATCurrentYear,
  matchesMonthAndYear,
  parseDateToMonthYear
} from '@/lib/dateUtils';
import * as XLSX from 'xlsx';

export interface DepositRecord {
  id: number;
  customId: string;
  date: string | Date;
  depositorName: string;
  amount: number;
  transactionType: string;
  customTransactionType?: string | null;
  reason: string;
  reference?: string | null;
  paymentMethod: string;
  receivingAccount: string;
  memberId?: number | null;
  member?: { id: number; fullName: string; phone?: string; email?: string } | null;
  allocationType?: string | null;
  allocationRef?: string | null;
  contributionId?: number | null;
  loanId?: string | null;
  projectId?: string | null;
  investmentId?: string | null;
  reconciliationStatus: 'Unreconciled' | 'Reconciled' | 'Discrepancy';
  reconciledAt?: string | null;
  reconciledBy?: string | null;
  reconciliationNotes?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  isReversed: boolean;
  reversalReason?: string | null;
  reversedAt?: string | null;
  reversedBy?: string | null;
  createdByUser?: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface DepositsTabProps {
  deposits: DepositRecord[];
  members: any[];
  loans: any[];
  projects: any[];
  investments: any[];
  canEdit: boolean;
  currentUser: any;
  onRefresh: () => Promise<void>;
  selectedCurrency?: string;
}

export const TRANSACTION_TYPES = [
  'Member Deposit',
  'Share Capital',
  'Additional Contribution',
  'Land Payment',
  'Loan Repayment',
  'Investment Income',
  'Business Income',
  'Project Funding',
  'Other',
] as const;

export const RECEIVING_ACCOUNTS = [
  'Equity Bank Kenya • A/C 1760287177880',
  'NCBA Bank Kenya • A/C 1000-DEP',
  'Co-operative Bank of Kenya',
  'M-Pesa Paybill / Till (Dreamloom Treasury)',
  'Cash in Hand / Petty Cash',
] as const;

export const PAYMENT_METHODS = [
  'M-Pesa',
  'Cash',
  'Bank Transfer',
  'Cheque',
  'Other',
] as const;

export default function DepositsTab({
  deposits,
  members,
  loans,
  projects,
  investments,
  canEdit,
  currentUser,
  onRefresh,
  selectedCurrency = 'KES',
}: DepositsTabProps) {
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('All');
  const [filterYear, setFilterYear] = useState<number | string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterAccount, setFilterAccount] = useState<string>('All');
  const [filterReconciliation, setFilterReconciliation] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal States
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<DepositRecord | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [viewingDeposit, setViewingDeposit] = useState<DepositRecord | null>(null);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [reconcilingDeposit, setReconcilingDeposit] = useState<DepositRecord | null>(null);
  const [reconcileStatusInput, setReconcileStatusInput] = useState<'Reconciled' | 'Discrepancy'>('Reconciled');
  const [reconcileNotesInput, setReconcileNotesInput] = useState('');
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [reversingDeposit, setReversingDeposit] = useState<DepositRecord | null>(null);
  const [reversalReasonInput, setReversalReasonInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const initialForm = {
    depositorName: '',
    date: getEATISODate(),
    amount: '',
    transactionType: 'Member Deposit',
    customTransactionType: '',
    reason: '',
    reference: '',
    paymentMethod: 'M-Pesa',
    receivingAccount: 'Equity Bank Kenya • A/C 1760287177880',
    memberId: '',
    allocationType: 'None',
    allocationRef: '',
    attachmentName: '',
    attachmentUrl: '',
  };
  const [formData, setFormData] = useState(initialForm);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Check duplicate reference in real time
  useEffect(() => {
    if (!formData.reference || !formData.reference.trim()) {
      setDuplicateWarning(null);
      return;
    }
    const cleanRef = formData.reference.trim().toLowerCase();
    const match = deposits.find(
      (d) =>
        !d.isReversed &&
        d.id !== editingDeposit?.id &&
        (d.reference || '').trim().toLowerCase() === cleanRef
    );
    if (match) {
      setDuplicateWarning(
        `Warning: Reference '${formData.reference.trim()}' is already used by ${match.depositorName} for KES ${Number(match.amount).toLocaleString()} (${match.customId}). Duplicate reference is not allowed.`
      );
    } else {
      setDuplicateWarning(null);
    }
  }, [formData.reference, deposits, editingDeposit]);

  // Filtered and Sorted Deposits
  const filteredDeposits = useMemo(() => {
    return deposits
      .filter((dep) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = (dep.depositorName || '').toLowerCase().includes(q);
          const matchRef = (dep.reference || '').toLowerCase().includes(q);
          const matchId = (dep.customId || '').toLowerCase().includes(q);
          const matchReason = (dep.reason || '').toLowerCase().includes(q);
          if (!matchName && !matchRef && !matchId && !matchReason) return false;
        }

        // Period filter (Month & Year)
        if (filterMonth !== 'All' || filterYear !== 'All') {
          const dStr = typeof dep.date === 'string' ? dep.date : dep.date.toISOString();
          if (!matchesMonthAndYear(dStr, filterMonth, filterYear)) return false;
        }

        // Transaction Type filter
        if (filterType !== 'All') {
          if (dep.transactionType !== filterType) return false;
        }

        // Receiving Account filter
        if (filterAccount !== 'All') {
          if (dep.receivingAccount !== filterAccount) return false;
        }

        // Reconciliation filter
        if (filterReconciliation !== 'All') {
          if (filterReconciliation === 'Reversed') {
            if (!dep.isReversed) return false;
          } else {
            if (dep.isReversed || dep.reconciliationStatus !== filterReconciliation) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'amount') {
          return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
        }
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [
    deposits,
    searchQuery,
    filterMonth,
    filterYear,
    filterType,
    filterAccount,
    filterReconciliation,
    sortBy,
    sortOrder,
  ]);

  // Metric summaries (Dynamic based on active filters, strictly excluding reversed records)
  const metrics = useMemo(() => {
    const todayISO = getEATISODate();
    const currentMonthYear = parseDateToMonthYear(todayISO);

    let totalAmount = 0;
    let thisMonthAmount = 0;
    let todayAmount = 0;
    let totalCount = 0;
    let reconciledCount = 0;
    let unreconciledCount = 0;
    let discrepancyCount = 0;
    let reversedCount = 0;

    filteredDeposits.forEach((dep) => {
      totalCount++;
      if (dep.isReversed) {
        reversedCount++;
        return; // Exclude reversed from active monetary amounts
      }

      const amt = Number(dep.amount) || 0;
      totalAmount += amt;

      const depDate = new Date(dep.date);
      const depDateISO = depDate.toISOString().slice(0, 10);
      const depMonthYear = parseDateToMonthYear(depDate.toISOString());

      if (
        currentMonthYear &&
        depMonthYear &&
        currentMonthYear.monthIdx === depMonthYear.monthIdx &&
        currentMonthYear.year === depMonthYear.year
      ) {
        thisMonthAmount += amt;
      }

      if (depDateISO === todayISO) {
        todayAmount += amt;
      }

      if (dep.reconciliationStatus === 'Reconciled') reconciledCount++;
      else if (dep.reconciliationStatus === 'Discrepancy') discrepancyCount++;
      else unreconciledCount++;
    });

    return {
      totalAmount,
      thisMonthAmount,
      todayAmount,
      totalCount,
      activeCount: totalCount - reversedCount,
      reconciledCount,
      unreconciledCount,
      discrepancyCount,
      reversedCount,
    };
  }, [filteredDeposits]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingDeposit(null);
    setFormData(initialForm);
    setDuplicateWarning(null);
    setIsEntryModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (deposit: DepositRecord) => {
    if (deposit.isReversed) {
      alert('Cannot edit a reversed deposit record. Please refer to audit log for history.');
      return;
    }
    setEditingDeposit(deposit);
    setFormData({
      depositorName: deposit.depositorName,
      date: deposit.date ? new Date(deposit.date).toISOString().slice(0, 10) : getEATISODate(),
      amount: String(deposit.amount),
      transactionType: deposit.transactionType || 'Member Deposit',
      customTransactionType: deposit.customTransactionType || '',
      reason: deposit.reason || '',
      reference: deposit.reference || '',
      paymentMethod: deposit.paymentMethod || 'M-Pesa',
      receivingAccount: deposit.receivingAccount || 'Equity Bank Kenya • A/C 1760287177880',
      memberId: deposit.memberId ? String(deposit.memberId) : '',
      allocationType: deposit.allocationType || 'None',
      allocationRef: deposit.allocationRef || '',
      attachmentName: deposit.attachmentName || '',
      attachmentUrl: deposit.attachmentUrl || '',
    });
    setDuplicateWarning(null);
    setIsEntryModalOpen(true);
  };

  // Submit Add / Edit
  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.depositorName.trim()) {
      alert('Please enter depositor name');
      return;
    }
    const amt = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amt) || amt <= 0) {
      alert('Validation Error: AMOUNT DEPOSITED (KES) is mandatory and must be a valid positive amount greater than zero (both whole numbers and decimal amounts are accepted).');
      return;
    }
    if (duplicateWarning) {
      alert('Cannot save: A duplicate reference number was detected. Please verify reference.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: any = {
        userEmail: currentUser?.email || 'admin@dreamloom.co.ke',
        userName: currentUser?.name || 'Administrator',
        depositorName: formData.depositorName.trim(),
        date: formData.date,
        amount: amt,
        transactionType: formData.transactionType,
        customTransactionType: formData.transactionType === 'Other' ? formData.customTransactionType : null,
        reason: formData.reason.trim(),
        reference: formData.reference.trim() || null,
        paymentMethod: formData.paymentMethod,
        receivingAccount: formData.receivingAccount,
        memberId: formData.memberId ? Number(formData.memberId) : null,
        allocationType: formData.allocationType,
        allocationRef: formData.allocationRef || null,
        attachmentName: formData.attachmentName || null,
        attachmentUrl: formData.attachmentUrl || null,
      };

      // Set specific allocation ids
      if (formData.allocationType === 'Loan' && formData.allocationRef) {
        payload.loanId = formData.allocationRef;
      } else if (formData.allocationType === 'Project' && formData.allocationRef) {
        payload.projectId = formData.allocationRef;
      } else if (formData.allocationType === 'Investment' && formData.allocationRef) {
        payload.investmentId = formData.allocationRef;
      }

      let res;
      if (editingDeposit) {
        payload.id = editingDeposit.id;
        res = await fetch('/api/deposits', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then((r) => r.json());
      } else {
        res = await fetch('/api/deposits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then((r) => r.json());
      }

      if (!res.success) {
        alert(res.error || 'Failed to save deposit');
        return;
      }

      setIsEntryModalOpen(false);
      await onRefresh();
    } catch (err: any) {
      alert('Error saving deposit: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reconcile Handler
  const handleOpenReconcileModal = (deposit: DepositRecord) => {
    setReconcilingDeposit(deposit);
    setReconcileStatusInput(deposit.reconciliationStatus === 'Discrepancy' ? 'Discrepancy' : 'Reconciled');
    setReconcileNotesInput(deposit.reconciliationNotes || '');
    setIsReconcileModalOpen(true);
  };

  const handleSubmitReconcile = async () => {
    if (!reconcilingDeposit) return;
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reconcile',
          depositId: reconcilingDeposit.id,
          reconciliationStatus: reconcileStatusInput,
          reconciliationNotes: reconcileNotesInput.trim(),
          userEmail: currentUser?.email,
          userName: currentUser?.name,
        }),
      }).then((r) => r.json());

      if (!res.success) {
        alert(res.error || 'Failed to update reconciliation');
        return;
      }

      setIsReconcileModalOpen(false);
      await onRefresh();
    } catch (err: any) {
      alert('Error reconciling deposit: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reverse Handler
  const handleOpenReverseModal = (deposit: DepositRecord) => {
    setReversingDeposit(deposit);
    setReversalReasonInput('');
    setIsReverseModalOpen(true);
  };

  const handleSubmitReverse = async () => {
    if (!reversingDeposit) return;
    if (!reversalReasonInput.trim()) {
      alert('Please state a valid reason for reversing this financial transaction.');
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reverse',
          depositId: reversingDeposit.id,
          reversalReason: reversalReasonInput.trim(),
          userEmail: currentUser?.email,
          userName: currentUser?.name,
        }),
      }).then((r) => r.json());

      if (!res.success) {
        alert(res.error || 'Failed to reverse deposit');
        return;
      }

      setIsReverseModalOpen(false);
      await onRefresh();
    } catch (err: any) {
      alert('Error reversing deposit: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const dataToExport = filteredDeposits.map((d) => ({
      'Transaction ID': d.customId,
      Date: new Date(d.date).toISOString().slice(0, 10),
      'Depositor Name': d.depositorName,
      'Amount (KES)': d.amount,
      'Transaction Type': d.transactionType,
      'Receiving Account': d.receivingAccount,
      'Payment Method': d.paymentMethod,
      Reference: d.reference || '-',
      Description: d.reason,
      'Allocation Type': d.allocationType || 'None',
      'Allocation Ref': d.allocationRef || '-',
      'Reconciliation Status': d.isReversed ? 'REVERSED' : d.reconciliationStatus,
      'Reconciled By': d.reconciledBy || '-',
      'Reconciliation Notes': d.reconciliationNotes || '-',
      'Recorded By': d.createdByUser || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Deposits');
    XLSX.writeFile(workbook, `Dreamloom_Deposits_Register_${getEATISODate()}.xlsx`);
  };

  // Export to PDF / Print
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* --------------------------------------------------------------------- */}
      {/* 1. TOP AUTOMATIC DEPOSIT SUMMARY CARDS */}
      {/* --------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: Total Deposits */}
        <div className="bg-gradient-to-br from-[#059669] to-[#10B981] rounded-2xl p-5 shadow-xl flex items-center gap-4 text-white">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-white/80 text-xs font-medium block">Total Deposits Received</span>
            <span className="text-2xl font-extrabold text-white block leading-tight font-mono">
              {selectedCurrency} {metrics.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-white/90 font-medium flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> {metrics.activeCount} active verified transactions
            </span>
          </div>
        </div>

        {/* CARD 2: Deposits This Month */}
        <div className="bg-gradient-to-br from-[#0284C7] to-[#38BDF8] rounded-2xl p-5 shadow-xl flex items-center gap-4 text-white">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-white/80 text-xs font-medium block">Deposits This Month</span>
            <span className="text-2xl font-extrabold text-white block leading-tight font-mono">
              {selectedCurrency} {metrics.thisMonthAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-white/90 font-medium flex items-center gap-1 mt-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> Inflow for {getEATCurrentMonthName()} {getEATCurrentYear()}
            </span>
          </div>
        </div>

        {/* CARD 3: Deposits Today */}
        <div className="bg-gradient-to-br from-[#6366F1] to-[#818CF8] rounded-2xl p-5 shadow-xl flex items-center gap-4 text-white">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Coins className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-white/80 text-xs font-medium block">Deposits Today</span>
            <span className="text-2xl font-extrabold text-white block leading-tight font-mono">
              {selectedCurrency} {metrics.todayAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-white/90 font-medium flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5" /> Date: {getEATISODate()} (EAT)
            </span>
          </div>
        </div>

        {/* CARD 4: Total Number of Transactions */}
        <div className="bg-gradient-to-br from-[#D97706] to-[#F59E0B] rounded-2xl p-5 shadow-xl flex items-center gap-4 text-white">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <ArrowDownCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-white/80 text-xs font-medium block">Total Transactions</span>
            <span className="text-2xl font-extrabold text-white block leading-tight font-mono">
              {metrics.totalCount}
            </span>
            <span className="text-[11px] text-white/90 font-medium flex items-center gap-1 mt-0.5">
              Reconciled: {metrics.reconciledCount} | Unreconciled: {metrics.unreconciledCount}
            </span>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 2. FILTER & CONTROLS TOOLBAR */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                <Landmark className="w-4 h-4 text-emerald-400" /> Deposits & Financial Inflow Register
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                Official Treasury
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Central ledger of money received with automatic classification, bank/M-Pesa reconciliation, and anti-duplication protection.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={async () => {
                setIsRefreshing(true);
                await onRefresh();
                setIsRefreshing(false);
              }}
              className="px-3 py-1.5 bg-[#142036] hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-[#1E2D4A] transition"
              title="Refresh deposits from database"
            >
              <RotateCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-[#142036] hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-[#1E2D4A] transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export Excel
            </button>

            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 bg-[#142036] hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-[#1E2D4A] transition"
            >
              <FileText className="w-3.5 h-3.5 text-sky-400" /> Export PDF
            </button>

            {canEdit && (
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition"
              >
                <Plus className="w-4 h-4" /> Record New Deposit
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-[#1E293B]">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, ref, ID..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Month */}
          <div>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="All">All Months</option>
              {ALL_MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value === 'All' ? 'All' : parseInt(e.target.value, 10))}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-bold"
            >
              <option value="All">All Years</option>
              {AVAILABLE_YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Transaction Type */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="All">All Types</option>
              {TRANSACTION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Receiving Account */}
          <div>
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="All">All Receiving Accounts</option>
              {RECEIVING_ACCOUNTS.map((acc) => (
                <option key={acc} value={acc}>{acc}</option>
              ))}
            </select>
          </div>

          {/* Reconciliation Status */}
          <div>
            <select
              value={filterReconciliation}
              onChange={(e) => setFilterReconciliation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="All">All Reconciliation</option>
              <option value="Unreconciled">Unreconciled</option>
              <option value="Reconciled">Reconciled</option>
              <option value="Discrepancy">Discrepancy</option>
              <option value="Reversed">Reversed Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 3. DEPOSITS REGISTER TABLE */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#E6F4EA] border-b border-emerald-900/10 text-slate-700 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th
                  onClick={() => {
                    if (sortBy === 'date') setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                    else { setSortBy('date'); setSortOrder('desc'); }
                  }}
                  className="p-4 cursor-pointer hover:text-white transition"
                >
                  Date {sortBy === 'date' && (sortOrder === 'desc' ? '▼' : '▲')}
                </th>
                <th className="p-4">Depositor Name</th>
                <th className="p-4">Transaction Type</th>
                <th className="p-4">Reason / Description</th>
                <th
                  onClick={() => {
                    if (sortBy === 'amount') setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                    else { setSortBy('amount'); setSortOrder('desc'); }
                  }}
                  className="p-4 text-right cursor-pointer hover:text-white transition"
                >
                  Amount (KES) {sortBy === 'amount' && (sortOrder === 'desc' ? '▼' : '▲')}
                </th>
                <th className="p-4">Payment Method & Account</th>
                <th className="p-4">Reference</th>
                <th className="p-4 text-center">Reconciliation</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
              {filteredDeposits.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 font-sans">
                    No deposit records found matching the active filters. Click &quot;Record New Deposit&quot; to add a transaction.
                  </td>
                </tr>
              ) : (
                filteredDeposits.map((dep) => {
                  const isRev = dep.isReversed;
                  const dateStr = dep.date ? new Date(dep.date).toISOString().slice(0, 10) : '-';

                  return (
                    <tr
                      key={dep.id}
                      className={`hover:bg-emerald-50/20 transition ${
                        isRev ? 'opacity-60 bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Date */}
                      <td className="p-4 whitespace-nowrap text-slate-300">
                        {dateStr}
                        <span className="block text-[10px] text-slate-500 font-sans">{dep.customId}</span>
                      </td>

                      {/* Name / Depositor */}
                      <td className="p-4 font-sans font-medium text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{dep.depositorName}</span>
                          {dep.member && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-950/80 border border-emerald-500/30 text-[9px] text-emerald-300 font-mono">
                              Member
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Transaction Type */}
                      <td className="p-4 font-sans whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            dep.transactionType === 'Share Capital'
                              ? 'bg-purple-950/80 text-purple-300 border border-purple-500/30'
                              : dep.transactionType === 'Loan Repayment'
                              ? 'bg-blue-950/80 text-blue-300 border border-blue-500/30'
                              : dep.transactionType === 'Land Payment'
                              ? 'bg-teal-950/80 text-teal-300 border border-teal-500/30'
                              : dep.transactionType === 'Member Deposit'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                              : dep.transactionType === 'Additional Contribution'
                              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30'
                              : dep.transactionType === 'Investment Income'
                              ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {dep.transactionType === 'Other' && dep.customTransactionType
                            ? dep.customTransactionType
                            : dep.transactionType}
                        </span>
                      </td>

                      {/* Reason / Allocation */}
                      <td className="p-4 font-sans max-w-xs truncate text-slate-300" title={dep.reason}>
                        <span>{dep.reason}</span>
                        {dep.allocationType && dep.allocationType !== 'None' && (
                          <span className="block text-[10px] text-emerald-400 font-mono mt-0.5">
                            ↳ Linked {dep.allocationType}: {dep.allocationRef || '-'}
                          </span>
                        )}
                      </td>

                      {/* Amount Deposited (KES) */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <span
                          className={`font-black text-sm font-mono ${
                            isRev ? 'line-through text-slate-500' : 'text-emerald-400'
                          }`}
                        >
                          {Number(dep.amount).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </td>

                      {/* Payment Method & Receiving Account */}
                      <td className="p-4 font-sans whitespace-nowrap text-slate-300">
                        <div className="font-medium text-white">{dep.paymentMethod}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[180px]" title={dep.receivingAccount}>
                          {dep.receivingAccount.split('•')[0]}
                        </div>
                      </td>

                      {/* Reference */}
                      <td className="p-4 whitespace-nowrap text-emerald-300 font-mono font-semibold">
                        {dep.reference ? dep.reference : <span className="text-slate-600">-</span>}
                      </td>

                      {/* Reconciliation Status */}
                      <td className="p-4 text-center whitespace-nowrap font-sans">
                        {isRev ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-500/40 flex items-center gap-1 justify-center">
                            <ShieldAlert className="w-3 h-3" /> REVERSED
                          </span>
                        ) : dep.reconciliationStatus === 'Reconciled' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 justify-center">
                            <Check className="w-3 h-3" /> Reconciled
                          </span>
                        ) : dep.reconciliationStatus === 'Discrepancy' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center gap-1 justify-center">
                            <AlertTriangle className="w-3 h-3" /> Discrepancy
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1 justify-center">
                            <Clock className="w-3 h-3 text-slate-400" /> Unreconciled
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center whitespace-nowrap font-sans">
                        <ActionsDropdown
                          items={[
                            {
                              id: 'view',
                              label: 'View',
                              icon: <Eye className="w-4 h-4 text-slate-700" />,
                              onClick: () => {
                                setViewingDeposit(dep);
                                setIsDetailsModalOpen(true);
                              }
                            },
                            {
                              id: 'reconcile',
                              label: 'Reconcile',
                              icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
                              hidden: !canEdit || isRev,
                              onClick: () => handleOpenReconcileModal(dep)
                            },
                            {
                              id: 'edit',
                              label: 'Edit',
                              icon: <Edit3 className="w-4 h-4 text-slate-700" />,
                              hidden: !canEdit || isRev,
                              onClick: () => handleOpenEditModal(dep)
                            },
                            {
                              id: 'reverse',
                              label: 'Reverse',
                              icon: <RotateCcw className="w-4 h-4 text-rose-600" />,
                              danger: true,
                              hidden: !canEdit || isRev,
                              onClick: () => handleOpenReverseModal(dep)
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredDeposits.length > 0 && (
              <tfoot className="bg-[#121B2F] font-bold text-white border-t border-[#1E293B]">
                <tr>
                  <td colSpan={4} className="p-4 font-sans text-right uppercase text-[10px] text-slate-400">
                    Total Active Filtered Deposits ({metrics.activeCount} transactions):
                  </td>
                  <td className="p-4 text-right font-mono text-emerald-400 text-sm">
                    {selectedCurrency} {metrics.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td colSpan={4} className="p-4 text-center text-[10px] text-slate-400 font-sans">
                    Anti-double-counting reconciled • {metrics.reconciledCount} Reconciled / {metrics.unreconciledCount} Pending
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 4. MODAL: RECORD / EDIT DEPOSIT ENTRY */}
      {/* --------------------------------------------------------------------- */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 text-white">
            <div className="flex justify-between items-center pb-4 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingDeposit ? `Edit Deposit [${editingDeposit.customId}]` : 'Record New Deposit Entry'}
                  </h3>
                  <p className="text-xs text-slate-400">Official company inflow recording and automatic ledger assignment</p>
                </div>
              </div>
              <button
                onClick={() => setIsEntryModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitDeposit} className="space-y-4">
              {/* Row 1: Depositor Name & Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Depositor Name / Organisation <span className="text-rose-400">*</span>
                  </label>
                  <MemberAutocomplete
                    value={formData.depositorName}
                    members={members}
                    onChange={(fullName, mem) => {
                      setFormData({
                        ...formData,
                        depositorName: fullName,
                        memberId: mem ? String(mem.id) : formData.memberId,
                      });
                    }}
                    placeholder="Type name or search member..."
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Deposit Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Highlighted Mandatory AMOUNT DEPOSITED (KES) */}
              <div className="bg-[#121B2F] p-4 rounded-2xl border-2 border-emerald-500/50 shadow-lg space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <label className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-emerald-400" /> AMOUNT DEPOSITED (KES) <span className="text-rose-400 font-bold">* MANDATORY</span>
                  </label>
                  <span className="text-[10px] text-emerald-300/80 font-mono font-medium">Whole numbers & decimals accepted</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold font-mono text-emerald-400 select-none">KES</span>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-[#0B1324] border border-[#1E2D4A] rounded-xl pl-14 pr-4 py-2.5 text-base text-white font-mono font-black tracking-tight focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 shadow-inner"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Must be greater than zero. Persistently recorded to PostgreSQL database and feeds all deposit calculations.
                </p>
              </div>

              {/* Row 2: Transaction Type & Payment Method */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Transaction Type <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.transactionType}
                    onChange={(e) => setFormData({ ...formData, transactionType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {TRANSACTION_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Payment Method <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm}>{pm}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Optional Custom Type if 'Other' */}
              {formData.transactionType === 'Other' && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Custom Transaction Classification
                  </label>
                  <input
                    type="text"
                    placeholder="Specify classification (e.g. Grant, Equipment Sale, Refund)..."
                    value={formData.customTransactionType}
                    onChange={(e) => setFormData({ ...formData, customTransactionType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Row 3: Receiving Account */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Receiving Company Account <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.receivingAccount}
                  onChange={(e) => setFormData({ ...formData, receivingAccount: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {RECEIVING_ACCOUNTS.map((acc) => (
                    <option key={acc} value={acc}>{acc}</option>
                  ))}
                </select>
              </div>

              {/* Row 4: External Reference & Duplicate Warning */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Reference Number (M-Pesa / Bank Ref / Receipt Slip)
                </label>
                <input
                  type="text"
                  placeholder="e.g. QK89123456 or EQ-TXN-9981"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                />
                {duplicateWarning && (
                  <div className="mt-1.5 p-2 bg-rose-950/60 border border-rose-500/40 rounded-lg text-rose-300 text-xs flex items-start gap-1.5 font-sans">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <span>{duplicateWarning}</span>
                  </div>
                )}
              </div>

              {/* Row 5: Reason / Description */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Reason / Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Explain the purpose of this deposit..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Row 6: Financial Allocation (Anti-Double Counting Controls) */}
              <div className="p-3 bg-[#121B2F] border border-[#1E293B] rounded-xl space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <ShieldAlert className="w-3.5 h-3.5" /> Financial Integration & Allocation (Optional)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Allocate To Module:</label>
                    <select
                      value={formData.allocationType}
                      onChange={(e) => setFormData({ ...formData, allocationType: e.target.value, allocationRef: '' })}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="None">None (Unallocated Inflow)</option>
                      <option value="Contribution">Monthly Contribution</option>
                      <option value="Loan">Loan Repayment</option>
                      <option value="Project">Project Funding</option>
                      <option value="Investment">Investment Return</option>
                      <option value="Land">Land Purchase (Mawega)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Target Identifier / Reference:</label>
                    {formData.allocationType === 'Loan' ? (
                      <select
                        value={formData.allocationRef}
                        onChange={(e) => setFormData({ ...formData, allocationRef: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">-- Select Active Loan --</option>
                        {loans.filter((l) => l.status === 'Active').map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.id} - {l.borrower} (Bal: KES {l.balance.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    ) : formData.allocationType === 'Contribution' ? (
                      <select
                        value={formData.allocationRef}
                        onChange={(e) => setFormData({ ...formData, allocationRef: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">-- Select Month / Cycle --</option>
                        {ALL_MONTHS.map((m) => (
                          <option key={m} value={`${m} 2026`}>{m} 2026</option>
                        ))}
                      </select>
                    ) : formData.allocationType === 'Project' ? (
                      <select
                        value={formData.allocationRef}
                        onChange={(e) => setFormData({ ...formData, allocationRef: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">-- Select Project --</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.name}>{p.name} ({p.id})</option>
                        ))}
                      </select>
                    ) : formData.allocationType === 'Investment' ? (
                      <select
                        value={formData.allocationRef}
                        onChange={(e) => setFormData({ ...formData, allocationRef: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">-- Select Investment Asset --</option>
                        {investments.map((inv) => (
                          <option key={inv.id} value={inv.asset}>{inv.asset} ({inv.type})</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Optional parcel or note..."
                        value={formData.allocationRef}
                        onChange={(e) => setFormData({ ...formData, allocationRef: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  Note: Allocating this deposit directly updates the linked loan or project ledger safely without creating duplicate records.
                </p>
              </div>

              {/* Row 7: Attachment Name / Reference */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Attachment Reference (Bank Slip / M-Pesa Confirmation Screenshot)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. MPesa_Confirmation_QK89123456.png or Bank_Slip_Scan.pdf"
                    value={formData.attachmentName}
                    onChange={(e) => setFormData({ ...formData, attachmentName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !!duplicateWarning}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/50"
                >
                  <Check className="w-4 h-4" /> {isSubmitting ? 'Saving...' : editingDeposit ? 'Update Deposit' : 'Confirm & Save Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 5. MODAL: VIEW COMPLETE DEPOSIT DETAILS */}
      {/* --------------------------------------------------------------------- */}
      {isDetailsModalOpen && viewingDeposit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-white">
            <div className="flex justify-between items-center pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Deposit Transaction Details</h3>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#1E293B]/60">
                <span className="text-slate-400">Internal Transaction ID:</span>
                <span className="font-mono font-bold text-emerald-400">{viewingDeposit.customId}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1E293B]/60">
                <span className="text-slate-400">Date Received:</span>
                <span className="font-mono">{new Date(viewingDeposit.date).toISOString().slice(0, 10)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1E293B]/60">
                <span className="text-slate-400">Depositor Name:</span>
                <span className="font-bold text-white">{viewingDeposit.depositorName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1E293B]/60">
                <span className="text-slate-400">Amount Received:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  KES {Number(viewingDeposit.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1E293B]/60">
                <span className="text-slate-400">Classification:</span>
                <span className="font-medium">{viewingDeposit.transactionType}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1E293B]/60">
                <span className="text-slate-400">Receiving Account:</span>
                <span className="text-slate-200">{viewingDeposit.receivingAccount}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1E293B]/60">
                <span className="text-slate-400">Payment Method:</span>
                <span>{viewingDeposit.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1E293B]/60">
                <span className="text-slate-400">External Reference:</span>
                <span className="font-mono text-emerald-300 font-bold">{viewingDeposit.reference || '-'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1E293B]/60">
                <span className="text-slate-400">Allocation:</span>
                <span>{viewingDeposit.allocationType !== 'None' ? `${viewingDeposit.allocationType}: ${viewingDeposit.allocationRef || '-'}` : 'Unallocated'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1E293B]/60">
                <span className="text-slate-400">Reconciliation Status:</span>
                <span className="font-bold">
                  {viewingDeposit.isReversed ? 'REVERSED' : viewingDeposit.reconciliationStatus}
                </span>
              </div>
              {viewingDeposit.reconciliationNotes && (
                <div className="py-1.5 border-b border-[#1E293B]/60">
                  <span className="text-slate-400 block mb-0.5">Reconciliation Notes:</span>
                  <span className="text-slate-200 italic">{viewingDeposit.reconciliationNotes}</span>
                </div>
              )}
              {viewingDeposit.attachmentName && (
                <div className="flex justify-between py-1.5 border-b border-[#1E293B]/60">
                  <span className="text-slate-400">Attachment:</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-mono">
                    <Paperclip className="w-3 h-3" /> {viewingDeposit.attachmentName}
                  </span>
                </div>
              )}
              {viewingDeposit.isReversed && (
                <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Transaction Reversed
                  </div>
                  <div>Reason: {viewingDeposit.reversalReason || 'Administrative Reversal'}</div>
                  <div className="text-[10px] text-rose-400">Reversed by: {viewingDeposit.reversedBy || 'Admin'}</div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 6. MODAL: RECONCILE AGAINST BANK / M-PESA */}
      {/* --------------------------------------------------------------------- */}
      {isReconcileModalOpen && reconcilingDeposit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-white">
            <div className="flex justify-between items-center pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Account Reconciliation</h3>
              </div>
              <button
                onClick={() => setIsReconcileModalOpen(false)}
                className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#121B2F] border border-[#1E293B] rounded-xl text-xs space-y-1">
              <div><span className="text-slate-400">ID:</span> <span className="font-mono text-emerald-400">{reconcilingDeposit.customId}</span></div>
              <div><span className="text-slate-400">Depositor:</span> <span className="font-bold text-white">{reconcilingDeposit.depositorName}</span></div>
              <div><span className="text-slate-400">Amount:</span> <span className="font-mono font-bold text-white">KES {reconcilingDeposit.amount.toLocaleString()}</span></div>
              <div><span className="text-slate-400">Account:</span> <span className="text-slate-300">{reconcilingDeposit.receivingAccount}</span></div>
              <div><span className="text-slate-400">Reference:</span> <span className="font-mono text-emerald-300">{reconcilingDeposit.reference || '-'}</span></div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Reconciliation Outcome</label>
                <select
                  value={reconcileStatusInput}
                  onChange={(e) => setReconcileStatusInput(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Reconciled">Reconciled (Matched to Bank / M-Pesa Statement)</option>
                  <option value="Discrepancy">Discrepancy (Amount or Reference mismatch)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Reconciliation Notes / Statement Reference</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Confirmed on Equity Bank Statement Page 4, line 12..."
                  value={reconcileNotesInput}
                  onChange={(e) => setReconcileNotesInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1E293B]">
              <button
                type="button"
                onClick={() => setIsReconcileModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitReconcile}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> {isSubmitting ? 'Saving...' : 'Confirm Reconciliation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 7. MODAL: REVERSE DEPOSIT */}
      {/* --------------------------------------------------------------------- */}
      {isReverseModalOpen && reversingDeposit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-rose-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-white">
            <div className="flex justify-between items-center pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2 text-rose-400">
                <RotateCcw className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">Reverse Financial Deposit</h3>
              </div>
              <button
                onClick={() => setIsReverseModalOpen(false)}
                className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl text-xs space-y-1 text-slate-300">
              <div><span className="text-slate-400">ID:</span> <span className="font-mono text-emerald-400">{reversingDeposit.customId}</span></div>
              <div><span className="text-slate-400">Depositor:</span> <span className="font-bold text-white">{reversingDeposit.depositorName}</span></div>
              <div><span className="text-slate-400">Amount:</span> <span className="font-mono font-bold text-rose-400">KES {reversingDeposit.amount.toLocaleString()}</span></div>
              <div><span className="text-slate-400">Account:</span> <span>{reversingDeposit.receivingAccount}</span></div>
            </div>

            <div className="text-xs text-slate-400 bg-[#121B2F] p-3 rounded-xl border border-[#1E293B]">
              <span className="font-bold text-amber-400 block mb-1">Financial Impact Notice:</span>
              Reversing this deposit removes its amount from active company balances, reverts any linked loan repayments, and flags the record as REVERSED. The historical record is preserved in the audit log for governance compliance.
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Reason for Reversal <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={2}
                placeholder="State why this deposit is being reversed (e.g. Duplicate entry, bounced transfer, entered to wrong account)..."
                value={reversalReasonInput}
                onChange={(e) => setReversalReasonInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1E293B]">
              <button
                type="button"
                onClick={() => setIsReverseModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting || !reversalReasonInput.trim()}
                onClick={handleSubmitReverse}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> {isSubmitting ? 'Reversing...' : 'Execute Reversal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
