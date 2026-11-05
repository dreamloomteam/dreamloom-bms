import { prisma } from '../src/lib/prisma';

async function main() {
  const members = await prisma.member.count();
  const contributions = await prisma.contribution.count();
  const deposits = await prisma.deposit.count();
  const loans = await prisma.loan.count();
  const penalties = await prisma.penalty.count();
  const expenses = await prisma.expense.count();
  const investments = await prisma.investment.count();
  const projects = await prisma.project.count();
  const suppliers = await prisma.supplier.count();
  const documents = await prisma.document.count();
  const auditLogs = await prisma.editLog.count();
  const loginLogs = await prisma.loginLog.count();

  console.log(JSON.stringify({
    members,
    contributions,
    deposits,
    loans,
    penalties,
    expenses,
    investments,
    projects,
    suppliers,
    documents,
    auditLogs,
    loginLogs
  }, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
