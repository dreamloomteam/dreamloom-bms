import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureDatabaseSchema } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session';
import { ALL_PAGE_KEYS, DEFAULT_PAGE_APPEARANCE } from '@/lib/appearance';

function getUserIdFromRequest(request: NextRequest): string {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const payload = verifySessionToken(token);
    if (payload?.email) {
      return payload.email.toLowerCase().trim();
    }
  } catch (e) {}

  const url = new URL(request.url);
  const paramUser = url.searchParams.get('userId');
  if (paramUser) {
    return paramUser.toLowerCase().trim();
  }

  return 'global_admin';
}

export async function GET(request: NextRequest) {
  try {
    await ensureDatabaseSchema();
    const userId = getUserIdFromRequest(request);
    const url = new URL(request.url);
    const pageKey = url.searchParams.get('pageKey');

    let rows: Array<{ pageKey: string; settings: any }> = [];
    try {
      if (pageKey) {
        rows = await prisma.$queryRaw<Array<{ pageKey: string; settings: any }>>`
          SELECT "pageKey", "settings" FROM "PageAppearance"
          WHERE "userId" = ${userId} AND "pageKey" = ${pageKey}
        `;
      } else {
        rows = await prisma.$queryRaw<Array<{ pageKey: string; settings: any }>>`
          SELECT "pageKey", "settings" FROM "PageAppearance"
          WHERE "userId" = ${userId}
        `;
      }
    } catch (dbErr) {
      console.warn('Could not read PageAppearance table (fallback to defaults):', dbErr);
    }

    const map: Record<string, any> = {};
    for (const r of rows) {
      map[r.pageKey] = typeof r.settings === 'string' ? JSON.parse(r.settings) : r.settings;
    }

    return NextResponse.json({
      success: true,
      userId,
      data: map,
    });
  } catch (err: any) {
    console.error('Error in GET /api/appearance:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch appearance settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseSchema();
    const userId = getUserIdFromRequest(request);
    const body = await request.json();
    const { action = 'save', pageKey, settings, fromPageKey } = body;

    if (!pageKey && action !== 'reset_all') {
      return NextResponse.json(
        { success: false, error: 'pageKey is required' },
        { status: 400 }
      );
    }

    if (action === 'save') {
      const payload = {
        ...(settings || DEFAULT_PAGE_APPEARANCE),
        lastUpdated: new Date().toISOString()
      };
      const jsonStr = JSON.stringify(payload);

      await prisma.$executeRawUnsafe(
        `INSERT INTO "PageAppearance" ("userId", "pageKey", "settings", "updatedAt")
         VALUES ($1, $2, $3::jsonb, NOW())
         ON CONFLICT ("userId", "pageKey")
         DO UPDATE SET "settings" = $3::jsonb, "updatedAt" = NOW()`,
        userId,
        pageKey,
        jsonStr
      );

      return NextResponse.json({
        success: true,
        message: `Appearance for "${pageKey}" saved successfully.`,
        data: payload
      });
    }

    if (action === 'apply_all') {
      const payload = {
        ...(settings || DEFAULT_PAGE_APPEARANCE),
        lastUpdated: new Date().toISOString()
      };
      const jsonStr = JSON.stringify(payload);

      for (const pk of ALL_PAGE_KEYS) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "PageAppearance" ("userId", "pageKey", "settings", "updatedAt")
           VALUES ($1, $2, $3::jsonb, NOW())
           ON CONFLICT ("userId", "pageKey")
           DO UPDATE SET "settings" = $3::jsonb, "updatedAt" = NOW()`,
          userId,
          pk,
          jsonStr
        );
      }

      return NextResponse.json({
        success: true,
        message: `Appearance settings successfully applied to all pages.`,
        data: payload
      });
    }

    if (action === 'reset_page') {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "PageAppearance" WHERE "userId" = $1 AND "pageKey" = $2`,
        userId,
        pageKey
      );

      return NextResponse.json({
        success: true,
        message: `Appearance for "${pageKey}" reset to default.`,
        data: DEFAULT_PAGE_APPEARANCE
      });
    }

    if (action === 'reset_all') {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "PageAppearance" WHERE "userId" = $1`,
        userId
      );

      return NextResponse.json({
        success: true,
        message: 'All pages reset to default appearance.'
      });
    }

    if (action === 'copy') {
      if (!fromPageKey) {
        return NextResponse.json(
          { success: false, error: 'fromPageKey is required for copy action' },
          { status: 400 }
        );
      }

      const rows = await prisma.$queryRaw<Array<{ settings: any }>>`
        SELECT "settings" FROM "PageAppearance"
        WHERE "userId" = ${userId} AND "pageKey" = ${fromPageKey}
        LIMIT 1
      `;

      const sourceSettings = rows[0]?.settings
        ? (typeof rows[0].settings === 'string' ? JSON.parse(rows[0].settings) : rows[0].settings)
        : DEFAULT_PAGE_APPEARANCE;

      const payload = {
        ...sourceSettings,
        lastUpdated: new Date().toISOString()
      };
      const jsonStr = JSON.stringify(payload);

      await prisma.$executeRawUnsafe(
        `INSERT INTO "PageAppearance" ("userId", "pageKey", "settings", "updatedAt")
         VALUES ($1, $2, $3::jsonb, NOW())
         ON CONFLICT ("userId", "pageKey")
         DO UPDATE SET "settings" = $3::jsonb, "updatedAt" = NOW()`,
        userId,
        pageKey,
        jsonStr
      );

      return NextResponse.json({
        success: true,
        message: `Appearance copied from "${fromPageKey}" to "${pageKey}".`,
        data: payload
      });
    }

    return NextResponse.json(
      { success: false, error: `Unknown action "${action}"` },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('Error in POST /api/appearance:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update appearance settings' },
      { status: 500 }
    );
  }
}
