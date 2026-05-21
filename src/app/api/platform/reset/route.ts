// ═══════════════════════════════════════════════════════════
// 👑 Platform Full Reset API
// Deletes ALL clinics and their data, keeps super_admin account
// ═══════════════════════════════════════════════════════════

import dbConnect from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest, verifyPassword } from '@/lib/auth';
import { createAuditLog, setPlatformConfig } from '@/lib/multi-tenant';
import User from '@/models/User';
import Clinic from '@/models/Clinic';
import Patient from '@/models/Patient';
import Service from '@/models/Service';
import Visit from '@/models/Visit';
import Invoice from '@/models/Invoice';
import Emergency from '@/models/Emergency';
import Notification from '@/models/Notification';
import AuditLog from '@/models/AuditLog';

// DELETE: Full platform reset - deletes ALL clinics and data, keeps super_admin
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const auth = extractAuthFromRequest(request);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { superAdminPassword, confirmText } = body;

    // Require confirmation text
    if (confirmText !== 'حذف كامل المنصة') {
      return NextResponse.json({ error: 'نص التأكيد غير صحيح' }, { status: 400 });
    }

    // Verify super_admin password
    if (!superAdminPassword) {
      return NextResponse.json({ error: 'يرجى إدخال كلمة المرور' }, { status: 400 });
    }

    const superAdminDoc = await User.findById(auth.userId).lean();
    if (superAdminDoc === null) {
      return NextResponse.json({ error: 'حساب المدير غير موجود' }, { status: 401 });
    }
    const superAdminData = superAdminDoc;
    const passwordValid = await verifyPassword(superAdminPassword, superAdminData.password);
    if (!passwordValid) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
    }

    // 1. Get all clinic IDs
    const clinicsResults = await Clinic.find({}).lean();
    const clinicIds = clinicsResults.map(doc => doc._id.toString());

    // 2. Delete all data for each clinic
    for (const clinicId of clinicIds) {
      // Delete all users for this clinic (except super_admin)
      await User.deleteMany({ clinicId: clinicId, role: { $ne: 'super_admin' } });

      // Delete operational collections
      await Promise.all([
        Patient.deleteMany({ clinicId }),
        Service.deleteMany({ clinicId }),
        Visit.deleteMany({ clinicId }),
        Invoice.deleteMany({ clinicId }),
        Emergency.deleteMany({ clinicId }),
        Notification.deleteMany({ clinicId }),
      ]);
    }

    // 3. Delete all clinic documents
    await Clinic.deleteMany({});

    // 4. Delete all audit logs
    try {
      await AuditLog.deleteMany({});
    } catch {}

    // 5. Reset platform config (keep superAdminCreated = true and version)
    await setPlatformConfig({
      superAdminCreated: true,
      version: '2.0.0',
    } as any);

    // Log the reset (this will be the only audit log remaining)
    await createAuditLog({
      clinicId: null,
      userId: auth.userId,
      action: 'full_platform_reset',
      details: `Full platform reset executed. Deleted ${clinicIds.length} clinics and all associated data.`,
      severity: 'critical',
    });

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
