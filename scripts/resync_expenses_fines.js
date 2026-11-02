const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

function parseDateSafe(val) {
  if (!val) return new Date();
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  const clean = String(val).replace(/(\d+)(st|nd|rd|th)/i, '$1');
  const d2 = new Date(clean);
  if (!isNaN(d2.getTime())) return d2;
  return new Date();
}

const exactPdfExpenses = [
  { date: '12-Dec-25', description: 'Paid to Mawega', amount: 50000.00, category: 'Land Purchase', paidTo: 'Land Payment Disbursement' },
  { date: '16-Dec-25', description: 'Paid to Mawega', amount: 35000.00, category: 'Land Purchase', paidTo: 'Land Payment Disbursement' },
  { date: '12-Jan-26', description: 'Paid to Mawega', amount: 35000.00, category: 'Land Purchase', paidTo: 'Land Payment Disbursement' },
  { date: '19-Feb-26', description: 'Paid to Mawega', amount: 39000.00, category: 'Land Purchase', paidTo: 'Land Payment Disbursement' },
  { date: '01-Mar-26', description: 'Paid to Mawega', amount: 35000.00, category: 'Land Purchase', paidTo: 'Land Payment Disbursement' },
  { date: '01-Apr-26', description: 'Paid to Mawega', amount: 35000.00, category: 'Land Purchase', paidTo: 'Land Payment Disbursement' },
  { date: '01-May-26', description: 'Paid to Mawega', amount: 35000.00, category: 'Land Purchase', paidTo: 'Land Payment Disbursement' },
  { date: '01-Jun-26', description: 'Paid to Mawega', amount: 36000.00, category: 'Land Purchase', paidTo: 'Land Payment Disbursement' },
  { date: '25-Feb-26', description: 'Bank Deposits for Account Opening', amount: 600.00, category: 'Bank Operations', paidTo: 'Initial Deposit Equity Bank' },
  { date: '14-Jan-26', description: 'Company stamp', amount: 1518.00, category: 'Administration', paidTo: 'Official Rubber Stamp' },
  { date: '14-Feb-26', description: 'Printing Company Documents (Qatar) + ksh300 transaction', amount: 2400.00, category: 'Administration', paidTo: 'Doc Printing & Transfer Fees' },
  { date: 'Up to Feb 20', description: 'Transaction Fee 2025 (ksh350) 2026 (ksh120)', amount: 470.00, category: 'Bank Charges', paidTo: 'Bank Transaction Fees' },
  { date: '17-Dec-25', description: 'Company Registration', amount: 15000.00, category: 'Legal & Compliance', paidTo: 'CR12 & Registration Fees' },
  { date: '23-Jan-26', description: 'Facilitation for Site Visit [Elijah & Daniel]', amount: 3000.00, category: 'Field Operations', paidTo: 'Land Site Inspection Allowance' },
  { date: '31-Jan-26', description: 'Facilitation to Mawega Office & Bank Opening Doc', amount: 1500.00, category: 'Field Operations', paidTo: 'Transport & Admin Facilitation' },
  { date: '31-Jan-26', description: 'Recent Transaction Fee', amount: 96.78, category: 'Bank Charges', paidTo: 'M-PESA / Bank Charges' },
  { date: '15th May 2026', description: 'Welfare to Beatrice', amount: 6000.00, category: 'Welfare Payout', paidTo: 'Member Welfare Grant' },
  { date: '15th May 2026', description: 'Transaction Fee', amount: 201.28, category: 'Bank Charges', paidTo: 'M-PESA / Bank Charges' },
  { date: '25th June 2026', description: 'Filing tax return + transaction Fee', amount: 514.00, category: 'Legal & Compliance', paidTo: 'KRA Annual Tax Filing' },
  { date: '5th July 2026', description: 'Transaction Fee', amount: 78.68, category: 'Bank Charges', paidTo: 'M-PESA / Bank Charges' },
  { date: '22nd August 2026', description: 'Transaction Fee', amount: 51.51, category: 'Bank Charges', paidTo: 'M-PESA / Bank Charges' },
  { date: '25th August 2026', description: 'Transaction sms fee', amount: 65.01, category: 'Bank Charges', paidTo: 'M-PESA / Bank Charges' },
  { date: '25th August 2026', description: 'Welfare to Simon', amount: 6000.00, category: 'Welfare Payout', paidTo: 'Member Welfare Grant' },
  { date: '24th sept 2026', description: 'Title processing fee', amount: 40000.00, category: 'Land Purchase', paidTo: 'Land Payment Disbursement' },
  { date: '24th sept 2026', description: 'Transaction Fee', amount: 59.76, category: 'Bank Charges', paidTo: 'M-PESA / Bank Charges' },
  { date: '26th Sept 2026', description: 'Facilitation to Mawega Office for titles works[Elijah]', amount: 1500.00, category: 'Field Operations', paidTo: 'Transport & Admin Facilitation' },
  { date: '26th Sept 2026', description: 'Facilitation to Mawega Office for titles works[Daniel]', amount: 1500.00, category: 'Field Operations', paidTo: 'Transport & Admin Facilitation' },
  { date: '26th Sept 2026', description: 'Transaction Fee', amount: 219.09, category: 'Bank Charges', paidTo: 'M-PESA / Bank Charges' },
  { date: '26th Sept 2026', description: 'Transaction Fee', amount: 51.51, category: 'Bank Charges', paidTo: 'M-PESA / Bank Charges' },
  { date: '26th Sept 2026', description: 'Transaction Fee', amount: 600.00, category: 'Bank Charges', paidTo: 'M-PESA / Bank Charges' },
  { date: '26th Sept 2026', description: 'Transaction Fee', amount: 59.76, category: 'Bank Charges', paidTo: 'M-PESA / Bank Charges' },
  { date: '26th Sept 2026', description: 'Transaction Fee', amount: 59.76, category: 'Bank Charges', paidTo: 'M-PESA / Bank Charges' },
  { date: '26th Sept 2026', description: 'Transaction Fee', amount: 76.51, category: 'Bank Charges', paidTo: 'M-PESA / Bank Charges' },
  { date: '26th Sept 2026', description: 'Transaction Fee', amount: 59.76, category: 'Bank Charges', paidTo: 'M-PESA / Bank Charges' },
  { date: '26th Sept 2026', description: 'Transaction Fee', amount: 65.01, category: 'Bank Charges', paidTo: 'M-PESA / Bank Charges' }
];

