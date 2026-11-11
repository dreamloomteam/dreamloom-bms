// Authoritative initial data from DREAMLOOM_Financial_System_Upgraded.xlsx
export const initialMembers = [
  {
    "id": "MEM-001",
    "name": "Simon",
    "fullName": "Simon Memia Wanjiru",
    "nationalId": "32242103",
    "phone": "0719545283",
    "role": "Director / Member",
    "email": "simon@dreamloom.co.ke",
    "totalContribution": 65050,
    "activeLoans": 3300,
    "unsettledContributions": 13000,
    "netBalance": 61750,
    "shares": "13.80%",
    "status": "Active",
    "avatar": "/members/member-1.jpg",
    "color": "from-emerald-400 to-teal-400"
  },
  {
    "id": "MEM-002",
    "name": "David",
    "fullName": "David Wainaina Kinyua",
    "nationalId": "39929859",
    "phone": "0714382925",
    "role": "Member",
    "email": "david@dreamloom.co.ke",
    "totalContribution": 78050,
    "activeLoans": 9350,
    "unsettledContributions": 0,
    "netBalance": 68700,
    "shares": "16.56%",
    "status": "Active",
    "avatar": "/members/member-2.jpg",
    "color": "from-emerald-400 to-teal-400"
  },
  {
    "id": "MEM-003",
    "name": "Elijah",
    "fullName": "Elijah Waitara Gichari",
    "nationalId": "34282968",
    "phone": "0718963492",
    "role": "Member",
    "email": "elijah@dreamloom.co.ke",
    "totalContribution": 78050,
    "activeLoans": 0,
    "unsettledContributions": 13000,
    "netBalance": 78050,
    "shares": "16.56%",
    "status": "Active",
    "avatar": "/members/member-3.jpg",
    "color": "from-emerald-400 to-teal-400"
  },
  {
    "id": "MEM-004",
    "name": "Samuel",
    "fullName": "Samuel Kamau Nguuro",
    "nationalId": "40085139",
    "phone": "0113114471",
    "role": "Member",
    "email": "samuel@dreamloom.co.ke",
    "totalContribution": 69550,
    "activeLoans": 0,
    "unsettledContributions": 12000,
    "netBalance": 69550,
    "shares": "14.76%",
    "status": "Active",
    "avatar": "/members/member-4.jpg",
    "color": "from-emerald-400 to-teal-400"
  },
  {
    "id": "MEM-005",
    "name": "Michael",
    "fullName": "Michael Kiarie Wanjiru",
    "nationalId": "38927071",
    "phone": "0748036136",
    "role": "Treasurer",
    "email": "michael@dreamloom.co.ke",
    "totalContribution": 72050,
    "activeLoans": 0,
    "unsettledContributions": 6000,
    "netBalance": 72050,
    "shares": "15.29%",
    "status": "Active",
    "avatar": "/members/member-5.jpg",
    "color": "from-emerald-400 to-teal-400"
  },
  {
    "id": "MEM-006",
    "name": "Daniel",
    "fullName": "Daniel Kamau Njiriri",
    "nationalId": "36686858",
    "phone": "0759818731",
    "role": "Member",
    "email": "daniel@dreamloom.co.ke",
    "totalContribution": 64150,
    "activeLoans": 0,
    "unsettledContributions": 38000,
    "netBalance": 64150,
    "shares": "13.61%",
    "status": "Active",
    "avatar": "/members/member-6.jpg",
    "color": "from-emerald-400 to-teal-400"
  },
  {
    "id": "MEM-007",
    "name": "Beatrice",
    "fullName": "Beatrice Njoki Muthoni",
    "nationalId": "40492876",
    "phone": "0708665848",
    "role": "Member",
    "email": "beatrice@dreamloom.co.ke",
    "totalContribution": 45550,
    "activeLoans": 16500,
    "unsettledContributions": 19500,
    "netBalance": 29050,
    "shares": "9.67%",
    "status": "Active",
    "avatar": "/members/member-7.jpg",
    "color": "from-emerald-400 to-teal-400"
  }
];

import { OFFICIAL_LOAN_PORTFOLIO } from './officialLoanPortfolio';

export const initialLoans = OFFICIAL_LOAN_PORTFOLIO.map(l => ({
  id: l.id,
  issueDate: l.issueDateStr,
  issueDateISO: l.issueDateISO,
  borrower: l.memberName,
  memberName: l.memberName,
  memberId: l.memberId,
  principal: l.principal,
  interestRate: l.monthlyInterestRate,
  interestMethod: l.interestMethod,
  completedPeriods: l.completedPeriods,
  interest: l.interestAccrued,
  totalInterestAccrued: l.interestAccrued,
  totalLoan: l.totalLoanAmount,
  totalLoanAmount: l.totalLoanAmount,
  totalPayable: l.totalLoanAmount,
  interestPaid: l.interestPaid,
  principalRepaid: l.principalRepaid,
  principalPaid: l.principalRepaid,
  paid: l.totalPaid,
  paidAmount: l.totalPaid,
  totalAmountPaid: l.totalPaid,
  balance: l.outstandingBalance,
  totalOutstandingBalance: l.outstandingBalance,
  status: l.status,
  clearedDate: l.settlementDateStr || '-',
  settlementDate: l.settlementDateStr || '-',
  approvalRef: l.approvalRef,
  purpose: l.purpose,
  remarks: l.remarks
}));

