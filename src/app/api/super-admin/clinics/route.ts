// ═══════════════════════════════════════════════════════════
// 👑 Super Admin - Clinics Management API
// CRUD operations for clinics (super admin only)
// ═══════════════════════════════════════════════════════════

import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Patient from '@/models/Patient';
import Service from '@/models/Service';
import Clinic from '@/models/Clinic';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest, hashPassword, generateRecoveryCode } from '@/lib/auth';
import { createClinic, getAllClinics, setClinicSubscription, createAuditLog } from '@/lib/multi-tenant';
import { DEFAULT_SERVICES } from '@/lib/services-data';

// GET: List all clinics with stats
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const auth = extractAuthFromRequest(request);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const clinics = await getAllClinics();

    // Enrich with stats
    const enrichedClinics = await Promise.all(clinics.map(async (clinic) => {
      try {
        // Count users for this clinic
        const userCount = await User.countDocuments({ clinicId: clinic.id });

        // Count patients
        const patientCount = await Patient.countDocuments({ clinicId: clinic.id });

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
    await dbConnect();
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
      await User.create({
        name: adminName,
        phone: ownerPhone || phone,
        password: hashedPassword,
        role: 'admin',
        clinicId: result.clinicId,
        active: true,
        recoveryCode: generateRecoveryCode(),
      });
    }

    // Seed default services for the new clinic
    const servicesWithClinicId = DEFAULT_SERVICES.map(s => ({
      ...s,
      clinicId: result.clinicId,
      active: true,
      status: 'active',
    }));
    await Service.create(servicesWithClinicId);

    // Update clinic as setup complete
    await Clinic.findByIdAndUpdate(result.clinicId, {
      $set: { setupComplete: true },
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
