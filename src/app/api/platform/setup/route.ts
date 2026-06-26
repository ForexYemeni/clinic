// ═══════════════════════════════════════════════════════════
// 🏗️ Super Admin Setup API (Prisma + PostgreSQL)
// First-time platform initialization
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, generateToken, generateRecoveryCode } from '@/lib/auth';
import { setPlatformConfig, getPlatformConfig, createClinic } from '@/lib/multi-tenant';
import { DEFAULT_SERVICES } from '@/lib/services-data';

// GET: Check if platform setup is needed
export async function GET() {
  try {
    const config = await getPlatformConfig();
    return NextResponse.json({
      setupNeeded: !config?.superAdminCreated,
      platformCreated: !!config,
    });
  } catch (error) {
    console.error('Platform setup check error:', error);
    return NextResponse.json({ setupNeeded: true });
  }
}

// POST: Create super admin and optionally first clinic
export async function POST(request: NextRequest) {
  try {
    const existingConfig = await getPlatformConfig();
    if (existingConfig?.superAdminCreated) {
      return NextResponse.json({ error: 'تم إعداد المنصة بالفعل' }, { status: 400 });
    }

    const body = await request.json();
    const { superAdminName, superAdminPhone, superAdminPassword, clinicName, clinicPhone } = body;

    if (!superAdminName || !superAdminPhone || !superAdminPassword) {
      return NextResponse.json({ error: 'يرجى ملء جميع حقول الإدارة الرئيسية' }, { status: 400 });
    }
    const phoneRegex = /^\d{9}$/;
    if (!phoneRegex.test(superAdminPhone)) {
      return NextResponse.json({ error: 'رقم الهاتف يجب أن يكون 9 أرقام' }, { status: 400 });
    }
    if (superAdminPassword.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(superAdminPassword);
    const recoveryCode = generateRecoveryCode();

    const adminCreated = await prisma.user.create({
      data: {
        name: superAdminName,
        phone: superAdminPhone,
        password: hashedPassword,
        role: 'super_admin',
        clinicId: '',
        active: true,
        recoveryCode,
      },
    });
    const adminId = adminCreated.id;

    // Create first clinic if provided
    let clinicData: any = null;
    let clinicId: string | null = null;

    if (clinicName) {
      const result = await createClinic({
        name: clinicName,
        phone: clinicPhone || superAdminPhone,
        ownerPhone: superAdminPhone,
        subscriptionType: 'trial',
        trialDays: 30,
      });
      clinicId = result.clinicId;
      clinicData = result.clinic;

      // Create admin user for the first clinic (different phone)
      await prisma.user.create({
        data: {
          name: superAdminName,
          phone: superAdminPhone + '_admin',
          password: hashedPassword,
          role: 'admin',
          clinicId: clinicId,
          active: true,
          recoveryCode: generateRecoveryCode(),
        },
      });

      // Seed default services
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
          clinicId: clinicId!,
        })),
      });

      // Mark clinic as setup complete
      await prisma.clinic.update({
        where: { id: clinicId },
        data: { setupComplete: true },
      });
    }

    await setPlatformConfig({
      superAdminCreated: true,
      version: '2.0.0',
      defaultClinicId: clinicId || undefined,
    });

    const token = generateToken({
      userId: adminId,
      role: 'super_admin',
      clinicId: null,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: adminId,
        name: superAdminName,
        phone: superAdminPhone,
        role: 'super_admin',
        active: true,
      },
      token,
      recoveryCode,
      clinic: clinicData ? { id: clinicId, name: clinicData.name } : null,
    });
  } catch (error) {
    console.error('Platform setup error:', error);
    return NextResponse.json({ error: 'خطأ في إعداد المنصة' }, { status: 500 });
  }
}
