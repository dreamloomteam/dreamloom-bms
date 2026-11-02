const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function backup() {
  console.log('Backing up current database...');
  const users = await prisma.user.findMany();
  const members = await prisma.member.findMany();
  const contributions = await prisma.contribution.findMany();
  const loans = await prisma.loan.findMany();
  const expenses = await prisma.expense.findMany();
  const penalties = await prisma.penalty.findMany();
  const loginLogs = await prisma.loginLog.findMany();
  const editLogs = await prisma.editLog.findMany();

  const backupData = {
    timestamp: new Date().toISOString(),
    users,
    members,
    contributions,
    loans,
    expenses,
    penalties,
    loginLogs,
    editLogs
  };

  const filename = `db_backup_${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(backupData, null, 2));
  console.log(`Backup saved successfully to ${filename}`);
  console.log('Backup summary:', {
    users: users.length,
    members: members.length,
    contributions: contributions.length,
    loans: loans.length,
    expenses: expenses.length,
    penalties: penalties.length
  });
}

backup().catch(console.error).finally(() => prisma.$disconnect());
