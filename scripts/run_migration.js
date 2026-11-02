const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');

const prisma = new PrismaClient();

function parseDateSafe(val) {
  if (!val) return new Date();
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  const parsed = new Date(val);
  if (!isNaN(parsed.getTime())) return parsed;
  const clean = String(val).replace(/(\d+)(st|nd|rd|th)/i, '$1');
  const d2 = new Date(clean);
  if (!isNaN(d2.getTime())) return d2;
  return new Date();
}

async function migrate() {
  console.log('--- STARTING CONTROLLED DATA REPLACEMENT FROM NEW EXCEL WORKBOOK ---');
  const wbPath = 'C:/Users/micha/.gemini/antigravity/brain/9da59dd7-d23c-4f7e-b68a-7e63a5fb442a/.user_uploaded/media_1793635812298_3a7c6652.xlsx';
  const wb = xlsx.readFile(wbPath, { cellDates: true });

  // 1. Members
  const dirSheet = wb.Sheets['DIRECTORY'];
  const dirRows = xlsx.utils.sheet_to_json(dirSheet, { header: 1 });
  const rawMembers = [
    { fullName: 'Simon Memia Wanjiru', nationalId: '32242103', phone: '0719545283', role: 'Director / Member', email: 'simon@dreamloom.co.ke' },
    { fullName: 'David Wainaina Kinyua', nationalId: '39929859', phone: '0714382925', role: 'Member', email: 'david@dreamloom.co.ke' },
    { fullName: 'Elijah Waitara Gichari', nationalId: '34282968', phone: '0718963492', role: 'Member', email: 'elijah@dreamloom.co.ke' },
    { fullName: 'Samuel Kamau Nguuro', nationalId: '40085139', phone: '0113114471', role: 'Member', email: 'samuel@dreamloom.co.ke' },
    { fullName: 'Michael Kiarie Wanjiru', nationalId: '38927071', phone: '0748036136', role: 'Treasurer', email: 'michael@dreamloom.co.ke' },
    { fullName: 'Daniel Kamau Njiriri', nationalId: '36686858', phone: '0759818731', role: 'Member', email: 'daniel@dreamloom.co.ke' },
    { fullName: 'Beatrice Njoki Muthoni', nationalId: '40492876', phone: '0708665848', role: 'Member', email: 'beatrice@dreamloom.co.ke' },
  ];

  console.log('Upserting 7 official members...');
  const memberMap = new Map();
  for (const m of rawMembers) {
    const created = await prisma.member.upsert({
      where: { nationalId: m.nationalId },
      update: {
        fullName: m.fullName,
        phone: m.phone,
        email: m.email,
        role: m.role
      },
      create: m
    });
    memberMap.set(m.fullName, created.id);
  }
  console.log('All 7 members ready with IDs:', Array.from(memberMap.entries()));

  // 2. Clear old transactions to perform controlled replacement
  console.log('Clearing old business records (Loans, Penalties, Expenses, Contributions)...');
  await prisma.penalty.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.contribution.deleteMany();
  console.log('Old records cleared.');

  // 3. Loans
  const loanSheet = wb.Sheets['Active Loans'];
  const loanRows = xlsx.utils.sheet_to_json(loanSheet, { header: 1 });
  let loanCount = 0;
  for (let i = 3; i < loanRows.length; i++) {
    const r = loanRows[i];
    if (!r || !r[0] || !String(r[0]).startsWith('L')) continue;
    const rawId = String(r[0]).trim();
    // Unique ID handle for duplicate row like second L004
    const memberName = String(r[2] || '').trim();
    const memberId = memberMap.get(memberName);
    if (!memberId) {
      console.warn('Member not found for loan:', memberName);
      continue;
    }
    const issueDate = parseDateSafe(r[1]);
    const principal = Number(r[3]) || 0;
    const interest = Number(r[4]) || 0;
    const totalPayable = Number(r[5]) || (principal + interest);
    const paidAmount = Number(r[6]) || 0;
    const status = String(r[8] || (paidAmount >= totalPayable ? 'Settled' : 'Active')).trim();
    const clearedDate = r[9] ? parseDateSafe(r[9]) : null;

    // Use unique ID if L004 duplicate exists
    let loanId = rawId;
    if (i === 7 && rawId === 'L004') loanId = 'L004-B';

    await prisma.loan.create({
      data: {
        id: loanId,
        memberId,
        issueDate,
        principal,
        interest,
        totalPayable,
        paidAmount,
        status,
        clearedDate
      }
    });
    loanCount++;
  }
  console.log(`Imported ${loanCount} loans into database.`);

  // 4. Penalties
  const penSheet = wb.Sheets['PENALTIES '];
  const penRows = xlsx.utils.sheet_to_json(penSheet, { header: 1 });
  let penCount = 0;
  for (let i = 3; i < penRows.length; i++) {
    const r = penRows[i];
    if (!r || !r[0] || !String(r[0]).trim()) continue;
    const memberName = String(r[0]).trim();
    const memberId = memberMap.get(memberName);
    if (!memberId) continue;

    const dateLevied = parseDateSafe(r[1]);
    const paid = Number(r[3]) || 0;
    const reason = String(r[4] || 'Late payment + penalty');
    const status = String(r[5] || 'Active').trim();

    await prisma.penalty.create({
      data: {
        memberId,
        monthYear: dateLevied.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        dueDate: dateLevied,
        dateLevied,
        penaltyAmount: 500,
        paidAmount: paid > 0 ? 500 : 0,
        status,
        reason
      }
    });
    penCount++;
  }
  console.log(`Imported ${penCount} penalties into database.`);

  // 5. Expenses
  const expSheet = wb.Sheets['EXPENSES '];
  const expRows = xlsx.utils.sheet_to_json(expSheet, { header: 1 });
  let expCount = 0;
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

    await prisma.expense.create({
      data: {
        expenseDate: parseDateSafe(rawDate),
        description: desc || 'Operational Expense',
        amount: amt,
        expenseType: type,
        referenceDetails: ref
      }
    });
    expCount++;
  }
  console.log(`Imported ${expCount} expenses into database.`);

  // 6. Contributions & Payouts
  const contSheet = wb.Sheets['CONTRIBUTIONS '];
  const contRows = xlsx.utils.sheet_to_json(contSheet, { header: 1 });
  const months = [
    'Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026',
    'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026',
    'Oct 2026', 'Nov 2026', 'Dec 2026', 'Jan 2027', 'Feb 2027', 'Mar 2027',
    'Apr 2027', 'May 2027', 'Jun 2027'
  ];

  let mIndex = 0;
  let contCount = 0;
  let payoutCount = 0;
  let recordIdx = 1;

  for (let i = 3; i < contRows.length; i++) {
    const r = contRows[i];
    if (!r || !r[1]) continue;
    const col1 = String(r[1]).trim();
    if (col1.startsWith('Total (')) {
      mIndex++;
      continue;
    }
    if (col1.startsWith('GRAND TOTAL')) break;

    const cycleMonth = months[mIndex] || `Month-${mIndex}`;

    if (col1.startsWith('Mawega Payout')) {
      const payoutAmt = Number(r[3]) || 0;
      await prisma.contribution.create({
        data: {
          customId: `PAY-${String(recordIdx++).padStart(3, '0')}`,
          monthYear: cycleMonth,
          amount: 0,
          unsettled: 0,
          payout: payoutAmt,
          remarks: col1
        }
      });
      payoutCount++;
      continue;
    }

    // Individual contribution
    const memberName = col1;
    const memberId = memberMap.get(memberName) || null;
    const amt = r[3] !== undefined && r[3] !== null && r[3] !== '' ? Number(r[3]) : 0;
    const unsettled = Number(r[5]) || 0;
    const notes = r[8] ? String(r[8]).trim() : '';

    await prisma.contribution.create({
      data: {
        customId: `CNT-${String(recordIdx++).padStart(3, '0')}`,
        memberId,
        monthYear: cycleMonth,
        amount: amt,
        unsettled,
        payout: 0,
        remarks: notes ? `${notes} (Member: ${memberName})` : `Member: ${memberName}`
      }
    });
    contCount++;
  }
  console.log(`Imported ${contCount} individual contributions and ${payoutCount} payouts.`);

  console.log('--- REPLACEMENT COMPLETED SUCCESSFULLY ---');
}

migrate().catch(console.error).finally(() => prisma.$disconnect());
