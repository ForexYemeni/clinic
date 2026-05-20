import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Clinic from '@/models/Clinic';
import { toClient } from '@/lib/mongoose-helpers';
import { NextRequest, NextResponse } from 'next/server';

// POST: Login with phone + password
export async function POST(request: NextRequest) {
  try {
    const connectResult = await dbConnect();
    if (!connectResult) {
      return NextResponse.json(
        { error: 'خطأ في الاتصال بقاعدة البيانات' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'يرجى إدخال رقم الهاتف وكلمة المرور' },
        { status: 400 }
      );
    }

    const phoneRegex = /^\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'رقم الهاتف يجب أن يكون 9 أرقام' },
        { status: 400 }
      );
    }

    const userDoc = await User.findOne({ phone }).lean();

    if (!userDoc) {
      return NextResponse.json(
        { error: 'رقم الهاتف أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    if (userDoc.active === false) {
      return NextResponse.json(
        { error: 'الحساب معطل' },
        { status: 403 }
      );
    }

    if (userDoc.password !== password) {
      return NextResponse.json(
        { error: 'رقم الهاتف أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    const userId = userDoc._id.toString();
    const token = Buffer.from(`${userId}:${Date.now()}`).toString('base64');

    // Get clinic info based on role
    let clinicData = null;
    if (userDoc.role === 'super_admin') {
      // Super admin has access to all clinics
      clinicData = null;
    } else if (userDoc.clinicId) {
      const clinicDoc = await Clinic.findById(userDoc.clinicId).lean();
      if (clinicDoc) {
        clinicData = { id: clinicDoc._id.toString(), name: clinicDoc.name, active: clinicDoc.active !== false };
        // Check if clinic is active
        if (clinicDoc.active === false) {
          return NextResponse.json(
            { error: 'العيادة معطلة - تواصل مع الإدارة الرئيسية' },
            { status: 403 }
          );
        }
      }
    }

    return NextResponse.json({
      user: {
        id: userId,
        name: userDoc.name || '',
        phone: userDoc.phone || '',
        role: userDoc.role || 'nurse',
        active: userDoc.active !== false,
        clinicId: userDoc.clinicId || '',
      },
      token,
      clinic: clinicData,
    });
  } catch (error) {
    console.error('Auth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'خطأ في تسجيل الدخول';
    if (errorMessage.includes('MONGODB_URI') || errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('MongoServerError') || errorMessage.includes('timeout')) {
      return NextResponse.json(
        { error: 'خطأ في الاتصال بقاعدة البيانات - يرجى المحاولة لاحقاً', detail: errorMessage },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'خطأ في تسجيل الدخول', detail: errorMessage },
      { status: 500 }
    );
  }
}

// GET: Check if setup is needed
export async function GET() {
  try {
    await dbConnect();

    // Check if any super_admin exists
    const superAdmin = await User.findOne({ role: 'super_admin' }).lean();

    if (!superAdmin) {
      return NextResponse.json({
        setupNeeded: true,
        clinic: null,
      });
    }

    return NextResponse.json({
      setupNeeded: false,
      clinic: null,
    });
  } catch (error) {
    console.error('Setup check error:', error);
    return NextResponse.json({
      setupNeeded: false,
      clinic: null,
      error: 'خطأ في الاتصال بقاعدة البيانات',
    });
  }
}
