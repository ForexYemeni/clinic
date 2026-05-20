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

    // Validate phone is exactly 9 digits
    const phoneRegex = /^\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'رقم الهاتف يجب أن يكون 9 أرقام' },
        { status: 400 }
      );
    }

    // Find user by phone
    const userDoc = await User.findOne({ phone }).lean();

    if (!userDoc) {
      return NextResponse.json(
        { error: 'رقم الهاتف أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // Only block if active is explicitly set to false
    if (userDoc.active === false) {
      return NextResponse.json(
        { error: 'الحساب معطل' },
        { status: 403 }
      );
    }

    // Verify password (plain text comparison)
    if (userDoc.password !== password) {
      return NextResponse.json(
        { error: 'رقم الهاتف أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // Generate a simple token (user ID + timestamp based)
    const userId = userDoc._id.toString();
    const token = Buffer.from(`${userId}:${Date.now()}`).toString('base64');

    // Get clinic info
    const clinicDoc = await Clinic.findOne().lean();
    const clinicData = clinicDoc ? toClient(clinicDoc) : null;

    return NextResponse.json({
      user: {
        id: userId,
        name: userDoc.name || '',
        phone: userDoc.phone || '',
        role: userDoc.role || 'nurse',
        active: userDoc.active !== false,
      },
      token,
      clinic: clinicData ? { id: clinicData.id, name: clinicData.name } : null,
    });
  } catch (error) {
    console.error('Auth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'خطأ في تسجيل الدخول';
    // Check if it's a MongoDB connection error
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

    const clinicDoc = await Clinic.findOne({ setupComplete: true }).lean();

    const setupNeeded = !clinicDoc;

    return NextResponse.json({
      setupNeeded,
      clinic: setupNeeded ? null : toClient(clinicDoc!),
    });
  } catch (error) {
    console.error('Setup check error:', error);
    // If DB fails, don't redirect to setup - return setupNeeded: false
    // so user sees login screen, not setup screen
    return NextResponse.json({
      setupNeeded: false,
      clinic: null,
      error: 'خطأ في الاتصال بقاعدة البيانات',
    });
  }
}
