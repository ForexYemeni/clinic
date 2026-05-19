import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import { DEFAULT_SERVICES } from '@/lib/services-data';

// POST: Re-seed missing services (adds services that don't exist yet)
export async function POST() {
  try {
    // Get all existing service names
    const existingSnap = await adminDb.collection('services').get();
    const existingNames = new Set(
      existingSnap.docs.map(doc => doc.data()?.nameAr).filter(Boolean)
    );

    // Find missing services
    const missingServices = DEFAULT_SERVICES.filter(
      service => !existingNames.has(service.nameAr)
    );

    if (missingServices.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'جميع الخدمات موجودة بالفعل',
        added: 0,
        total: existingSnap.size,
      });
    }

    // Add missing services in batches (Firestore batch limit: 500)
    const BATCH_SIZE = 450;
    for (let i = 0; i < missingServices.length; i += BATCH_SIZE) {
      const batch = adminDb.batch();
      const chunk = missingServices.slice(i, i + BATCH_SIZE);
      chunk.forEach(service => {
        const ref = adminDb.collection('services').doc();
        batch.set(ref, {
          ...service,
          createdAt: new Date().toISOString(),
        });
      });
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      message: `تمت إضافة ${missingServices.length} خدمة جديدة`,
      added: missingServices.length,
      total: existingSnap.size + missingServices.length,
    });
  } catch (error) {
    console.error('Reseed services error:', error);
    return NextResponse.json(
      { error: 'خطأ في إعادة تحميل الخدمات' },
      { status: 500 }
    );
  }
}

// DELETE: Delete all services and re-seed from defaults
export async function DELETE() {
  try {
    // Delete all existing services
    const existingSnap = await adminDb.collection('services').get();
    if (!existingSnap.empty) {
      const BATCH_SIZE = 450;
      for (let i = 0; i < existingSnap.docs.length; i += BATCH_SIZE) {
        const batch = adminDb.batch();
        const chunk = existingSnap.docs.slice(i, i + BATCH_SIZE);
        chunk.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }
    }

    // Re-seed all default services
    const BATCH_SIZE = 450;
    for (let i = 0; i < DEFAULT_SERVICES.length; i += BATCH_SIZE) {
      const batch = adminDb.batch();
      const chunk = DEFAULT_SERVICES.slice(i, i + BATCH_SIZE);
      chunk.forEach(service => {
        const ref = adminDb.collection('services').doc();
        batch.set(ref, {
          ...service,
          createdAt: new Date().toISOString(),
        });
      });
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      message: `تم إعادة تحميل ${DEFAULT_SERVICES.length} خدمة`,
      total: DEFAULT_SERVICES.length,
    });
  } catch (error) {
    console.error('Reset services error:', error);
    return NextResponse.json(
      { error: 'خطأ في إعادة تهيئة الخدمات' },
      { status: 500 }
    );
  }
}
