import { prisma } from '../src/lib/prisma';

async function main() {
  const members = await prisma.member.findMany({
    include: {
      contributions: { select: { amount: true, unsettled: true } },
      loans: { select: { principal: true, paidAmount: true, status: true, totalPayable: true } },
    }
  });
  console.log('Sample Member from DB:', JSON.stringify(members[0], null, 2));

  const investments = await prisma.investment.findMany();
  console.log('Investments in DB:', JSON.stringify(investments, null, 2));

  const projects = await prisma.project.findMany();
  console.log('Projects in DB:', JSON.stringify(projects, null, 2));

  const suppliers = await prisma.supplier.findMany();
  console.log('Suppliers in DB:', JSON.stringify(suppliers, null, 2));

  const documents = await prisma.document.findMany();
  console.log('Documents in DB:', JSON.stringify(documents, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
