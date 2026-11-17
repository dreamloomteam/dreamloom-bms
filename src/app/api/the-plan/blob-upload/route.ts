import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken, isUserAdmin } from '@/lib/session';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Strict Server-Side Authentication
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const payload = verifySessionToken(token);
  const isAdmin = payload && isUserAdmin(payload);

  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden: Only Simon Memia Wanjiru (simon@dreamloom.co.ke) is authorized to generate upload tokens.' },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        return {
          allowedContentTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
          maximumSizeInBytes: 10 * 1024 * 1024, // 10 MB limit
          tokenPayload: JSON.stringify({
            userEmail: payload.email,
            clientPayload,
          }),
        };
      },
      onUploadCompleted: async () => {
        // Blob upload verified
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
