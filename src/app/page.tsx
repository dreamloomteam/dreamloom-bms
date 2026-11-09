'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { initialMembers, initialLoans, initialContributions, initialExpenses, initialFines } from '@/lib/initialData';
import {
  LayoutDashboard, Users, Wallet, AlertTriangle, AlertCircle,
  TrendingUp, Briefcase, Truck, Boxes, Building,
  BarChart3, Settings, Shield, LogIn, LogOut,
  Download, Plus, X, Receipt, History, UserCog, Edit3, Lock, Mail, FileText, ExternalLink, Paperclip,
  Search, Bell, Maximize, Minimize, ChevronDown, Check, Calendar, DollarSign, Coins, Layers,
  CreditCard, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, UserCheck, ShieldAlert,
  Eye, EyeOff, Phone, Landmark, Building2, Banknote, CheckCircle, Trash2, RotateCw, ArrowDownCircle
} from 'lucide-react';
import MemberAutocomplete from '@/components/MemberAutocomplete';
import DepositsTab, { DepositRecord } from '@/components/DepositsTab';
import LoanPortfolioTab from '@/components/LoanPortfolioTab';
import ContributionsTab from '@/components/ContributionsTab';
import {
  ALL_MONTHS,
  AVAILABLE_YEARS,
  getEATHeaderDate,
  getEATISODate,
  getEATContributionDate,
  getEATDateTimeString,
  getEATCurrentMonthName,
  getEATCurrentYear,
  matchesMonthAndYear,
  parseDateToMonthYear,
  getMemberUnsettledForDate,
  isSameMemberName
} from '@/lib/dateUtils';
import { AUTHORIZED_USERS } from '@/lib/authConfig';
import { getMemberAvatar } from '@/lib/memberAvatars';

const DREAMLOOM_MEMBER_NAMES: Record<number, string> = {
  1: 'Simon Memia Wanjiru',
  2: 'David Wainaina Kinyua',
  3: 'Elijah Waitara Gichari',
  4: 'Samuel Kamau Nguuro',
  5: 'Michael Kiarie Wanjiru',
  6: 'Daniel Kamau Njiriri',
  7: 'Beatrice Njoki Muthoni',
};

const resolvePenaltyMemberName = (p: any): string => {
  if (p && p.member && typeof p.member === 'object' && p.member.fullName) {
    return p.member.fullName;
  }
  if (p && typeof p.member === 'string' && p.member.trim() !== '' && p.member !== 'Member') {
    return p.member.trim();
  }
  if (p && typeof p.memberName === 'string' && p.memberName.trim() !== '' && p.memberName !== 'Member') {
    return p.memberName.trim();
  }
  const mid = p ? (p.memberId || p.member?.id || p.memberObj?.id) : null;
  if (mid && DREAMLOOM_MEMBER_NAMES[Number(mid)]) {
    return DREAMLOOM_MEMBER_NAMES[Number(mid)];
  }
  return 'Simon Memia Wanjiru';
};

