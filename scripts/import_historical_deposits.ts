import { prisma } from '../src/lib/prisma';
import { createAuditLog } from '../src/lib/audit';

interface PDFDepositRow {
  dateStr: string; // DD/MM/YYYY
  channel: string; // APP, MPESA, Transfer, USSD, EAZZY-FUNDS
  name: string;
  amount: number;
}

// Exactly extracted from Page 1 and Page 2 of uploaded PDF
export const PDF_RECORDS: PDFDepositRow[] = [
  // Page 1
  { dateStr: '25/02/2026', channel: 'APP', name: 'ELIJAH WAITARA GICHARI', amount: 600.00 },
  { dateStr: '06/03/2026', channel: 'MPESA', name: 'SIMON MEMIA WANJIRU', amount: 18900.00 },
  { dateStr: '06/03/2026', channel: 'MPESA', name: 'SIMON MEMIA WANJIRU', amount: 25.00 },
  { dateStr: '10/03/2026', channel: 'MPESA', name: 'SAMUEL KAMAU NGUURO', amount: 6000.00 },
  { dateStr: '13/03/2026', channel: 'MPESA', name: 'DANIEL KAMAU NJIRIRI', amount: 6025.00 },
  { dateStr: '13/03/2026', channel: 'APP', name: 'ELIJAH WAITARA GICHARI', amount: 26962.00 },
  { dateStr: '06/04/2026', channel: 'MPESA', name: 'DAVID WAINAINA KINYUA', amount: 12000.00 },
  { dateStr: '08/04/2026', channel: 'MPESA', name: 'SIMON MEMIA WANJIRU', amount: 12000.00 },
  { dateStr: '15/04/2026', channel: 'APP', name: 'ELECTRATECH SOLUTIONS', amount: 6000.00 },
  { dateStr: '16/04/2026', channel: 'USSD', name: 'BEATRICE NJOKI MUTHONI', amount: 12000.00 },
  { dateStr: '23/04/2026', channel: 'APP', name: 'DANTAP NETWORKING SERVICES', amount: 11500.00 },
  { dateStr: '23/04/2026', channel: 'APP', name: 'ELECTRATECH SOLUTIONS', amount: 6000.00 },
  { dateStr: '24/04/2026', channel: 'Transfer', name: 'DANIEL KAMAU NJIRIRI', amount: 6000.00 },
  { dateStr: '13/05/2026', channel: 'Transfer', name: 'SIMON MEMIA WANJIRU', amount: 6000.00 },
  { dateStr: '06/06/2026', channel: 'MPESA', name: 'DAVID WAINAINA KINYUA', amount: 7000.00 },
  { dateStr: '06/06/2026', channel: 'MPESA', name: 'SAMUEL KAMAU NGUURO', amount: 13900.00 },
  { dateStr: '09/06/2026', channel: 'MPESA', name: 'SIMON MEMIA WANJIRU', amount: 27800.00 },
  { dateStr: '21/06/2026', channel: 'APP', name: 'ELECTRATECH SOLUTIONS', amount: 7500.00 },
  { dateStr: '21/06/2026', channel: 'MPESA', name: 'DANIEL KAMAU NJIRIRI', amount: 10000.00 },
  { dateStr: '04/07/2026', channel: 'MPESA', name: 'DAVID WAINAINA KINYUA', amount: 7000.00 },
  { dateStr: '05/07/2026', channel: 'MPESA', name: 'SAMUEL KAMAU NGUURO', amount: 6000.00 },
  { dateStr: '08/07/2026', channel: 'MPESA', name: 'SIMON MEMIA WANJIRU', amount: 12000.00 },
  { dateStr: '14/07/2026', channel: 'MPESA', name: 'DANIEL KAMAU NJIRIRI', amount: 6000.00 },
  { dateStr: '14/07/2026', channel: 'APP', name: 'ELECTRATECH SOLUTIONS', amount: 6000.00 },
  { dateStr: '05/08/2026', channel: 'MPESA', name: 'DAVID WAINAINA KINYUA', amount: 6650.00 },
  { dateStr: '14/08/2026', channel: 'APP', name: 'ELECTRATECH SOLUTIONS', amount: 6000.00 },
  { dateStr: '05/09/2026', channel: 'MPESA', name: 'DAVID WAINAINA KINYUA', amount: 10400.00 },

  // Page 2
  { dateStr: '05/09/2026', channel: 'MPESA', name: 'SAMUEL KAMAU NGUURO', amount: 11000.00 },
  { dateStr: '14/09/2026', channel: 'EAZZY-FUNDS', name: 'MICHAEL KIARIE WANJIRU', amount: 7000.00 },
  { dateStr: '06/10/2026', channel: 'MPESA', name: 'DAVID WAINAINA KINYUA', amount: 7000.00 },
  { dateStr: '10/10/2026', channel: 'MPESA', name: 'SIMON MEMIA WANJIRU', amount: 12000.00 },
  { dateStr: '15/10/2026', channel: 'APP', name: 'ELIJAH WAITARA GICHARI', amount: 10000.00 },
  { dateStr: '22/10/2026', channel: 'Transfer', name: 'DANIEL KAMAU NJIRIRI', amount: 15000.00 },
  { dateStr: '22/10/2026', channel: 'APP', name: 'ELIJAH WAITARA GICHARI', amount: 10100.00 }
];

