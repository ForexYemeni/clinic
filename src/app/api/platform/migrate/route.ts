// ═══════════════════════════════════════════════════════════
// 🔄 Platform Migration API
// Upgrades existing admin to super_admin for pre-multi-tenant setups
// Called once to migrate old single-clinic data to multi-tenant
// ═══════════════════════════════════════════════════════════

import dbConnect from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, generateToken, verifyPassword } from '@/lib/auth';
import { setPlatformConfig, getPlatformConfig, createClinic, createAuditLog } from '@/lib/multi-tenant';
import { DEFAULT_SERVICES } from '@/lib/services-data';
import User from '@/models/User';
import Clinic from '@/models/Clinic';
import Patient from '@/models/Patient';
import Service from '@/models/Service';
import Visit from '@/models/Visit';
import Invoice from '@/models/Invoice';
import Emergency from '@/models/Emergency';
import Notification from '@/models/Notification';

// GET: Check migration status - is a super_admin needed?
export async function GET() {
  try {
    await dbConnect();

    // Check if any super_admin exists in the users collection
    const superAdminResults = await User.find({ role: 'super_admin' }).limit(1).lean();

    const platformConfig = await getPlatformConfig();

    return NextResponse.json({
      superAdminExists: superAdminResults.length > 0,
      platformConfigured: platformConfig?.superAdminCreated || false,
      migrationNeeded: superAdminResults.length === 0,
    });
  } catch (error) {
    console.error('Migration check error:', error);
    // On error, default to migrationNeeded: false so we don't trap users on setup page
    // If there really is no super_admin, the setup check in /api/auth will handle it
    return NextResponse.json({
      superAdminExists: true,
      platformConfigured: true,
      migrationNeeded: false,
    });
  }
}

// POST: Migrate - promote existing admin to super_admin
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json({ error: 'يرجى إدخال رقم الهاتف وكلمة المرور' }, { status: 400 });
    }

    // Check if super_admin already exists
    const existingSuperAdmin = await User.find({ role: 'super_admin' }).limit(1).lean();

    if (existingSuperAdmin.length > 0) {
      return NextResponse.json({ error: 'يوجد مدير رئيسي بالفعل' }, { status: 400 });
    }

    // Find the user by phone
    const userResults = await User.find({ phone }).limit(1).lean();

    if (userResults.length === 0) {
      return NextResponse.json({ error: 'رقم الهاتف غير موجود' }, { status: 404 });
    }

    const userDoc = userResults[0];
    const userData = userDoc;
    const userDocId = userDoc._id.toString();

    // Verify password
    const passwordValid = await verifyPassword(password, userData.password);
    if (!passwordValid) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
    }

    // Migrate password to bcrypt if needed
    if (!userData.password.startsWith('$2a$') && !userData.password.startsWith('$2b$')) {
      try {
        const hashedPassword = await hashPassword(password);
        await User.findByIdAndUpdate(userDocId, { $set: { password: hashedPassword } });
      } catch {}
    }

    // Promote user to super_admin
    await User.findByIdAndUpdate(userDocId, {
      $set: {
        role: 'super_admin',
        clinicId: null,
      },
    });

    let clinicId = userData.clinicId || null;

    // If no clinic exists yet, create or migrate one
    if (!clinicId) {
      // Check if there's already a clinics collection entry
      const clinicsResults = await Clinic.find({}).limit(1).lean();

      if (clinicsResults.length > 0) {
        clinicId = clinicsResults[0]._id.toString();
      } else {
        // No clinic at all - create a new one
        const result = await createClinic({
          name: 'عيادتي',
          phone: phone,
          ownerPhone: phone,
          subscriptionType: 'trial',
          trialDays: 90,
        });
        clinicId = result.clinicId;

        // Migrate all existing data to this clinic
        const collectionsToMigrate = [
          { model: Patient, name: 'patients' },
          { model: Service, name: 'services' },
          { model: Visit, name: 'visits' },
          { model: Invoice, name: 'invoices' },
          { model: Emergency, name: 'emergencies' },
          { model: Notification, name: 'notifications' },
        ];
        for (const col of collectionsToMigrate) {
          try {
            await col.model.updateMany(
              { clinicId: { $exists: false } },
              { $set: { clinicId: clinicId } }
            );
          } catch {}
        }

        // Migrate other users to this clinic
        await User.updateMany(
          { _id: { $ne: userDocId }, role: { $ne: 'super_admin' }, clinicId: { $exists: false } },
          { $set: { clinicId: clinicId } }
        );
      }

      // Seed default services if no services exist for this clinic
      const existingServices = await Service.find({ clinicId }).limit(1).lean();
      if (existingServices.length === 0) {
        const servicesWithClinicId = DEFAULT_SERVICES.map(s => ({
          ...s,
          clinicId: clinicId,
          active: true,
          status: 'active',
        }));

        await Service.insertMany(servicesWithClinicId);
      }
    }

    // Set platform config
    await setPlatformConfig({
      superAdminCreated: true,
      version: '2.0.0',
      defaultClinicId: clinicId || undefined,
    });

    // Generate new JWT token with super_admin role
    const token = generateToken({
      userId: userDocId,
      role: 'super_admin',
      clinicId: null,
    });

    // Audit log
    await createAuditLog({
      clinicId: null,
      userId: userDocId,
      action: 'admin_promoted_to_super_admin',
      details: `User ${userData.name} (${phone}) promoted to super_admin via migration`,
      severity: 'warning',
    });

    return NextResponse.json({
      success: true,
      message: 'تم ترقية الحساب إلى إدارة المنصة بنجاح',
      user: {
        id: userDocId,
        name: userData.name || '',
        phone: userData.phone || '',
        role: 'super_admin',
        active: true,
        clinicId: null,
      },
      token,
      clinicId,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'خطأ في الترقية' }, { status: 500 });
  }
}
