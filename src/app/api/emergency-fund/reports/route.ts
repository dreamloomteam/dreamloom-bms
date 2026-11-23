import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getEmergencyFundData } from '@/lib/emergencyFundDb';
import { SESSION_COOKIE_NAME, verifySessionToken, SessionPayload } from '@/lib/session';

export const dynamic = 'force-dynamic';

const BRAND_GREEN_ARGB = 'FF0A5C36';
const BRAND_LIGHT_GREEN_ARGB = 'FFE6F4EA';
const BORDER_GRAY_ARGB = 'FFD1D5DB';
const FONT_FAMILY = 'Segoe UI';

const cellBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: BORDER_GRAY_ARGB } },
  left: { style: 'thin', color: { argb: BORDER_GRAY_ARGB } },
  bottom: { style: 'thin', color: { argb: BORDER_GRAY_ARGB } },
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
      color: { argb: 'FFFFFFFF' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = cellBorder;
  }
}

function getSessionUser(request: Request): SessionPayload | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const payload = verifySessionToken(token);
    if (payload) return payload;
  }
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
  if (match) {
    const token = decodeURIComponent(match[1]);
    const payload = verifySessionToken(token);
    if (payload) return payload;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const user = getSessionUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const fundData = await getEmergencyFundData();
    const { settings, allocations, applications, loans, repayments, transactions, stats } = fundData;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Dreamloom Financial BMS';
    workbook.created = new Date();

    // -------------------------------------------------------------
    // SHEET 1: Fund Overview & KPI Dashboard
    // -------------------------------------------------------------
    const wsOverview = workbook.addWorksheet('Fund Summary');
    wsOverview.views = [{ showGridLines: true }];

    wsOverview.addRow(['DREAMLOOM MEMBERS’ EMERGENCY & WELFARE FUND — EXECUTIVE SUMMARY']);
    wsOverview.mergeCells('A1:D1');
    const titleCell = wsOverview.getCell('A1');
    titleCell.font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: BRAND_GREEN_ARGB } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
    wsOverview.getRow(1).height = 32;

    wsOverview.addRow([`Generated: ${new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })} EAT`]);
    wsOverview.addRow([`Fund Policy: KSh ${settings.monthlyAllocation.toLocaleString()}/member/month • 10% Simple Interest • 1 Month Maturity`]);
    wsOverview.addRow([]);

    wsOverview.addRow(['Metric / Balance Description', 'Value (KSh)', 'Status / Category', 'Notes']);
    styleHeaderRow(wsOverview.getRow(5), 4);

    const kpiRows = [
      ['Total Fund Allocations', stats.totalAllocations, 'Fund Capital', 'Cumulative internal member contributions allocated'],
      ['Total Loans Disbursed', stats.totalDisbursed, 'Loan Assets', 'Principal disbursed to shareholder-directors'],
      ['Total Principal Repaid', stats.totalPrincipalRepaid, 'Recovered Capital', 'Principal recovered back into fund'],
      ['Outstanding Loan Principal', stats.outstandingPrincipal, 'Active Exposure', 'Principal currently in circulation'],
      ['Total Interest Collected', stats.interestCollected, 'Fund Income', '10% monthly simple interest earnings'],
      ['AVAILABLE FUND BALANCE (Liquid Cash)', stats.availableBalance, 'LIQUID CASH', 'Allocations + Repaid Principal + Interest - Disbursed']
    ];

    kpiRows.forEach((r, idx) => {
      const row = wsOverview.addRow(r);
      row.height = 22;
      row.getCell(2).numFmt = '#,##0.00';
      row.getCell(2).font = { name: FONT_FAMILY, bold: true };
      if (idx === 5) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_LIGHT_GREEN_ARGB } };
        row.getCell(1).font = { name: FONT_FAMILY, bold: true, color: { argb: BRAND_GREEN_ARGB } };
        row.getCell(2).font = { name: FONT_FAMILY, bold: true, color: { argb: BRAND_GREEN_ARGB } };
      }
      for (let c = 1; c <= 4; c++) row.getCell(c).border = cellBorder;
    });

    wsOverview.columns = [{ width: 42 }, { width: 24 }, { width: 24 }, { width: 48 }];

    // -------------------------------------------------------------
    // SHEET 2: Monthly Allocations
    // -------------------------------------------------------------
    const wsAlloc = workbook.addWorksheet('Monthly Allocations');
    wsAlloc.views = [{ showGridLines: true }];
    wsAlloc.addRow(['Allocation ID', 'Member Name', 'National ID', 'Month', 'Year', 'Amount (KSh)', 'Status', 'Recorded By', 'Source']);
    styleHeaderRow(wsAlloc.getRow(1), 9);

    allocations.forEach(a => {
      const row = wsAlloc.addRow([
        `ALC-${a.id}`,
        a.member.fullName,
        a.member.nationalId,
        a.month,
        a.year,
        a.amount,
        a.status,
        a.recordedBy || 'Treasurer',
        a.sourceContribution
      ]);
      row.height = 20;
      row.getCell(6).numFmt = '#,##0.00';
      for (let c = 1; c <= 9; c++) row.getCell(c).border = cellBorder;
    });
    wsAlloc.columns = [
      { width: 16 }, { width: 28 }, { width: 14 }, { width: 14 }, { width: 10 },
      { width: 18 }, { width: 14 }, { width: 20 }, { width: 45 }
    ];

    // -------------------------------------------------------------
    // SHEET 3: Loan Applications
    // -------------------------------------------------------------
    const wsApp = workbook.addWorksheet('Loan Applications');
    wsApp.views = [{ showGridLines: true }];
    wsApp.addRow(['Application ID', 'Applicant Member', 'Date', 'Amount Requested (KSh)', 'Reason', 'Repayment Date', 'Status', 'Reviewed By']);
    styleHeaderRow(wsApp.getRow(1), 8);

    applications.forEach(a => {
      const row = wsApp.addRow([
        a.id,
        a.member.fullName,
        new Date(a.applicationDate).toLocaleDateString('en-GB'),
        a.amountRequested,
        a.reason,
        new Date(a.proposedRepaymentDate).toLocaleDateString('en-GB'),
        a.status,
        a.reviewedBy || '-'
      ]);
      row.height = 20;
      row.getCell(4).numFmt = '#,##0.00';
      for (let c = 1; c <= 8; c++) row.getCell(c).border = cellBorder;
    });
    wsApp.columns = [
      { width: 16 }, { width: 28 }, { width: 14 }, { width: 22 },
      { width: 35 }, { width: 16 }, { width: 14 }, { width: 24 }
    ];

    // -------------------------------------------------------------
    // SHEET 4: Emergency Loan Portfolio
    // -------------------------------------------------------------
    const wsLoans = workbook.addWorksheet('Loan Portfolio');
    wsLoans.views = [{ showGridLines: true }];
    wsLoans.addRow([
      'Loan ID', 'Member Name', 'Issue Date', 'Principal (KSh)', 'Rate (%)',
      'Interest (KSh)', 'Total Payable (KSh)', 'Principal Paid (KSh)', 'Interest Paid (KSh)',
      'Total Paid (KSh)', 'Balance (KSh)', 'Due Date', 'Status', 'Approval Ref'
    ]);
    styleHeaderRow(wsLoans.getRow(1), 14);

    loans.forEach(l => {
      const row = wsLoans.addRow([
        l.id,
        l.member.fullName,
        new Date(l.disbursementDate).toLocaleDateString('en-GB'),
        l.principal,
        `${l.interestRate}%`,
        l.interestAmount,
        l.totalPayable,
        l.principalPaid,
        l.interestPaid,
        l.totalPaid,
        l.totalBalance,
        new Date(l.dueDate).toLocaleDateString('en-GB'),
        l.status,
        l.approvalReference
      ]);
      row.height = 20;
      [4, 6, 7, 8, 9, 10, 11].forEach(colIdx => {
        row.getCell(colIdx).numFmt = '#,##0.00';
      });
      for (let c = 1; c <= 14; c++) row.getCell(c).border = cellBorder;
    });
    wsLoans.columns = [
      { width: 14 }, { width: 28 }, { width: 14 }, { width: 18 }, { width: 10 },
      { width: 16 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 },
      { width: 18 }, { width: 14 }, { width: 16 }, { width: 26 }
    ];

    // -------------------------------------------------------------
    // SHEET 5: Repayments
    // -------------------------------------------------------------
    const wsRep = workbook.addWorksheet('Repayments');
    wsRep.views = [{ showGridLines: true }];
    wsRep.addRow([
      'Repayment ID', 'Loan ID', 'Member Name', 'Date', 'Amount Paid (KSh)',
      'Principal Allocated (KSh)', 'Interest Allocated (KSh)', 'Payment Method', 'Reference', 'Recorded By'
    ]);
    styleHeaderRow(wsRep.getRow(1), 10);

    repayments.forEach(r => {
      const row = wsRep.addRow([
        `REP-${r.id}`,
        r.loanId,
        r.member.fullName,
        new Date(r.repaymentDate).toLocaleDateString('en-GB'),
        r.amount,
        r.principalPaid,
        r.interestPaid,
        r.paymentMethod,
        r.reference,
        r.recordedBy
      ]);
      row.height = 20;
      [5, 6, 7].forEach(colIdx => {
        row.getCell(colIdx).numFmt = '#,##0.00';
      });
      for (let c = 1; c <= 10; c++) row.getCell(c).border = cellBorder;
    });
    wsRep.columns = [
      { width: 16 }, { width: 14 }, { width: 28 }, { width: 14 }, { width: 18 },
      { width: 22 }, { width: 22 }, { width: 16 }, { width: 20 }, { width: 22 }
    ];

    // -------------------------------------------------------------
    // SHEET 6: Fund Transaction Register (Audit Ledger)
    // -------------------------------------------------------------
    const wsTxn = workbook.addWorksheet('Transaction Register');
    wsTxn.views = [{ showGridLines: true }];
    wsTxn.addRow([
      'Txn ID', 'Date', 'Type', 'Category', 'Amount (KSh)',
      'Member', 'Reference ID', 'Payment Ref', 'Description', 'Performed By', 'Reversed?'
    ]);
    styleHeaderRow(wsTxn.getRow(1), 11);

    transactions.forEach(t => {
      const row = wsTxn.addRow([
        t.id,
        new Date(t.transactionDate).toLocaleDateString('en-GB'),
        t.type,
        t.category,
        t.amount,
        t.memberName || '-',
        t.referenceId || '-',
        t.paymentReference || '-',
        t.description,
        t.performedBy,
        t.isReversed ? 'YES (REVERSED)' : 'NO'
      ]);
      row.height = 20;
      row.getCell(5).numFmt = '#,##0.00';
      if (t.isReversed) {
        row.font = { name: FONT_FAMILY, strike: true, color: { argb: 'FF999999' } };
      }
      for (let c = 1; c <= 11; c++) row.getCell(c).border = cellBorder;
    });
    wsTxn.columns = [
      { width: 26 }, { width: 14 }, { width: 20 }, { width: 16 }, { width: 18 },
      { width: 26 }, { width: 20 }, { width: 20 }, { width: 45 }, { width: 22 }, { width: 16 }
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `Dreamloom_Emergency_Welfare_Fund_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (err: any) {
    console.error('Error generating Emergency Fund Excel report:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}
