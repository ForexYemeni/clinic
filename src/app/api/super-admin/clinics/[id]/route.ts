// ═══════════════════════════════════════════════════════════
// 👑 Super Admin - Single Clinic Management API (Prisma + PostgreSQL)
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest, verifyPassword } from '@/lib/auth';
import {
  getClinicById,
  setClinicSubscription,
  createAuditLog,
  checkClinicSubscription,
} from '@/lib/multi-tenant';
import { DEFAULT_SERVICES } from '@/lib/services-data';

// GET: Get single clinic details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = extractAuthFromRequest(request);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { id } = await params;
    const clinic = await getClinicById(id);
    if (!clinic) {
      return NextResponse.json({ error: 'العيادة غير موجودة' }, { status: 404 });
    }

    const [userCount, patientCount, serviceCount, invoiceCount, invoices, users] = await Promise.all([
      prisma.user.count({ where: { clinicId: id } }),
      prisma.patient.count({ where: { clinicId: id } }),
      prisma.service.count({ where: { clinicId: id } }),
      prisma.invoice.count({ where: { clinicId: id } }),
      prisma.invoice.findMany({ where: { clinicId: id }, select: { paid: true } }),
      prisma.user.findMany({ where: { clinicId: id }, select: { id: true, name: true, phone: true, role: true, active: true, salary: true, createdAt: true } }),
    ]);

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.paid || 0), 0);
    const subCheck = await checkClinicSubscription(id);

    return NextResponse.json({
      ...clinic,
      stats: {
        userCount,
        patientCount,
        serviceCount,
        invoiceCount,
        totalRevenue,
      },
      users,
      subscriptionCheck: subCheck,
    });
  } catch (error) {
    console.error('Get clinic error:', error);
    return NextResponse.json({ error: 'خطأ في جلب بيانات العيادة' }, { status: 500 });
  }
}

// PUT: Update clinic (subscription, status, settings)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = extractAuthFromRequest(request);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, ...data } = body;

    const clinic = await getClinicById(id);
    if (!clinic) {
      return NextResponse.json({ error: 'العيادة غير موجودة' }, { status: 404 });
    }

    switch (action) {
      case 'extend_subscription': {
        const days = data.days || 30;
        const type = data.subscriptionType || clinic.subscription?.type || 'monthly';
        const subscription = await setClinicSubscription(id, { type, days, extendFromExisting: true });
        await createAuditLog({ clinicId: id, userId: auth.userId, action: 'extend_subscription', details: `Extended ${clinic.name} subscription by ${days} days` });
        return NextResponse.json({ success: true, subscription });
      }

      case 'suspend': {
        await prisma.clinic.update({
          where: { id },
          data: { active: false, subStatus: 'suspended' },
        });
        await createAuditLog({ clinicId: id, userId: auth.userId, action: 'suspend_clinic', details: `Suspended clinic: ${clinic.name}` });
        return NextResponse.json({ success: true, status: 'suspended' });
      }

      case 'activate': {
        const currentSub = clinic.subscription;
        const days = data.days;
        if (days && days > 0) {
          const subscription = await setClinicSubscription(id, {
            type: data.subscriptionType || currentSub?.type || 'monthly',
            days,
            status: 'active',
            extendFromExisting: true,
          });
          await createAuditLog({ clinicId: id, userId: auth.userId, action: 'activate_clinic', details: `Activated clinic: ${clinic.name} with ${days} days` });
          return NextResponse.json({ success: true, subscription });
        } else {
          const newStatus = currentSub?.type === 'trial' ? 'trial' : 'active';
          await prisma.clinic.update({
            where: { id },
            data: { subStatus: newStatus, active: true },
          });
          await createAuditLog({ clinicId: id, userId: auth.userId, action: 'activate_clinic', details: `Reactivated clinic: ${clinic.name} (preserved existing end date)` });
          return NextResponse.json({ success: true, subscription: { ...currentSub, status: newStatus } });
        }
      }

      case 'update_settings': {
        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.phone) updateData.phone = data.phone;
        if (data.address) updateData.address = data.address;
        if (data.description) updateData.description = data.description;
        if (data.logo !== undefined) updateData.logo = data.logo;
        if (data.primaryColor) updateData.primaryColor = data.primaryColor;
        await prisma.clinic.update({ where: { id }, data: updateData });
        return NextResponse.json({ success: true });
      }

      case 'reset_data': {
        if (!data.superAdminPassword) {
          return NextResponse.json({ error: 'يرجى إدخال كلمة المرور' }, { status: 400 });
        }
        const superAdmin = await prisma.user.findUnique({ where: { id: auth.userId } });
        if (!superAdmin) {
          return NextResponse.json({ error: 'حساب المدير غير موجود' }, { status: 401 });
        }
        const passwordValid = await verifyPassword(data.superAdminPassword, superAdmin.password);
        if (!passwordValid) {
          return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
        }

        // Delete nurses + operational data + services (keep admin + clinic settings)
        await prisma.$transaction([
          prisma.user.deleteMany({ where: { clinicId: id, role: 'nurse' } }),
          prisma.patient.deleteMany({ where: { clinicId: id } }),
          prisma.visit.deleteMany({ where: { clinicId: id } }),
          prisma.invoice.deleteMany({ where: { clinicId: id } }),
          prisma.emergency.deleteMany({ where: { clinicId: id } }),
          prisma.notification.deleteMany({ where: { clinicId: id } }),
          prisma.salaryWithdrawal.deleteMany({ where: { clinicId: id } }),
          prisma.service.deleteMany({ where: { clinicId: id } }),
        ]);

        // Re-seed default services
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
            clinicId: id,
          })),
        });

        await createAuditLog({
          clinicId: id,
          userId: auth.userId,
          action: 'reset_clinic_data',
          details: `Reset all data for clinic: ${clinic.name}`,
          severity: 'critical',
        });

        return NextResponse.json({ success: true, message: 'تم إعادة تعيين بيانات العيادة بنجاح' });
      }

      default:
        return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
    }
  } catch (error) {
    console.error('Update clinic error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث العيادة' }, { status: 500 });
  }
}

// DELETE: Delete a clinic and all its data
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = extractAuthFromRequest(request);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { id } = await params;
    const clinic = await getClinicById(id);
    if (!clinic) {
      return NextResponse.json({ error: 'العيادة غير موجودة' }, { status: 404 });
    }

    // Delete all related data in a transaction
    await prisma.$transaction([
      prisma.user.deleteMany({ where: { clinicId: id, role: { not: 'super_admin' } } }),
      prisma.patient.deleteMany({ where: { clinicId: id } }),
      prisma.service.deleteMany({ where: { clinicId: id } }),
      prisma.visit.deleteMany({ where: { clinicId: id } }),
      prisma.invoice.deleteMany({ where: { clinicId: id } }),
      prisma.emergency.deleteMany({ where: { clinicId: id } }),
      prisma.notification.deleteMany({ where: { clinicId: id } }),
      prisma.salaryWithdrawal.deleteMany({ where: { clinicId: id } }),
      prisma.dataResetRequest.deleteMany({ where: { clinicId: id } }),
      prisma.clinic.delete({ where: { id } }),
    ]);

    await createAuditLog({
      clinicId: null,
      userId: auth.userId,
      action: 'delete_clinic',
      details: `Deleted clinic: ${clinic.name}`,
      severity: 'critical',
    });

    return NextResponse.json({ success: true, message: 'تم حذف العيادة وجميع بياناتها' });
  } catch (error) {
    console.error('Delete clinic error:', error);
    return NextResponse.json({ error: 'خطأ في حذف العيادة' }, { status: 500 });
  }
}