function parseDateDDMMYYYY(ddmmyyyy: string): Date {
  const [day, month, year] = ddmmyyyy.split('/').map(n => parseInt(n, 10));
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function mapPaymentMethod(channel: string): string {
  switch (channel.toUpperCase()) {
    case 'MPESA': return 'M-Pesa';
    case 'APP': return 'App Transfer (Equity Mobile)';
    case 'TRANSFER': return 'Bank Transfer';
    case 'USSD': return 'USSD (*247#)';
    case 'EAZZY-FUNDS': return 'Eazzy-Funds';
    default: return channel;
  }
}

export async function importHistoricalDeposits() {
  console.log('======================================================================');
  console.log('IMPORTING HISTORICAL FINANCIAL DEPOSITS FROM PDF');
  console.log('Account: Dreamloom Holding Limited (1760287177880)');
  console.log('======================================================================\n');

  // Load existing members for relationship linking
  const members = await prisma.member.findMany();
  console.log(`Found ${members.length} registered members in database.\n`);

  // Clean up any old verification test deposits to keep database clean
  await prisma.deposit.deleteMany({
    where: { reason: { contains: 'VERIFICATION_TEST' } }
  });

  let importedCount = 0;
  let skippedCount = 0;
  let totalImportedAmount = 0;

  for (let i = 0; i < PDF_RECORDS.length; i++) {
    const row = PDF_RECORDS[i];
    const txnIndex = String(i + 1).padStart(3, '0');
    const depositDate = parseDateDDMMYYYY(row.dateStr);
    const customId = `DEP-2026-H${txnIndex}`;
    const reference = `EQ1760287177880-${txnIndex}-${row.channel}`;

    // Resolve member if depositor is a registered member
    const matchedMember = members.find(m => {
      const cleanA = m.fullName.toLowerCase().replace(/\s+/g, ' ').trim();
      const cleanB = row.name.toLowerCase().replace(/\s+/g, ' ').trim();
      return cleanA === cleanB || cleanA.includes(cleanB) || cleanB.includes(cleanA);
    });

    const isMember = !!matchedMember;
    const transactionType = isMember ? 'Member Deposit' : 'Business Income';
    const paymentMethod = mapPaymentMethod(row.channel);
    const reason = `Historical Deposit via ${row.channel} into Equity Bank 1760287177880`;

    // Check if deposit with this reference or date+name+amount already exists to prevent duplicate imports
    const existing = await prisma.deposit.findFirst({
      where: {
        OR: [
          { reference: reference },
          {
            depositorName: row.name,
            amount: row.amount,
            date: depositDate,
          }
        ]
      }
    });

    if (existing) {
      skippedCount++;
      totalImportedAmount += existing.amount;
      continue;
    }

    const created = await prisma.deposit.create({
      data: {
        customId,
        date: depositDate,
        depositorName: row.name,
        amount: row.amount,
        transactionType,
        reason,
        reference,
        paymentMethod,
        receivingAccount: 'Equity Bank Kenya • A/C 1760287177880',
        memberId: matchedMember ? matchedMember.id : null,
        allocationType: isMember ? 'None' : 'Project',
        allocationRef: isMember ? null : 'Dreamloom Business Operations',
        reconciliationStatus: 'Reconciled',
        reconciledAt: new Date(),
        reconciledBy: 'Official Bank Statement Import',
        reconciliationNotes: 'Verified on Official Equity Bank Statement (A/C 1760287177880)',
        attachmentName: 'DEPOSITED_MONEY_TRANSACTIONS_1760287177880.pdf',
        createdByUser: 'simon@dreamloom.co.ke',
      }
    });

    importedCount++;
    totalImportedAmount += created.amount;
  }

  console.log('----------------------------------------------------------------------');
  console.log(`IMPORT SUMMARY:`);
  console.log(`Total Records in PDF:    ${PDF_RECORDS.length}`);
  console.log(`Newly Imported Records:  ${importedCount}`);
  console.log(`Already Present/Skipped: ${skippedCount}`);
  console.log(`Cumulative Deposit Sum:  KES ${totalImportedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log('----------------------------------------------------------------------\n');

  // Audit Log Entry for the batch import
  await createAuditLog({
    model: 'Deposits',
    action: 'Added',
    userEmail: 'simon@dreamloom.co.ke',
    userName: 'Simon Memia',
    member: 'Dreamloom Holding Limited',
    oldValues: {},
    newValues: {
      'Source File': 'DEPOSITED_MONEY_TRANSACTIONS_1760287177880.pdf',
      'Total Transactions': PDF_RECORDS.length,
      'Total Amount (KES)': totalImportedAmount,
      'Receiving Account': 'Equity Bank Kenya • A/C 1760287177880',
    },
    remarks: `Imported ${PDF_RECORDS.length} genuine historical deposits from official PDF statement (Account 1760287177880)`,
  });

  console.log('Audit Log recorded successfully.');
}

if (require.main === module) {
  importHistoricalDeposits()
    .then(() => prisma.$disconnect())
    .catch(err => {
      console.error('Import failed:', err);
      prisma.$disconnect();
    });
}
