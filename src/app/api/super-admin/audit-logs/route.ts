// ═══════════════════════════════════════════════════════════
// 📋 Super Admin - Audit Logs API (Prisma + PostgreSQL)
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest } from '@/lib/auth';

// GET: List all audit logs (super admin only)
export async function GET(request: NextRequest) {
  try {
    const auth = extractAuthFromRequest(request);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const severity = searchParams.get('severity');

    const where: any = {};
    if (severity && ['info', 'warning', 'critical'].includes(severity)) {
      where.severity = severity;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Audit logs list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب سجلات التدقيق' }, { status: 500 });
  }
}
