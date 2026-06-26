// ═══════════════════════════════════════════════════════════
// 🔐 Authentication API
// Login with phone + password, JWT tokens, subscription check
// Includes MongoDB error handling for connection/availability issues
// ═══════════════════════════════════════════════════════════

import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Clinic from '@/models/Clinic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, generateToken, hashPassword } from '@/lib/auth';
import { checkClinicSubscription, getPlatformConfig, getClinicById, createAuditLog } from '@/lib/multi-tenant';
import { isMongoUnavailableError, handleMongoError } from '@/lib/mongo-error-handler';
import { toClient } from '@/lib/mongoose-helpers';

// POST: Login with phone + password
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
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

    // Find user by phone in MongoDB
    let users: any[];
    try {
      users = await User.find({ phone }).limit(10).lean();
    } catch (dbError) {
      return handleMongoError(dbError, 'تسجيل الدخول');
    }

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'رقم الهاتف أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // If multiple users have the same phone, try each one starting with super_admin
    // This handles the case where a super_admin and clinic admin share the same phone
    let matchedUser = users[0];
    let passwordValid = false;

    // Sort: try super_admin first, then admin, then nurse
    const rolePriority: Record<string, number> = { super_admin: 0, admin: 1, nurse: 2 };
    const sortedUsers = [...users].sort((a, b) => {
      const pa = rolePriority[a.role] ?? 3;
      const pb = rolePriority[b.role] ?? 3;
      return pa - pb;
    });

    for (const user of sortedUsers) {
      if (!user.active) continue;
      const valid = await verifyPassword(password, user.password);
      if (valid) {
        matchedUser = user;
        passwordValid = true;
        break;
      }
    }

    if (!passwordValid) {
      // Try to create audit log but don't block login response on failures
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

    if (!matchedUser.active) {
      return NextResponse.json(
        { error: 'الحساب معطل' },
        { status: 403 }
      );
    }

    const userId = matchedUser._id.toString();

    // Migrate plaintext password to bcrypt if needed (non-blocking)
    if (!matchedUser.password.startsWith('$2a$') && !matchedUser.password.startsWith('$2b$')) {
      try {
        const hashedPassword = await hashPassword(password);
        await User.findByIdAndUpdate(userId, { $set: { password: hashedPassword } });
      } catch {}
    }

    // Determine clinic info and check subscription
    let clinicId = matchedUser.clinicId || null;
    let clinicName = '';
    let subscriptionValid = true;
    let subscriptionStatus = 'active';
    let subscriptionEndDate = '';
    let daysRemaining = 0;

    if (matchedUser.role === 'super_admin') {
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
        // If subscription check fails due to MongoDB, still allow login
        // but mark subscription as potentially invalid
        console.error('Subscription check error during login:', subError);
        if (isMongoUnavailableError(subError)) {
          // Allow login but with a warning - don't block users
          subscriptionValid = true; // Allow access when we can't verify
          subscriptionStatus = 'active';
        }
      }
    } else {
      // User without clinicId - check if any clinic exists
      try {
        const oldClinics = await Clinic.find({}).limit(1).lean();
        if (oldClinics.length > 0) {
          const oldClinic = toClient(oldClinics[0]);
          clinicId = oldClinic.id;
          clinicName = oldClinic.name || '';
          // Update user with clinicId (non-blocking)
          try {
            await User.findByIdAndUpdate(userId, { $set: { clinicId } });
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
    if (!subscriptionValid && matchedUser.role !== 'super_admin') {
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
      userId,
      role: matchedUser.role,
      clinicId,
      clinicName,
    });

    // Audit log (non-blocking - don't fail login if audit fails)
    try {
      await createAuditLog({
        clinicId,
        userId,
        action: 'login_success',
        details: `User ${matchedUser.name} logged in`,
      });
    } catch {}

    return NextResponse.json({
      user: {
        id: userId,
        name: matchedUser.name || '',
        phone: matchedUser.phone || '',
        role: matchedUser.role || 'nurse',
        active: matchedUser.active !== false,
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
    // Check if this is a MongoDB connection/availability error
    if (isMongoUnavailableError(error)) {
      return handleMongoError(error, 'تسجيل الدخول');
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
      await dbConnect();
      const { verifyToken } = await import('@/lib/auth');
      const token = authHeader.substring(7);
      const authResult = verifyToken(token);

      if (!authResult) {
        return NextResponse.json({ error: 'جلسة منتهية' }, { status: 401 });
      }

      // Get user data from MongoDB
      let userDoc;
      try {
        userDoc = await User.findById(authResult.userId).lean();
      } catch (dbError) {
        return handleMongoError(dbError, 'استعادة الجلسة');
      }

      if (!userDoc) {
        return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 401 });
      }

      if (!userDoc.active) {
        return NextResponse.json({ error: 'الحساب معطل' }, { status: 403 });
      }

      const userId = userDoc._id.toString();

      // Check subscription for non-super_admin
      let subscriptionValid = true;
      let subscriptionStatus = 'active';
      let subscriptionEndDate = '';
      let daysRemaining = 0;
      let clinicId = authResult.clinicId || userDoc.clinicId || null;
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
          if (isMongoUnavailableError(subError)) {
            subscriptionValid = true;
          }
        }
      }

      return NextResponse.json({
        user: {
          id: userId,
          name: userDoc.name || '',
          phone: userDoc.phone || '',
          role: userDoc.role || 'nurse',
          active: userDoc.active !== false,
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
      // If MongoDB is down, the catch block below for the outer try will handle it
      if (isMongoUnavailableError(error)) {
        return handleMongoError(error, 'استعادة الجلسة');
      }
      return NextResponse.json({ error: 'جلسة منتهية' }, { status: 401 });
    }
  }

  // No token - check if setup is needed
  try {
    await dbConnect();
    // Check if platform has been set up
    const platformConfig = await getPlatformConfig();
    const platformSetup = platformConfig?.superAdminCreated || false;

    // Check if any clinic exists
    const clinicResults = await Clinic
      .find({ setupComplete: true })
      .limit(1)
      .lean();

    // Also check for any clinic (backward compatibility)
    const oldClinicResults = await Clinic
      .find({ setupComplete: true })
      .limit(1)
      .lean();

    const setupNeeded = clinicResults.length === 0 && oldClinicResults.length === 0;

    return NextResponse.json({
      setupNeeded,
      platformSetup,
      clinic: setupNeeded
        ? null
        : clinicResults.length === 0
          ? (oldClinicResults.length === 0 ? null : toClient(oldClinicResults[0]))
          : toClient(clinicResults[0]),
    });
  } catch (error) {
    console.error('Setup check error:', error);
    if (isMongoUnavailableError(error)) {
      return handleMongoError(error, 'فحص الإعداد');
    }
    // On error, default to setupNeeded: false so we don't trap users on setup page
    return NextResponse.json({ setupNeeded: false, platformSetup: true });
  }
}
