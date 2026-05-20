import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId, hashPassword } from '@/lib/auth';

// GET: List nurses (filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);

    if (!effectiveClinicId) {
      return NextResponse.json([]);
    }

    let snapshot;
    try {
      snapshot = await adminDb.collection('users')
        .where('role', '==', 'nurse')
        .where('clinicId', '==', effectiveClinicId)
        .get();
    } catch {
      // If compound query fails, try single-field query and filter
      try {
        const allSnapshot = await adminDb.collection('users')
          .where('clinicId', '==', effectiveClinicId)
          .get();
        snapshot = {
          docs: allSnapshot.docs.filter(doc => doc.data().role === 'nurse'),
        } as any;
      } catch {
        // If all queries fail, return empty array instead of leaking cross-clinic data
        return NextResponse.json([]);
      }
    }

    const nurses = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          phone: data.phone || '',
          role: data.role,
          active: data.active !== false,
          clinicId: data.clinicId || null,
          salary: data.salary || 0,
          createdAt: data.createdAt || '',
        };
      })
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
      clinicId: effectiveClinicId,
      active: true,
      salary: Number(salary) || 0,
      createdAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('users').add(nurseData);

    return NextResponse.json({ id: docRef.id, name, phone, role: 'nurse', active: true, clinicId: effectiveClinicId, salary: nurseData.salary }, { status: 201 });
  } catch (error) {
    console.error('Create nurse error:', error);
    return NextResponse.json({ error: 'خطأ في إضافة الممرض' }, { status: 500 });
  }
}
