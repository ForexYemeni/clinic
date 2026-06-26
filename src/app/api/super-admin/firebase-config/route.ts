// ═══════════════════════════════════════════════════════════
// 🔧 Super Admin - Database Configuration API (Prisma)
// Legacy route name (formerly Firebase config). Now just reports DB status.
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest } from '@/lib/auth';

// GET: Get current database status
export async function GET(request: NextRequest) {
  try {
    const auth = extractAuthFromRequest(request);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const [userCount, clinicCount] = await Promise.all([
      prisma.user.count(),
      prisma.clinic.count(),
    ]);

    return NextResponse.json({
      configured: true,
      database: 'PostgreSQL (Neon)',
      stats: { users: userCount, clinics: clinicCount },
    });
  } catch (error) {
    console.error('DB config error:', error);
    return NextResponse.json({ error: 'خطأ في جلب إعدادات قاعدة البيانات' }, { status: 500 });
  }
}

// PUT: No-op (kept for backward compatibility)
export async function PUT(request: NextRequest) {
  try {
    const auth = extractAuthFromRequest(request);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }
    return NextResponse.json({ success: true, message: 'لا توجد إعدادات لقاعدة البيانات. النظام يستخدم PostgreSQL تلقائياً.' });
  } catch (error) {
    console.error('Update DB config error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث الإعدادات' }, { status: 500 });
  }
}
