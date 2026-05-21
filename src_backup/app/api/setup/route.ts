import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Clinic from '@/models/Clinic';
import Service from '@/models/Service';
import { DEFAULT_SERVICES } from '@/lib/constants';
import { toClient } from '@/lib/mongoose-helpers';
import { NextRequest, NextResponse } from 'next/server';

// POST: First-time super admin setup
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Check if super_admin already exists
    const existingAdmin = await User.findOne({ role: 'super_admin' }).lean();
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'تم الإعداد مسبقاً' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { adminName, adminPhone, password } = body;

    if (!adminName || !adminPhone || !password) {
      return NextResponse.json(
        { error: 'يرجى ملء جميع الحقول' },
        { status: 400 }
      );
    }

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

    // Create super admin user
    const adminUser = await User.create({
      name: adminName,
      phone: adminPhone,
      password,
      role: 'super_admin',
      active: true,
      clinicId: '',
      createdAt: new Date(),
    });

    const token = Buffer.from(`${adminUser._id.toString()}:${Date.now()}`).toString('base64');

    return NextResponse.json({
      success: true,
      user: {
        id: adminUser._id.toString(),
        name: adminName,
        phone: adminPhone,
        role: 'super_admin',
        active: true,
        clinicId: '',
      },
      token,
      clinic: null,
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'خطأ في الإعداد' },
      { status: 500 }
    );
  }
}

// PUT: Create a new clinic (super admin adds a clinic)
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { clinicName, adminName, adminPhone, password, address, phone, city } = body;

    if (!clinicName || !adminName || !adminPhone || !password) {
      return NextResponse.json(
        { error: 'يرجى ملء جميع الحقول المطلوبة' },
        { status: 400 }
      );
    }

    const phoneRegex = /^\d{9}$/;
    if (!phoneRegex.test(adminPhone)) {
      return NextResponse.json(
        { error: 'رقم هاتف المدير يجب أن يكون 9 أرقام' },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل' },
        { status: 400 }
      );
    }

    // Check if phone already exists
    const existingUser = await User.findOne({ phone: adminPhone }).lean();
    if (existingUser) {
      return NextResponse.json(
        { error: 'رقم الهاتف مستخدم بالفعل' },
        { status: 409 }
      );
    }

    // Create clinic
    const clinic = await Clinic.create({
      name: clinicName,
      address: address || '',
      phone: phone || '',
      city: city || '',
      adminPhone,
      active: true,
      setupComplete: true,
      subscription: {
        plan: 'free',
        startDate: new Date(),
        endDate: null,
        status: 'active',
      },
      createdAt: new Date(),
    });

    const clinicId = clinic._id.toString();

    // Create admin user for the clinic
    const adminUser = await User.create({
      name: adminName,
      phone: adminPhone,
      password,
      role: 'admin',
      active: true,
      clinicId,
      createdAt: new Date(),
    });

    // Update clinic with adminId
    await Clinic.findByIdAndUpdate(clinicId, { adminId: adminUser._id.toString() });

    // Create default 14 services for the clinic
    const servicesToInsert = DEFAULT_SERVICES.map((service) => ({
      ...service,
      clinicId,
      active: true,
      status: 'active',
      createdAt: new Date(),
    }));
    await Service.insertMany(servicesToInsert);

    return NextResponse.json({
      success: true,
      clinic: {
        id: clinicId,
        name: clinicName,
        address: address || '',
        phone: phone || '',
        city: city || '',
        active: true,
      },
      admin: {
        id: adminUser._id.toString(),
        name: adminName,
        phone: adminPhone,
        role: 'admin',
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create clinic error:', error);
    return NextResponse.json(
      { error: 'خطأ في إنشاء العيادة' },
      { status: 500 }
    );
  }
}
