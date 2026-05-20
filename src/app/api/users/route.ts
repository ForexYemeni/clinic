import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Clinic from '@/models/Clinic';
import { toClient } from '@/lib/mongoose-helpers';
import { NextRequest, NextResponse } from 'next/server';

// GET: List nurses
export async function GET() {
  try {
    await dbConnect();

    const nurses = await User.find({ role: 'nurse' }).lean();

    const result = nurses.map((doc) => ({
      id: doc._id.toString(),
      name: doc.name || '',
      phone: doc.phone || '',
      role: doc.role,
      active: doc.active !== false,
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : '',
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Nurses list error:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب الممرضين' },
      { status: 500 }
    );
  }
}

// POST: Add nurse
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { name, phone, password } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'يرجى إدخال اسم الممرض ورقم الهاتف' },
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

    // Check if phone already exists
    const existingUser = await User.findOne({ phone }).lean();
    if (existingUser) {
      return NextResponse.json(
        { error: 'رقم الهاتف مستخدم بالفعل' },
        { status: 409 }
      );
    }

    // Get clinic ID for nurse association
    const clinicDoc = await Clinic.findOne().lean();
    const clinicId = clinicDoc ? clinicDoc._id.toString() : '';

    const nurseData = {
      name,
      phone,
      password: password || '1234',
      role: 'nurse' as const,
      active: true,
      clinicId,
      createdAt: new Date(),
    };

    const doc = await User.create(nurseData);

    return NextResponse.json(
      {
        id: doc._id.toString(),
        name,
        phone,
        role: 'nurse',
        active: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create nurse error:', error);
    return NextResponse.json(
      { error: 'خطأ في إضافة الممرض' },
      { status: 500 }
    );
  }
}
