// ═══════════════════════════════════════════════════════════
// 🏗️ Super Admin Setup API
// First-time platform initialization
// ═══════════════════════════════════════════════════════════

import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, generateToken, generateRecoveryCode } from '@/lib/auth';
import { setPlatformConfig, getPlatformConfig, createClinic, setClinicSubscription } from '@/lib/multi-tenant';
import { DEFAULT_SERVICES } from '@/lib/services-data';

// GET: Check if platform setup is needed
export async function GET() {
  try {
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
    const adminRef = await adminDb.collection('users').add({
      name: superAdminName,
      phone: superAdminPhone,
      password: hashedPassword,
      role: 'super_admin',
      clinicId: null,
      active: true,
      recoveryCode,
      createdAt: new Date().toISOString(),
    });

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
      await adminDb.collection('users').add({
        name: superAdminName,
        phone: superAdminPhone + '_admin', // Different phone for clinic admin
        password: hashedPassword,
        role: 'admin',
        clinicId: clinicId,
        active: true,
        recoveryCode: generateRecoveryCode(),
        createdAt: new Date().toISOString(),
      });

      // Seed default services for the clinic
      const BATCH_LIMIT = 450;
      const servicesWithClinicId = DEFAULT_SERVICES.map(s => ({
        ...s,
        clinicId: clinicId,
        active: true,
        status: 'active',
        createdAt: new Date().toISOString(),
      }));

      for (let i = 0; i < servicesWithClinicId.length; i += BATCH_LIMIT) {
        const batch = adminDb.batch();
        const chunk = servicesWithClinicId.slice(i, i + BATCH_LIMIT);
        chunk.forEach(service => {
          const ref = adminDb.collection('services').doc();
          batch.set(ref, service);
        });
        await batch.commit();
      }
    }

    // Migrate existing data: if there's an existing 'clinic' collection, migrate it
    try {
      const oldClinicSnapshot = await adminDb.collection('clinic').limit(1).get();
      if (!oldClinicSnapshot.empty && clinicId) {
        const oldData = oldClinicSnapshot.docs[0].data();
        // Migrate old clinic data to new clinics collection
        if (oldData.name && !clinicName) {
          await adminDb.collection('clinics').doc(clinicId).update({
            name: oldData.name,
            description: oldData.description || '',
            phone: oldData.phone || '',
            address: oldData.address || '',
            logo: oldData.logo || '',
            primaryColor: oldData.primaryColor || 'emerald',
          });
        }

        // Migrate existing data (patients, services, etc.) to add clinicId
        const collectionsToMigrate = ['patients', 'services', 'visits', 'invoices', 'emergencies', 'notifications'];
        for (const col of collectionsToMigrate) {
          const snapshot = await adminDb.collection(col).get();
          if (!snapshot.empty) {
            for (let i = 0; i < snapshot.docs.length; i += BATCH_LIMIT) {
              const batch = adminDb.batch();
              const chunk = snapshot.docs.slice(i, i + BATCH_LIMIT);
              chunk.forEach(doc => {
                const data = doc.data();
                if (!data.clinicId) {
                  batch.update(doc.ref, { clinicId: clinicId });
                }
              });
              await batch.commit();
            }
          }
        }

        // Migrate existing users (add clinicId to non-super_admin users)
        const usersSnapshot = await adminDb.collection('users').get();
        if (!usersSnapshot.empty) {
          const batch = adminDb.batch();
          usersSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.role !== 'super_admin' && !data.clinicId) {
              batch.update(doc.ref, { clinicId: clinicId });
            }
          });
          await batch.commit();
        }
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
      userId: adminRef.id,
      role: 'super_admin',
      clinicId: null,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: adminRef.id,
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
