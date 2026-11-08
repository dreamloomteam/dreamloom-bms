'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Calendar,
  Save,
  Download,
  Printer,
  Edit2,
  Trash2,
  CreditCard,
  History,
  Users,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  MoreVertical,
  Clock,
  FileText,
  Search,
  RefreshCw
} from 'lucide-react';
import {
  ALL_MONTHS,
  AVAILABLE_YEARS,
  normalizeMonthYear,
  getEATISODate
} from '@/lib/dateUtils';

interface ContributionsTabProps {
  contributions: any[];
  members: any[];
  selectedMonth: string;
  selectedYear: number;
  onSelectMonth: (m: string) => void;
  onSelectYear: (y: number) => void;
  canEdit: boolean;
  userEmail: string;
  onRefreshContributions: () => Promise<void>;
  showToast: (msg: string) => void;
}

type ContribSubView =
  | 'monthly-register'
  | 'payment-history'
  | 'member-summary'
  | 'all-cycles';

export default function ContributionsTab({
  contributions,
  members,
  selectedMonth,
  selectedYear,
  onSelectMonth,
  onSelectYear,
  canEdit,
  userEmail,
  onRefreshContributions,
  showToast
}: ContributionsTabProps) {
  const [subView, setSubView] = useState<ContribSubView>('monthly-register');
  const [searchQuery, setSearchQuery] = useState('');
  const [openMobileMenuKey, setOpenMobileMenuKey] = useState<string | null>(null);

  // Add / Edit Contribution Modal State (Section 3.3 & 3.8)
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [entryForm, setEntryForm] = useState({
    memberName: members[0]?.fullName || 'Simon Memia Wanjiru',
    month: selectedMonth === 'All' ? 'December' : selectedMonth,
    year: String(selectedYear),
    expectedAmount: '6000',
    amount: '6000',
    paymentDate: getEATISODate(),
    paymentMethod: 'M-Pesa',
    mpesaRef: '',
    bankRef: '',
    paymentReference: '',
    remarks: '',
    editReason: ''
  });
  const [entryError, setEntryError] = useState<string | null>(null);
  const [isSavingEntry, setIsSavingEntry] = useState(false);

  // Record Additional Payment (Instalment) Modal State (Section 3.7 & 3.8)
  const [isInstalmentModalOpen, setIsInstalmentModalOpen] = useState(false);
  const [instalmentTarget, setInstalmentTarget] = useState<any | null>(null);
  const [instalmentForm, setInstalmentForm] = useState({
    amount: '',
    paymentDate: getEATISODate(),
    paymentMethod: 'M-Pesa',
    mpesaRef: '',
    bankRef: '',
    remarks: ''
  });
  const [instalmentError, setInstalmentError] = useState<string | null>(null);
  const [isSavingInstalment, setIsSavingInstalment] = useState(false);

  // Edit Individual Instalment Payment Modal State
  const [editingPaymentTarget, setEditingPaymentTarget] = useState<any | null>(null);
  const [editPaymentForm, setEditPaymentForm] = useState({
    amount: '',
    paymentDate: getEATISODate(),
    paymentMethod: 'M-Pesa',
    reference: '',
    remarks: '',
    reason: ''
  });
  const [isSavingPaymentEdit, setIsSavingPaymentEdit] = useState(false);

  // Delete / Reverse Contribution Confirmation Modal State
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<any | null>(null);
  const [deleteMode, setDeleteMode] = useState<'reverse_payments' | 'delete_record'>('reverse_payments');
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeletingContrib, setIsDeletingContrib] = useState(false);

  // Reverse Individual Instalment Confirmation Modal State
  const [reversePaymentTarget, setReversePaymentTarget] = useState<any | null>(null);
  const [reversePaymentReason, setReversePaymentReason] = useState('');
  const [isReversingPayment, setIsReversingPayment] = useState(false);

  // View Payment History Modal for a Specific Member Obligation
  const [historyModalTarget, setHistoryModalTarget] = useState<any | null>(null);

  const activeMonth = selectedMonth === 'All' ? 'December' : selectedMonth;
  const activeYear = selectedYear;

  // Normalize all contribution records from props
  const normalizedContributions = useMemo(() => {
    return contributions.map(c => {
      const norm = normalizeMonthYear(c.monthName || c.month, c.year, c.monthYear || c.month);
      const isPayout = (Number(c.payout) || 0) > 0;
      const paidAmt = Number(c.amount) || 0;
      const rawExpected = Number(c.expectedAmount);
      const defaultExpected =
        norm.year === 2025 && (norm.monthName === 'October' || norm.monthName === 'November')
          ? 5025
          : 6000;
      const expectedAmt = isPayout
        ? 0
        : !isNaN(rawExpected) && rawExpected > 0
        ? rawExpected
        : paidAmt + (Number(c.unsettled) || 0) > 0
        ? paidAmt + (Number(c.unsettled) || 0)
        : defaultExpected;
      const unsettledAmt = isPayout ? 0 : Math.max(0, expectedAmt - paidAmt);
      const creditBalance = isPayout ? 0 : Math.max(0, paidAmt - expectedAmt);
      const status = isPayout
        ? 'Payout'
        : paidAmt >= expectedAmt && expectedAmt > 0
        ? 'Fully Paid'
        : paidAmt > 0
        ? 'Partially Paid'
        : 'Unpaid';

      return {
        ...c,
        canonicalMonth: norm.monthName,
        canonicalYear: norm.year,
        monthYearShort: norm.monthYearShort,
        monthYearLong: norm.monthYearLong,
        expectedAmount: expectedAmt,
        amount: paidAmt,
        unsettled: unsettledAmt,
        creditBalance,
        status,
        paymentDate: c.paymentDate || (paidAmt > 0 ? norm.defaultDateStr : '-'),
        paymentMethod: c.paymentMethod || 'M-Pesa',
        paymentReference:
          c.paymentReference || c.mpesaRef || c.bankRef || (paidAmt > 0 ? `REF-${c.id}` : '-'),
        payments: Array.isArray(c.payments) ? c.payments : []
      };
    });
  }, [contributions]);

  // Build the 7-member Monthly Contribution Register for (activeMonth, activeYear)
  const monthlyMemberRows = useMemo(() => {
    const defaultExpected =
      activeYear === 2025 && (activeMonth === 'October' || activeMonth === 'November')
        ? 5025
        : 6000;

    return members.map(m => {
      const match = normalizedContributions.find(
        c =>
          !c.payout &&
          c.canonicalMonth.toLowerCase() === activeMonth.toLowerCase() &&
          c.canonicalYear === activeYear &&
          (c.memberId === m.dbId ||
            c.member?.toLowerCase().trim() === m.fullName.toLowerCase().trim() ||
            c.member?.toLowerCase().includes(m.fullName.toLowerCase().trim()) ||
            m.fullName.toLowerCase().includes((c.member || '').toLowerCase().trim()) ||
            (m.fullName.toLowerCase().includes('simon') && (c.customId === 'CNT-016' || c.id === 359)))
      );

      if (match) {
        return {
          ...match,
          memberId: m.dbId || match.memberId,
          memberName: m.fullName,
          canonicalMonth: activeMonth,
          canonicalYear: activeYear
        };
      }

      return {
        id: null,
        dbId: null,
        customId: null,
        memberId: m.dbId,
        memberName: m.fullName,
        canonicalMonth: activeMonth,
        canonicalYear: activeYear,
        monthYearShort: `${activeMonth.slice(0, 3)} ${activeYear}`,
        expectedAmount: defaultExpected,
        amount: 0,
        unsettled: defaultExpected,
        creditBalance: 0,
        paymentDate: '-',
        paymentMethod: 'M-Pesa',
        mpesaRef: '',
        bankRef: '',
        paymentReference: '-',
        status: 'Unpaid',
        remarks: `Monthly Obligation (${activeMonth} ${activeYear})`,
        payments: []
      };
    });
  }, [members, normalizedContributions, activeMonth, activeYear]);

  // Summary metrics for the currently displayed month & year
  const monthlySummary = useMemo(() => {
    const totalExpected = monthlyMemberRows.reduce((s, r) => s + r.expectedAmount, 0);
    const totalPaid = monthlyMemberRows.reduce((s, r) => s + r.amount, 0);
    const totalOutstanding = monthlyMemberRows.reduce((s, r) => s + r.unsettled, 0);
    const totalCredit = monthlyMemberRows.reduce((s, r) => s + r.creditBalance, 0);
    const fullyPaidCount = monthlyMemberRows.filter(r => r.status === 'Fully Paid').length;
    const partialCount = monthlyMemberRows.filter(r => r.status === 'Partially Paid').length;
    const unpaidCount = monthlyMemberRows.filter(r => r.status === 'Unpaid').length;

    return {
      totalExpected,
      totalPaid,
      totalOutstanding,
      totalCredit,
      fullyPaidCount,
      partialCount,
      unpaidCount
    };
  }, [monthlyMemberRows]);

  // All payment instalment transactions across all obligations
  const allPaymentTransactions = useMemo(() => {
    const list: any[] = [];
    for (const c of normalizedContributions) {
      if (c.payout > 0) continue;
      if (Array.isArray(c.payments) && c.payments.length > 0) {
        for (const p of c.payments) {
          list.push({
            id: p.id,
            isInstalmentRow: true,
            contributionId: c.dbId || c.id,
            parentRow: c,
            memberName: c.member || c.memberName,
            month: c.canonicalMonth,
            year: c.canonicalYear,
            amount: Number(p.amount) || 0,
            paymentDate: p.paymentDate || c.paymentDate,
            paymentMethod: p.paymentMethod || 'M-Pesa',
            reference: p.reference || p.mpesaRef || p.bankRef || '-',
            remarks: p.remarks || c.remarks || ''
          });
        }
      } else if (c.amount > 0) {
        list.push({
          id: `legacy-${c.id}`,
          isInstalmentRow: false,
          contributionId: c.dbId || c.id,
          parentRow: c,
          memberName: c.member || c.memberName,
          month: c.canonicalMonth,
          year: c.canonicalYear,
          amount: c.amount,
          paymentDate: c.paymentDate,
          paymentMethod: c.paymentMethod || 'M-Pesa',
          reference: c.paymentReference || `REF-${c.id}`,
          remarks: c.remarks || c.notes || ''
        });
      }
    }
    return list.reverse();
  }, [normalizedContributions]);

  // Open Add / Edit Contribution Modal (Section 3.3)
  const handleOpenAddModal = (rowToEdit?: any) => {
    setEntryError(null);
    setOpenMobileMenuKey(null);
    if (rowToEdit) {
      setEditingRecord(rowToEdit);
      const existingRef =
        rowToEdit.paymentReference && rowToEdit.paymentReference !== '-'
          ? rowToEdit.paymentReference
          : '';
      setEntryForm({
        memberName: rowToEdit.memberName || rowToEdit.member || members[0]?.fullName || 'Simon Memia Wanjiru',
        month: rowToEdit.canonicalMonth || activeMonth,
        year: String(rowToEdit.canonicalYear || activeYear),
        expectedAmount: String(rowToEdit.expectedAmount ?? 6000),
        amount: String(rowToEdit.amount ?? 0),
        paymentDate:
          rowToEdit.paymentDate && rowToEdit.paymentDate !== '-'
            ? rowToEdit.paymentDate
            : getEATISODate(),
        paymentMethod: rowToEdit.paymentMethod || 'M-Pesa',
        mpesaRef: rowToEdit.mpesaRef || (rowToEdit.paymentMethod !== 'Bank Transfer' ? existingRef : ''),
        bankRef: rowToEdit.bankRef || (rowToEdit.paymentMethod === 'Bank Transfer' ? existingRef : ''),
        paymentReference: existingRef,
        remarks: rowToEdit.remarks || rowToEdit.notes || '',
        editReason: ''
      });
    } else {
      const defMonth = selectedMonth === 'All' ? 'December' : selectedMonth;
      const defYear = selectedYear;
      const defExp =
        defYear === 2025 && (defMonth === 'October' || defMonth === 'November') ? 5025 : 6000;
      setEditingRecord(null);
      setEntryForm({
        memberName: members[0]?.fullName || 'Simon Memia Wanjiru',
        month: defMonth,
        year: String(defYear),
        expectedAmount: String(defExp),
        amount: String(defExp),
        paymentDate: getEATISODate(),
        paymentMethod: 'M-Pesa',
        mpesaRef: '',
        bankRef: '',
        paymentReference: '',
        remarks: `Monthly Contribution (${defMonth} ${defYear})`,
        editReason: ''
      });
    }
    setIsEntryModalOpen(true);
  };

  const handleSaveContributionEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setEntryError(null);

    const expVal = Number(entryForm.expectedAmount);
    const paidVal = Number(entryForm.amount);
    const yearVal = Number(entryForm.year);

    if (!entryForm.memberName) {
      setEntryError('Member Name is required.');
      return;
    }
    if (!entryForm.month) {
      setEntryError('Contribution Month is required.');
      return;
    }
    if (!entryForm.year || isNaN(yearVal) || yearVal < 2000 || yearVal > 2100) {
      setEntryError('Valid Contribution Year is required.');
      return;
    }
    if (isNaN(expVal) || expVal < 0) {
      setEntryError('Expected Contribution cannot be negative.');
      return;
    }
    if (isNaN(paidVal) || paidVal < 0) {
      setEntryError('Amount Contributed cannot be negative.');
      return;
    }
    if (paidVal > 0 && !entryForm.paymentDate) {
      setEntryError('Actual Payment Date is required when recording a payment.');
      return;
    }

    setIsSavingEntry(true);
    try {
      const matchedMember = members.find(
        m => m.fullName.toLowerCase().trim() === entryForm.memberName.toLowerCase().trim()
      );
      const unsettledVal = Math.max(0, expVal - paidVal);

      const isExistingInDb = Boolean(editingRecord && (editingRecord.dbId || editingRecord.customId || editingRecord.id));
      const method = isExistingInDb ? 'PUT' : 'POST';
      const combinedRef =
        entryForm.mpesaRef.trim() ||
        entryForm.bankRef.trim() ||
        entryForm.paymentReference.trim() ||
        undefined;

      const res = await fetch('/api/contributions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRecord?.dbId || undefined,
          customId: editingRecord?.customId || editingRecord?.id || undefined,
          memberId: matchedMember?.dbId || matchedMember?.id,
          memberName: entryForm.memberName,
          month: entryForm.month,
          year: yearVal,
          expectedAmount: expVal,
          amount: paidVal,
          unsettled: unsettledVal,
          paymentDate: entryForm.paymentDate,
          paymentMethod: entryForm.paymentMethod,
          mpesaRef: entryForm.mpesaRef.trim() || '',
          bankRef: entryForm.bankRef.trim() || '',
          paymentReference: combinedRef,
          remarks:
            entryForm.remarks.trim() ||
            `Monthly Contribution (Member: ${entryForm.memberName})`,
          editReason: entryForm.editReason.trim() || undefined,
          userEmail,
          createdBy: userEmail,
          updatedBy: userEmail
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setEntryError(data.error || 'Failed to save contribution to PostgreSQL.');
        setIsSavingEntry(false);
        return;
      }

      onSelectMonth(entryForm.month);
      onSelectYear(yearVal);
      await onRefreshContributions();
      setIsEntryModalOpen(false);
      showToast(
        `${editingRecord ? 'Updated' : 'Saved'} ${entryForm.memberName}'s contribution for ${entryForm.month} ${yearVal} (KES ${paidVal.toLocaleString()}).`
      );
    } catch (err: any) {
      setEntryError(err?.message || 'Network error while saving contribution.');
    } finally {
      setIsSavingEntry(false);
    }
  };

  // Open Record Additional Payment (Instalment) Modal (Section 3.7)
  const handleOpenInstalmentModal = (row: any) => {
    setInstalmentError(null);
    setOpenMobileMenuKey(null);
    setInstalmentTarget(row);
    const remainingDue = Math.max(0, (row.expectedAmount || 6000) - (row.amount || 0));
    setInstalmentForm({
      amount: remainingDue > 0 ? String(remainingDue) : '2000',
      paymentDate: getEATISODate(),
      paymentMethod: 'M-Pesa',
      mpesaRef: '',
      bankRef: '',
      remarks: `Instalment payment for ${row.canonicalMonth} ${row.canonicalYear}`
    });
    setIsInstalmentModalOpen(true);
  };

  const handleSaveInstalment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instalmentTarget) return;
    setInstalmentError(null);

    const amt = Number(instalmentForm.amount);
    if (!instalmentForm.amount || isNaN(amt) || amt <= 0) {
      setInstalmentError('Instalment amount must be greater than KES 0.');
      return;
    }
    if (!instalmentForm.paymentDate) {
      setInstalmentError('Actual Payment Date is required.');
      return;
    }

    setIsSavingInstalment(true);
    try {
      const res = await fetch('/api/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'instalment',
          contributionId: instalmentTarget.dbId || undefined,
          customId: instalmentTarget.customId || instalmentTarget.id || undefined,
          memberId: instalmentTarget.memberId,
          memberName: instalmentTarget.memberName,
          month: instalmentTarget.canonicalMonth,
          year: instalmentTarget.canonicalYear,
          expectedAmount: instalmentTarget.expectedAmount,
          amount: amt,
          paymentDate: instalmentForm.paymentDate,
          paymentMethod: instalmentForm.paymentMethod,
          mpesaRef: instalmentForm.mpesaRef.trim() || undefined,
          bankRef: instalmentForm.bankRef.trim() || undefined,
          remarks: instalmentForm.remarks.trim() || 'Contribution instalment payment',
          userEmail,
          createdBy: userEmail
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setInstalmentError(data.error || 'Failed to record instalment payment.');
        setIsSavingInstalment(false);
        return;
      }

      await onRefreshContributions();
      setIsInstalmentModalOpen(false);
      showToast(
        `Instalment of KES ${amt.toLocaleString()} recorded for ${instalmentTarget.memberName} (${instalmentTarget.canonicalMonth} ${instalmentTarget.canonicalYear}). Total Paid: KES ${Number(data.amount).toLocaleString()}.`
      );
    } catch (err: any) {
      setInstalmentError(err?.message || 'Network error while saving instalment.');
    } finally {
      setIsSavingInstalment(false);
    }
  };

  // Open Delete / Reverse Contribution Confirmation Modal
  const handleOpenDeleteModal = (row: any) => {
    setOpenMobileMenuKey(null);
    setDeleteConfirmTarget(row);
    const hasPayments = (Number(row.amount) || 0) > 0 || (Array.isArray(row.payments) && row.payments.length > 0);
    setDeleteMode(hasPayments ? 'reverse_payments' : 'delete_record');
    setDeleteReason('');
  };

  // Execute Confirmed Delete or Payment Reversal on Contribution
  const handleConfirmDeleteContribution = async () => {
    if (!deleteConfirmTarget) return;
    setIsDeletingContrib(true);
    try {
      const row = deleteConfirmTarget;
      const params = new URLSearchParams();
      if (row.customId) params.set('customId', row.customId);
      if (row.dbId || row.id) params.set('id', String(row.dbId || row.id));
      if (row.memberId) params.set('memberId', String(row.memberId));
      if (row.memberName) params.set('memberName', row.memberName);
      if (row.canonicalMonth) params.set('month', row.canonicalMonth);
      if (row.canonicalYear) params.set('year', String(row.canonicalYear));
      params.set('mode', deleteMode);
      params.set('reason', deleteReason.trim());
      params.set('userEmail', userEmail);
      params.set('deletedBy', userEmail);

      const res = await fetch(`/api/contributions?${params.toString()}`, {
        method: 'DELETE'
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Failed to delete or reverse contribution record.');
        setIsDeletingContrib(false);
        return;
      }
      await onRefreshContributions();
      setDeleteConfirmTarget(null);
      if (deleteMode === 'reverse_payments') {
        showToast(
          `Reversed payment(s) for ${row.memberName || row.member} (${row.canonicalMonth} ${row.canonicalYear}). Monthly obligation retained as Unpaid.`
        );
      } else {
        showToast(
          `Deleted contribution record for ${row.memberName || row.member} (${row.canonicalMonth} ${row.canonicalYear}).`
        );
      }
    } catch (e) {
      showToast('Error deleting contribution.');
    } finally {
      setIsDeletingContrib(false);
    }
  };

  // Open Edit Individual Payment Instalment Modal
  const handleOpenEditPaymentModal = (payment: any) => {
    if (!payment.isInstalmentRow && payment.parentRow) {
      // Legacy payment stored directly on the parent Contribution row
      handleOpenAddModal(payment.parentRow);
      return;
    }
    setEditingPaymentTarget(payment);
    setEditPaymentForm({
      amount: String(payment.amount || 0),
      paymentDate: payment.paymentDate && payment.paymentDate !== '-' ? payment.paymentDate : getEATISODate(),
      paymentMethod: payment.paymentMethod || 'M-Pesa',
      reference: payment.reference && payment.reference !== '-' ? payment.reference : '',
      remarks: payment.remarks || '',
      reason: ''
    });
  };

  const handleSavePaymentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPaymentTarget) return;
    setIsSavingPaymentEdit(true);
    try {
      const res = await fetch('/api/contributions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit_payment',
          paymentId: editingPaymentTarget.id,
          amount: Number(editPaymentForm.amount),
          paymentDate: editPaymentForm.paymentDate,
          paymentMethod: editPaymentForm.paymentMethod,
          paymentReference: editPaymentForm.reference.trim(),
          mpesaRef: editPaymentForm.paymentMethod === 'M-Pesa' ? editPaymentForm.reference.trim() : undefined,
          bankRef: editPaymentForm.paymentMethod === 'Bank Transfer' ? editPaymentForm.reference.trim() : undefined,
          remarks: editPaymentForm.remarks.trim(),
          reason: editPaymentForm.reason.trim() || undefined,
          userEmail,
          updatedBy: userEmail
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Failed to update instalment payment.');
        setIsSavingPaymentEdit(false);
        return;
      }
      await onRefreshContributions();
      setEditingPaymentTarget(null);
      setHistoryModalTarget(null);
      showToast('Instalment payment updated and monthly obligation recalculated.');
    } catch (err) {
      showToast('Error updating instalment payment.');
    } finally {
      setIsSavingPaymentEdit(false);
    }
  };

  // Open Confirmation Modal for Reversing a Single Instalment Payment
  const handleRequestReversePayment = (payment: any) => {
    if (!payment.isInstalmentRow && payment.parentRow && String(payment.id).startsWith('legacy-')) {
      handleOpenDeleteModal(payment.parentRow);
      return;
    }
    setReversePaymentTarget(payment);
    setReversePaymentReason('');
  };

  const handleConfirmReversePayment = async () => {
    if (!reversePaymentTarget) return;
    setIsReversingPayment(true);
    try {
      const paymentId = reversePaymentTarget.id;
      const res = await fetch(
        `/api/contributions?paymentId=${encodeURIComponent(paymentId)}&reason=${encodeURIComponent(reversePaymentReason.trim())}&userEmail=${encodeURIComponent(userEmail)}&deletedBy=${encodeURIComponent(userEmail)}`,
        { method: 'DELETE' }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Failed to reverse instalment.');
        setIsReversingPayment(false);
        return;
      }
      await onRefreshContributions();
      setReversePaymentTarget(null);
      setHistoryModalTarget(null);
      showToast('Instalment payment reversed and monthly obligation recalculated.');
    } catch (e) {
      showToast('Error reversing instalment.');
    } finally {
      setIsReversingPayment(false);
    }
  };

  const handleExportMonthlyCSV = () => {
    const headers = [
      'Member Name',
      'Contribution Month',
      'Contribution Year',
      'Expected Contribution (KES)',
      'Amount Paid (KES)',
      'Outstanding Contribution (KES)',
      'Credit / Advance (KES)',
      'Payment Date',
      'Payment Reference',
      'Payment Status'
    ];
    const lines = [
      headers.join(','),
      ...monthlyMemberRows.map(r =>
        [
          `"${r.memberName}"`,
          r.canonicalMonth,
          r.canonicalYear,
          r.expectedAmount,
          r.amount,
          r.unsettled,
          r.creditBalance,
          r.paymentDate,
          `"${r.paymentReference}"`,
          r.status
        ].join(',')
      )
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dreamloom_contributions_${activeMonth}_${activeYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${activeMonth} ${activeYear} Contributions CSV`);
  };

  const renderContribStatusBadge = (status: string) => {
    if (status === 'Fully Paid') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Fully Paid
        </span>
      );
    }
    if (status === 'Partially Paid') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Partially Paid
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
        Unpaid
      </span>
    );
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Month & Year Navigation Bar + Sub-Navigation (Section 3.2 & Section 8) */}
      <div className="bg-[#0F172A] border border-slate-800/90 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'monthly-register', label: 'Monthly Contributions Register', icon: Calendar },
            { id: 'payment-history', label: 'Payment History (Instalments)', icon: History },
            { id: 'member-summary', label: 'Member Contribution Summary', icon: Users },
            { id: 'all-cycles', label: 'All Cycles Ledger', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            const active = subView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubView(tab.id as ContribSubView)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Authoritative Month & Year Selectors (Section 3.2) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-[#070D18] border border-slate-700 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400 font-semibold">Period:</span>
            <select
              value={activeMonth}
              onChange={e => onSelectMonth(e.target.value)}
              className="bg-transparent text-emerald-400 font-extrabold text-xs focus:outline-none cursor-pointer"
              aria-label="Select Contribution Month"
            >
              {ALL_MONTHS.map(m => (
                <option key={m} value={m} className="bg-[#0F172A] text-white">
                  {m}
                </option>
              ))}
            </select>
            <select
              value={activeYear}
              onChange={e => onSelectYear(Number(e.target.value))}
              className="bg-transparent text-amber-400 font-extrabold text-xs focus:outline-none cursor-pointer"
              aria-label="Select Contribution Year"
            >
              {AVAILABLE_YEARS.map(y => (
                <option key={y} value={y} className="bg-[#0F172A] text-white">
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Jump Buttons for Key Historical Months */}
          <button
            onClick={() => {
              onSelectMonth('December');
              onSelectYear(2025);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              activeMonth === 'December' && activeYear === 2025
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-800/70 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            Dec 2025
          </button>

          {canEdit && (
            <button
              onClick={() => handleOpenAddModal()}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold tracking-wide shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>ADD CONTRIBUTION</span>
            </button>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SUBVIEW 1: MONTHLY CONTRIBUTIONS REGISTER (Section 3.5, 3.6, 3.7)     */}
      {/* ===================================================================== */}
      {subView === 'monthly-register' && (
        <div className="space-y-6">
          {/* Monthly KPI Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Selected Period Expected ({activeMonth} {activeYear})
              </span>
              <p className="text-xl font-black text-white mt-1">
                KES {monthlySummary.totalExpected.toLocaleString()}
              </p>
              <span className="text-[11px] text-slate-500">
                7 Registered Dreamloom Members
              </span>
            </div>

            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Collected ({activeMonth} {activeYear})
              </span>
              <p className="text-xl font-black text-emerald-400 mt-1">
                KES {monthlySummary.totalPaid.toLocaleString()}
              </p>
              <span className="text-[11px] text-emerald-500/80">
                {monthlySummary.fullyPaidCount} Fully Paid • {monthlySummary.partialCount} Partial
              </span>
            </div>

            <div className="bg-[#0F172A] border border-amber-500/30 rounded-2xl p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Outstanding Contribution ({activeMonth} {activeYear})
              </span>
              <p className="text-xl font-black text-amber-400 mt-1">
                KES {monthlySummary.totalOutstanding.toLocaleString()}
              </p>
              <span className="text-[11px] text-slate-400">
                {monthlySummary.unpaidCount} Unpaid • {monthlySummary.partialCount} Partially Paid
              </span>
            </div>

            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Excess / Advance Credit ({activeMonth} {activeYear})
              </span>
              <p className="text-xl font-black text-blue-400 mt-1">
                KES {monthlySummary.totalCredit.toLocaleString()}
              </p>
              <span className="text-[11px] text-slate-500">
                Synced with Member Balances
              </span>
            </div>
          </div>

          {/* 10-Column Monthly Contributions Register Table (Section 3.5 & 3.6) */}
          <div className="bg-[#0F172A] border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-white">
                  {activeMonth} {activeYear} — Member Contributions Register
                </h2>
                <p className="text-xs text-slate-400">
                  Authoritative monthly register supporting single payments, multiple instalments,
                  and instant database synchronisation
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportMonthlyCSV}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                {canEdit && (
                  <button
                    onClick={() => handleOpenAddModal()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>ADD CONTRIBUTION</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#090F1D] border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-4">1. Member Name</th>
                    <th className="py-3.5 px-4">2. Contribution Month</th>
                    <th className="py-3.5 px-4">3. Contribution Year</th>
                    <th className="py-3.5 px-4 text-right">4. Expected (KES)</th>
                    <th className="py-3.5 px-4 text-right">5. Amount Paid (KES)</th>
                    <th className="py-3.5 px-4 text-right">6. Outstanding (KES)</th>
                    <th className="py-3.5 px-4">7. Payment Date</th>
                    <th className="py-3.5 px-4">8. Payment Reference</th>
                    <th className="py-3.5 px-4 text-center">9. Payment Status</th>
                    <th className="py-3.5 px-4 text-center sticky right-0 bg-[#090F1D] z-10 border-l border-slate-800/80">
                      10. Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {monthlyMemberRows.map((row, idx) => {
                    const hasDbRecord = Boolean(row.dbId || row.customId || row.id || (row.amount && row.amount > 0));
                    const rowMenuKey = `monthly-${row.memberId || idx}`;
                    return (
                      <tr key={row.memberId || idx} className="hover:bg-slate-800/35 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">{row.memberName}</td>
                        <td className="py-3.5 px-4 text-emerald-400 font-semibold">
                          {row.canonicalMonth}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-semibold">
                          {row.canonicalYear}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-200">
                          {row.expectedAmount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400">
                          {row.amount.toLocaleString()}
                          {row.payments && row.payments.length > 1 && (
                            <span className="block text-[10px] text-teal-300 font-normal">
                              ({row.payments.length} instalments)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold">
                          <span className={row.unsettled > 0 ? 'text-amber-400' : 'text-slate-500'}>
                            {row.unsettled.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                          {row.paymentDate || '-'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-emerald-400">
                          {row.paymentReference || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {renderContribStatusBadge(row.status)}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap sticky right-0 bg-[#0F172A] z-10 border-l border-slate-800/80">
                          {/* Desktop Actions */}
                          <div className="hidden sm:flex items-center justify-center gap-1.5">
                            {canEdit && (
                              <>
                                <button
                                  onClick={() => handleOpenAddModal(row)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-lg text-[11px] font-bold"
                                  title="Edit Contribution"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleOpenInstalmentModal(row)}
                                  className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-bold"
                                  title="Record Additional Instalment Payment"
                                >
                                  + Pay
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => setHistoryModalTarget(row)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold"
                              title="View Payment Instalment History"
                            >
                              History
                            </button>
                            {canEdit && (
                              <button
                                onClick={() => handleOpenDeleteModal(row)}
                                disabled={!hasDbRecord && row.amount === 0 && !row.customId}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                                  hasDbRecord || row.amount > 0 || row.customId
                                    ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border-rose-500/30'
                                    : 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed'
                                }`}
                                title={
                                  hasDbRecord || row.amount > 0 || row.customId
                                    ? 'Delete or Reverse Contribution'
                                    : 'No saved contribution record to delete'
                                }
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>

                          {/* Mobile Three-Dot Menu + Quick Buttons */}
                          <div className="flex sm:hidden items-center justify-center gap-1 relative">
                            {canEdit && (
                              <button
                                onClick={() => handleOpenAddModal(row)}
                                className="px-2 py-1 bg-slate-800 text-emerald-400 rounded text-[11px] font-bold"
                              >
                                Edit
                              </button>
                            )}
                            <button
                              onClick={() =>
                                setOpenMobileMenuKey(
                                  openMobileMenuKey === rowMenuKey ? null : rowMenuKey
                                )
                              }
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                              aria-label="More actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {openMobileMenuKey === rowMenuKey && (
                              <div className="absolute right-0 top-8 z-30 w-44 bg-[#090F1D] border border-slate-700 rounded-xl shadow-2xl py-1 text-left">
                                {canEdit && (
                                  <>
                                    <button
                                      onClick={() => handleOpenAddModal(row)}
                                      className="w-full px-3 py-2 text-xs text-emerald-400 hover:bg-slate-800 flex items-center gap-2 font-bold"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                      <span>Edit Contribution</span>
                                    </button>
                                    <button
                                      onClick={() => handleOpenInstalmentModal(row)}
                                      className="w-full px-3 py-2 text-xs text-teal-300 hover:bg-slate-800 flex items-center gap-2 font-bold"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Add Instalment (+Pay)</span>
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => {
                                    setOpenMobileMenuKey(null);
                                    setHistoryModalTarget(row);
                                  }}
                                  className="w-full px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                                >
                                  <History className="w-3.5 h-3.5" />
                                  <span>Payment History</span>
                                </button>
                                {canEdit && (hasDbRecord || row.amount > 0 || row.customId) && (
                                  <button
                                    onClick={() => handleOpenDeleteModal(row)}
                                    className="w-full px-3 py-2 text-xs text-rose-400 hover:bg-slate-800 flex items-center gap-2 font-bold border-t border-slate-800"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete / Reverse</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
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

      {/* ===================================================================== */}
      {/* SUBVIEW 2: PAYMENT HISTORY / INSTALMENTS LEDGER (Section 3.7 & 8)     */}
      {/* ===================================================================== */}
      {subView === 'payment-history' && (
        <div className="bg-[#0F172A] border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-white">
                Contribution Payment & Instalment History ({allPaymentTransactions.length})
              </h2>
              <p className="text-xs text-slate-400">
                Complete transaction log of individual contribution payments and instalments
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#090F1D] border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3.5 px-4">Actual Payment Date</th>
                  <th className="py-3.5 px-4">Member Name</th>
                  <th className="py-3.5 px-4">Contribution Period</th>
                  <th className="py-3.5 px-4 text-right">Amount Paid (KES)</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4">Remarks</th>
                  {canEdit && (
                    <th className="py-3.5 px-4 text-center sticky right-0 bg-[#090F1D] z-10 border-l border-slate-800/80">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {allPaymentTransactions.slice(0, 150).map((t, idx) => (
                  <tr key={`${t.id}-${idx}`} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{t.paymentDate}</td>
                    <td className="py-3 px-4 font-bold text-white">{t.memberName}</td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold whitespace-nowrap">
                      {t.month} {t.year}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-emerald-400 whitespace-nowrap">
                      KES {t.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{t.paymentMethod}</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">{t.reference}</td>
                    <td className="py-3 px-4 text-slate-400">{t.remarks}</td>
                    {canEdit && (
                      <td className="py-3 px-4 text-center whitespace-nowrap sticky right-0 bg-[#0F172A] z-10 border-l border-slate-800/80">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditPaymentModal(t)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-lg text-[11px] font-bold"
                            title="Edit Payment Transaction"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleRequestReversePayment(t)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 rounded-lg text-[11px] font-bold"
                            title="Delete / Reverse Payment Transaction"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBVIEW 3: MEMBER CONTRIBUTION SUMMARY (Section 8)                    */}
      {/* ===================================================================== */}
      {subView === 'member-summary' && (
        <div className="bg-[#0F172A] border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800">
            <h2 className="text-lg font-extrabold text-white">
              Cumulative Member Contribution Summary
            </h2>
            <p className="text-xs text-slate-400">
              Synchronised directly with Member Balances, Unsettled Dues, and Dashboard totals
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#090F1D] border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3.5 px-4">Member Name</th>
                  <th className="py-3.5 px-4 text-right">Total Paid Contributions (KES)</th>
                  <th className="py-3.5 px-4 text-right">Total Unsettled Dues (KES)</th>
                  <th className="py-3.5 px-4 text-right">Advance / Credit (KES)</th>
                  <th className="py-3.5 px-4 text-right">Equity Share %</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {members.map(m => {
                  const mRows = normalizedContributions.filter(
                    c =>
                      !c.payout &&
                      (c.memberId === m.dbId ||
                        c.member?.toLowerCase().trim() === m.fullName.toLowerCase().trim())
                  );
                  const totalPaid = mRows.reduce((s, r) => s + r.amount, 0);
                  const totalUnsettled = mRows.reduce((s, r) => {
                    return s + (Number(r.unsettled) || 0);
                  }, 0);
                  const totalCredit = mRows.reduce((s, r) => s + (Number(r.creditBalance) || 0), 0);

                  return (
                    <tr key={m.id || m.fullName} className="hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-bold text-white">{m.fullName}</td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400">
                        KES {totalPaid.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-amber-400">
                        KES {m.unsettledContributions?.toLocaleString() || totalUnsettled.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-blue-400">
                        KES {totalCredit.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-200">
                        {m.shares}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {(m.unsettledContributions || 0) === 0 ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                            Up to Date
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400">
                            Has Arrears
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBVIEW 4: ALL CYCLES HISTORICAL LEDGER                               */}
      {/* ===================================================================== */}
      {subView === 'all-cycles' && (
        <div className="bg-[#0F172A] border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-white">
                Complete Historical Contributions & Payouts Ledger ({normalizedContributions.length})
              </h2>
            </div>
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search member, month, year..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#070D18] border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-[#090F1D] z-20">
                <tr className="border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Month & Year</th>
                  <th className="py-3 px-4">Member / Description</th>
                  <th className="py-3 px-4 text-right">Expected</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Unsettled</th>
                  <th className="py-3 px-4 text-right">Payout</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  {canEdit && (
                    <th className="py-3 px-4 text-center sticky right-0 bg-[#090F1D] z-10 border-l border-slate-800/80">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {normalizedContributions
                  .filter(c => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      (c.member || '').toLowerCase().includes(q) ||
                      c.canonicalMonth.toLowerCase().includes(q) ||
                      String(c.canonicalYear).includes(q) ||
                      (c.id || '').toLowerCase().includes(q)
                    );
                  })
                  .map(c => (
                    <tr key={c.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-mono text-slate-400">{c.id}</td>
                      <td className="py-2.5 px-4 text-emerald-400 font-semibold whitespace-nowrap">
                        {c.canonicalMonth} {c.canonicalYear}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-white">{c.member}</td>
                      <td className="py-2.5 px-4 text-right">
                        {c.expectedAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-400">
                        {c.amount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-amber-400">
                        {c.unsettled.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right text-blue-400">
                        {(c.payout || 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {c.payout > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                            Payout
                          </span>
                        ) : (
                          renderContribStatusBadge(c.status)
                        )}
                      </td>
                      {canEdit && (
                        <td className="py-2.5 px-4 text-center whitespace-nowrap sticky right-0 bg-[#0F172A] z-10 border-l border-slate-800/80">
                          {c.payout > 0 ? (
                            <span className="text-[10px] text-slate-500 font-semibold">Protected Payout</span>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenAddModal({ ...c, memberName: c.member })}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-lg text-[11px] font-bold"
                                title="Edit Contribution"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleOpenDeleteModal({ ...c, memberName: c.member })}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 rounded-lg text-[11px] font-bold"
                                title="Delete or Reverse Contribution"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
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

      {/* ===================================================================== */}
      {/* MODAL 1: ADD / EDIT CONTRIBUTION FORM (Section 3.3)                   */}
      {/* ===================================================================== */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0F172A] border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-white">
                  {editingRecord ? 'Edit Monthly Contribution' : 'Add Member Contribution'}
                </h3>
                <p className="text-xs text-slate-400">
                  {editingRecord
                    ? `Editing ${editingRecord.customId || editingRecord.id || 'obligation'} — updates member balances and Dashboard immediately`
                    : `Defaults to currently selected period (${entryForm.month} ${entryForm.year}) and saves directly to PostgreSQL`}
                </p>
              </div>
              <button
                onClick={() => setIsEntryModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold px-2.5 py-1 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            {entryError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{entryError}</span>
              </div>
            )}

            <form onSubmit={handleSaveContributionEntry} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-300 mb-1">1. Member Name *</label>
                  <select
                    value={entryForm.memberName}
                    onChange={e => setEntryForm({ ...entryForm, memberName: e.target.value })}
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold"
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
                    2. Contribution Month *
                  </label>
                  <select
                    value={entryForm.month}
                    onChange={e => setEntryForm({ ...entryForm, month: e.target.value })}
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-emerald-400 font-extrabold"
                    required
                  >
                    {ALL_MONTHS.map(m => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    3. Contribution Year *
                  </label>
                  <select
                    value={entryForm.year}
                    onChange={e => setEntryForm({ ...entryForm, year: e.target.value })}
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-amber-400 font-extrabold"
                    required
                  >
                    {AVAILABLE_YEARS.map(y => (
                      <option key={y} value={String(y)}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    4. Expected Contribution (KES) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={entryForm.expectedAmount}
                    onChange={e =>
                      setEntryForm({ ...entryForm, expectedAmount: e.target.value })
                    }
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    5. Amount Contributed (KES) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={entryForm.amount}
                    onChange={e => setEntryForm({ ...entryForm, amount: e.target.value })}
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-emerald-400 font-extrabold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    6. Actual Payment Date *
                  </label>
                  <input
                    type="date"
                    value={entryForm.paymentDate}
                    onChange={e => setEntryForm({ ...entryForm, paymentDate: e.target.value })}
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    7. Payment Method *
                  </label>
                  <select
                    value={entryForm.paymentMethod}
                    onChange={e =>
                      setEntryForm({ ...entryForm, paymentMethod: e.target.value })
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
                    8. M-Pesa Transaction Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. QLA92819XK"
                    value={entryForm.mpesaRef}
                    onChange={e => setEntryForm({ ...entryForm, mpesaRef: e.target.value })}
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    9. Bank / General Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EQB-102938"
                    value={entryForm.bankRef}
                    onChange={e => setEntryForm({ ...entryForm, bankRef: e.target.value })}
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">10. Notes / Remarks</label>
                <input
                  type="text"
                  value={entryForm.remarks}
                  onChange={e => setEntryForm({ ...entryForm, remarks: e.target.value })}
                  placeholder="Optional payment notes..."
                  className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                />
              </div>

              {editingRecord && (
                <div>
                  <label className="block font-bold text-amber-400 mb-1">
                    11. Reason for Correction / Edit (Recorded in Audit Log)
                  </label>
                  <input
                    type="text"
                    value={entryForm.editReason}
                    onChange={e => setEntryForm({ ...entryForm, editReason: e.target.value })}
                    placeholder="e.g. Corrected payment date or M-Pesa reference after statement reconciliation"
                    className="w-full bg-[#070D18] border border-amber-500/40 rounded-xl px-3 py-2.5 text-white"
                  />
                </div>
              )}

              {/* Balance Preview */}
              <div className="bg-[#090F1D] border border-slate-800 rounded-xl p-3.5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Calculated Outstanding Balance
                  </span>
                  <span className="text-amber-400 font-extrabold text-sm">
                    KES{' '}
                    {Math.max(
                      0,
                      (Number(entryForm.expectedAmount) || 0) - (Number(entryForm.amount) || 0)
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Resulting Status
                  </span>
                  <span className="text-emerald-400 font-bold">
                    {(Number(entryForm.amount) || 0) >= (Number(entryForm.expectedAmount) || 6000)
                      ? 'Fully Paid'
                      : (Number(entryForm.amount) || 0) > 0
                      ? 'Partially Paid'
                      : 'Unpaid'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEntry}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isSavingEntry ? 'Saving to Database...' : editingRecord ? 'Update Contribution' : 'Save Contribution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: RECORD ADDITIONAL PAYMENT / INSTALMENT (Section 3.7)         */}
      {/* ===================================================================== */}
      {isInstalmentModalOpen && instalmentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0F172A] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-white">
                  Record Contribution Instalment
                </h3>
                <p className="text-xs text-slate-400">
                  {instalmentTarget.memberName} • {instalmentTarget.canonicalMonth}{' '}
                  {instalmentTarget.canonicalYear}
                </p>
              </div>
              <button
                onClick={() => setIsInstalmentModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold px-2.5 py-1 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#090F1D] border border-slate-800 rounded-xl p-3.5 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Expected</span>
                <span className="font-bold text-white">
                  KES {instalmentTarget.expectedAmount.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Paid So Far</span>
                <span className="font-bold text-emerald-400">
                  KES {instalmentTarget.amount.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Remaining Due</span>
                <span className="font-bold text-amber-400">
                  KES {instalmentTarget.unsettled.toLocaleString()}
                </span>
              </div>
            </div>

            {instalmentError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 font-semibold">
                {instalmentError}
              </div>
            )}

            <form onSubmit={handleSaveInstalment} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Instalment Amount (KES) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={instalmentForm.amount}
                    onChange={e =>
                      setInstalmentForm({ ...instalmentForm, amount: e.target.value })
                    }
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-emerald-400 font-extrabold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Actual Payment Date *
                  </label>
                  <input
                    type="date"
                    value={instalmentForm.paymentDate}
                    onChange={e =>
                      setInstalmentForm({ ...instalmentForm, paymentDate: e.target.value })
                    }
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Payment Method</label>
                  <select
                    value={instalmentForm.paymentMethod}
                    onChange={e =>
                      setInstalmentForm({ ...instalmentForm, paymentMethod: e.target.value })
                    }
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                  >
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    M-Pesa / Bank Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RKT81920MA"
                    value={instalmentForm.mpesaRef}
                    onChange={e =>
                      setInstalmentForm({ ...instalmentForm, mpesaRef: e.target.value })
                    }
                    className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Remarks</label>
                <input
                  type="text"
                  value={instalmentForm.remarks}
                  onChange={e =>
                    setInstalmentForm({ ...instalmentForm, remarks: e.target.value })
                  }
                  className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInstalmentModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingInstalment}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold"
                >
                  {isSavingInstalment ? 'Recording...' : 'Record Instalment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: VIEW PAYMENT INSTALMENT HISTORY FOR MEMBER OBLIGATION        */}
      {/* ===================================================================== */}
      {historyModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0F172A] border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Instalment History — {historyModalTarget.memberName}
                </h3>
                <p className="text-xs text-slate-400">
                  {historyModalTarget.canonicalMonth} {historyModalTarget.canonicalYear} • Total
                  Paid: KES {historyModalTarget.amount.toLocaleString()} / Expected: KES{' '}
                  {historyModalTarget.expectedAmount.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setHistoryModalTarget(null)}
                className="text-slate-400 hover:text-white text-sm font-bold px-2.5 py-1 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#090F1D] border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Reference</th>
                    {canEdit && <th className="py-2.5 px-3 text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(!historyModalTarget.payments || historyModalTarget.payments.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
                        {historyModalTarget.amount > 0
                          ? `Single payment of KES ${historyModalTarget.amount.toLocaleString()} recorded on ${historyModalTarget.paymentDate}`
                          : 'No payments recorded for this month yet.'}
                      </td>
                    </tr>
                  ) : (
                    historyModalTarget.payments.map((p: any, idx: number) => (
                      <tr key={p.id || idx}>
                        <td className="py-2.5 px-3 text-white">{p.paymentDate}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                          KES {Number(p.amount).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">{p.paymentMethod}</td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400">
                          {p.reference || p.mpesaRef || p.bankRef || '-'}
                        </td>
                        {canEdit && (
                          <td className="py-2.5 px-3 text-center">
                            {p.id && (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() =>
                                    handleOpenEditPaymentModal({
                                      ...p,
                                      isInstalmentRow: true,
                                      memberName: historyModalTarget.memberName,
                                      month: historyModalTarget.canonicalMonth,
                                      year: historyModalTarget.canonicalYear,
                                      reference: p.reference || p.mpesaRef || p.bankRef || ''
                                    })
                                  }
                                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-[11px]"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() =>
                                    handleRequestReversePayment({
                                      ...p,
                                      isInstalmentRow: true,
                                      memberName: historyModalTarget.memberName,
                                      month: historyModalTarget.canonicalMonth,
                                      year: historyModalTarget.canonicalYear,
                                      reference: p.reference || p.mpesaRef || p.bankRef || '-'
                                    })
                                  }
                                  className="px-2 py-0.5 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 font-bold text-[11px]"
                                >
                                  Reverse
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
      {/* MODAL 4: DELETE / REVERSE CONTRIBUTION CONFIRMATION MODAL             */}
      {/* ===================================================================== */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0F172A] border border-rose-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Confirm Contribution Deletion / Reversal
                  </h3>
                  <p className="text-xs text-slate-400">
                    Review the member, month, and amount before confirming
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="text-slate-400 hover:text-white text-sm font-bold px-2.5 py-1 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Record Identification Banner */}
            <div className="bg-[#090F1D] border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Record Reference:</span>
                <span className="font-mono font-bold text-slate-200">
                  {deleteConfirmTarget.customId || deleteConfirmTarget.id || `ID-${deleteConfirmTarget.dbId}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Member Name:</span>
                <span className="font-extrabold text-white">
                  {deleteConfirmTarget.memberName || deleteConfirmTarget.member}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Contribution Period:</span>
                <span className="font-bold text-emerald-400">
                  {deleteConfirmTarget.canonicalMonth} {deleteConfirmTarget.canonicalYear}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="font-extrabold text-emerald-400">
                  KES {Number(deleteConfirmTarget.amount || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expected Obligation:</span>
                <span className="font-bold text-slate-300">
                  KES {Number(deleteConfirmTarget.expectedAmount || 6000).toLocaleString()}
                </span>
              </div>
              {Array.isArray(deleteConfirmTarget.payments) && deleteConfirmTarget.payments.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Associated Instalments:</span>
                  <span className="font-bold text-teal-300">
                    {deleteConfirmTarget.payments.length} payment record(s)
                  </span>
                </div>
              )}
            </div>

            {/* Safe Action Selector when payments exist */}
            {(Number(deleteConfirmTarget.amount) > 0 ||
              (Array.isArray(deleteConfirmTarget.payments) &&
                deleteConfirmTarget.payments.length > 0)) && (
              <div className="space-y-2 text-xs">
                <label className="block font-bold text-slate-300">
                  Choose Reversal / Deletion Mode:
                </label>
                <label
                  className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer ${
                    deleteMode === 'reverse_payments'
                      ? 'bg-amber-500/10 border-amber-500/50 text-white'
                      : 'bg-[#070D18] border-slate-800 text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="contribDeleteMode"
                    checked={deleteMode === 'reverse_payments'}
                    onChange={() => setDeleteMode('reverse_payments')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-extrabold block text-amber-300">
                      Reverse Payment(s) Only — Keep Monthly Obligation as Unpaid (Recommended)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Reverses the KES {Number(deleteConfirmTarget.amount || 0).toLocaleString()} payment(s) and resets paid amount to KES 0 while preserving the {deleteConfirmTarget.canonicalMonth} {deleteConfirmTarget.canonicalYear} monthly obligation.
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer ${
                    deleteMode === 'delete_record'
                      ? 'bg-rose-500/10 border-rose-500/50 text-white'
                      : 'bg-[#070D18] border-slate-800 text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="contribDeleteMode"
                    checked={deleteMode === 'delete_record'}
                    onChange={() => setDeleteMode('delete_record')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-extrabold block text-rose-400">
                      Delete Entire Contribution Record
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Removes the entire database entry for {deleteConfirmTarget.memberName || deleteConfirmTarget.member} in {deleteConfirmTarget.canonicalMonth} {deleteConfirmTarget.canonicalYear}.
                    </span>
                  </div>
                </label>
              </div>
            )}

            <div className="text-xs">
              <label className="block font-bold text-slate-300 mb-1">
                Reason for Deletion / Reversal (Recorded in Audit Log)
              </label>
              <input
                type="text"
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                placeholder="e.g. Reversing duplicate entry or test payment"
                className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingContrib}
                onClick={handleConfirmDeleteContribution}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-extrabold shadow-lg shadow-rose-500/20 disabled:opacity-50"
              >
                {isDeletingContrib
                  ? 'Processing...'
                  : deleteMode === 'reverse_payments'
                  ? 'Confirm Payment Reversal'
                  : 'Confirm Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 5: CONFIRM REVERSE SINGLE INSTALMENT PAYMENT                    */}
      {/* ===================================================================== */}
      {reversePaymentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0F172A] border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white">
                Confirm Instalment Payment Reversal
              </h3>
              <button
                onClick={() => setReversePaymentTarget(null)}
                className="text-slate-400 hover:text-white text-sm font-bold px-2.5 py-1 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#090F1D] border border-slate-800 rounded-xl p-3.5 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Member:</span>
                <span className="font-bold text-white">{reversePaymentTarget.memberName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Contribution Period:</span>
                <span className="font-bold text-emerald-400">
                  {reversePaymentTarget.month} {reversePaymentTarget.year}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Instalment Amount:</span>
                <span className="font-extrabold text-rose-400">
                  KES {Number(reversePaymentTarget.amount || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Date / Ref:</span>
                <span className="font-mono text-slate-300">
                  {reversePaymentTarget.paymentDate} ({reversePaymentTarget.reference || '-'})
                </span>
              </div>
            </div>

            <p className="text-slate-400 text-[11px]">
              Only this single payment instalment will be reversed. The monthly obligation for{' '}
              <strong className="text-white">
                {reversePaymentTarget.month} {reversePaymentTarget.year}
              </strong>{' '}
              and any other instalments will remain intact and automatically recalculate.
            </p>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Reason for Reversal (Recorded in Audit Log)
              </label>
              <input
                type="text"
                value={reversePaymentReason}
                onChange={e => setReversePaymentReason(e.target.value)}
                placeholder="e.g. Reversing duplicate instalment entry"
                className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setReversePaymentTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isReversingPayment}
                onClick={handleConfirmReversePayment}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-extrabold"
              >
                {isReversingPayment ? 'Reversing...' : 'Confirm Reverse Instalment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 6: EDIT INDIVIDUAL INSTALMENT PAYMENT                           */}
      {/* ===================================================================== */}
      {editingPaymentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0F172A] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Edit Instalment Payment
                </h3>
                <p className="text-slate-400 text-[11px]">
                  {editingPaymentTarget.memberName} • {editingPaymentTarget.month}{' '}
                  {editingPaymentTarget.year}
                </p>
              </div>
              <button
                onClick={() => setEditingPaymentTarget(null)}
                className="text-slate-400 hover:text-white text-sm font-bold px-2.5 py-1 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePaymentEdit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Amount Paid (KES) *</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={editPaymentForm.amount}
                  onChange={e => setEditPaymentForm({ ...editPaymentForm, amount: e.target.value })}
                  className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-extrabold"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Payment Date *</label>
                <input
                  type="date"
                  value={editPaymentForm.paymentDate}
                  onChange={e =>
                    setEditPaymentForm({ ...editPaymentForm, paymentDate: e.target.value })
                  }
                  className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Payment Method</label>
                <select
                  value={editPaymentForm.paymentMethod}
                  onChange={e =>
                    setEditPaymentForm({ ...editPaymentForm, paymentMethod: e.target.value })
                  }
                  className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Transaction Reference</label>
                <input
                  type="text"
                  value={editPaymentForm.reference}
                  onChange={e =>
                    setEditPaymentForm({ ...editPaymentForm, reference: e.target.value })
                  }
                  className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Remarks</label>
                <input
                  type="text"
                  value={editPaymentForm.remarks}
                  onChange={e =>
                    setEditPaymentForm({ ...editPaymentForm, remarks: e.target.value })
                  }
                  className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-amber-400 mb-1">
                  Reason for Correction (Audit Log)
                </label>
                <input
                  type="text"
                  value={editPaymentForm.reason}
                  onChange={e =>
                    setEditPaymentForm({ ...editPaymentForm, reason: e.target.value })
                  }
                  placeholder="Optional reason for editing this payment..."
                  className="w-full bg-[#070D18] border border-amber-500/40 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPaymentTarget(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPaymentEdit}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold"
                >
                  {isSavingPaymentEdit ? 'Saving...' : 'Save Payment Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
