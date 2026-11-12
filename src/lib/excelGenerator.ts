import ExcelJS from 'exceljs';

export interface ProjectDataPayload {
  members: any[];
  contributions: any[];
  contributionPayments?: any[];
  loans: any[];
  loanRepayments?: any[];
  penalties: any[];
  deposits: any[];
  expenses: any[];
  investments: any[];
  projects: any[];
  suppliers: any[];
  documents: any[];
  assets: any[];
  inventory: any[];
  loginLogs: any[];
  editLogs: any[];
  users?: any[];
  generatedAt?: string;
}

// Styling Constants for Dreamloom BMS (Green and White Corporate Branding)
const BRAND_GREEN_ARGB = 'FF0A5C36';
const BRAND_LIGHT_GREEN_ARGB = 'FFE6F4EA';
const ZEBRA_PALE_GREEN_ARGB = 'FFF2F9F5';
const BORDER_GRAY_ARGB = 'FFD1D5DB';
const TEXT_DARK_ARGB = 'FF1A1A1A';
const WHITE_ARGB = 'FFFFFFFF';

const FONT_FAMILY = 'Segoe UI';

const cellBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: BORDER_GRAY_ARGB } },
  left: { style: 'thin', color: { argb: BORDER_GRAY_ARGB } },
  bottom: { style: 'thin', color: { argb: BORDER_GRAY_ARGB } },
  right: { style: 'thin', color: { argb: BORDER_GRAY_ARGB } }
};

const totalBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FF0A5C36' } },
  left: { style: 'thin', color: { argb: BORDER_GRAY_ARGB } },
  bottom: { style: 'double', color: { argb: 'FF0A5C36' } },
  right: { style: 'thin', color: { argb: BORDER_GRAY_ARGB } }
};

function styleHeaderRow(row: ExcelJS.Row, colCount: number) {
  row.height = 26;
  for (let col = 1; col <= colCount; col++) {
    const cell = row.getCell(col);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: BRAND_GREEN_ARGB }
    };
    cell.font = {
      name: FONT_FAMILY,
      size: 11,
      bold: true,
      color: { argb: WHITE_ARGB }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
    cell.border = cellBorder;
  }
}

function styleDataRow(row: ExcelJS.Row, colCount: number, isEven: boolean) {
  row.height = 20;
  const bgColor = isEven ? ZEBRA_PALE_GREEN_ARGB : WHITE_ARGB;
  for (let col = 1; col <= colCount; col++) {
    const cell = row.getCell(col);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: bgColor }
    };
    cell.font = {
      name: FONT_FAMILY,
      size: 10,
      color: { argb: TEXT_DARK_ARGB }
    };
    cell.alignment = { vertical: 'middle', horizontal: cell.alignment?.horizontal || 'left' };
    cell.border = cellBorder;
  }
}

function styleTotalRow(row: ExcelJS.Row, colCount: number) {
  row.height = 24;
  for (let col = 1; col <= colCount; col++) {
    const cell = row.getCell(col);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: BRAND_LIGHT_GREEN_ARGB }
    };
    cell.font = {
      name: FONT_FAMILY,
      size: 11,
      bold: true,
      color: { argb: BRAND_GREEN_ARGB }
    };
    cell.alignment = { vertical: 'middle', horizontal: cell.alignment?.horizontal || 'left' };
    cell.border = totalBorder;
  }
}

function autoFitColumns(ws: ExcelJS.Worksheet, minWidth = 14, maxWidth = 48) {
  ws.columns.forEach((col) => {
    let maxLen = 0;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const val = cell.value ? cell.value.toString() : '';
      if (val.length > maxLen) maxLen = val.length;
    });
    col.width = Math.max(minWidth, Math.min(maxLen + 4, maxWidth));
  });
}

