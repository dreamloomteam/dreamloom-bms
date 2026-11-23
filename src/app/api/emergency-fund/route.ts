import { NextResponse } from 'next/server';
import {
  getEmergencyFundData,
  updateFundSettings,
  recordFundAllocation,
  submitEmergencyLoanApplication,
  approveEmergencyLoanApplication,
  disburseEmergencyLoan,
  recordEmergencyLoanRepayment,
  reverseFundTransaction
} from '@/lib/emergencyFundDb';
import { SESSION_COOKIE_NAME, verifySessionToken, isUserAdmin, SessionPayload } from '@/lib/session';

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

// GET /api/emergency-fund
export async function GET(request: Request) {
  try {
    const user = getSessionUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const data = await getEmergencyFundData();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Error in GET /api/emergency-fund:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error while retrieving Emergency Fund data.' },
      { status: 500 }
    );
  }
}

// POST /api/emergency-fund
export async function POST(request: Request) {
  try {
    const user = getSessionUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action;

    switch (action) {
      case 'update_settings': {
        const updated = await updateFundSettings(body.data, user);
        return NextResponse.json({ success: true, data: updated, message: 'Settings updated successfully.' });
      }

      case 'record_allocation': {
        const allocation = await recordFundAllocation(body.data, user);
        return NextResponse.json({ success: true, data: allocation, message: 'Allocation recorded successfully.' });
      }

      case 'submit_application': {
        const application = await submitEmergencyLoanApplication(body.data, user);
        return NextResponse.json({
          success: true,
          data: application,
          message: 'Emergency loan application submitted successfully.'
        });
      }

      case 'approve_application': {
        const result = await approveEmergencyLoanApplication(body.data, user);
        return NextResponse.json({
          success: true,
          data: result,
          message: `Application ${body.data.decision.toLowerCase()} successfully.`
        });
      }

      case 'disburse_loan': {
        const result = await disburseEmergencyLoan(body.data, user);
        return NextResponse.json({
          success: true,
          data: result,
          message: `Emergency Loan ${result.loan.id} disbursed successfully.`
        });
      }

      case 'record_repayment': {
        const result = await recordEmergencyLoanRepayment(body.data, user);
        return NextResponse.json({
          success: true,
          data: result,
          message: `Repayment recorded successfully for Loan ${result.loan.id}.`
        });
      }

      case 'reverse_transaction': {
        const result = await reverseFundTransaction(body.data, user);
        return NextResponse.json({
          success: true,
          data: result,
          message: `Transaction reversed successfully.`
        });
      }

      default:
        return NextResponse.json({ success: false, error: `Unsupported action: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    console.error('Error in POST /api/emergency-fund:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Operation failed.' },
      { status: 400 }
    );
  }
}
