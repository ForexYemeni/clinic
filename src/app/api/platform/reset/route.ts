// ═══════════════════════════════════════════════════════════
// 👑 Platform Full Reset API (Prisma + PostgreSQL)
// Deletes ALL clinics and their data, keeps super_admin account
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest, verifyPassword } from '@/lib/auth';
import { createAuditLog, setPlatformConfig } from '@/lib/multi-tenant';

// DELETE: Full platform reset - deletes ALL clinics and data, keeps super_admin
export async function DELETE(request: NextRequest) {
  try {
    const auth = extractAuthFromRequest(request);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { superAdminPassword, confirmText } = body;

    if (confirmText !== 'حذف كامل المنصة') {
      return NextResponse.json({ error: 'نص التأكيد غير صحيح' }, { status: 400 });
    }
    if (!superAdminPassword) {
      return NextResponse.json({ error: 'يرجى إدخال كلمة المرور' }, { status: 400 });
    }

    const superAdmin = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!superAdmin) {
      return NextResponse.json({ error: 'حساب المدير غير موجود' }, { status: 401 });
    }
    const passwordValid = await verifyPassword(superAdminPassword, superAdmin.password);
    if (!passwordValid) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
    }

    // Get all clinic IDs
    const clinics = await prisma.clinic.findMany({ select: { id: true } });
    const clinicIds = clinics.map((c) => c.id);

    if (clinicIds.length > 0) {
      await prisma.$transaction([
        // Delete users (except super_admin) for each clinic
        prisma.user.deleteMany({ where: { clinicId: { in: clinicIds }, role: { not: 'super_admin' } } }),
        prisma.patient.deleteMany({ where: { clinicId: { in: clinicIds } } }),
        prisma.service.deleteMany({ where: { clinicId: { in: clinicIds } } }),
        prisma.visit.deleteMany({ where: { clinicId: { in: clinicIds } } }),
        prisma.invoice.deleteMany({ where: { clinicId: { in: clinicIds } } }),
        prisma.emergency.deleteMany({ where: { clinicId: { in: clinicIds } } }),
        prisma.notification.deleteMany({ where: { clinicId: { in: clinicIds } } }),
        prisma.salaryWithdrawal.deleteMany({ where: { clinicId: { in: clinicIds } } }),
        prisma.dataResetRequest.deleteMany({ where: { clinicId: { in: clinicIds } } }),
        // Delete all clinics
        prisma.clinic.deleteMany({}),
        // Delete all audit logs
        prisma.auditLog.deleteMany({}),
      ]);
    } else {
      // No clinics, just clear audit logs
      await prisma.auditLog.deleteMany({});
    }

    // Reset platform config
    await setPlatformConfig({
      superAdminCreated: true,
      version: '2.0.0',
      defaultClinicId: '',
    });

    try {
      await createAuditLog({
        clinicId: null,
        userId: auth.userId,
        action: 'platform_reset',
        details: 'Full platform reset - all clinics and data deleted',
        severity: 'critical',
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'تم حذف جميع بيانات المنصة بنجاح',
      deletedClinics: clinicIds.length,
    });
  } catch (error) {
    console.error('Platform reset error:', error);
    return NextResponse.json({ error: 'خطأ في إعادة تعيين المنصة' }, { status: 500 });
  }
}
