import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json({ error: 'يرجى إدخال رقم الهاتف وكلمة المرور' }, { status: 400 });
    }

    // Validate phone is 9 digits
    const phoneRegex = /^\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: 'رقم الهاتف يجب أن يكون 9 أرقام' }, { status: 400 });
    }

    // Find user by phone in Firestore
    const usersSnapshot = await adminDb.collection('users').where('phone', '==', phone).limit(1).get();
    
    if (usersSnapshot.empty) {
      return NextResponse.json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    if (!userData.active) {
      return NextResponse.json({ error: 'الحساب معطل' }, { status: 403 });
    }

    // Verify password (simple comparison - in production use bcrypt)
    if (userData.password !== password) {
      return NextResponse.json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    // Get clinic config
    const configSnapshot = await adminDb.collection('clinicConfig').limit(1).get();
    const clinicConfig = configSnapshot.empty ? {} : configSnapshot.docs[0].data();

    return NextResponse.json({
      user: {
        id: userDoc.id,
        name: userData.name || '',
        phone: userData.phone || '',
        email: userData.email || '',
        role: userData.role || 'nurse',
        active: userData.active !== false,
      },
      clinicName: clinicConfig.name || 'عيادة الإسعافات الأولية',
      isFirstSetup: clinicConfig.isFirstSetup || false,
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'خطأ في تسجيل الدخول' }, { status: 500 });
  }
}
