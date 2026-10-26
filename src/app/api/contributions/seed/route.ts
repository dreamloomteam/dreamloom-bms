import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, records } = body;

    const clean = userEmail ? userEmail.toLowerCase().trim() : '';
    if (clean !== 'simon@dreamloom.co.ke' && clean !== 'elijah@dreamloom.co.ke') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ success: false, error: 'No records provided' }, { status: 400 });
    }

    let inserted = 0;
    for (const r of records) {
      await prisma.contribution.upsert({
        where: { customId: r.id },
        update: {
          monthYear: r.month,
          amount: Number(r.amount) || 0,
          unsettled: Number(r.unsettled) || 0,
          payout: Number(r.payout) || 0,
          remarks: r.notes || (r.member ? `Member: ${r.member}` : null),
        },
        create: {
          customId: r.id,
          monthYear: r.month,
          amount: Number(r.amount) || 0,
          unsettled: Number(r.unsettled) || 0,
          payout: Number(r.payout) || 0,
          remarks: r.notes || (r.member ? `Member: ${r.member}` : null),
        },
      });
      inserted++;
    }

    return NextResponse.json({ success: true, count: inserted });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
