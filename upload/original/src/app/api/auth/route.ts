// ═══════════════════════════════════════════════════════════
// 🔐 Authentication API
// Login with phone + password, JWT tokens, subscription check
// Includes Firebase error handling for quota/billing issues
// ═══════════════════════════════════════════════════════════

import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, generateToken, hashPassword } from '@/lib/auth';
import { checkClinicSubscription, getPlatformConfig, getClinicById, createAuditLog } from '@/lib/multi-tenant';
import { isFirebaseUnavailableError, handleFirebaseError } from '@/lib/firebase-error-handler';

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
    let usersSnapshot;
    try {
      usersSnapshot = await adminDb
        .collection('users')
        .where('phone', '==', phone)
        .limit(10)
        .get();
    } catch (dbError) {
      return handleFirebaseError(dbError, 'تسجيل الدخول');
    }

    if (usersSnapshot.empty) {
      return NextResponse.json(
        { error: 'رقم الهاتف أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // If multiple users have the same phone, try each one starting with super_admin
    // This handles the case where a super_admin and clinic admin share the same phone
    let userDoc = usersSnapshot.docs[0];
    let userData = userDoc.data();
    let passwordValid = false;

    // Sort: try super_admin first, then admin, then nurse
    const rolePriority: Record<string, number> = { super_admin: 0, admin: 1, nurse: 2 };
    const sortedDocs = [...usersSnapshot.docs].sort((a, b) => {
      const pa = rolePriority[a.data().role] ?? 3;
      const pb = rolePriority[b.data().role] ?? 3;
      return pa - pb;
    });

    for (const doc of sortedDocs) {
      const data = doc.data();
      if (!data.active) continue;
      const valid = await verifyPassword(password, data.password);
      if (valid) {
        userDoc = doc;
        userData = data;
        passwordValid = true;
        break;
      }
    }

    if (!passwordValid) {
      // Try to create audit log but don't block login response on failure
      try {
        await createAuditLog({
          clinicId: null,
          userId: '',
          action: 'login_failed',
          details: 'Invalid password attempt for phone: ' + phone,
          severity: 'warning',
        });
      } catch {}
      return NextResponse.json(
        { error: 'رقم الهاتف أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    if (!userData.active) {
      return NextResponse.json(
        { error: 'الحساب معطل' },
        { status: 403 }
      );
    }

    // Migrate plaintext password to bcrypt if needed (non-blocking)
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
      try {
        const subCheck = await checkClinicSubscription(clinicId);
        subscriptionValid = subCheck.valid;
        subscriptionStatus = subCheck.status;
        subscriptionEndDate = subCheck.endDate;
        daysRemaining = subCheck.daysRemaining;

        const clinic = await getClinicById(clinicId);
        if (clinic) {
          clinicName = clinic.name;
        }
      } catch (subError) {
        // If subscription check fails due to Firebase, still allow login
        // but mark subscription as potentially invalid
        console.error('Subscription check error during login:', subError);
        if (isFirebaseUnavailableError(subError)) {
          // Allow login but with a warning - don't block users
          subscriptionValid = true; // Allow access when we can't verify
          subscriptionStatus = 'active';
        }
      }
    } else {
      // User without clinicId - check if they exist in old 'clinic' collection
      try {
        const oldClinicSnapshot = await adminDb.collection('clinic').limit(1).get();
        if (!oldClinicSnapshot.empty) {
          clinicId = oldClinicSnapshot.docs[0].id;
          clinicName = oldClinicSnapshot.docs[0].data().name || '';
          // Update user with clinicId (non-blocking)
          try {
            await adminDb.collection('users').doc(userDoc.id).update({ clinicId });
          } catch {}

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

    // Audit log (non-blocking - don't fail login if audit fails)
    try {
      await createAuditLog({
        clinicId,
        userId: userDoc.id,
        action: 'login_success',
        details: `User ${userData.name} logged in`,
      });
    } catch {}

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
    // Check if this is a Firebase quota/billing error
    if (isFirebaseUnavailableError(error)) {
      return handleFirebaseError(error, 'تسجيل الدخول');
    }
    return NextResponse.json(
      { error: 'خطأ في تسجيل الدخول. يرجى المحاولة مرة أخرى.' },
      { status: 500 }
    );
  }
}

// GET: Check if setup is needed OR validate existing token (session restore)
export async function GET(request: NextRequest) {
  // If Authorization header is present, validate token and restore session
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const { verifyToken } = await import('@/lib/auth');
      const token = authHeader.substring(7);
      const authResult = verifyToken(token);

      if (!authResult) {
        return NextResponse.json({ error: 'جلسة منتهية' }, { status: 401 });
      }

      // Get user data from Firestore
      let userDoc;
      try {
        userDoc = await adminDb.collection('users').doc(authResult.userId).get();
      } catch (dbError) {
        return handleFirebaseError(dbError, 'استعادة الجلسة');
      }

      if (!userDoc.exists) {
        return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 401 });
      }

      const userData = userDoc.data();
      if (!userData.active) {
        return NextResponse.json({ error: 'الحساب معطل' }, { status: 403 });
      }

      // Check subscription for non-super_admin
      let subscriptionValid = true;
      let subscriptionStatus = 'active';
      let subscriptionEndDate = '';
      let daysRemaining = 0;
      let clinicId = authResult.clinicId || userData.clinicId || null;
      let clinicName = '';

      if (authResult.role === 'super_admin') {
        subscriptionValid = true;
      } else if (clinicId) {
        try {
          const subCheck = await checkClinicSubscription(clinicId);
          subscriptionValid = subCheck.valid;
          subscriptionStatus = subCheck.status;
          subscriptionEndDate = subCheck.endDate;
          daysRemaining = subCheck.daysRemaining;

          const clinic = await getClinicById(clinicId);
          if (clinic) clinicName = clinic.name;
        } catch (subError) {
          // Allow session restore even if subscription check fails
          if (isFirebaseUnavailableError(subError)) {
            subscriptionValid = true;
          }
        }
      }

      return NextResponse.json({
        user: {
          id: userDoc.id,
          name: userData.name || '',
          phone: userData.phone || '',
          role: userData.role || 'nurse',
          active: userData.active !== false,
          clinicId,
        },
        subscription: {
          valid: subscriptionValid,
          status: subscriptionStatus,
          endDate: subscriptionEndDate,
          daysRemaining,
        },
      });
    } catch (error) {
      // If Firebase is down, the catch block below for the outer try will handle it
      if (isFirebaseUnavailableError(error)) {
        return handleFirebaseError(error, 'استعادة الجلسة');
      }
      return NextResponse.json({ error: 'جلسة منتهية' }, { status: 401 });
    }
  }

  // No token - check if setup is needed
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
    if (isFirebaseUnavailableError(error)) {
      return handleFirebaseError(error, 'فحص الإعداد');
    }
    // On error, default to setupNeeded: false so we don't trap users on setup page
    return NextResponse.json({ setupNeeded: false, platformSetup: true });
  }
}
