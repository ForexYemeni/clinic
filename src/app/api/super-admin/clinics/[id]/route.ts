// ═══════════════════════════════════════════════════════════
// 👑 Super Admin - Single Clinic Management API
// Update, suspend, activate, delete individual clinics
// ═══════════════════════════════════════════════════════════

import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest, verifyPassword } from '@/lib/auth';
import { getClinicById, setClinicSubscription, createAuditLog, checkClinicSubscription } from '@/lib/multi-tenant';
import { DEFAULT_SERVICES } from '@/lib/services-data';

// GET: Get single clinic details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = extractAuthFromRequest(request);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { id } = await params;
    const clinic = await getClinicById(id);
    if (!clinic) {
      return NextResponse.json({ error: 'العيادة غير موجودة' }, { status: 404 });
    }

    // Get additional stats
    const [usersSnapshot, patientsSnapshot, servicesSnapshot, invoicesSnapshot] = await Promise.all([
      adminDb.collection('users').where('clinicId', '==', id).get().catch(() => ({ size: 0, docs: [] })),
      adminDb.collection('patients').where('clinicId', '==', id).limit(5000).get().catch(() => ({ size: 0, docs: [] })),
      adminDb.collection('services').where('clinicId', '==', id).get().catch(() => ({ size: 0, docs: [] })),
      adminDb.collection('invoices').where('clinicId', '==', id).get().catch(() => ({ size: 0, docs: [] })),
    ]);

    // Calculate total revenue
    let totalRevenue = 0;
    if (invoicesSnapshot.docs) {
      invoicesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        totalRevenue += data.paid || 0;
      });
    }

    // Get users list
    const users = usersSnapshot.docs ? usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      password: undefined, // Never expose passwords
    })) : [];

    // Subscription status
    const subCheck = await checkClinicSubscription(id);

    return NextResponse.json({
      ...clinic,
      stats: {
        userCount: usersSnapshot.size || 0,
        patientCount: patientsSnapshot.size || 0,
        serviceCount: servicesSnapshot.size || 0,
        invoiceCount: invoicesSnapshot.size || 0,
        totalRevenue,
      },
      users,
      subscriptionCheck: subCheck,
    });
  } catch (error) {
    console.error('Get clinic error:', error);
    return NextResponse.json({ error: 'خطأ في جلب بيانات العيادة' }, { status: 500 });
  }
}

