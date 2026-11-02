const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function generateData() {
  const members = await prisma.member.findMany({
    include: {
      contributions: true,
      loans: true,
      penalties: true
    },
    orderBy: { id: 'asc' }
  });

  const loans = await prisma.loan.findMany({
    include: { member: true },
    orderBy: { id: 'asc' }
  });

  const contributions = await prisma.contribution.findMany({
    include: { member: true },
    orderBy: { id: 'asc' }
  });

  const expenses = await prisma.expense.findMany({
    orderBy: { expenseDate: 'asc' }
  });

  const penalties = await prisma.penalty.findMany({
    include: { member: true },
    orderBy: { dateLevied: 'desc' }
  });

  const formattedMembers = members.map(m => {
    const totalCont = m.contributions.reduce((s, c) => s + c.amount, 0);
    const activeLoan = m.loans.filter(l => l.status === 'Active').reduce((s, l) => s + l.totalPayable, 0);
    const unsettled = m.contributions.reduce((s, c) => s + c.unsettled, 0);
    const netBal = totalCont - activeLoan;
    return {
      id: `MEM-00${m.id}`,
      name: m.fullName.split(' ')[0],
      fullName: m.fullName,
      nationalId: m.nationalId,
      phone: m.phone,
      role: m.role,
      email: m.email,
      totalContribution: totalCont,
      activeLoans: activeLoan,
      unsettledContributions: unsettled,
      netBalance: netBal,
      shares: ((totalCont / 471250) * 100).toFixed(2) + '%',
      status: 'Active',
      avatar: m.fullName.includes('Simon')
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
        : m.fullName.includes('Beatrice')
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
        : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      color: 'from-emerald-400 to-teal-400'
    };
  });

  const formattedLoans = loans.map(l => {
    return {
      id: l.id,
      issueDate: l.issueDate.toISOString().slice(0, 10),
      borrower: l.member?.fullName || 'Member',
      principal: l.principal,
      interest: l.interest,
      totalLoan: l.totalPayable,
      paid: l.paidAmount,
      balance: l.totalPayable - l.paidAmount,
      status: l.status,
      clearedDate: l.clearedDate ? l.clearedDate.toISOString().slice(0, 10) : '-'
    };
  });

  const formattedContributions = contributions.map(c => {
    return {
      id: c.customId || `CNT-${c.id}`,
      month: c.monthYear,
      member: c.member?.fullName || (c.remarks?.replace('Member: ', '') || 'Simon Memia Wanjiru'),
      amount: c.amount,
      unsettled: c.unsettled,
      payout: c.payout,
      notes: c.remarks || ''
    };
  });

  const formattedExpenses = expenses.map((e, idx) => {
    return {
      id: `EXP-${String(idx + 1).padStart(2, '0')}`,
      dbId: e.id,
      date: e.expenseDate.toISOString().slice(0, 10),
      description: e.description,
      amount: e.amount,
      category: e.expenseType,
      paidTo: e.referenceDetails || 'Operational Outflow'
    };
  });

  const formattedFines = penalties.map((p, idx) => {
    return {
      id: `FN-${String(idx + 1).padStart(2, '0')}`,
      dbId: p.id,
      date: p.dateLevied.toISOString().slice(0, 10),
      member: p.member?.fullName || 'Member',
      reason: p.reason,
      amount: p.penaltyAmount,
      status: p.status === 'Settled' ? 'Paid' : 'Active',
      datePaid: p.status === 'Settled' ? '2026-11-01' : '-'
    };
  });

  const exportData = {
    members: formattedMembers,
    loans: formattedLoans,
    contributions: formattedContributions,
    expenses: formattedExpenses,
    fines: formattedFines
  };

  fs.writeFileSync('src/lib/initialData.json', JSON.stringify(exportData, null, 2));
  console.log('Exported initialData.json with:');
  console.log({
    members: formattedMembers.length,
    loans: formattedLoans.length,
    contributions: formattedContributions.length,
    expenses: formattedExpenses.length,
    fines: formattedFines.length
  });
}

generateData().catch(console.error).finally(() => prisma.$disconnect());
