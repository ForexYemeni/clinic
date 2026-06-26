import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId, hashPassword } from '@/lib/auth';
import { toClientList } from '@/lib/mongoose-helpers';

// GET: List nurses (filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);

    if (!effectiveClinicId) {
      return NextResponse.json([]);
    }

    // MongoDB supports compound queries natively
    const users = await User.find({
      role: 'nurse',
      clinicId: effectiveClinicId,
    }).lean();

    const nurses = users
      .map((doc) => ({
        id: doc._id.toString(),
        name: doc.name || '',
        phone: doc.phone || '',
        role: doc.role,
        active: doc.active !== false,
        clinicId: doc.clinicId || null,
        salary: doc.salary || 0,
        createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : '',
      }))
      .filter(nurse => nurse.clinicId === effectiveClinicId);

    return NextResponse.json(nurses);
  } catch (error) {
    console.error('Nurses list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب الممرضين' }, { status: 500 });
  }
}

// POST: Add nurse (hashed password, linked to clinicId)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const body = await request.json();
    const { name, phone, password, salary } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'يرجى إدخال اسم الممرض ورقم الهاتف' }, { status: 400 });
    }

    const phoneRegex = /^\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: 'رقم الهاتف يجب أن يكون 9 أرقام' }, { status: 400 });
    }

    if (!effectiveClinicId) {
      return NextResponse.json({ error: 'لم يتم تحديد العيادة' }, { status: 400 });
    }

    // Check if phone already exists
    const existingUser = await User.findOne({ phone }).lean();
    if (existingUser) {
      return NextResponse.json({ error: 'رقم الهاتف مستخدم بالفعل' }, { status: 409 });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password || '1234');

    const nurseData = {
      name,
      phone,
      password: hashedPassword,
      role: 'nurse',
      clinicId: effectiveClinicId,
      active: true,
      salary: Number(salary) || 0,
    };

    const createdDoc = await User.create(nurseData);
    const createdId = createdDoc._id.toString();

    return NextResponse.json({ id: createdId, name, phone, role: 'nurse', active: true, clinicId: effectiveClinicId, salary: nurseData.salary }, { status: 201 });
  } catch (error) {
    console.error('Create nurse error:', error);
    return NextResponse.json({ error: 'خطأ في إضافة الممرض' }, { status: 500 });
  }
}
