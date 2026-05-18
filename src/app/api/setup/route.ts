import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminName, phone, clinicName, password } = body;

    if (!adminName || !phone || !clinicName || !password) {
      return NextResponse.json({ error: 'يرجى ملء جميع الحقول' }, { status: 400 });
    }

    const phoneRegex = /^\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: 'رقم الهاتف يجب أن يكون 9 أرقام' }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل' }, { status: 400 });
    }

    // Delete all demo/default data
    const collectionsToDelete = ['users', 'patients', 'services', 'emergencies', 'invoices', 'payments', 'notifications'];
    for (const col of collectionsToDelete) {
      const snapshot = await adminDb.collection(col).get();
      const batch = adminDb.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      if (snapshot.docs.length > 0) await batch.commit();
    }

    // Create admin user
    const adminRef = await adminDb.collection('users').add({
      name: adminName,
      phone,
      password,
      role: 'admin',
      active: true,
      createdAt: new Date().toISOString(),
    });

    // Seed the 14 default services
    const defaultServices = [
      { nameAr: 'قياس الضغط', price: 20, duration: 10, description: 'قياس ضغط الدم', category: 'قياسات', active: true, createdAt: new Date().toISOString() },
      { nameAr: 'قياس السكر', price: 20, duration: 10, description: 'قياس مستوى السكر في الدم', category: 'قياسات', active: true, createdAt: new Date().toISOString() },
      { nameAr: 'قياس الحرارة', price: 15, duration: 5, description: 'قياس درجة حرارة الجسم', category: 'قياسات', active: true, createdAt: new Date().toISOString() },
      { nameAr: 'قياس الأكسجين', price: 25, duration: 10, description: 'قياس مستوى الأكسجين في الدم', category: 'قياسات', active: true, createdAt: new Date().toISOString() },
      { nameAr: 'تضميد الجروح', price: 50, duration: 20, description: 'تنظيف وتضميد الجروح', category: 'إسعافات', active: true, createdAt: new Date().toISOString() },
      { nameAr: 'الحروق', price: 60, duration: 25, description: 'علاج الحروق البسيطة والمتوسطة', category: 'إسعافات', active: true, createdAt: new Date().toISOString() },
      { nameAr: 'الكسور البسيطة', price: 80, duration: 30, description: 'تثبيت وعلاج الكسور البسيطة', category: 'إسعافات', active: true, createdAt: new Date().toISOString() },
      { nameAr: 'الأكسجين العلاجي', price: 40, duration: 30, description: 'إعطاء الأكسجين العلاجي', category: 'علاج', active: true, createdAt: new Date().toISOString() },
      { nameAr: 'الحقن', price: 30, duration: 15, description: 'إعطاء الحقن العضلية والوريدية', category: 'علاج', active: true, createdAt: new Date().toISOString() },
      { nameAr: 'المحاليل', price: 50, duration: 45, description: 'إعطاء المحاليل الوريدية', category: 'علاج', active: true, createdAt: new Date().toISOString() },
      { nameAr: 'الأدوية', price: 25, duration: 10, description: 'صرف وتقديم الأدوية', category: 'علاج', active: true, createdAt: new Date().toISOString() },
      { nameAr: 'الرذاذ الاستنشاقي', price: 30, duration: 15, description: 'علاج بالرذاذ والاستنشاق', category: 'علاج', active: true, createdAt: new Date().toISOString() },
      { nameAr: 'تغيير الضمادات', price: 35, duration: 15, description: 'تغيير وتجديد الضمادات', category: 'رعاية', active: true, createdAt: new Date().toISOString() },
      { nameAr: 'الإسعافات الأولية العامة', price: 100, duration: 30, description: 'إسعافات أولية شاملة', category: 'إسعافات', active: true, createdAt: new Date().toISOString() },
    ];

    const batch = adminDb.batch();
    defaultServices.forEach((service) => {
      batch.set(adminDb.collection('services').doc(), service);
    });
    await batch.commit();

    // Create/update clinic config
    const configSnapshot = await adminDb.collection('clinicConfig').limit(1).get();
    if (configSnapshot.empty) {
      await adminDb.collection('clinicConfig').add({
        name: clinicName,
        adminPhone: phone,
        isFirstSetup: true,
        createdAt: new Date().toISOString(),
      });
    } else {
      await configSnapshot.docs[0].ref.update({
        name: clinicName,
        adminPhone: phone,
        isFirstSetup: true,
      });
    }

    return NextResponse.json({
      user: {
        id: adminRef.id,
        name: adminName,
        phone,
        role: 'admin',
        active: true,
      },
      clinicName,
      isFirstSetup: true,
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: 'خطأ في الإعداد' }, { status: 500 });
  }
}
