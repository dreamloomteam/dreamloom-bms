/**
 * Authoritative Official Loan Portfolio Dataset (Exact 14 Records from PDF/Excel)
 * Source of truth: Dreamloom_Loan_Portfolio.xlsx
 *
 * Requirements:
 * - Exactly 14 records
 * - Arranged by issue date descending (newest first)
 * - Corrected issue date 02/07/2026 for loan L1076
 * - Absolutely NO recalculation: preserve exact historical figures, decimal values,
 *   completed periods, accrued interest, total loan amount, principal repaid,
 *   interest paid, total paid, outstanding balance, status and settlement dates.
 */

export interface OfficialLoanItem {
  id: string;
  issueDateStr: string;        // DD/MM/YYYY
  issueDateISO: string;        // YYYY-MM-DD
  memberName: string;
  memberId: number;
  principal: number;
  monthlyInterestRate: number; // %
  interestMethod: string;
  completedPeriods: number | null;
  interestAccrued: number;
  totalLoanAmount: number;
  interestPaid: number;
  principalRepaid: number;
  totalPaid: number;
  outstandingBalance: number;
  status: 'Active' | 'Settled';
  settlementDateStr: string | null; // DD/MM/YYYY
  settlementDateISO: string | null; // YYYY-MM-DD
  durationMonths: number;
  approvalRef: string;
  purpose: string;
  remarks: string;
}

