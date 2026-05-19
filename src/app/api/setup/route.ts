import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_SERVICES } from '@/lib/services-data';

// POST: First-time admin setup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminName, adminPhone, clinicName, password } = body;

    if (!adminName || !adminPhone || !clinicName || !password) {
      return NextResponse.json(
        { error: 'يرجى ملء جميع الحقول' },
        { status: 400 }
      );
    }

    // Validate phone is exactly 9 digits
    const phoneRegex = /^\d{9}$/;
    if (!phoneRegex.test(adminPhone)) {
      return NextResponse.json(
        { error: 'رقم الهاتف يجب أن يكون 9 أرقام' },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل' },
        { status: 400 }
      );
    }

    // Delete all seed/default data first
    const collectionsToDelete = [
      'users',
      'patients',
      'services',
      'visits',
      'invoices',
      'emergencies',
      'notifications',
      'clinic',
    ];

    for (const col of collectionsToDelete) {
      const snapshot = await adminDb.collection(col).get();
      if (!snapshot.empty) {
        const batch = adminDb.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }
    }

    // Create clinic document
    const clinicRef = await adminDb.collection('clinic').add({
      name: clinicName,
      description: '',
      phone: adminPhone,
      address: '',
      logo: '',
      primaryColor: 'emerald',
      adminPhone,
      setupComplete: true,
      createdAt: new Date().toISOString(),
    });

    // Create admin user
    const adminRef = await adminDb.collection('users').add({
      name: adminName,
      phone: adminPhone,
      password,
      role: 'admin',
      active: true,
      createdAt: new Date().toISOString(),
    });

    // Create default 14 services
    const batch = adminDb.batch();
    DEFAULT_SERVICES.forEach((service) => {
      const ref = adminDb.collection('services').doc();
      batch.set(ref, {
        ...service,
        createdAt: new Date().toISOString(),
      });
    });
    await batch.commit();

    // Generate token
    const token = Buffer.from(`${adminRef.id}:${Date.now()}`).toString('base64');

    return NextResponse.json({
      success: true,
      user: {
        id: adminRef.id,
        name: adminName,
        phone: adminPhone,
        role: 'admin',
        active: true,
      },
      token,
      clinic: {
        id: clinicRef.id,
        name: clinicName,
      },
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'خطأ في الإعداد' },
      { status: 500 }
    );
  }
}
