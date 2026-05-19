// ═══════════════════════════════════════════════════════════
// 🔄 Platform Migration API
// Upgrades existing admin to super_admin for pre-multi-tenant setups
// Called once to migrate old single-clinic data to multi-tenant
// ═══════════════════════════════════════════════════════════

import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, generateToken, verifyPassword } from '@/lib/auth';
import { setPlatformConfig, getPlatformConfig, createClinic, createAuditLog } from '@/lib/multi-tenant';
import { DEFAULT_SERVICES } from '@/lib/services-data';

// GET: Check migration status - is a super_admin needed?
export async function GET() {
  try {
    // Check if any super_admin exists in the users collection
    const superAdminSnapshot = await adminDb
      .collection('users')
      .where('role', '==', 'super_admin')
      .limit(1)
      .get();

    const platformConfig = await getPlatformConfig();

    return NextResponse.json({
      superAdminExists: !superAdminSnapshot.empty,
      platformConfigured: platformConfig?.superAdminCreated || false,
      migrationNeeded: superAdminSnapshot.empty,
    });
  } catch (error) {
    console.error('Migration check error:', error);
    return NextResponse.json({
      superAdminExists: false,
      platformConfigured: false,
      migrationNeeded: true,
    });
  }
}

// POST: Migrate - promote existing admin to super_admin
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json({ error: 'يرجى إدخال رقم الهاتف وكلمة المرور' }, { status: 400 });
    }

    // Check if super_admin already exists
    const existingSuperAdmin = await adminDb
      .collection('users')
      .where('role', '==', 'super_admin')
      .limit(1)
      .get();

    if (!existingSuperAdmin.empty) {
      return NextResponse.json({ error: 'يوجد مدير رئيسي بالفعل' }, { status: 400 });
    }

    // Find the user by phone
    const userSnapshot = await adminDb
      .collection('users')
      .where('phone', '==', phone)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return NextResponse.json({ error: 'رقم الهاتف غير موجود' }, { status: 404 });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    // Verify password
    const passwordValid = await verifyPassword(password, userData.password);
    if (!passwordValid) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
    }

    // Migrate password to bcrypt if needed
    if (!userData.password.startsWith('$2a$') && !userData.password.startsWith('$2b$')) {
      try {
        const hashedPassword = await hashPassword(password);
        await adminDb.collection('users').doc(userDoc.id).update({ password: hashedPassword });
      } catch {}
    }

    // Promote user to super_admin
    await adminDb.collection('users').doc(userDoc.id).update({
      role: 'super_admin',
      clinicId: null,
    });

    let clinicId = userData.clinicId || null;

    // If no clinic exists yet, create or migrate one
    if (!clinicId) {
      // Check if there's an old clinic document
      const oldClinicSnapshot = await adminDb.collection('clinic').limit(1).get();

      // Check if there's already a clinics collection entry
      const clinicsSnapshot = await adminDb.collection('clinics').limit(1).get();

      if (!clinicsSnapshot.empty) {
        clinicId = clinicsSnapshot.docs[0].id;
      } else if (!oldClinicSnapshot.empty) {
        // Migrate from old clinic collection
        const oldData = oldClinicSnapshot.docs[0].data();
        const result = await createClinic({
          name: oldData.name || 'عيادتي',
          phone: oldData.phone || phone,
          ownerPhone: phone,
          subscriptionType: 'trial',
          trialDays: 90,
        });
        clinicId = result.clinicId;

        // Copy old clinic settings
        await adminDb.collection('clinics').doc(clinicId).update({
          name: oldData.name || 'عيادتي',
          description: oldData.description || '',
          phone: oldData.phone || '',
          address: oldData.address || '',
          logo: oldData.logo || '',
          primaryColor: oldData.primaryColor || 'emerald',
          setupComplete: true,
        });

        // Migrate all existing data to this clinic
        const BATCH_LIMIT = 450;
        const collectionsToMigrate = ['patients', 'services', 'visits', 'invoices', 'emergencies', 'notifications'];
        for (const col of collectionsToMigrate) {
          try {
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
          } catch {}
        }

        // Migrate other users to this clinic
        const usersSnapshot = await adminDb.collection('users').get();
        if (!usersSnapshot.empty) {
          const batch = adminDb.batch();
          usersSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (doc.id !== userDoc.id && data.role !== 'super_admin' && !data.clinicId) {
              batch.update(doc.ref, { clinicId: clinicId });
            }
          });
          await batch.commit();
        }
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

        // Seed default services
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
    }

    // Set platform config
    await setPlatformConfig({
      superAdminCreated: true,
      version: '2.0.0',
      defaultClinicId: clinicId || undefined,
    });

    // Generate new JWT token with super_admin role
    const token = generateToken({
      userId: userDoc.id,
      role: 'super_admin',
      clinicId: null,
    });

    // Audit log
    await createAuditLog({
      clinicId: null,
      userId: userDoc.id,
      action: 'admin_promoted_to_super_admin',
      details: `User ${userData.name} (${phone}) promoted to super_admin via migration`,
      severity: 'warning',
    });

    return NextResponse.json({
      success: true,
      message: 'تم ترقية الحساب إلى إدارة المنصة بنجاح',
      user: {
        id: userDoc.id,
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