export const initialContributions = [
  {
    "id": "CNT-001",
    "month": "Oct 2025",
    "member": "Simon Memia Wanjiru",
    "amount": 5025,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Simon Memia Wanjiru)"
  },
  {
    "id": "CNT-002",
    "month": "Oct 2025",
    "member": "David Wainaina Kinyua",
    "amount": 5025,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: David Wainaina Kinyua)"
  },
  {
    "id": "CNT-003",
    "month": "Oct 2025",
    "member": "Elijah Waitara Gichari",
    "amount": 5025,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Elijah Waitara Gichari)"
  },
  {
    "id": "CNT-004",
    "month": "Oct 2025",
    "member": "Samuel Kamau Nguuro",
    "amount": 5025,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Samuel Kamau Nguuro)"
  },
  {
    "id": "CNT-005",
    "month": "Oct 2025",
    "member": "Michael Kiarie Wanjiru",
    "amount": 5025,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Michael Kiarie Wanjiru)"
  },
  {
    "id": "CNT-006",
    "month": "Oct 2025",
    "member": "Daniel Kamau Njiriri",
    "amount": 5025,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Daniel Kamau Njiriri)"
  },
  {
    "id": "CNT-007",
    "month": "Oct 2025",
    "member": "Beatrice Njoki Muthoni",
    "amount": 5025,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Beatrice Njoki Muthoni)"
  },
  {
    "id": "CNT-008",
    "month": "Nov 2025",
    "member": "Simon Memia Wanjiru",
    "amount": 5025,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Simon Memia Wanjiru)"
  },
  {
    "id": "CNT-009",
    "month": "Nov 2025",
    "member": "David Wainaina Kinyua",
    "amount": 5025,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: David Wainaina Kinyua)"
  },
  {
    "id": "CNT-010",
    "month": "Nov 2025",
    "member": "Elijah Waitara Gichari",
    "amount": 5025,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Elijah Waitara Gichari)"
  },
  {
    "id": "CNT-011",
    "month": "Nov 2025",
    "member": "Samuel Kamau Nguuro",
    "amount": 5025,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Samuel Kamau Nguuro)"
  },
  {
    "id": "CNT-012",
    "month": "Nov 2025",
    "member": "Michael Kiarie Wanjiru",
    "amount": 5025,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Michael Kiarie Wanjiru)"
  },
  {
    "id": "CNT-013",
    "month": "Nov 2025",
    "member": "Daniel Kamau Njiriri",
    "amount": 5025,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Daniel Kamau Njiriri)"
  },
  {
    "id": "CNT-014",
    "month": "Nov 2025",
    "member": "Beatrice Njoki Muthoni",
    "amount": 5025,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Beatrice Njoki Muthoni)"
  },
  {
    "id": "PAY-015",
    "month": "Nov 2025",
    "member": "Mawega Payout 12th Nov",
    "amount": 0,
    "unsettled": 0,
    "payout": 50000,
    "notes": "Mawega Payout 12th Nov"
  },
  {
    "id": "CNT-016",
    "month": "Dec 2025",
    "member": "Simon Memia Wanjiru",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Simon Memia Wanjiru)"
  },
  {
    "id": "CNT-017",
    "month": "Dec 2025",
    "member": "David Wainaina Kinyua",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: David Wainaina Kinyua)"
  },
  {
    "id": "CNT-018",
    "month": "Dec 2025",
    "member": "Elijah Waitara Gichari",
    "amount": 6000,
    "unsettled": 6000,
    "payout": 0,
    "notes": "Late Payment & Penalty Levied (Member: Elijah Waitara Gichari)"
  },
  {
    "id": "CNT-019",
    "month": "Dec 2025",
    "member": "Samuel Kamau Nguuro",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Samuel Kamau Nguuro)"
  },
  {
    "id": "CNT-020",
    "month": "Dec 2025",
    "member": "Michael Kiarie Wanjiru",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Michael Kiarie Wanjiru)"
  },
  {
    "id": "CNT-021",
    "month": "Dec 2025",
    "member": "Daniel Kamau Njiriri",
    "amount": 6000,
    "unsettled": 6000,
    "payout": 0,
    "notes": "Late Payment & Penalty Levied (Member: Daniel Kamau Njiriri)"
  },
  {
    "id": "CNT-022",
    "month": "Dec 2025",
    "member": "Beatrice Njoki Muthoni",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Beatrice Njoki Muthoni)"
  },
  {
    "id": "PAY-023",
    "month": "Dec 2025",
    "member": "Mawega Payout 16th Dec",
    "amount": 0,
    "unsettled": 0,
    "payout": 35000,
    "notes": "Mawega Payout 16th Dec"
  },
  {
    "id": "CNT-024",
    "month": "Jan 2026",
    "member": "Simon Memia Wanjiru",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Simon Memia Wanjiru)"
  },
  {
    "id": "CNT-025",
    "month": "Jan 2026",
    "member": "David Wainaina Kinyua",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: David Wainaina Kinyua)"
  },
  {
    "id": "CNT-026",
    "month": "Jan 2026",
    "member": "Elijah Waitara Gichari",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Elijah Waitara Gichari)"
  },
  {
    "id": "CNT-027",
    "month": "Jan 2026",
    "member": "Samuel Kamau Nguuro",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Samuel Kamau Nguuro)"
  },
  {
    "id": "CNT-028",
    "month": "Jan 2026",
    "member": "Michael Kiarie Wanjiru",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Michael Kiarie Wanjiru)"
  },
  {
    "id": "CNT-029",
    "month": "Jan 2026",
    "member": "Daniel Kamau Njiriri",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Daniel Kamau Njiriri)"
  },
  {
    "id": "CNT-030",
    "month": "Jan 2026",
    "member": "Beatrice Njoki Muthoni",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Beatrice Njoki Muthoni)"
  },
  {
    "id": "PAY-031",
    "month": "Jan 2026",
    "member": "Mawega Payout 12th Jan",
    "amount": 0,
    "unsettled": 0,
    "payout": 35000,
    "notes": "Mawega Payout 12th Jan"
  },
  {
    "id": "CNT-032",
    "month": "Feb 2026",
    "member": "Simon Memia Wanjiru",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Simon Memia Wanjiru)"
  },
  {
    "id": "CNT-033",
    "month": "Feb 2026",
    "member": "David Wainaina Kinyua",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: David Wainaina Kinyua)"
  },
  {
    "id": "CNT-034",
    "month": "Feb 2026",
    "member": "Elijah Waitara Gichari",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Elijah Waitara Gichari)"
  },
  {
    "id": "CNT-035",
    "month": "Feb 2026",
    "member": "Samuel Kamau Nguuro",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Samuel Kamau Nguuro)"
  },
  {
    "id": "CNT-036",
    "month": "Feb 2026",
    "member": "Michael Kiarie Wanjiru",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Michael Kiarie Wanjiru)"
  },
  {
    "id": "CNT-037",
    "month": "Feb 2026",
    "member": "Daniel Kamau Njiriri",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Daniel Kamau Njiriri)"
  },
  {
    "id": "CNT-038",
    "month": "Feb 2026",
    "member": "Beatrice Njoki Muthoni",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Beatrice Njoki Muthoni)"
  },
  {
    "id": "PAY-039",
    "month": "Feb 2026",
    "member": "Mawega Payout 19th Feb",
    "amount": 0,
    "unsettled": 0,
    "payout": 39000,
    "notes": "Mawega Payout 19th Feb"
  },
  {
    "id": "CNT-040",
    "month": "Mar 2026",
    "member": "Simon Memia Wanjiru",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Simon Memia Wanjiru)"
  },
  {
    "id": "CNT-041",
    "month": "Mar 2026",
    "member": "David Wainaina Kinyua",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: David Wainaina Kinyua)"
  },
  {
    "id": "CNT-042",
    "month": "Mar 2026",
    "member": "Elijah Waitara Gichari",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Elijah Waitara Gichari)"
  },
  {
    "id": "CNT-043",
    "month": "Mar 2026",
    "member": "Samuel Kamau Nguuro",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Samuel Kamau Nguuro)"
  },
  {
    "id": "CNT-044",
    "month": "Mar 2026",
    "member": "Michael Kiarie Wanjiru",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Michael Kiarie Wanjiru)"
  },
  {
    "id": "CNT-045",
    "month": "Mar 2026",
    "member": "Daniel Kamau Njiriri",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Daniel Kamau Njiriri)"
  },
  {
    "id": "CNT-046",
    "month": "Mar 2026",
    "member": "Beatrice Njoki Muthoni",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Beatrice Njoki Muthoni)"
  },
  {
    "id": "PAY-047",
    "month": "Mar 2026",
    "member": "Mawega Payout 4th April",
    "amount": 0,
    "unsettled": 0,
    "payout": 35000,
    "notes": "Mawega Payout 4th April"
  },
  {
    "id": "CNT-048",
    "month": "Apr 2026",
    "member": "Simon Memia Wanjiru",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Simon Memia Wanjiru)"
  },
  {
    "id": "CNT-049",
    "month": "Apr 2026",
    "member": "David Wainaina Kinyua",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: David Wainaina Kinyua)"
  },
  {
    "id": "CNT-050",
    "month": "Apr 2026",
    "member": "Elijah Waitara Gichari",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Elijah Waitara Gichari)"
  },
  {
    "id": "CNT-051",
    "month": "Apr 2026",
    "member": "Samuel Kamau Nguuro",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Samuel Kamau Nguuro)"
  },
  {
    "id": "CNT-052",
    "month": "Apr 2026",
    "member": "Michael Kiarie Wanjiru",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Michael Kiarie Wanjiru)"
  },
  {
    "id": "CNT-053",
    "month": "Apr 2026",
    "member": "Daniel Kamau Njiriri",
    "amount": 6000,
    "unsettled": 6000,
    "payout": 0,
    "notes": "Late Payment & Penalty Levied (Member: Daniel Kamau Njiriri)"
  },
  {
    "id": "CNT-054",
    "month": "Apr 2026",
    "member": "Beatrice Njoki Muthoni",
    "amount": 6000,
    "unsettled": 6000,
    "payout": 0,
    "notes": "Late Payment & Penalty Levied (Member: Beatrice Njoki Muthoni)"
  },
  {
    "id": "PAY-055",
    "month": "Apr 2026",
    "member": "Mawega Payout Apr-26",
    "amount": 0,
    "unsettled": 0,
    "payout": 35000,
    "notes": "Mawega Payout Apr-26"
  },
  {
    "id": "CNT-056",
    "month": "May 2026",
    "member": "Simon Memia Wanjiru",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Simon Memia Wanjiru)"
  },
  {
    "id": "CNT-057",
    "month": "May 2026",
    "member": "David Wainaina Kinyua",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: David Wainaina Kinyua)"
  },
  {
    "id": "CNT-058",
    "month": "May 2026",
    "member": "Elijah Waitara Gichari",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Elijah Waitara Gichari)"
  },
  {
    "id": "CNT-059",
    "month": "May 2026",
    "member": "Samuel Kamau Nguuro",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Samuel Kamau Nguuro)"
  },
  {
    "id": "CNT-060",
    "month": "May 2026",
    "member": "Michael Kiarie Wanjiru",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Michael Kiarie Wanjiru)"
  },
  {
    "id": "CNT-061",
    "month": "May 2026",
    "member": "Daniel Kamau Njiriri",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Daniel Kamau Njiriri)"
  },
  {
    "id": "CNT-062",
    "month": "May 2026",
    "member": "Beatrice Njoki Muthoni",
    "amount": 5500,
    "unsettled": 500,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Beatrice Njoki Muthoni)"
  },
  {
    "id": "PAY-063",
    "month": "May 2026",
    "member": "Mawega Payout 15th May",
    "amount": 0,
    "unsettled": 0,
    "payout": 35000,
    "notes": "Mawega Payout 15th May"
  },
  {
    "id": "CNT-064",
    "month": "Jun 2026",
    "member": "Simon Memia Wanjiru",
    "amount": 7000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Simon Memia Wanjiru)"
  },
  {
    "id": "CNT-065",
    "month": "Jun 2026",
    "member": "David Wainaina Kinyua",
    "amount": 7000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: David Wainaina Kinyua)"
  },
  {
    "id": "CNT-066",
    "month": "Jun 2026",
    "member": "Elijah Waitara Gichari",
    "amount": 7000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Elijah Waitara Gichari)"
  },
  {
    "id": "CNT-067",
    "month": "Jun 2026",
    "member": "Samuel Kamau Nguuro",
    "amount": 7000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Samuel Kamau Nguuro)"
  },
  {
    "id": "CNT-068",
    "month": "Jun 2026",
    "member": "Michael Kiarie Wanjiru",
    "amount": 7000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Michael Kiarie Wanjiru)"
  },
  {
    "id": "CNT-069",
    "month": "Jun 2026",
    "member": "Daniel Kamau Njiriri",
    "amount": 7000,
    "unsettled": 7000,
    "payout": 0,
    "notes": "Late Payment & Penalty Levied (Member: Daniel Kamau Njiriri)"
  },
  {
    "id": "CNT-070",
    "month": "Jun 2026",
    "member": "Beatrice Njoki Muthoni",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Beatrice Njoki Muthoni)"
  },
  {
    "id": "PAY-071",
    "month": "Jun 2026",
    "member": "Mawega Payout Jun-26",
    "amount": 0,
    "unsettled": 0,
    "payout": 36000,
    "notes": "Mawega Payout Jun-26"
  },
  {
    "id": "CNT-072",
    "month": "Jul 2026",
    "member": "Simon Memia Wanjiru",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Simon Memia Wanjiru)"
  },
  {
    "id": "CNT-073",
    "month": "Jul 2026",
    "member": "David Wainaina Kinyua",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: David Wainaina Kinyua)"
  },
  {
    "id": "CNT-074",
    "month": "Jul 2026",
    "member": "Elijah Waitara Gichari",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Elijah Waitara Gichari)"
  },
  {
    "id": "CNT-075",
    "month": "Jul 2026",
    "member": "Samuel Kamau Nguuro",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Samuel Kamau Nguuro)"
  },
  {
    "id": "CNT-076",
    "month": "Jul 2026",
    "member": "Michael Kiarie Wanjiru",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Michael Kiarie Wanjiru)"
  },
  {
    "id": "CNT-077",
    "month": "Jul 2026",
    "member": "Daniel Kamau Njiriri",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Daniel Kamau Njiriri)"
  },
  {
    "id": "CNT-078",
    "month": "Jul 2026",
    "member": "Beatrice Njoki Muthoni",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Beatrice Njoki Muthoni)"
  },
  {
    "id": "PAY-079",
    "month": "Jul 2026",
    "member": "Mawega Payout Jul-26",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Mawega Payout Jul-26"
  },
  {
    "id": "CNT-080",
    "month": "Aug 2026",
    "member": "Simon Memia Wanjiru",
    "amount": 0,
    "unsettled": 6000,
    "payout": 0,
    "notes": "Late Payment & Penalty Levied (Member: Simon Memia Wanjiru)"
  },
  {
    "id": "CNT-081",
    "month": "Aug 2026",
    "member": "David Wainaina Kinyua",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: David Wainaina Kinyua)"
  },
  {
    "id": "CNT-082",
    "month": "Aug 2026",
    "member": "Elijah Waitara Gichari",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Elijah Waitara Gichari)"
  },
  {
    "id": "CNT-083",
    "month": "Aug 2026",
    "member": "Samuel Kamau Nguuro",
    "amount": 3500,
    "unsettled": 6000,
    "payout": 0,
    "notes": "Late Payment & Penalty Levied (Member: Samuel Kamau Nguuro)"
  },
  {
    "id": "CNT-084",
    "month": "Aug 2026",
    "member": "Michael Kiarie Wanjiru",
    "amount": 0,
    "unsettled": 6000,
    "payout": 0,
    "notes": "Late Payment & Penalty Levied (Member: Michael Kiarie Wanjiru)"
  },
  {
    "id": "CNT-085",
    "month": "Aug 2026",
    "member": "Daniel Kamau Njiriri",
    "amount": 0,
    "unsettled": 6000,
    "payout": 0,
    "notes": "Late Payment & Penalty Levied (Member: Daniel Kamau Njiriri)"
  },
  {
    "id": "CNT-086",
    "month": "Aug 2026",
    "member": "Beatrice Njoki Muthoni",
    "amount": 0,
    "unsettled": 6000,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Beatrice Njoki Muthoni)"
  },
  {
    "id": "PAY-087",
    "month": "Aug 2026",
    "member": "Mawega Payout Aug-26",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Mawega Payout Aug-26"
  },
  {
    "id": "CNT-088",
    "month": "Sep 2026",
    "member": "Simon Memia Wanjiru",
    "amount": 0,
    "unsettled": 7000,
    "payout": 0,
    "notes": "Late Payment & Penalty Levied (Member: Simon Memia Wanjiru)"
  },
  {
    "id": "CNT-089",
    "month": "Sep 2026",
    "member": "David Wainaina Kinyua",
    "amount": 7000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: David Wainaina Kinyua)"
  },
  {
    "id": "CNT-090",
    "month": "Sep 2026",
    "member": "Elijah Waitara Gichari",
    "amount": 7000,
    "unsettled": 7000,
    "payout": 0,
    "notes": "Late Payment & Penalty Levied (Member: Elijah Waitara Gichari)"
  },
  {
    "id": "CNT-091",
    "month": "Sep 2026",
    "member": "Samuel Kamau Nguuro",
    "amount": 7000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Samuel Kamau Nguuro)"
  },
  {
    "id": "CNT-092",
    "month": "Sep 2026",
    "member": "Michael Kiarie Wanjiru",
    "amount": 7000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Michael Kiarie Wanjiru)"
  },
  {
    "id": "CNT-093",
    "month": "Sep 2026",
    "member": "Daniel Kamau Njiriri",
    "amount": 0,
    "unsettled": 7000,
    "payout": 0,
    "notes": "Late Payment & Penalty Levied (Member: Daniel Kamau Njiriri)"
  },
  {
    "id": "CNT-094",
    "month": "Sep 2026",
    "member": "Beatrice Njoki Muthoni",
    "amount": 0,
    "unsettled": 7000,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Beatrice Njoki Muthoni)"
  },
  {
    "id": "PAY-095",
    "month": "Sep 2026",
    "member": "Mawega Payout Sep-26",
    "amount": 0,
    "unsettled": 0,
    "payout": 40000,
    "notes": "Mawega Payout Sep-26"
  },
  {
    "id": "CNT-096",
    "month": "Oct 2026",
    "member": "Simon Memia Wanjiru",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Simon Memia Wanjiru)"
  },
  {
    "id": "CNT-097",
    "month": "Oct 2026",
    "member": "David Wainaina Kinyua",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: David Wainaina Kinyua)"
  },
  {
    "id": "CNT-098",
    "month": "Oct 2026",
    "member": "Elijah Waitara Gichari",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Elijah Waitara Gichari)"
  },
  {
    "id": "CNT-099",
    "month": "Oct 2026",
    "member": "Samuel Kamau Nguuro",
    "amount": 0,
    "unsettled": 6000,
    "payout": 0,
    "notes": "Late Payment & Penalty Levied (Member: Samuel Kamau Nguuro)"
  },
  {
    "id": "CNT-100",
    "month": "Oct 2026",
    "member": "Michael Kiarie Wanjiru",
    "amount": 6000,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Michael Kiarie Wanjiru)"
  },
  {
    "id": "CNT-101",
    "month": "Oct 2026",
    "member": "Daniel Kamau Njiriri",
    "amount": 5100,
    "unsettled": 6000,
    "payout": 0,
    "notes": "Late Payment & Penalty Levied (Member: Daniel Kamau Njiriri)"
  },
  {
    "id": "CNT-102",
    "month": "Oct 2026",
    "member": "Beatrice Njoki Muthoni",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Monthly Contribution (Member: Beatrice Njoki Muthoni)"
  },
  {
    "id": "CNT-103",
    "month": "Nov 2026",
    "member": "Simon Memia Wanjiru",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Simon Memia Wanjiru)"
  },
  {
    "id": "CNT-104",
    "month": "Nov 2026",
    "member": "David Wainaina Kinyua",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: David Wainaina Kinyua)"
  },
  {
    "id": "CNT-105",
    "month": "Nov 2026",
    "member": "Elijah Waitara Gichari",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Elijah Waitara Gichari)"
  },
  {
    "id": "CNT-106",
    "month": "Nov 2026",
    "member": "Samuel Kamau Nguuro",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Samuel Kamau Nguuro)"
  },
  {
    "id": "CNT-107",
    "month": "Nov 2026",
    "member": "Michael Kiarie Wanjiru",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Michael Kiarie Wanjiru)"
  },
  {
    "id": "CNT-108",
    "month": "Nov 2026",
    "member": "Daniel Kamau Njiriri",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Daniel Kamau Njiriri)"
  },
  {
    "id": "CNT-109",
    "month": "Nov 2026",
    "member": "Beatrice Njoki Muthoni",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Beatrice Njoki Muthoni)"
  },
  {
    "id": "CNT-110",
    "month": "Dec 2026",
    "member": "Simon Memia Wanjiru",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Simon Memia Wanjiru)"
  },
  {
    "id": "CNT-111",
    "month": "Dec 2026",
    "member": "David Wainaina Kinyua",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: David Wainaina Kinyua)"
  },
  {
    "id": "CNT-112",
    "month": "Dec 2026",
    "member": "Elijah Waitara Gichari",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Elijah Waitara Gichari)"
  },
  {
    "id": "CNT-113",
    "month": "Dec 2026",
    "member": "Samuel Kamau Nguuro",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Samuel Kamau Nguuro)"
  },
  {
    "id": "CNT-114",
    "month": "Dec 2026",
    "member": "Michael Kiarie Wanjiru",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Michael Kiarie Wanjiru)"
  },
  {
    "id": "CNT-115",
    "month": "Dec 2026",
    "member": "Daniel Kamau Njiriri",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Daniel Kamau Njiriri)"
  },
  {
    "id": "CNT-116",
    "month": "Dec 2026",
    "member": "Beatrice Njoki Muthoni",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Beatrice Njoki Muthoni)"
  },
  {
    "id": "CNT-117",
    "month": "Jan 2027",
    "member": "Simon Memia Wanjiru",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Simon Memia Wanjiru)"
  },
  {
    "id": "CNT-118",
    "month": "Jan 2027",
    "member": "David Wainaina Kinyua",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: David Wainaina Kinyua)"
  },
  {
    "id": "CNT-119",
    "month": "Jan 2027",
    "member": "Elijah Waitara Gichari",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Elijah Waitara Gichari)"
  },
  {
    "id": "CNT-120",
    "month": "Jan 2027",
    "member": "Samuel Kamau Nguuro",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Samuel Kamau Nguuro)"
  },
  {
    "id": "CNT-121",
    "month": "Jan 2027",
    "member": "Michael Kiarie Wanjiru",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Michael Kiarie Wanjiru)"
  },
  {
    "id": "CNT-122",
    "month": "Jan 2027",
    "member": "Daniel Kamau Njiriri",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Daniel Kamau Njiriri)"
  },
  {
    "id": "CNT-123",
    "month": "Jan 2027",
    "member": "Beatrice Njoki Muthoni",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Beatrice Njoki Muthoni)"
  },
  {
    "id": "CNT-124",
    "month": "Feb 2027",
    "member": "Simon Memia Wanjiru",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Simon Memia Wanjiru)"
  },
  {
    "id": "CNT-125",
    "month": "Feb 2027",
    "member": "David Wainaina Kinyua",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: David Wainaina Kinyua)"
  },
  {
    "id": "CNT-126",
    "month": "Feb 2027",
    "member": "Elijah Waitara Gichari",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Elijah Waitara Gichari)"
  },
  {
    "id": "CNT-127",
    "month": "Feb 2027",
    "member": "Samuel Kamau Nguuro",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Samuel Kamau Nguuro)"
  },
  {
    "id": "CNT-128",
    "month": "Feb 2027",
    "member": "Michael Kiarie Wanjiru",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Michael Kiarie Wanjiru)"
  },
  {
    "id": "CNT-129",
    "month": "Feb 2027",
    "member": "Daniel Kamau Njiriri",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Daniel Kamau Njiriri)"
  },
  {
    "id": "CNT-130",
    "month": "Feb 2027",
    "member": "Beatrice Njoki Muthoni",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Beatrice Njoki Muthoni)"
  },
  {
    "id": "CNT-131",
    "month": "Mar 2027",
    "member": "Simon Memia Wanjiru",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Simon Memia Wanjiru)"
  },
  {
    "id": "CNT-132",
    "month": "Mar 2027",
    "member": "David Wainaina Kinyua",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: David Wainaina Kinyua)"
  },
  {
    "id": "CNT-133",
    "month": "Mar 2027",
    "member": "Elijah Waitara Gichari",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Elijah Waitara Gichari)"
  },
  {
    "id": "CNT-134",
    "month": "Mar 2027",
    "member": "Samuel Kamau Nguuro",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Samuel Kamau Nguuro)"
  },
  {
    "id": "CNT-135",
    "month": "Mar 2027",
    "member": "Michael Kiarie Wanjiru",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Michael Kiarie Wanjiru)"
  },
  {
    "id": "CNT-136",
    "month": "Mar 2027",
    "member": "Daniel Kamau Njiriri",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Daniel Kamau Njiriri)"
  },
  {
    "id": "CNT-137",
    "month": "Mar 2027",
    "member": "Beatrice Njoki Muthoni",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Beatrice Njoki Muthoni)"
  },
  {
    "id": "CNT-138",
    "month": "Apr 2027",
    "member": "Simon Memia Wanjiru",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Simon Memia Wanjiru)"
  },
  {
    "id": "CNT-139",
    "month": "Apr 2027",
    "member": "David Wainaina Kinyua",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: David Wainaina Kinyua)"
  },
  {
    "id": "CNT-140",
    "month": "Apr 2027",
    "member": "Elijah Waitara Gichari",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Elijah Waitara Gichari)"
  },
  {
    "id": "CNT-141",
    "month": "Apr 2027",
    "member": "Samuel Kamau Nguuro",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Samuel Kamau Nguuro)"
  },
  {
    "id": "CNT-142",
    "month": "Apr 2027",
    "member": "Michael Kiarie Wanjiru",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Michael Kiarie Wanjiru)"
  },
  {
    "id": "CNT-143",
    "month": "Apr 2027",
    "member": "Daniel Kamau Njiriri",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Daniel Kamau Njiriri)"
  },
  {
    "id": "CNT-144",
    "month": "Apr 2027",
    "member": "Beatrice Njoki Muthoni",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Beatrice Njoki Muthoni)"
  },
  {
    "id": "CNT-145",
    "month": "May 2027",
    "member": "Simon Memia Wanjiru",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Simon Memia Wanjiru)"
  },
  {
    "id": "CNT-146",
    "month": "May 2027",
    "member": "David Wainaina Kinyua",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: David Wainaina Kinyua)"
  },
  {
    "id": "CNT-147",
    "month": "May 2027",
    "member": "Elijah Waitara Gichari",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Elijah Waitara Gichari)"
  },
  {
    "id": "CNT-148",
    "month": "May 2027",
    "member": "Samuel Kamau Nguuro",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Samuel Kamau Nguuro)"
  },
  {
    "id": "CNT-149",
    "month": "May 2027",
    "member": "Michael Kiarie Wanjiru",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Michael Kiarie Wanjiru)"
  },
  {
    "id": "CNT-150",
    "month": "May 2027",
    "member": "Daniel Kamau Njiriri",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Daniel Kamau Njiriri)"
  },
  {
    "id": "CNT-151",
    "month": "May 2027",
    "member": "Beatrice Njoki Muthoni",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Beatrice Njoki Muthoni)"
  },
  {
    "id": "CNT-152",
    "month": "Jun 2027",
    "member": "Simon Memia Wanjiru",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Simon Memia Wanjiru)"
  },
  {
    "id": "CNT-153",
    "month": "Jun 2027",
    "member": "David Wainaina Kinyua",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: David Wainaina Kinyua)"
  },
  {
    "id": "CNT-154",
    "month": "Jun 2027",
    "member": "Elijah Waitara Gichari",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Elijah Waitara Gichari)"
  },
  {
    "id": "CNT-155",
    "month": "Jun 2027",
    "member": "Samuel Kamau Nguuro",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Samuel Kamau Nguuro)"
  },
  {
    "id": "CNT-156",
    "month": "Jun 2027",
    "member": "Michael Kiarie Wanjiru",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Michael Kiarie Wanjiru)"
  },
  {
    "id": "CNT-157",
    "month": "Jun 2027",
    "member": "Daniel Kamau Njiriri",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Daniel Kamau Njiriri)"
  },
  {
    "id": "CNT-158",
    "month": "Jun 2027",
    "member": "Beatrice Njoki Muthoni",
    "amount": 0,
    "unsettled": 0,
    "payout": 0,
    "notes": "Pending (Member: Beatrice Njoki Muthoni)"
  }
];

