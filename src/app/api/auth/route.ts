// ═══════════════════════════════════════════════════════════
// 🔐 Authentication API (Prisma + PostgreSQL)
// Login with phone + password, JWT tokens, subscription check
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
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

    // Find user(s) by phone
    let users: any[];
    try {
      users = await prisma.user.findMany({ where: { phone }, take: 10 });
    } catch (dbError: any) {
      const msg = dbError?.message || 'Database error';
      if (msg.includes('connect') || msg.includes('ECONN') || msg.includes('timeout')) {
        return NextResponse.json(
          { error: 'تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.' },
          { status: 503 }
        );
      }
      throw dbError;
    }

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'رقم الهاتف أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // Sort: super_admin first, then admin, then nurse
    const rolePriority: Record<string, number> = { super_admin: 0, admin: 1, nurse: 2 };
    const sortedUsers = [...users].sort((a, b) => {
      const pa = rolePriority[a.role] ?? 3;
      const pb = rolePriority[b.role] ?? 3;
      return pa - pb;
    });

    let matchedUser: any = null;
    let passwordValid = false;

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

    const userId = matchedUser.id;

    // Migrate plaintext password to bcrypt if needed (non-blocking)
    if (!matchedUser.password.startsWith('$2a$') && !matchedUser.password.startsWith('$2b$')) {
      try {
        const hashedPassword = await hashPassword(password);
        await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
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
        console.error('Subscription check error during login:', subError);
        subscriptionValid = true;
        subscriptionStatus = 'active';
      }
    } else {
      // Legacy user without clinicId — find any clinic and link them
      try {
        const oldClinic = await prisma.clinic.findFirst();
        if (oldClinic) {
          clinicId = oldClinic.id;
          clinicName = oldClinic.name;
          await prisma.user.update({ where: { id: userId }, data: { clinicId } });

          const subCheck = await checkClinicSubscription(clinicId);
          subscriptionValid = subCheck.valid;
          subscriptionStatus = subCheck.status;
          subscriptionEndDate = subCheck.endDate;
          daysRemaining = subCheck.daysRemaining;
        }
      } catch {}
    }

    // Generate JWT
    const token = generateToken({
      userId,
      role: matchedUser.role,
      clinicId,
      clinicName,
    });

    const userResponse = {
      id: userId,
      name: matchedUser.name,
      phone: matchedUser.phone,
      role: matchedUser.role,
      active: matchedUser.active,
      clinicId,
    };

    // If subscription expired, return special flag (frontend handles UI)
    const subscriptionExpired = !subscriptionValid && matchedUser.role !== 'super_admin';

    return NextResponse.json({
      token,
      user: userResponse,
      clinicName,
      clinicId,
      subscription: {
        valid: subscriptionValid,
        status: subscriptionStatus,
        endDate: subscriptionEndDate,
        daysRemaining,
      },
      subscriptionExpired,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.' },
      { status: 500 }
    );
  }
}

// GET: Check if first-time setup is needed
export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const clinicCount = await prisma.clinic.count();
    const platformConfig = await getPlatformConfig();

    const isFirstSetup = userCount === 0 && clinicCount === 0 && !platformConfig?.superAdminCreated;

    return NextResponse.json({
      isFirstSetup,
      hasSuperAdmin: platformConfig?.superAdminCreated || false,
      hasClinic: clinicCount > 0,
      hasUser: userCount > 0,
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ isFirstSetup: false });
  }
}
