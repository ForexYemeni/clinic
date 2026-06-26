// ═══════════════════════════════════════════════════════════
// 👑 Super Admin - Clinics Management API (Prisma + PostgreSQL)
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
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

    const enrichedClinics = await Promise.all(clinics.map(async (clinic) => {
      try {
        const [userCount, patientCount] = await Promise.all([
          prisma.user.count({ where: { clinicId: clinic.id } }),
          prisma.patient.count({ where: { clinicId: clinic.id } }),
        ]);
        return { ...clinic, userCount, patientCount };
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

// POST: Create a new clinic (with subscription + admin + default services)
export async function POST(request: NextRequest) {
  try {
    const auth = extractAuthFromRequest(request);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name, phone, ownerPhone, description, address,
      subscriptionType, trialDays, adminName, adminPassword,
    } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'يرجى إدخال اسم العيادة ورقم الهاتف' }, { status: 400 });
    }

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
    let adminUser: any = null;
    if (adminName && adminPassword) {
      const hashedPassword = await hashPassword(adminPassword);
      adminUser = await prisma.user.create({
        data: {
          name: adminName,
          phone: ownerPhone || phone,
          password: hashedPassword,
          role: 'admin',
          clinicId: result.clinicId,
          active: true,
          recoveryCode: generateRecoveryCode(),
        },
      });
    }

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
        clinicId: result.clinicId,
      })),
    });

    // Mark clinic as setup complete + set adminId
    await prisma.clinic.update({
      where: { id: result.clinicId },
      data: {
        setupComplete: true,
        ...(adminUser ? { adminId: adminUser.id, adminPhone: adminUser.phone } : {}),
      },
    });

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