const exactPdfFines = [
  { member: 'Elijah Waitara Gichari', date: '2025-12-16', total: 6500, amount: 6500, penaltyAmount: 500, reason: 'Late payment + penalty', status: 'Settled', datePaid: '2026-11-02' },
  { member: 'Daniel Kamau Njiriri', date: '2025-12-16', total: 6500, amount: 6500, penaltyAmount: 500, reason: 'Late payment + penalty', status: 'Settled', datePaid: '-' },
  { member: 'Daniel Kamau Njiriri', date: '2026-04-16', total: 6500, amount: 6500, penaltyAmount: 500, reason: 'Late payment + penalty', status: 'Settled', datePaid: '2026-11-02' },
  { member: 'Beatrice Njoki Muthoni', date: '2026-04-16', total: 6500, amount: 6500, penaltyAmount: 500, reason: 'Late payment + penalty', status: 'Settled', datePaid: '2026-11-02' },
  { member: 'Daniel Kamau Njiriri', date: '2026-06-16', total: 7500, amount: 7500, penaltyAmount: 500, reason: 'Late payment + penalty', status: 'Settled', datePaid: '2026-11-02' },
  { member: 'Simon Memia Wanjiru', date: '2026-08-16', total: 6500, amount: 6500, penaltyAmount: 500, reason: 'Late payment + penalty', status: 'Settled', datePaid: '2026-11-02' },
  { member: 'Samuel Kamau Nguuro', date: '2026-08-16', total: 6500, amount: 0, penaltyAmount: 500, reason: 'Late payment + penalty', status: 'Active', datePaid: '-' },
  { member: 'Michael Kiarie Wanjiru', date: '2026-08-16', total: 6500, amount: 0, penaltyAmount: 500, reason: 'Late payment + penalty', status: 'Active', datePaid: '-' },
  { member: 'Daniel Kamau Njiriri', date: '2026-08-16', total: 6500, amount: 0, penaltyAmount: 500, reason: 'Late payment + penalty', status: 'Active', datePaid: '-' },
  { member: 'Simon Memia Wanjiru', date: '2026-09-16', total: 7500, amount: 0, penaltyAmount: 500, reason: 'Late payment + penalty', status: 'Active', datePaid: '-' },
  { member: 'Elijah Waitara Gichari', date: '2026-09-16', total: 7500, amount: 0, penaltyAmount: 500, reason: 'Late payment + penalty', status: 'Active', datePaid: '-' },
  { member: 'Daniel Kamau Njiriri', date: '2026-09-16', total: 7500, amount: 0, penaltyAmount: 500, reason: 'Late payment + penalty', status: 'Active', datePaid: '-' },
  { member: 'Samuel Kamau Nguuro', date: '2026-10-16', total: 6500, amount: 0, penaltyAmount: 500, reason: 'Late payment + penalty', status: 'Active', datePaid: '-' },
  { member: 'Daniel Kamau Njiriri', date: '2026-10-16', total: 6500, amount: 0, penaltyAmount: 500, reason: 'Late payment + penalty', status: 'Active', datePaid: '-' }
];