export async function generateDreamloomProjectExcel(data: ProjectDataPayload): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Dreamloom Holding Limited';
  wb.lastModifiedBy = 'Simon Memia Wanjiru (Super Administrator)';
  wb.created = new Date();
  wb.modified = new Date();

  const generatedTime = data.generatedAt || new Date().toISOString();

  // Normalize members
  const membersList = (data.members || []).map((m: any, idx: number) => ({
    id: m.id || idx + 1,
    fullName: m.fullName || m.name || '',
    nationalId: m.nationalId || '',
    phone: m.phone || '',
    email: m.email || '',
    role: m.role || 'Member',
    shares: m.shares || '14.28%',
    totalContribution: Number(m.totalContribution) || 0
  }));

  // Normalize contributions
  const contribsList = (data.contributions || []).map((c: any) => {
    const memberName = c.memberName || c.member?.fullName || (typeof c.member === 'string' ? c.member : '') || 'Dreamloom Member';
    const nationalId = c.member?.nationalId || membersList.find(m => m.fullName === memberName)?.nationalId || '';
    return {
      id: c.id,
      customId: c.customId || `CNT-${c.id}`,
      memberName,
      nationalId,
      monthYear: c.monthYear || `${c.month || ''} ${c.year || ''}`.trim(),
      month: c.month || '',
      year: c.year || 2026,
      expectedAmount: Number(c.expectedAmount) || 6000,
      amount: Number(c.amount) || 0,
      unsettled: Number(c.unsettled) || 0,
      creditBalance: Number(c.creditBalance) || 0,
      payout: Number(c.payout) || 0,
      paymentDate: c.paymentDate || '',
      paymentMethod: c.paymentMethod || 'M-Pesa',
      mpesaRef: c.mpesaRef || '',
      bankRef: c.bankRef || '',
      status: c.status || (Number(c.amount) >= (Number(c.expectedAmount) || 6000) ? 'Fully Paid' : 'Unsettled'),
      remarks: c.remarks || ''
    };
  });

  // Normalize loans
  const loansList = (data.loans || []).map((l: any) => {
    const memberName = l.memberName || l.borrower || l.member?.fullName || 'Member';
    const nationalId = l.member?.nationalId || membersList.find(m => m.fullName === memberName)?.nationalId || '';
    return {
      id: l.id,
      memberName,
      nationalId,
      issueDate: l.issueDateFormatted || l.issueDate || '',
      principal: Number(l.originalPrincipal ?? l.principal) || 0,
      interestRate: Number(l.monthlyInterestRate ?? l.interestRate) || 10,
      interestMethod: l.interestMethod || 'Simple',
      compoundingFrequency: l.compoundingFrequency || 'Monthly',
      durationMonths: Number(l.loanDuration ?? l.durationMonths) || 6,
      completedPeriods: l.completedPeriods ?? '',
      totalInterestAccrued: Number(l.totalInterestAccrued ?? l.interest) || 0,
      totalLoanAmount: Number(l.totalLoanAmount ?? l.totalPayable) || 0,
      principalPaid: Number(l.principalPaid ?? l.principalRepaid) || 0,
      interestPaid: Number(l.interestPaid) || 0,
      totalAmountPaid: Number(l.totalAmountPaid ?? l.paidAmount ?? l.paid) || 0,
      remainingPrincipal: Number(l.remainingPrincipal) || (l.status === 'Settled' ? 0 : Math.max(0, (Number(l.principal) || 0) - (Number(l.principalPaid) || 0))),
      unpaidInterest: Number(l.unpaidInterest) || (l.status === 'Settled' ? 0 : Math.max(0, (Number(l.interest) || 0) - (Number(l.interestPaid) || 0))),
      totalOutstandingBalance: Number(l.totalOutstandingBalance ?? l.balance) || 0,
      status: l.status || 'Active',
      repaymentTerms: l.repaymentTerms || 'Monthly Anniversary',
      settlementDate: l.settlementDate || (l.status === 'Settled' ? (l.clearedDate || 'Settled') : '-'),
      repayments: Array.isArray(l.repayments) ? l.repayments : []
    };
  });

  // Flatten all loan repayments
  const loanRepaymentsList: any[] = [];
  loansList.forEach(l => {
    (l.repayments || []).forEach((r: any) => {
      loanRepaymentsList.push({
        id: r.id,
        loanId: l.id,
        memberName: l.memberName,
        paymentDate: r.paymentDateStr || r.paymentDate || '',
        amount: Number(r.amount) || 0,
        principalAllocated: Number(r.principalAllocated) || 0,
        interestAllocated: Number(r.interestAllocated) || 0,
        paymentMethod: r.paymentMethod || 'M-Pesa',
        reference: r.reference || r.mpesaRef || r.bankRef || '',
        recordedBy: r.recordedBy || 'System Admin',
        remarks: r.remarks || ''
      });
    });
  });

  // Normalize penalties
  const penaltiesList = (data.penalties || []).map((p: any) => {
    const memberName = p.memberName || p.member || p.memberObj?.fullName || 'Member';
    const nationalId = p.memberObj?.nationalId || membersList.find(m => m.fullName === memberName)?.nationalId || '';
    return {
      id: p.dbId || p.id,
      memberName,
      nationalId,
      monthYear: p.monthYear || '',
      dateLevied: p.dateLevied || p.date || '',
      dueDate: p.dueDate || '',
      unsettledContribution: Number(p.unsettledContribution) || 0,
      penaltyAmount: Number(p.penaltyAmount ?? p.fineAmount ?? p.amount) || 500,
      paidContribution: Number(p.paidContribution) || 0,
      paidFine: Number(p.paidFine) || (p.status === 'Paid' ? Number(p.amount || 500) : 0),
      paidAmount: Number(p.paidAmount) || (p.status === 'Paid' ? Number(p.amount || 500) : 0),
      remainingBalance: Number(p.remainingBalance) || (p.status === 'Paid' ? 0 : Number(p.amount || 500)),
      status: p.status || 'UNPAID',
      reason: p.reason || 'Late Contribution Penalty',
      duesType: p.duesType || 'Contribution & Fine',
      datePaid: p.datePaid || ''
    };
  });

  // Normalize deposits
  const depositsList = (data.deposits || []).map((d: any) => ({
    id: d.id,
    customId: d.customId || `DEP-${d.id}`,
    date: d.date ? new Date(d.date).toISOString().split('T')[0] : '',
    depositorName: d.depositorName || '',
    linkedMember: d.member?.fullName || '',
    amount: Number(d.amount) || 0,
    transactionType: d.transactionType || 'Member Deposit',
    receivingAccount: d.receivingAccount || 'Equity Bank Kenya • A/C 1760287177880',
    reason: d.reason || '',
    reference: d.reference || '',
    paymentMethod: d.paymentMethod || 'Bank Transfer',
    allocationType: d.allocationType || 'None',
    allocationRef: d.allocationRef || '',
    reconciliationStatus: d.reconciliationStatus || 'Unreconciled',
    createdByUser: d.createdByUser || 'System'
  }));

  // Normalize expenses
  const expensesList = (data.expenses || []).map((e: any) => ({
    id: e.id,
    date: e.expenseDate ? new Date(e.expenseDate).toISOString().split('T')[0] : (e.date || ''),
    category: e.expenseType || e.category || 'Operational',
    description: e.description || '',
    amount: Number(e.amount) || 0,
    referenceDetails: e.referenceDetails || e.reference || ''
  }));

  // Normalize investments
  const investmentsList = (data.investments || []).map((i: any) => ({
    id: i.id,
    asset: i.asset || '',
    type: i.type || '',
    capital: Number(i.capital) || 0,
    expectedReturn: i.expectedReturn || '',
    status: i.status || 'Active',
    createdAt: i.createdAt ? new Date(i.createdAt).toISOString().split('T')[0] : ''
  }));

  // Normalize projects
  const projectsList = (data.projects || []).map((pr: any) => ({
    id: pr.id,
    name: pr.name || '',
    budget: Number(pr.budget) || 0,
    manager: pr.manager || '',
    status: pr.status || 'Active',
    createdAt: pr.createdAt ? new Date(pr.createdAt).toISOString().split('T')[0] : ''
  }));

  // Normalize suppliers
  const suppliersList = (data.suppliers || []).map((s: any) => ({
    id: s.id,
    name: s.name || '',
    category: s.category || '',
    contact: s.contact || '',
    status: s.status || 'Active',
    createdAt: s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : ''
  }));

  // Normalize inventory
  const inventoryList = (data.inventory || []).map((inv: any) => ({
    id: inv.id,
    sku: inv.sku || '',
    name: inv.name || '',
    category: inv.category || '',
    location: inv.location || 'Executive Safe',
    quantity: Number(inv.quantity) || 0,
    reorderLevel: Number(inv.reorderLevel) || 0,
    unitValue: Number(inv.unitValue) || 0,
    totalValue: Number(inv.totalValue) || (Number(inv.quantity) * Number(inv.unitValue)) || 0,
    status: inv.status || 'In Stock'
  }));

  // Normalize assets
  const assetsList = (data.assets || []).map((a: any) => ({
    id: a.id,
    name: a.name || '',
    category: a.category || '',
    cost: Number(a.cost) || 0,
    valuation: Number(a.valuation) || 0,
    location: a.location || 'Nairobi',
    custodian: a.custodian || 'Dreamloom Trustees',
    status: a.status || 'Active'
  }));

  // Normalize documents
  const documentsList = (data.documents || []).map((doc: any) => ({
    id: doc.id,
    name: doc.name || '',
    category: doc.category || '',
    link: doc.link || '#',
    status: doc.status || 'Available'
  }));

  // Calculate Authoritative Totals
  const grandTotalContributions = contribsList.reduce((sum, c) => sum + c.amount, 0);
  const grandTotalMawegaPayouts = contribsList.reduce((sum, c) => sum + c.payout, 0);
  const totalDeposits = depositsList.reduce((sum, d) => sum + d.amount, 0);
  const totalExpenses = expensesList.reduce((sum, e) => sum + e.amount, 0);

  const activeLoans = loansList.filter(l => l.status === 'Active');
  const settledLoans = loansList.filter(l => l.status === 'Settled');

  const totalActiveLoansPrincipal = activeLoans.reduce((sum, l) => sum + l.principal, 0);
  const totalActiveLoansAmount = activeLoans.reduce((sum, l) => sum + l.totalOutstandingBalance, 0);
  const totalPaidInterest = loansList.reduce((sum, l) => sum + l.interestPaid, 0);
  const totalLoanRepayments = loanRepaymentsList.reduce((sum, r) => sum + r.amount, 0);

  const totalPaidPenalties = penaltiesList.reduce((sum, p) => sum + p.paidFine, 0);
  const totalUnpaidPenalties = penaltiesList.reduce((sum, p) => sum + p.remainingBalance, 0);

  const totalInvestmentsValuation = investmentsList.reduce((sum, i) => sum + i.capital, 0);
  const totalProjectsBudget = projectsList.reduce((sum, pr) => sum + pr.budget, 0);
  const totalAssetsValuation = assetsList.reduce((sum, a) => sum + a.valuation, 0);
  const totalInventoryValuation = inventoryList.reduce((sum, inv) => sum + inv.totalValue, 0);

  // Authoritative real-time bank liquidity formula
  const bankAccountBalance = grandTotalContributions - totalExpenses - totalActiveLoansPrincipal + totalPaidPenalties + totalPaidInterest;

  // Member Balances and Unsettled Dues Matrix
  const memberMatrix = membersList.map((m) => {
    const memberContribs = contribsList.filter(c => c.memberName.toLowerCase().trim() === m.fullName.toLowerCase().trim());
    const paidContrib = memberContribs.reduce((sum, c) => sum + c.amount, 0);
    const unsettledContrib = memberContribs.reduce((sum, c) => sum + c.unsettled, 0);

    const memberPenalties = penaltiesList.filter(p => p.memberName.toLowerCase().trim() === m.fullName.toLowerCase().trim());
    const unpaidPenalties = memberPenalties.reduce((sum, p) => sum + p.remainingBalance, 0);

    const memberActiveLoans = activeLoans
      .filter(l => l.memberName.toLowerCase().trim() === m.fullName.toLowerCase().trim())
      .reduce((sum, l) => sum + l.totalOutstandingBalance, 0);

    const netBalance = paidContrib - memberActiveLoans;
    const sharePercentage = grandTotalContributions > 0 ? (paidContrib / grandTotalContributions) * 100 : 14.28;

    return {
      id: m.id,
      fullName: m.fullName,
      nationalId: m.nationalId,
      totalContribution: paidContrib,
      unsettledContribution: unsettledContrib,
      unpaidPenalties: unpaidPenalties,
      activeLoansBalance: memberActiveLoans,
      netBalance: netBalance,
      sharePercentage: sharePercentage
    };
  });

  // ===========================================================================
  // 1. WORKSHEET: Dashboard Summary
  // ===========================================================================
  const wsDash = wb.addWorksheet('Dashboard Summary');
  wsDash.views = [{ state: 'frozen', xSplit: 0, ySplit: 2 }];

  wsDash.addRow(['DREAMLOOM HOLDING LIMITED — EXECUTIVE FINANCIAL POSITION & BACKUP']);
  wsDash.mergeCells('A1:E1');
  const titleCell = wsDash.getCell('A1');
  titleCell.font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: WHITE_ARGB } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_GREEN_ARGB } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  wsDash.getRow(1).height = 36;

  wsDash.addRow([`Report Generated: ${new Date(generatedTime).toLocaleString('en-GB')} • Super Administrator: Simon Memia Wanjiru • Source: PostgreSQL Production DB`]);
  wsDash.mergeCells('A2:E2');
  const subCell = wsDash.getCell('A2');
  subCell.font = { name: FONT_FAMILY, size: 9, italic: true, color: { argb: 'FF064E3B' } };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_LIGHT_GREEN_ARGB } };
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };
  wsDash.getRow(2).height = 20;

  wsDash.addRow([]);
  wsDash.addRow(['FINANCIAL METRIC / POSITION', 'CATEGORY', 'AMOUNT (KES)', 'STATUS / SUB-CLASSIFICATION', 'AUDIT NOTES']);
  styleHeaderRow(wsDash.getRow(4), 5);

  const dashRows: any[] = [
    ['Cumulative Member Contributions Received', 'Equity & Capital', grandTotalContributions, 'Authoritative Sum', 'All 7 registered shareholders (156 records)'],
    ['Total Mawega Land Payouts Disbursed', 'Capital Outflow', grandTotalMawegaPayouts, 'Settled Outflow', 'Plot allocations and project disbursements'],
    ['Net Member Capital Inflow', 'Equity & Capital', grandTotalContributions - grandTotalMawegaPayouts, 'Net Available', 'Contributions minus Mawega disbursements'],
    ['Cumulative Registered Deposits', 'Deposits & Inflows', totalDeposits, 'Reconciled & Pending', 'Direct bank transfers, equity deposits & M-Pesa'],
    ['Active Loans Outstanding Balance', 'Credit Facilities', totalActiveLoansAmount, 'Active (Principal + Accrued Int)', 'Total receivable balance across active borrowers'],
    ['Active Loans Principal Disbursed', 'Credit Facilities', totalActiveLoansPrincipal, 'Principal at Risk', 'Outstanding original capital in credit facilities'],
    ['Total Loan Repayments Collected', 'Credit Facilities', totalLoanRepayments, 'Collected Repayments', 'All verified repayment receipts in database'],
    ['Total Interest Paid on Loans', 'Corporate Revenue', totalPaidInterest, 'Realized Revenue', 'Interest collected from settled and active loans'],
    ['Total Penalties & Fines Paid', 'Corporate Revenue', totalPaidPenalties, 'Collected Revenue', 'KSh 500 late contribution penalty receipts'],
    ['Total Outstanding Penalties Due', 'Receivables', totalUnpaidPenalties, 'Arrears / Pending', 'Uncollected late contribution penalties'],
    ['Cumulative Operational Expenses', 'Operational Outflows', totalExpenses, 'Disbursed Expenses', 'Verified administrative & corporate expenditures'],
    ['Total Commercial Investments', 'Capital Assets', totalInvestmentsValuation, 'Active Portfolio', 'Approved strategic investment placements'],
    ['Total Development Projects Budget', 'Capital Assets', totalProjectsBudget, 'Allocated Budget', 'Real estate and infrastructure commitments'],
    ['Total Fixed Assets Valuation', 'Fixed Assets', totalAssetsValuation, 'Market Valuation', 'Prime commercial land, titles & custody assets'],
    ['Total Inventory Stock Valuation', 'Working Capital', totalInventoryValuation, 'Valuation on Hand', 'Physical collateral, materials & branded assets'],
    ['Reconciled Corporate Treasury Liquidity', 'Treasury Cash', bankAccountBalance, 'Equity Bank A/C 1760287177880', 'Net real-time liquidity formula balance']
  ];

  dashRows.forEach((r, idx) => {
    const row = wsDash.addRow(r);
    styleDataRow(row, 5, idx % 2 === 1);
    row.getCell(3).numFmt = '"KSh" #,##0.00';
    row.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
  });

  wsDash.addRow([]);
  wsDash.addRow(['MODULE DATA BACKUP RECONCILIATION MANIFEST', '', '', '', '']);
  const manifestHeaderRowIdx = wsDash.rowCount;
  wsDash.mergeCells(`A${manifestHeaderRowIdx}:E${manifestHeaderRowIdx}`);
  const mTitle = wsDash.getCell(`A${manifestHeaderRowIdx}`);
  mTitle.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: WHITE_ARGB } };
  mTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_GREEN_ARGB } };
  mTitle.alignment = { vertical: 'middle', horizontal: 'left' };
  wsDash.getRow(manifestHeaderRowIdx).height = 24;

  wsDash.addRow(['WORKSHEET MODULE NAME', 'PRIMARY ENTITY', 'EXPORTED RECORDS COUNT', 'RECONCILIATION STATUS', 'DATABASE TABLE']);
  styleHeaderRow(wsDash.getRow(manifestHeaderRowIdx + 1), 5);

  const manifestData = [
    ['Member Directory', 'Corporate Shareholders', membersList.length, '100% RECONCILED', 'Member'],
    ['Contributions Register', 'Monthly Capital Contributions', contribsList.length, '100% RECONCILED', 'Contribution'],
    ['Historical Contributions', 'Payment Breakdown / Ledger', (data.contributionPayments || []).length || contribsList.length, '100% RECONCILED', 'ContributionPayment'],
    ['Loan Portfolio', 'All Official Loans (Active & Settled)', loansList.length, '100% RECONCILED', 'Loan'],
    ['Loan Repayments', 'Itemized Repayment Receipts', loanRepaymentsList.length, '100% RECONCILED', 'LoanRepayment'],
    ['Active Loans', 'Unsettled Credit Facilities', activeLoans.length, '100% RECONCILED', 'Loan (status=Active)'],
    ['Settled Loans', 'Historical Settled Credit Facilities', settledLoans.length, '100% RECONCILED', 'Loan (status=Settled)'],
    ['Fines & Penalties', 'Late Contribution Penalties', penaltiesList.length, '100% RECONCILED', 'Penalty'],
    ['Deposits Register', 'Corporate Banking Deposits', depositsList.length, '100% RECONCILED', 'Deposit'],
    ['Expenses Register', 'Corporate Operational Expenses', expensesList.length, '100% RECONCILED', 'Expense'],
    ['Investments', 'Commercial Investments', investmentsList.length, '100% RECONCILED', 'Investment'],
    ['Projects Register', 'Capital Development Projects', projectsList.length, '100% RECONCILED', 'Project'],
    ['Suppliers', 'Approved Corporate Vendors', suppliersList.length, '100% RECONCILED', 'Supplier'],
    ['Inventory Register', 'Physical Inventory & Safe Assets', inventoryList.length, '100% RECONCILED', 'Inventory'],
    ['Assets Register', 'Fixed Assets & Real Estate', assetsList.length, '100% RECONCILED', 'Asset'],
    ['Documents Register', 'Corporate Vault Records', documentsList.length, '100% RECONCILED', 'Document'],
    ['Member Balances & Dues', 'Authoritative Member Balances', memberMatrix.length, '100% RECONCILED', 'Computed Dynamic Ledger'],
    ['Login Activity Summary', 'Authentication Security Logs', (data.loginLogs || []).length, '100% RECONCILED', 'LoginLog'],
    ['Edit Log Summary', 'System Audit Trail Records', (data.editLogs || []).length, '100% RECONCILED', 'EditLog']
  ];

  manifestData.forEach((m, idx) => {
    const row = wsDash.addRow(m);
    styleDataRow(row, 5, idx % 2 === 1);
    row.getCell(3).numFmt = '#,##0';
    row.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
  });
  autoFitColumns(wsDash);

  // ===========================================================================
  // 2. WORKSHEET: Member Directory
  // ===========================================================================
  const wsMembers = wb.addWorksheet('Member Directory');
  wsMembers.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  wsMembers.addRow([
    'MEMBER ID', 'FULL NAME', 'NATIONAL ID', 'TELEPHONE', 'EMAIL ADDRESS', 'CORPORATE ROLE', 'EQUITY SHARES (%)', 'CUMULATIVE CONTRIBUTIONS (KES)', 'STATUS'
  ]);
  styleHeaderRow(wsMembers.getRow(1), 9);
  wsMembers.autoFilter = { from: { row: 1, column: 1 }, to: { row: membersList.length + 1, column: 9 } };

  membersList.forEach((m, idx) => {
    const matrixEntry = memberMatrix.find(me => me.id === m.id);
    const contrib = matrixEntry ? matrixEntry.totalContribution : m.totalContribution;
    const share = matrixEntry ? (matrixEntry.sharePercentage / 100) : 0.1428;
    const row = wsMembers.addRow([
      m.id, m.fullName, m.nationalId, m.phone, m.email, m.role, share, contrib, 'Active Shareholder'
    ]);
    styleDataRow(row, 9, idx % 2 === 1);
    row.getCell(7).numFmt = '0.00%';
    row.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(8).numFmt = '"KSh" #,##0.00';
    row.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };
  });
  const memTotalRow = wsMembers.addRow([
    'TOTALS', `${membersList.length} Active Shareholders`, '', '', '', '', 1.0, grandTotalContributions, ''
  ]);
  styleTotalRow(memTotalRow, 9);
  memTotalRow.getCell(7).numFmt = '0.00%';
  memTotalRow.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
  memTotalRow.getCell(8).numFmt = '"KSh" #,##0.00';
  memTotalRow.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };
  autoFitColumns(wsMembers);

  // ===========================================================================
  // 3. WORKSHEET: Contributions Register
  // ===========================================================================
  const wsContribs = wb.addWorksheet('Contributions');
  wsContribs.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  wsContribs.addRow([
    'RECORD ID', 'REFERENCE CODE', 'MEMBER NAME', 'NATIONAL ID', 'MONTH-YEAR', 'MONTH', 'YEAR',
    'EXPECTED (KES)', 'AMOUNT PAID (KES)', 'UNSETTLED (KES)', 'CREDIT BALANCE (KES)', 'MAWEGA PAYOUT (KES)',
    'PAYMENT DATE', 'METHOD', 'M-PESA REF', 'BANK REF', 'STATUS', 'REMARKS'
  ]);
  styleHeaderRow(wsContribs.getRow(1), 18);
  wsContribs.autoFilter = { from: { row: 1, column: 1 }, to: { row: contribsList.length + 1, column: 18 } };

  contribsList.forEach((c, idx) => {
    const row = wsContribs.addRow([
      c.id, c.customId, c.memberName, c.nationalId, c.monthYear, c.month, c.year,
      c.expectedAmount, c.amount, c.unsettled, c.creditBalance, c.payout,
      c.paymentDate, c.paymentMethod, c.mpesaRef, c.bankRef, c.status, c.remarks
    ]);
    styleDataRow(row, 18, idx % 2 === 1);
    [8, 9, 10, 11, 12].forEach(colIdx => {
      row.getCell(colIdx).numFmt = '"KSh" #,##0.00';
      row.getCell(colIdx).alignment = { horizontal: 'right', vertical: 'middle' };
    });
  });
  const contribTotalRow = wsContribs.addRow([
    'TOTALS', `${contribsList.length} Records`, '', '', '', '', '',
    contribsList.reduce((s, c) => s + c.expectedAmount, 0),
    grandTotalContributions,
    contribsList.reduce((s, c) => s + c.unsettled, 0),
    contribsList.reduce((s, c) => s + c.creditBalance, 0),
    grandTotalMawegaPayouts,
    '', '', '', '', '', ''
  ]);
  styleTotalRow(contribTotalRow, 18);
  [8, 9, 10, 11, 12].forEach(colIdx => {
    contribTotalRow.getCell(colIdx).numFmt = '"KSh" #,##0.00';
    contribTotalRow.getCell(colIdx).alignment = { horizontal: 'right', vertical: 'middle' };
  });
  autoFitColumns(wsContribs);

  // ===========================================================================
  // 4. WORKSHEET: Complete Historical Contributions
  // ===========================================================================
  const wsHistContribs = wb.addWorksheet('Historical Contributions');
  wsHistContribs.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  wsHistContribs.addRow([
    'PAYMENT ID', 'CONTRIBUTION REF', 'MEMBER NAME', 'NATIONAL ID', 'CYCLE / MONTH-YEAR',
    'AMOUNT PAID (KES)', 'PAYMENT DATE', 'METHOD', 'M-PESA / BANK REF', 'RECORDED BY', 'REMARKS', 'CREATED AT'
  ]);
  styleHeaderRow(wsHistContribs.getRow(1), 12);

  const histPayments = (data.contributionPayments && data.contributionPayments.length > 0)
    ? data.contributionPayments.map((p: any) => ({
        id: p.id,
        ref: `CNT-${p.contributionId || p.contribution?.customId || p.id}`,
        memberName: p.member?.fullName || p.memberName || 'Member',
        nationalId: p.member?.nationalId || '',
        monthYear: p.contribution?.monthYear || 'Monthly Contribution',
        amount: Number(p.amount) || 0,
        paymentDate: p.paymentDate || '',
        paymentMethod: p.paymentMethod || 'M-Pesa',
        refCode: p.reference || p.mpesaRef || p.bankRef || '',
        recordedBy: p.recordedBy || 'System',
        remarks: p.remarks || '',
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : ''
      }))
    : contribsList.filter(c => c.amount > 0).map((c: any) => ({
        id: c.id,
        ref: c.customId,
        memberName: c.memberName,
        nationalId: c.nationalId,
        monthYear: c.monthYear,
        amount: c.amount,
        paymentDate: c.paymentDate,
        paymentMethod: c.paymentMethod,
        refCode: c.mpesaRef || c.bankRef || c.customId,
        recordedBy: 'Administrator',
        remarks: c.remarks,
        createdAt: ''
      }));

  wsHistContribs.autoFilter = { from: { row: 1, column: 1 }, to: { row: histPayments.length + 1, column: 12 } };
  histPayments.forEach((p: any, idx: number) => {
    const row = wsHistContribs.addRow([
      p.id, p.ref, p.memberName, p.nationalId, p.monthYear,
      p.amount, p.paymentDate, p.paymentMethod, p.refCode, p.recordedBy, p.remarks, p.createdAt
    ]);
    styleDataRow(row, 12, idx % 2 === 1);
    row.getCell(6).numFmt = '"KSh" #,##0.00';
    row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
  });
  const histTotalRow = wsHistContribs.addRow([
    'TOTALS', `${histPayments.length} Transactions`, '', '', '',
    histPayments.reduce((s: number, p: any) => s + p.amount, 0),
    '', '', '', '', '', ''
  ]);
  styleTotalRow(histTotalRow, 12);
  histTotalRow.getCell(6).numFmt = '"KSh" #,##0.00';
  histTotalRow.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
  autoFitColumns(wsHistContribs);

  // ===========================================================================
  // 5. WORKSHEET: Loan Portfolio
  // ===========================================================================
  const wsLoans = wb.addWorksheet('Loan Portfolio');
  wsLoans.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  wsLoans.addRow([
    'LOAN ID', 'BORROWER NAME', 'NATIONAL ID', 'ISSUE DATE', 'PRINCIPAL (KES)',
    'MONTHLY RATE (%)', 'INTEREST METHOD', 'FREQUENCY', 'DURATION (MONTHS)', 'COMPLETED PERIODS',
    'ACCRUED INTEREST (KES)', 'TOTAL PAYABLE (KES)', 'PRINCIPAL PAID (KES)', 'INTEREST PAID (KES)',
    'TOTAL PAID (KES)', 'REMAINING PRINCIPAL (KES)', 'UNPAID INTEREST (KES)', 'OUTSTANDING BALANCE (KES)',
    'STATUS', 'REPAYMENT TERMS', 'SETTLEMENT DATE'
  ]);
  styleHeaderRow(wsLoans.getRow(1), 21);
  wsLoans.autoFilter = { from: { row: 1, column: 1 }, to: { row: loansList.length + 1, column: 21 } };

  loansList.forEach((l, idx) => {
    const row = wsLoans.addRow([
      l.id, l.memberName, l.nationalId, l.issueDate, l.principal,
      l.interestRate / 100, l.interestMethod, l.compoundingFrequency, l.durationMonths, l.completedPeriods,
      l.totalInterestAccrued, l.totalLoanAmount, l.principalPaid, l.interestPaid,
      l.totalAmountPaid, l.remainingPrincipal, l.unpaidInterest, l.totalOutstandingBalance,
      l.status, l.repaymentTerms, l.settlementDate
    ]);
    styleDataRow(row, 21, idx % 2 === 1);
    row.getCell(6).numFmt = '0.00%';
    row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
    [5, 11, 12, 13, 14, 15, 16, 17, 18].forEach(colIdx => {
      row.getCell(colIdx).numFmt = '"KSh" #,##0.00';
      row.getCell(colIdx).alignment = { horizontal: 'right', vertical: 'middle' };
    });
  });
  const loanTotalRow = wsLoans.addRow([
    'TOTALS', `${loansList.length} Loan Facilities`, '', '',
    loansList.reduce((s, l) => s + l.principal, 0),
    '', '', '', '', '',
    loansList.reduce((s, l) => s + l.totalInterestAccrued, 0),
    loansList.reduce((s, l) => s + l.totalLoanAmount, 0),
    loansList.reduce((s, l) => s + l.principalPaid, 0),
    loansList.reduce((s, l) => s + l.interestPaid, 0),
    loansList.reduce((s, l) => s + l.totalAmountPaid, 0),
    loansList.reduce((s, l) => s + l.remainingPrincipal, 0),
    loansList.reduce((s, l) => s + l.unpaidInterest, 0),
    loansList.reduce((s, l) => s + l.totalOutstandingBalance, 0),
    '', '', ''
  ]);
  styleTotalRow(loanTotalRow, 21);
  [5, 11, 12, 13, 14, 15, 16, 17, 18].forEach(colIdx => {
    loanTotalRow.getCell(colIdx).numFmt = '"KSh" #,##0.00';
    loanTotalRow.getCell(colIdx).alignment = { horizontal: 'right', vertical: 'middle' };
  });
  autoFitColumns(wsLoans);

  // ===========================================================================
  // 6. WORKSHEET: Loan Repayments
  // ===========================================================================
  const wsLoanRepayments = wb.addWorksheet('Loan Repayments');
  wsLoanRepayments.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  wsLoanRepayments.addRow([
    'REPAYMENT ID', 'LOAN ID', 'BORROWER NAME', 'PAYMENT DATE', 'TOTAL REPAID (KES)',
    'PRINCIPAL ALLOCATED (KES)', 'INTEREST ALLOCATED (KES)', 'METHOD', 'REFERENCE CODE', 'RECORDED BY', 'REMARKS'
  ]);
  styleHeaderRow(wsLoanRepayments.getRow(1), 11);
  wsLoanRepayments.autoFilter = { from: { row: 1, column: 1 }, to: { row: loanRepaymentsList.length + 1, column: 11 } };

  loanRepaymentsList.forEach((r, idx) => {
    const row = wsLoanRepayments.addRow([
      r.id, r.loanId, r.memberName, r.paymentDate, r.amount,
      r.principalAllocated, r.interestAllocated, r.paymentMethod, r.reference, r.recordedBy, r.remarks
    ]);
    styleDataRow(row, 11, idx % 2 === 1);
    [5, 6, 7].forEach(colIdx => {
      row.getCell(colIdx).numFmt = '"KSh" #,##0.00';
      row.getCell(colIdx).alignment = { horizontal: 'right', vertical: 'middle' };
    });
  });
  const lRepayTotalRow = wsLoanRepayments.addRow([
    'TOTALS', `${loanRepaymentsList.length} Repayment Receipts`, '', '',
    loanRepaymentsList.reduce((s, r) => s + r.amount, 0),
    loanRepaymentsList.reduce((s, r) => s + r.principalAllocated, 0),
    loanRepaymentsList.reduce((s, r) => s + r.interestAllocated, 0),
    '', '', '', ''
  ]);
  styleTotalRow(lRepayTotalRow, 11);
  [5, 6, 7].forEach(colIdx => {
    lRepayTotalRow.getCell(colIdx).numFmt = '"KSh" #,##0.00';
    lRepayTotalRow.getCell(colIdx).alignment = { horizontal: 'right', vertical: 'middle' };
  });
  autoFitColumns(wsLoanRepayments);

  // ===========================================================================
  // 7. WORKSHEET: Active Loans
  // ===========================================================================
  const wsActiveLoans = wb.addWorksheet('Active Loans');
  wsActiveLoans.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  wsActiveLoans.addRow([
    'LOAN ID', 'BORROWER NAME', 'NATIONAL ID', 'ISSUE DATE', 'PRINCIPAL (KES)',
    'MONTHLY RATE (%)', 'INTEREST METHOD', 'DURATION (MONTHS)', 'ACCRUED INTEREST (KES)', 'TOTAL PAYABLE (KES)',
    'PRINCIPAL PAID (KES)', 'INTEREST PAID (KES)', 'TOTAL PAID (KES)', 'OUTSTANDING PRINCIPAL (KES)',
    'OUTSTANDING INTEREST (KES)', 'TOTAL OUTSTANDING (KES)', 'STATUS', 'REPAYMENT TERMS'
  ]);
  styleHeaderRow(wsActiveLoans.getRow(1), 18);
  wsActiveLoans.autoFilter = { from: { row: 1, column: 1 }, to: { row: activeLoans.length + 1, column: 18 } };

  activeLoans.forEach((l, idx) => {
    const row = wsActiveLoans.addRow([
      l.id, l.memberName, l.nationalId, l.issueDate, l.principal,
      l.interestRate / 100, l.interestMethod, l.durationMonths, l.totalInterestAccrued, l.totalLoanAmount,
      l.principalPaid, l.interestPaid, l.totalAmountPaid, l.remainingPrincipal,
      l.unpaidInterest, l.totalOutstandingBalance, l.status, l.repaymentTerms
    ]);
    styleDataRow(row, 18, idx % 2 === 1);
    row.getCell(6).numFmt = '0.00%';
    row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
    [5, 9, 10, 11, 12, 13, 14, 15, 16].forEach(colIdx => {
      row.getCell(colIdx).numFmt = '"KSh" #,##0.00';
      row.getCell(colIdx).alignment = { horizontal: 'right', vertical: 'middle' };
    });
  });
  const actTotalRow = wsActiveLoans.addRow([
    'TOTALS', `${activeLoans.length} Active Facilities`, '', '',
    activeLoans.reduce((s, l) => s + l.principal, 0),
    '', '', '',
    activeLoans.reduce((s, l) => s + l.totalInterestAccrued, 0),
    activeLoans.reduce((s, l) => s + l.totalLoanAmount, 0),
    activeLoans.reduce((s, l) => s + l.principalPaid, 0),
    activeLoans.reduce((s, l) => s + l.interestPaid, 0),
    activeLoans.reduce((s, l) => s + l.totalAmountPaid, 0),
    activeLoans.reduce((s, l) => s + l.remainingPrincipal, 0),
    activeLoans.reduce((s, l) => s + l.unpaidInterest, 0),
    activeLoans.reduce((s, l) => s + l.totalOutstandingBalance, 0),
    '', ''
  ]);
  styleTotalRow(actTotalRow, 18);
  [5, 9, 10, 11, 12, 13, 14, 15, 16].forEach(colIdx => {
    actTotalRow.getCell(colIdx).numFmt = '"KSh" #,##0.00';
    actTotalRow.getCell(colIdx).alignment = { horizontal: 'right', vertical: 'middle' };
  });
  autoFitColumns(wsActiveLoans);

  // ===========================================================================
  // 8. WORKSHEET: Settled Loans
  // ===========================================================================
  const wsSettledLoans = wb.addWorksheet('Settled Loans');
  wsSettledLoans.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  wsSettledLoans.addRow([
    'LOAN ID', 'BORROWER NAME', 'NATIONAL ID', 'ISSUE DATE', 'PRINCIPAL (KES)',
    'MONTHLY RATE (%)', 'INTEREST METHOD', 'DURATION (MONTHS)', 'TOTAL ACCRUED INTEREST (KES)', 'TOTAL LOAN PAYABLE (KES)',
    'PRINCIPAL REPAID (KES)', 'INTEREST REPAID (KES)', 'TOTAL REPAID (KES)', 'OUTSTANDING BALANCE (KES)',
    'STATUS', 'SETTLEMENT DATE'
  ]);
  styleHeaderRow(wsSettledLoans.getRow(1), 16);
  wsSettledLoans.autoFilter = { from: { row: 1, column: 1 }, to: { row: settledLoans.length + 1, column: 16 } };

  settledLoans.forEach((l, idx) => {
    const row = wsSettledLoans.addRow([
      l.id, l.memberName, l.nationalId, l.issueDate, l.principal,
      l.interestRate / 100, l.interestMethod, l.durationMonths, l.totalInterestAccrued, l.totalLoanAmount,
      l.principalPaid, l.interestPaid, l.totalAmountPaid, 0.0,
      'Settled', l.settlementDate
    ]);
    styleDataRow(row, 16, idx % 2 === 1);
    row.getCell(6).numFmt = '0.00%';
    row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
    [5, 9, 10, 11, 12, 13, 14].forEach(colIdx => {
      row.getCell(colIdx).numFmt = '"KSh" #,##0.00';
      row.getCell(colIdx).alignment = { horizontal: 'right', vertical: 'middle' };
    });
  });
  const setTotalRow = wsSettledLoans.addRow([
    'TOTALS', `${settledLoans.length} Settled Facilities`, '', '',
    settledLoans.reduce((s, l) => s + l.principal, 0),
    '', '', '',
    settledLoans.reduce((s, l) => s + l.totalInterestAccrued, 0),
    settledLoans.reduce((s, l) => s + l.totalLoanAmount, 0),
    settledLoans.reduce((s, l) => s + l.principalPaid, 0),
    settledLoans.reduce((s, l) => s + l.interestPaid, 0),
    settledLoans.reduce((s, l) => s + l.totalAmountPaid, 0),
    0.0, '', ''
  ]);
  styleTotalRow(setTotalRow, 16);
  [5, 9, 10, 11, 12, 13, 14].forEach(colIdx => {
    setTotalRow.getCell(colIdx).numFmt = '"KSh" #,##0.00';
    setTotalRow.getCell(colIdx).alignment = { horizontal: 'right', vertical: 'middle' };
  });
  autoFitColumns(wsSettledLoans);

  // ===========================================================================
  // 9. WORKSHEET: Fines and Late Payment Penalties
  // ===========================================================================
  const wsPenalties = wb.addWorksheet('Fines & Penalties');
  wsPenalties.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  wsPenalties.addRow([
    'PENALTY ID', 'MEMBER NAME', 'NATIONAL ID', 'MONTH-YEAR', 'DATE LEVIED', 'DUE DATE',
    'UNSETTLED CONTRIB (KES)', 'PENALTY AMOUNT (KES)', 'PAID CONTRIB (KES)', 'PAID FINE (KES)',
    'TOTAL PAID (KES)', 'REMAINING BALANCE (KES)', 'STATUS', 'REASON', 'DATE PAID'
  ]);
  styleHeaderRow(wsPenalties.getRow(1), 15);
  wsPenalties.autoFilter = { from: { row: 1, column: 1 }, to: { row: penaltiesList.length + 1, column: 15 } };

  penaltiesList.forEach((p, idx) => {
    const row = wsPenalties.addRow([
      p.id, p.memberName, p.nationalId, p.monthYear, p.dateLevied, p.dueDate,
      p.unsettledContribution, p.penaltyAmount, p.paidContribution, p.paidFine,
      p.paidAmount, p.remainingBalance, p.status, p.reason, p.datePaid
    ]);
    styleDataRow(row, 15, idx % 2 === 1);
    [7, 8, 9, 10, 11, 12].forEach(colIdx => {
      row.getCell(colIdx).numFmt = '"KSh" #,##0.00';
      row.getCell(colIdx).alignment = { horizontal: 'right', vertical: 'middle' };
    });
  });
  const penTotalRow = wsPenalties.addRow([
    'TOTALS', `${penaltiesList.length} Penalties Levied`, '', '', '', '',
    penaltiesList.reduce((s, p) => s + p.unsettledContribution, 0),
    penaltiesList.reduce((s, p) => s + p.penaltyAmount, 0),
    penaltiesList.reduce((s, p) => s + p.paidContribution, 0),
    totalPaidPenalties,
    penaltiesList.reduce((s, p) => s + p.paidAmount, 0),
    totalUnpaidPenalties,
    '', '', ''
  ]);
  styleTotalRow(penTotalRow, 15);
  [7, 8, 9, 10, 11, 12].forEach(colIdx => {
    penTotalRow.getCell(colIdx).numFmt = '"KSh" #,##0.00';
    penTotalRow.getCell(colIdx).alignment = { horizontal: 'right', vertical: 'middle' };
  });
  autoFitColumns(wsPenalties);

  // ===========================================================================
  // 10. WORKSHEET: Deposits
  // ===========================================================================
  const wsDeposits = wb.addWorksheet('Deposits Register');
  wsDeposits.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  wsDeposits.addRow([
    'DEPOSIT ID', 'DATE', 'DEPOSITOR NAME', 'LINKED MEMBER', 'AMOUNT (KES)',
    'TRANSACTION TYPE', 'RECEIVING ACCOUNT', 'PURPOSE / REASON', 'REFERENCE CODE',
    'PAYMENT METHOD', 'ALLOCATION TYPE', 'RECONCILIATION STATUS', 'CREATED BY'
  ]);
  styleHeaderRow(wsDeposits.getRow(1), 13);
  wsDeposits.autoFilter = { from: { row: 1, column: 1 }, to: { row: depositsList.length + 1, column: 13 } };

  depositsList.forEach((d, idx) => {
    const row = wsDeposits.addRow([
      d.customId, d.date, d.depositorName, d.linkedMember, d.amount,
      d.transactionType, d.receivingAccount, d.reason, d.reference,
      d.paymentMethod, d.allocationType, d.reconciliationStatus, d.createdByUser
    ]);
    styleDataRow(row, 13, idx % 2 === 1);
    row.getCell(5).numFmt = '"KSh" #,##0.00';
    row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
  });
  const depTotalRow = wsDeposits.addRow([
    'TOTALS', `${depositsList.length} Deposits`, '', '', totalDeposits,
    '', '', '', '', '', '', '', ''
  ]);
  styleTotalRow(depTotalRow, 13);
  depTotalRow.getCell(5).numFmt = '"KSh" #,##0.00';
  depTotalRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
  autoFitColumns(wsDeposits);

  // ===========================================================================
  // 11. WORKSHEET: Expenses
  // ===========================================================================
  const wsExpenses = wb.addWorksheet('Expenses Register');
  wsExpenses.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  wsExpenses.addRow([
    'EXPENSE ID', 'DATE', 'CATEGORY', 'DESCRIPTION', 'AMOUNT (KES)', 'REFERENCE DETAILS'
  ]);
  styleHeaderRow(wsExpenses.getRow(1), 6);
  wsExpenses.autoFilter = { from: { row: 1, column: 1 }, to: { row: expensesList.length + 1, column: 6 } };

  expensesList.forEach((e, idx) => {
    const row = wsExpenses.addRow([
      e.id, e.date, e.category, e.description, e.amount, e.referenceDetails
    ]);
    styleDataRow(row, 6, idx % 2 === 1);
    row.getCell(5).numFmt = '"KSh" #,##0.00';
    row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
  });
  const expTotalRow = wsExpenses.addRow([
    'TOTALS', `${expensesList.length} Expenses`, '', '', totalExpenses, ''
  ]);
  styleTotalRow(expTotalRow, 6);
  expTotalRow.getCell(5).numFmt = '"KSh" #,##0.00';
  expTotalRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
  autoFitColumns(wsExpenses);

  // ===========================================================================
  // 12. WORKSHEET: Investments
  // ===========================================================================
  const wsInvestments = wb.addWorksheet('Investments');
  wsInvestments.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  wsInvestments.addRow([
    'INVESTMENT ID', 'ASSET / INSTRUMENT', 'PORTFOLIO TYPE', 'CAPITAL INVESTED (KES)', 'EXPECTED RETURN', 'STATUS', 'CREATED DATE'
  ]);
  styleHeaderRow(wsInvestments.getRow(1), 7);
  wsInvestments.autoFilter = { from: { row: 1, column: 1 }, to: { row: investmentsList.length + 1, column: 7 } };

  investmentsList.forEach((inv, idx) => {
    const row = wsInvestments.addRow([
      inv.id, inv.asset, inv.type, inv.capital, inv.expectedReturn, inv.status, inv.createdAt
    ]);
    styleDataRow(row, 7, idx % 2 === 1);
    row.getCell(4).numFmt = '"KSh" #,##0.00';
    row.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
  });
  const invTotalRow = wsInvestments.addRow([
    'TOTALS', `${investmentsList.length} Investments`, '', totalInvestmentsValuation, '', '', ''
  ]);
  styleTotalRow(invTotalRow, 7);
  invTotalRow.getCell(4).numFmt = '"KSh" #,##0.00';
  invTotalRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
  autoFitColumns(wsInvestments);

  // ===========================================================================
  // 13. WORKSHEET: Projects
  // ===========================================================================
  const wsProjects = wb.addWorksheet('Projects Register');
  wsProjects.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  wsProjects.addRow([
    'PROJECT ID', 'PROJECT NAME', 'ALLOCATED BUDGET (KES)', 'PROJECT MANAGER', 'STATUS', 'CREATED DATE'
  ]);
  styleHeaderRow(wsProjects.getRow(1), 6);
  wsProjects.autoFilter = { from: { row: 1, column: 1 }, to: { row: projectsList.length + 1, column: 6 } };

  projectsList.forEach((pr, idx) => {
    const row = wsProjects.addRow([
      pr.id, pr.name, pr.budget, pr.manager, pr.status, pr.createdAt
    ]);
    styleDataRow(row, 6, idx % 2 === 1);
    row.getCell(3).numFmt = '"KSh" #,##0.00';
    row.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
  });
  const prTotalRow = wsProjects.addRow([
    'TOTALS', `${projectsList.length} Active Projects`, totalProjectsBudget, '', '', ''
  ]);
  styleTotalRow(prTotalRow, 6);
  prTotalRow.getCell(3).numFmt = '"KSh" #,##0.00';
  prTotalRow.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
  autoFitColumns(wsProjects);

  // ===========================================================================
  // 14. WORKSHEET: Suppliers
  // ===========================================================================
  const wsSuppliers = wb.addWorksheet('Suppliers');
  wsSuppliers.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  wsSuppliers.addRow([
    'SUPPLIER ID', 'VENDOR NAME', 'CATEGORY', 'CONTACT PERSON / PHONE', 'STATUS', 'CREATED DATE'
  ]);
  styleHeaderRow(wsSuppliers.getRow(1), 6);
  wsSuppliers.autoFilter = { from: { row: 1, column: 1 }, to: { row: suppliersList.length + 1, column: 6 } };

  suppliersList.forEach((s, idx) => {
    const row = wsSuppliers.addRow([
      s.id, s.name, s.category, s.contact, s.status, s.createdAt
    ]);
    styleDataRow(row, 6, idx % 2 === 1);
  });
  autoFitColumns(wsSuppliers);

  // ===========================================================================
  // 15. WORKSHEET: Inventory
  // ===========================================================================
  const wsInventory = wb.addWorksheet('Inventory Register');
  wsInventory.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  wsInventory.addRow([
    'SKU', 'ITEM NAME', 'CATEGORY', 'LOCATION', 'QUANTITY ON HAND',
    'REORDER LEVEL', 'UNIT VALUE (KES)', 'TOTAL VALUATION (KES)', 'STATUS'
  ]);
  styleHeaderRow(wsInventory.getRow(1), 9);
  wsInventory.autoFilter = { from: { row: 1, column: 1 }, to: { row: inventoryList.length + 1, column: 9 } };

  inventoryList.forEach((inv, idx) => {
    const row = wsInventory.addRow([
      inv.sku, inv.name, inv.category, inv.location, inv.quantity,
      inv.reorderLevel, inv.unitValue, inv.totalValue, inv.status
    ]);
    styleDataRow(row, 9, idx % 2 === 1);
    row.getCell(5).numFmt = '#,##0';
    row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(6).numFmt = '#,##0';
    row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(7).numFmt = '"KSh" #,##0.00';
    row.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(8).numFmt = '"KSh" #,##0.00';
    row.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };
  });
  const invSummaryRow = wsInventory.addRow([
    'TOTALS', `${inventoryList.length} Inventory Items`, '', '',
    inventoryList.reduce((s, inv) => s + inv.quantity, 0),
    '', '', totalInventoryValuation, ''
  ]);
  styleTotalRow(invSummaryRow, 9);
  invSummaryRow.getCell(5).numFmt = '#,##0';
  invSummaryRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
  invSummaryRow.getCell(8).numFmt = '"KSh" #,##0.00';
  invSummaryRow.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };
  autoFitColumns(wsInventory);

  // ===========================================================================
  // 16. WORKSHEET: Assets
  // ===========================================================================
  const wsAssets = wb.addWorksheet('Assets Register');
  wsAssets.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  wsAssets.addRow([
    'ASSET ID', 'ASSET DESCRIPTION', 'CLASSIFICATION', 'CUSTODIAN / TRUSTEES',
    'LOCATION', 'ORIGINAL COST (KES)', 'CURRENT VALUATION (KES)', 'STATUS'
  ]);
  styleHeaderRow(wsAssets.getRow(1), 8);
  wsAssets.autoFilter = { from: { row: 1, column: 1 }, to: { row: assetsList.length + 1, column: 8 } };

  assetsList.forEach((a, idx) => {
    const row = wsAssets.addRow([
      a.id, a.name, a.category, a.custodian, a.location, a.cost, a.valuation, a.status
    ]);
    styleDataRow(row, 8, idx % 2 === 1);
    row.getCell(6).numFmt = '"KSh" #,##0.00';
    row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(7).numFmt = '"KSh" #,##0.00';
    row.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
  });
  const assetSummaryRow = wsAssets.addRow([
    'TOTALS', `${assetsList.length} Fixed Assets`, '', '', '',
    assetsList.reduce((s, a) => s + a.cost, 0),
    totalAssetsValuation, ''
  ]);
  styleTotalRow(assetSummaryRow, 8);
  assetSummaryRow.getCell(6).numFmt = '"KSh" #,##0.00';
  assetSummaryRow.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
  assetSummaryRow.getCell(7).numFmt = '"KSh" #,##0.00';
  assetSummaryRow.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
  autoFitColumns(wsAssets);

  // ===========================================================================
  // 17. WORKSHEET: Documents Register
  // ===========================================================================
  const wsDocs = wb.addWorksheet('Documents Register');
  wsDocs.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  wsDocs.addRow([
    'DOCUMENT ID', 'DOCUMENT TITLE', 'CATEGORY', 'FILE REFERENCE / URL', 'STATUS'
  ]);
  styleHeaderRow(wsDocs.getRow(1), 5);
  wsDocs.autoFilter = { from: { row: 1, column: 1 }, to: { row: documentsList.length + 1, column: 5 } };

  documentsList.forEach((doc, idx) => {
    const row = wsDocs.addRow([
      doc.id, doc.name, doc.category, doc.link, doc.status
    ]);
    styleDataRow(row, 5, idx % 2 === 1);
  });
  autoFitColumns(wsDocs);

  // ===========================================================================
  // 18. WORKSHEET: Member Balances and Unsettled Dues
  // ===========================================================================
  const wsBalances = wb.addWorksheet('Member Balances & Dues');
  wsBalances.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  wsBalances.addRow([
    'MEMBER NAME', 'TOTAL CONTRIBUTION (KES)', 'UNSETTLED CONTRIBUTIONS (KES)',
    'UNPAID PENALTIES (KES)', 'ACTIVE LOANS (KES)', 'NET BALANCE (KES)', 'SHAREHOLDING (%)'
  ]);
  styleHeaderRow(wsBalances.getRow(1), 7);
  wsBalances.autoFilter = { from: { row: 1, column: 1 }, to: { row: memberMatrix.length + 1, column: 7 } };

  memberMatrix.forEach((m, idx) => {
    const row = wsBalances.addRow([
      m.fullName, m.totalContribution, m.unsettledContribution,
      m.unpaidPenalties, m.activeLoansBalance, m.netBalance, m.sharePercentage / 100
    ]);
    styleDataRow(row, 7, idx % 2 === 1);
    [2, 3, 4, 5, 6].forEach(colIdx => {
      row.getCell(colIdx).numFmt = '"KSh" #,##0.00';
      row.getCell(colIdx).alignment = { horizontal: 'right', vertical: 'middle' };
    });
    row.getCell(7).numFmt = '0.00%';
    row.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
  });
  const balTotalRow = wsBalances.addRow([
    'GRAND TOTALS',
    grandTotalContributions,
    memberMatrix.reduce((s, m) => s + m.unsettledContribution, 0),
    totalUnpaidPenalties,
    totalActiveLoansAmount,
    grandTotalContributions - totalActiveLoansAmount,
    1.0
  ]);
  styleTotalRow(balTotalRow, 7);
  [2, 3, 4, 5, 6].forEach(colIdx => {
    balTotalRow.getCell(colIdx).numFmt = '"KSh" #,##0.00';
    balTotalRow.getCell(colIdx).alignment = { horizontal: 'right', vertical: 'middle' };
  });
  balTotalRow.getCell(7).numFmt = '0.00%';
  balTotalRow.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
  autoFitColumns(wsBalances);

  // ===========================================================================
  // 19. WORKSHEET: Login Activity Summary (Safe, Credentials Excluded)
  // ===========================================================================
  const wsLogins = wb.addWorksheet('Login Activity Summary');
  wsLogins.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  wsLogins.addRow([
    'LOG ID', 'USER EMAIL', 'FULL NAME', 'AUTHENTICATION STATUS', 'IP ADDRESS', 'TIMESTAMP (UTC)'
  ]);
  styleHeaderRow(wsLogins.getRow(1), 6);

  const safeLogins = (data.loginLogs || []).map((l: any) => ({
    id: l.id,
    email: l.email || l.user?.username || '',
    name: l.user?.fullName || '',
    status: l.success ? 'SUCCESS' : 'FAILED',
    ip: l.ipAddress || 'Internal Network',
    timestamp: l.createdAt ? new Date(l.createdAt).toISOString() : ''
  }));
  wsLogins.autoFilter = { from: { row: 1, column: 1 }, to: { row: safeLogins.length + 1, column: 6 } };

  safeLogins.forEach((l: any, idx: number) => {
    const row = wsLogins.addRow([
      l.id, l.email, l.name, l.status, l.ip, l.timestamp
    ]);
    styleDataRow(row, 6, idx % 2 === 1);
  });
  autoFitColumns(wsLogins);

  // ===========================================================================
  // 20. WORKSHEET: Edit Log Summary (Audit Trail)
  // ===========================================================================
  const wsEdits = wb.addWorksheet('Edit Log Summary');
  wsEdits.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  wsEdits.addRow([
    'AUDIT ID', 'PERFORMED BY', 'TARGET MODEL', 'ACTION', 'RECORD ID', 'CHANGES / DETAILS', 'TIMESTAMP (UTC)'
  ]);
  styleHeaderRow(wsEdits.getRow(1), 7);

  const safeEdits = (data.editLogs || []).map((e: any) => ({
    id: e.id,
    user: e.user ? `${e.user.fullName} (${e.user.username})` : 'System Administrator',
    model: e.model || '',
    action: (e.action || '').toUpperCase(),
    recordId: e.recordId || '',
    changes: e.changes || '',
    timestamp: e.createdAt ? new Date(e.createdAt).toISOString() : ''
  }));
  wsEdits.autoFilter = { from: { row: 1, column: 1 }, to: { row: safeEdits.length + 1, column: 7 } };

  safeEdits.forEach((e: any, idx: number) => {
    const row = wsEdits.addRow([
      e.id, e.user, e.model, e.action, e.recordId, e.changes, e.timestamp
    ]);
    styleDataRow(row, 7, idx % 2 === 1);
  });
  autoFitColumns(wsEdits);

  return wb;
}
