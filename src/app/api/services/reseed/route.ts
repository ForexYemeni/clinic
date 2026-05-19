import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_SERVICES } from '@/lib/services-data';
import { extractAuthFromRequest } from '@/lib/auth';

// POST: Re-seed missing services (adds services that don't exist yet, with clinicId)
export async function POST(request: NextRequest) {
  try {
    const auth = extractAuthFromRequest(request);
    const clinicId = auth?.clinicId || null;

    const existingSnap = await adminDb.collection('services').get();
    const existingNames = new Set(
      existingSnap.docs
        .filter(doc => !clinicId || doc.data()?.clinicId === clinicId)
        .map(doc => doc.data()?.nameAr)
        .filter(Boolean)
    );

    const missingServices = DEFAULT_SERVICES.filter(service => !existingNames.has(service.nameAr));

    if (missingServices.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'جميع الخدمات موجودة بالفعل',
        added: 0,
        total: existingSnap.size,
      });
    }

    const BATCH_SIZE = 450;
    for (let i = 0; i < missingServices.length; i += BATCH_SIZE) {
      const batch = adminDb.batch();
      const chunk = missingServices.slice(i, i + BATCH_SIZE);
      chunk.forEach(service => {
        const ref = adminDb.collection('services').doc();
        batch.set(ref, {
          ...service,
          clinicId,
          active: true,
          status: 'active',
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
    return NextResponse.json({ error: 'خطأ في إعادة تحميل الخدمات' }, { status: 500 });
  }
}

// DELETE: Delete all services and re-seed from defaults (for current clinic)
export async function DELETE(request: NextRequest) {
  try {
    const auth = extractAuthFromRequest(request);
    const clinicId = auth?.clinicId || null;

    // Delete existing services for this clinic
    let existingSnap;
    if (clinicId) {
      try {
        existingSnap = await adminDb.collection('services').where('clinicId', '==', clinicId).get();
      } catch {
        existingSnap = await adminDb.collection('services').get();
      }
    } else {
      existingSnap = await adminDb.collection('services').get();
    }

    if (!existingSnap.empty) {
      const BATCH_SIZE = 450;
      for (let i = 0; i < existingSnap.docs.length; i += BATCH_SIZE) {
        const batch = adminDb.batch();
        const chunk = existingSnap.docs.slice(i, i + BATCH_SIZE);
        chunk.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }
    }

    // Re-seed with clinicId
    const BATCH_SIZE = 450;
    for (let i = 0; i < DEFAULT_SERVICES.length; i += BATCH_SIZE) {
      const batch = adminDb.batch();
      const chunk = DEFAULT_SERVICES.slice(i, i + BATCH_SIZE);
      chunk.forEach(service => {
        const ref = adminDb.collection('services').doc();
        batch.set(ref, {
          ...service,
          clinicId,
          active: true,
          status: 'active',
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
    return NextResponse.json({ error: 'خطأ في إعادة تهيئة الخدمات' }, { status: 500 });
  }
}