export const initialExpenses = [
  {
    "id": "EXP-01",
    "dbId": 35,
    "date": "12-Dec-25",
    "description": "Paid to Mawega",
    "amount": 50000,
    "category": "Land Purchase",
    "paidTo": "Land Payment Disbursement"
  },
  {
    "id": "EXP-02",
    "dbId": 36,
    "date": "16-Dec-25",
    "description": "Paid to Mawega",
    "amount": 35000,
    "category": "Land Purchase",
    "paidTo": "Land Payment Disbursement"
  },
  {
    "id": "EXP-03",
    "dbId": 37,
    "date": "12-Jan-26",
    "description": "Paid to Mawega",
    "amount": 35000,
    "category": "Land Purchase",
    "paidTo": "Land Payment Disbursement"
  },
  {
    "id": "EXP-04",
    "dbId": 38,
    "date": "19-Feb-26",
    "description": "Paid to Mawega",
    "amount": 39000,
    "category": "Land Purchase",
    "paidTo": "Land Payment Disbursement"
  },
  {
    "id": "EXP-05",
    "dbId": 39,
    "date": "01-Mar-26",
    "description": "Paid to Mawega",
    "amount": 35000,
    "category": "Land Purchase",
    "paidTo": "Land Payment Disbursement"
  },
  {
    "id": "EXP-06",
    "dbId": 40,
    "date": "01-Apr-26",
    "description": "Paid to Mawega",
    "amount": 35000,
    "category": "Land Purchase",
    "paidTo": "Land Payment Disbursement"
  },
  {
    "id": "EXP-07",
    "dbId": 41,
    "date": "01-May-26",
    "description": "Paid to Mawega",
    "amount": 35000,
    "category": "Land Purchase",
    "paidTo": "Land Payment Disbursement"
  },
  {
    "id": "EXP-08",
    "dbId": 42,
    "date": "01-Jun-26",
    "description": "Paid to Mawega",
    "amount": 36000,
    "category": "Land Purchase",
    "paidTo": "Land Payment Disbursement"
  },
  {
    "id": "EXP-09",
    "dbId": 43,
    "date": "25-Feb-26",
    "description": "Bank Deposits for Account Opening",
    "amount": 600,
    "category": "Bank Operations",
    "paidTo": "Initial Deposit Equity Bank"
  },
  {
    "id": "EXP-10",
    "dbId": 44,
    "date": "14-Jan-26",
    "description": "Company stamp",
    "amount": 1518,
    "category": "Administration",
    "paidTo": "Official Rubber Stamp"
  },
  {
    "id": "EXP-11",
    "dbId": 45,
    "date": "14-Feb-26",
    "description": "Printing Company Documents (Qatar) + ksh300 transaction",
    "amount": 2400,
    "category": "Administration",
    "paidTo": "Doc Printing & Transfer Fees"
  },
  {
    "id": "EXP-12",
    "dbId": 46,
    "date": "Up to Feb 20",
    "description": "Transaction Fee 2025 (ksh350) 2026 (ksh120)",
    "amount": 470,
    "category": "Bank Charges",
    "paidTo": "Bank Transaction Fees"
  },
  {
    "id": "EXP-13",
    "dbId": 47,
    "date": "17-Dec-25",
    "description": "Company Registration",
    "amount": 15000,
    "category": "Legal & Compliance",
    "paidTo": "CR12 & Registration Fees"
  },
  {
    "id": "EXP-14",
    "dbId": 48,
    "date": "23-Jan-26",
    "description": "Facilitation for Site Visit [Elijah & Daniel]",
    "amount": 3000,
    "category": "Field Operations",
    "paidTo": "Land Site Inspection Allowance"
  },
  {
    "id": "EXP-15",
    "dbId": 49,
    "date": "31-Jan-26",
    "description": "Facilitation to Mawega Office & Bank Opening Doc",
    "amount": 1500,
    "category": "Field Operations",
    "paidTo": "Transport & Admin Facilitation"
  },
  {
    "id": "EXP-16",
    "dbId": 50,
    "date": "31-Jan-26",
    "description": "Recent Transaction Fee",
    "amount": 96.78,
    "category": "Bank Charges",
    "paidTo": "M-PESA / Bank Charges"
  },
  {
    "id": "EXP-17",
    "dbId": 51,
    "date": "15th May 2026",
    "description": "Welfare to Beatrice",
    "amount": 6000,
    "category": "Welfare Payout",
    "paidTo": "Member Welfare Grant"
  },
  {
    "id": "EXP-18",
    "dbId": 52,
    "date": "15th May 2026",
    "description": "Transaction Fee",
    "amount": 201.28,
    "category": "Bank Charges",
    "paidTo": "M-PESA / Bank Charges"
  },
  {
    "id": "EXP-19",
    "dbId": 53,
    "date": "25th June 2026",
    "description": "Filing tax return + transaction Fee",
    "amount": 514,
    "category": "Legal & Compliance",
    "paidTo": "KRA Annual Tax Filing"
  },
  {
    "id": "EXP-20",
    "dbId": 54,
    "date": "5th July 2026",
    "description": "Transaction Fee",
    "amount": 78.68,
    "category": "Bank Charges",
    "paidTo": "M-PESA / Bank Charges"
  },
  {
    "id": "EXP-21",
    "dbId": 55,
    "date": "22nd August 2026",
    "description": "Transaction Fee",
    "amount": 51.51,
    "category": "Bank Charges",
    "paidTo": "M-PESA / Bank Charges"
  },
  {
    "id": "EXP-22",
    "dbId": 56,
    "date": "25th August 2026",
    "description": "Transaction sms fee",
    "amount": 65.01,
    "category": "Bank Charges",
    "paidTo": "M-PESA / Bank Charges"
  },
  {
    "id": "EXP-23",
    "dbId": 57,
    "date": "25th August 2026",
    "description": "Welfare to Simon",
    "amount": 6000,
    "category": "Welfare Payout",
    "paidTo": "Member Welfare Grant"
  },
  {
    "id": "EXP-24",
    "dbId": 58,
    "date": "24th sept 2026",
    "description": "Title processing fee",
    "amount": 40000,
    "category": "Land Purchase",
    "paidTo": "Land Payment Disbursement"
  },
  {
    "id": "EXP-25",
    "dbId": 59,
    "date": "24th sept 2026",
    "description": "Transaction Fee",
    "amount": 59.76,
    "category": "Bank Charges",
    "paidTo": "M-PESA / Bank Charges"
  },
  {
    "id": "EXP-26",
    "dbId": 60,
    "date": "26th Sept 2026",
    "description": "Facilitation to Mawega Office for titles works[Elijah]",
    "amount": 1500,
    "category": "Field Operations",
    "paidTo": "Transport & Admin Facilitation"
  },
  {
    "id": "EXP-27",
    "dbId": 61,
    "date": "26th Sept 2026",
    "description": "Facilitation to Mawega Office for titles works[Daniel]",
    "amount": 1500,
    "category": "Field Operations",
    "paidTo": "Transport & Admin Facilitation"
  },
  {
    "id": "EXP-28",
    "dbId": 62,
    "date": "26th Sept 2026",
    "description": "Transaction Fee",
    "amount": 219.09,
    "category": "Bank Charges",
    "paidTo": "M-PESA / Bank Charges"
  },
  {
    "id": "EXP-29",
    "dbId": 63,
    "date": "26th Sept 2026",
    "description": "Transaction Fee",
    "amount": 51.51,
    "category": "Bank Charges",
    "paidTo": "M-PESA / Bank Charges"
  },
  {
    "id": "EXP-30",
    "dbId": 64,
    "date": "26th Sept 2026",
    "description": "Transaction Fee",
    "amount": 600,
    "category": "Bank Charges",
    "paidTo": "M-PESA / Bank Charges"
  },
  {
    "id": "EXP-31",
    "dbId": 65,
    "date": "26th Sept 2026",
    "description": "Transaction Fee",
    "amount": 59.76,
    "category": "Bank Charges",
    "paidTo": "M-PESA / Bank Charges"
  },
  {
    "id": "EXP-32",
    "dbId": 66,
    "date": "26th Sept 2026",
    "description": "Transaction Fee",
    "amount": 59.76,
    "category": "Bank Charges",
    "paidTo": "M-PESA / Bank Charges"
  },
  {
    "id": "EXP-33",
    "dbId": 67,
    "date": "26th Sept 2026",
    "description": "Transaction Fee",
    "amount": 76.51,
    "category": "Bank Charges",
    "paidTo": "M-PESA / Bank Charges"
  },
  {
    "id": "EXP-34",
    "dbId": 68,
    "date": "26th Sept 2026",
    "description": "Transaction Fee",
    "amount": 59.76,
    "category": "Bank Charges",
    "paidTo": "M-PESA / Bank Charges"
  },
  {
    "id": "EXP-35",
    "dbId": 69,
    "date": "26th Sept 2026",
    "description": "Transaction Fee",
    "amount": 65.01,
    "category": "Bank Charges",
    "paidTo": "M-PESA / Bank Charges"
  }
];