async function updateData() {
  console.log('--- RE-SYNCING EXPENSES & FINES TO EXACT PDF SPECIFICATION ---');

  // 1. Members Map
  const members = await prisma.member.findMany();
  const memberMap = new Map();
  members.forEach(m => memberMap.set(m.fullName, m.id));

  // 2. Clear old expenses and re-insert 35 exact expenses
  await prisma.expense.deleteMany();
  let expId = 1;
  const savedExpenses = [];
  for (const exp of exactPdfExpenses) {
    const created = await prisma.expense.create({
      data: {
        expenseDate: parseDateSafe(exp.date),
        description: exp.description,
        amount: exp.amount,
        expenseType: exp.category,
        referenceDetails: exp.paidTo
      }
    });
    savedExpenses.push({
      id: `EXP-${String(expId++).padStart(2, '0')}`,
      dbId: created.id,
      date: exp.date,
      description: exp.description,
      amount: exp.amount,
      category: exp.category,
      paidTo: exp.paidTo
    });
  }
  console.log(`Saved ${savedExpenses.length} expenses to Neon DB.`);

  // 3. Clear old penalties and re-insert 14 exact penalties
  await prisma.penalty.deleteMany();
  let fnId = 1;
  const savedFines = [];
  for (const pen of exactPdfFines) {
    const memId = memberMap.get(pen.member) || 1;
    const dateObj = parseDateSafe(pen.date);
    const created = await prisma.penalty.create({
      data: {
        memberId: memId,
        monthYear: dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        dueDate: dateObj,
        dateLevied: dateObj,
        penaltyAmount: pen.penaltyAmount,
        paidAmount: pen.status === 'Settled' ? pen.penaltyAmount : 0,
        status: pen.status,
        reason: pen.reason
      }
    });
    savedFines.push({
      id: `FN-${String(fnId++).padStart(2, '0')}`,
      dbId: created.id,
      member: pen.member,
      date: pen.date,
      totalWithContrib: pen.total,
      amount: pen.penaltyAmount,
      reason: pen.reason,
      status: pen.status === 'Settled' ? 'Paid' : 'Active',
      datePaid: pen.datePaid
    });
  }
  console.log(`Saved ${savedFines.length} penalties to Neon DB.`);

  // 4. Update initialData.json & initialData.ts
  const currentJson = JSON.parse(fs.readFileSync('src/lib/initialData.json', 'utf8'));
  currentJson.expenses = savedExpenses;
  currentJson.fines = savedFines;
  fs.writeFileSync('src/lib/initialData.json', JSON.stringify(currentJson, null, 2));

  fs.writeFileSync('src/lib/initialData.ts', `// Authoritative initial data from DREAMLOOM_Financial_System_Upgraded.xlsx
export const initialMembers = ${JSON.stringify(currentJson.members, null, 2)};

export const initialLoans = ${JSON.stringify(currentJson.loans, null, 2)};

export const initialContributions = ${JSON.stringify(currentJson.contributions, null, 2)};

export const initialExpenses = ${JSON.stringify(savedExpenses, null, 2)};

export const initialFines = ${JSON.stringify(savedFines, null, 2)};
`);

  console.log('--- DATA RESYNC COMPLETED SUCCESSFULLY ---');
}

updateData().catch(console.error).finally(() => prisma.$disconnect());
