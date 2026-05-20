import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Clinic from '@/models/Clinic';
import Service from '@/models/Service';
import { toClient } from '@/lib/mongoose-helpers';
import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_SERVICES = [
  { nameAr: 'قياس الضغط', price: 500, duration: 10, category: 'قياسات', description: 'قياس ضغط الدم', active: true, status: 'active' },
  { nameAr: 'قياس السكر', price: 500, duration: 10, category: 'قياسات', description: 'قياس مستوى السكر في الدم', active: true, status: 'active' },
  { nameAr: 'قياس الحرارة', price: 300, duration: 5, category: 'قياسات', description: 'قياس درجة حرارة الجسم', active: true, status: 'active' },
  { nameAr: 'قياس الأكسجين', price: 500, duration: 10, category: 'قياسات', description: 'قياس مستوى الأكسجين في الدم', active: true, status: 'active' },
  { nameAr: 'تضميد الجروح', price: 1500, duration: 20, category: 'إسعافات', description: 'تنظيف وتضميد الجروح', active: true, status: 'active' },
  { nameAr: 'الحروق', price: 2000, duration: 25, category: 'إسعافات', description: 'علاج الحروق البسيطة والمتوسطة', active: true, status: 'active' },
  { nameAr: 'الكسور البسيطة', price: 3000, duration: 30, category: 'إسعافات', description: 'تثبيت وعلاج الكسور البسيطة', active: true, status: 'active' },
  { nameAr: 'الأكسجين العلاجي', price: 1500, duration: 30, category: 'علاج', description: 'إعطاء الأكسجين العلاجي', active: true, status: 'active' },
  { nameAr: 'الحقن', price: 800, duration: 15, category: 'علاج', description: 'إعطاء الحقن العضلية والوريدية', active: true, status: 'active' },
  { nameAr: 'المحاليل', price: 1500, duration: 45, category: 'علاج', description: 'إعطاء المحاليل الوريدية', active: true, status: 'active' },
  { nameAr: 'الأدوية', price: 500, duration: 10, category: 'علاج', description: 'صرف وتقديم الأدوية', active: true, status: 'active' },
  { nameAr: 'الرذاذ الاستنشاقي', price: 800, duration: 15, category: 'علاج', description: 'علاج بالرذاذ والاستنشاق', active: true, status: 'active' },
  { nameAr: 'تغيير الضمادات', price: 1000, duration: 15, category: 'رعاية', description: 'تغيير وتجديد الضمادات', active: true, status: 'active' },
  { nameAr: 'الإسعافات الأولية العامة', price: 3000, duration: 30, category: 'إسعافات', description: 'إسعافات أولية شاملة', active: true, status: 'active' },
];

// POST: First-time admin setup
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

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

    // Delete all data first
    await Promise.all([
      User.deleteMany({}),
      Clinic.deleteMany({}),
      Service.deleteMany({}),
    ]);
    // Import and delete other collections
    const Patient = (await import('@/models/Patient')).default;
    const Visit = (await import('@/models/Visit')).default;
    const Invoice = (await import('@/models/Invoice')).default;
    const Emergency = (await import('@/models/Emergency')).default;
    const Notification = (await import('@/models/Notification')).default;

    await Promise.all([
      Patient.deleteMany({}),
      Visit.deleteMany({}),
      Invoice.deleteMany({}),
      Emergency.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    // Create clinic document
    const clinic = await Clinic.create({
      name: clinicName,
      adminPhone,
      setupComplete: true,
      createdAt: new Date(),
    });

    // Create admin user
    const adminUser = await User.create({
      name: adminName,
      phone: adminPhone,
      password,
      role: 'admin',
      active: true,
      clinicId: clinic._id.toString(),
      createdAt: new Date(),
    });

    // Create default 14 services
    const servicesToInsert = DEFAULT_SERVICES.map((service) => ({
      ...service,
      createdAt: new Date(),
    }));
    await Service.insertMany(servicesToInsert);

    // Generate token
    const token = Buffer.from(`${adminUser._id.toString()}:${Date.now()}`).toString('base64');

    return NextResponse.json({
      success: true,
      user: {
        id: adminUser._id.toString(),
        name: adminName,
        phone: adminPhone,
        role: 'admin',
        active: true,
      },
      token,
      clinic: {
        id: clinic._id.toString(),
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
