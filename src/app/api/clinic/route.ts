// ═══════════════════════════════════════════════════════════
// 🏥 Clinic Settings API
// Multi-tenant: reads/writes to clinics collection using clinicId from JWT
// Backward compatible with old 'clinic' collection
// ═══════════════════════════════════════════════════════════

import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest } from '@/lib/auth';
import { DEFAULT_SERVICES } from '@/lib/services-data';

// Route segment config for larger body size (logo uploads)
export const maxDuration = 30;

// Helper to get clinic data from either new 'clinics' or old 'clinic' collection
async function getClinicData(clinicId: string | null) {
  if (clinicId) {
    // New multi-tenant system
    const doc = await adminDb.collection('clinics').doc(clinicId).get();
    if (doc.exists) {
      return { source: 'clinics', id: doc.id, ...doc.data() };
    }
  }

  // Fallback to old single-clinic collection
  const snapshot = await adminDb.collection('clinic').limit(1).get();
  if (!snapshot.empty) {
    return { source: 'clinic', id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  }

  return null;
}

// GET: Get clinic settings
export async function GET(request: NextRequest) {
  try {
    const auth = extractAuthFromRequest(request);
    const clinicId = auth?.clinicId || null;
    const data = await getClinicData(clinicId);

    if (!data) {
      return NextResponse.json({ name: 'عيادتي', description: '', phone: '', address: '', logo: '', primaryColor: 'emerald' });
    }

    return NextResponse.json({
      id: data.id,
      name: data.name || '',
      description: data.description || '',
      phone: data.phone || '',
      address: data.address || '',
      logo: data.logo || '',
      primaryColor: data.primaryColor || 'emerald',
    });
  } catch (error) {
    console.error('Get clinic error:', error);
    return NextResponse.json({ error: 'خطأ في جلب بيانات العيادة' }, { status: 500 });
  }
}

// PUT: Update clinic settings
export async function PUT(request: NextRequest) {
  try {
    const auth = extractAuthFromRequest(request);
    const clinicId = auth?.clinicId || null;
    const body = await request.json();
    const { name, description, phone, address, logo, primaryColor } = body;

    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (name !== undefined) updateData.name = String(name);
    if (description !== undefined) updateData.description = String(description);
    if (phone !== undefined) updateData.phone = String(phone);
    if (address !== undefined) updateData.address = String(address);
    if (primaryColor !== undefined) updateData.primaryColor = String(primaryColor);

    // Handle logo separately - validate size
    if (logo !== undefined) {
      if (logo && logo.length > 900000) {
        console.warn('Logo too large for Firestore, skipping logo save. Size:', logo.length);
      } else {
        updateData.logo = String(logo);
      }
    }

    // Try new clinics collection first
    if (clinicId) {
      const clinicDoc = await adminDb.collection('clinics').doc(clinicId).get();
      if (clinicDoc.exists) {
        await adminDb.collection('clinics').doc(clinicId).update(updateData);
        const existingData = clinicDoc.data();
        return NextResponse.json({
          id: clinicId,
          name: updateData.name ?? existingData.name ?? '',
          description: updateData.description ?? existingData.description ?? '',
          phone: updateData.phone ?? existingData.phone ?? '',
          address: updateData.address ?? existingData.address ?? '',
          logo: updateData.logo ?? existingData.logo ?? '',
          primaryColor: updateData.primaryColor ?? existingData.primaryColor ?? 'emerald',
        });
      }
    }

    // Fallback to old clinic collection
    const snapshot = await adminDb.collection('clinic').limit(1).get();
    if (!snapshot.empty) {
      const docId = snapshot.docs[0].id;
      await adminDb.collection('clinic').doc(docId).update(updateData);
      const existingData = snapshot.docs[0].data();
      return NextResponse.json({
        id: docId,
        name: updateData.name ?? existingData.name ?? '',
        description: updateData.description ?? existingData.description ?? '',
        phone: updateData.phone ?? existingData.phone ?? '',
        address: updateData.address ?? existingData.address ?? '',
        logo: updateData.logo ?? existingData.logo ?? '',
        primaryColor: updateData.primaryColor ?? existingData.primaryColor ?? 'emerald',
      });
    }

    // No clinic document exists - create one
    const createData = {
      name: String(name || 'عيادتي'),
      description: String(description || ''),
      phone: String(phone || ''),
      address: String(address || ''),
      logo: (logo && logo.length <= 900000) ? String(logo) : '',
      primaryColor: String(primaryColor || 'emerald'),
      setupComplete: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (clinicId) {
      // Create in new collection
      await adminDb.collection('clinics').doc(clinicId).set(createData, { merge: true });
      return NextResponse.json({ id: clinicId, ...createData });
    } else {
      const docRef = await adminDb.collection('clinic').add(createData);
      return NextResponse.json({ id: docRef.id, ...createData });
    }
  } catch (error: any) {
    console.error('Update clinic error:', error);
    const errorMessage = error?.message || 'خطأ في تحديث بيانات العيادة';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE: Full system reset (for current clinic only)
export async function DELETE(request: NextRequest) {
  try {
    const auth = extractAuthFromRequest(request);
    const clinicId = auth?.clinicId || null;
    const body = await request.json();
    const { confirmCode, adminPassword, adminId } = body;

    if (confirmCode !== 'حذف جميع البيانات') {
      return NextResponse.json({ error: 'كلمة التأكيد غير صحيحة' }, { status: 400 });
    }

    if (!adminId || !adminPassword) {
      return NextResponse.json({ error: 'يرجى إدخال كلمة المرور' }, { status: 400 });
    }

    // Verify admin password
    const adminDoc = await adminDb.collection('users').doc(adminId).get();
    if (!adminDoc.exists) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
    }

    const adminData = adminDoc.data();
    // Support both hashed and plaintext passwords
    const { verifyPassword } = await import('@/lib/auth');
    const passwordValid = await verifyPassword(adminPassword, adminData.password);
    if (!passwordValid || adminData.role !== 'admin') {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
    }

    // Delete operational data in batches
    const BATCH_LIMIT = 450;
    const collectionsToDelete = ['patients', 'visits', 'invoices', 'emergencies', 'notifications', 'services'];

    // Filter by clinicId if available
    const filterByClinic = !!clinicId;

    // Delete all users except admin (for this clinic)
    let usersSnapshot;
    if (filterByClinic) {
      usersSnapshot = await adminDb.collection('users').where('clinicId', '==', clinicId).get();
    } else {
      usersSnapshot = await adminDb.collection('users').get();
    }

    for (let i = 0; i < usersSnapshot.docs.length; i += BATCH_LIMIT) {
      const batch = adminDb.batch();
      const chunk = usersSnapshot.docs.slice(i, i + BATCH_LIMIT);
      chunk.forEach(doc => {
        if (doc.id !== adminId) batch.delete(doc.ref);
      });
      await batch.commit();
    }

    // Delete operational collections
    for (const col of collectionsToDelete) {
      let snapshot;
      if (filterByClinic) {
        try {
          snapshot = await adminDb.collection(col).where('clinicId', '==', clinicId).get();
        } catch {
          snapshot = await adminDb.collection(col).get();
        }
      } else {
        snapshot = await adminDb.collection(col).get();
      }
      for (let i = 0; i < snapshot.docs.length; i += BATCH_LIMIT) {
        const batch = adminDb.batch();
        const chunk = snapshot.docs.slice(i, i + BATCH_LIMIT);
        chunk.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }
    }

    // Re-seed default services for this clinic
    const servicesWithClinicId = DEFAULT_SERVICES.map(s => ({
      ...s,
      clinicId: clinicId || null,
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

    return NextResponse.json({ success: true, message: 'تم حذف جميع البيانات بنجاح وإعادة تحميل الخدمات' });
  } catch (error) {
    console.error('System reset error:', error);
    return NextResponse.json({ error: 'خطأ في إعادة تهيئة النظام' }, { status: 500 });
  }
}
