const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function backup() {
  console.log('Backing up current database...');
  const users = await prisma.user.findMany();
  const members = await prisma.member.findMany({ orderBy: { id: 'asc' } });
  const contributions = await prisma.contribution.findMany({ orderBy: { id: 'asc' } });
  const contributionPayments = await prisma.contributionPayment.findMany({ orderBy: { id: 'asc' } });
  const loans = await prisma.loan.findMany({ orderBy: { id: 'asc' } });
  const loanRepayments = await prisma.loanRepayment.findMany({ orderBy: { id: 'asc' } });
  const expenses = await prisma.expense.findMany({ orderBy: { id: 'asc' } });
  const penalties = await prisma.penalty.findMany({ orderBy: { id: 'asc' } });
  const paymentTransactions = await prisma.paymentTransaction.findMany({ orderBy: { id: 'asc' } });
  const deposits = await prisma.deposit.findMany({ orderBy: { id: 'asc' } });
  const investments = await prisma.investment.findMany({ orderBy: { id: 'asc' } });
  const projects = await prisma.project.findMany({ orderBy: { id: 'asc' } });
  const suppliers = await prisma.supplier.findMany({ orderBy: { id: 'asc' } });
  const documents = await prisma.document.findMany({ orderBy: { id: 'asc' } });
  const assets = await prisma.asset.findMany({ orderBy: { id: 'asc' } });
  const loginLogs = await prisma.loginLog.findMany({ orderBy: { id: 'asc' } });
  const editLogs = await prisma.editLog.findMany({ orderBy: { id: 'asc' } });

  const backupData = {
    timestamp: new Date().toISOString(),
    users,
    members,
    contributions,
    contributionPayments,
    loans,
    loanRepayments,
    expenses,
    penalties,
    paymentTransactions,
    deposits,
    investments,
    projects,
    suppliers,
    documents,
    assets,
    loginLogs,
    editLogs
  };

  const filename = `db_backup_${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(backupData, null, 2));
  fs.writeFileSync('db_backup_production_ready.json', JSON.stringify(backupData, null, 2));
  console.log(`Backup saved successfully to ${filename} and db_backup_production_ready.json`);
  console.log('Backup summary:', {
    users: users.length,
    members: members.length,
    contributions: contributions.length,
    contributionPayments: contributionPayments.length,
    loans: loans.length,
    loanRepayments: loanRepayments.length,
    expenses: expenses.length,
    penalties: penalties.length,
    deposits: deposits.length,
    investments: investments.length,
    projects: projects.length,
    suppliers: suppliers.length,
    documents: documents.length,
    assets: assets.length,
    editLogs: editLogs.length
  });
}

backup().catch(console.error).finally(() => prisma.$disconnect());
