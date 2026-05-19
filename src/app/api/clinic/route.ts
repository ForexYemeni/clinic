import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_SERVICES } from '@/lib/services-data';

// GET: Get clinic settings
export async function GET() {
  try {
    const snapshot = await adminDb.collection('clinic').limit(1).get();
    if (snapshot.empty) {
      return NextResponse.json({ name: 'عيادتي', description: '', phone: '', address: '', logo: '', primaryColor: 'emerald' });
    }
    const doc = snapshot.docs[0];
    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Get clinic error:', error);
    return NextResponse.json({ error: 'خطأ في جلب بيانات العيادة' }, { status: 500 });
  }
}

// PUT: Update clinic settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, phone, address, logo, primaryColor } = body;

    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (logo !== undefined) updateData.logo = logo;
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;

    const snapshot = await adminDb.collection('clinic').limit(1).get();
    if (snapshot.empty) {
      const docRef = await adminDb.collection('clinic').add({
        name: name || 'عيادتي',
        description: description || '',
        phone: phone || '',
        address: address || '',
        logo: logo || '',
        primaryColor: primaryColor || 'emerald',
        setupComplete: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.json({ id: docRef.id, ...updateData });
    }

    const docId = snapshot.docs[0].id;
    await adminDb.collection('clinic').doc(docId).update(updateData);

    return NextResponse.json({ id: docId, ...updateData });
  } catch (error) {
    console.error('Update clinic error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث بيانات العيادة' }, { status: 500 });
  }
}

// DELETE: Full system reset
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { confirmCode, adminPassword, adminId } = body;

    if (confirmCode !== 'حذف جميع البيانات') {
      return NextResponse.json({ error: 'كلمة التأكيد غير صحيحة' }, { status: 400 });
    }

    if (!adminId || !adminPassword) {
      return NextResponse.json({ error: 'يرجى إدخال كلمة المرور' }, { status: 400 });
    }

    const adminDoc = await adminDb.collection('users').doc(adminId).get();
    if (!adminDoc.exists || adminDoc.data()?.password !== adminPassword || adminDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
    }

    // Delete operational data
    const collectionsToDelete = ['patients', 'visits', 'invoices', 'emergencies', 'notifications'];
    const batch = adminDb.batch();

    // Delete all users except admin
    const usersSnapshot = await adminDb.collection('users').get();
    usersSnapshot.docs.forEach(doc => {
      if (doc.id !== adminId) batch.delete(doc.ref);
    });

    for (const col of collectionsToDelete) {
      const snapshot = await adminDb.collection(col).get();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
    }
    await batch.commit();

    // Re-seed services if empty
    const servicesSnap = await adminDb.collection('services').where('status', '==', 'active').limit(1).get();
    if (servicesSnap.empty) {
      const batch2 = adminDb.batch();
      DEFAULT_SERVICES.forEach((service) => {
        const ref = adminDb.collection('services').doc();
        batch2.set(ref, { ...service, createdAt: new Date().toISOString() });
      });
      await batch2.commit();
    }

    return NextResponse.json({ success: true, message: 'تم حذف جميع البيانات بنجاح' });
  } catch (error) {
    console.error('System reset error:', error);
    return NextResponse.json({ error: 'خطأ في إعادة تهيئة النظام' }, { status: 500 });
  }
}
