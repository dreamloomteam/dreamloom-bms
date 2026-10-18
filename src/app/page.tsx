'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard, Users, Wallet, AlertTriangle,
  TrendingUp, Briefcase, Truck, Boxes, Building,
  BarChart3, Settings, Shield, LogIn, LogOut,
  Download, Plus, X, Receipt, History, UserCog, Edit3, Lock, Mail, FileText, ExternalLink, Paperclip,
  Search, Bell, Maximize, Minimize, ChevronDown, Check, Calendar, DollarSign, Coins, Layers,
  CreditCard, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, UserCheck, ShieldAlert,
  Eye, EyeOff, Phone, Landmark, Building2, Banknote, CheckCircle
} from 'lucide-react';

export default function Home() {
  // 1. Authorized Member Credentials & Contact Register (Exact Requested PINs)
  const authorizedUsers = [
    { email: 'simon@dreamloom.co.ke', password: 'Simon@%322', name: 'Simon Memia', fullName: 'Simon Memia Wanjiru', nationalId: '32242103', phone: '0719545283', role: 'Director / Member' },
    { email: 'david@dreamloom.co.ke', password: 'David@399', name: 'David Wainaina', fullName: 'David Wainaina Kinyua', nationalId: '39929859', phone: '0714382925', role: 'Member' },
    { email: 'elijah@dreamloom.co.ke', password: 'Elijah@342', name: 'Elijah Waitara', fullName: 'Elijah Waitara Gichari', nationalId: '34282968', phone: '0718963492', role: 'Member' },
    { email: 'samuel@dreamloom.co.ke', password: 'Samuel@400', name: 'Samuel Kamau', fullName: 'Samuel Kamau Nguuro', nationalId: '40085139', phone: '0113114471', role: 'Member' },
    { email: 'michael@dreamloom.co.ke', password: 'Michael@389', name: 'Michael Kiarie', fullName: 'Michael Kiarie Wanjiru', nationalId: '38927071', phone: '0748036136', role: 'Member' },
    { email: 'daniel@dreamloom.co.ke', password: 'daniel@366', name: 'Daniel Kamau', fullName: 'Daniel Kamau Njiriri', nationalId: '36686858', phone: '0759818731', role: 'Member' },
    { email: 'beatrice@dreamloom.co.ke', password: 'Beatrice@404', name: 'Beatrice Njoki', fullName: 'Beatrice Njoki Muthoni', nationalId: '40492876', phone: '0708665848', role: 'Member' },
  ];

  // 2. Authentication States (Always prompt on page refresh)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // Role-Based Access Control: Strictly Simon Memia Wanjiru & Elijah Waitara Gichari can edit
  const canEdit = useMemo(() => {
    if (!currentUser) return false;
    const email = currentUser.email?.toLowerCase().trim();
    return email === 'simon@dreamloom.co.ke' || email === 'elijah@dreamloom.co.ke';
  }, [currentUser]);

  // Inactivity Auto-Logout Timer (10 Minutes)
  useEffect(() => {
    if (!isLoggedIn) return;

    let timeoutId: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      // 10 minutes = 600,000 ms
      timeoutId = setTimeout(() => {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setAuthError('Your session has timed out due to inactivity. Please authenticate with your password to resume.');
      }, 10 * 60 * 1000);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(ev => window.addEventListener(ev, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(ev => window.removeEventListener(ev, resetTimer));
    };
  }, [isLoggedIn]);

  // Core App States
  const [activeTab, setActiveTab] = useState('Overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<string>('Overview');
  const [editingId, setEditingId] = useState<string | number | null>(null);

  // Header & Controls States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('October 2026');
  const [selectedCurrency, setSelectedCurrency] = useState('KES');
  const [selectedTrendRange, setSelectedTrendRange] = useState('Last 6 Months');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredTrendPoint, setHoveredTrendPoint] = useState<number | null>(null);

  // Form Field States for Edit / Add Modals
  const [field1, setField1] = useState('');
  const [field2, setField2] = useState('');
  const [field3, setField3] = useState('');
  const [field4, setField4] = useState('');
  const [field5, setField5] = useState('');
  const [field6, setField6] = useState('');
  const [field7, setField7] = useState('');

  // 1. Official Membership Directory & Summary (PDF Page 1 & Page 10)
  const [members, setMembers] = useState([
    {
      id: 'MEM-001',
      name: 'Simon',
      fullName: 'Simon Memia Wanjiru',
      nationalId: '32242103',
      phone: '0719545283',
      role: 'Director / Member',
      email: 'simon@dreamloom.co.ke',
      totalContribution: 65050.00,
      activeLoans: 13200.00,
      netBalance: 51850.00,
      shares: '13.80%',
      percentage: 90,
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
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
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
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
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
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
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
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
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80',
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
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
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
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
      color: 'from-teal-400 to-emerald-400'
    },
  ]);

  // 2. Official Contributions & Land Payouts Register (PDF Pages 2, 3, 4, 5) with Unsettled Contributions Column
  const [contributions, setContributions] = useState([
    // October 2025
    { id: 'CNT-001', month: '01-Oct-2025', member: 'Simon Memia Wanjiru', amount: 5025.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-002', month: '01-Oct-2025', member: 'David Wainaina Kinyua', amount: 5025.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-003', month: '01-Oct-2025', member: 'Elijah Waitara Gichari', amount: 5025.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-004', month: '01-Oct-2025', member: 'Samuel Kamau Nguuro', amount: 5025.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-005', month: '01-Oct-2025', member: 'Michael Kiarie Wanjiru', amount: 5025.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-006', month: '01-Oct-2025', member: 'Daniel Kamau Njiriri', amount: 5025.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-007', month: '01-Oct-2025', member: 'Beatrice Njoki Muthoni', amount: 5025.00, unsettled: 0.00, payout: 0, notes: '' },

    // November 2025
    { id: 'CNT-008', month: '01-Nov-2025', member: 'Simon Memia Wanjiru', amount: 5025.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-009', month: '01-Nov-2025', member: 'David Wainaina Kinyua', amount: 5025.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-010', month: '01-Nov-2025', member: 'Elijah Waitara Gichari', amount: 5025.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-011', month: '01-Nov-2025', member: 'Samuel Kamau Nguuro', amount: 5025.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-012', month: '01-Nov-2025', member: 'Michael Kiarie Wanjiru', amount: 5025.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-013', month: '01-Nov-2025', member: 'Daniel Kamau Njiriri', amount: 5025.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-014', month: '01-Nov-2025', member: 'Beatrice Njoki Muthoni', amount: 5025.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-015', month: '01-Nov-2025', member: 'Mawega Payout 12th Nov', amount: 0.00, unsettled: 0.00, payout: 50000.00, notes: 'Land Payout Disbursement' },

    // December 2025
    { id: 'CNT-016', month: '01-Dec-2025', member: 'Simon Memia Wanjiru', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-017', month: '01-Dec-2025', member: 'David Wainaina Kinyua', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-018', month: '01-Dec-2025', member: 'Elijah Waitara Gichari', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-019', month: '01-Dec-2025', member: 'Samuel Kamau Nguuro', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-020', month: '01-Dec-2025', member: 'Michael Kiarie Wanjiru', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-021', month: '01-Dec-2025', member: 'Daniel Kamau Njiriri', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-022', month: '01-Dec-2025', member: 'Beatrice Njoki Muthoni', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-023', month: '01-Dec-2025', member: 'Mawega Payout 16th Dec', amount: 0.00, unsettled: 0.00, payout: 35000.00, notes: 'Land Payout Disbursement' },

    // January 2026
    { id: 'CNT-024', month: '01-Jan-2026', member: 'Simon Memia Wanjiru', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-025', month: '01-Jan-2026', member: 'David Wainaina Kinyua', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-026', month: '01-Jan-2026', member: 'Elijah Waitara Gichari', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-027', month: '01-Jan-2026', member: 'Samuel Kamau Nguuro', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-028', month: '01-Jan-2026', member: 'Michael Kiarie Wanjiru', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-029', month: '01-Jan-2026', member: 'Daniel Kamau Njiriri', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-030', month: '01-Jan-2026', member: 'Beatrice Njoki Muthoni', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-031', month: '01-Jan-2026', member: 'Mawega Payout 12th Jan', amount: 0.00, unsettled: 0.00, payout: 35000.00, notes: 'Land Payout Disbursement' },

    // February 2026
    { id: 'CNT-032', month: '01-Feb-2026', member: 'Simon Memia Wanjiru', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-033', month: '01-Feb-2026', member: 'David Wainaina Kinyua', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-034', month: '01-Feb-2026', member: 'Elijah Waitara Gichari', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-035', month: '01-Feb-2026', member: 'Samuel Kamau Nguuro', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-036', month: '01-Feb-2026', member: 'Michael Kiarie Wanjiru', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-037', month: '01-Feb-2026', member: 'Daniel Kamau Njiriri', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-038', month: '01-Feb-2026', member: 'Beatrice Njoki Muthoni', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-039', month: '01-Feb-2026', member: 'Mawega Payout 19th Feb', amount: 0.00, unsettled: 0.00, payout: 39000.00, notes: 'Land Payout Disbursement' },

    // March 2026
    { id: 'CNT-040', month: '01-Mar-2026', member: 'Simon Memia Wanjiru', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-041', month: '01-Mar-2026', member: 'David Wainaina Kinyua', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-042', month: '01-Mar-2026', member: 'Elijah Waitara Gichari', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-043', month: '01-Mar-2026', member: 'Samuel Kamau Nguuro', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-044', month: '01-Mar-2026', member: 'Michael Kiarie Wanjiru', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-045', month: '01-Mar-2026', member: 'Daniel Kamau Njiriri', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-046', month: '01-Mar-2026', member: 'Beatrice Njoki Muthoni', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-047', month: '01-Mar-2026', member: 'Mawega Payout 4th April', amount: 0.00, unsettled: 0.00, payout: 35000.00, notes: 'Land Payout Disbursement' },

    // April 2026
    { id: 'CNT-048', month: '01-Apr-2026', member: 'Simon Memia Wanjiru', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-049', month: '01-Apr-2026', member: 'David Wainaina Kinyua', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-050', month: '01-Apr-2026', member: 'Elijah Waitara Gichari', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-051', month: '01-Apr-2026', member: 'Samuel Kamau Nguuro', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-052', month: '01-Apr-2026', member: 'Michael Kiarie Wanjiru', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-053', month: '01-Apr-2026', member: 'Daniel Kamau Njiriri', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-054', month: '01-Apr-2026', member: 'Beatrice Njoki Muthoni', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-055', month: '01-Apr-2026', member: 'Mawega Payout Apr-26', amount: 0.00, unsettled: 0.00, payout: 35000.00, notes: 'Land Payout Disbursement' },

    // May 2026
    { id: 'CNT-056', month: '01-May-2026', member: 'Simon Memia Wanjiru', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-057', month: '01-May-2026', member: 'David Wainaina Kinyua', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-058', month: '01-May-2026', member: 'Elijah Waitara Gichari', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-059', month: '01-May-2026', member: 'Samuel Kamau Nguuro', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-060', month: '01-May-2026', member: 'Michael Kiarie Wanjiru', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-061', month: '01-May-2026', member: 'Daniel Kamau Njiriri', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-062', month: '01-May-2026', member: 'Beatrice Njoki Muthoni', amount: 5500.00, unsettled: 500.00, payout: 0, notes: '' },
    { id: 'CNT-063', month: '01-May-2026', member: 'Mawega Payout 15th May', amount: 0.00, unsettled: 0.00, payout: 35000.00, notes: 'Land Payout Disbursement' },

    // June 2026
    { id: 'CNT-064', month: '01-Jun-2026', member: 'Simon Memia Wanjiru', amount: 7000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-065', month: '01-Jun-2026', member: 'David Wainaina Kinyua', amount: 7000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-066', month: '01-Jun-2026', member: 'Elijah Waitara Gichari', amount: 7000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-067', month: '01-Jun-2026', member: 'Samuel Kamau Nguuro', amount: 7000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-068', month: '01-Jun-2026', member: 'Michael Kiarie Wanjiru', amount: 7000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-069', month: '01-Jun-2026', member: 'Daniel Kamau Njiriri', amount: 7000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-070', month: '01-Jun-2026', member: 'Beatrice Njoki Muthoni', amount: 6000.00, unsettled: 1000.00, payout: 0, notes: 'loan' },
    { id: 'CNT-071', month: '01-Jun-2026', member: 'Mawega Payout Jun-26', amount: 0.00, unsettled: 0.00, payout: 36000.00, notes: 'Land Payout Disbursement' },

    // July 2026
    { id: 'CNT-072', month: '01-Jul-2026', member: 'Simon Memia Wanjiru', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-073', month: '01-Jul-2026', member: 'David Wainaina Kinyua', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-074', month: '01-Jul-2026', member: 'Elijah Waitara Gichari', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-075', month: '01-Jul-2026', member: 'Samuel Kamau Nguuro', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-076', month: '01-Jul-2026', member: 'Michael Kiarie Wanjiru', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-077', month: '01-Jul-2026', member: 'Daniel Kamau Njiriri', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-078', month: '01-Jul-2026', member: 'Beatrice Njoki Muthoni', amount: 6000.00, unsettled: 0.00, payout: 0, notes: 'loan' },
    { id: 'CNT-079', month: '01-Jul-2026', member: 'Mawega Payout Jul-26', amount: 0.00, unsettled: 0.00, payout: 0.00, notes: 'Land Payout Disbursement' },

    // August 2026
    { id: 'CNT-080', month: '01-Aug-2026', member: 'Simon Memia Wanjiru', amount: 6000.00, unsettled: 0.00, payout: 0, notes: 'loan' },
    { id: 'CNT-081', month: '01-Aug-2026', member: 'David Wainaina Kinyua', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-082', month: '01-Aug-2026', member: 'Elijah Waitara Gichari', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-083', month: '01-Aug-2026', member: 'Samuel Kamau Nguuro', amount: 6000.00, unsettled: 0.00, payout: 0, notes: 'loan' },
    { id: 'CNT-084', month: '01-Aug-2026', member: 'Michael Kiarie Wanjiru', amount: 6000.00, unsettled: 0.00, payout: 0, notes: 'loan' },
    { id: 'CNT-085', month: '01-Aug-2026', member: 'Daniel Kamau Njiriri', amount: 6000.00, unsettled: 0.00, payout: 0, notes: 'loan' },
    { id: 'CNT-086', month: '01-Aug-2026', member: 'Beatrice Njoki Muthoni', amount: 6000.00, unsettled: 0.00, payout: 0, notes: 'loan' },
    { id: 'CNT-087', month: '01-Aug-2026', member: 'Mawega Payout Aug-26', amount: 0.00, unsettled: 0.00, payout: 0.00, notes: 'Land Payout Disbursement' },

    // September 2026
    { id: 'CNT-088', month: '01-Sep-2026', member: 'Simon Memia Wanjiru', amount: 0.00, unsettled: 6000.00, payout: 0, notes: '' },
    { id: 'CNT-089', month: '01-Sep-2026', member: 'David Wainaina Kinyua', amount: 6000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-090', month: '01-Sep-2026', member: 'Elijah Waitara Gichari', amount: 0.00, unsettled: 6000.00, payout: 0, notes: '' },
    { id: 'CNT-091', month: '01-Sep-2026', member: 'Samuel Kamau Nguuro', amount: 4400.00, unsettled: 1600.00, payout: 0, notes: '' },
    { id: 'CNT-092', month: '01-Sep-2026', member: 'Michael Kiarie Wanjiru', amount: 7000.00, unsettled: 0.00, payout: 0, notes: '' },
    { id: 'CNT-093', month: '01-Sep-2026', member: 'Daniel Kamau Njiriri', amount: 0.00, unsettled: 6000.00, payout: 0, notes: '' },
    { id: 'CNT-094', month: '01-Sep-2026', member: 'Beatrice Njoki Muthoni', amount: 0.00, unsettled: 6000.00, payout: 0, notes: '' },
    { id: 'CNT-095', month: '01-Sep-2026', member: 'Mawega Payout Sep-26', amount: 0.00, unsettled: 0.00, payout: 40000.00, notes: 'Land Payout Disbursement' },

    // October 2026
    { id: 'CNT-096', month: '01-Oct-2026', member: 'Simon Memia Wanjiru', amount: 0.00, unsettled: 6000.00, payout: 0, notes: '' },
    { id: 'CNT-097', month: '01-Oct-2026', member: 'David Wainaina Kinyua', amount: 0.00, unsettled: 6000.00, payout: 0, notes: '' },
    { id: 'CNT-098', month: '01-Oct-2026', member: 'Elijah Waitara Gichari', amount: 0.00, unsettled: 6000.00, payout: 0, notes: '' },
    { id: 'CNT-099', month: '01-Oct-2026', member: 'Samuel Kamau Nguuro', amount: 0.00, unsettled: 6000.00, payout: 0, notes: '' },
    { id: 'CNT-100', month: '01-Oct-2026', member: 'Michael Kiarie Wanjiru', amount: 0.00, unsettled: 6000.00, payout: 0, notes: '' },
    { id: 'CNT-101', month: '01-Oct-2026', member: 'Daniel Kamau Njiriri', amount: 0.00, unsettled: 6000.00, payout: 0, notes: '' },
    { id: 'CNT-102', month: '01-Oct-2026', member: 'Beatrice Njoki Muthoni', amount: 0.00, unsettled: 6000.00, payout: 0, notes: '' },
  ]);

  // 3. Official Operational Expenses & Payouts Log (PDF Page 6 - 27 Records totaling KES 380,555.02)
  const [expenses, setExpenses] = useState([
    { id: 'EXP-01', date: '12-Dec-25', description: 'Paid to Mawega', amount: 50000.00, category: 'Land Purchase', paidTo: 'Land Payment Disbursement' },
    { id: 'EXP-02', date: '16-Dec-25', description: 'Paid to Mawega', amount: 35000.00, category: 'Land Purchase', paidTo: 'Land Payment Disbursement' },
    { id: 'EXP-03', date: '12-Jan-26', description: 'Paid to Mawega', amount: 35000.00, category: 'Land Purchase', paidTo: 'Land Payment Disbursement' },
    { id: 'EXP-04', date: '19-Feb-26', description: 'Paid to Mawega', amount: 39000.00, category: 'Land Purchase', paidTo: 'Land Payment Disbursement' },
    { id: 'EXP-05', date: '1-Mar-26', description: 'Paid to Mawega', amount: 35000.00, category: 'Land Purchase', paidTo: 'Land Payment Disbursement' },
    { id: 'EXP-06', date: '1-Apr-26', description: 'Paid to Mawega', amount: 35000.00, category: 'Land Purchase', paidTo: 'Land Payment Disbursement' },
    { id: 'EXP-07', date: '1-May-26', description: 'Paid to Mawega', amount: 35000.00, category: 'Land Purchase', paidTo: 'Land Payment Disbursement' },
    { id: 'EXP-08', date: '1-Jun-26', description: 'Paid to Mawega', amount: 36000.00, category: 'Land Purchase', paidTo: 'Land Payment Disbursement' },
    { id: 'EXP-09', date: '25-Feb-26', description: 'Bank Deposits for Account Opening', amount: 600.00, category: 'Bank Operations', paidTo: 'Initial Deposit Equity Bank' },
    { id: 'EXP-10', date: '14-Jan-26', description: 'Company stamp', amount: 1518.00, category: 'Administration', paidTo: 'Official Rubber Stamp' },
    { id: 'EXP-11', date: '14-Feb-26', description: 'Printing Company Documents (Qatar) + ksh300 transaction', amount: 2400.00, category: 'Administration', paidTo: 'Doc Printing & Transfer Fees' },
    { id: 'EXP-12', date: 'Up to Feb 20', description: 'Transaction Fee 2025 (ksh350) 2026 (ksh120)', amount: 470.00, category: 'Bank Charges', paidTo: 'Bank Transaction Fees' },
    { id: 'EXP-13', date: '17-Dec-25', description: 'Company Registration', amount: 15000.00, category: 'Legal & Compliance', paidTo: 'CR12 & Registration Fees' },
    { id: 'EXP-14', date: '23-Jan-26', description: 'Facilitation for Site Visit [Elijah & Daniel]', amount: 3000.00, category: 'Field Operations', paidTo: 'Land Site Inspection Allowance' },
    { id: 'EXP-15', date: '31-Jan-26', description: 'Facilitation to Mawega Office & Bank Opening Doc', amount: 1500.00, category: 'Field Operations', paidTo: 'Transport & Admin Facilitation' },
    { id: 'EXP-16', date: '31-Jan-26', description: 'Recent Transaction Fee', amount: 96.78, category: 'Bank Charges', paidTo: 'M-PESA / Bank Charges' },
    { id: 'EXP-17', date: '15th May 2026', description: 'Welfare to Beatrice', amount: 6000.00, category: 'Welfare Payout', paidTo: 'Member Welfare Grant' },
    { id: 'EXP-18', date: '15th May 2026', description: 'Transaction Fee', amount: 201.28, category: 'Bank Charges', paidTo: 'M-PESA / Bank Charges' },
    { id: 'EXP-19', date: '25th June 2026', description: 'Filing tax return + transaction Fee', amount: 514.00, category: 'Legal & Compliance', paidTo: 'KRA Annual Tax Filing' },
    { id: 'EXP-20', date: '5th July 2026', description: 'Transaction Fee', amount: 78.68, category: 'Bank Charges', paidTo: 'M-PESA / Bank Charges' },
    { id: 'EXP-21', date: '22nd August 2026', description: 'Transaction Fee', amount: 51.51, category: 'Bank Charges', paidTo: 'M-PESA / Bank Charges' },
    { id: 'EXP-22', date: '25th August 2026', description: 'Transaction sms fee', amount: 65.01, category: 'Bank Charges', paidTo: 'M-PESA / Bank Charges' },
    { id: 'EXP-23', date: '25th August 2026', description: 'Welfare to Simon', amount: 6000.00, category: 'Welfare Payout', paidTo: 'Member Welfare Grant' },
    { id: 'EXP-24', date: '24th sept 2026', description: 'Title processing fee', amount: 40000.00, category: 'Land Purchase', paidTo: 'Land Payment Disbursement' },
    { id: 'EXP-25', date: '24th sept 2026', description: 'Transaction Fee', amount: 59.76, category: 'Bank Charges', paidTo: 'M-PESA / Bank Charges' },
    { id: 'EXP-26', date: '26th Sept 2026', description: 'Facilitation to Mawega Office for titles works[Elijah]', amount: 1500.00, category: 'Field Operations', paidTo: 'Transport & Admin Facilitation' },
    { id: 'EXP-27', date: '26th Sept 2026', description: 'Facilitation to Mawega Office for titles works[Daniel]', amount: 1500.00, category: 'Field Operations', paidTo: 'Transport & Admin Facilitation' },
  ]);

  // 4. Official Loans Register (PDF Pages 7 & 8 - L001 to L019) with Settlement Date Tracking
  const [loans, setLoans] = useState([
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

  // 5. Official Fines & Penalties Log (PDF Page 9)
  const [fines, setFines] = useState([
    { id: 'FN-01', date: '16th Dec', member: 'Elijah Waitara Gichari', reason: 'Late payments', amount: 500.00, status: 'Paid', datePaid: '16th Dec 2025' },
    { id: 'FN-02', date: '16th Dec', member: 'Daniel Kamau Njiriri', reason: 'Late payments', amount: 500.00, status: 'Paid', datePaid: '16th Dec 2025' },
    { id: 'FN-03', date: '16th April', member: 'Beatrice Njoki Muthoni', reason: 'Late payments', amount: 500.00, status: 'Paid', datePaid: '16th Apr 2026' },
    { id: 'FN-04', date: '16th April', member: 'Daniel Kamau Njiriri', reason: 'Late payments', amount: 500.00, status: 'Paid', datePaid: '16th Apr 2026' },
    { id: 'FN-05', date: '16th June', member: 'Elijah Waitara Gichari', reason: 'Late payments', amount: 500.00, status: 'Paid', datePaid: '16th Jun 2026' },
    { id: 'FN-06', date: '16th June', member: 'Daniel Kamau Njiriri', reason: 'Late payments', amount: 500.00, status: 'Paid', datePaid: '16th Jun 2026' },
    { id: 'FN-07', date: '16th June', member: 'Daniel Kamau Njiriri', reason: 'Late payments', amount: 500.00, status: 'Paid', datePaid: '16th Jun 2026' },
  ]);

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

  // 12. Audit Trail & Logs
  const [loginLogs, setLoginLogs] = useState([
    { id: 'AUTH-101', user: 'Simon Memia Wanjiru', role: 'Director / Member', ip: '192.168.1.45', status: 'Success', timestamp: '2026-10-18 19:40' },
    { id: 'AUTH-102', user: 'Elijah Waitara Gichari', role: 'Member', ip: '192.168.1.52', status: 'Success', timestamp: '2026-10-18 18:15' },
    { id: 'AUTH-103', user: 'David Wainaina Kinyua', role: 'Member', ip: '192.168.1.88', status: 'Success', timestamp: '2026-10-17 14:05' },
  ]);

  const [editLogs, setEditLogs] = useState([
    { id: 'LOG-001', user: 'Simon Memia Wanjiru', action: 'System Sync', module: 'System', details: 'Imported Official Dreamloom Confidential Register (10 Pages)', timestamp: '2026-10-18 19:42' },
    { id: 'LOG-002', user: 'Simon Memia Wanjiru', action: 'Approved Loan', module: 'Loans', details: 'Active Loan L018 Disbursed (Beatrice)', timestamp: '2026-10-02 10:00' },
  ]);

  // =========================================================================
  // AUTOMATED & REACTIVE FINANCIAL CALCULATIONS
  // =========================================================================
  
  // Total Group Contributions (Amount paid in)
  const grandTotalContributions = useMemo(() => {
    return contributions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }, [contributions]);

  // Total Unsettled Contributions
  const grandTotalUnsettled = useMemo(() => {
    return contributions.reduce((sum, c) => sum + (Number(c.unsettled) || 0), 0);
  }, [contributions]);

  // Total Mawega Land Payouts
  const grandTotalMawegaPayouts = useMemo(() => {
    return contributions.reduce((sum, c) => sum + (Number(c.payout) || 0), 0);
  }, [contributions]);

  // Total Operational Expenses & Outflows
  const totalExpensesAmount = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  // Active Loans Principal Disbursed
  const totalActiveLoansPrincipal = useMemo(() => {
    return loans.filter(l => l.status === 'Active').reduce((sum, l) => sum + (Number(l.principal) || 0), 0);
  }, [loans]);

  // Active Loans Outstanding Balance (Principal + Interest)
  const totalActiveLoansAmount = useMemo(() => {
    return loans.filter(l => l.status === 'Active').reduce((sum, l) => sum + (Number(l.balance) || 0), 0);
  }, [loans]);

  const activeLoansCount = useMemo(() => {
    return loans.filter(l => l.status === 'Active').length;
  }, [loans]);

  // Total Penalties Paid
  const totalPaidPenalties = useMemo(() => {
    return fines.filter(f => f.status === 'Paid').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  }, [fines]);

  // Total Interest Paid from Settled Loans
  const totalPaidInterest = useMemo(() => {
    return loans.filter(l => l.status === 'Settled').reduce((sum, l) => sum + (Number(l.interest) || 0), 0);
  }, [loans]);

  // Real-time Bank Account Balance
  // Formula: Total Contributions - Total Expenses - Total Active Loans Principal + Total Penalties (PAID) + Total Interest (PAID)
  const bankAccountBalance = useMemo(() => {
    return grandTotalContributions - totalExpensesAmount - totalActiveLoansPrincipal + totalPaidPenalties + totalPaidInterest;
  }, [grandTotalContributions, totalExpensesAmount, totalActiveLoansPrincipal, totalPaidPenalties, totalPaidInterest]);

  // Member Unsettled Contributions Map (Automatically synced from main contributions page)
  const memberUnsettledTotals = useMemo(() => {
    const map: Record<string, number> = {};
    contributions.forEach(c => {
      if (c.member && c.unsettled) {
        map[c.member] = (map[c.member] || 0) + Number(c.unsettled);
      }
    });
    return map;
  }, [contributions]);

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
    return members.filter(m =>
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.nationalId.includes(searchQuery) ||
      m.phone.includes(searchQuery) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [members, searchQuery]);

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
    return expenses.filter(e =>
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.paidTo.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [expenses, searchQuery]);

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

  // Login Authentication Handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const targetUser = authorizedUsers.find(
      u => u.email.toLowerCase() === loginEmail.trim().toLowerCase() && u.password === loginPassword.trim()
    );

    if (targetUser) {
      setCurrentUser(targetUser);
      setIsLoggedIn(true);
      setLoginEmail('');
      setLoginPassword('');
      setLoginLogs(prev => [
        {
          id: `AUTH-${Date.now().toString().slice(-4)}`,
          user: targetUser.fullName,
          role: targetUser.role,
          ip: '192.168.1.' + Math.floor(Math.random() * 80 + 10),
          status: 'Success',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
        },
        ...prev
      ]);
    } else {
      setAuthError('Invalid credentials. Please verify your authorized member email and permanent PIN.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  // Toggle Loan Status: Active <-> Settled
  const handleToggleLoanStatus = (loanId: string) => {
    if (!canEdit) {
      alert('Access Restricted: Only Simon Memia Wanjiru and Elijah Waitara Gichari can update loan status.');
      return;
    }
    const todayStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    setLoans(prevLoans => prevLoans.map(l => {
      if (l.id === loanId) {
        if (l.status === 'Active') {
          return {
            ...l,
            status: 'Settled',
            clearedDate: todayStr,
            paid: l.totalLoan,
            balance: 0.00
          };
        } else {
          return {
            ...l,
            status: 'Active',
            clearedDate: '-',
            paid: 0.00,
            balance: l.totalLoan
          };
        }
      }
      return l;
    }));

    setEditLogs(prev => [
      {
        id: `LOG-${Date.now().toString().slice(-4)}`,
        user: currentUser?.fullName || 'Simon Memia',
        action: 'Toggled Loan Status',
        module: 'Loans',
        details: `Updated status for Loan ${loanId}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
      },
      ...prev
    ]);
  };

  // Toggle Penalty Status: Active <-> Paid (automatically adds date paid)
  const handleToggleFineStatus = (fineId: string) => {
    if (!canEdit) {
      alert('Access Restricted: Only Simon Memia Wanjiru and Elijah Waitara Gichari can update penalty status.');
      return;
    }
    const todayStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    setFines(prevFines => prevFines.map(f => {
      if (f.id === fineId) {
        const nextStatus = f.status === 'Active' ? 'Paid' : 'Active';
        return {
          ...f,
          status: nextStatus,
          datePaid: nextStatus === 'Paid' ? todayStr : '-'
        };
      }
      return f;
    }));

    setEditLogs(prev => [
      {
        id: `LOG-${Date.now().toString().slice(-4)}`,
        user: currentUser?.fullName || 'Simon Memia',
        action: 'Toggled Penalty Status',
        module: 'Fines & Penalties',
        details: `Updated penalty ${fineId} status`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
      },
      ...prev
    ]);
  };

  // Quick Action Modal Trigger
  const handleOpenQuickModal = (targetMode: string) => {
    if (!canEdit) {
      alert('Access Restricted: Only Simon Memia Wanjiru and Elijah Waitara Gichari are authorized to add new records.');
      return;
    }
    setModalMode(targetMode);
    setEditingId(null);
    setField1(''); setField2(''); setField3(''); setField4(''); setField5(''); setField6(''); setField7('');
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
      setField1(item.member || '');
      setField2(item.date || '');
      setField3(String(item.amount || 500));
      setField4(item.reason || '');
      setField5(item.status || 'Paid');
      setField6(item.datePaid || '');
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
    }
    setIsModalOpen(true);
  };

  // Submit Modal for All Modules (Add & Edit)
  const handleSubmitModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert('Access Restricted: Only Simon Memia Wanjiru and Elijah Waitara Gichari can modify records.');
      return;
    }
    const nowStamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

    // 1. Members
    if (modalMode === 'Member Directory' || modalMode === 'Add Member') {
      if (editingId) {
        setMembers(members.map(m => m.id === editingId ? {
          ...m,
          fullName: field1,
          nationalId: field2,
          phone: field3,
          role: field4,
          email: field5,
          totalContribution: Number(field6) || m.totalContribution,
          status: field7 || m.status
        } : m));
      } else {
        const newM = {
          id: `MEM-00${members.length + 1}`,
          name: field1.split(' ')[0],
          fullName: field1,
          nationalId: field2 || '40000000',
          phone: field3 || '0700000000',
          role: field4 || 'Member',
          email: field5 || `${field1.split(' ')[0].toLowerCase()}@dreamloom.co.ke`,
          totalContribution: 65000.00,
          activeLoans: 0.00,
          netBalance: 65000.00,
          shares: '13.80%',
          percentage: 90,
          status: 'Active',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          color: 'from-emerald-400 to-teal-400'
        };
        setMembers([...members, newM]);
      }
    }
    // 2. Contributions
    else if (modalMode === 'Contributions' || modalMode === 'Record Contribution') {
      if (editingId) {
        setContributions(contributions.map(c => c.id === editingId ? {
          ...c,
          month: field1,
          member: field2,
          amount: Number(field3) || 0,
          unsettled: Number(field4) || 0,
          payout: Number(field5) || 0,
          notes: field6
        } : c));
      } else {
        const newC = {
          id: `CNT-${contributions.length + 1}`,
          month: field1 || '01-Oct-2026',
          member: field2,
          amount: Number(field3) || 0.00,
          unsettled: Number(field4) || 0.00,
          payout: Number(field5) || 0.00,
          notes: field6 || ''
        };
        setContributions([newC, ...contributions]);
        setTransactions([
          { id: `TX-${Date.now()}`, title: `${field2.split(' ')[0]} - Contribution`, time: 'Just now', amount: `+ KES ${Number(field3 || 0).toLocaleString()}`, type: 'income', icon: Users, iconColor: 'bg-blue-600/20 text-sky-400' },
          ...transactions
        ]);
      }
    }
    // 3. Loans
    else if (modalMode === 'Loan Portfolio' || modalMode === 'New Loan') {
      const pAmt = Number(field2) || 0;
      const iAmt = field3 ? Number(field3) : pAmt * 0.10;
      const tAmt = pAmt + iAmt;
      if (editingId) {
        setLoans(loans.map(l => l.id === editingId ? {
          ...l,
          borrower: field1,
          principal: pAmt,
          interest: iAmt,
          totalLoan: tAmt,
          issueDate: field4,
          clearedDate: field5,
          status: field6,
          balance: field6 === 'Settled' ? 0.00 : (field7 ? Number(field7) : tAmt),
          paid: field6 === 'Settled' ? tAmt : l.paid
        } : l));
      } else {
        const newL = {
          id: `L0${loans.length + 1}`,
          borrower: field1,
          principal: pAmt,
          interest: iAmt,
          totalLoan: tAmt,
          issueDate: field4 || 'October 2026',
          clearedDate: '-',
          status: 'Active',
          paid: 0.00,
          balance: tAmt
        };
        setLoans([...loans, newL]);
        setTransactions([
          { id: `TX-${Date.now()}`, title: `${field1.split(' ')[0]} - Loan Approved`, time: 'Just now', amount: `+ KES ${pAmt.toLocaleString()}`, type: 'income', icon: CreditCard, iconColor: 'bg-cyan-600/20 text-cyan-400' },
          ...transactions
        ]);
      }
    }
    // 4. Fines & Penalties
    else if (modalMode === 'Fines & Penalties' || modalMode === 'Levy Penalty') {
      if (editingId) {
        setFines(fines.map(f => f.id === editingId ? {
          ...f,
          member: field1,
          date: field2,
          amount: Number(field3) || 500,
          reason: field4,
          status: field5,
          datePaid: field5 === 'Paid' ? (field6 || '18th Oct 2026') : '-'
        } : f));
      } else {
        const newF = {
          id: `FN-0${fines.length + 1}`,
          member: field1,
          date: field2 || '18th Oct',
          amount: Number(field3) || 500,
          reason: field4 || 'Late payments',
          status: field5 || 'Active',
          datePaid: field5 === 'Paid' ? (field6 || '18th Oct 2026') : '-'
        };
        setFines([...fines, newF]);
      }
    }
    // 5. Expenses
    else if (modalMode === 'Expenses' || modalMode === 'Add Expense') {
      if (editingId) {
        setExpenses(expenses.map(exp => exp.id === editingId ? {
          ...exp,
          description: field1,
          category: field2,
          amount: Number(field3) || 0,
          date: field4,
          paidTo: field5
        } : exp));
      } else {
        const newExp = {
          id: `EXP-${expenses.length + 1}`,
          description: field1,
          category: field2 || 'Operational',
          amount: Number(field3) || 1000.00,
          date: field4 || '18-Oct-26',
          paidTo: field5 || 'Vendor'
        };
        setExpenses([newExp, ...expenses]);
        setTransactions([
          { id: `TX-${Date.now()}`, title: `${field1} - Expense`, time: 'Just now', amount: `- KES ${Number(field3 || 1000).toLocaleString()}`, type: 'expense', icon: Receipt, iconColor: 'bg-rose-600/20 text-rose-400' },
          ...transactions
        ]);
      }
    }
    // 6. Strategic Investments
    else if (modalMode === 'Investments') {
      if (editingId) {
        setInvestments(investments.map(inv => inv.id === editingId ? {
          ...inv,
          asset: field1,
          type: field2,
          capital: Number(field3) || inv.capital,
          expectedReturn: field4,
          status: field5
        } : inv));
      }
    }
    // 7. Projects
    else if (modalMode === 'Projects') {
      if (editingId) {
        setProjects(projects.map(p => p.id === editingId ? {
          ...p,
          name: field1,
          manager: field2,
          budget: Number(field3) || p.budget,
          status: field4
        } : p));
      }
    }
    // 8. Suppliers
    else if (modalMode === 'Suppliers') {
      if (editingId) {
        setSuppliers(suppliers.map(s => s.id === editingId ? {
          ...s,
          name: field1,
          category: field2,
          contact: field3,
          status: field4
        } : s));
      }
    }
    // 9. Documents
    else if (modalMode === 'Documents') {
      if (editingId) {
        setDocuments(documents.map(d => d.id === editingId ? {
          ...d,
          name: field1,
          category: field2,
          status: field3
        } : d));
      }
    }

    setEditLogs(prev => [
      {
        id: `LOG-${Date.now().toString().slice(-4)}`,
        user: currentUser?.fullName || 'Simon Memia',
        action: editingId ? 'Updated Record' : 'Created Record',
        module: modalMode,
        details: `${editingId ? 'Modified' : 'Added'} record in ${modalMode}: ${field1}`,
        timestamp: nowStamp
      },
      ...prev
    ]);

    setIsModalOpen(false);
  };

  // Sidebar Menu Items
  const menuGroups = [
    {
      group: 'CORE FINANCIALS',
      items: [
        { name: 'Overview', icon: LayoutDashboard },
        { name: 'Member Directory', icon: Users },
        { name: 'Contributions', icon: Wallet },
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
                  placeholder="e.g. simon@dreamloom.co.ke"
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

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-medium text-xs rounded-lg transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Authenticate & Access
            </button>
          </form>

          <div className="text-center border-t border-[#1E293B] pt-4">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">
              Dreamloom Holding Limited • Confidential
            </span>
            <span className="text-[9px] text-slate-600 mt-1 block">
              Session automatically locks after 10 minutes of inactivity
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
                <div className="w-8 h-8 rounded-full overflow-hidden bg-emerald-700 ring-2 ring-emerald-500/50">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
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
                <div className="absolute right-0 mt-2 w-56 bg-[#0F172A] border border-[#1E293B] rounded-2xl p-2 shadow-2xl z-50 space-y-1">
                  <div className="px-3 py-2 border-b border-[#1E293B]">
                    <p className="text-xs font-bold text-white">{currentUser?.fullName}</p>
                    <p className="text-[10px] text-emerald-400">{currentUser?.email}</p>
                    <p className="text-[9px] text-slate-400">ID: {currentUser?.nationalId} • {currentUser?.phone}</p>
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
              {/* Month Dropdown */}
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-[#10192A] border border-[#1E2E4E] hover:border-slate-500 text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none cursor-pointer pr-7 appearance-none transition"
                >
                  <option value="October 2026">October 2026</option>
                  <option value="September 2026">September 2026</option>
                  <option value="August 2026">August 2026</option>
                  <option value="July 2026">July 2026</option>
                  <option value="June 2026">June 2026</option>
                  <option value="May 2026">May 2026</option>
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
                    {members.map((m) => (
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
                        {canEdit && <th className="p-4 text-center">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E293B]">
                      {filteredMembers.map((m) => (
                        <tr key={m.id} className="hover:bg-[#142036] transition">
                          <td className="p-4 font-semibold text-white flex items-center gap-2.5">
                            <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                            <span>{m.fullName}</span>
                          </td>
                          <td className="p-4 font-mono text-emerald-400 font-bold">{m.nationalId}</td>
                          <td className="p-4 font-mono text-slate-300">{m.phone}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold">
                              {m.role}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-slate-400">{m.email}</td>
                          {canEdit && (
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleOpenEditModal(m, 'Member Directory')}
                                className="p-1.5 hover:text-white text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                                title="Edit Member Information"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AUTOMATIC SUMMARY CARD WITH UNSETTLED COLUMN (PDF Page 10) */}
              <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">
                <div className="p-5 border-b border-[#1E293B]">
                  <h2 className="font-bold text-white text-base">Member Balances, Unsettled Dues & Shares — Automatic Summary</h2>
                  <p className="text-xs text-slate-400">Total Contribution vs Unsettled Contributions, Active Loans, and Net Balance (Page 14 of 17)</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#121B2F] text-slate-400 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-4">Member Name</th>
                        <th className="p-4 text-right">Total Contribution (KES)</th>
                        <th className="p-4 text-right text-amber-300">Unsettled Contribution (KES)</th>
                        <th className="p-4 text-right">Active Loans (KES)</th>
                        <th className="p-4 text-right">Net Balance (KES)</th>
                        <th className="p-4 text-right">% Share Holding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E293B] font-mono">
                      {members.map((m) => {
                        const memberUnsettled = memberUnsettledTotals[m.fullName] || 0;
                        return (
                          <tr key={m.id} className="hover:bg-[#142036] transition">
                            <td className="p-4 font-sans text-white font-medium">{m.fullName}</td>
                            <td className="p-4 text-right font-bold text-white">{m.totalContribution.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="p-4 text-right font-bold text-amber-400">{memberUnsettled.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="p-4 text-right text-rose-400">{m.activeLoans.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="p-4 text-right font-bold text-emerald-400">{m.netBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="p-4 text-right font-bold text-sky-400">{m.shares}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-[#121B2F] font-bold text-white">
                        <td className="p-4 uppercase">GRAND TOTALS</td>
                        <td className="p-4 text-right text-emerald-400 font-black">{grandTotalContributions.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-right text-amber-400 font-black">{grandTotalUnsettled.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-right text-rose-400 font-black">{totalActiveLoansAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-right text-emerald-400 font-black">392,050.00</td>
                        <td className="p-4 text-right text-sky-400 font-black">100.00%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* CONTRIBUTIONS & LAND PAYOUTS REGISTER (PDF Pages 2, 3, 4, 5) */}
          {/* ===================================================================== */}
          {activeTab === 'Contributions' && (
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">
              <div className="p-5 border-b border-[#1E293B] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="font-bold text-white text-base">Member Contributions & Land Payouts Register</h2>
                  <p className="text-xs text-slate-400">Total Contributions: KES {grandTotalContributions.toLocaleString()} • Unsettled: KES {grandTotalUnsettled.toLocaleString()} • Payouts: KES {grandTotalMawegaPayouts.toLocaleString()}</p>
                </div>
                {canEdit && (
                  <button
                    onClick={() => handleOpenQuickModal('Contributions')}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-emerald-950/50"
                  >
                    <Plus className="w-3.5 h-3.5" /> Record Contribution
                  </button>
                )}
              </div>
              <div className="overflow-x-auto max-h-[650px]">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#121B2F] text-slate-400 uppercase text-[10px] font-bold sticky top-0 z-10">
                    <tr>
                      <th className="p-4">#</th>
                      <th className="p-4">Date / Month</th>
                      <th className="p-4">Member Name</th>
                      <th className="p-4 text-right">Amount (KES)</th>
                      <th className="p-4 text-right text-amber-300">Unsettled Contributions (KES)</th>
                      <th className="p-4 text-right">Mawega Payout (KES)</th>
                      <th className="p-4">Notes / Remarks</th>
                      {canEdit && <th className="p-4 text-center">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B] font-mono">
                    {filteredContributions.map((c, idx) => (
                      <tr key={c.id} className="hover:bg-[#142036] transition">
                        <td className="p-4 text-slate-500">{idx + 1}</td>
                        <td className="p-4 text-slate-400">{c.month}</td>
                        <td className="p-4 font-sans text-white font-medium">{c.member}</td>
                        <td className="p-4 text-right font-bold text-emerald-400">
                          {c.amount > 0 ? c.amount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                        </td>
                        <td className="p-4 text-right font-bold text-amber-400">
                          {c.unsettled > 0 ? c.unsettled.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                        </td>
                        <td className="p-4 text-right font-bold text-sky-400">
                          {c.payout > 0 ? c.payout.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                        </td>
                        <td className="p-4 font-sans text-slate-400">{c.notes || '-'}</td>
                        {canEdit && (
                          <td className="p-4 text-center font-sans">
                            <button
                              onClick={() => handleOpenEditModal(c, 'Contributions')}
                              className="p-1.5 hover:text-white text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                              title="Edit Contribution Entry"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    <tr className="bg-[#121B2F] font-bold text-white text-xs sticky bottom-0">
                      <td className="p-4 uppercase font-sans" colSpan={3}>GRAND TOTAL CONTRIBUTIONS & PAYOUTS</td>
                      <td className="p-4 text-right text-emerald-400 font-black">{grandTotalContributions.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="p-4 text-right text-amber-400 font-black">{grandTotalUnsettled.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="p-4 text-right text-sky-400 font-black">{grandTotalMawegaPayouts.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="p-4 font-sans" colSpan={canEdit ? 2 : 1}>Official Ledger Reconciled</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* LOAN PORTFOLIO & SETTLED LOANS (PDF Pages 7 & 8) */}
          {/* ===================================================================== */}
          {activeTab === 'Loan Portfolio' && (
            <div className="space-y-6">
              {/* ACTIVE LOANS */}
              <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">
                <div className="p-5 border-b border-[#1E293B] flex justify-between items-center">
                  <div>
                    <h2 className="font-bold text-white text-base">Active Loans Portfolio ({loans.filter(l => l.status === 'Active').length} Active)</h2>
                    <p className="text-xs text-slate-400">Click &apos;Active&apos; status to settle loan and automatically record settlement date</p>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => handleOpenQuickModal('Loan Portfolio')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-emerald-950/50"
                    >
                      <Plus className="w-3.5 h-3.5" /> Disburse Loan
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#121B2F] text-slate-400 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-4">Loan ID</th>
                        <th className="p-4">Issue Date</th>
                        <th className="p-4">Member Name</th>
                        <th className="p-4 text-right">Principal (KES)</th>
                        <th className="p-4 text-right">Interest (KES)</th>
                        <th className="p-4 text-right">Total Loan (KES)</th>
                        <th className="p-4 text-right">Loan Balance (KES)</th>
                        <th className="p-4 text-center">Status</th>
                        {canEdit && <th className="p-4 text-center">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E293B] font-mono">
                      {loans.filter(l => l.status === 'Active').map((l) => (
                        <tr key={l.id} className="hover:bg-[#142036] transition">
                          <td className="p-4 text-emerald-400 font-bold">{l.id}</td>
                          <td className="p-4 text-slate-400">{l.issueDate}</td>
                          <td className="p-4 font-sans text-white font-medium">{l.borrower}</td>
                          <td className="p-4 text-right">{l.principal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 text-right text-slate-400">{l.interest.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 text-right font-bold text-white">{l.totalLoan.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 text-right font-bold text-amber-400">{l.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleToggleLoanStatus(l.id)}
                              disabled={!canEdit}
                              className={`px-3 py-1 rounded-full text-[10px] font-sans font-bold transition flex items-center justify-center gap-1 mx-auto ${
                                canEdit
                                  ? 'bg-blue-500/20 text-sky-400 hover:bg-emerald-500/20 hover:text-emerald-400 cursor-pointer border border-blue-500/40 hover:border-emerald-500/40'
                                  : 'bg-blue-500/10 text-sky-400 cursor-default'
                              }`}
                              title={canEdit ? 'Click to mark as Settled' : 'View only'}
                            >
                              <span>{l.status}</span>
                              {canEdit && <Check className="w-3 h-3 opacity-60" />}
                            </button>
                          </td>
                          {canEdit && (
                            <td className="p-4 text-center font-sans">
                              <button
                                onClick={() => handleOpenEditModal(l, 'Loan Portfolio')}
                                className="p-1.5 hover:text-white text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                                title="Edit Loan Record"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                      <tr className="bg-[#121B2F] font-bold text-white">
                        <td className="p-4 uppercase font-sans" colSpan={6}>TOTAL ACTIVE LOANS OUTSTANDING</td>
                        <td className="p-4 text-right text-amber-400 font-black">{totalActiveLoansAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td colSpan={canEdit ? 2 : 1}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SETTLED LOANS HISTORY WITH EXPLICIT SETTLEMENT DATES */}
              <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">
                <div className="p-5 border-b border-[#1E293B]">
                  <h2 className="font-bold text-white text-base">Settled Loans History with Settlement Dates</h2>
                  <p className="text-xs text-slate-400">Fully Repaid Loans ({loans.filter(l => l.status === 'Settled').length} Settled)</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#121B2F] text-slate-400 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-4">Loan ID</th>
                        <th className="p-4">Issue Date</th>
                        <th className="p-4">Member Name</th>
                        <th className="p-4 text-right">Principal Repaid (KES)</th>
                        <th className="p-4 text-right">Interest Paid (KES)</th>
                        <th className="p-4 text-right">Paid Total (KES)</th>
                        <th className="p-4 text-emerald-400 font-bold">Date Settled</th>
                        <th className="p-4 text-center">Status</th>
                        {canEdit && <th className="p-4 text-center">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E293B] font-mono">
                      {loans.filter(l => l.status === 'Settled').map((l) => (
                        <tr key={l.id} className="hover:bg-[#142036] transition">
                          <td className="p-4 text-emerald-400 font-bold">{l.id}</td>
                          <td className="p-4 text-slate-400">{l.issueDate}</td>
                          <td className="p-4 font-sans text-white font-medium">{l.borrower}</td>
                          <td className="p-4 text-right">{l.principal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 text-right text-slate-400">{l.interest.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 text-right font-bold text-emerald-400">{l.totalLoan.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 text-emerald-300 font-bold">{l.clearedDate || 'Settled'}</td>
                          <td className="p-4 text-center">
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-sans font-bold">
                              {l.status}
                            </span>
                          </td>
                          {canEdit && (
                            <td className="p-4 text-center font-sans">
                              <button
                                onClick={() => handleOpenEditModal(l, 'Loan Portfolio')}
                                className="p-1.5 hover:text-white text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                                title="Edit Loan Record"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* FINES & PENALTIES LOG (PDF Page 9) WITH REQUESTED COLUMNS & TOGGLE */}
          {/* ===================================================================== */}
          {activeTab === 'Fines & Penalties' && (
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">
              <div className="p-5 border-b border-[#1E293B] flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-white text-base">Fines & Late Payment Penalties Register</h2>
                  <p className="text-xs text-slate-400">Click &apos;Active&apos; status to change to &apos;Paid&apos; and automatically record settlement date</p>
                </div>
                {canEdit && (
                  <button
                    onClick={() => handleOpenQuickModal('Fines & Penalties')}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-emerald-950/50"
                  >
                    <Plus className="w-3.5 h-3.5" /> Levy Penalty
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#121B2F] text-slate-400 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-4">Member Name</th>
                      <th className="p-4">Date Levied</th>
                      <th className="p-4 text-right text-amber-300">Unsettled Contributions (KES)</th>
                      <th className="p-4 text-right">Penalty Amount (KES)</th>
                      <th className="p-4 text-right text-emerald-300">Total (KES)</th>
                      <th className="p-4">Reason / Cause</th>
                      <th className="p-4 text-slate-400">Date Paid</th>
                      <th className="p-4 text-center">Payment Status</th>
                      {canEdit && <th className="p-4 text-center">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B] font-mono">
                    {fines.map((f) => {
                      const memberUnsettled = memberUnsettledTotals[f.member] || 0;
                      const combinedTotal = memberUnsettled + f.amount;
                      return (
                        <tr key={f.id} className="hover:bg-[#142036] transition">
                          <td className="p-4 font-sans text-white font-medium">{f.member}</td>
                          <td className="p-4 text-slate-400">{f.date}</td>
                          <td className="p-4 text-right font-bold text-amber-400">{memberUnsettled.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 text-right font-bold text-white">{f.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 text-right font-black text-emerald-400">{combinedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 font-sans text-slate-300">{f.reason}</td>
                          <td className="p-4 text-slate-400">{f.datePaid || '-'}</td>
                          <td className="p-4 text-center font-sans">
                            <button
                              onClick={() => handleToggleFineStatus(f.id)}
                              disabled={!canEdit}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold transition flex items-center justify-center gap-1 mx-auto ${
                                f.status === 'Paid'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-emerald-500/20 hover:text-emerald-400 cursor-pointer'
                              }`}
                              title={canEdit ? 'Click to toggle Active / Paid' : 'View only'}
                            >
                              <span>{f.status}</span>
                              {f.status === 'Paid' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            </button>
                          </td>
                          {canEdit && (
                            <td className="p-4 text-center font-sans">
                              <button
                                onClick={() => handleOpenEditModal(f, 'Fines & Penalties')}
                                className="p-1.5 hover:text-white text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                                title="Edit Penalty Record"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    <tr className="bg-[#121B2F] font-bold text-white">
                      <td className="p-4 uppercase font-sans" colSpan={3}>TOTAL PENALTIES COLLECTED</td>
                      <td className="p-4 text-right text-emerald-400 font-black">{totalPaidPenalties.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td colSpan={canEdit ? 5 : 4} className="p-4 font-sans text-slate-400">Penalties dynamically feed Bank Account Balances</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* OPERATIONAL EXPENSES & PAYOUTS LOG (PDF Page 6) */}
          {/* ===================================================================== */}
          {activeTab === 'Expenses' && (
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">
              <div className="p-5 border-b border-[#1E293B] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="font-bold text-white text-base">Operational Expenses & Payouts Log</h2>
                  <p className="text-xs text-slate-400">Total Expenses: KES {totalExpensesAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} (Page 8 of 17)</p>
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
                  <input type="text" readOnly value="Simon Memia Wanjiru (simon@dreamloom.co.ke) & Elijah Waitara Gichari (elijah@dreamloom.co.ke)" className="w-full bg-[#142036] border border-[#1E2D4A] rounded-xl p-2.5 text-white" />
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
                  <p className="text-xs font-mono text-slate-400">simon@dreamloom.co.ke</p>
                </div>
              </div>

              <div className="p-4 bg-[#142036] border border-[#1E2D4A] rounded-xl text-xs space-y-1.5 text-slate-400 font-mono">
                <p>System Version: 2.1 Reconciled Multi-Role High-Performance Dashboard</p>
                <p>Company: Dreamloom Holding Limited</p>
                <p>Permissions: Data modification restricted strictly to Simon Memia & Elijah Waitara</p>
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
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">
              <div className="p-5 border-b border-[#1E293B]">
                <h2 className="font-bold text-white text-base">System Audit & Changes Trail</h2>
              </div>
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#121B2F] text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-4">Log ID</th>
                    <th className="p-4">Author</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Module</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B] font-mono">
                  {editLogs.map(log => (
                    <tr key={log.id} className="hover:bg-[#142036]">
                      <td className="p-4 text-sky-400 font-bold">{log.id}</td>
                      <td className="p-4 font-sans text-white font-medium">{log.user}</td>
                      <td className="p-4 font-sans">{log.action}</td>
                      <td className="p-4 font-sans text-emerald-400">{log.module}</td>
                      <td className="p-4 font-sans text-slate-300">{log.details}</td>
                      <td className="p-4 text-slate-400">{log.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              {/* Field 1 */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  {modalMode.includes('Member') ? 'Full Name' :
                   modalMode.includes('Contribution') ? 'Month / Date (e.g. 01-Oct-2026)' :
                   modalMode.includes('Loan') ? 'Borrower Full Name' :
                   modalMode.includes('Fines') ? 'Member Full Name' :
                   modalMode.includes('Expense') ? 'Description' :
                   modalMode.includes('Investment') ? 'Asset Name' :
                   modalMode.includes('Project') ? 'Project Title' : 'Name / Title'}
                </label>
                <input
                  type="text"
                  required
                  value={field1}
                  onChange={(e) => setField1(e.target.value)}
                  className="w-full bg-[#142036] border border-[#1E2D4A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Field 2 */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  {modalMode.includes('Member') ? 'National ID Number' :
                   modalMode.includes('Contribution') ? 'Member Full Name' :
                   modalMode.includes('Loan') ? 'Principal Amount (KES)' :
                   modalMode.includes('Fines') ? 'Date Levied (e.g. 16th June)' :
                   modalMode.includes('Expense') ? 'Expense Category' :
                   modalMode.includes('Investment') ? 'Investment Type' :
                   modalMode.includes('Project') ? 'Project Manager / Lead' : 'Category'}
                </label>
                <input
                  type="text"
                  required
                  value={field2}
                  onChange={(e) => setField2(e.target.value)}
                  className="w-full bg-[#142036] border border-[#1E2D4A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
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
                   modalMode.includes('Project') ? 'Project Budget (KES)' : 'Contact / Value'}
                </label>
                <input
                  type="text"
                  value={field3}
                  onChange={(e) => setField3(e.target.value)}
                  className="w-full bg-[#142036] border border-[#1E2D4A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Field 4 */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  {modalMode.includes('Member') ? 'Role (Director / Member)' :
                   modalMode.includes('Contribution') ? 'Unsettled Contributions (KES)' :
                   modalMode.includes('Loan') ? 'Issue Date' :
                   modalMode.includes('Fines') ? 'Reason / Cause' :
                   modalMode.includes('Expense') ? 'Date' :
                   modalMode.includes('Investment') ? 'Expected Return (e.g. 15%)' :
                   modalMode.includes('Project') ? 'Project Status (Active / Completed)' : 'Status'}
                </label>
                <input
                  type="text"
                  value={field4}
                  onChange={(e) => setField4(e.target.value)}
                  className="w-full bg-[#142036] border border-[#1E2D4A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Field 5 */}
              {(modalMode.includes('Contribution') || modalMode.includes('Member') || modalMode.includes('Expense') || modalMode.includes('Loan') || modalMode.includes('Fines') || modalMode.includes('Investment')) && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    {modalMode.includes('Member') ? 'Email Address' :
                     modalMode.includes('Contribution') ? 'Mawega Payout (KES)' :
                     modalMode.includes('Loan') ? 'Date Settled (or "-" if active)' :
                     modalMode.includes('Fines') ? 'Payment Status (Active / Paid)' :
                     modalMode.includes('Expense') ? 'Paid To / Reference' : 'Status'}
                  </label>
                  <input
                    type="text"
                    value={field5}
                    onChange={(e) => setField5(e.target.value)}
                    className="w-full bg-[#142036] border border-[#1E2D4A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Field 6 */}
              {(modalMode.includes('Contribution') || modalMode.includes('Loan') || modalMode.includes('Fines')) && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    {modalMode.includes('Contribution') ? 'Notes / Remarks' :
                     modalMode.includes('Loan') ? 'Loan Status (Active / Settled)' :
                     modalMode.includes('Fines') ? 'Date Paid' : 'Additional Info'}
                  </label>
                  <input
                    type="text"
                    value={field6}
                    onChange={(e) => setField6(e.target.value)}
                    className="w-full bg-[#142036] border border-[#1E2D4A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-[#1E293B]">
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
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
