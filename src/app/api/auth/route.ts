import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

// POST: Login with phone + password
export async function POST(request: NextRequest) {
  try {
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

    // Find user by phone in Firestore
    const usersSnapshot = await adminDb
      .collection('users')
      .where('phone', '==', phone)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json(
        { error: 'رقم الهاتف أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    if (!userData.active) {
      return NextResponse.json(
        { error: 'الحساب معطل' },
        { status: 403 }
      );
    }

    // Verify password (plain text comparison)
    if (userData.password !== password) {
      return NextResponse.json(
        { error: 'رقم الهاتف أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // Generate a simple token (user ID + timestamp based)
    const token = Buffer.from(`${userDoc.id}:${Date.now()}`).toString('base64');

    // Get clinic info
    const clinicSnapshot = await adminDb.collection('clinic').limit(1).get();
    const clinicData = clinicSnapshot.empty ? null : { id: clinicSnapshot.docs[0].id, ...clinicSnapshot.docs[0].data() };

    return NextResponse.json({
      user: {
        id: userDoc.id,
        name: userData.name || '',
        phone: userData.phone || '',
        role: userData.role || 'nurse',
        active: userData.active !== false,
      },
      token,
      clinic: clinicData ? { id: clinicData.id, name: clinicData.name } : null,
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'خطأ في تسجيل الدخول' },
      { status: 500 }
    );
  }
}

// GET: Check if setup is needed
export async function GET() {
  try {
    const clinicSnapshot = await adminDb
      .collection('clinic')
      .where('setupComplete', '==', true)
      .limit(1)
      .get();

    const setupNeeded = clinicSnapshot.empty;

    return NextResponse.json({
      setupNeeded,
      clinic: setupNeeded
        ? null
        : { id: clinicSnapshot.docs[0].id, ...clinicSnapshot.docs[0].data() },
    });
  } catch (error) {
    console.error('Setup check error:', error);
    return NextResponse.json(
      { error: 'خطأ في التحقق من الإعداد' },
      { status: 500 }
    );
  }
}
