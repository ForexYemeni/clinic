// ═══════════════════════════════════════════════════════════
// 👑 Super Admin - Clinics Management API
// CRUD operations for clinics (super admin only)
// ═══════════════════════════════════════════════════════════

import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest, hashPassword, generateRecoveryCode } from '@/lib/auth';
import { createClinic, getAllClinics, setClinicSubscription, createAuditLog } from '@/lib/multi-tenant';
import { DEFAULT_SERVICES } from '@/lib/services-data';

// GET: List all clinics with stats
export async function GET(request: NextRequest) {
  try {
    const auth = extractAuthFromRequest(request);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const clinics = await getAllClinics();

    // Enrich with stats
    const enrichedClinics = await Promise.all(clinics.map(async (clinic) => {
      try {
        // Count users for this clinic
        const usersSnapshot = await adminDb.collection('users')
          .where('clinicId', '==', clinic.id)
          .get();
        const userCount = usersSnapshot.size;

        // Count patients
        const patientsSnapshot = await adminDb.collection('patients')
          .where('clinicId', '==', clinic.id)
          .limit(1000)
          .get();
        const patientCount = patientsSnapshot.size;

        return {
          ...clinic,
          userCount,
          patientCount,
        };
      } catch {
        return { ...clinic, userCount: 0, patientCount: 0 };
      }
    }));

    return NextResponse.json(enrichedClinics);
  } catch (error) {
    console.error('List clinics error:', error);
    return NextResponse.json({ error: 'خطأ في جلب العيادات' }, { status: 500 });
  }
}

// POST: Create a new clinic
export async function POST(request: NextRequest) {
  try {
    const auth = extractAuthFromRequest(request);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name, phone, ownerPhone, description, address,
      subscriptionType, trialDays, adminName, adminPassword
    } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'يرجى إدخال اسم العيادة ورقم الهاتف' }, { status: 400 });
    }

    // Create clinic
    const result = await createClinic({
      name,
      phone,
      ownerPhone: ownerPhone || phone,
      subscriptionType: subscriptionType || 'trial',
      trialDays: trialDays || 14,
      description,
      address,
    });

    // Create clinic admin user if credentials provided
    if (adminName && adminPassword) {
      const hashedPassword = await hashPassword(adminPassword);
      await adminDb.collection('users').add({
        name: adminName,
        phone: ownerPhone || phone,
        password: hashedPassword,
        role: 'admin',
        clinicId: result.clinicId,
        active: true,
        recoveryCode: generateRecoveryCode(),
        createdAt: new Date().toISOString(),
      });
    }

    // Seed default services for the new clinic
    const BATCH_LIMIT = 450;
    const servicesWithClinicId = DEFAULT_SERVICES.map(s => ({
      ...s,
      clinicId: result.clinicId,
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

    // Update clinic as setup complete
    await adminDb.collection('clinics').doc(result.clinicId).update({
      setupComplete: true,
    });

    // Audit log
    await createAuditLog({
      clinicId: null,
      userId: auth.userId,
      action: 'create_clinic',
      details: `Created clinic: ${name}`,
    });

    return NextResponse.json({
      success: true,
      clinicId: result.clinicId,
      clinic: result.clinic,
    }, { status: 201 });
  } catch (error) {
    console.error('Create clinic error:', error);
    return NextResponse.json({ error: 'خطأ في إنشاء العيادة' }, { status: 500 });
  }
}
