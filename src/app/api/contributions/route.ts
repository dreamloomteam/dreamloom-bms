import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // adjust if path differs

export async function GET() {
  try {
    const contributions = await prisma.contribution.findMany();
    return NextResponse.json({ success: true, data: contributions });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }
  const body = await request.json();
  const { memberId, monthYear, amount, remarks } = body;
  try {
    const contribution = await prisma.contribution.create({
      data: { memberId, monthYear, amount, remarks },
    });
    // edit log
    await prisma.editLog.create({
      data: {
        userId: session.user.id,
        model: 'Contribution',
        action: 'create',
        recordId: contribution.id,
        changes: JSON.stringify({ after: contribution }),
      },
    });
    return NextResponse.json({ success: true, data: contribution }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
