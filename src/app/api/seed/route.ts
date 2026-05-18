import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import { DEFAULT_SERVICES } from '@/lib/constants';

export async function POST() {
  try {
    // Seed default services
    const existingServices = await adminDb.collection('services').limit(1).get();
    if (existingServices.empty) {
      const batch = adminDb.batch();
      for (const service of DEFAULT_SERVICES) {
        const ref = adminDb.collection('services').doc();
        batch.set(ref, {
          ...service,
          active: true,
          createdAt: new Date().toISOString(),
        });
      }
      await batch.commit();
    }

    // Seed default admin user
    const existingAdmin = await adminDb.collection('users').where('role', '==', 'admin').limit(1).get();
    if (existingAdmin.empty) {
      await adminDb.collection('users').add({
        name: 'المدير',
        phone: '050000000',
        password: 'admin123',
        role: 'admin',
        active: true,
        createdAt: new Date().toISOString(),
      });
    }

    // Seed default nurse
    const existingNurse = await adminDb.collection('users').where('role', '==', 'nurse').limit(1).get();
    if (existingNurse.empty) {
      await adminDb.collection('users').add({
        name: 'نورة',
        phone: '050000001',
        password: 'nurse123',
        role: 'nurse',
        active: true,
        createdAt: new Date().toISOString(),
      });
    }

    // Set clinic config
    await adminDb.collection('clinicConfig').doc('main').set({
      name: 'عيادة الإسعافات الأولية',
      adminPhone: '050000000',
      isFirstSetup: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: 'تم تهيئة البيانات بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to seed' }, { status: 500 });
  }
}
