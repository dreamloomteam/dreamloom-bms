const xlsx = require('xlsx');

function parseDateSafe(val) {
  if (!val) return new Date();
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  const parsed = new Date(val);
  if (!isNaN(parsed.getTime())) return parsed;
  // Handle strings like "15th Jan 2026", "2026-10-02", etc.
  const clean = String(val).replace(/(\d+)(st|nd|rd|th)/i, '$1');
  const d2 = new Date(clean);
  if (!isNaN(d2.getTime())) return d2;
  return new Date();
}

const wbPath = 'C:/Users/micha/.gemini/antigravity/brain/9da59dd7-d23c-4f7e-b68a-7e63a5fb442a/.user_uploaded/media_1793635812298_3a7c6652.xlsx';
const wb = xlsx.readFile(wbPath, { cellDates: true });

console.log('Sheets found:', wb.SheetNames);

// 1. Members
const dirSheet = wb.Sheets['DIRECTORY'];
const dirRows = xlsx.utils.sheet_to_json(dirSheet, { header: 1 });
const members = [];
for (let i = 3; i < dirRows.length; i++) {
  const r = dirRows[i];
  if (!r || !r[0]) continue;
  const name = String(r[0]).trim();
  if (members.some(m => m.fullName === name)) continue;
  members.push({
    fullName: name,
    nationalId: String(r[1] || ''),
    phone: String(r[2] || ''),
    role: String(r[3] || 'Member'),
    email: String(r[4] || '')
  });
}
console.log('Unique Members (' + members.length + '):', members.map(m => m.fullName));

// 2. Loans
const loanSheet = wb.Sheets['Active Loans'];
const loanRows = xlsx.utils.sheet_to_json(loanSheet, { header: 1 });
const loans = [];
for (let i = 3; i < loanRows.length; i++) {
  const r = loanRows[i];
  if (!r || !r[0] || !String(r[0]).startsWith('L')) continue;
  const id = String(r[0]).trim();
  const rawDate = r[1];
  const memberName = String(r[2] || '').trim();
  const principal = Number(r[3]) || 0;
  const interest = Number(r[4]) || 0;
  const totalLoan = Number(r[5]) || (principal + interest);
  const paid = Number(r[6]) || 0;
  const balance = Number(r[7]) || (totalLoan - paid);
  const status = String(r[8] || (balance <= 0 ? 'Settled' : 'Active')).trim();
  const clearedDate = r[9] ? String(r[9]) : null;

  loans.push({
    id,
    issueDate: parseDateSafe(rawDate).toISOString(),
    memberName,
    principal,
    interest,
    totalPayable: totalLoan,
    paidAmount: paid,
    balance,
    status,
    clearedDate
  });
}
console.log('Total Loans found:', loans.length);
console.log('Active loans:', loans.filter(l => l.status === 'Active'));

// 3. Penalties
const penSheet = wb.Sheets['PENALTIES '];
const penRows = xlsx.utils.sheet_to_json(penSheet, { header: 1 });
const penalties = [];
for (let i = 3; i < penRows.length; i++) {
  const r = penRows[i];
  if (!r || !r[0]) continue;
  const memberName = String(r[0]).trim();
  const dateLevied = parseDateSafe(r[1]).toISOString();
  const total = Number(r[2]) || 0;
  const paid = Number(r[3]) || 0;
  const reason = String(r[4] || 'Late payment + penalty');
  const status = String(r[5] || 'Active').trim();
  const paymentDate = r[6] ? parseDateSafe(r[6]).toISOString() : null;

  penalties.push({
    memberName,
    dateLevied,
    penaltyAmount: 500,
    paidAmount: paid > 0 ? 500 : 0,
    totalWithContrib: total,
    paidTotal: paid,
    reason,
    status,
    paymentDate
  });
}
console.log('Total Penalties found:', penalties.length);

// 4. Expenses
const expSheet = wb.Sheets['EXPENSES '];
const expRows = xlsx.utils.sheet_to_json(expSheet, { header: 1 });
const expenses = [];
for (let i = 3; i < expRows.length; i++) {
  const r = expRows[i];
  if (!r) continue;
  const desc = r[1] ? String(r[1]).trim() : '';
  const amt = Number(r[2]);
  if (!amt || isNaN(amt)) continue;
  if (desc === 'TOTAL EXPENSES') continue;
  const rawDate = r[0];
  const type = r[3] ? String(r[3]).trim() : 'Operational';
  const ref = r[4] ? String(r[4]).trim() : null;

  expenses.push({
    expenseDate: parseDateSafe(rawDate).toISOString(),
    description: desc || 'Expense / Transaction Fee',
    amount: amt,
    expenseType: type,
    referenceDetails: ref
  });
}
console.log('Total Expenses found:', expenses.length, 'Sum:', expenses.reduce((s, x) => s + x.amount, 0));

// 5. Contributions
const contSheet = wb.Sheets['CONTRIBUTIONS '];
const contRows = xlsx.utils.sheet_to_json(contSheet, { header: 1 });
const contributions = [];
const payouts = [];

let currentCycle = 'Oct-2025';
for (let i = 3; i < contRows.length; i++) {
  const r = contRows[i];
  if (!r || !r[1]) continue;
  const col1 = String(r[1]).trim();
  if (col1.startsWith('Total (')) {
    const match = col1.match(/Total \((.*?)\)/);
    if (match) currentCycle = match[1];
    continue;
  }
  if (col1.startsWith('Mawega Payout')) {
    payouts.push({
      title: col1,
      date: parseDateSafe(r[2]).toISOString(),
      amount: Number(r[3]) || 0,
      cycle: currentCycle
    });
    continue;
  }
  if (col1.startsWith('GRAND TOTAL')) break;

  contributions.push({
    lpi: r[0] === '☑',
    memberName: col1,
    date: parseDateSafe(r[2]).toISOString(),
    amount: r[3] !== undefined && r[3] !== null && r[3] !== '' ? Number(r[3]) : 0,
    penalty: Number(r[4]) || 0,
    unsettled: Number(r[5]) || 0,
    notes: r[8] ? String(r[8]).trim() : '',
    cycle: currentCycle
  });
}
console.log('Contributions count:', contributions.length, 'Sum:', contributions.reduce((s, c) => s + c.amount, 0));
console.log('Payouts count:', payouts.length, 'Sum:', payouts.reduce((s, p) => s + p.amount, 0));