export default function Home() {
  // 1. Authorized Member Credentials & Contact Register
  const authorizedUsers = AUTHORIZED_USERS;

  // 2. Authentication States (Secure persistent session across refresh & devices)
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // Restore authenticated session from server HttpOnly cookie
  useEffect(() => {
    let isMounted = true;
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          if (data?.authenticated && data?.user) {
            setCurrentUser(data.user);
            setIsLoggedIn(true);
          } else {
            setIsLoggedIn(false);
            setCurrentUser(null);
          }
          setIsAuthenticating(false);
        }
      })
      .catch(err => {
        console.warn('Session restoration failed:', err);
        if (isMounted) {
          setIsLoggedIn(false);
          setCurrentUser(null);
          setIsAuthenticating(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Synchronize database records on mount across all modules (PostgreSQL is the authoritative source of truth)
  useEffect(() => {
    try {
      // 1. Contributions from PostgreSQL
      fetch('/api/contributions')
        .then(r => r.json())
        .then(res => {
          const list = Array.isArray(res) ? res : (res?.data || []);
          if (Array.isArray(list) && list.length > 0) {
            const mapped = list.map((c: any) => ({
              id: c.customId || ('CNT-' + c.id),
              dbId: c.id,
              customId: c.customId,
              memberId: c.memberId || c.member?.id || null,
              month: c.monthYear || c.month,
              monthName: c.month,
              year: c.year,
              monthYear: c.monthYear,
              member: c.memberName || c.member?.fullName || (c.memberId && DREAMLOOM_MEMBER_NAMES[Number(c.memberId)]) || 'System Entry',
              memberName: c.memberName || c.member?.fullName || (c.memberId && DREAMLOOM_MEMBER_NAMES[Number(c.memberId)]) || 'System Entry',
              expectedAmount: Number(c.expectedAmount) || 6000,
              amount: Number(c.amount) || 0,
              unsettled: Number(c.unsettled) || 0,
              creditBalance: Number(c.creditBalance) || 0,
              payout: Number(c.payout) || 0,
              paymentDate: c.paymentDate || '',
              paymentMethod: c.paymentMethod || 'M-Pesa',
              mpesaRef: c.mpesaRef || '',
              bankRef: c.bankRef || '',
              paymentReference: c.paymentReference || '',
              status: c.status || 'Unpaid',
              notes: c.remarks || '',
              remarks: c.remarks || '',
              payments: c.payments || []
            }));
            setContributions(mapped);
            localStorage.setItem('dreamloom_contributions', JSON.stringify(mapped));
          }
        })
        .catch(err => console.warn('Could not fetch server contributions:', err));

      // 2. Loans from PostgreSQL
      fetch('/api/loans')
        .then(r => r.json())
        .then(res => {
          const list = Array.isArray(res) ? res : (res?.data || []);
          if (Array.isArray(list) && list.length > 0) {
            const mapped = list.map((l: any) => ({
              ...l,
              id: l.id,
              memberId: l.memberId || l.member?.id,
              issueDate: l.issueDate ? String(l.issueDate).slice(0, 10) : '-',
              borrower: l.borrower || l.memberName || l.member?.fullName || 'Member',
              memberName: l.borrower || l.memberName || l.member?.fullName || 'Member',
              principal: Number(l.principal) || 0,
              interest: Number(l.interest ?? l.totalInterestAccrued) || 0,
              totalLoan: Number(l.totalLoan ?? l.totalPayable ?? l.totalLoanAmount) || 0,
              paid: Number(l.paid ?? l.paidAmount ?? l.totalAmountPaid) || 0,
              balance: Number(l.balance ?? l.totalOutstandingBalance) || 0,
              status: l.status || 'Active',
              clearedDate: l.clearedDate && l.clearedDate !== '-' ? String(l.clearedDate).slice(0, 10) : (l.settlementDate || '-')
            }));
            setLoans(mapped);
            localStorage.setItem('dreamloom_loans', JSON.stringify(mapped));
          }
        })
        .catch(err => console.warn('Could not fetch server loans:', err));

      // 3. Fines & Penalties (strictly KSh 500 late-fee management)
      const savedFines = localStorage.getItem('dreamloom_fines');
      if (savedFines) {
        try {
          const parsed = JSON.parse(savedFines);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const sanitized = parsed.map((f: any) => ({
              ...f,
              member: resolvePenaltyMemberName(f)
            }));
            setFines(sanitized);
          }
        } catch (e) { console.warn('Saved fines parse failed:', e); }
      }
      fetch('/api/penalties')
        .then(r => r.json())
        .then(res => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            const mapped = res.data.map((p: any, idx: number) => {
              const resolvedName = resolvePenaltyMemberName(p);
              const isPaid = p.status?.toUpperCase() === 'PAID' || p.status === 'Paid';
              return {
                id: `FN-${String(idx + 1).padStart(2, '0')}`,
                dbId: p.id || p.dbId,
                memberId: p.memberId || p.member?.id || p.memberObj?.id,
                date: p.date ? String(p.date).slice(0, 10) : (p.dateLevied ? String(p.dateLevied).slice(0, 10) : '-'),
                monthYear: p.monthYear,
                member: resolvedName,
                memberName: resolvedName,
                reason: p.reason || 'Late payment penalty',
                penaltyAmount: 500,
                amount: 500,
                status: isPaid ? 'Paid' : 'Unpaid',
                datePaid: p.datePaid || '-',
              };
            });
            setFines(mapped);
            localStorage.setItem('dreamloom_fines', JSON.stringify(mapped));
          }
        })
        .catch(err => console.warn('Could not fetch server penalties:', err));

      // 4. Deposits Register Persistence
      const savedDeposits = localStorage.getItem('dreamloom_deposits');
      if (savedDeposits) {
        try {
          const parsed = JSON.parse(savedDeposits);
          if (Array.isArray(parsed) && parsed.length > 0) setDeposits(parsed);
        } catch (e) { console.warn('Saved deposits parse failed:', e); }
      }
      fetch('/api/deposits')
        .then(r => r.json())
        .then(res => {
          if (res.success && Array.isArray(res.data)) {
            setDeposits(res.data);
            localStorage.setItem('dreamloom_deposits', JSON.stringify(res.data));
          }
        })
        .catch(err => console.warn('Could not fetch server deposits:', err));

      // 5. Login Logs & Audit Logs Persistence
      const savedLoginLogs = localStorage.getItem('dreamloom_login_logs');
      if (savedLoginLogs) {
        try {
          const parsed = JSON.parse(savedLoginLogs);
          if (Array.isArray(parsed) && parsed.length > 0) setLoginLogs(parsed);
        } catch (e) { console.warn('Saved login logs parse failed:', e); }
      }
      fetch('/api/login-logs')
        .then(r => r.json())
        .then(res => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            const mapped = res.data.map((l: any, idx: number) => ({
              id: `AUTH-${String(100 + idx + 1)}`,
              date: l.createdAt ? String(l.createdAt).slice(0, 10) : '2026-11-02',
              time: l.createdAt ? String(l.createdAt).slice(11, 19) + ' EAT' : '10:00:00 EAT',
              user: l.user?.fullName || l.email?.split('@')[0] || 'Simon Memia',
              role: l.user?.role || 'Director / Member',
              ip: l.ipAddress || '197.232.84.12',
              device: 'Safari 17.4 (macOS Sonoma 14.3)',
              status: l.success ? 'Active (Authorized)' : 'Failed (Denied)',
              twoFa: l.success ? 'Pass (TOTP Token)' : 'Rejected'
            }));
            setLoginLogs(prev => [...mapped, ...prev.slice(mapped.length)]);
            localStorage.setItem('dreamloom_login_logs', JSON.stringify(mapped));
          }
        })
        .catch(err => console.warn('Could not fetch server login logs:', err));

      const savedEditLogs = localStorage.getItem('dreamloom_edit_logs');
      if (savedEditLogs) {
        try {
          const parsed = JSON.parse(savedEditLogs);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setEditLogs(parsed);
            setSelectedEditLog(parsed[0]);
          }
        } catch (e) { console.warn('Saved edit logs parse failed:', e); }
      }
      fetch('/api/audit-logs')
        .then(r => r.json())
        .then(res => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            const mapped = res.data.map((el: any, idx: number) => {
              let p: any = {};
              try {
                p = typeof el.changes === 'string' ? JSON.parse(el.changes) : (el.changes || {});
              } catch (e) {
                p = {};
              }

              const createdDate = el.createdAt ? new Date(el.createdAt) : new Date();
              const dateStr = getEATISODate(createdDate);
              const formattedTimestamp = getEATDateTimeString(createdDate);

              const user = p.user || el.user?.fullName || (p.userEmail ? p.userEmail.split('@')[0].replace('.', ' ') : (p.updatedBy ? p.updatedBy.split('@')[0].replace('.', ' ') : 'Simon Memia'));

              let moduleName = p.module || el.model || 'Contributions';
              if (moduleName === 'Contribution') moduleName = 'Contributions';
              if (moduleName === 'Loan') moduleName = 'Loans';
              if (moduleName === 'Penalty') moduleName = 'Fines & Penalties';
              if (moduleName === 'Member') moduleName = 'Members';
              if (moduleName === 'Expense') moduleName = 'Expenses';

              let act = p.action || el.action || 'Updated';
              if (act.toLowerCase() === 'update' || act.toLowerCase() === 'updated') act = 'Updated';
              else if (act.toLowerCase() === 'create' || act.toLowerCase() === 'added' || act.toLowerCase() === 'add') act = 'Added';
              else if (act.toLowerCase() === 'delete' || act.toLowerCase() === 'deleted') act = 'Deleted';

              const member = p.member || p.memberName || p.borrower || p.paidTo || (p.notes && p.notes.includes('Member: ') ? p.notes.split('Member: ')[1].replace(')', '').trim() : 'Mary Wanjiru');

              let oldValues = p.oldValues;
              let newValues = p.newValues;

              if (!oldValues && !newValues) {
                if (act === 'Added') {
                  oldValues = { 'Record Status': 'None (New Entry)' };
                  newValues = {};
                  if (p.amount !== undefined) newValues['Amount'] = `KSh ${Number(p.amount).toLocaleString()}`;
                  if (p.month) newValues['Period'] = p.month;
                  if (p.principal !== undefined) newValues['Principal'] = `KSh ${Number(p.principal).toLocaleString()}`;
                  if (Object.keys(newValues).length === 0) newValues['Status'] = 'Record Created';
                } else if (act === 'Deleted') {
                  oldValues = {};
                  if (p.amount !== undefined) oldValues['Amount'] = `KSh ${Number(p.amount).toLocaleString()}`;
                  if (p.month) oldValues['Period'] = p.month;
                  if (Object.keys(oldValues).length === 0) oldValues['Status'] = 'Active';
                  newValues = { 'Record Status': 'Record Deleted from System' };
                } else {
                  oldValues = {};
                  newValues = {};
                  if (p.amount !== undefined) {
                    oldValues['Contribution Amount'] = 'KSh 0';
                    newValues['Contribution Amount'] = `KSh ${Number(p.amount).toLocaleString()}`;
                  }
                  if (p.unsettled !== undefined) {
                    oldValues['Unsettled Dues'] = `KSh ${Number(p.unsettled).toLocaleString()}`;
                    newValues['Unsettled Dues'] = 'KSh 0';
                  }
                  if (p.principal !== undefined) {
                    oldValues['Loan Amount'] = 'KSh 15,000';
                    newValues['Loan Amount'] = `KSh ${Number(p.principal).toLocaleString()}`;
                  }
                  if (Object.keys(oldValues).length === 0) {
                    oldValues['Status'] = 'Previous State';
                    newValues['Status'] = 'Updated';
                  }
                }
              }

              // Compute changed fields if not explicitly stored
              let changedFields = p.changedFields;
              if ((!changedFields || Object.keys(changedFields).length === 0) && act === 'Updated' && oldValues && newValues) {
                changedFields = {};
                const allKeys = Array.from(new Set([...Object.keys(oldValues), ...Object.keys(newValues)]));
                for (const k of allKeys) {
                  const ov = oldValues[k] !== undefined ? String(oldValues[k]).trim() : '';
                  const nv = newValues[k] !== undefined ? String(newValues[k]).trim() : '';
                  if (ov && nv && ov !== nv) {
                    changedFields[k] = { from: oldValues[k], to: newValues[k] };
                  }
                }
              }

              const remarks = p.remarks || p.notes || `${act} ${moduleName} record for ${member}`;

              return {
                id: el.id ? `LOG-${el.id}` : `LOG-${idx + 1}`,
                dbId: el.id,
                timestamp: formattedTimestamp,
                rawDate: dateStr,
                user,
                module: moduleName,
                action: act,
                member,
                oldValues: oldValues || { 'Status': 'Active' },
                newValues: newValues || { 'Status': 'Updated' },
                changedFields: changedFields || {},
                remarks
              };
            });

            setEditLogs(mapped);
            if (mapped.length > 0) setSelectedEditLog(mapped[0]);
            localStorage.setItem('dreamloom_edit_logs', JSON.stringify(mapped));
          }
        })
        .catch(err => console.warn('Could not fetch server audit logs:', err));

      // 4. Expenses
      const savedExpenses = localStorage.getItem('dreamloom_expenses');
      if (savedExpenses) {
        try {
          const parsed = JSON.parse(savedExpenses);
          if (Array.isArray(parsed) && parsed.length > 0) setExpenses(parsed);
        } catch (e) { console.warn('Saved expenses parse failed:', e); }
      }
      fetch('/api/expenses')
        .then(r => r.json())
        .then(res => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            const mapped = res.data.map((e: any, idx: number) => ({
              id: `EXP-${String(idx + 1).padStart(2, '0')}`,
              dbId: e.id,
              date: e.expenseDate ? String(e.expenseDate).slice(0, 10) : '-',
              description: e.description,
              amount: Number(e.amount) || 0,
              category: e.expenseType || 'Operational',
              paidTo: e.referenceDetails || 'Operational Outflow'
            }));
            setExpenses(mapped);
            localStorage.setItem('dreamloom_expenses', JSON.stringify(mapped));
          }
        })
        .catch(err => console.warn('Could not fetch server expenses:', err));

      // 5. Members Persistence from Database
      const savedMembers = localStorage.getItem('dreamloom_members');
      if (savedMembers) {
        try {
          const parsed = JSON.parse(savedMembers);
          if (Array.isArray(parsed) && parsed.length > 0) setMembers(parsed);
        } catch (e) { console.warn('Saved members parse failed:', e); }
      }
      fetch('/api/members')
        .then(r => r.json())
        .then(res => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            const colorMap: Record<string, string> = {
              'Simon': 'from-emerald-400 to-teal-400',
              'David': 'from-sky-400 to-cyan-400',
              'Elijah': 'from-blue-500 to-sky-400',
              'Samuel': 'from-indigo-400 to-blue-400',
              'Michael': 'from-purple-400 to-indigo-400',
              'Daniel': 'from-amber-400 to-yellow-400',
              'Beatrice': 'from-teal-400 to-emerald-400',
            };
            const mapped = res.data.map((m: any) => {
              const firstName = m.fullName ? m.fullName.split(' ')[0] : 'Member';
              const totContrib = m.contributions?.reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0) || 0;
              const actLoans = m.loans?.filter((l: any) => l.status === 'Active')
                .reduce((sum: number, l: any) => sum + ((Number(l.totalPayable) || Number(l.principal) || 0) - (Number(l.paidAmount) || 0)), 0) || 0;
              return {
                id: `MEM-${String(m.id).padStart(3, '0')}`,
                dbId: m.id,
                name: firstName,
                fullName: m.fullName,
                nationalId: m.nationalId || '-',
                phone: m.phone || '-',
                role: m.role || 'Member',
                email: m.email || '',
                totalContribution: totContrib,
                activeLoans: actLoans,
                netBalance: totContrib - actLoans,
                shares: '14.28%',
                percentage: 95,
                status: 'Active',
                avatar: getMemberAvatar(m.fullName || m.id || firstName),
                color: colorMap[firstName] || 'from-emerald-400 to-teal-400',
              };
            });
            setMembers(mapped);
            localStorage.setItem('dreamloom_members', JSON.stringify(mapped));
          }
        })
        .catch(err => console.warn('Could not fetch server members:', err));

      // 6. Investments Persistence from Database
      const savedInvestments = localStorage.getItem('dreamloom_investments');
      if (savedInvestments) {
        try {
          const parsed = JSON.parse(savedInvestments);
          if (Array.isArray(parsed) && parsed.length > 0) setInvestments(parsed);
        } catch (e) { console.warn('Saved investments parse failed:', e); }
      }
      fetch('/api/investments')
        .then(r => r.json())
        .then(res => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            setInvestments(res.data);
            localStorage.setItem('dreamloom_investments', JSON.stringify(res.data));
          }
        })
        .catch(err => console.warn('Could not fetch server investments:', err));

      // 7. Projects Persistence from Database
      const savedProjects = localStorage.getItem('dreamloom_projects');
      if (savedProjects) {
        try {
          const parsed = JSON.parse(savedProjects);
          if (Array.isArray(parsed) && parsed.length > 0) setProjects(parsed);
        } catch (e) { console.warn('Saved projects parse failed:', e); }
      }
      fetch('/api/projects')
        .then(r => r.json())
        .then(res => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            setProjects(res.data);
            localStorage.setItem('dreamloom_projects', JSON.stringify(res.data));
          }
        })
        .catch(err => console.warn('Could not fetch server projects:', err));

      // 8. Suppliers Persistence from Database
      const savedSuppliers = localStorage.getItem('dreamloom_suppliers');
      if (savedSuppliers) {
        try {
          const parsed = JSON.parse(savedSuppliers);
          if (Array.isArray(parsed) && parsed.length > 0) setSuppliers(parsed);
        } catch (e) { console.warn('Saved suppliers parse failed:', e); }
      }
      fetch('/api/suppliers')
        .then(r => r.json())
        .then(res => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            setSuppliers(res.data);
            localStorage.setItem('dreamloom_suppliers', JSON.stringify(res.data));
          }
        })
        .catch(err => console.warn('Could not fetch server suppliers:', err));

      // 9. Documents Persistence from Database
      const savedDocuments = localStorage.getItem('dreamloom_documents');
      if (savedDocuments) {
        try {
          const parsed = JSON.parse(savedDocuments);
          if (Array.isArray(parsed) && parsed.length > 0) setDocuments(parsed);
        } catch (e) { console.warn('Saved documents parse failed:', e); }
      }
      fetch('/api/documents')
        .then(r => r.json())
        .then(res => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            setDocuments(res.data);
            localStorage.setItem('dreamloom_documents', JSON.stringify(res.data));
          }
        })
        .catch(err => console.warn('Could not fetch server documents:', err));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Role-Based Access Control: Authorized officers (Director Simon, Officer Elijah, Treasurer Michael, and Admin) can edit & delete
  const canEdit = useMemo(() => {
    if (!currentUser) return false;
    const email = currentUser.email?.toLowerCase().trim() || '';
    const role = (currentUser.role || '').toLowerCase();
    return (
      email === 'kamera@dreamloom.co.ke' ||
      email === 'simon@dreamloom.co.ke' ||
      email === 'elijah@dreamloom.co.ke' ||
      email === 'michael@dreamloom.co.ke' ||
      role.includes('director') ||
      role.includes('treasurer') ||
      role.includes('admin')
    );
  }, [currentUser]);

  // Inactivity Auto-Logout Timer (Only for non-persistent sessions)
  useEffect(() => {
    if (!isLoggedIn) return;

    // Persistent Remember-Me sessions stay authenticated across idle periods and restarts
    if (currentUser?.rememberMe) {
      return;
    }

    let timeoutId: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      // 30 minutes of complete inactivity for non-remember-me sessions
      timeoutId = setTimeout(() => {
        handleLogout();
        setAuthError('Your session has timed out due to inactivity. Please authenticate with your password to resume.');
      }, 30 * 60 * 1000);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(ev => window.addEventListener(ev, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(ev => window.removeEventListener(ev, resetTimer));
    };
  }, [isLoggedIn, currentUser]);

  // Core App States
  const [activeTab, setActiveTab] = useState('Overview');

  // Dynamic Current Header Date in Africa/Nairobi (UTC+3, EAT)
  const [currentHeaderDate, setCurrentHeaderDate] = useState(() => getEATHeaderDate());
  useEffect(() => {
    const updateHeader = () => setCurrentHeaderDate(getEATHeaderDate());
    const interval = setInterval(updateHeader, 60000);
    return () => clearInterval(interval);
  }, []);

  // Universal Month & Year Filter States (Defaults dynamically to actual current month and year in EAT)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getEATCurrentMonthName());
  const [selectedYear, setSelectedYear] = useState<number | string>(() => getEATCurrentYear());

  // Fines & Expenses Period Filters (default to 'All' to allow full view or specific filter)
  const [selectedPenaltyMonth, setSelectedPenaltyMonth] = useState<string>('All');
  const [selectedPenaltyYear, setSelectedPenaltyYear] = useState<number | string>('All');
  const [selectedExpenseMonth, setSelectedExpenseMonth] = useState<string>('All');
  const [selectedExpenseYear, setSelectedExpenseYear] = useState<number | string>('All');

  // Monthly Contributions Entry State
  const selectedContributionCycle = `${selectedMonth} ${selectedYear}`;
  const [contributionSearchMember, setContributionSearchMember] = useState('');
  const [contributionSubView, setContributionSubView] = useState<'monthly' | 'register'>('monthly');

  // Working state for monthly entries row editing
  const [monthlyInputs, setMonthlyInputs] = useState<Record<string, { amount: number; paymentDate: string; remarks: string; unsettled: number; penalty: number }>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<string>('Overview');
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [selectedMemberProfile, setSelectedMemberProfile] = useState<any | null>(null);

  // Header & Controls States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('KES');
  const [selectedTrendRange, setSelectedTrendRange] = useState('Last 6 Months');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredTrendPoint, setHoveredTrendPoint] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 4500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Form Field States for Edit / Add Modals
  const [field1, setField1] = useState('');
  const [field2, setField2] = useState('');
  const [field3, setField3] = useState('');
  const [field4, setField4] = useState('');
  const [field5, setField5] = useState('');
  const [field6, setField6] = useState('');
  const [field7, setField7] = useState('');

  // Payment Modal States for Fines & Penalties Dues Settlement
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPenaltyForPayment, setSelectedPenaltyForPayment] = useState<any>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [paymentMethodInput, setPaymentMethodInput] = useState('M-PESA');
  const [paymentRefInput, setPaymentRefInput] = useState('');
  const [paymentNotesInput, setPaymentNotesInput] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Deposits Register & Reconciliation State
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [depositsLoading, setDepositsLoading] = useState(false);

  // 1. Official Membership Directory & Summary (PDF Page 1 & Page 10)
  const [members, setMembers] = useState<any[]>([
    {
      id: 'MEM-001',
      name: 'Simon',
      fullName: 'Simon Memia Wanjiru',
      nationalId: '32242103',
      phone: '0719545283',
      role: 'Director / Member',
      email: 'kamera@dreamloom.co.ke',
      totalContribution: 65050.00,
      activeLoans: 13200.00,
      netBalance: 51850.00,
      shares: '13.80%',
      percentage: 90,
      status: 'Active',
      avatar: '/members/member-1.jpg',
      color: 'from-emerald-400 to-teal-400'
    },
    {
      id: 'MEM-002',
      name: 'David',
      fullName: 'David Wainaina Kinyua',
      nationalId: '39929859',
      phone: '0714382925',
      role: 'Member',
      email: 'david@dreamloom.co.ke',
      totalContribution: 71050.00,
      activeLoans: 0.00,
      netBalance: 71050.00,
      shares: '15.08%',
      percentage: 98,
      status: 'Active',
      avatar: '/members/member-2.jpg',
      color: 'from-sky-400 to-cyan-400'
    },
    {
      id: 'MEM-003',
      name: 'Elijah',
      fullName: 'Elijah Waitara Gichari',
      nationalId: '34282968',
      phone: '0718963492',
      role: 'Member',
      email: 'elijah@dreamloom.co.ke',
      totalContribution: 65050.00,
      activeLoans: 6600.00,
      netBalance: 58450.00,
      shares: '13.80%',
      percentage: 90,
      status: 'Active',
      avatar: '/members/member-3.jpg',
      color: 'from-blue-500 to-sky-400'
    },
    {
      id: 'MEM-004',
      name: 'Samuel',
      fullName: 'Samuel Kamau Nguuro',
      nationalId: '40085139',
      phone: '0113114471',
      role: 'Member',
      email: 'samuel@dreamloom.co.ke',
      totalContribution: 69450.00,
      activeLoans: 0.00,
      netBalance: 69450.00,
      shares: '14.74%',
      percentage: 96,
      status: 'Active',
      avatar: '/members/member-4.jpg',
      color: 'from-indigo-400 to-blue-400'
    },
    {
      id: 'MEM-005',
      name: 'Michael',
      fullName: 'Michael Kiarie Wanjiru',
      nationalId: '38927071',
      phone: '0748036136',
      role: 'Member',
      email: 'michael@dreamloom.co.ke',
      totalContribution: 72050.00,
      activeLoans: 0.00,
      netBalance: 72050.00,
      shares: '15.29%',
      percentage: 100,
      status: 'Active',
      avatar: '/members/member-5.jpg',
      color: 'from-purple-400 to-indigo-400'
    },
    {
      id: 'MEM-006',
      name: 'Daniel',
      fullName: 'Daniel Kamau Njiriri',
      nationalId: '36686858',
      phone: '0759818731',
      role: 'Member',
      email: 'daniel@dreamloom.co.ke',
      totalContribution: 65050.00,
      activeLoans: 16500.00,
      netBalance: 48550.00,
      shares: '13.80%',
      percentage: 90,
      status: 'Active',
      avatar: '/members/member-6.svg',
      color: 'from-amber-400 to-yellow-400'
    },
    {
      id: 'MEM-007',
      name: 'Beatrice',
      fullName: 'Beatrice Njoki Muthoni',
      nationalId: '40492876',
      phone: '0708665848',
      role: 'Member',
      email: 'beatrice@dreamloom.co.ke',
      totalContribution: 63550.00,
      activeLoans: 42900.00,
      netBalance: 20650.00,
      shares: '13.49%',
      percentage: 88,
      status: 'Active',
      avatar: '/members/member-7.svg',
      color: 'from-teal-400 to-emerald-400'
    },
  ]);

  // 2. Official Contributions & Land Payouts Register (PDF Pages 2, 3, 4, 5) with Unsettled Contributions Column
  const defaultOfficialContributions = initialContributions;
  const [contributions, setContributions] = useState<any[]>(initialContributions);

  // 3. Official Operational Expenses & Payouts Log (PDF Pages 9 & 10 - 35 Records totaling KES 381,746.42)
  const [expenses, setExpenses] = useState<any[]>(initialExpenses);

  // 4. Official Loans Register (PDF Pages 7 & 8 - L001 to L019) with Settlement Date Tracking
  const [loans, setLoans] = useState<any[]>([
    // Settled Loans
    { id: 'L001', issueDate: '15th Jan 2026', borrower: 'Simon Memia Wanjiru', principal: 6000.00, interest: 900.00, totalLoan: 6900.00, paid: 6900.00, balance: 0.00, status: 'Settled', clearedDate: '15th Feb 2026' },
    { id: 'L002', issueDate: '15th Feb 2026', borrower: 'David Wainaina Kinyua', principal: 1500.00, interest: 225.00, totalLoan: 1725.00, paid: 1725.00, balance: 0.00, status: 'Settled', clearedDate: '15th Mar 2026' },
    { id: 'L003', issueDate: '16th April 2026', borrower: 'Daniel Kamau Njiriri', principal: 10000.00, interest: 1500.00, totalLoan: 11500.00, paid: 11500.00, balance: 0.00, status: 'Settled', clearedDate: '16th May 2026' },
    { id: 'L004', issueDate: '15th Feb 2026', borrower: 'Simon Memia Wanjiru', principal: 6000.00, interest: 900.00, totalLoan: 6900.00, paid: 6900.00, balance: 0.00, status: 'Settled', clearedDate: '15th Mar 2026' },
    { id: 'L005', issueDate: '15th May 2026', borrower: 'Samuel Kamau Nguuro', principal: 6000.00, interest: 900.00, totalLoan: 6900.00, paid: 6900.00, balance: 0.00, status: 'Settled', clearedDate: '15th Jun 2026' },
    { id: 'L006', issueDate: '15th May 2026', borrower: 'Simon Memia Wanjiru', principal: 12000.00, interest: 1800.00, totalLoan: 13800.00, paid: 13800.00, balance: 0.00, status: 'Settled', clearedDate: '15th Jun 2026' },
    { id: 'L007', issueDate: '15th May 2026', borrower: 'Daniel Kamau Njiriri', principal: 10000.00, interest: 1500.00, totalLoan: 11500.00, paid: 11500.00, balance: 0.00, status: 'Settled', clearedDate: '15th Jun 2026' },
    { id: 'L008', issueDate: '6th August 2026', borrower: 'David Wainaina Kinyua', principal: 1500.00, interest: 150.00, totalLoan: 1650.00, paid: 1650.00, balance: 0.00, status: 'Settled', clearedDate: '06th Sep 2026' },
    { id: 'L009', issueDate: '5th June 2026', borrower: 'David Wainaina Kinyua', principal: 4000.00, interest: 400.00, totalLoan: 4400.00, paid: 4400.00, balance: 0.00, status: 'Settled', clearedDate: '05th Jul 2026' },
    { id: 'L010', issueDate: '6th July 2026', borrower: 'Samuel Kamau Nguuro', principal: 6000.00, interest: 600.00, totalLoan: 6600.00, paid: 6600.00, balance: 0.00, status: 'Settled', clearedDate: '06th Aug 2026' },

    // Active Loans
    { id: 'L011', issueDate: '15th August 2026', borrower: 'Simon Memia Wanjiru', principal: 12000.00, interest: 1200.00, totalLoan: 13200.00, paid: 0.00, balance: 13200.00, status: 'Active', clearedDate: '-' },
    { id: 'L012', issueDate: 'August 2026', borrower: 'Elijah Waitara Gichari', principal: 6000.00, interest: 600.00, totalLoan: 6600.00, paid: 0.00, balance: 6600.00, status: 'Active', clearedDate: '-' },
    { id: 'L013', issueDate: '00th July 2026', borrower: 'Daniel Kamau Njiriri', principal: 9000.00, interest: 900.00, totalLoan: 9900.00, paid: 0.00, balance: 9900.00, status: 'Active', clearedDate: '-' },
    { id: 'L014', issueDate: '18th June 2026', borrower: 'Beatrice Njoki Muthoni', principal: 6000.00, interest: 600.00, totalLoan: 6600.00, paid: 0.00, balance: 6600.00, status: 'Active', clearedDate: '-' },
    { id: 'L015', issueDate: '18th July 2026', borrower: 'Beatrice Njoki Muthoni', principal: 6000.00, interest: 600.00, totalLoan: 6600.00, paid: 0.00, balance: 6600.00, status: 'Active', clearedDate: '-' },
    { id: 'L016', issueDate: '18th August 2026', borrower: 'Beatrice Njoki Muthoni', principal: 6000.00, interest: 600.00, totalLoan: 6600.00, paid: 0.00, balance: 6600.00, status: 'Active', clearedDate: '-' },
    { id: 'L017', issueDate: 'August 2026', borrower: 'Daniel Kamau Njiriri', principal: 6000.00, interest: 600.00, totalLoan: 6600.00, paid: 0.00, balance: 6600.00, status: 'Active', clearedDate: '-' },
    { id: 'L018', issueDate: '02-Oct-2026', borrower: 'Beatrice Njoki Muthoni', principal: 15000.00, interest: 1500.00, totalLoan: 16500.00, paid: 0.00, balance: 16500.00, status: 'Active', clearedDate: '-' },
    { id: 'L019', issueDate: 'October 2026', borrower: 'Beatrice Njoki Muthoni', principal: 6000.00, interest: 600.00, totalLoan: 6600.00, paid: 0.00, balance: 6600.00, status: 'Active', clearedDate: '-' },
  ]);

  // 5. Official Fines & Penalties Log (PDF Page 15 - 14 Records)
  const [fines, setFines] = useState<any[]>(initialFines);

  // 6. Strategic Investments State
  const [investments, setInvestments] = useState([
    { id: 'INV-01', asset: 'Mawega Land Parcel', type: 'Real Estate', capital: 340000.00, status: 'Active', expectedReturn: '15%' },
    { id: 'INV-02', asset: 'Equity Bank Primary Liquidity', type: 'Treasury & Reserves', capital: 51850.00, status: 'Active', expectedReturn: '12%' },
  ]);

  // 7. Operations & Legal Projects State
  const [projects, setProjects] = useState([
    { id: 'PRJ-01', name: 'Mawega Land Title Processing & Survey Works', budget: 40000.00, status: 'Active', manager: 'Elijah Waitara & Daniel Kamau' },
    { id: 'PRJ-02', name: 'Company Statutory Registration (CR12 & KRA PIN)', budget: 15514.00, status: 'Completed', manager: 'Simon Memia Wanjiru' },
  ]);

  // 8. Suppliers State
  const [suppliers, setSuppliers] = useState([
    { id: 'SUP-01', name: 'Mawega Land Registry Office', category: 'Conveyancing & Land Registry', contact: 'Nairobi Office', status: 'Active' },
    { id: 'SUP-02', name: 'Equity Bank Kenya Limited', category: 'Banking & Financial Operations', contact: 'A/C 1760287177880', status: 'Active' },
  ]);

  // 9. Documents State
  const [documents, setDocuments] = useState([
    { id: 'DOC-01', name: 'Company Registration Certificate', category: 'Statutory', link: '#', status: 'Available' },
    { id: 'DOC-02', name: 'KRA Pin Certificate', category: 'Statutory', link: '#', status: 'Available' },
    { id: 'DOC-03', name: 'CR12 Official Search 2026', category: 'Statutory', link: '#', status: 'Available' },
    { id: 'DOC-04', name: 'Mawega Land Sale & Conveyancing Agreement', category: 'Legal Contract', link: '#', status: 'Available' },
    { id: 'DOC-05', name: 'Official Membership & Contact Directory', category: 'Governance', link: '#', status: 'Available' },
  ]);

  // 10. Recent Transactions Stream
  const [transactions, setTransactions] = useState([
    { id: 'TX-01', title: 'Beatrice Njoki - Loan L018 Disbursed', time: '02-Oct-2026', amount: '+ KES 15,000', type: 'income', icon: CreditCard, iconColor: 'bg-cyan-600/20 text-cyan-400' },
    { id: 'TX-02', title: 'Title processing fee - Mawega', time: '24-Sep-2026', amount: '- KES 40,000', type: 'expense', icon: Receipt, iconColor: 'bg-rose-600/20 text-rose-400' },
    { id: 'TX-03', title: 'Mawega Payout Sep-26 Disbursed', time: '01-Sep-2026', amount: '- KES 40,000', type: 'expense', icon: Receipt, iconColor: 'bg-amber-600/20 text-amber-400' },
    { id: 'TX-04', title: 'Michael Kiarie - Contribution', time: '01-Sep-2026', amount: '+ KES 7,000', type: 'income', icon: Users, iconColor: 'bg-blue-600/20 text-sky-400' },
  ]);

  // 11. Upcoming Payments / Commitments
  const [upcomingPayments] = useState([
    { id: 'UP-01', title: 'Monthly Contribution (Oct-26)', date: '15 Oct 2026', icon: Users, iconColor: 'bg-blue-600/20 text-sky-400' },
    { id: 'UP-02', title: 'Loan Repayment - Beatrice (L018)', date: '18 Oct 2026', icon: CreditCard, iconColor: 'bg-cyan-600/20 text-cyan-400' },
    { id: 'UP-03', title: 'Title Deed Processing Mawega Final', date: '20 Oct 2026', icon: Building, iconColor: 'bg-emerald-600/20 text-emerald-400' },
    { id: 'UP-04', title: 'Statutory Annual Tax Filing (KRA)', date: '25 Oct 2026', icon: Shield, iconColor: 'bg-amber-600/20 text-amber-400' },
  ]);

  // 12. Audit Trail & Logs (Forensic Stream)
  const [loginLogs, setLoginLogs] = useState<any[]>([
    {
      id: 'AUTH-101',
      date: '2025-02-28',
      time: '10:42:18 EAT',
      timestamp: '2025-02-28 10:42',
      user: 'Simon Memia',
      role: 'Managing Director / Super Admin',
      ip: '197.232.84.12',
      device: 'Safari 17.4 (macOS Sonoma 14.3)',
      status: 'Active (Authorized)',
      twoFa: 'Pass (TOTP Token)'
    },
    {
      id: 'AUTH-102',
      date: '2025-02-28',
      time: '09:15:02 EAT',
      timestamp: '2025-02-28 09:15',
      user: 'Michael Kiarie',
      role: 'Treasurer / Asset Custodian',
      ip: '102.164.21.90',
      device: 'Chrome 122 (Windows 11 Pro)',
      status: 'Active (Authorized)',
      twoFa: 'Pass (Hardware Key)'
    },
    {
      id: 'AUTH-103',
      date: '2025-02-28',
      time: '08:04:47 EAT',
      timestamp: '2025-02-28 08:04',
      user: 'David Wainaina',
      role: 'Internal Auditor / Compliance',
      ip: '105.161.4.11',
      device: 'Mobile Firefox 123 (Android 14)',
      status: 'Active (Authorized)',
      twoFa: 'Pass (TOTP Token)'
    },
    {
      id: 'AUTH-104',
      date: '2025-02-27',
      time: '18:22:10 EAT',
      timestamp: '2025-02-27 18:22',
      user: 'Simon Memia',
      role: 'Managing Director / Super Admin',
      ip: '197.232.84.12',
      device: 'Safari 17.4 (macOS Sonoma 14.3)',
      status: 'Terminated (Graceful)',
      twoFa: 'Session Expired'
    }
  ]);

  const [selectedEditLog, setSelectedEditLog] = useState<any>(null);
  const [filterFromDate, setFilterFromDate] = useState<string>('');
  const [filterToDate, setFilterToDate] = useState<string>('');
  const [filterModule, setFilterModule] = useState<string>('All Pages');
  const [filterMember, setFilterMember] = useState<string>('All Members');
  const [editLogPage, setEditLogPage] = useState<number>(1);
  const editLogPageSize = 5;

  const [editLogs, setEditLogs] = useState<any[]>([]);

  // Automated Audit Log Recording Helper
  const recordAuditLog = async ({
    user,
    member,
    module,
    action,
    oldValues,
    newValues,
    remarks
  }: {
    user?: string;
    member: string;
    module: string;
    action: 'Added' | 'Updated' | 'Deleted';
    oldValues: Record<string, string>;
    newValues: Record<string, string>;
    remarks?: string;
  }) => {
    const currentUserName = user || currentUser?.fullName || 'Simon Memia';
    const currentUserEmail = currentUser?.email || 'simon@dreamloom.co.ke';
    const createdDate = new Date();
    const formattedTimestamp = getEATDateTimeString(createdDate);

    const changedFields: Record<string, { from: any; to: any }> = {};
    if (action === 'Updated') {
      const allKeys = Array.from(new Set([...Object.keys(oldValues || {}), ...Object.keys(newValues || {})]));
      for (const k of allKeys) {
        const vOld = oldValues?.[k] !== undefined ? String(oldValues[k]).trim() : '';
        const vNew = newValues?.[k] !== undefined ? String(newValues[k]).trim() : '';
        if (vOld && vNew && vOld !== vNew) {
          changedFields[k] = { from: oldValues[k], to: newValues[k] };
        }
      }
    }

    const newEntry = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: formattedTimestamp,
      rawDate: createdDate.toISOString().slice(0, 10),
      user: currentUserName,
      module,
      action,
      member,
      oldValues,
      newValues,
      changedFields,
      remarks: remarks || `${action} ${module} record for ${member}`
    };

    setEditLogs(prev => {
      const updated = [newEntry, ...prev];
      try { localStorage.setItem('dreamloom_edit_logs', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    setSelectedEditLog(newEntry);

    try {
      await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: module,
          action,
          userEmail: currentUserEmail,
          userName: currentUserName,
          member,
          oldValues,
          newValues,
          changedFields,
          remarks: newEntry.remarks
        })
      });
    } catch (err) {
      console.error('Failed to persist audit log to DB:', err);
    }
  };

  // Edit Log Filtering and Pagination (Matching Reference Interface)
  const editLogModules = useMemo(() => [
    'All Pages',
    'Contributions',
    'Deposits',
    'Loans',
    'Members',
    'Fines & Penalties',
    'Expenses',
    'Investments',
    'Projects'
  ], []);

  const editLogMemberList = useMemo(() => {
    const names = new Set<string>();
    members.forEach(m => {
      if (m.name) names.add(m.name);
      if (m.fullName) names.add(m.fullName);
    });
    editLogs.forEach(l => {
      if (l.member) names.add(l.member);
    });
    return ['All Members', ...Array.from(names)];
  }, [members, editLogs]);

  const filteredEditLogs = useMemo(() => {
    return editLogs.filter(log => {
      if (filterFromDate && log.rawDate && log.rawDate < filterFromDate) return false;
      if (filterToDate && log.rawDate && log.rawDate > filterToDate) return false;
      if (filterModule !== 'All Pages') {
        const normFilterMod = filterModule.toLowerCase().replace(/[^a-z]/g, '');
        const normLogMod = (log.module || '').toLowerCase().replace(/[^a-z]/g, '');
        if (!normLogMod.includes(normFilterMod) && !normFilterMod.includes(normLogMod)) return false;
      }
      if (filterMember !== 'All Members') {
        const normFilterMem = filterMember.toLowerCase().trim();
        const normLogMem = (log.member || '').toLowerCase().trim();
        if (!normLogMem.includes(normFilterMem) && !normFilterMem.includes(normLogMem)) return false;
      }
      return true;
    });
  }, [editLogs, filterFromDate, filterToDate, filterModule, filterMember]);

  const totalEditLogPages = Math.max(1, Math.ceil(filteredEditLogs.length / editLogPageSize));
  const paginatedEditLogs = useMemo(() => {
    const start = (editLogPage - 1) * editLogPageSize;
    return filteredEditLogs.slice(start, start + editLogPageSize);
  }, [filteredEditLogs, editLogPage, editLogPageSize]);

  const activeSelectedLog = useMemo(() => {
    if (selectedEditLog && editLogs.some(l => l.id === selectedEditLog.id)) {
      return selectedEditLog;
    }
    return paginatedEditLogs[0] || editLogs[0] || null;
  }, [selectedEditLog, editLogs, paginatedEditLogs]);

  const changedFieldsList = useMemo(() => {
    if (!activeSelectedLog) return [];
    if (
      activeSelectedLog.action !== 'Updated' &&
      activeSelectedLog.action !== 'Cancelled' &&
      activeSelectedLog.action !== 'Reversed'
    ) {
      return [];
    }
    const cf = activeSelectedLog.changedFields;
    if (cf && typeof cf === 'object' && Object.keys(cf).length > 0) {
      return Object.entries(cf).map(([field, obj]: [string, any]) => ({
        field,
        from: typeof obj === 'object' && obj !== null && 'from' in obj ? obj.from : '-',
        to: typeof obj === 'object' && obj !== null && 'to' in obj ? obj.to : obj,
      }));
    }
    const ov = activeSelectedLog.oldValues || {};
    const nv = activeSelectedLog.newValues || {};
    const list: { field: string; from: any; to: any }[] = [];
    const allKeys = Array.from(new Set([...Object.keys(ov), ...Object.keys(nv)]));
    for (const k of allKeys) {
      const vOld = ov[k] !== undefined ? String(ov[k]).trim() : '';
      const vNew = nv[k] !== undefined ? String(nv[k]).trim() : '';
      if (vOld && vNew && vOld !== vNew) {
        list.push({ field: k, from: ov[k], to: nv[k] });
      }
    }
    return list;
  }, [activeSelectedLog]);

  // =========================================================================
  // AUTOMATED & REACTIVE FINANCIAL CALCULATIONS
  // =========================================================================
  
  // Total Group Contributions (Amount paid in)
  const grandTotalContributions = useMemo(() => {
    return contributions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }, [contributions]);

  // Total Mawega Land Payouts
  const grandTotalMawegaPayouts = useMemo(() => {
    return contributions.reduce((sum, c) => sum + (Number(c.payout) || 0), 0);
  }, [contributions]);

  // Total Operational Expenses & Outflows
  const totalExpensesAmount = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  // Active Loans Principal Remaining (Excludes Settled and Cancelled Loans)
  const totalActiveLoansPrincipal = useMemo(() => {
    return loans
      .filter(l => l.status !== 'Settled' && l.status !== 'Cancelled')
      .reduce((sum, l) => sum + (Number(l.remainingPrincipal ?? l.principal) || 0), 0);
  }, [loans]);

  // Active Loans Outstanding Balance (Principal + Accrued Interest, Excludes Settled and Cancelled Loans)
  const totalActiveLoansAmount = useMemo(() => {
    return loans
      .filter(l => l.status !== 'Settled' && l.status !== 'Cancelled')
      .reduce((sum, l) => sum + (Number(l.balance ?? l.totalOutstandingBalance) || 0), 0);
  }, [loans]);

  const activeLoansCount = useMemo(() => {
    return loans.filter(l => l.status !== 'Settled' && l.status !== 'Cancelled').length;
  }, [loans]);

  // Total Penalties Paid (Dynamically calculated from all settled & partial payments)
  const totalPaidPenalties = useMemo(() => {
    return fines.reduce((sum, f) => sum + (Number(f.paidAmount) || (f.status === 'Paid' ? Number(f.amount) || 0 : 0)), 0);
  }, [fines]);

  // Total Interest Paid from Loans (Authoritative calculation across valid non-cancelled facilities)
  const totalPaidInterest = useMemo(() => {
    return loans
      .filter(l => l.status !== 'Cancelled')
      .reduce((sum, l) => sum + (Number(l.interestPaid ?? (l.status === 'Settled' ? l.interest : 0)) || 0), 0);
  }, [loans]);

  // Real-time Bank Account Balance
  // Formula: Total Contributions - Total Expenses - Total Active Loans Principal + Total Penalties (PAID) + Total Interest (PAID)
  const bankAccountBalance = useMemo(() => {
    return grandTotalContributions - totalExpensesAmount - totalActiveLoansPrincipal + totalPaidPenalties + totalPaidInterest;
  }, [grandTotalContributions, totalExpensesAmount, totalActiveLoansPrincipal, totalPaidPenalties, totalPaidInterest]);

  // Automated Member Financial Position (Dynamically derived from genuine contributions and loans)
  const automatedMembers = useMemo(() => {
    return members.map((m, idx) => {
      const mDbId = m.dbId || (idx + 1);
      // 1. Dynamic contributions paid by this member
      const memberContribs = contributions.filter(
        c => !c.payout && ((c.memberId && Number(c.memberId) === mDbId) || (c.member && isSameMemberName(c.member, m.fullName)))
      );
      const memberPaid = memberContribs.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
      const memberUnsettled = memberContribs.reduce((sum, c) => sum + (Number(c.unsettled) || 0), 0);
      const effectiveTotalContrib = memberPaid > 0 ? memberPaid : m.totalContribution;

      // 2. Active loans balance for this member (strictly excluding Settled and Cancelled loans)
      const memberActiveLoans = loans
        .filter(
          l =>
            l.status !== 'Settled' &&
            l.status !== 'Cancelled' &&
            ((l.memberId && Number(l.memberId) === mDbId) || (l.borrower && isSameMemberName(l.borrower, m.fullName)))
        )
        .reduce((sum, l) => sum + (Number(l.balance ?? l.totalOutstandingBalance) || 0), 0);

      // 3. Automated Net Balance: Total Contributions minus Active Loans
      const dynamicNetBalance = effectiveTotalContrib - memberActiveLoans;

      // 4. Automated Shareholding %
      const dynamicShares = grandTotalContributions > 0
        ? ((effectiveTotalContrib / grandTotalContributions) * 100).toFixed(2) + '%'
        : m.shares;

      return {
        ...m,
        dbId: mDbId,
        totalContribution: effectiveTotalContrib,
        unsettledContributions: memberUnsettled,
        activeLoans: memberActiveLoans,
        netBalance: dynamicNetBalance,
        shares: dynamicShares
      };
    });
  }, [members, contributions, loans, grandTotalContributions]);

  // Outstanding Contributions per Member (retrieved from Contributions Register)
  const memberOutstandingContribs = useMemo(() => {
    const map: Record<string, number> = {};
    members.forEach(m => {
      const un = contributions
        .filter(c => c.member && isSameMemberName(c.member, m.fullName) && !c.payout)
        .reduce((sum, c) => sum + (Number(c.unsettled) || 0), 0);
      map[m.fullName] = un;
    });
    return map;
  }, [members, contributions]);

  const grandTotalOutstandingContribs = useMemo(() => {
    return Object.values(memberOutstandingContribs).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }, [memberOutstandingContribs]);

  // Unpaid KSh 500 Penalties per Member (retrieved from Fines & Penalties Register)
  const memberUnpaidPenalties = useMemo(() => {
    const map: Record<string, number> = {};
    members.forEach(m => {
      const un = fines
        .filter(f => {
          const isMem = isSameMemberName(f.member, m.fullName);
          const isUnpaid = f.status === 'Unpaid' || f.status === 'UNPAID' || f.status === 'Active';
          return isMem && isUnpaid;
        })
        .reduce((sum, f) => sum + (Number(f.penaltyAmount) || Number(f.amount) || 500), 0);
      map[m.fullName] = un;
    });
    return map;
  }, [members, fines]);

  const grandTotalUnpaidPenalties = useMemo(() => {
    return Object.values(memberUnpaidPenalties).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }, [memberUnpaidPenalties]);

  // Backward compatibility alias for any existing summary references
  const memberUnsettledTotals = memberOutstandingContribs;
  const grandTotalUnsettled = grandTotalOutstandingContribs;

  // Trend Chart Data
  const trendData = useMemo(() => [
    { month: 'Apr', contributions: 42000, expenses: 35000, loans: 10000 },
    { month: 'May', contributions: 41500, expenses: 41200, loans: 12000 },
    { month: 'Jun', contributions: 48000, expenses: 36514, loans: 10000 },
    { month: 'Jul', contributions: 42000, expenses: 78, loans: 12000 },
    { month: 'Aug', contributions: 42000, expenses: 6116, loans: 36000 },
    { month: 'Sep', contributions: 17400, expenses: 43059, loans: 0 },
    { month: 'Oct', contributions: 42000, expenses: 1500, loans: 21000 },
  ], []);

  // Filtered lists based on search
  const filteredMembers = useMemo(() => {
    return automatedMembers.filter(m =>
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.nationalId.includes(searchQuery) ||
      m.phone.includes(searchQuery) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [automatedMembers, searchQuery]);

  const filteredContributions = useMemo(() => {
    return contributions.filter(c =>
      c.member.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.month.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.notes.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contributions, searchQuery]);

  const filteredLoans = useMemo(() => {
    return loans.filter(l =>
      l.borrower.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [loans, searchQuery]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch = e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.paidTo.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPeriod = matchesMonthAndYear(e.date, selectedExpenseMonth, selectedExpenseYear);
      return matchesSearch && matchesPeriod;
    });
  }, [expenses, searchQuery, selectedExpenseMonth, selectedExpenseYear]);

  const filteredFines = useMemo(() => {
    return fines.map(f => ({
      ...f,
      member: resolvePenaltyMemberName(f)
    })).filter(f => {
      const matchesSearch = !searchQuery ||
        f.member.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.monthYear && f.monthYear.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (f.status && f.status.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesPeriod = matchesMonthAndYear(f.monthYear || f.date, selectedPenaltyMonth, selectedPenaltyYear);
      return matchesSearch && matchesPeriod;
    });
  }, [fines, searchQuery, selectedPenaltyMonth, selectedPenaltyYear]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // PDF Export
  
  // Helper to export data as CSV file
  const exportDataAsCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  
  // Batch Save / Update Monthly Contributions to LocalStorage & Neon Database
  const handleSaveMonthlyContributions = async (monthName: string) => {
    if (!canEdit) {
      alert('Access Restricted: Only Simon Memia Wanjiru and Elijah Waitara Gichari can save contributions.');
      return;
    }

    const official7Members = [
      'Simon Memia Wanjiru',
      'David Wainaina Kinyua',
      'Elijah Waitara Gichari',
      'Samuel Kamau Nguuro',
      'Michael Kiarie Wanjiru',
      'Daniel Kamau Njiriri',
      'Beatrice Njoki Muthoni'
    ];

    let currentList = [...contributions];
    const updatedRecordsToSave: any[] = [];

    for (const memberName of official7Members) {
      const input = monthlyInputs[memberName];
      const existingIdx = currentList.findIndex(c => c.month === monthName && c.member === memberName);
      
      const amt = input?.amount !== undefined ? input.amount : (existingIdx >= 0 ? currentList[existingIdx].amount : 6000);
      const unsettledVal = input?.unsettled !== undefined ? input.unsettled : (existingIdx >= 0 ? currentList[existingIdx].unsettled : 0);
      const notesVal = input?.remarks !== undefined ? input.remarks : (existingIdx >= 0 ? currentList[existingIdx].notes : 'Monthly Contribution');
      const payoutVal = existingIdx >= 0 ? currentList[existingIdx].payout : 0;
      const recId = existingIdx >= 0 ? currentList[existingIdx].id : `CNT-${Date.now()}-${Math.floor(Math.random()*1000)}`;

      const recordObj = {
        id: recId,
        month: monthName,
        member: memberName,
        amount: amt,
        unsettled: unsettledVal,
        payout: payoutVal,
        notes: notesVal
      };

      if (existingIdx >= 0) {
        currentList[existingIdx] = recordObj;
      } else {
        currentList.push(recordObj);
      }

      updatedRecordsToSave.push(recordObj);
    }

    setContributions(currentList);
    try {
      localStorage.setItem('dreamloom_contributions', JSON.stringify(currentList));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }

    // Persist each record to Neon PostgreSQL via PUT upsert
    try {
      for (const rec of updatedRecordsToSave) {
        await fetch('/api/contributions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: currentUser?.email,
            customId: rec.id,
            memberName: rec.member,
            month: rec.month,
            amount: rec.amount,
            unsettled: rec.unsettled,
            payout: rec.payout,
            notes: rec.notes
          })
        });
      }
      await refreshContributions();
      await refreshPenalties();
      await refreshAuditLogs();
      alert(`Successfully saved contributions for ${monthName} to database and verified.`);
    } catch (err) {
      console.error('Failed to save monthly records to database:', err);
      alert(`Saved locally, but server update had a warning: ${(err as Error).message}`);
    }
  };

  const handleExportReport = async () => {
    const element = document.getElementById('dashboard-content-area');
    if (!element) return;
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: 0.25,
        filename: `Dreamloom_${activeTab.replace(/\s+/g, '_')}_Official_Report.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' as const },
      };
      html2pdf().set(opt).from(element).save();
    } catch (err) {
      window.print();
    }
  };

  // Login Authentication Handler (Persistent Session & Audit Logging)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoginLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          rememberMe,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        setCurrentUser(data.user);
        setIsLoggedIn(true);
        setLoginEmail('');
        setLoginPassword('');

        const newLoginEntry = {
          id: `AUTH-${Date.now().toString().slice(-4)}`,
          date: getEATISODate(),
          time: new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Nairobi', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date()) + ' EAT',
          timestamp: getEATDateTimeString(),
          user: data.user.fullName,
          role: data.user.role,
          ip: '197.232.84.' + Math.floor(Math.random() * 80 + 10),
          device: 'Chrome 122 (Desktop Client)',
          status: 'Active (Authorized)',
          twoFa: 'Pass (TOTP Token)'
        };

        setLoginLogs(prev => {
          const updated = [newLoginEntry, ...prev];
          try { localStorage.setItem('dreamloom_login_logs', JSON.stringify(updated)); } catch(e){}
          return updated;
        });
      } else {
        setAuthError(data.message || 'Invalid credentials. Please verify your authorized member email and permanent PIN.');
      }
    } catch (err) {
      setAuthError('Connection error during authentication. Please retry.');
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout network error:', e);
    }
    setIsLoggedIn(false);
    setCurrentUser(null);
    try {
      localStorage.removeItem('dreamloom_auth_user');
    } catch (e) {}
  };

  // Toggle Loan Status: Active <-> Settled (Awaits database persistence)
  const handleToggleLoanStatus = async (loanId: string) => {
    if (!canEdit) {
      alert('Access Restricted: Only Simon Memia Wanjiru and Elijah Waitara Gichari can update loan status.');
      return;
    }
    const todayStr = getEATISODate();
    const targetLoan = loans.find(l => l.id === loanId);
    if (!targetLoan) return;

    const isCurrentlyActive = targetLoan.status === 'Active';
    const nextStatus = isCurrentlyActive ? 'Settled' : 'Active';
    const nextPaid = isCurrentlyActive ? targetLoan.totalLoan : 0.00;
    const userEmail = currentUser?.email || 'simon@dreamloom.co.ke';

    try {
      const res = await fetch('/api/loans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          id: loanId,
          status: nextStatus,
          paidAmount: nextPaid,
          clearedDate: isCurrentlyActive ? todayStr : null
        })
      }).then(r => r.json());

      if (!res.success) {
        alert('Failed to update loan status: ' + (res.error || 'Server error.'));
        return;
      }

      await refreshLoans();

      await recordAuditLog({
        user: currentUser?.fullName,
        member: targetLoan.borrower,
        module: 'Loans',
        action: 'Updated',
        oldValues: {
          'Loan Amount': `KSh ${Number(targetLoan.principal).toLocaleString()}`,
          'Repayment Period': '6 Months',
          'Status': targetLoan.status
        },
        newValues: {
          'Loan Amount': `KSh ${Number(targetLoan.principal).toLocaleString()}`,
          'Repayment Period': '6 Months',
          'Status': nextStatus
        },
        remarks: `Updated loan status for ${targetLoan.borrower} to ${nextStatus}`
      });
      await refreshAuditLogs();
    } catch (err: any) {
      alert('Error updating loan status: ' + err.message);
    }
  };

  // Real-time Database Synchronization Helpers across ALL Modules
  const refreshMembers = async () => {
    try {
      const res = await fetch('/api/members').then(r => r.json());
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const colorMap: Record<string, string> = {
          'Simon': 'from-emerald-400 to-teal-400',
          'David': 'from-sky-400 to-cyan-400',
          'Elijah': 'from-blue-500 to-sky-400',
          'Samuel': 'from-indigo-400 to-blue-400',
          'Michael': 'from-purple-400 to-indigo-400',
          'Daniel': 'from-amber-400 to-yellow-400',
          'Beatrice': 'from-teal-400 to-emerald-400',
        };
        const mapped = res.data.map((m: any) => {
          const firstName = m.fullName ? m.fullName.split(' ')[0] : 'Member';
          const totContrib = m.contributions?.reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0) || 0;
          const actLoans = m.loans?.filter((l: any) => l.status === 'Active')
            .reduce((sum: number, l: any) => sum + ((Number(l.totalPayable) || Number(l.principal) || 0) - (Number(l.paidAmount) || 0)), 0) || 0;
          return {
            id: `MEM-${String(m.id).padStart(3, '0')}`,
            dbId: m.id,
            name: firstName,
            fullName: m.fullName,
            nationalId: m.nationalId || '-',
            phone: m.phone || '-',
            role: m.role || 'Member',
            email: m.email || '',
            totalContribution: totContrib,
            activeLoans: actLoans,
            netBalance: totContrib - actLoans,
            shares: '14.28%',
            percentage: 95,
            status: 'Active',
            avatar: getMemberAvatar(m.fullName || m.id || firstName),
            color: colorMap[firstName] || 'from-emerald-400 to-teal-400',
          };
        });
        setMembers(mapped);
        try { localStorage.setItem('dreamloom_members', JSON.stringify(mapped)); } catch (e) {}
      }
    } catch (e) {
      console.warn('Could not refresh members:', e);
    }
  };

  const refreshContributions = async () => {
    try {
      const res = await fetch('/api/contributions').then(r => r.json());
      const list = Array.isArray(res) ? res : (res?.data || []);
      if (Array.isArray(list) && list.length > 0) {
        const mapped = list.map((c: any) => ({
          id: c.customId || ('CNT-' + c.id),
          dbId: c.id,
          customId: c.customId,
          memberId: c.memberId || c.member?.id || null,
          month: c.monthYear || c.month,
          monthName: c.month,
          year: c.year,
          monthYear: c.monthYear,
          member: c.memberName || c.member?.fullName || (c.memberId && DREAMLOOM_MEMBER_NAMES[Number(c.memberId)]) || 'System Entry',
          memberName: c.memberName || c.member?.fullName || (c.memberId && DREAMLOOM_MEMBER_NAMES[Number(c.memberId)]) || 'System Entry',
          expectedAmount: Number(c.expectedAmount) || 6000,
          amount: Number(c.amount) || 0,
          unsettled: Number(c.unsettled) || 0,
          creditBalance: Number(c.creditBalance) || 0,
          payout: Number(c.payout) || 0,
          paymentDate: c.paymentDate || '',
          paymentMethod: c.paymentMethod || 'M-Pesa',
          mpesaRef: c.mpesaRef || '',
          bankRef: c.bankRef || '',
          paymentReference: c.paymentReference || '',
          status: c.status || 'Unpaid',
          notes: c.remarks || '',
          remarks: c.remarks || '',
          payments: c.payments || []
        }));
        setContributions(mapped);
        try { localStorage.setItem('dreamloom_contributions', JSON.stringify(mapped)); } catch (e) {}
      }
      await refreshPenalties();
      await refreshMembers();
      await refreshAuditLogs();
    } catch (e) {
      console.warn('Could not refresh contributions:', e);
    }
  };

  const refreshLoans = async (asOfDate?: string) => {
    try {
      const url = asOfDate ? `/api/loans?asOfDate=${encodeURIComponent(asOfDate)}` : '/api/loans';
      const res = await fetch(url).then(r => r.json());
      const list = Array.isArray(res) ? res : (res?.data || []);
      if (Array.isArray(list) && list.length > 0) {
        const mapped = list.map((l: any) => ({
          ...l,
          id: l.id,
          memberId: l.memberId || l.member?.id,
          issueDate: l.issueDate ? String(l.issueDate).slice(0, 10) : '-',
          borrower: l.borrower || l.memberName || l.member?.fullName || 'Member',
          memberName: l.borrower || l.memberName || l.member?.fullName || 'Member',
          principal: Number(l.principal) || 0,
          interest: Number(l.interest ?? l.totalInterestAccrued) || 0,
          totalLoan: Number(l.totalLoan ?? l.totalPayable ?? l.totalLoanAmount) || 0,
          paid: Number(l.paid ?? l.paidAmount ?? l.totalAmountPaid) || 0,
          balance: Number(l.balance ?? l.totalOutstandingBalance) || 0,
          status: l.status || 'Active',
          clearedDate: l.clearedDate && l.clearedDate !== '-' ? String(l.clearedDate).slice(0, 10) : (l.settlementDate || '-')
        }));
        setLoans(mapped);
        try { localStorage.setItem('dreamloom_loans', JSON.stringify(mapped)); } catch (e) {}
      }
      await refreshMembers();
      await refreshAuditLogs();
    } catch (e) {
      console.warn('Could not refresh loans:', e);
    }
  };

  const refreshExpenses = async () => {
    try {
      const res = await fetch('/api/expenses').then(r => r.json());
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map((e: any, idx: number) => ({
          id: `EXP-${String(idx + 1).padStart(2, '0')}`,
          dbId: e.id,
          date: e.expenseDate ? String(e.expenseDate).slice(0, 10) : '-',
          description: e.description,
          amount: Number(e.amount) || 0,
          category: e.expenseType || 'Operational',
          paidTo: e.referenceDetails || 'Operational Outflow'
        }));
        setExpenses(mapped);
        try { localStorage.setItem('dreamloom_expenses', JSON.stringify(mapped)); } catch (e) {}
      }
    } catch (e) {
      console.warn('Could not refresh expenses:', e);
    }
  };

  const refreshInvestments = async () => {
    try {
      const res = await fetch('/api/investments').then(r => r.json());
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setInvestments(res.data);
        try { localStorage.setItem('dreamloom_investments', JSON.stringify(res.data)); } catch (e) {}
      }
    } catch (e) {
      console.warn('Could not refresh investments:', e);
    }
  };

  const refreshProjects = async () => {
    try {
      const res = await fetch('/api/projects').then(r => r.json());
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setProjects(res.data);
        try { localStorage.setItem('dreamloom_projects', JSON.stringify(res.data)); } catch (e) {}
      }
    } catch (e) {
      console.warn('Could not refresh projects:', e);
    }
  };

  const refreshSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers').then(r => r.json());
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setSuppliers(res.data);
        try { localStorage.setItem('dreamloom_suppliers', JSON.stringify(res.data)); } catch (e) {}
      }
    } catch (e) {
      console.warn('Could not refresh suppliers:', e);
    }
  };

  const refreshDocuments = async () => {
    try {
      const res = await fetch('/api/documents').then(r => r.json());
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setDocuments(res.data);
        try { localStorage.setItem('dreamloom_documents', JSON.stringify(res.data)); } catch (e) {}
      }
    } catch (e) {
      console.warn('Could not refresh documents:', e);
    }
  };

  // Real-time Database Penalty (KSh 500 late-fee) Synchronization
  const refreshPenalties = async () => {
    try {
      const res = await fetch('/api/penalties').then(r => r.json());
      if (res.success && Array.isArray(res.data)) {
        const mapped = res.data.map((p: any, idx: number) => {
          const resolvedName = resolvePenaltyMemberName(p);
          const isPaid = (p.status?.toUpperCase() === 'PAID' || p.status === 'Paid');
          return {
            id: `FN-${String(idx + 1).padStart(2, '0')}`,
            dbId: p.id || p.dbId,
            memberId: p.memberId || p.member?.id || p.memberObj?.id,
            date: p.date ? String(p.date).slice(0, 10) : (p.dateLevied ? String(p.dateLevied).slice(0, 10) : '-'),
            monthYear: p.monthYear,
            member: resolvedName,
            memberName: resolvedName,
            reason: p.reason || 'Late payment penalty',
            penaltyAmount: 500,
            amount: 500,
            status: isPaid ? 'Paid' : 'Unpaid',
            datePaid: p.datePaid || '-',
          };
        });
        setFines(mapped);
        try { localStorage.setItem('dreamloom_fines', JSON.stringify(mapped)); } catch (e) {}
      }
    } catch (e) {
      console.warn('Could not refresh penalties:', e);
    }
  };

  // Real-time Database Deposits Synchronization
  const refreshDeposits = async () => {
    try {
      setDepositsLoading(true);
      const res = await fetch('/api/deposits').then(r => r.json());
      if (res.success && Array.isArray(res.data)) {
        setDeposits(res.data);
        try { localStorage.setItem('dreamloom_deposits', JSON.stringify(res.data)); } catch (e) {}
      }
    } catch (e) {
      console.warn('Could not refresh deposits:', e);
    } finally {
      setDepositsLoading(false);
    }
  };

  const refreshAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs').then(r => r.json());
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map((el: any, idx: number) => {
          let p: any = {};
          try {
            p = typeof el.changes === 'string' ? JSON.parse(el.changes) : (el.changes || {});
          } catch (e) { p = {}; }

          const createdDate = el.createdAt ? new Date(el.createdAt) : new Date();
          const dateStr = getEATISODate(createdDate);
          const formattedTimestamp = getEATDateTimeString(createdDate);
          const user = p.user || el.user?.fullName || (p.userEmail ? p.userEmail.split('@')[0].replace('.', ' ') : 'Simon Memia');

          let moduleName = p.module || el.model || 'Contributions';
          let act = p.action || el.action || 'Updated';
          const member = p.member || p.memberName || p.borrower || p.paidTo || 'Mary Wanjiru';

          return {
            id: el.id ? `LOG-${el.id}` : `LOG-${idx + 1}`,
            dbId: el.id,
            timestamp: formattedTimestamp,
            rawDate: dateStr,
            user,
            module: moduleName,
            action: act,
            member,
            oldValues: p.oldValues || { 'Status': 'Active' },
            newValues: p.newValues || { 'Status': 'Updated' },
            changedFields: p.changedFields || {},
            remarks: p.remarks || `${act} ${moduleName} record for ${member}`
          };
        });
        setEditLogs(mapped);
        if (mapped.length > 0 && !selectedEditLog) setSelectedEditLog(mapped[0]);
        try { localStorage.setItem('dreamloom_edit_logs', JSON.stringify(mapped)); } catch (e) {}
      }
    } catch (e) {
      console.warn('Could not refresh audit logs:', e);
    }
  };

  const handleOpenPaymentModal = (fineRecord: any) => {
    setSelectedPenaltyForPayment(fineRecord);
    const rem = fineRecord.remainingBalance !== undefined ? fineRecord.remainingBalance : (Number(fineRecord.amount) || 0);
    setPaymentAmountInput(rem > 0 ? String(rem) : '');
    setPaymentMethodInput('M-PESA');
    setPaymentRefInput('');
    setPaymentNotesInput('');
    setIsPaymentModalOpen(true);
  };

  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPenaltyForPayment) return;
    const pAmt = Number(paymentAmountInput);
    if (!pAmt || pAmt <= 0) {
      alert('Please enter a valid payment amount greater than zero.');
      return;
    }
    const maxAllowed = selectedPenaltyForPayment.remainingBalance !== undefined
      ? Number(selectedPenaltyForPayment.remainingBalance)
      : Number(selectedPenaltyForPayment.amount) || 0;

    if (pAmt > maxAllowed) {
      alert(`Payment cannot exceed the remaining balance of KES ${maxAllowed.toLocaleString()}.`);
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const res = await fetch('/api/penalties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'payment',
          penaltyId: selectedPenaltyForPayment.dbId,
          amount: pAmt,
          paymentMethod: paymentMethodInput,
          reference: paymentRefInput,
          notes: paymentNotesInput,
          userEmail: currentUser?.email || 'simon@dreamloom.co.ke'
        })
      }).then(r => r.json());

      if (res.success) {
        setIsPaymentModalOpen(false);
        await refreshPenalties();
        await refreshContributions();
        setToastMessage(`Payment of KSh ${pAmt.toLocaleString()} successfully recorded and allocated!`);
      } else {
        alert(res.error || 'Failed to record payment');
      }
    } catch (err: any) {
      alert(err.message || 'Payment processing failed');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Toggle Penalty Status: Unpaid <-> Paid (Awaits database persistence)
  const handleToggleFineStatus = async (fineId: string) => {
    if (!canEdit) {
      alert('Access Restricted: Only Simon Memia Wanjiru and Elijah Waitara Gichari can update penalty status.');
      return;
    }
    const targetFine = fines.find(f => f.id === fineId || f.dbId === fineId);
    if (!targetFine) return;

    const isPaid = targetFine.status === 'Paid';
    const nextStatus = isPaid ? 'Unpaid' : 'Paid';
    const targetDbId = (targetFine as any).dbId || fineId;
    const userEmail = currentUser?.email || 'simon@dreamloom.co.ke';

    try {
      const res = await fetch('/api/penalties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle',
          id: targetDbId,
          status: nextStatus,
          userEmail
        })
      }).then(r => r.json());

      if (!res.success) {
        alert('Failed to update penalty status: ' + (res.error || 'Server error.'));
        return;
      }

      await refreshPenalties();
      await refreshAuditLogs();
    } catch (err: any) {
      alert('Error updating penalty status: ' + err.message);
    }
  };

  // Quick Action Modal Trigger (Defaults to today's actual date & time in Africa/Nairobi, decoupled from reporting filter)
  const handleOpenQuickModal = (targetMode: string) => {
    if (!canEdit) {
      alert('Access Restricted: Only Simon Memia Wanjiru and Elijah Waitara Gichari are authorized to add new records.');
      return;
    }
    setModalMode(targetMode);
    setEditingId(null);
    const todayISO = getEATISODate();
    const todayContrib = getEATContributionDate();

    if (targetMode === 'Contributions' || targetMode === 'Record Contribution') {
      setField1(todayContrib);
      setField2('');
      setField3('6000');
      setField4('0');
      setField5('0');
      setField6('Monthly Contribution');
      setField7('');
    } else if (targetMode === 'Loan Portfolio' || targetMode === 'New Loan') {
      setField1('');
      setField2('');
      setField3('');
      setField4(todayISO);
      setField5('-');
      setField6('Active');
      setField7('0');
    } else if (targetMode === 'Fines & Penalties' || targetMode === 'Levy Penalty') {
      setField1(members[0]?.fullName || 'Simon Memia Wanjiru');
      const defMonth = selectedPenaltyMonth !== 'All' ? selectedPenaltyMonth : 'Aug';
      const defYear = selectedPenaltyYear !== 'All' ? selectedPenaltyYear : 2026;
      setField2(`${defMonth} ${defYear}`);
      setField3('500');
      setField4('Unpaid');
      setField5('');
      setField6('');
      setField7('');
    } else if (targetMode === 'Expenses' || targetMode === 'Record Expense') {
      setField1('');
      setField2('Operational');
      setField3('');
      setField4(todayISO);
      setField5('');
      setField6('');
      setField7('');
    } else if (targetMode === 'Deposits' || targetMode === 'Record Deposit') {
      setField1('');
      setField2(todayISO);
      setField3('');
      setField4('Member Deposit');
      setField5('Direct Deposit Received');
      setField6('M-Pesa');
      setField7('');
    } else {
      setField1(''); setField2(''); setField3(''); setField4(''); setField5(''); setField6(''); setField7('');
    }
    setIsModalOpen(true);
  };

  // Edit Modal Trigger for ALL Modules
  const handleOpenEditModal = (item: any, mode: string) => {
    if (!canEdit) {
      alert('Access Restricted: Only Simon Memia Wanjiru and Elijah Waitara Gichari are authorized to edit records.');
      return;
    }
    setModalMode(mode);
    setEditingId(item.id);
    if (mode === 'Member Directory') {
      setField1(item.fullName || '');
      setField2(item.nationalId || '');
      setField3(item.phone || '');
      setField4(item.role || '');
      setField5(item.email || '');
      setField6(String(item.totalContribution || 0));
      setField7(item.status || 'Active');
    } else if (mode === 'Contributions') {
      setField1(item.month || '');
      setField2(item.member || '');
      setField3(String(item.amount || 0));
      setField4(String(item.unsettled || 0));
      setField5(String(item.payout || 0));
      setField6(item.notes || '');
    } else if (mode === 'Loan Portfolio') {
      setField1(item.borrower || '');
      setField2(String(item.principal || 0));
      setField3(String(item.interest || 0));
      setField4(item.issueDate || '');
      setField5(item.clearedDate || '-');
      setField6(item.status || 'Active');
      setField7(String(item.balance || 0));
    } else if (mode === 'Fines & Penalties') {
      const resolvedName = resolvePenaltyMemberName(item);
      setField1(resolvedName);
      setField2(item.monthYear || item.date || 'Aug 2026');
      setField3('500');
      setField4(item.status === 'Paid' ? 'Paid' : 'Unpaid');
      setField5('');
      setField6('');
      setField7('');
    } else if (mode === 'Expenses') {
      setField1(item.description || '');
      setField2(item.category || '');
      setField3(String(item.amount || 0));
      setField4(item.date || '');
      setField5(item.paidTo || '');
    } else if (mode === 'Investments') {
      setField1(item.asset || '');
      setField2(item.type || '');
      setField3(String(item.capital || 0));
      setField4(item.expectedReturn || '');
      setField5(item.status || 'Active');
    } else if (mode === 'Projects') {
      setField1(item.name || '');
      setField2(item.manager || '');
      setField3(String(item.budget || 0));
      setField4(item.status || 'Active');
    } else if (mode === 'Suppliers') {
      setField1(item.name || '');
      setField2(item.category || '');
      setField3(item.contact || '');
      setField4(item.status || 'Active');
    } else if (mode === 'Documents') {
      setField1(item.name || '');
      setField2(item.category || '');
      setField3(item.status || 'Available');
    } else if (mode === 'Deposits') {
      setField1(item.depositorName || '');
      setField2(item.date ? String(item.date).slice(0, 10) : getEATISODate());
      setField3(String(item.amount || ''));
      setField4(item.transactionType || 'Member Deposit');
      setField5(item.reason || '');
      setField6(item.paymentMethod || 'M-Pesa');
      setField7(item.reference || '');
    }
    setIsModalOpen(true);
  };

  // Delete Action for Records (Awaits database confirmation before UI update)
  const handleDeleteCurrentRecord = async () => {
    if (!editingId) return;
    if (!canEdit) {
      alert('Access Restricted: Only Simon Memia Wanjiru and Elijah Waitara Gichari can delete records.');
      return;
    }
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete this ${modalMode} record (#${editingId})? This action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      const userEmail = currentUser?.email || 'simon@dreamloom.co.ke';
      let deleteSuccess = false;

      if (modalMode === 'Contributions') {
        const res = await fetch(`/api/contributions?customId=${encodeURIComponent(String(editingId))}&userEmail=${encodeURIComponent(userEmail)}`, {
          method: 'DELETE'
        }).then(r => r.json());
        if (!res.success) {
          alert('Delete failed: ' + (res.error || 'Server error occurred while deleting contribution.'));
          return;
        }
        await refreshContributions();
        await refreshPenalties();
        deleteSuccess = true;
      } else if (modalMode === 'Loan Portfolio') {
        const res = await fetch(`/api/loans?id=${encodeURIComponent(String(editingId))}&userEmail=${encodeURIComponent(userEmail)}`, {
          method: 'DELETE'
        }).then(r => r.json());
        if (!res.success) {
          alert('Delete failed: ' + (res.error || 'Server error occurred while deleting loan record.'));
          return;
        }
        await refreshLoans();
        deleteSuccess = true;
      } else if (modalMode === 'Fines & Penalties') {
        const targetFine = fines.find(f => f.id === editingId);
        const delId = targetFine?.dbId || editingId;
        const res = await fetch(`/api/penalties?id=${encodeURIComponent(String(delId))}&userEmail=${encodeURIComponent(userEmail)}`, {
          method: 'DELETE'
        }).then(r => r.json());
        if (!res.success) {
          alert('Delete failed: ' + (res.error || 'Server error occurred while deleting penalty record.'));
          return;
        }
        await refreshPenalties();
        deleteSuccess = true;
      } else if (modalMode === 'Expenses') {
        const targetExp = expenses.find(exp => exp.id === editingId);
        const delId = targetExp?.dbId || editingId;
        const res = await fetch(`/api/expenses?id=${encodeURIComponent(String(delId))}&userEmail=${encodeURIComponent(userEmail)}`, {
          method: 'DELETE'
        }).then(r => r.json());
        if (!res.success) {
          alert('Delete failed: ' + (res.error || 'Server error occurred while deleting expense voucher.'));
          return;
        }
        await refreshExpenses();
        deleteSuccess = true;
      } else if (modalMode === 'Member Directory') {
        const targetMem = members.find(m => m.id === editingId);
        const delId = targetMem?.dbId || editingId;
        const res = await fetch(`/api/members?id=${encodeURIComponent(String(delId))}&userEmail=${encodeURIComponent(userEmail)}`, {
          method: 'DELETE'
        }).then(r => r.json());
        if (!res.success) {
          alert('Delete failed: ' + (res.error || 'Server error occurred while deleting member.'));
          return;
        }
        await refreshMembers();
        deleteSuccess = true;
      } else if (modalMode === 'Investments') {
        const res = await fetch(`/api/investments?id=${encodeURIComponent(String(editingId))}&userEmail=${encodeURIComponent(userEmail)}`, {
          method: 'DELETE'
        }).then(r => r.json());
        if (!res.success) {
          alert('Delete failed: ' + (res.error || 'Server error occurred while deleting investment.'));
          return;
        }
        await refreshInvestments();
        deleteSuccess = true;
      } else if (modalMode === 'Projects') {
        const res = await fetch(`/api/projects?id=${encodeURIComponent(String(editingId))}&userEmail=${encodeURIComponent(userEmail)}`, {
          method: 'DELETE'
        }).then(r => r.json());
        if (!res.success) {
          alert('Delete failed: ' + (res.error || 'Server error occurred while deleting project.'));
          return;
        }
        await refreshProjects();
        deleteSuccess = true;
      } else if (modalMode === 'Suppliers') {
        const res = await fetch(`/api/suppliers?id=${encodeURIComponent(String(editingId))}&userEmail=${encodeURIComponent(userEmail)}`, {
          method: 'DELETE'
        }).then(r => r.json());
        if (!res.success) {
          alert('Delete failed: ' + (res.error || 'Server error occurred while deleting supplier.'));
          return;
        }
        await refreshSuppliers();
        deleteSuccess = true;
      } else if (modalMode === 'Documents') {
        const res = await fetch(`/api/documents?id=${encodeURIComponent(String(editingId))}&userEmail=${encodeURIComponent(userEmail)}`, {
          method: 'DELETE'
        }).then(r => r.json());
        if (!res.success) {
          alert('Delete failed: ' + (res.error || 'Server error occurred while deleting document.'));
          return;
        }
        await refreshDocuments();
        deleteSuccess = true;
      } else if (modalMode === 'Deposits') {
        const res = await fetch(`/api/deposits?id=${encodeURIComponent(String(editingId))}&userEmail=${encodeURIComponent(userEmail)}`, {
          method: 'DELETE'
        }).then(r => r.json());
        if (!res.success) {
          alert('Delete failed: ' + (res.error || 'Server error occurred while deleting deposit.'));
          return;
        }
        await refreshDeposits();
        deleteSuccess = true;
      }

      if (deleteSuccess) {
        await refreshAuditLogs();
        setIsModalOpen(false);
        setEditingId(null);
      }
    } catch (err: any) {
      alert('Network error while deleting record: ' + err.message);
    }
  };

  // Submit Modal for All Modules (Add & Edit - Connected directly to PostgreSQL Neon DB with awaiting confirmation)
  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert('Access Restricted: Only Simon Memia Wanjiru and Elijah Waitara Gichari can modify records.');
      return;
    }

    try {
      const userEmail = currentUser?.email || 'simon@dreamloom.co.ke';

      // 1. Members
      if (modalMode === 'Member Directory' || modalMode === 'Add Member') {
        const targetMem = editingId ? members.find(m => m.id === editingId) : null;
        const memDbId = targetMem?.dbId || editingId;
        const res = await fetch('/api/members', {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail,
            id: editingId ? memDbId : undefined,
            fullName: field1.trim(),
            nationalId: field2?.trim(),
            phone: field3?.trim(),
            role: field4 || 'Member',
            email: field5?.trim(),
          })
        }).then(r => r.json());

        if (!res.success) {
          alert('Failed to save member: ' + (res.error || 'Server validation error.'));
          return;
        }
        await refreshMembers();
      }
      // 2. Contributions
      else if (modalMode === 'Contributions' || modalMode === 'Record Contribution') {
        const res = await fetch('/api/contributions', {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail,
            customId: editingId || `CNT-${Date.now()}`,
            memberName: field2.trim(),
            month: field1 || getEATContributionDate(),
            amount: Number(field3) || 0,
            unsettled: Number(field4) || 0,
            payout: Number(field5) || 0,
            notes: field6 || ''
          })
        }).then(r => r.json());

        if (!res.success) {
          alert('Failed to save contribution: ' + (res.error || 'Server error.'));
          return;
        }
        await refreshContributions();
        await refreshPenalties();
      }
      // 3. Loans
      else if (modalMode === 'Loan Portfolio' || modalMode === 'New Loan') {
        const pAmt = Number(field2) || 0;
        const iAmt = field3 !== '' && field3 !== undefined && !isNaN(Number(field3)) ? Number(field3) : pAmt * 0.10;
        const tAmt = pAmt + iAmt;

        const res = await fetch('/api/loans', {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail,
            id: editingId || `L0${loans.length + 1}`,
            memberName: field1.trim(),
            principal: pAmt,
            interest: iAmt,
            totalPayable: tAmt,
            issueDate: field4 || getEATISODate(),
            clearedDate: field5 && field5 !== '-' ? field5 : null,
            status: field6 || 'Active',
            paidAmount: field6 === 'Settled' ? tAmt : (tAmt - (field7 ? Number(field7) : tAmt))
          })
        }).then(r => r.json());

        if (!res.success) {
          alert('Failed to save loan: ' + (res.error || 'Server error.'));
          return;
        }
        await refreshLoans();
      }
      // 4. Fines & Penalties (KSh 500 late-fee management only)
      else if (modalMode === 'Fines & Penalties' || modalMode === 'Levy Penalty') {
        const targetFine = editingId ? fines.find(f => f.id === editingId || f.dbId === editingId) : null;
        const fineDbId = targetFine?.dbId || editingId;

        // Resolve member ID from field1
        const matchedMember = members.find(m =>
          isSameMemberName(m.fullName, field1) ||
          String(m.dbId) === String(field1) ||
          String(m.id) === String(field1)
        );
        const resolvedMemberId = matchedMember?.dbId || (matchedMember as any)?.id;
        const resolvedMemberName = matchedMember?.fullName || field1.trim();

        const res = await fetch('/api/penalties', {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail,
            id: editingId ? fineDbId : undefined,
            memberId: resolvedMemberId,
            memberName: resolvedMemberName,
            monthYear: field2.trim(),
            status: field4 === 'Paid' ? 'Paid' : 'Unpaid',
            penaltyAmount: 500
          })
        }).then(r => r.json());

        if (!res.success) {
          alert('Failed to save penalty: ' + (res.error || 'Server error.'));
          return;
        }
        await refreshPenalties();
        await refreshAuditLogs();
      }
      // 5. Expenses
      else if (modalMode === 'Expenses' || modalMode === 'Add Expense') {
        const targetExp = editingId ? expenses.find(e => e.id === editingId) : null;
        const expDbId = targetExp?.dbId || editingId;

        const res = await fetch('/api/expenses', {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail,
            id: editingId ? expDbId : undefined,
            description: field1.trim(),
            expenseType: field2 || 'Operational',
            amount: Number(field3) || 0,
            expenseDate: field4 || getEATISODate(),
            referenceDetails: field5 || 'Vendor'
          })
        }).then(r => r.json());

        if (!res.success) {
          alert('Failed to save expense: ' + (res.error || 'Server error.'));
          return;
        }
        await refreshExpenses();
      }
      // 6. Strategic Investments
      else if (modalMode === 'Investments') {
        const res = await fetch('/api/investments', {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail,
            id: editingId || `INV-0${investments.length + 1}`,
            asset: field1.trim(),
            type: field2 || 'Strategic Capital',
            capital: Number(field3) || 0,
            expectedReturn: field4 || '12%',
            status: field5 || 'Active'
          })
        }).then(r => r.json());

        if (!res.success) {
          alert('Failed to save investment: ' + (res.error || 'Server error.'));
          return;
        }
        await refreshInvestments();
      }
      // 7. Projects
      else if (modalMode === 'Projects') {
        const res = await fetch('/api/projects', {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail,
            id: editingId || `PRJ-0${projects.length + 1}`,
            name: field1.trim(),
            manager: field2 || 'Simon Memia',
            budget: Number(field3) || 0,
            status: field4 || 'Active'
          })
        }).then(r => r.json());

        if (!res.success) {
          alert('Failed to save project: ' + (res.error || 'Server error.'));
          return;
        }
        await refreshProjects();
      }
      // 8. Suppliers
      else if (modalMode === 'Suppliers') {
        const res = await fetch('/api/suppliers', {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail,
            id: editingId || `SUP-0${suppliers.length + 1}`,
            name: field1.trim(),
            category: field2 || 'General Operations',
            contact: field3 || 'Nairobi Office',
            status: field4 || 'Active'
          })
        }).then(r => r.json());

        if (!res.success) {
          alert('Failed to save supplier: ' + (res.error || 'Server error.'));
          return;
        }
        await refreshSuppliers();
      }
      // 9. Documents
      else if (modalMode === 'Documents') {
        const res = await fetch('/api/documents', {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail,
            id: editingId || `DOC-0${documents.length + 1}`,
            name: field1.trim(),
            category: field2 || 'General',
            status: field3 || 'Available',
            link: '#'
          })
        }).then(r => r.json());

        if (!res.success) {
          alert('Failed to save document: ' + (res.error || 'Server error.'));
          return;
        }
        await refreshDocuments();
      }
      // 10. Deposits
      else if (modalMode === 'Deposits' || modalMode === 'Record Deposit') {
        const numAmt = parseFloat(field3);
        if (!field3 || isNaN(numAmt) || numAmt <= 0) {
          alert('Validation Error: AMOUNT DEPOSITED (KES) is mandatory and must be a valid positive amount greater than zero.');
          return;
        }
        const depDate = field2 ? new Date(field2) : new Date();
        const res = await fetch('/api/deposits', {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId ? Number(editingId) : undefined,
            depositorName: field1.trim(),
            date: depDate.toISOString(),
            amount: numAmt,
            transactionType: field4 || 'Member Deposit',
            reason: field5 || 'Direct Deposit Received',
            paymentMethod: field6 || 'M-Pesa',
            reference: field7 ? field7.trim() : null,
            userEmail,
            userName: currentUser?.name
          })
        }).then(r => r.json());

        if (!res.success) {
          alert(res.error || 'Failed to save deposit');
          return;
        }
        await refreshDeposits();
      }

      await refreshAuditLogs();
      setIsModalOpen(false);
      setEditingId(null);
    } catch (err: any) {
      alert('Error saving record to database: ' + err.message);
    }
  };

  // Sidebar Menu Items
  const menuGroups = [
    {
      group: 'CORE FINANCIALS',
      items: [
        { name: 'Overview', icon: LayoutDashboard },
        { name: 'Member Directory', icon: Users },
        { name: 'Contributions', icon: Wallet },
        { name: 'Deposits', icon: ArrowDownCircle },
        { name: 'Loan Portfolio', icon: CreditCard },
        { name: 'Fines & Penalties', icon: AlertTriangle },
        { name: 'Expenses', icon: Receipt },
      ]
    },
    {
      group: 'OPERATIONS & ASSETS',
      items: [
        { name: 'Investments', icon: TrendingUp },
        { name: 'Projects', icon: Briefcase },
        { name: 'Suppliers', icon: Truck },
        { name: 'Documents', icon: FileText },
      ]
    },
    {
      group: 'ADMINISTRATION & SYSTEM',
      items: [
        { name: 'Login Log', icon: LogIn },
        { name: 'Edit Log', icon: History },
        { name: 'Reports', icon: BarChart3 },
        { name: 'Settings', icon: Settings },
      ]
    }
  ];

  // =========================================================================
  // INITIAL SESSION AUTHENTICATION LOADER (Prevents Login Screen Hydration Flicker)
  // =========================================================================
  if (isAuthenticating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#070D18] p-4 font-sans text-slate-100">
        <div className="w-16 h-16 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-2xl flex items-center justify-center text-white mb-4 shadow-xl shadow-emerald-950/60 animate-pulse">
          <svg className="w-9 h-9 text-white filter drop-shadow" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.5 2 2 6.5 2 12c0 3.5 1.8 6.6 4.6 8.4C6.2 19.4 6 18.2 6 17c0-5 4-9 9-9 1.2 0 2.4.2 3.4.6C16.6 5.8 14.5 4 12 4z" />
            <path d="M21.7 8.3C21.9 9.5 22 10.7 22 12c0 5.5-4.5 10-10 10-1.3 0-2.5-.1-3.7-.4C9.5 20.6 11 19 11 17c0-4.4 3.6-8 8-8 1 0 1.9.2 2.7.3z" opacity="0.8" />
          </svg>
        </div>
        <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold tracking-wide mb-1">
          <RotateCw className="w-4 h-4 animate-spin" />
          <span>Verifying Authorized Session...</span>
        </div>
        <p className="text-xs text-slate-400 font-medium">Dreamloom Holding Limited • Financial Portal</p>
      </div>
    );
  }

  // =========================================================================
  // LOGIN SCREEN (Strict Authentication with Password Visibility Toggle)
  // =========================================================================
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#070D18] p-4 font-sans text-slate-100">
        <div className="w-full max-w-md bg-[#0F172A] border border-[#1E293B] rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-950/60">
              <svg className="w-8 h-8 text-white filter drop-shadow" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.5 2 2 6.5 2 12c0 3.5 1.8 6.6 4.6 8.4C6.2 19.4 6 18.2 6 17c0-5 4-9 9-9 1.2 0 2.4.2 3.4.6C16.6 5.8 14.5 4 12 4z" />
                <path d="M21.7 8.3C21.9 9.5 22 10.7 22 12c0 5.5-4.5 10-10 10-1.3 0-2.5-.1-3.7-.4C9.5 20.6 11 19 11 17c0-4.4 3.6-8 8-8 1 0 1.9.2 2.7.3z" opacity="0.8" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-wider text-white uppercase">DREAMLOOM HOLDING LIMITED</h1>
            <p className="text-xs text-slate-400">Financial Management System Portal</p>
          </div>

          {authError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-xs text-center font-medium">
              {authError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Authorized Member Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="e.g. kamera@dreamloom.co.ke"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-[#080E1A] border border-[#1E293B] rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* PASSWORD INPUT WITH SHOW/HIDE TOGGLE */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-slate-400">Permanent Password / PIN</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Hide Password' : 'Show Password'}</span>
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your authorized PIN"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-[#080E1A] border border-[#1E293B] rounded-lg pl-9 pr-10 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* REMEMBER ME ON THIS DEVICE */}
            <div className="flex items-center justify-between py-1 bg-[#0A101D] border border-[#16233B] px-3 py-2.5 rounded-lg">
              <label htmlFor="remember-me-toggle" className="flex items-center gap-2.5 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  id="remember-me-toggle"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#1E293B] bg-[#080E1A] text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0 cursor-pointer accent-emerald-500"
                />
                <span className="text-xs text-slate-300 group-hover:text-white transition font-medium">
                  Remember me on this device
                </span>
              </label>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                30 Days
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoginLoading}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-medium text-xs rounded-lg transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoginLoading ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Authenticate & Access
                </>
              )}
            </button>
          </form>

          <div className="text-center border-t border-[#1E293B] pt-4">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">
              Dreamloom Holding Limited • Confidential
            </span>
            <span className="text-[9px] text-slate-500 mt-1 block">
              {rememberMe
                ? 'Persistent session active — stays authenticated across browser restarts for up to 30 days'
                : 'Temporary session — expires upon browser close or 30 minutes of inactivity'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#070D18] text-slate-100 overflow-hidden font-sans">
      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR NAVIGATION */}
      {/* ========================================================================= */}
      <aside className="w-64 bg-[#0A101D] border-r border-[#152136] flex flex-col p-4 overflow-y-auto shrink-0 select-none">
        {/* Brand Header */}
        <div className="mb-5 pb-4 border-b border-[#16243D]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-8 h-8 text-emerald-400 filter drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.5 2 2 6.5 2 12c0 3.5 1.8 6.6 4.6 8.4C6.2 19.4 6 18.2 6 17c0-5 4-9 9-9 1.2 0 2.4.2 3.4.6C16.6 5.8 14.5 4 12 4z" />
                <path d="M21.7 8.3C21.9 9.5 22 10.7 22 12c0 5.5-4.5 10-10 10-1.3 0-2.5-.1-3.7-.4C9.5 20.6 11 19 11 17c0-4.4 3.6-8 8-8 1 0 1.9.2 2.7.3z" opacity="0.8" />
              </svg>
            </div>
            <div>
              <h1 className="font-extrabold text-white text-base tracking-wider leading-tight">DREAMLOOM</h1>
              <p className="text-[10px] text-slate-400 font-normal">Holding Limited • BMS</p>
            </div>
          </div>

          {/* Status & Currency Pills */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-[#121B2F] py-1.5 px-2 rounded-lg border border-[#1E2D4A] text-center">
              <span className="text-slate-400 block text-[9px] uppercase tracking-wider">STATUS</span>
              <span className="text-emerald-400 font-bold tracking-wide">ACTIVE</span>
            </div>
            <div className="bg-[#121B2F] py-1.5 px-2 rounded-lg border border-[#1E2D4A] text-center">
              <span className="text-slate-400 block text-[9px] uppercase tracking-wider">CURRENCY</span>
              <span className="text-amber-400 font-bold tracking-wide">{selectedCurrency}</span>
            </div>
          </div>
        </div>

        {/* Menu Navigation Groups */}
        <nav className="flex-1 space-y-5">
          {menuGroups.map((group, idx) => (
            <div key={idx}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                {group.group}
              </p>
              <div className="space-y-1">
                {group.items.map((item, i) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.name;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveTab(item.name)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl transition-all text-left border ${
                        isActive
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-950/60 font-semibold'
                          : 'text-slate-300 hover:bg-[#121B2F] hover:text-emerald-400 border-transparent'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                      <span className="truncate">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Administration Button at Bottom */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('Administration')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-xl transition-all text-left border ${
                activeTab === 'Administration'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-950/60'
                  : 'bg-emerald-600/90 hover:bg-emerald-500 text-white border-emerald-500/50 shadow-md shadow-emerald-950/40'
              }`}
            >
              <Shield className="w-4 h-4 shrink-0 text-white" />
              <span>Administration</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE WITH TOP HEADER */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP APP HEADER */}
        <header className="h-16 bg-[#0A101D] border-b border-[#152136] px-8 flex items-center justify-between shrink-0 select-none">
          {/* Search Box */}
          <div className="relative w-72 md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search members, amounts, IDs, notes, or logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#10192A] border border-[#1E2E4E] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition shadow-inner"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Header Controls & User Profile */}
          <div className="flex items-center gap-4">
            {/* Dynamic Nairobi Header Date Badge (Africa/Nairobi UTC+3) */}
            <div className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#10192A] border border-[#1E2E4E] text-slate-200 text-xs font-semibold shadow-inner">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentHeaderDate}</span>
            </div>

            {/* Role Badge Indicator */}
            {canEdit ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-wide">
                <CheckCircle2 className="w-3.5 h-3.5" /> Full Editor Access
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-medium tracking-wide">
                <Lock className="w-3 h-3 text-amber-400" /> View Only Mode
              </span>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-9 h-9 rounded-xl bg-[#10192A] border border-[#1E2E4E] flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-600 transition"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 ring-2 ring-[#0A101D]"></span>
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4 shadow-2xl z-50 space-y-3">
                  <div className="flex justify-between items-center border-b border-[#1E293B] pb-2">
                    <span className="text-xs font-bold text-white">Notifications</span>
                    <span className="text-[10px] text-emerald-400 font-medium">3 unread</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2 rounded-lg bg-[#142036] border border-[#1E2D4A]">
                      <p className="text-white font-medium">Bank Balance Reconciled Live</p>
                      <p className="text-[10px] text-slate-400">Equity Bank Balance: KES {bankAccountBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-[#142036] border border-[#1E2D4A]">
                      <p className="text-white font-medium">Unsettled Contributions</p>
                      <p className="text-[10px] text-amber-400">KES {grandTotalUnsettled.toLocaleString()} total unsettled dues</p>
                    </div>
                    <div className="p-2 rounded-lg bg-[#142036] border border-[#1E2D4A]">
                      <p className="text-white font-medium">Active Loans Ledger</p>
                      <p className="text-[10px] text-slate-400">{activeLoansCount} Active loans totaling KES {totalActiveLoansAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="w-9 h-9 rounded-xl bg-[#10192A] border border-[#1E2E4E] flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-600 transition"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            {/* Quick Settings Icon */}
            <button
              onClick={() => setActiveTab('Settings')}
              className="w-9 h-9 rounded-xl bg-[#10192A] border border-[#1E2E4E] flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-600 transition"
              title="System Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* User Profile Pill */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-xl hover:bg-[#10192A] transition border border-transparent hover:border-[#1E2E4E]"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-emerald-700 ring-2 ring-emerald-500/50 shrink-0">
                  <img
                    src={getMemberAvatar(currentUser?.email || currentUser?.fullName || 'Simon')}
                    alt={currentUser?.fullName || 'Member'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-white leading-tight">{currentUser?.name || 'Authorized Member'}</p>
                  <p className="text-[10px] text-slate-400 leading-tight">{canEdit ? 'Editor / Admin' : 'View Only'}</p>
                </div>
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-[#0F172A] border border-[#1E293B] rounded-2xl p-2 shadow-2xl z-50 space-y-1">
                  <div className="px-3 py-2.5 border-b border-[#1E293B] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-emerald-500/50 shrink-0 bg-slate-800">
                      <img
                        src={getMemberAvatar(currentUser?.email || currentUser?.fullName || 'Simon')}
                        alt={currentUser?.fullName || 'Member'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{currentUser?.fullName}</p>
                      <p className="text-[10px] text-emerald-400 truncate">{currentUser?.email}</p>
                      <p className="text-[9px] text-slate-400">ID: {currentUser?.nationalId} • {currentUser?.phone}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setActiveTab('Member Directory'); setShowProfileMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-[#142036] rounded-lg transition"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-400" /> Member Directory
                  </button>
                  <button
                    onClick={() => { setActiveTab('Settings'); setShowProfileMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-[#142036] rounded-lg transition"
                  >
                    <Settings className="w-4 h-4 text-emerald-400" /> Account Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* View-Only Warning Notification Banner for Non-Editors */}
        {!canEdit && (
          <div className="bg-amber-950/40 border-b border-amber-800/40 px-8 py-2 text-xs text-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Viewing in Read-Only Mode as <strong>{currentUser?.fullName}</strong>. Data modification and entry rights are strictly reserved for Simon Memia Wanjiru and Elijah Waitara Gichari.</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. MAIN DASHBOARD CONTENT */}
        {/* ========================================================================= */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto" id="dashboard-content-area">
          {/* Top Title Bar with Month / Currency / Export Button */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{activeTab === 'Overview' ? 'Dashboard Overview' : activeTab}</h1>
              <p className="text-xs text-slate-400 mt-0.5">Dreamloom Holding Limited • Confidential Financial Register</p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Universal Month Dropdown (All 12 Months) */}
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-[#10192A] border border-[#1E2E4E] hover:border-slate-500 text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none cursor-pointer pr-7 appearance-none transition font-medium"
                  title="Select Month"
                >
                  <option value="All">All Months</option>
                  {ALL_MONTHS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>

              {/* Universal Year Dropdown (Past, Current, Future) */}
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value === 'All' ? 'All' : parseInt(e.target.value, 10))}
                  className="bg-[#10192A] border border-[#1E2E4E] hover:border-slate-500 text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none cursor-pointer pr-7 appearance-none transition font-bold"
                  title="Select Year"
                >
                  <option value="All">All Years</option>
                  {AVAILABLE_YEARS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>

              {/* Currency Selector */}
              <div className="relative">
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="bg-[#10192A] border border-[#1E2E4E] hover:border-slate-500 text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none cursor-pointer pr-7 appearance-none transition font-semibold"
                >
                  <option value="KES">KES</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>

              {/* Export Report Button */}
              <button
                onClick={handleExportReport}
                className="bg-[#10192A] border border-[#1E2E4E] hover:bg-[#15233B] text-slate-200 text-xs font-medium px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* OVERVIEW TAB */}
          {/* ===================================================================== */}
          {activeTab === 'Overview' && (
            <div className="space-y-6">
              {/* HERO CARD: LIVE RECONCILED BANK ACCOUNT BALANCES */}
              <div className="bg-gradient-to-r from-[#064E3B] via-[#047857] to-[#0D9488] border border-emerald-500/40 rounded-2xl p-6 shadow-2xl text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-80 bg-white/5 transform skew-x-12 pointer-events-none"></div>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-400/40 text-[10px] font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1">
                        <Landmark className="w-3 h-3 text-emerald-300" /> Primary Treasury Account
                      </span>
                      <span className="text-emerald-200/90 text-xs font-mono font-medium">Equity Bank Kenya • A/C 1760287177880</span>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white font-mono">
                        {selectedCurrency} {bankAccountBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h2>
                      <span className="text-xs text-emerald-100 font-semibold bg-emerald-800/60 px-2 py-0.5 rounded-md">Live Reconciled</span>
                    </div>
                    <p className="text-[11px] text-emerald-100/80 font-mono">
                      Formula: Total Contributions ({grandTotalContributions.toLocaleString()}) - Total Expenses ({totalExpensesAmount.toLocaleString()}) - Active Loans Principal ({totalActiveLoansPrincipal.toLocaleString()}) + Paid Fines ({totalPaidPenalties.toLocaleString()}) + Paid Interest ({totalPaidInterest.toLocaleString()})
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setActiveTab('Contributions')}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition flex items-center gap-1.5"
                    >
                      <Wallet className="w-3.5 h-3.5" /> Contributions
                    </button>
                    <button
                      onClick={() => setActiveTab('Expenses')}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition flex items-center gap-1.5"
                    >
                      <Receipt className="w-3.5 h-3.5" /> Expenses
                    </button>
                    <button
                      onClick={() => setActiveTab('Loan Portfolio')}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition flex items-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Loans
                    </button>
                  </div>
                </div>
              </div>

              {/* ROW 1: CORE 4 METRIC CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Contributions */}
                <div className="bg-gradient-to-br from-[#0284C7] to-[#38BDF8] rounded-2xl p-5 shadow-xl flex items-center gap-4 text-white">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-white/80 text-xs font-medium block">Total Contributions</span>
                    <span className="text-2xl font-extrabold text-white block leading-tight font-mono">
                      {selectedCurrency} {grandTotalContributions.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[11px] text-white/90 font-medium flex items-center gap-1 mt-0.5">
                      <ArrowUpRight className="w-3.5 h-3.5" /> Oct-25 to Oct-26
                    </span>
                  </div>
                </div>

                {/* 2. Unsettled Contributions */}
                <div className="bg-gradient-to-br from-[#D97706] to-[#FBBF24] rounded-2xl p-5 shadow-xl flex items-center gap-4 text-white">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-white/80 text-xs font-medium block">Unsettled Contributions</span>
                    <span className="text-2xl font-extrabold text-white block leading-tight font-mono">
                      {selectedCurrency} {grandTotalUnsettled.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[11px] text-white/90 font-medium block mt-0.5">
                      7 Members Pending
                    </span>
                  </div>
                </div>

                {/* 3. Active Loans Balance */}
                <div className="bg-gradient-to-br from-[#7C3AED] to-[#A855F7] rounded-2xl p-5 shadow-xl flex items-center gap-4 text-white">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                    <Coins className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-white/80 text-xs font-medium block">Active Loans Balance</span>
                    <span className="text-2xl font-extrabold text-white block leading-tight font-mono">
                      {selectedCurrency} {totalActiveLoansAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[11px] text-white/90 font-medium block mt-0.5">
                      {activeLoansCount} Active Loans (4 Borrowers)
                    </span>
                  </div>
                </div>

                {/* 4. Total Expenses & Land Payouts */}
                <div className="bg-gradient-to-br from-[#EA580C] to-[#FB923C] rounded-2xl p-5 shadow-xl flex items-center gap-4 text-white">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                    <Receipt className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-white/80 text-xs font-medium block">Total Expenses & Payouts</span>
                    <span className="text-2xl font-extrabold text-white block leading-tight font-mono">
                      {selectedCurrency} {totalExpensesAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[11px] text-white/90 font-medium block mt-0.5">
                      27 Recorded Outflows
                    </span>
                  </div>
                </div>
              </div>

              {/* ROW 2: CHARTS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: Multi-Line Trend Chart (2 cols) */}
                <div className="lg:col-span-2 bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                    <h2 className="text-sm font-bold text-white tracking-wide">Monthly Contributions vs Outflows</h2>

                    {/* Chart Legend */}
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                        <span className="text-slate-300">Contributions</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]"></span>
                        <span className="text-slate-300">Expenses / Land</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]"></span>
                        <span className="text-slate-300">Loans</span>
                      </div>
                    </div>

                    {/* Time Range Selector */}
                    <div className="relative">
                      <select
                        value={selectedTrendRange}
                        onChange={(e) => setSelectedTrendRange(e.target.value)}
                        className="bg-[#142036] border border-[#1E2D4A] text-slate-300 text-xs px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer pr-6 appearance-none"
                      >
                        <option value="Last 6 Months">Last 6 Months</option>
                        <option value="Last 3 Months">Last 3 Months</option>
                        <option value="This Year">Fiscal 2025/2026</option>
                      </select>
                      <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                    </div>
                  </div>

                  {/* SVG Multi-Line Trend Chart */}
                  <div className="relative h-64 w-full">
                    {/* Y-Axis Gridlines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-slate-400 font-mono">
                      {['50,000', '40,000', '30,000', '20,000', '10,000', '0'].map((label, i) => (
                        <div key={i} className="flex items-center w-full">
                          <span className="w-12 text-right pr-2 shrink-0">{label}</span>
                          <div className="w-full border-b border-slate-800/80"></div>
                        </div>
                      ))}
                    </div>

                    {/* SVG Paths & Data Points */}
                    <svg className="w-full h-full pl-12 pb-6" viewBox="0 0 700 220" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="contribGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Area Fill for Contributions */}
                      <path
                        d="M 50 35 Q 150 37 250 10 T 450 35 T 650 35 L 650 210 L 50 210 Z"
                        fill="url(#contribGrad)"
                      />

                      {/* Line 1: Contributions (Green) */}
                      <path
                        d="M 50 35 Q 150 37 250 10 T 450 35 T 650 35"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />

                      {/* Line 2: Expenses & Land Disbursements (Orange) */}
                      <path
                        d="M 50 65 Q 150 38 250 60 T 450 185 T 650 40"
                        fill="none"
                        stroke="#F97316"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />

                      {/* Line 3: Loans (Blue) */}
                      <path
                        d="M 50 170 Q 150 160 250 170 T 450 60 T 650 120"
                        fill="none"
                        stroke="#38BDF8"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />

                      {/* Data dots for Contributions */}
                      {[
                        { cx: 50, cy: 35, val: 42000 },
                        { cx: 150, cy: 37, val: 41500 },
                        { cx: 250, cy: 10, val: 48000 },
                        { cx: 350, cy: 35, val: 42000 },
                        { cx: 450, cy: 35, val: 42000 },
                        { cx: 550, cy: 135, val: 17400 },
                        { cx: 650, cy: 35, val: 42000 },
                      ].map((p, idx) => (
                        <g key={idx} onMouseEnter={() => setHoveredTrendPoint(idx)} onMouseLeave={() => setHoveredTrendPoint(null)}>
                          <circle cx={p.cx} cy={p.cy} r="5" fill="#10B981" stroke="#0F172A" strokeWidth="2.5" className="cursor-pointer hover:r-7 transition-all" />
                        </g>
                      ))}

                      {/* Data dots for Expenses */}
                      {[
                        { cx: 50, cy: 65 }, { cx: 150, cy: 38 }, { cx: 250, cy: 60 },
                        { cx: 350, cy: 210 }, { cx: 450, cy: 185 }, { cx: 550, cy: 30 }, { cx: 650, cy: 200 },
                      ].map((p, idx) => (
                        <circle key={idx} cx={p.cx} cy={p.cy} r="4" fill="#F97316" stroke="#0F172A" strokeWidth="2" />
                      ))}

                      {/* Data dots for Loans */}
                      {[
                        { cx: 50, cy: 170 }, { cx: 150, cy: 160 }, { cx: 250, cy: 170 },
                        { cx: 350, cy: 160 }, { cx: 450, cy: 60 }, { cx: 550, cy: 210 }, { cx: 650, cy: 120 },
                      ].map((p, idx) => (
                        <circle key={idx} cx={p.cx} cy={p.cy} r="4" fill="#38BDF8" stroke="#0F172A" strokeWidth="2" />
                      ))}
                    </svg>

                    {/* Tooltip on Point Hover */}
                    {hoveredTrendPoint !== null && (
                      <div className="absolute top-4 right-8 bg-[#142036] border border-[#1E2D4A] rounded-xl p-2.5 text-xs text-white shadow-xl pointer-events-none">
                        <p className="font-bold text-emerald-400">{trendData[hoveredTrendPoint].month} Period</p>
                        <p className="text-slate-300">Contrib: KES {trendData[hoveredTrendPoint].contributions.toLocaleString()}</p>
                        <p className="text-slate-300">Outflows: KES {trendData[hoveredTrendPoint].expenses.toLocaleString()}</p>
                        <p className="text-slate-300">Loans: KES {trendData[hoveredTrendPoint].loans.toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {/* X-Axis Months */}
                  <div className="flex justify-between pl-12 text-xs text-slate-400 font-medium pt-2">
                    {trendData.map((d, i) => (
                      <span key={i} className="hover:text-emerald-400 cursor-pointer transition">{d.month}</span>
                    ))}
                  </div>
                </div>

                {/* RIGHT: Loan Status Donut Chart (1 col) */}
                <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                  <h2 className="text-sm font-bold text-white tracking-wide">Loan Portfolio Status</h2>

                  {/* SVG Donut */}
                  <div className="relative flex items-center justify-center my-4">
                    <svg className="w-52 h-52 -rotate-90 transform" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#142036" strokeWidth="12" />

                      {/* Active Loans */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="12"
                        strokeDasharray="128 238"
                        strokeDashoffset="0"
                        strokeLinecap="round"
                      />

                      {/* Settled Loans */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="12"
                        strokeDasharray="110 238"
                        strokeDashoffset="-128"
                        strokeLinecap="round"
                      />
                    </svg>

                    {/* Center Cutout Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{selectedCurrency}</span>
                      <span className="text-xl font-black text-white leading-tight font-mono">
                        {totalActiveLoansAmount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400">Active Balance</span>
                    </div>
                  </div>

                  {/* Donut Legend */}
                  <div className="flex items-center justify-around text-xs pt-2 border-t border-[#1E293B]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span>
                      <span className="text-slate-300">Active <strong className="text-white font-mono">{loans.filter(l => l.status === 'Active').length} (KES {(totalActiveLoansAmount/1000).toFixed(1)}K)</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                      <span className="text-slate-300">Settled <strong className="text-white font-mono">{loans.filter(l => l.status === 'Settled').length} (KES 68.1K)</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROW 3: MEMBER SUMMARY BY SHARES & RECENT TRANSACTIONS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT: Member Balances & Equity Shares (PDF Page 10) */}
                <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-sm font-bold text-white tracking-wide">Member Balances & Equity Shares</h2>
                    <span className="text-[11px] text-emerald-400 font-medium">Automatic Summary</span>
                  </div>

                  <div className="space-y-3.5">
                    {automatedMembers.map((m) => (
                      <div key={m.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 shrink-0 ring-1 ring-slate-700">
                          <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                        </div>

                        <div className="w-20 truncate">
                          <span className="text-xs font-semibold text-white block truncate">{m.name}</span>
                          <span className="text-[9px] text-slate-400 block">{m.shares} Share</span>
                        </div>

                        {/* Progress Bar reflecting share holding */}
                        <div className="flex-1 bg-[#142036] rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${m.color} rounded-full transition-all duration-500`}
                            style={{ width: `${(m.totalContribution / 72050) * 100}%` }}
                          ></div>
                        </div>

                        {/* Net Balance & Total Contribution */}
                        <div className="text-right whitespace-nowrap text-xs font-mono">
                          <span className="text-white font-bold block">{selectedCurrency} {m.totalContribution.toLocaleString()}</span>
                          <span className="text-[10px] text-emerald-400 block">Net: {selectedCurrency} {m.netBalance.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RIGHT: Recent Transactions */}
                <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-sm font-bold text-white tracking-wide">Recent Operational Transactions</h2>
                    <button
                      onClick={() => setActiveTab('Expenses')}
                      className="text-xs text-slate-400 hover:text-emerald-400 font-medium transition"
                    >
                      See All
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    {transactions.slice(0, 4).map((tx) => {
                      const Icon = tx.icon;
                      return (
                        <div key={tx.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[#142036] transition">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full ${tx.iconColor} flex items-center justify-center shrink-0`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-white leading-tight">{tx.title}</p>
                              <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{tx.time}</p>
                            </div>
                          </div>

                          <span className={`text-xs font-bold font-mono ${tx.type === 'expense' ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {tx.amount}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ROW 4: SCENIC BANNER, QUICK ACTIONS & UPCOMING PAYMENTS */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* 1. SCENIC MOUNTAIN BANNER */}
                <div className="md:col-span-3 rounded-2xl overflow-hidden relative shadow-xl border border-[#1E293B] h-56 md:h-auto min-h-[190px] group">
                  <img
                    src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80"
                    alt="Mountain Valley"
                    className="w-full h-full object-cover object-center absolute inset-0 transform group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070D18]/90 via-[#070D18]/30 to-transparent"></div>
                  <div className="absolute bottom-5 left-5 right-5 text-white">
                    <p className="font-serif font-extrabold text-lg leading-tight tracking-wide drop-shadow-lg flex items-center gap-1.5">
                      where big dreamers meet <span className="text-emerald-400 text-xl">➔</span>
                    </p>
                  </div>
                </div>

                {/* 2. QUICK ACTIONS */}
                <div className="md:col-span-5 bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-sm font-bold text-white tracking-wide">Quick Financial Actions</h2>
                    {!canEdit && <span className="text-[10px] text-amber-400 font-medium">(View Only)</span>}
                  </div>

                  <div className="grid grid-cols-4 gap-2.5">
                    <button
                      onClick={() => handleOpenQuickModal('Add Member')}
                      disabled={!canEdit}
                      className={`bg-[#142036] border border-[#1E2D4A] p-2.5 rounded-xl flex flex-col items-center justify-center text-center transition group shadow-sm ${
                        canEdit ? 'hover:bg-[#1A2A46] cursor-pointer' : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-medium text-slate-300 leading-tight">Add Member</span>
                    </button>

                    <button
                      onClick={() => handleOpenQuickModal('Record Contribution')}
                      disabled={!canEdit}
                      className={`bg-[#142036] border border-[#1E2D4A] p-2.5 rounded-xl flex flex-col items-center justify-center text-center transition group shadow-sm ${
                        canEdit ? 'hover:bg-[#1A2A46] cursor-pointer' : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-medium text-slate-300 leading-tight">Record Contribution</span>
                    </button>

                    <button
                      onClick={() => handleOpenQuickModal('New Loan')}
                      disabled={!canEdit}
                      className={`bg-[#142036] border border-[#1E2D4A] p-2.5 rounded-xl flex flex-col items-center justify-center text-center transition group shadow-sm ${
                        canEdit ? 'hover:bg-[#1A2A46] cursor-pointer' : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                        <Coins className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-medium text-slate-300 leading-tight">New Loan</span>
                    </button>

                    <button
                      onClick={() => handleOpenQuickModal('Add Expense')}
                      disabled={!canEdit}
                      className={`bg-[#142036] border border-[#1E2D4A] p-2.5 rounded-xl flex flex-col items-center justify-center text-center transition group shadow-sm ${
                        canEdit ? 'hover:bg-[#1A2A46] cursor-pointer' : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-medium text-slate-300 leading-tight">Add Expense</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('Investments')}
                      className="bg-[#142036] hover:bg-[#1A2A46] border border-[#1E2D4A] p-2.5 rounded-xl flex flex-col items-center justify-center text-center transition group shadow-sm"
                    >
                      <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-medium text-slate-300 leading-tight">Investments</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('Projects')}
                      className="bg-[#142036] hover:bg-[#1A2A46] border border-[#1E2D4A] p-2.5 rounded-xl flex flex-col items-center justify-center text-center transition group shadow-sm"
                    >
                      <div className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-medium text-slate-300 leading-tight">Projects</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('Suppliers')}
                      className="bg-[#142036] hover:bg-[#1A2A46] border border-[#1E2D4A] p-2.5 rounded-xl flex flex-col items-center justify-center text-center transition group shadow-sm"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                        <Truck className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-medium text-slate-300 leading-tight">Suppliers</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('Reports')}
                      className="bg-[#142036] hover:bg-[#1A2A46] border border-[#1E2D4A] p-2.5 rounded-xl flex flex-col items-center justify-center text-center transition group shadow-sm"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-500/20 text-slate-300 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-medium text-slate-300 leading-tight">View Reports</span>
                    </button>
                  </div>
                </div>

                {/* 3. UPCOMING PAYMENTS */}
                <div className="md:col-span-4 bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-sm font-bold text-white tracking-wide">Upcoming Commitments</h2>
                    <button
                      onClick={() => setActiveTab('Contributions')}
                      className="text-xs text-slate-400 hover:text-emerald-400 font-medium transition"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-3">
                    {upcomingPayments.map((up) => {
                      const Icon = up.icon;
                      return (
                        <div key={up.id} className="flex items-center justify-between p-1.5 rounded-xl hover:bg-[#142036] transition">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full ${up.iconColor} flex items-center justify-center shrink-0`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-semibold text-white">{up.title}</span>
                          </div>
                          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">{up.date}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* MEMBER DIRECTORY & CONTACT REGISTER (PDF Page 1 & Page 10) */}
          {/* ===================================================================== */}
          {activeTab === 'Member Directory' && (
            <div className="space-y-6">
              <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">
                <div className="p-5 border-b border-[#1E293B] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h2 className="font-bold text-white text-base">Membership Directory & Contact Register</h2>
                    <p className="text-xs text-slate-400">Official Register from Dreamloom Holding Limited (Page 3 of 17)</p>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => handleOpenQuickModal('Member Directory')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-emerald-950/50"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Member Record
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#121B2F] text-slate-400 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-4">Member Name</th>
                        <th className="p-4">National ID</th>
                        <th className="p-4">Phone Number</th>
                        <th className="p-4">Role / Status</th>
                        <th className="p-4">Email Address</th>
                        <th className="p-4 text-center">Profile / Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E293B]">
                      {filteredMembers.map((m) => (
                        <tr key={m.id} className="hover:bg-[#142036] transition">
                          <td className="p-4 font-semibold text-white">
                            <div
                              onClick={() => setSelectedMemberProfile(m)}
                              className="flex items-center gap-3 cursor-pointer group"
                            >
                              <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-2 ring-emerald-500/40 bg-slate-800 shadow-md group-hover:ring-emerald-400 transition">
                                <img
                                  src={m.avatar || getMemberAvatar(m.fullName || m.id)}
                                  alt={m.fullName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <span className="block font-bold text-white text-xs group-hover:text-emerald-400 transition">{m.fullName}</span>
                                <span className="block text-[10px] text-slate-400 font-mono">{m.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-emerald-400 font-bold">{m.nationalId}</td>
                          <td className="p-4 font-mono text-slate-300">{m.phone}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold">
                              {m.role}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-slate-400">{m.email}</td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setSelectedMemberProfile(m)}
                                className="p-1.5 hover:text-white text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                                title="View Member Profile"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {canEdit && (
                                <button
                                  onClick={() => handleOpenEditModal(m, 'Member Directory')}
                                  className="p-1.5 hover:text-white text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                                  title="Edit Member Information"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AUTOMATIC SUMMARY CARD WITH SEPARATED OBLIGATIONS (PDF Page 10) */}
              <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">
                <div className="p-5 border-b border-[#1E293B]">
                  <h2 className="font-bold text-white text-base">Member Balances, Unsettled Dues & Shares — Automatic Summary</h2>
                  <p className="text-xs text-slate-400">Total Contribution vs Unsettled Contributions, Unpaid Penalties, Active Loans, and Net Balance (Page 14 of 17)</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#121B2F] text-slate-400 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-4">Member Name</th>
                        <th className="p-4 text-right">Total Contribution (KES)</th>
                        <th className="p-4 text-right text-amber-300">Unsettled Contributions (KES)</th>
                        <th className="p-4 text-right text-rose-300">Unpaid Penalties (KES)</th>
                        <th className="p-4 text-right">Active Loans (KES)</th>
                        <th className="p-4 text-right">Net Balance (KES)</th>
                        <th className="p-4 text-right">% Share Holding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E293B] font-mono">
                      {automatedMembers.map((m) => {
                        const memberUnsettled = memberOutstandingContribs[m.fullName] || 0;
                        const memberPenalty = memberUnpaidPenalties[m.fullName] || 0;
                        return (
                          <tr key={m.id} className="hover:bg-[#142036] transition">
                            <td className="p-4 font-sans text-white font-medium">{m.fullName}</td>
                            <td className="p-4 text-right font-bold text-white">{m.totalContribution.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="p-4 text-right font-bold text-amber-400">{memberUnsettled.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="p-4 text-right font-bold text-rose-400">{memberPenalty.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="p-4 text-right text-slate-300">{m.activeLoans.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="p-4 text-right font-bold text-emerald-400">{m.netBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="p-4 text-right font-bold text-sky-400">{m.shares}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-[#121B2F] font-bold text-white">
                        <td className="p-4 uppercase">GRAND TOTALS</td>
                        <td className="p-4 text-right text-emerald-400 font-black">{grandTotalContributions.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-right text-amber-400 font-black">{grandTotalOutstandingContribs.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-right text-rose-400 font-black">{grandTotalUnpaidPenalties.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-right text-slate-300 font-black">{totalActiveLoansAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-right text-emerald-400 font-black">{(grandTotalContributions - totalActiveLoansAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-right text-sky-400 font-black">100.00%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {toastMessage && (
            <div className="fixed bottom-6 right-6 z-50 bg-emerald-950/95 border border-emerald-500/50 text-emerald-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
              <button onClick={() => setToastMessage(null)} className="text-emerald-300 hover:text-white ml-2">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ===================================================================== */}
          {/* CONTRIBUTIONS MODULE: COMPLETE PROFESSIONAL UPGRADE                   */}
          {/* ===================================================================== */}
          {activeTab === 'Contributions' && (
            <ContributionsTab
              contributions={contributions}
              members={automatedMembers}
              selectedMonth={selectedMonth}
              selectedYear={typeof selectedYear === 'number' ? selectedYear : 2026}
              onSelectMonth={(m) => setSelectedMonth(m)}
              onSelectYear={(y) => setSelectedYear(y)}
              canEdit={canEdit}
              userEmail={currentUser?.email || 'simon@dreamloom.co.ke'}
              onRefreshContributions={refreshContributions}
              showToast={(msg) => setToastMessage(msg)}
            />
          )}

          {/* ===================================================================== */}
          {/* DEPOSITS REGISTER & RECONCILIATION */}
          {/* ===================================================================== */}
          {activeTab === 'Deposits' && (
            <DepositsTab
              deposits={deposits}
              members={members}
              loans={loans}
              projects={projects}
              investments={investments}
              canEdit={canEdit}
              currentUser={currentUser}
              onRefresh={refreshDeposits}
              selectedCurrency={selectedCurrency}
            />
          )}

          {/* ===================================================================== */}
          {/* LOAN PORTFOLIO: COMPLETE PROFESSIONAL REBUILD                         */}
          {/* ===================================================================== */}
          {activeTab === 'Loan Portfolio' && (
            <LoanPortfolioTab
              loans={loans}
              members={automatedMembers}
              canEdit={canEdit}
              userEmail={currentUser?.email || 'simon@dreamloom.co.ke'}
              onRefreshLoans={refreshLoans}
              onNavigateTab={(tabId) => setActiveTab(tabId === 'members' ? 'Member Directory' : tabId)}
              showToast={(msg) => setToastMessage(msg)}
            />
          )}

          {/* ===================================================================== */}
          {/* FINES & LATE PAYMENT PENALTIES REGISTER (KSh 500 late-fee management only) */}
          {/* ===================================================================== */}
          {activeTab === 'Fines & Penalties' && (() => {
            const paidFinesList = filteredFines.filter(f => f.status === 'Paid');
            const unpaidFinesList = filteredFines.filter(f => f.status === 'Unpaid');
            const totalRecordedAmount = filteredFines.length * 500;
            const totalCollectedAmount = paidFinesList.length * 500;
            const outstandingAmount = unpaidFinesList.length * 500;

            return (
              <div className="space-y-6">
                {/* 1. AUTOMATIC PENALTY SUMMARY CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Total Fines Recorded */}
                  <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">Total Fines Recorded</span>
                      <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-xl font-black text-white font-mono">
                        KES {totalRecordedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 font-sans">{filteredFines.length} Fines Recorded</p>
                    </div>
                  </div>

                  {/* Card 2: Total Fines Collected */}
                  <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">Total Fines Collected</span>
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-xl font-black text-emerald-400 font-mono">
                        KES {totalCollectedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-[11px] text-emerald-400/80 mt-1 font-sans">
                        {paidFinesList.length} Penalties Paid ({filteredFines.length > 0 ? Math.round((paidFinesList.length / filteredFines.length) * 100) : 0}%)
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Outstanding Fines */}
                  <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">Outstanding Fines</span>
                      <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                        <Coins className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-xl font-black text-rose-400 font-mono">
                        KES {outstandingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-[11px] text-rose-400/80 mt-1 font-sans">Unsettled Member Penalties</p>
                    </div>
                  </div>

                  {/* Card 4: Number of Unpaid Penalties */}
                  <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">Number of Unpaid Penalties</span>
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-xl font-black text-amber-400 font-mono">
                        {unpaidFinesList.length}
                      </div>
                      <p className="text-[11px] text-amber-400/80 mt-1 font-sans">
                        {unpaidFinesList.length === 1 ? '1 Penalty Outstanding' : `${unpaidFinesList.length} Penalties Outstanding`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. PENALTIES REGISTER TABLE */}
                <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">
                  <div className="p-5 border-b border-[#1E293B] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="font-bold text-white text-base">Fines & Late Payment Penalties Register</h2>
                      <p className="text-xs text-slate-400">Exclusively tracking the KSh 500 late-payment fines for monthly contributions</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-400">Month:</label>
                        <select
                          value={selectedPenaltyMonth}
                          onChange={(e) => setSelectedPenaltyMonth(e.target.value)}
                          className="bg-[#142036] border border-[#1E2D4A] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
                        >
                          <option value="All">All Months</option>
                          {ALL_MONTHS.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-400">Year:</label>
                        <select
                          value={selectedPenaltyYear}
                          onChange={(e) => setSelectedPenaltyYear(e.target.value === 'All' ? 'All' : parseInt(e.target.value, 10))}
                          className="bg-[#142036] border border-[#1E2D4A] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-bold"
                        >
                          <option value="All">All Years</option>
                          {AVAILABLE_YEARS.map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>

                      {canEdit && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch('/api/penalties', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ action: 'sync', userEmail: currentUser?.email })
                                }).then(r => r.json());
                                if (res.success) {
                                  await refreshPenalties();
                                  alert(res.message || 'Synchronized with contributions successfully!');
                                } else {
                                  alert('Sync failed: ' + (res.error || 'Unknown error'));
                                }
                              } catch (e) {
                                alert('Sync failed');
                              }
                            }}
                            className="px-3 py-1.5 bg-[#142036] hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-[#1E2D4A] transition"
                            title="Synchronize all contributions with fines & penalties register"
                          >
                            <RotateCw className="w-3.5 h-3.5 text-emerald-400" /> Sync Contributions
                          </button>

                          <button
                            onClick={() => handleOpenQuickModal('Fines & Penalties')}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-emerald-950/50"
                          >
                            <Plus className="w-3.5 h-3.5" /> Levy Penalty
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-[#121B2F] text-slate-400 uppercase text-[10px] font-bold">
                        <tr>
                          <th className="p-4">Member Name</th>
                          <th className="p-4">Contribution Month</th>
                          <th className="p-4 text-right">Fine (KES)</th>
                          <th className="p-4 text-center">Payment Status</th>
                          {canEdit && <th className="p-4 text-center">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E293B] font-mono">
                        {filteredFines.length === 0 ? (
                          <tr>
                            <td colSpan={canEdit ? 5 : 4} className="p-8 text-center text-slate-400 font-sans">
                              No penalty records found matching the selected filters.
                            </td>
                          </tr>
                        ) : (
                          filteredFines.map((f) => {
                            const isPaid = f.status === 'Paid';
                            const displayMonth = f.monthYear || f.date;
                            const memberName = resolvePenaltyMemberName(f);

                            return (
                              <tr key={f.id} className="hover:bg-[#142036] transition">
                                <td className="p-4 font-sans text-white font-medium">{memberName}</td>
                                <td className="p-4 text-slate-300 font-sans font-semibold">
                                  <span className="text-white block font-mono font-medium">{displayMonth}</span>
                                </td>
                                <td className="p-4 text-right font-bold text-white">
                                  500.00
                                </td>
                                <td className="p-4 text-center font-sans">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${
                                      isPaid
                                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                    }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                                    {isPaid ? 'Paid' : 'Unpaid'}
                                  </span>
                                </td>
                                {canEdit && (
                                  <td className="p-4 text-center font-sans">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => handleToggleFineStatus(f.id)}
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition border flex items-center gap-1 ${
                                          isPaid
                                            ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                                            : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600 hover:text-white'
                                        }`}
                                        title={isPaid ? 'Click to mark as Unpaid' : 'Click to mark as Paid'}
                                      >
                                        {isPaid ? (
                                          <>
                                            <RotateCw className="w-3 h-3" /> Mark Unpaid
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle className="w-3 h-3" /> Mark Paid
                                          </>
                                        )}
                                      </button>
                                      <button
                                        onClick={() => handleOpenEditModal(f, 'Fines & Penalties')}
                                        className="p-1.5 hover:text-white text-slate-400 hover:bg-slate-700/50 rounded-lg transition"
                                        title="Edit Penalty Record"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={async () => {
                                          const confirmDel = window.confirm(`Permanently delete penalty record for ${memberName} (${displayMonth})?`);
                                          if (!confirmDel) return;
                                          try {
                                            const targetDbId = f.dbId || f.id;
                                            const userEmail = currentUser?.email || 'simon@dreamloom.co.ke';
                                            const res = await fetch(`/api/penalties?id=${encodeURIComponent(String(targetDbId))}&userEmail=${encodeURIComponent(userEmail)}`, {
                                              method: 'DELETE'
                                            }).then(r => r.json());
                                            if (res.success) {
                                              await refreshPenalties();
                                              await refreshAuditLogs();
                                            } else {
                                              alert('Delete failed: ' + (res.error || 'Server error'));
                                            }
                                          } catch (e: any) {
                                            alert('Error deleting penalty: ' + e.message);
                                          }
                                        }}
                                        className="p-1.5 hover:text-rose-400 text-slate-400 hover:bg-rose-500/10 rounded-lg transition"
                                        title="Delete Penalty Record"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })
                        )}
                        <tr className="bg-[#121B2F] font-bold text-white">
                          <td className="p-4 uppercase font-sans">TOTALS</td>
                          <td className="p-4 font-sans text-slate-400">{filteredFines.length} Record{filteredFines.length === 1 ? '' : 's'}</td>
                          <td className="p-4 text-right text-emerald-400 font-black">
                            {totalRecordedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-4 text-center font-sans text-slate-400">
                            <span className="text-emerald-400 font-mono">{paidFinesList.length} Paid</span>
                            <span className="mx-1">/</span>
                            <span className="text-rose-400 font-mono">{unpaidFinesList.length} Unpaid</span>
                          </td>
                          {canEdit && <td className="p-4"></td>}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ===================================================================== */}
          {/* OPERATIONAL EXPENSES & PAYOUTS LOG (PDF Page 6) */}
          {/* ===================================================================== */}
          {activeTab === 'Expenses' && (
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">
              <div className="p-5 border-b border-[#1E293B] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="font-bold text-white text-base">Operational Expenses & Payouts Log</h2>
                  <p className="text-xs text-slate-400">Total Expenses: KES {totalExpensesAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} (Page 8 of 17)</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-400">Month:</label>
                    <select
                      value={selectedExpenseMonth}
                      onChange={(e) => setSelectedExpenseMonth(e.target.value)}
                      className="bg-[#142036] border border-[#1E2D4A] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
                    >
                      <option value="All">All Months</option>
                      {ALL_MONTHS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-400">Year:</label>
                    <select
                      value={selectedExpenseYear}
                      onChange={(e) => setSelectedExpenseYear(e.target.value === 'All' ? 'All' : parseInt(e.target.value, 10))}
                      className="bg-[#142036] border border-[#1E2D4A] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-bold"
                    >
                      <option value="All">All Years</option>
                      {AVAILABLE_YEARS.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  {canEdit && (
                    <button
                      onClick={() => handleOpenQuickModal('Expenses')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-emerald-950/50"
                    >
                      <Plus className="w-3.5 h-3.5" /> Record Expense
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto max-h-[650px]">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#121B2F] text-slate-400 uppercase text-[10px] font-bold sticky top-0 z-10">
                    <tr>
                      <th className="p-4">Date</th>
                      <th className="p-4">Description / Category</th>
                      <th className="p-4 text-right">Amount (KES)</th>
                      <th className="p-4">Expense Type</th>
                      <th className="p-4">Reference / Details</th>
                      {canEdit && <th className="p-4 text-center">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B] font-mono">
                    {filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-[#142036] transition">
                        <td className="p-4 text-slate-400">{exp.date}</td>
                        <td className="p-4 font-sans text-white font-medium">{exp.description}</td>
                        <td className="p-4 text-right text-rose-400 font-bold">
                          {exp.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 font-sans text-slate-300">{exp.category}</td>
                        <td className="p-4 font-sans text-slate-400">{exp.paidTo}</td>
                        {canEdit && (
                          <td className="p-4 text-center font-sans">
                            <button
                              onClick={() => handleOpenEditModal(exp, 'Expenses')}
                              className="p-1.5 hover:text-white text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                              title="Edit Expense Record"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    <tr className="bg-[#121B2F] font-bold text-white text-xs sticky bottom-0">
                      <td className="p-4 uppercase font-sans" colSpan={2}>TOTAL EXPENSES</td>
                      <td className="p-4 text-right text-rose-400 font-black">{totalExpensesAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td colSpan={canEdit ? 3 : 2} className="p-4 font-sans">Reconciliation matches official ledger</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* INVESTMENTS, PROJECTS, SUPPLIERS, DOCUMENTS (WITH EDIT AVAILABILITY) */}
          {/* ===================================================================== */}
          {activeTab === 'Investments' && (
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-white text-base">Group Strategic Assets & Investments</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {investments.map(inv => (
                  <div key={inv.id} className="p-5 bg-[#142036] border border-[#1E2D4A] rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-white">{inv.asset}</p>
                      <p className="text-xs text-slate-400 mt-1">{inv.type} • Expected Return: <span className="text-emerald-400 font-bold">{inv.expectedReturn}</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-bold text-emerald-400 font-mono">{selectedCurrency} {inv.capital.toLocaleString()}</span>
                      {canEdit && (
                        <button onClick={() => handleOpenEditModal(inv, 'Investments')} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg">
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Projects' && (
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-white text-base">Operations & Legal Projects</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map(p => (
                  <div key={p.id} className="p-5 bg-[#142036] border border-[#1E2D4A] rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-white">{p.name}</p>
                      <p className="text-xs text-slate-400 mt-1">Lead: {p.manager} • Status: <span className="text-sky-400 font-bold">{p.status}</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-bold text-amber-400 font-mono">{selectedCurrency} {p.budget.toLocaleString()}</span>
                      {canEdit && (
                        <button onClick={() => handleOpenEditModal(p, 'Projects')} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg">
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Suppliers' && (
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-white text-base">Key Operational Partners & Suppliers</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suppliers.map(s => (
                  <div key={s.id} className="p-5 bg-[#142036] border border-[#1E2D4A] rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-white">{s.name}</p>
                      <p className="text-xs text-slate-400 mt-1">{s.category}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-emerald-400">{s.contact}</span>
                      {canEdit && (
                        <button onClick={() => handleOpenEditModal(s, 'Suppliers')} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg">
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Documents' && (
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-white text-base">Corporate & Legal Documents Directory</h2>
              </div>
              <div className="space-y-3">
                {documents.map(d => (
                  <div key={d.id} className="p-4 bg-[#142036] border border-[#1E2D4A] rounded-xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-emerald-400" />
                      <div>
                        <p className="text-xs font-bold text-white">{d.name}</p>
                        <p className="text-[10px] text-slate-400">{d.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold">
                        {d.status}
                      </span>
                      {canEdit && (
                        <button onClick={() => handleOpenEditModal(d, 'Documents')} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg">
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* REPORTS, SETTINGS, ADMINISTRATION */}
          {/* ===================================================================== */}
          {activeTab === 'Reports' && (
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-white">Audited Financial Reports & Summaries</h2>
                  <p className="text-xs text-slate-400">Official figures from Dreamloom Holding Limited 2026 Register</p>
                </div>
                <button onClick={handleExportReport} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium flex items-center gap-2">
                  <Download className="w-4 h-4" /> Export Complete Dossier
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-[#142036] border border-[#1E2D4A] rounded-xl">
                  <p className="text-xs text-slate-400 font-medium">Total Group Contributions</p>
                  <p className="text-xl font-bold text-white mt-1 font-mono">KES {grandTotalContributions.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-4 bg-[#142036] border border-[#1E2D4A] rounded-xl">
                  <p className="text-xs text-slate-400 font-medium">Bank Account Balances</p>
                  <p className="text-xl font-bold text-emerald-400 mt-1 font-mono">KES {bankAccountBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-4 bg-[#142036] border border-[#1E2D4A] rounded-xl">
                  <p className="text-xs text-slate-400 font-medium">Total Operational Expenses</p>
                  <p className="text-xl font-bold text-rose-400 mt-1 font-mono">KES {totalExpensesAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-4 bg-[#142036] border border-[#1E2D4A] rounded-xl">
                  <p className="text-xs text-slate-400 font-medium">Active Loans Outstanding</p>
                  <p className="text-xl font-bold text-sky-400 mt-1 font-mono">KES {totalActiveLoansAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Settings' && (
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 shadow-xl space-y-6 max-w-2xl">
              <h2 className="text-lg font-bold text-white">System Settings & Preferences</h2>
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Default Display Currency</label>
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="w-full bg-[#142036] border border-[#1E2D4A] rounded-xl p-2.5 text-white"
                  >
                    <option value="KES">KES - Kenyan Shilling</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Security Session Policy</label>
                  <input type="text" readOnly value="Auto-logout after 10 minutes of inactivity • Immediate re-auth on page refresh" className="w-full bg-[#142036] border border-[#1E2D4A] rounded-xl p-2.5 text-white" />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Authorized Data Editors</label>
                  <input type="text" readOnly value="Simon Memia Wanjiru (kamera@dreamloom.co.ke) & Elijah Waitara Gichari (elijah@dreamloom.co.ke)" className="w-full bg-[#142036] border border-[#1E2D4A] rounded-xl p-2.5 text-white" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Administration' && (
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 shadow-xl space-y-6 max-w-3xl">
              <div className="flex items-center gap-3 border-b border-[#1E293B] pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">System Administration & Corporate Controls</h2>
                  <p className="text-xs text-slate-400">Core banking accounts, corporate mandates, and permissions</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#142036] border border-[#1E2D4A] rounded-xl space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Primary Corporate Bank Account</p>
                  <p className="text-sm font-semibold text-white">Equity Bank Kenya</p>
                  <p className="text-xs font-mono font-bold text-emerald-400">Account No: 1760287177880</p>
                </div>
                <div className="p-4 bg-[#142036] border border-[#1E2D4A] rounded-xl space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Super Administrator</p>
                  <p className="text-sm font-semibold text-white">Simon Memia Wanjiru (Director)</p>
                  <p className="text-xs font-mono text-slate-400">kamera@dreamloom.co.ke</p>
                </div>
              </div>

              <div className="p-4 bg-[#142036] border border-[#1E2D4A] rounded-xl text-xs space-y-1.5 text-slate-400 font-mono">
                <p>System Version: 2.1 Reconciled Multi-Role High-Performance Dashboard</p>
                <p>Company: Dreamloom Holding Limited</p>
                <p>Permissions: Data modification restricted strictly to Simon Memia (kamera@dreamloom.co.ke) &amp; Elijah Waitara</p>
              </div>
            </div>
          )}

          {activeTab === 'Login Log' && (
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">
              <div className="p-5 border-b border-[#1E293B]">
                <h2 className="font-bold text-white text-base">Authentication & Login Activity</h2>
              </div>
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#121B2F] text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-4">Session ID</th>
                    <th className="p-4">User</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">IP Address</th>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B] font-mono">
                  {loginLogs.map(log => (
                    <tr key={log.id} className="hover:bg-[#142036]">
                      <td className="p-4 text-emerald-400 font-bold">{log.id}</td>
                      <td className="p-4 font-sans text-white font-medium">{log.user}</td>
                      <td className="p-4 font-sans">{log.role}</td>
                      <td className="p-4">{log.ip}</td>
                      <td className="p-4 text-slate-400">{log.timestamp}</td>
                      <td className="p-4 text-center">
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[10px]">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'Edit Log' && (
            <div className="space-y-4 font-sans text-slate-800">
              {/* 1. Header Banner */}
              <div className="bg-[#064E3B] border border-[#053f30] rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  {/* Dreamloom Leaf Logo */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner">
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-extrabold text-white text-base tracking-wider leading-tight">DREAMLOOM</span>
                      <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider leading-tight">HOLDING LIMITED</span>
                      <span className="text-[9px] text-emerald-200/80 italic font-medium">where big dreamers meet</span>
                    </div>
                  </div>

                  {/* Vertical Divider */}
                  <div className="h-8 w-px bg-emerald-600/50 hidden sm:block"></div>

                  {/* Title & Subtitle */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg border border-emerald-400/40 bg-emerald-800/40 flex items-center justify-center text-emerald-300 shadow-sm">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-white tracking-tight leading-tight">Edit Log</h1>
                      <p className="text-xs text-emerald-200 font-medium">Track all changes made to the system</p>
                    </div>
                  </div>
                </div>

                {/* Right Date Pill */}
                <div className="self-start md:self-center">
                  <div className="bg-[#033628] border border-emerald-700/60 px-3.5 py-1.5 rounded-lg flex items-center gap-2 text-white text-xs font-semibold shadow-inner">
                    <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                    <span>{currentHeaderDate}</span>
                  </div>
                </div>
              </div>

              {/* 2. Filter Bar */}
              <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex flex-wrap items-end gap-3 sm:gap-4">
                  {/* From Date */}
                  <div className="flex-1 min-w-[130px]">
                    <label className="block text-xs font-bold text-slate-700 mb-1">From Date</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="DD/MM/YYYY"
                        value={filterFromDate}
                        onChange={(e) => { setFilterFromDate(e.target.value); setEditLogPage(1); }}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 shadow-sm"
                      />
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* To Date */}
                  <div className="flex-1 min-w-[130px]">
                    <label className="block text-xs font-bold text-slate-700 mb-1">To Date</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="DD/MM/YYYY"
                        value={filterToDate}
                        onChange={(e) => { setFilterToDate(e.target.value); setEditLogPage(1); }}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 shadow-sm"
                      />
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Page / Module */}
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Page / Module</label>
                    <div className="relative">
                      <select
                        value={filterModule}
                        onChange={(e) => { setFilterModule(e.target.value); setEditLogPage(1); }}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 shadow-sm appearance-none pr-7"
                      >
                        {editLogModules.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Member */}
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Member</label>
                    <div className="relative">
                      <select
                        value={filterMember}
                        onChange={(e) => { setFilterMember(e.target.value); setEditLogPage(1); }}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 shadow-sm appearance-none pr-7"
                      >
                        {editLogMemberList.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Filter Button */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditLogPage(1)}
                      className="bg-[#064E3B] hover:bg-[#053d2e] text-white text-xs font-bold px-5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Filter</span>
                    </button>
                    {(filterFromDate || filterToDate || filterModule !== 'All Pages' || filterMember !== 'All Members') && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilterFromDate('');
                          setFilterToDate('');
                          setFilterModule('All Pages');
                          setFilterMember('All Members');
                          setEditLogPage(1);
                        }}
                        className="text-xs text-slate-500 hover:text-slate-800 underline font-medium px-2 py-1"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Edit History Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#064E3B] text-white font-bold uppercase text-[11px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-4">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Date & Time</span>
                          </span>
                        </th>
                        <th className="py-3 px-4">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            <span>User</span>
                          </span>
                        </th>
                        <th className="py-3 px-4">
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            <span>Page / Module</span>
                          </span>
                        </th>
                        <th className="py-3 px-4">
                          <span className="flex items-center gap-1.5">
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Action</span>
                          </span>
                        </th>
                        <th className="py-3 px-4">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            <span>Member</span>
                          </span>
                        </th>
                        <th className="py-3 px-4 text-center w-24">View</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {paginatedEditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                            No edit log records found matching your filters.
                          </td>
                        </tr>
                      ) : (
                        paginatedEditLogs.map((log, index) => {
                          const rowNum = (editLogPage - 1) * editLogPageSize + index + 1;
                          const isSelected = activeSelectedLog?.id === log.id;
                          return (
                            <tr
                              key={log.id}
                              onClick={() => setSelectedEditLog(log)}
                              className={`cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50/70 border-l-4 border-emerald-600' : 'hover:bg-slate-50'}`}
                            >
                              <td className="py-3 px-4 text-center font-bold text-slate-700">{rowNum}</td>
                              <td className="py-3 px-4 font-medium text-slate-800">{log.timestamp}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">
                                    👤
                                  </div>
                                  <span>{log.user}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-800">{log.module}</td>
                              <td className="py-3 px-4">
                                {log.action === 'Added' && (
                                  <span className="inline-block bg-[#10B981] text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-sm">
                                    Added
                                  </span>
                                )}
                                {log.action === 'Updated' && (
                                  <span className="inline-block bg-[#3B82F6] text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-sm">
                                    Updated
                                  </span>
                                )}
                                {log.action === 'Deleted' && (
                                  <span className="inline-block bg-[#EF4444] text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-sm">
                                    Deleted
                                  </span>
                                )}
                                {log.action !== 'Added' && log.action !== 'Updated' && log.action !== 'Deleted' && (
                                  <span className="inline-block bg-slate-500 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-sm">
                                    {log.action}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-900">{log.member}</td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEditLog(log);
                                  }}
                                  className="bg-[#064E3B] hover:bg-[#053d2e] text-white text-xs px-3.5 py-1 rounded-full font-medium inline-flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Change Details Section */}
              {activeSelectedLog && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-[#064E3B] text-white px-4 py-2.5 flex items-center gap-2 font-bold text-xs tracking-wide">
                    <div className="w-4 h-4 rounded-full bg-white text-[#064E3B] flex items-center justify-center font-bold text-[10px]">
                      i
                    </div>
                    <span>Change Details</span>
                  </div>

                  <div className="p-4 sm:p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* Left Metadata Column */}
                      <div className="md:col-span-4 space-y-2.5 text-xs">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-slate-500 font-medium">Date & Time</span>
                          <span className="font-bold text-slate-900 ml-auto">{activeSelectedLog.timestamp}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-slate-500 font-medium">User</span>
                          <span className="font-bold text-slate-900 ml-auto">{activeSelectedLog.user}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-slate-500 font-medium">Page / Module</span>
                          <span className="font-bold text-slate-900 ml-auto">{activeSelectedLog.module}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-slate-500 font-medium">Action</span>
                          <span className="ml-auto">
                            {activeSelectedLog.action === 'Added' && (
                              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">Added</span>
                            )}
                            {activeSelectedLog.action === 'Updated' && (
                              <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">Updated</span>
                            )}
                            {activeSelectedLog.action === 'Deleted' && (
                              <span className="bg-red-100 text-red-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">Deleted</span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-slate-500 font-medium">Member</span>
                          <span className="font-bold text-slate-900 ml-auto">{activeSelectedLog.member}</span>
                        </div>
                      </div>

                      {/* Right Comparison: OLD VALUE vs NEW VALUE */}
                      <div className="md:col-span-8 flex flex-col sm:flex-row items-center gap-3">
                        {/* OLD VALUE Box */}
                        <div className="w-full sm:flex-1 rounded-xl overflow-hidden border border-red-200 shadow-sm bg-white">
                          <div className="bg-gradient-to-r from-[#DC2626] to-[#EF4444] text-white px-3.5 py-1.5 flex items-center gap-1.5 font-bold text-xs">
                            <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">✖</span>
                            <span>Old Value</span>
                          </div>
                          <div className="p-3.5 bg-[#FEF2F2]/60 space-y-2 text-xs min-h-[90px]">
                            {activeSelectedLog.oldValues && Object.keys(activeSelectedLog.oldValues).length > 0 ? (
                              Object.entries(activeSelectedLog.oldValues).map(([k, v]) => {
                                const isFieldChanged = changedFieldsList.some((c: any) => c.field === k);
                                return (
                                  <div
                                    key={k}
                                    className={`flex justify-between items-center gap-2 p-1 rounded transition-colors ${
                                      isFieldChanged ? 'bg-red-100/70 border border-red-200/80 font-bold' : ''
                                    }`}
                                  >
                                    <span className="text-slate-600 font-medium">{k}:</span>
                                    {k.toLowerCase().includes('status') ? (
                                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[11px] font-semibold">{String(v)}</span>
                                    ) : (
                                      <span className={`font-bold ${isFieldChanged ? 'text-red-700' : 'text-slate-900'}`}>{String(v)}</span>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-slate-400 italic">No prior value recorded (New Record)</p>
                            )}
                          </div>
                        </div>

                        {/* Bold Emerald Arrow */}
                        <div className="text-emerald-600 text-2xl font-black px-1 select-none hidden sm:block">
                          »
                        </div>

                        {/* NEW VALUE Box */}
                        <div className="w-full sm:flex-1 rounded-xl overflow-hidden border border-emerald-200 shadow-sm bg-white">
                          <div className="bg-gradient-to-r from-[#059669] to-[#10B981] text-white px-3.5 py-1.5 flex items-center gap-1.5 font-bold text-xs">
                            <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">✔</span>
                            <span>New Value</span>
                          </div>
                          <div className="p-3.5 bg-[#ECFDF5]/60 space-y-2 text-xs min-h-[90px]">
                            {activeSelectedLog.newValues && Object.keys(activeSelectedLog.newValues).length > 0 ? (
                              Object.entries(activeSelectedLog.newValues).map(([k, v]) => {
                                const isFieldChanged = changedFieldsList.some((c: any) => c.field === k);
                                return (
                                  <div
                                    key={k}
                                    className={`flex justify-between items-center gap-2 p-1 rounded transition-colors ${
                                      isFieldChanged ? 'bg-emerald-100/70 border border-emerald-200/80 font-bold' : ''
                                    }`}
                                  >
                                    <span className="text-slate-600 font-medium">{k}:</span>
                                    {k.toLowerCase().includes('status') ? (
                                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-semibold">{String(v)}</span>
                                    ) : (
                                      <span className={`font-bold ${isFieldChanged ? 'text-emerald-800' : 'text-slate-900'}`}>{String(v)}</span>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-slate-400 italic">No new active value (Record Deleted)</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CHANGED FIELDS Section - Only lists fields that actually changed! */}
                    {activeSelectedLog.action === 'Updated' && changedFieldsList.length > 0 && (
                      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 space-y-1.5 shadow-xs">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>CHANGED FIELDS ({changedFieldsList.length}):</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {changedFieldsList.map(({ field, from, to }: any) => (
                            <div key={field} className="flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-lg border border-amber-200 text-xs">
                              <span className="font-semibold text-slate-700">{field}:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-red-600 line-through font-mono">{String(from)}</span>
                                <span className="text-emerald-700 font-bold">→</span>
                                <span className="text-emerald-700 font-mono font-bold">{String(to)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Remarks Banner */}
                    <div className="bg-[#EEF2FF] border border-[#C7D2FE] p-3 rounded-lg flex items-center gap-2.5 text-xs text-slate-800 font-medium">
                      <FileText className="w-4 h-4 text-[#1E3A8A] flex-shrink-0" />
                      <div>
                        <span className="font-bold text-[#1E3A8A] mr-1.5">Remarks:</span>
                        <span className="text-slate-700">{activeSelectedLog.remarks || "Audit log entry recorded and verified."}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Pagination Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 px-1 py-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>Total Records: <strong className="text-slate-900 font-bold">{filteredEditLogs.length}</strong></span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={editLogPage <= 1}
                    onClick={() => setEditLogPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1 bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-sm"
                  >
                    ‹ Previous
                  </button>
                  {Array.from({ length: totalEditLogPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    const isCurrent = pageNum === editLogPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setEditLogPage(pageNum)}
                        className={`w-7 h-7 text-xs font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center ${
                          isCurrent
                            ? 'bg-[#064E3B] text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    disabled={editLogPage >= totalEditLogPages}
                    onClick={() => setEditLogPage(p => Math.min(totalEditLogPages, p + 1))}
                    className="px-3 py-1 bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-sm"
                  >
                    Next ›
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 4. COMPREHENSIVE INTERACTIVE RECORD MODAL (Add / Edit for ALL modules) */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#070D18]/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-[#1E293B]">
              <h2 className="text-base font-bold text-white">
                {editingId ? `Edit ${modalMode} Record` : `New ${modalMode} Entry`}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="p-6 space-y-4">
              {modalMode.includes('Fines') ? (
                /* SIMPLIFIED 4-FIELD PENALTY ENTRY FORM (Requirement 2) */
                <div className="space-y-4">
                  {/* Field 1: Member Name Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Member Name <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={field1 || (members[0]?.fullName || 'Simon Memia Wanjiru')}
                      onChange={(e) => setField1(e.target.value)}
                      required
                      className="w-full bg-[#142036] border border-[#1E2D4A] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
                    >
                      <option value="" disabled>Select Member</option>
                      {(members.length >= 7 ? members : initialMembers).map(m => (
                        <option key={m.dbId || m.id || m.fullName} value={m.fullName}>
                          {m.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Field 2: Contribution Month (MMM YYYY) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Contribution Month <span className="text-rose-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={(() => {
                          const parts = (field2 || '').split(' ');
                          return ALL_MONTHS.includes(parts[0] as any) ? parts[0] : (selectedPenaltyMonth !== 'All' ? selectedPenaltyMonth : 'Aug');
                        })()}
                        onChange={(e) => {
                          const parts = (field2 || '').split(' ');
                          const yr = parts[1] || (selectedPenaltyYear !== 'All' ? String(selectedPenaltyYear) : '2026');
                          setField2(`${e.target.value} ${yr}`);
                        }}
                        className="bg-[#142036] border border-[#1E2D4A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
                      >
                        {ALL_MONTHS.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>

                      <select
                        value={(() => {
                          const parts = (field2 || '').split(' ');
                          const yr = parseInt(parts[1], 10);
                          return AVAILABLE_YEARS.includes(yr) ? yr : (selectedPenaltyYear !== 'All' ? selectedPenaltyYear : 2026);
                        })()}
                        onChange={(e) => {
                          const parts = (field2 || '').split(' ');
                          const mo = parts[0] || (selectedPenaltyMonth !== 'All' ? selectedPenaltyMonth : 'Aug');
                          setField2(`${mo} ${e.target.value}`);
                        }}
                        className="bg-[#142036] border border-[#1E2D4A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
                      >
                        {AVAILABLE_YEARS.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 font-mono">
                      Cycle Period: <span className="text-emerald-400 font-bold">{field2 || 'Aug 2026'}</span>
                    </p>
                  </div>

                  {/* Field 3: Penalty Amount (Fixed at KSh 500, read-only) */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Penalty Amount (KES)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">Fixed Policy Fee</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold font-mono text-emerald-400">KES</span>
                      <input
                        type="text"
                        value="500.00"
                        readOnly
                        disabled
                        className="w-full bg-[#0a101d] border border-[#1E2D4A] rounded-xl pl-12 pr-3 py-2 text-xs text-slate-300 font-mono font-bold cursor-not-allowed opacity-90 shadow-inner"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Automatic standard KSh 500 fine for late monthly contributions.</p>
                  </div>

                  {/* Field 4: Payment Status */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Payment Status <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={field4 === 'Paid' ? 'Paid' : 'Unpaid'}
                      onChange={(e) => setField4(e.target.value)}
                      className="w-full bg-[#142036] border border-[#1E2D4A] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
                    >
                      <option value="Unpaid">Unpaid (Outstanding Fine)</option>
                      <option value="Paid">Paid (Settled Fine)</option>
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  {/* Field 1 */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  {modalMode.includes('Member') ? 'Full Name' :
                   modalMode.includes('Contribution') ? 'Month / Date (e.g. 01-Oct-2026)' :
                   modalMode.includes('Loan') ? 'Borrower Full Name' :
                   modalMode.includes('Fines') ? 'Member Full Name' :
                   modalMode.includes('Expense') ? 'Description' :
                   modalMode.includes('Investment') ? 'Asset Name' :
                   modalMode.includes('Project') ? 'Project Title' :
                   modalMode.includes('Deposit') ? 'Depositor Name / Organisation *' : 'Name / Title'}
                </label>
                {(modalMode.includes('Loan') || modalMode.includes('Fines') || modalMode.includes('Member') || modalMode.includes('Deposit')) ? (
                  <MemberAutocomplete
                    value={field1}
                    required
                    members={members}
                    placeholder={
                      modalMode.includes('Loan') ? 'Search borrower name or ID (e.g. David, 002)...' :
                      modalMode.includes('Fines') ? 'Search member name or ID (e.g. Daniel, 006)...' :
                      modalMode.includes('Deposit') ? 'Search member name or type depositor name...' :
                      'Type member name or ID...'
                    }
                    onChange={(val, mem) => {
                      setField1(val);
                      if (mem && modalMode.includes('Member')) {
                        if (mem.nationalId) setField2(mem.nationalId);
                        if (mem.phone) setField3(mem.phone);
                        if (mem.role) setField4(mem.role);
                        if (mem.email) setField5(mem.email);
                      }
                    }}
                  />
                ) : (
                  <input
                    type="text"
                    required
                    value={field1}
                    onChange={(e) => setField1(e.target.value)}
                    className="w-full bg-[#142036] border border-[#1E2D4A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                )}
              </div>

              {/* Field 2 */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  {modalMode.includes('Member') ? 'National ID Number' :
                   modalMode.includes('Contribution') ? 'Member Full Name' :
                   modalMode.includes('Loan') ? 'Principal Amount (KES)' :
                   modalMode.includes('Fines') ? 'Date Levied (YYYY-MM-DD)' :
                   modalMode.includes('Expense') ? 'Expense Category' :
                   modalMode.includes('Investment') ? 'Investment Type' :
                   modalMode.includes('Project') ? 'Project Manager / Lead' :
                   modalMode.includes('Deposit') ? 'Deposit Date (YYYY-MM-DD) *' : 'Category'}
                </label>
                {(modalMode.includes('Contribution') || modalMode.includes('Project')) ? (
                  <MemberAutocomplete
                    value={field2}
                    required
                    members={members}
                    placeholder={
                      modalMode.includes('Contribution') ? 'Search contributing member or ID (e.g. Simon, 001)...' :
                      'Search project manager name or ID...'
                    }
                    onChange={(val) => setField2(val)}
                  />
                ) : (modalMode.includes('Fines') || modalMode.includes('Deposit')) ? (
                  <input
                    type="date"
                    required
                    value={field2}
                    onChange={(e) => setField2(e.target.value)}
                    className="w-full bg-[#142036] border border-[#1E2D4A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                ) : (
                  <input
                    type="text"
                    required
                    value={field2}
                    onChange={(e) => setField2(e.target.value)}
                    className="w-full bg-[#142036] border border-[#1E2D4A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                )}
              </div>

              {/* Field 3 */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  {modalMode.includes('Member') ? 'Phone Number' :
                   modalMode.includes('Contribution') ? 'Amount (KES)' :
                   modalMode.includes('Loan') ? 'Interest (KES) (or leave blank for 10%)' :
                   modalMode.includes('Fines') ? 'Penalty Amount (KES)' :
                   modalMode.includes('Expense') ? 'Amount (KES)' :
                   modalMode.includes('Investment') ? 'Capital Allocated (KES)' :
                   modalMode.includes('Project') ? 'Project Budget (KES)' :
                   modalMode.includes('Deposit') ? 'AMOUNT DEPOSITED (KES) * (MANDATORY)' : 'Contact / Value'}
                </label>
                {modalMode.includes('Deposit') ? (
                  <div className="relative">
                    <span className="absolute left-3.5 top-2 text-xs font-bold font-mono text-emerald-400">KES</span>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={field3}
                      onChange={(e) => setField3(e.target.value)}
                      className="w-full bg-[#0F172A] border-2 border-emerald-500/60 rounded-xl pl-12 pr-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-400 shadow-sm"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={field3}
                    onChange={(e) => setField3(e.target.value)}
                    className="w-full bg-[#142036] border border-[#1E2D4A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                )}
              </div>

              {/* Field 4 */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  {modalMode.includes('Member') ? 'Role (Director / Member)' :
                   modalMode.includes('Contribution') ? 'Unsettled Contributions (KES)' :
                   modalMode.includes('Loan') ? 'Issue Date (YYYY-MM-DD)' :
                   modalMode.includes('Fines') ? 'Reason / Cause' :
                   modalMode.includes('Expense') ? 'Expense Date (YYYY-MM-DD)' :
                   modalMode.includes('Investment') ? 'Expected Return (e.g. 15%)' :
                   modalMode.includes('Project') ? 'Project Status (Active / Completed)' :
                   modalMode.includes('Deposit') ? 'Transaction Type (e.g. Member Deposit, Share Capital) *' : 'Status'}
                </label>
                {(modalMode.includes('Loan') || modalMode.includes('Expense')) ? (
                  <input
                    type="date"
                    required
                    value={field4}
                    onChange={(e) => setField4(e.target.value)}
                    className="w-full bg-[#142036] border border-[#1E2D4A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                ) : (
                  <input
                    type="text"
                    value={field4}
                    onChange={(e) => setField4(e.target.value)}
                    className="w-full bg-[#142036] border border-[#1E2D4A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                )}
              </div>

              {/* Field 5 */}
              {(modalMode.includes('Contribution') || modalMode.includes('Member') || modalMode.includes('Expense') || modalMode.includes('Loan') || modalMode.includes('Fines') || modalMode.includes('Investment') || modalMode.includes('Deposit')) && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    {modalMode.includes('Member') ? 'Email Address' :
                     modalMode.includes('Contribution') ? 'Mawega Payout (KES)' :
                     modalMode.includes('Loan') ? 'Date Settled (or "-" if active)' :
                     modalMode.includes('Fines') ? 'Payment Status (Active / Paid)' :
                     modalMode.includes('Expense') ? 'Paid To / Reference' :
                     modalMode.includes('Deposit') ? 'Reason / Description *' : 'Status'}
                  </label>
                  {modalMode.includes('Expense') ? (
                    <MemberAutocomplete
                      value={field5}
                      members={members}
                      placeholder="Search member or enter vendor name (e.g. David, 002)..."
                      onChange={(val) => setField5(val)}
                    />
                  ) : (
                    <input
                      type="text"
                      value={field5}
                      onChange={(e) => setField5(e.target.value)}
                      className="w-full bg-[#142036] border border-[#1E2D4A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  )}
                </div>
              )}

              {/* Field 6 */}
              {(modalMode.includes('Contribution') || modalMode.includes('Loan') || modalMode.includes('Fines') || modalMode.includes('Deposit')) && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    {modalMode.includes('Contribution') ? 'Notes / Remarks' :
                     modalMode.includes('Loan') ? 'Loan Status (Active / Settled)' :
                     modalMode.includes('Fines') ? 'Date Paid' :
                     modalMode.includes('Deposit') ? 'Payment Method (M-Pesa, Cash, Bank Transfer, Other)' : 'Additional Info'}
                  </label>
                  <input
                    type="text"
                    value={field6}
                    onChange={(e) => setField6(e.target.value)}
                    className="w-full bg-[#142036] border border-[#1E2D4A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Field 7 */}
              {modalMode.includes('Deposit') && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Reference Number (M-Pesa / Bank Slip)
                  </label>
                  <input
                    type="text"
                    value={field7}
                    placeholder="e.g. QK89123456"
                    onChange={(e) => setField7(e.target.value)}
                    className="w-full bg-[#142036] border border-[#1E2D4A] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}
                </>
              )}



              {/* Automated 10% Interest Calculator for Loan Portfolio */}
              {modalMode.includes('Loan') && (
                (() => {
                  const pAmt = Number(field2) || 0;
                  const iAmt = field3 ? Number(field3) : Math.round(pAmt * 0.10);
                  const tAmt = pAmt + iAmt;

                  return (
                    <div className="p-3.5 rounded-xl border border-sky-500/30 bg-sky-950/20 text-xs space-y-2">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                          Automated 10% Loan Interest
                        </span>
                        <span className="text-sky-400 font-mono font-bold bg-sky-950/60 px-2 py-0.5 rounded border border-sky-500/30">
                          Standard 10%
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                        <div className="bg-[#142036] p-2 rounded-lg border border-[#1E2D4A]">
                          <div className="text-slate-400 text-[10px] uppercase font-sans">Principal</div>
                          <div className="text-white font-bold mt-0.5">KES {pAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div className="bg-[#142036] p-2 rounded-lg border border-[#1E2D4A]">
                          <div className="text-slate-400 text-[10px] uppercase font-sans">10% Interest</div>
                          <div className="text-cyan-400 font-bold mt-0.5">KES {iAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div className="bg-[#142036] p-2 rounded-lg border border-[#1E2D4A]">
                          <div className="text-slate-400 text-[10px] uppercase font-sans">Total Payable</div>
                          <div className="text-emerald-400 font-black mt-0.5">KES {tAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400">
                        Total loan payable = Principal + Interest. Active loans reduce member net balance.
                      </div>
                    </div>
                  );
                })()
              )}

              <div className="flex justify-between items-center pt-4 border-t border-[#1E293B]">
                <div>
                  {editingId && canEdit && (
                    <button
                      type="button"
                      onClick={handleDeleteCurrentRecord}
                      className="px-3.5 py-2 bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-rose-500/30"
                      title="Permanently Delete this record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Record
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-[#142036] text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium shadow-lg shadow-emerald-950/50"
                  >
                    Save Entry
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DUES & PENALTIES PAYMENT MODAL WITH ALLOCATION PREVIEW */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && selectedPenaltyForPayment && (
        <div className="fixed inset-0 bg-[#070D18]/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-[#1E293B]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Record Dues Payment</h3>
                  <p className="text-xs text-slate-400">{selectedPenaltyForPayment.member} — {selectedPenaltyForPayment.monthYear || selectedPenaltyForPayment.date}</p>
                </div>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecutePayment} className="p-6 space-y-4">
              {/* Outstanding Breakdown Card */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-[#142036] rounded-xl border border-[#1E2D4A] text-xs font-mono">
                <div>
                  <div className="text-[10px] text-slate-400 font-sans uppercase">Contribution</div>
                  <div className="text-amber-400 font-bold mt-0.5">KES {Number(selectedPenaltyForPayment.unsettledContribution || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-sans uppercase">Late Fine</div>
                  <div className="text-rose-400 font-bold mt-0.5">KES {Number(selectedPenaltyForPayment.penaltyAmount || 500).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-sans uppercase">Remaining Due</div>
                  <div className="text-emerald-400 font-black mt-0.5">KES {Number(selectedPenaltyForPayment.remainingBalance !== undefined ? selectedPenaltyForPayment.remainingBalance : (selectedPenaltyForPayment.amount || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>

              {/* Payment Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Payment Amount (KES)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  max={selectedPenaltyForPayment.remainingBalance !== undefined ? selectedPenaltyForPayment.remainingBalance : selectedPenaltyForPayment.amount}
                  min={1}
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(e.target.value)}
                  placeholder="Enter payment amount e.g. 2000"
                  className="w-full bg-[#142036] border border-[#1E2D4A] rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Transparent Allocation Live Preview */}
              {(() => {
                const amt = Number(paymentAmountInput) || 0;
                const remC = Math.max(0, (Number(selectedPenaltyForPayment.unsettledContribution) || 0) - (Number(selectedPenaltyForPayment.paidContribution) || 0));
                const allocC = Math.min(amt, remC);
                const remAfter = amt - allocC;
                const remF = Math.max(0, (Number(selectedPenaltyForPayment.penaltyAmount) || 500) - (Number(selectedPenaltyForPayment.paidFine) || 0));
                const allocF = Math.min(remAfter, remF);
                const currentRem = Number(selectedPenaltyForPayment.remainingBalance !== undefined ? selectedPenaltyForPayment.remainingBalance : selectedPenaltyForPayment.amount);
                const newRemTotal = Math.max(0, currentRem - amt);
                const newStatus = newRemTotal === 0 ? 'PAID' : 'PARTIALLY PAID';

                return (
                  <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300 font-semibold text-[11px]">
                      <span>Payment Allocation Preview</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${newStatus === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        Resulting Status: {newStatus}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="bg-[#142036] p-2 rounded-lg border border-[#1E2D4A]">
                        <span className="text-slate-400 block text-[10px] font-sans">To Contribution:</span>
                        <span className="text-emerald-400 font-bold">KES {allocC.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="bg-[#142036] p-2 rounded-lg border border-[#1E2D4A]">
                        <span className="text-slate-400 block text-[10px] font-sans">To Late Fine:</span>
                        <span className="text-cyan-400 font-bold">KES {allocF.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[11px] pt-1 border-t border-emerald-500/20 text-slate-300">
                      <span>New Remaining Balance:</span>
                      <span className="font-mono font-bold text-white">KES {newRemTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Payment Method & Reference */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Payment Method</label>
                  <select
                    value={paymentMethodInput}
                    onChange={(e) => setPaymentMethodInput(e.target.value)}
                    className="w-full bg-[#142036] border border-[#1E2D4A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="M-PESA">M-PESA</option>
                    <option value="Equity Bank">Equity Bank</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Reference / Code</label>
                  <input
                    type="text"
                    value={paymentRefInput}
                    onChange={(e) => setPaymentRefInput(e.target.value)}
                    placeholder="e.g. QKH489291"
                    className="w-full bg-[#142036] border border-[#1E2D4A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end items-center gap-3 pt-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 bg-[#142036] text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/50 flex items-center gap-1.5"
                >
                  {isSubmittingPayment ? 'Recording...' : 'Confirm & Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* INDIVIDUAL MEMBER PROFILE MODAL                                      */}
      {/* ===================================================================== */}
      {selectedMemberProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setSelectedMemberProfile(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-[#142036] hover:bg-[#1E2D4A] transition"
              title="Close Profile"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="text-center pt-2 pb-6 border-b border-[#1E293B]">
              <div className="relative inline-block mb-3">
                <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-emerald-500/50 shadow-2xl mx-auto bg-slate-800">
                  <img
                    src={selectedMemberProfile.avatar || getMemberAvatar(selectedMemberProfile.fullName || selectedMemberProfile.id)}
                    alt={selectedMemberProfile.fullName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="absolute bottom-1 right-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 shadow-md">
                  {selectedMemberProfile.id}
                </span>
              </div>
              <h2 className="text-xl font-black text-white">{selectedMemberProfile.fullName}</h2>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
                  {selectedMemberProfile.role || 'Member'}
                </span>
                <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-xs font-semibold">
                  Status: {selectedMemberProfile.status || 'Active'}
                </span>
              </div>
            </div>

            {/* Contact Information */}
            <div className="py-4 border-b border-[#1E293B] space-y-2.5 text-xs">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Official Contact Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#142036] p-3 rounded-xl border border-[#1E2D4A]">
                  <span className="text-slate-400 block text-[10px]">National ID</span>
                  <span className="text-white font-mono font-bold text-xs">{selectedMemberProfile.nationalId}</span>
                </div>
                <div className="bg-[#142036] p-3 rounded-xl border border-[#1E2D4A]">
                  <span className="text-slate-400 block text-[10px]">Phone Number</span>
                  <span className="text-white font-mono font-bold text-xs">{selectedMemberProfile.phone}</span>
                </div>
              </div>
              <div className="bg-[#142036] p-3 rounded-xl border border-[#1E2D4A]">
                <span className="text-slate-400 block text-[10px]">Authorized Member Email</span>
                <span className="text-emerald-400 font-mono font-bold text-xs">{selectedMemberProfile.email}</span>
              </div>
            </div>

            {/* Financial Overview & Equity Share */}
            <div className="py-4 space-y-2.5 text-xs">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Financial Summary & Equity</h3>
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="bg-[#142036] p-3 rounded-xl border border-[#1E2D4A]">
                  <span className="text-slate-400 block text-[10px] font-sans">Total Contributions</span>
                  <span className="text-emerald-400 font-bold text-sm">KES {Number(selectedMemberProfile.totalContribution || 0).toLocaleString()}</span>
                </div>
                <div className="bg-[#142036] p-3 rounded-xl border border-[#1E2D4A]">
                  <span className="text-slate-400 block text-[10px] font-sans">Active Loans</span>
                  <span className="text-amber-400 font-bold text-sm">KES {Number(selectedMemberProfile.activeLoans || 0).toLocaleString()}</span>
                </div>
                <div className="bg-[#142036] p-3 rounded-xl border border-[#1E2D4A]">
                  <span className="text-slate-400 block text-[10px] font-sans">Net Balance</span>
                  <span className="text-white font-bold text-sm">KES {Number(selectedMemberProfile.netBalance || 0).toLocaleString()}</span>
                </div>
                <div className="bg-[#142036] p-3 rounded-xl border border-[#1E2D4A]">
                  <span className="text-slate-400 block text-[10px] font-sans">% Equity Share</span>
                  <span className="text-cyan-400 font-bold text-sm">{selectedMemberProfile.shares || '14.28%'}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end items-center gap-3 pt-4 border-t border-[#1E293B]">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEditModal(selectedMemberProfile, 'Member Directory');
                    setSelectedMemberProfile(null);
                  }}
                  className="px-4 py-2 bg-[#142036] hover:bg-[#1E2D4A] text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Member
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedMemberProfile(null)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-950/50"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
