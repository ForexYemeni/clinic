// ═══════════════════════════════════════════════════════════
// 🔐 Authentication API
// Login with phone + password, JWT tokens, subscription check
// ═══════════════════════════════════════════════════════════

import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, generateToken, hashPassword } from '@/lib/auth';
import { checkClinicSubscription, getPlatformConfig, getClinicById, createAuditLog } from '@/lib/multi-tenant';

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

    // Verify password (supports both bcrypt and legacy plaintext)
    const passwordValid = await verifyPassword(password, userData.password);
    if (!passwordValid) {
      await createAuditLog({
        clinicId: userData.clinicId || null,
        userId: userDoc.id,
        action: 'login_failed',
        details: 'Invalid password attempt',
        severity: 'warning',
      });
      return NextResponse.json(
        { error: 'رقم الهاتف أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // Migrate plaintext password to bcrypt if needed
    if (!userData.password.startsWith('$2a$') && !userData.password.startsWith('$2b$')) {
      try {
        const hashedPassword = await hashPassword(password);
        await adminDb.collection('users').doc(userDoc.id).update({ password: hashedPassword });
      } catch {}
    }

    // Determine clinic info and check subscription
    let clinicId = userData.clinicId || null;
    let clinicName = '';
    let subscriptionValid = true;
    let subscriptionStatus = 'active';
    let subscriptionEndDate = '';
    let daysRemaining = 0;

    if (userData.role === 'super_admin') {
      // Super admin - no clinic restriction
      subscriptionValid = true;
    } else if (clinicId) {
      // Regular user - check clinic subscription
      const subCheck = await checkClinicSubscription(clinicId);
      subscriptionValid = subCheck.valid;
      subscriptionStatus = subCheck.status;
      subscriptionEndDate = subCheck.endDate;
      daysRemaining = subCheck.daysRemaining;

      // Get clinic name
      const clinic = await getClinicById(clinicId);
      if (clinic) {
        clinicName = clinic.name;
      }
    } else {
      // User without clinicId - try to find their clinic from old data
      try {
        const clinicSnapshot = await adminDb.collection('clinics').limit(1).get();
        if (!clinicSnapshot.empty) {
          clinicId = clinicSnapshot.docs[0].id;
          clinicName = clinicSnapshot.docs[0].data().name || '';
          // Update user with clinicId
          await adminDb.collection('users').doc(userDoc.id).update({ clinicId });

          const subCheck = await checkClinicSubscription(clinicId);
          subscriptionValid = subCheck.valid;
          subscriptionStatus = subCheck.status;
          subscriptionEndDate = subCheck.endDate;
          daysRemaining = subCheck.daysRemaining;
        }
      } catch {}
    }

    // If subscription expired/suspended, return error with info
    if (!subscriptionValid && userData.role !== 'super_admin') {
      return NextResponse.json({
        error: subscriptionStatus === 'suspended'
          ? 'حساب العيادة موقوف. تواصل مع الإدارة'
          : 'انتهت فترة الاشتراك. تواصل مع الإدارة للتجديد',
        subscriptionExpired: true,
        subscriptionStatus,
        subscriptionEndDate,
        clinicName,
      }, { status: 403 });
    }

    // Generate JWT token
    const token = generateToken({
      userId: userDoc.id,
      role: userData.role,
      clinicId,
      clinicName,
    });

    // Audit log
    await createAuditLog({
      clinicId,
      userId: userDoc.id,
      action: 'login_success',
      details: `User ${userData.name} logged in`,
    });

    return NextResponse.json({
      user: {
        id: userDoc.id,
        name: userData.name || '',
        phone: userData.phone || '',
        role: userData.role || 'nurse',
        active: userData.active !== false,
        clinicId,
      },
      token,
      clinic: clinicId ? { id: clinicId, name: clinicName } : null,
      subscription: {
        valid: subscriptionValid,
        status: subscriptionStatus,
        endDate: subscriptionEndDate,
        daysRemaining,
      },
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
    // Check if platform has been set up
    const platformConfig = await getPlatformConfig();
    const platformSetup = platformConfig?.superAdminCreated || false;

    // Check if any clinic exists
    const clinicSnapshot = await adminDb
      .collection('clinics')
      .where('setupComplete', '==', true)
      .limit(1)
      .get();

    // Also check old clinic collection for backward compatibility
    const oldClinicSnapshot = await adminDb
      .collection('clinic')
      .where('setupComplete', '==', true)
      .limit(1)
      .get();

    const setupNeeded = clinicSnapshot.empty && oldClinicSnapshot.empty;

    return NextResponse.json({
      setupNeeded,
      platformSetup,
      clinic: setupNeeded
        ? null
        : clinicSnapshot.empty
          ? (oldClinicSnapshot.empty ? null : { id: oldClinicSnapshot.docs[0].id, ...oldClinicSnapshot.docs[0].data() })
          : { id: clinicSnapshot.docs[0].id, ...clinicSnapshot.docs[0].data() },
    });
  } catch (error) {
    console.error('Setup check error:', error);
    return NextResponse.json({ setupNeeded: true, platformSetup: false });
  }
}
