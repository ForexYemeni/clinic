import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest, hashPassword } from '@/lib/auth';

// GET: List nurses (filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    const auth = extractAuthFromRequest(request);
    const clinicId = auth?.clinicId || null;

    let snapshot;
    if (clinicId) {
      try {
        snapshot = await adminDb.collection('users').where('role', '==', 'nurse').where('clinicId', '==', clinicId).get();
      } catch {
        snapshot = await adminDb.collection('users').where('role', '==', 'nurse').get();
      }
    } else {
      snapshot = await adminDb.collection('users').where('role', '==', 'nurse').get();
    }

    const nurses = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        phone: data.phone || '',
        role: data.role,
        active: data.active !== false,
        clinicId: data.clinicId || null,
        createdAt: data.createdAt || '',
      };
    });

    return NextResponse.json(nurses);
  } catch (error) {
    console.error('Nurses list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب الممرضين' }, { status: 500 });
  }
}

// POST: Add nurse (hashed password, linked to clinicId)
export async function POST(request: NextRequest) {
  try {
    const auth = extractAuthFromRequest(request);
    const clinicId = auth?.clinicId || null;
    const body = await request.json();
    const { name, phone, password } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'يرجى إدخال اسم الممرض ورقم الهاتف' }, { status: 400 });
    }

    const phoneRegex = /^\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: 'رقم الهاتف يجب أن يكون 9 أرقام' }, { status: 400 });
    }

    // Check if phone already exists
    const existingUser = await adminDb.collection('users').where('phone', '==', phone).limit(1).get();
    if (!existingUser.empty) {
      return NextResponse.json({ error: 'رقم الهاتف مستخدم بالفعل' }, { status: 409 });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password || '1234');

    const nurseData = {
      name, phone,
      password: hashedPassword,
      role: 'nurse',
      clinicId,
      active: true,
      createdAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('users').add(nurseData);

    return NextResponse.json({ id: docRef.id, name, phone, role: 'nurse', active: true, clinicId }, { status: 201 });
  } catch (error) {
    console.error('Create nurse error:', error);
    return NextResponse.json({ error: 'خطأ في إضافة الممرض' }, { status: 500 });
  }
}
