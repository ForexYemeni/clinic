import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';

// GET: List data reset requests (for super admin)
export async function GET(request: NextRequest) {
  try {
    const { auth } = extractAuthAndClinicId(request);
    if (auth?.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const snapshot = await adminDb.collection('dataResetRequests')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get()
      .catch(() => adminDb.collection('dataResetRequests')
        .where('status', '==', 'pending')
        .get());

    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Data reset requests list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب الطلبات' }, { status: 500 });
  }
}

// POST: Create a data reset request (for admin)
export async function POST(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    if (!auth || !effectiveClinicId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    if (auth.role !== 'admin') {
      return NextResponse.json({ error: 'فقط مدير العيادة يمكنه طلب حذف البيانات' }, { status: 403 });
    }

    const body = await request.json();
    const { adminPassword, adminId } = body;

    // Verify admin password
    if (!adminId || !adminPassword) {
      return NextResponse.json({ error: 'يرجى إدخال كلمة المرور' }, { status: 400 });
    }

    const adminDoc = await adminDb.collection('users').doc(adminId).get();
    if (!adminDoc.exists) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
    }

    const adminData = adminDoc.data();
    const { verifyPassword } = await import('@/lib/auth');
    const passwordValid = await verifyPassword(adminPassword, adminData.password);
    if (!passwordValid || adminData.role !== 'admin') {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
    }

    // Check if there's already a pending request for this clinic
    const existingSnapshot = await adminDb.collection('dataResetRequests')
      .where('clinicId', '==', effectiveClinicId)
      .where('status', '==', 'pending')
      .get();

    if (!existingSnapshot.empty) {
      return NextResponse.json({ error: 'يوجد طلب حذف بيانات قيد المراجعة بالفعل لهذه العيادة' }, { status: 400 });
    }

    // Get clinic name
    const clinicDoc = await adminDb.collection('clinics').doc(effectiveClinicId).get();
    const clinicName = clinicDoc.exists ? clinicDoc.data()?.name || '' : '';

    // Create the request
    const docRef = await adminDb.collection('dataResetRequests').add({
      clinicId: effectiveClinicId,
      clinicName,
      adminId,
      adminName: adminData.name || '',
      adminPhone: adminData.phone || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      id: docRef.id,
      message: 'تم إرسال طلب حذف البيانات بنجاح. سيتم مراجعته من قبل الإدارة الرئيسية.',
    }, { status: 201 });
  } catch (error) {
    console.error('Data reset request create error:', error);
    return NextResponse.json({ error: 'خطأ في إرسال الطلب' }, { status: 500 });
  }
}

// PUT: Approve or reject a data reset request (for super admin)
export async function PUT(request: NextRequest) {
  try {
    const { auth } = extractAuthAndClinicId(request);
    if (auth?.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json();
    const { id, action, superAdminPassword } = body;

    if (!id || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 });
    }

    const doc = await adminDb.collection('dataResetRequests').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    const requestData = doc.data();
    if (requestData.status !== 'pending') {
      return NextResponse.json({ error: 'تم معالجة هذا الطلب مسبقاً' }, { status: 400 });
    }

    if (action === 'approve') {
      // Verify super admin password
      if (!superAdminPassword) {
        return NextResponse.json({ error: 'يرجى إدخال كلمة المرور' }, { status: 400 });
      }

      const superAdminDoc = await adminDb.collection('users').doc(auth.userId).get();
      if (!superAdminDoc.exists) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const { verifyPassword } = await import('@/lib/auth');
      const passwordValid = await verifyPassword(superAdminPassword, superAdminDoc.data()?.password);
      if (!passwordValid) {
        return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
      }

      // Execute the data reset
      const BATCH_LIMIT = 450;
      const collectionsToDelete = ['patients', 'visits', 'invoices', 'emergencies', 'notifications', 'services'];
      const clinicId = requestData.clinicId;
      const adminId = requestData.adminId;

      // Delete all users except admin
      const usersSnapshot = await adminDb.collection('users')
        .where('clinicId', '==', clinicId)
        .get();

      for (let i = 0; i < usersSnapshot.docs.length; i += BATCH_LIMIT) {
        const batch = adminDb.batch();
        const chunk = usersSnapshot.docs.slice(i, i + BATCH_LIMIT);
        chunk.forEach(d => {
          if (d.id !== adminId) batch.delete(d.ref);
        });
        await batch.commit();
      }

      // Delete operational collections
      for (const col of collectionsToDelete) {
        let snapshot;
        try {
          snapshot = await adminDb.collection(col).where('clinicId', '==', clinicId).get();
        } catch {
          snapshot = await adminDb.collection(col).where('clinicId', '==', clinicId).get();
        }

        for (let i = 0; i < snapshot.docs.length; i += BATCH_LIMIT) {
          const batch = adminDb.batch();
          const chunk = snapshot.docs.slice(i, i + BATCH_LIMIT);
          chunk.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
      }

      // Also delete salary withdrawals
      try {
        const salarySnapshot = await adminDb.collection('salaryWithdrawals')
          .where('clinicId', '==', clinicId).get();
        for (let i = 0; i < salarySnapshot.docs.length; i += BATCH_LIMIT) {
          const batch = adminDb.batch();
          const chunk = salarySnapshot.docs.slice(i, i + BATCH_LIMIT);
          chunk.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
      } catch {}

      // Re-seed default services
      const { DEFAULT_SERVICES } = await import('@/lib/services-data');
      const servicesWithClinicId = DEFAULT_SERVICES.map(s => ({
        ...s,
        clinicId,
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
    }

    // Update request status
    await adminDb.collection('dataResetRequests').doc(id).update({
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewedBy: auth.userId,
      reviewedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'تمت الموافقة على الحذف وتنفيذه' : 'تم رفض طلب الحذف',
    });
  } catch (error) {
    console.error('Data reset request review error:', error);
    return NextResponse.json({ error: 'خطأ في معالجة الطلب' }, { status: 500 });
  }
}
