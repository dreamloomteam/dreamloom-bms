import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('ChangeMe123!', 10);

  // 1. Create Initial Administrator
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: hashedPassword,
      fullName: 'Simon Memia Wanjiru',
      role: 'Administrator',
      mustChangePass: false,
    },
  });

  // 2. Official Member Directory Setup (From Official PDF Register)
  const officialMembers = [
    { fullName: 'Simon Memia Wanjiru', nationalId: '32242103', phone: '0719545283', email: 'simon@dreamloom.co.ke', role: 'Director / Member' },
    { fullName: 'David Wainaina Kinyua', nationalId: '39929859', phone: '0714382925', email: 'david@dreamloom.co.ke', role: 'Member' },
    { fullName: 'Elijah Waitara Gichari', nationalId: '34282968', phone: '0718963492', email: 'elijah@dreamloom.co.ke', role: 'Member' },
    { fullName: 'Samuel Kamau Nguuro', nationalId: '40085139', phone: '0113114471', email: 'samuel@dreamloom.co.ke', role: 'Member' },
    { fullName: 'Michael Kiarie Wanjiru', nationalId: '38927071', phone: '0748036136', email: 'michael@dreamloom.co.ke', role: 'Treasurer' },
    { fullName: 'Daniel Kamau Njiriri', nationalId: '36686858', phone: '0759818731', email: 'daniel@dreamloom.co.ke', role: 'Member' },
    { fullName: 'Beatrice Njoki Muthoni', nationalId: '40492876', phone: '0708665848', email: 'beatrice@dreamloom.co.ke', role: 'Member' },
  ];

  for (const m of officialMembers) {
    await prisma.member.upsert({
      where: { nationalId: m.nationalId },
      update: {
        fullName: m.fullName,
        phone: m.phone,
        email: m.email,
        role: m.role,
      },
      create: m,
    });
  }

  console.log('Database successfully seeded with official Dreamloom members and registers!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