export const initialFines = [
  {
    "id": "FN-01",
    "dbId": 15,
    "member": "Elijah Waitara Gichari",
    "date": "2025-12-16",
    "totalWithContrib": 6500,
    "amount": 500,
    "reason": "Late payment + penalty",
    "status": "Paid",
    "datePaid": "2026-11-02"
  },
  {
    "id": "FN-02",
    "dbId": 16,
    "member": "Daniel Kamau Njiriri",
    "date": "2025-12-16",
    "totalWithContrib": 6500,
    "amount": 500,
    "reason": "Late payment + penalty",
    "status": "Paid",
    "datePaid": "-"
  },
  {
    "id": "FN-03",
    "dbId": 17,
    "member": "Daniel Kamau Njiriri",
    "date": "2026-04-16",
    "totalWithContrib": 6500,
    "amount": 500,
    "reason": "Late payment + penalty",
    "status": "Paid",
    "datePaid": "2026-11-02"
  },
  {
    "id": "FN-04",
    "dbId": 18,
    "member": "Beatrice Njoki Muthoni",
    "date": "2026-04-16",
    "totalWithContrib": 6500,
    "amount": 500,
    "reason": "Late payment + penalty",
    "status": "Paid",
    "datePaid": "2026-11-02"
  },
  {
    "id": "FN-05",
    "dbId": 19,
    "member": "Daniel Kamau Njiriri",
    "date": "2026-06-16",
    "totalWithContrib": 7500,
    "amount": 500,
    "reason": "Late payment + penalty",
    "status": "Paid",
    "datePaid": "2026-11-02"
  },
  {
    "id": "FN-06",
    "dbId": 20,
    "member": "Simon Memia Wanjiru",
    "date": "2026-08-16",
    "totalWithContrib": 6500,
    "amount": 500,
    "reason": "Late payment + penalty",
    "status": "Paid",
    "datePaid": "2026-11-02"
  },
  {
    "id": "FN-07",
    "dbId": 21,
    "member": "Samuel Kamau Nguuro",
    "date": "2026-08-16",
    "totalWithContrib": 6500,
    "amount": 500,
    "reason": "Late payment + penalty",
    "status": "Active",
    "datePaid": "-"
  },
  {
    "id": "FN-08",
    "dbId": 22,
    "member": "Michael Kiarie Wanjiru",
    "date": "2026-08-16",
    "totalWithContrib": 6500,
    "amount": 500,
    "reason": "Late payment + penalty",
    "status": "Active",
    "datePaid": "-"
  },
  {
    "id": "FN-09",
    "dbId": 23,
    "member": "Daniel Kamau Njiriri",
    "date": "2026-08-16",
    "totalWithContrib": 6500,
    "amount": 500,
    "reason": "Late payment + penalty",
    "status": "Active",
    "datePaid": "-"
  },
  {
    "id": "FN-10",
    "dbId": 24,
    "member": "Simon Memia Wanjiru",
    "date": "2026-09-16",
    "totalWithContrib": 7500,
    "amount": 500,
    "reason": "Late payment + penalty",
    "status": "Active",
    "datePaid": "-"
  },
  {
    "id": "FN-11",
    "dbId": 25,
    "member": "Elijah Waitara Gichari",
    "date": "2026-09-16",
    "totalWithContrib": 7500,
    "amount": 500,
    "reason": "Late payment + penalty",
    "status": "Active",
    "datePaid": "-"
  },
  {
    "id": "FN-12",
    "dbId": 26,
    "member": "Daniel Kamau Njiriri",
    "date": "2026-09-16",
    "totalWithContrib": 7500,
    "amount": 500,
    "reason": "Late payment + penalty",
    "status": "Active",
    "datePaid": "-"
  },
  {
    "id": "FN-13",
    "dbId": 27,
    "member": "Samuel Kamau Nguuro",
    "date": "2026-10-16",
    "totalWithContrib": 6500,
    "amount": 500,
    "reason": "Late payment + penalty",
    "status": "Active",
    "datePaid": "-"
  },
  {
    "id": "FN-14",
    "dbId": 28,
    "member": "Daniel Kamau Njiriri",
    "date": "2026-10-16",
    "totalWithContrib": 6500,
    "amount": 500,
    "reason": "Late payment + penalty",
    "status": "Active",
    "datePaid": "-"
  }
];