export const OFFICIAL_LOAN_PORTFOLIO: OfficialLoanItem[] = [
  // 1. L1073 - David Wainaina Kinyua - 01/10/2026
  {
    id: 'L1073',
    issueDateStr: '01/10/2026',
    issueDateISO: '2026-10-01',
    memberName: 'David Wainaina Kinyua',
    memberId: 2,
    principal: 4350,
    monthlyInterestRate: 10,
    interestMethod: 'Simple',
    completedPeriods: null,
    interestAccrued: 435,
    totalLoanAmount: 4785,
    interestPaid: 0,
    principalRepaid: 0,
    totalPaid: 0,
    outstandingBalance: 4785,
    status: 'Active',
    settlementDateStr: null,
    settlementDateISO: null,
    durationMonths: 6,
    approvalRef: 'APR-L1073',
    purpose: 'Personal / Business Development',
    remarks: 'Official Loan Record'
  },
  // 2. L1071 - Simon Memia Wanjiru - 10/09/2026
  {
    id: 'L1071',
    issueDateStr: '10/09/2026',
    issueDateISO: '2026-09-10',
    memberName: 'Simon Memia Wanjiru',
    memberId: 1,
    principal: 3000,
    monthlyInterestRate: 10,
    interestMethod: 'Simple',
    completedPeriods: 2,
    interestAccrued: 600,
    totalLoanAmount: 3600,
    interestPaid: 0,
    principalRepaid: 0,
    totalPaid: 0,
    outstandingBalance: 3600,
    status: 'Active',
    settlementDateStr: null,
    settlementDateISO: null,
    durationMonths: 6,
    approvalRef: 'APR-L1071',
    purpose: 'Personal / Business Development',
    remarks: 'Official Loan Record'
  },
  // 3. £1066 - Beatrice Njoki Muthoni - 10/08/2026
  {
    id: '£1066',
    issueDateStr: '10/08/2026',
    issueDateISO: '2026-08-10',
    memberName: 'Beatrice Njoki Muthoni',
    memberId: 7,
    principal: 15000,
    monthlyInterestRate: 0,
    interestMethod: 'Simple',
    completedPeriods: 3,
    interestAccrued: 0,
    totalLoanAmount: 15000,
    interestPaid: 0,
    principalRepaid: 0,
    totalPaid: 0,
    outstandingBalance: 15000,
    status: 'Active',
    settlementDateStr: null,
    settlementDateISO: null,
    durationMonths: 6,
    approvalRef: 'APR-£1066',
    purpose: 'Personal / Business Development',
    remarks: 'Official Loan Record'
  },
  // 4. L1078 - Daniel Kamau Njiriri - 16/07/2026
  {
    id: 'L1078',
    issueDateStr: '16/07/2026',
    issueDateISO: '2026-07-16',
    memberName: 'Daniel Kamau Njiriri',
    memberId: 6,
    principal: 10000,
    monthlyInterestRate: 10.7235,
    interestMethod: 'Simple',
    completedPeriods: 1,
    interestAccrued: 1072.35,
    totalLoanAmount: 11072.35,
    interestPaid: 1072.35,
    principalRepaid: 10000,
    totalPaid: 11072.35,
    outstandingBalance: 0,
    status: 'Settled',
    settlementDateStr: '14/07/2026',
    settlementDateISO: '2026-07-14',
    durationMonths: 6,
    approvalRef: 'APR-L1078',
    purpose: 'Personal / Business Development',
    remarks: 'Official Loan Record'
  },
  // 5. LOO9 - Samuel Kamau Nguura - 05/07/2026
  {
    id: 'LOO9',
    issueDateStr: '05/07/2026',
    issueDateISO: '2026-07-05',
    memberName: 'Samuel Kamau Nguura',
    memberId: 4,
    principal: 6000,
    monthlyInterestRate: 10,
    interestMethod: 'Simple',
    completedPeriods: 1,
    interestAccrued: 600,
    totalLoanAmount: 6600,
    interestPaid: 600,
    principalRepaid: 6000,
    totalPaid: 6600,
    outstandingBalance: 0,
    status: 'Settled',
    settlementDateStr: '05/08/2026',
    settlementDateISO: '2026-08-05',
    durationMonths: 6,
    approvalRef: 'APR-LOO9',
    purpose: 'Personal / Business Development',
    remarks: 'Official Loan Record'
  },
  // 6. L1076 - Daniel Kamau Njiriri - 02/07/2026 (Corrected issue date)
  {
    id: 'L1076',
    issueDateStr: '02/07/2026',
    issueDateISO: '2026-07-02',
    memberName: 'Daniel Kamau Njiriri',
    memberId: 6,
    principal: 10000,
    monthlyInterestRate: 15,
    interestMethod: 'Simple',
    completedPeriods: null,
    interestAccrued: 1500,
    totalLoanAmount: 11500,
    interestPaid: 1500,
    principalRepaid: 10000,
    totalPaid: 11500,
    outstandingBalance: 0,
    status: 'Settled',
    settlementDateStr: '16/07/2026',
    settlementDateISO: '2026-07-16',
    durationMonths: 6,
    approvalRef: 'APR-L1076',
    purpose: 'Personal / Business Development',
    remarks: 'Official Loan Record'
  },
  // 7. L005 - Simon Memia Wanjiru - 14/06/2026
  {
    id: 'L005',
    issueDateStr: '14/06/2026',
    issueDateISO: '2026-06-14',
    memberName: 'Simon Memia Wanjiru',
    memberId: 1,
    principal: 12000,
    monthlyInterestRate: 15,
    interestMethod: 'Simple',
    completedPeriods: 1,
    interestAccrued: 1800,
    totalLoanAmount: 13800,
    interestPaid: 1800,
    principalRepaid: 12000,
    totalPaid: 13800,
    outstandingBalance: 0,
    status: 'Settled',
    settlementDateStr: '14/06/2026',
    settlementDateISO: '2026-06-14',
    durationMonths: 6,
    approvalRef: 'APR-L005',
    purpose: 'Personal / Business Development',
    remarks: 'Official Loan Record'
  },
  // 8. LOUS - David Wainaina Kinyua - 04/06/2026
  {
    id: 'LOUS',
    issueDateStr: '04/06/2026',
    issueDateISO: '2026-06-04',
    memberName: 'David Wainaina Kinyua',
    memberId: 2,
    principal: 4000,
    monthlyInterestRate: 10,
    interestMethod: 'Simple',
    completedPeriods: 1,
    interestAccrued: 400,
    totalLoanAmount: 4400,
    interestPaid: 400,
    principalRepaid: 4000,
    totalPaid: 4400,
    outstandingBalance: 0,
    status: 'Settled',
    settlementDateStr: '04/07/2026',
    settlementDateISO: '2026-07-04',
    durationMonths: 6,
    approvalRef: 'APR-LOUS',
    purpose: 'Personal / Business Development',
    remarks: 'Official Loan Record'
  },
  // 9. L1070 - Daniel Kamau Njiriri - 15/05/2026
  {
    id: 'L1070',
    issueDateStr: '15/05/2026',
    issueDateISO: '2026-05-15',
    memberName: 'Daniel Kamau Njiriri',
    memberId: 6,
    principal: 10000,
    monthlyInterestRate: 17,
    interestMethod: 'Simple',
    completedPeriods: 1,
    interestAccrued: 1700,
    totalLoanAmount: 11700,
    interestPaid: 1700,
    principalRepaid: 10000,
    totalPaid: 11700,
    outstandingBalance: 0,
    status: 'Settled',
    settlementDateStr: '22/06/2026',
    settlementDateISO: '2026-06-22',
    durationMonths: 6,
    approvalRef: 'APR-L1070',
    purpose: 'Personal / Business Development',
    remarks: 'Official Loan Record'
  },
  // 10. L004-B - Samuel Kamau Nguuro - 14/05/2026
  {
    id: 'L004-B',
    issueDateStr: '14/05/2026',
    issueDateISO: '2026-05-14',
    memberName: 'Samuel Kamau Nguuro',
    memberId: 4,
    principal: 6000,
    monthlyInterestRate: 15,
    interestMethod: 'Simple',
    completedPeriods: 1,
    interestAccrued: 900,
    totalLoanAmount: 6900,
    interestPaid: 900,
    principalRepaid: 6000,
    totalPaid: 6900,
    outstandingBalance: 0,
    status: 'Settled',
    settlementDateStr: '14/06/2026',
    settlementDateISO: '2026-06-14',
    durationMonths: 6,
    approvalRef: 'APR-L004-B',
    purpose: 'Personal / Business Development',
    remarks: 'Official Loan Record'
  },
  // 11. L1074 - Daniel Kamau Njiriri - 16/04/2026
  {
    id: 'L1074',
    issueDateStr: '16/04/2026',
    issueDateISO: '2026-04-16',
    memberName: 'Daniel Kamau Njiriri',
    memberId: 6,
    principal: 10000,
    monthlyInterestRate: 15,
    interestMethod: 'Simple',
    completedPeriods: null,
    interestAccrued: 1500,
    totalLoanAmount: 11500,
    interestPaid: 1500,
    principalRepaid: 10000,
    totalPaid: 11500,
    outstandingBalance: 0,
    status: 'Settled',
    settlementDateStr: '23/04/2026',
    settlementDateISO: '2026-04-23',
    durationMonths: 6,
    approvalRef: 'APR-L1074',
    purpose: 'Personal / Business Development',
    remarks: 'Official Loan Record'
  },
  // 12. L004 - Simon Memia Wanjiru - 14/02/2026
  {
    id: 'L004',
    issueDateStr: '14/02/2026',
    issueDateISO: '2026-02-14',
    memberName: 'Simon Memia Wanjiru',
    memberId: 1,
    principal: 6000,
    monthlyInterestRate: 15,
    interestMethod: 'Simple',
    completedPeriods: 1,
    interestAccrued: 900,
    totalLoanAmount: 6900,
    interestPaid: 900,
    principalRepaid: 6000,
    totalPaid: 6900,
    outstandingBalance: 0,
    status: 'Settled',
    settlementDateStr: '14/03/2026',
    settlementDateISO: '2026-03-14',
    durationMonths: 6,
    approvalRef: 'APR-L004',
    purpose: 'Personal / Business Development',
    remarks: 'Official Loan Record'
  },
  // 13. L002 - David Wainaina Kinyua - 14/02/2026
  {
    id: 'L002',
    issueDateStr: '14/02/2026',
    issueDateISO: '2026-02-14',
    memberName: 'David Wainaina Kinyua',
    memberId: 2,
    principal: 1500,
    monthlyInterestRate: 15,
    interestMethod: 'Simple',
    completedPeriods: 1,
    interestAccrued: 225,
    totalLoanAmount: 1725,
    interestPaid: 225,
    principalRepaid: 1500,
    totalPaid: 1725,
    outstandingBalance: 0,
    status: 'Settled',
    settlementDateStr: '14/03/2026',
    settlementDateISO: '2026-03-14',
    durationMonths: 6,
    approvalRef: 'APR-L002',
    purpose: 'Personal / Business Development',
    remarks: 'Official Loan Record'
  },
  // 14. L1075 - Simon Memia Wanjiru - 16/01/2026
  {
    id: 'L1075',
    issueDateStr: '16/01/2026',
    issueDateISO: '2026-01-16',
    memberName: 'Simon Memia Wanjiru',
    memberId: 1,
    principal: 6000,
    monthlyInterestRate: 15,
    interestMethod: 'Simple',
    completedPeriods: 1,
    interestAccrued: 900,
    totalLoanAmount: 6900,
    interestPaid: 900,
    principalRepaid: 6000,
    totalPaid: 6900,
    outstandingBalance: 0,
    status: 'Settled',
    settlementDateStr: '10/11/2026',
    settlementDateISO: '2026-11-10',
    durationMonths: 6,
    approvalRef: 'APR-L1075',
    purpose: 'Personal / Business Development',
    remarks: 'Official Loan Record'
  }
];

export function getOfficialLoan(loanId: string): OfficialLoanItem | undefined {
  const cleanId = String(loanId).trim();
  return OFFICIAL_LOAN_PORTFOLIO.find(
    l => l.id.toLowerCase() === cleanId.toLowerCase()
  );
}
