// ═══════════════════════════════════════════════════════════
// 🏗️ Super Admin Setup API
// First-time platform initialization
// ═══════════════════════════════════════════════════════════

import dbConnect from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, generateToken, generateRecoveryCode } from '@/lib/auth';
import { setPlatformConfig, getPlatformConfig, createClinic } from '@/lib/multi-tenant';
import { DEFAULT_SERVICES } from '@/lib/services-data';
import User from '@/models/User';
import Patient from '@/models/Patient';
import Service from '@/models/Service';
import Visit from '@/models/Visit';
import Invoice from '@/models/Invoice';
import Emergency from '@/models/Emergency';
import Notification from '@/models/Notification';

// GET: Check if platform setup is needed
export async function GET() {
  try {
    await dbConnect();
    const config = await getPlatformConfig();
    const setupNeeded = !config?.superAdminCreated;

    return NextResponse.json({
      setupNeeded,
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
    await dbConnect();

    // Check if super admin already exists
    const existingConfig = await getPlatformConfig();
    if (existingConfig?.superAdminCreated) {
      return NextResponse.json({ error: 'تم إعداد المنصة بالفعل' }, { status: 400 });
    }

    const body = await request.json();
    const { superAdminName, superAdminPhone, superAdminPassword, clinicName, clinicPhone } = body;

    if (!superAdminName || !superAdminPhone || !superAdminPassword) {
      return NextResponse.json({ error: 'يرجى ملء جميع حقول الإدارة الرئيسية' }, { status: 400 });
    }

    // Validate phone
    const phoneRegex = /^\d{9}$/;
    if (!phoneRegex.test(superAdminPhone)) {
      return NextResponse.json({ error: 'رقم الهاتف يجب أن يكون 9 أرقام' }, { status: 400 });
    }

    if (superAdminPassword.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await hashPassword(superAdminPassword);
    const recoveryCode = generateRecoveryCode();

    // Create super admin user
    const adminCreated = await User.create({
      name: superAdminName,
      phone: superAdminPhone,
      password: hashedPassword,
      role: 'super_admin',
      clinicId: null,
      active: true,
      recoveryCode,
    });

    const adminId = adminCreated._id.toString();

    // Create first clinic if provided
    let clinicData = null;
    let clinicId = null;

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

      // Create admin user for the first clinic
      await User.create({
        name: superAdminName,
        phone: superAdminPhone + '_admin', // Different phone for clinic admin
        password: hashedPassword,
        role: 'admin',
        clinicId: clinicId,
        active: true,
        recoveryCode: generateRecoveryCode(),
      });

      // Seed default services for the clinic
      const servicesWithClinicId = DEFAULT_SERVICES.map(s => ({
        ...s,
        clinicId: clinicId,
        active: true,
        status: 'active',
      }));

      await Service.insertMany(servicesWithClinicId);
    }

    // Migrate existing data: if there are existing records without clinicId, migrate them
    try {
      if (clinicId) {
        // Migrate existing data (patients, services, etc.) to add clinicId
        const collectionsToMigrate = [
          Patient,
          Service,
          Visit,
          Invoice,
          Emergency,
          Notification,
        ];
        for (const model of collectionsToMigrate) {
          await model.updateMany(
            { clinicId: { $exists: false } },
            { $set: { clinicId: clinicId } }
          );
        }

        // Migrate existing users (add clinicId to non-super_admin users)
        await User.updateMany(
          { role: { $ne: 'super_admin' }, clinicId: { $exists: false } },
          { $set: { clinicId: clinicId } }
        );
      }
    } catch (migrationError) {
      console.error('Migration error (non-critical):', migrationError);
    }

    // Set platform config
    await setPlatformConfig({
      superAdminCreated: true,
      version: '2.0.0',
      defaultClinicId: clinicId || undefined,
    });

    // Generate JWT token
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
