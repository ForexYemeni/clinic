// ═══════════════════════════════════════════════════════════
// ❤️ Health Check API (Prisma + PostgreSQL)
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
import { NextResponse } from 'next/server';

// GET: Health check - test database connection and data status
export async function GET() {
  const result: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    database: 'unknown',
  };

  try {
    const userCount = await prisma.user.count();
    const clinicCount = await prisma.clinic.count();

    result.database = 'connected';
    result.users = userCount;
    result.clinics = clinicCount;
    result.hasSetup = clinicCount > 0;

    if (clinicCount > 0) {
      const clinic = await prisma.clinic.findFirst();
      result.clinicName = clinic?.name || '';
      result.setupComplete = clinic?.setupComplete || false;
    }

    if (userCount > 0) {
      const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
      result.hasAdmin = !!adminUser;
      if (adminUser) result.adminPhone = adminUser.phone;
    }
  } catch (error) {
    result.database = 'error';
    result.error = error instanceof Error ? error.message : 'Unknown error';
  }

  return NextResponse.json(result);
}
