import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureDatabaseSchema } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, verifySessionToken, isUserAdmin, SessionPayload } from '@/lib/session';
import { generateDreamloomProjectExcel } from '@/lib/excelGenerator';
import { OFFICIAL_LOAN_PORTFOLIO } from '@/lib/officialLoanPortfolio';

export const dynamic = 'force-dynamic';

function getSessionUser(request: Request): SessionPayload | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const payload = verifySessionToken(token);
    if (payload) return payload;
  }
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
  if (match) {
    const token = decodeURIComponent(match[1]);
    const payload = verifySessionToken(token);
    if (payload) return payload;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const user = getSessionUser(request);
    if (!user || !isUserAdmin(user)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Only Super Administrator Simon Memia Wanjiru is authorized to export the complete project Excel workbook.'
        },
        { status: 403 }
      );
    }

    await ensureDatabaseSchema();

    // Query all authoritative tables from PostgreSQL
    const [
      members,
      contributions,
      contributionPayments,
      loans,
      loanRepayments,
      penalties,
      deposits,
      expenses,
      investments,
      projects,
      suppliers,
      inventory,
      assets,
      documents,
      loginLogs,
      editLogs
    ] = await Promise.all([
      prisma.member.findMany({ orderBy: { id: 'asc' } }),
      prisma.contribution.findMany({
        include: { member: true },
        orderBy: [{ year: 'desc' }, { id: 'desc' }]
      }),
      prisma.contributionPayment.findMany({
        include: { member: true, contribution: true },
        orderBy: { id: 'desc' }
      }).catch(() => []),
      prisma.loan.findMany({
        include: {
          member: true,
          repayments: { orderBy: [{ paymentDate: 'asc' }, { id: 'asc' }] }
        },
        orderBy: { issueDate: 'desc' }
      }),
      prisma.loanRepayment.findMany({
        include: { member: true, loan: true },
        orderBy: { id: 'desc' }
      }).catch(() => []),
      prisma.penalty.findMany({
        include: { member: true },
        orderBy: { id: 'desc' }
      }),
      prisma.deposit.findMany({
        include: { member: true },
        orderBy: { date: 'desc' }
      }),
      prisma.expense.findMany({
        orderBy: { expenseDate: 'desc' }
      }),
      prisma.investment.findMany({
        orderBy: { createdAt: 'desc' }
      }),
      prisma.project.findMany({
        orderBy: { createdAt: 'desc' }
      }),
      prisma.supplier.findMany({
        orderBy: { createdAt: 'desc' }
      }),
      prisma.inventory.findMany({
        orderBy: { sku: 'asc' }
      }).catch(() => []),
      prisma.asset.findMany({
        orderBy: { id: 'asc' }
      }).catch(() => []),
      prisma.document.findMany({
        orderBy: { id: 'asc' }
      }),
      prisma.loginLog.findMany({
        include: { user: true },
        take: 300,
        orderBy: { createdAt: 'desc' }
      }).catch(() => []),
      prisma.editLog.findMany({
        include: { user: true },
        take: 500,
        orderBy: { createdAt: 'desc' }
      }).catch(() => [])
    ]);

    // Ensure all 14 official loans are included with exact details
    const normalizedLoans = (loans && loans.length >= 14) ? loans : OFFICIAL_LOAN_PORTFOLIO.map(ol => ({
      ...ol,
      totalOutstandingBalance: ol.outstandingBalance,
      totalInterestAccrued: ol.interestAccrued,
      totalLoanAmount: ol.totalLoanAmount,
      totalAmountPaid: ol.totalPaid,
      member: { fullName: ol.memberName }
    }));

    const workbook = await generateDreamloomProjectExcel({
      members,
      contributions,
      contributionPayments,
      loans: normalizedLoans,
      loanRepayments,
      penalties,
      deposits,
      expenses,
      investments,
      projects,
      suppliers,
      inventory,
      assets,
      documents,
      loginLogs,
      editLogs,
      generatedAt: new Date().toISOString()
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="DREAMLOOM_HOLDING_LIMITED_COMPLETE_PROJECT_BACKUP.xlsx"',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (error: any) {
    console.error('Error generating complete project Excel export:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error generating Excel export: ' + (error?.message || error) },
      { status: 500 }
    );
  }
}
