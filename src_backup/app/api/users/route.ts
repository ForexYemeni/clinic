import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';

// GET: List nurses (filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId') || '';

    let query = User.find({ role: 'nurse' });
    if (clinicId) query = query.where('clinicId', clinicId);

    const nurses = await query.lean();

    const result = nurses.map((doc) => ({
      id: doc._id.toString(),
      name: doc.name || '',
      phone: doc.phone || '',
      role: doc.role,
      active: doc.active !== false,
      clinicId: doc.clinicId || '',
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : '',
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Nurses list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب الممرضين' }, { status: 500 });
  }
}

// POST: Add nurse (with clinicId from admin)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { name, phone, password, clinicId } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'يرجى إدخال اسم الممرض ورقم الهاتف' }, { status: 400 });
    }

    const phoneRegex = /^\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: 'رقم الهاتف يجب أن يكون 9 أرقام' }, { status: 400 });
    }

    const existingUser = await User.findOne({ phone }).lean();
    if (existingUser) {
      return NextResponse.json({ error: 'رقم الهاتف مستخدم بالفعل' }, { status: 409 });
    }

    const nurseData = {
      name,
      phone,
      password: password || '1234',
      role: 'nurse' as const,
      active: true,
      clinicId: clinicId || '',
      createdAt: new Date(),
    };

    const doc = await User.create(nurseData);

    return NextResponse.json({
      id: doc._id.toString(),
      name,
      phone,
      role: 'nurse',
      active: true,
      clinicId: clinicId || '',
    }, { status: 201 });
  } catch (error) {
    console.error('Create nurse error:', error);
    return NextResponse.json({ error: 'خطأ في إضافة الممرض' }, { status: 500 });
  }
}
