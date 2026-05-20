import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

// GET: List nurses
export async function GET() {
  try {
    const snapshot = await adminDb
      .collection('users')
      .where('role', '==', 'nurse')
      .get();

    const nurses = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        phone: data.phone || '',
        role: data.role,
        active: data.active !== false,
        createdAt: data.createdAt || '',
      };
    });

    return NextResponse.json(nurses);
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
    const existingUser = await adminDb
      .collection('users')
      .where('phone', '==', phone)
      .limit(1)
      .get();

    if (!existingUser.empty) {
      return NextResponse.json(
        { error: 'رقم الهاتف مستخدم بالفعل' },
        { status: 409 }
      );
    }

    // Get clinic ID for nurse association
    const clinicSnapshot = await adminDb.collection('clinic').limit(1).get();
    const clinicId = clinicSnapshot.empty ? '' : clinicSnapshot.docs[0].id;

    const nurseData = {
      name,
      phone,
      password: password || '1234',
      role: 'nurse',
      active: true,
      clinicId,
      createdAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('users').add(nurseData);

    return NextResponse.json(
      {
        id: docRef.id,
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
