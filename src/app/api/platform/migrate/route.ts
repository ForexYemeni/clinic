// ═══════════════════════════════════════════════════════════
// 🔄 Platform Migration API (Prisma)
// Legacy: in the new Prisma-only system this is essentially a no-op.
// Reports migration as not needed (super_admin creation handled via /api/platform/setup).
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getPlatformConfig } from '@/lib/multi-tenant';

// GET: Check migration status - is a super_admin needed?
export async function GET() {
  try {
    const superAdminCount = await prisma.user.count({ where: { role: 'super_admin' } });
    const platformConfig = await getPlatformConfig();

    return NextResponse.json({
      superAdminExists: superAdminCount > 0,
      platformConfigured: platformConfig?.superAdminCreated || false,
      migrationNeeded: false, // Always false in Prisma-only system
    });
  } catch (error) {
    console.error('Migration check error:', error);
    return NextResponse.json({
      superAdminExists: true,
      platformConfigured: true,
      migrationNeeded: false,
    });
  }
}

// POST: Migration endpoint - returns error since this is no longer applicable
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'هذه العملية لم تعد متاحة. استخدم إعداد المنصة الجديد.' },
    { status: 400 }
  );
}