// PUT: Update clinic (subscription, status, settings)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = extractAuthFromRequest(request);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, ...data } = body;

    const clinic = await getClinicById(id);
    if (!clinic) {
      return NextResponse.json({ error: 'العيادة غير موجودة' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };

    switch (action) {
      case 'extend_subscription': {
        // Extend subscription by N days
        const days = data.days || 30;
        const type = data.subscriptionType || 'monthly';
        const subscription = await setClinicSubscription(id, { type, days });
        return NextResponse.json({ success: true, subscription });
      }

      case 'suspend': {
        updateData.active = false;
        updateData['subscription.status'] = 'suspended';
        await adminDb.collection('clinics').doc(id).update(updateData);
        await createAuditLog({ clinicId: id, userId: auth.userId, action: 'suspend_clinic', details: `Suspended clinic: ${clinic.name}` });
        return NextResponse.json({ success: true, status: 'suspended' });
      }

      case 'activate': {
        const currentSub = clinic.subscription;
        const days = data.days || 30;
        const subscription = await setClinicSubscription(id, {
          type: currentSub?.type || 'monthly',
          days,
          status: 'active',
        });
        await createAuditLog({ clinicId: id, userId: auth.userId, action: 'activate_clinic', details: `Activated clinic: ${clinic.name}` });
        return NextResponse.json({ success: true, subscription });
      }

      case 'update_settings': {
        // Update clinic settings (name, phone, address, etc.)
        if (data.name) updateData.name = data.name;
        if (data.phone) updateData.phone = data.phone;
        if (data.address) updateData.address = data.address;
        if (data.description) updateData.description = data.description;
        if (data.logo !== undefined) updateData.logo = data.logo;
        if (data.primaryColor) updateData.primaryColor = data.primaryColor;
        await adminDb.collection('clinics').doc(id).update(updateData);
        return NextResponse.json({ success: true });
      }

      case 'reset_data': {
        // Reset all clinic data but keep the clinic and admin user
        // Requires super_admin password verification
        if (!data.superAdminPassword) {
          return NextResponse.json({ error: 'يرجى إدخال كلمة المرور' }, { status: 400 });
        }

        // Verify super_admin password
        const superAdminDoc = await adminDb.collection('users').doc(auth.userId).get();
        if (!superAdminDoc.exists) {
          return NextResponse.json({ error: 'حساب المدير غير موجود' }, { status: 401 });
        }
        const superAdminData = superAdminDoc.data();
        const passwordValid = await verifyPassword(data.superAdminPassword, superAdminData.password);
        if (!passwordValid) {
          return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
        }

        const BATCH_LIMIT = 450;
        const collectionsToDelete = ['patients', 'visits', 'invoices', 'emergencies', 'notifications'];

        // Delete nurses (keep admin)
        const nursesSnapshot = await adminDb.collection('users')
          .where('clinicId', '==', id)
          .where('role', '==', 'nurse')
          .get();
        for (let i = 0; i < nursesSnapshot.docs.length; i += BATCH_LIMIT) {
          const batch = adminDb.batch();
          const chunk = nursesSnapshot.docs.slice(i, i + BATCH_LIMIT);
          chunk.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }

        // Delete operational data
        for (const col of collectionsToDelete) {
          try {
            const snapshot = await adminDb.collection(col).where('clinicId', '==', id).get();
            for (let i = 0; i < snapshot.docs.length; i += BATCH_LIMIT) {
              const batch = adminDb.batch();
              const chunk = snapshot.docs.slice(i, i + BATCH_LIMIT);
              chunk.forEach(doc => batch.delete(doc.ref));
              await batch.commit();
            }
          } catch {}
        }

        // Delete old services and re-seed defaults
        try {
          const servicesSnapshot = await adminDb.collection('services').where('clinicId', '==', id).get();
          for (let i = 0; i < servicesSnapshot.docs.length; i += BATCH_LIMIT) {
            const batch = adminDb.batch();
            const chunk = servicesSnapshot.docs.slice(i, i + BATCH_LIMIT);
            chunk.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
          }
        } catch {}

        // Re-seed default services
        const servicesWithClinicId = DEFAULT_SERVICES.map(s => ({
          ...s,
          clinicId: id,
          active: true,
          status: 'active',
          createdAt: new Date().toISOString(),
        }));
        for (let i = 0; i < servicesWithClinicId.length; i += BATCH_LIMIT) {
          const batch = adminDb.batch();
          const chunk = servicesWithClinicId.slice(i, i + BATCH_LIMIT);
          chunk.forEach(service => {
            const ref = adminDb.collection('services').doc();
            batch.set(ref, service);
          });
          await batch.commit();
        }

        await createAuditLog({
          clinicId: id,
          userId: auth.userId,
          action: 'reset_clinic_data',
          details: `Reset all data for clinic: ${clinic.name}`,
          severity: 'critical',
        });

        return NextResponse.json({ success: true, message: 'تم إعادة تعيين بيانات العيادة بنجاح' });
      }

      default:
        return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
    }
  } catch (error) {
    console.error('Update clinic error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث العيادة' }, { status: 500 });
  }
}

// DELETE: Delete a clinic and all its data
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = extractAuthFromRequest(request);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { id } = await params;
    const clinic = await getClinicById(id);
    if (!clinic) {
      return NextResponse.json({ error: 'العيادة غير موجودة' }, { status: 404 });
    }

    // Delete all data associated with this clinic
    const BATCH_LIMIT = 450;
    const collectionsToDelete = ['patients', 'services', 'visits', 'invoices', 'emergencies', 'notifications'];

    // Delete clinic users (except super_admin)
    const usersSnapshot = await adminDb.collection('users').where('clinicId', '==', id).get();
    for (let i = 0; i < usersSnapshot.docs.length; i += BATCH_LIMIT) {
      const batch = adminDb.batch();
      const chunk = usersSnapshot.docs.slice(i, i + BATCH_LIMIT);
      chunk.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    // Delete operational collections
    for (const col of collectionsToDelete) {
      try {
        const snapshot = await adminDb.collection(col).where('clinicId', '==', id).get();
        for (let i = 0; i < snapshot.docs.length; i += BATCH_LIMIT) {
          const batch = adminDb.batch();
          const chunk = snapshot.docs.slice(i, i + BATCH_LIMIT);
          chunk.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }
      } catch {}
    }

    // Delete clinic document
    await adminDb.collection('clinics').doc(id).delete();

    await createAuditLog({ clinicId: null, userId: auth.userId, action: 'delete_clinic', details: `Deleted clinic: ${clinic.name}`, severity: 'critical' });

    return NextResponse.json({ success: true, message: 'تم حذف العيادة وجميع بياناتها' });
  } catch (error) {
    console.error('Delete clinic error:', error);
    return NextResponse.json({ error: 'خطأ في حذف العيادة' }, { status: 500 });
  }
}
