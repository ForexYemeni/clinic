// ═══════════════════════════════════════════════════════════
// 👑 Platform Full Reset API
// Deletes ALL clinics and their data, keeps super_admin account
// ═══════════════════════════════════════════════════════════

import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest, verifyPassword } from '@/lib/auth';
import { createAuditLog } from '@/lib/multi-tenant';

// DELETE: Full platform reset - deletes ALL clinics and data, keeps super_admin
export async function DELETE(request: NextRequest) {
  try {
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

    const superAdminDoc = await adminDb.collection('users').doc(auth.userId).get();
    if (!superAdminDoc.exists) {
      return NextResponse.json({ error: 'حساب المدير غير موجود' }, { status: 401 });
    }
    const superAdminData = superAdminDoc.data();
    const passwordValid = await verifyPassword(superAdminPassword, superAdminData.password);
    if (!passwordValid) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
    }

    const BATCH_LIMIT = 450;

    // 1. Get all clinic IDs
    const clinicsSnapshot = await adminDb.collection('clinics').get();
    const clinicIds = clinicsSnapshot.docs.map(doc => doc.id);

    // 2. Delete all data for each clinic
    const collectionsToDelete = ['patients', 'services', 'visits', 'invoices', 'emergencies', 'notifications'];

    for (const clinicId of clinicIds) {
      // Delete all users for this clinic (except super_admin)
      const usersSnapshot = await adminDb.collection('users')
        .where('clinicId', '==', clinicId)
        .get();
      for (let i = 0; i < usersSnapshot.docs.length; i += BATCH_LIMIT) {
        const batch = adminDb.batch();
        const chunk = usersSnapshot.docs.slice(i, i + BATCH_LIMIT);
        chunk.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }

      // Delete operational collections
      for (const col of collectionsToDelete) {
        try {
          const snapshot = await adminDb.collection(col).where('clinicId', '==', clinicId).get();
          for (let i = 0; i < snapshot.docs.length; i += BATCH_LIMIT) {
            const batch = adminDb.batch();
            const chunk = snapshot.docs.slice(i, i + BATCH_LIMIT);
            chunk.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
          }
        } catch {}
      }
    }

    // 3. Delete all clinic documents
    for (let i = 0; i < clinicsSnapshot.docs.length; i += BATCH_LIMIT) {
      const batch = adminDb.batch();
      const chunk = clinicsSnapshot.docs.slice(i, i + BATCH_LIMIT);
      chunk.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    // 4. Delete all audit logs
    try {
      const auditSnapshot = await adminDb.collection('audit_logs').get();
      for (let i = 0; i < auditSnapshot.docs.length; i += BATCH_LIMIT) {
        const batch = adminDb.batch();
        const chunk = auditSnapshot.docs.slice(i, i + BATCH_LIMIT);
        chunk.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }
    } catch {}

    // 5. Reset platform config (keep superAdminCreated = true and version)
    await adminDb.collection('platform').doc('config').set({
      superAdminCreated: true,
      version: '2.0.0',
      resetAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

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
