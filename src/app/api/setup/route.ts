// ═══════════════════════════════════════════════════════════
// 🏗️ Clinic Setup API (Prisma + PostgreSQL)
// First-time clinic admin setup (creates clinic in new multi-tenant system)
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, generateToken, generateRecoveryCode } from '@/lib/auth';
import { createClinic, setPlatformConfig, getPlatformConfig } from '@/lib/multi-tenant';
import { DEFAULT_SERVICES } from '@/lib/services-data';

// POST: First-time clinic admin setup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminName, adminPhone, clinicName, password } = body;

    if (!adminName || !adminPhone || !clinicName || !password) {
      return NextResponse.json(
        { error: 'يرجى ملء جميع الحقول' },
        { status: 400 }
      );
    }

    // Validate phone is exactly 9 digits
    const phoneRegex = /^\d{9}$/;
    if (!phoneRegex.test(adminPhone)) {
      return NextResponse.json(
        { error: 'رقم الهاتف يجب أن يكون 9 أرقام' },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل' },
        { status: 400 }
      );
    }

    // Check phone is not already taken
    const existingUser = await prisma.user.findUnique({ where: { phone: adminPhone } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'رقم الهاتف مستخدم بالفعل' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);
    const recoveryCode = generateRecoveryCode();

    // Create clinic
    const result = await createClinic({
      name: clinicName,
      phone: adminPhone,
      ownerPhone: adminPhone,
      subscriptionType: 'trial',
      trialDays: 30,
    });

    const clinicId = result.clinicId;

    // Create admin user linked to the clinic
    const adminDoc = await prisma.user.create({
      data: {
        name: adminName,
        phone: adminPhone,
        password: hashedPassword,
        role: 'admin',
        clinicId,
        active: true,
        recoveryCode,
      },
    });
    const adminId = adminDoc.id;

    // Mark clinic as setup complete
    await prisma.clinic.update({
      where: { id: clinicId },
      data: { setupComplete: true, adminId, adminPhone },
    });

    // Seed default services for the clinic
    await prisma.service.createMany({
      data: DEFAULT_SERVICES.map((s) => ({
        nameAr: s.nameAr,
        price: s.price,
        duration: s.duration,
        category: s.category,
        description: s.description || '',
        icon: s.icon || '',
        color: s.color || '',
        active: true,
        status: 'active',
        clinicId,
      })),
    });

    // Ensure platform config is set up
    const platformConfig = await getPlatformConfig();
    if (!platformConfig?.superAdminCreated) {
      await setPlatformConfig({
        superAdminCreated: true,
        version: '2.0.0',
        defaultClinicId: clinicId,
      });
    } else if (!platformConfig.defaultClinicId) {
      await setPlatformConfig({ defaultClinicId: clinicId });
    }

    // Generate JWT token
    const token = generateToken({
      userId: adminId,
      role: 'admin',
      clinicId,
      clinicName,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: adminId,
        name: adminName,
        phone: adminPhone,
        role: 'admin',
        active: true,
        clinicId,
      },
      token,
      recoveryCode,
      clinic: {
        id: clinicId,
        name: clinicName,
      },
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'خطأ في الإعداد' },
      { status: 500 }
    );
  }
}
