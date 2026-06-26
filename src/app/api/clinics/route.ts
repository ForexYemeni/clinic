// ═══════════════════════════════════════════════════════════
// 🏥 Clinics API (Prisma + PostgreSQL)
// Multi-tenant clinics management (super admin)
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET: List all clinics (with stats for super admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const withStats = searchParams.get('withStats') === 'true';
    const clinicId = searchParams.get('clinicId');

    if (clinicId) {
      const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
      if (!clinic) {
        return NextResponse.json({ error: 'العيادة غير موجودة' }, { status: 404 });
      }

      const clinicData: any = { ...clinic };

      if (clinic.adminId) {
        const admin = await prisma.user.findUnique({
          where: { id: clinic.adminId },
          select: { id: true, name: true, phone: true },
        });
        if (admin) {
          clinicData.adminName = admin.name;
          clinicData.adminPhone = admin.phone;
        }
      }

      if (withStats) {
        const [patientCount, nurseCount, visitCount, emergencyCount, invoiceDocs] = await Promise.all([
          prisma.patient.count({ where: { clinicId } }),
          prisma.user.count({ where: { clinicId, role: 'nurse' } }),
          prisma.visit.count({ where: { clinicId } }),
          prisma.emergency.count({ where: { clinicId, status: 'active' } }),
          prisma.invoice.findMany({ where: { clinicId, status: { in: ['unpaid', 'partial'] } } }),
        ]);

        const unpaidAmount = invoiceDocs.reduce(
          (sum, d) => sum + (d.remaining ?? (d.total - (d.paid || 0))), 0
        );
        clinicData.stats = {
          patients: patientCount,
          nurses: nurseCount,
          visits: visitCount,
          activeEmergencies: emergencyCount,
          unpaidAmount,
        };
      }

      return NextResponse.json(clinicData);
    }

    // List all clinics
    const clinics = await prisma.clinic.findMany({ orderBy: { createdAt: 'desc' } });

    const result: any[] = [];
    for (const c of clinics) {
      const clinicData: any = { ...c };

      if (c.adminId) {
        const admin = await prisma.user.findUnique({
          where: { id: c.adminId },
          select: { id: true, name: true, phone: true },
        });
        if (admin) {
          clinicData.adminName = admin.name;
          clinicData.adminPhone = admin.phone;
        }
      }

      if (withStats) {
        const [patientCount, nurseCount] = await Promise.all([
          prisma.patient.count({ where: { clinicId: c.id } }),
          prisma.user.count({ where: { clinicId: c.id, role: 'nurse' } }),
        ]);
        clinicData.stats = { patients: patientCount, nurses: nurseCount };
      }

      result.push(clinicData);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Clinics list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب العيادات' }, { status: 500 });
  }
}

// POST: Create new clinic (legacy route, used by FirstSetupScreen fallback)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clinicName, adminName, adminPhone, phone, address, city, password } = body;

    if (!clinicName || !adminPhone) {
      return NextResponse.json({ error: 'يرجى إدخال اسم العيادة ورقم الهاتف' }, { status: 400 });
    }

    const clinic = await prisma.clinic.create({
      data: {
        name: clinicName,
        address: address || '',
        phone: phone || adminPhone,
        city: city || '',
        adminPhone,
        active: true,
        setupComplete: true,
        subPlan: 'free',
        subType: 'trial',
        subStatus: 'active',
        subStartDate: new Date(),
        subTrial: true,
        subTrialDays: 14,
      },
    });
    const clinicId = clinic.id;

    const adminUser = await prisma.user.create({
      data: {
        name: adminName || 'admin',
        phone: adminPhone,
        password,
        role: 'admin',
        active: true,
        clinicId,
      },
    });

    await prisma.clinic.update({ where: { id: clinicId }, data: { adminId: adminUser.id } });

    return NextResponse.json({
      success: true,
      clinic: { id: clinicId, name: clinicName, address, phone, city, active: true },
      admin: { id: adminUser.id, name: adminUser.name, phone: adminUser.phone, role: 'admin' },
    }, { status: 201 });
  } catch (error) {
    console.error('Create clinic error:', error);
    return NextResponse.json({ error: 'خطأ في إنشاء العيادة' }, { status: 500 });
  }
}

// PUT: Update clinic
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, address, phone, city, active } = body;

    if (!id) {
      return NextResponse.json({ error: 'يرجى تحديد العيادة' }, { status: 400 });
    }

    const clinic = await prisma.clinic.findUnique({ where: { id } });
    if (!clinic) {
      return NextResponse.json({ error: 'العيادة غير موجودة' }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (city !== undefined) updateData.city = city;
    if (active !== undefined) updateData.active = active;

    await prisma.clinic.update({ where: { id }, data: updateData });

    // If clinic is deactivated, deactivate all its users
    if (active === false) {
      await prisma.user.updateMany({ where: { clinicId: id }, data: { active: false } });
    } else if (active === true && clinic.adminId) {
      await prisma.user.updateMany({ where: { id: clinic.adminId, role: 'admin' }, data: { active: true } });
    }

    return NextResponse.json({ success: true, id, ...updateData });
  } catch (error) {
    console.error('Update clinic error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث العيادة' }, { status: 500 });
  }
}

// DELETE: Delete clinic and all its data
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'يرجى تحديد العيادة' }, { status: 400 });
    }

    const clinic = await prisma.clinic.findUnique({ where: { id } });
    if (!clinic) {
      return NextResponse.json({ error: 'العيادة غير موجودة' }, { status: 404 });
    }

    // Delete all related data in a transaction
    await prisma.$transaction([
      prisma.user.deleteMany({ where: { clinicId: id } }),
      prisma.patient.deleteMany({ where: { clinicId: id } }),
      prisma.visit.deleteMany({ where: { clinicId: id } }),
      prisma.invoice.deleteMany({ where: { clinicId: id } }),
      prisma.emergency.deleteMany({ where: { clinicId: id } }),
      prisma.service.deleteMany({ where: { clinicId: id } }),
      prisma.notification.deleteMany({ where: { clinicId: id } }),
      prisma.salaryWithdrawal.deleteMany({ where: { clinicId: id } }),
      prisma.dataResetRequest.deleteMany({ where: { clinicId: id } }),
      prisma.auditLog.deleteMany({ where: { clinicId: id } }),
      prisma.clinic.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Delete clinic error:', error);
    return NextResponse.json({ error: 'خطأ في حذف العيادة' }, { status: 500 });
  }
}
