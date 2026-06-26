// ═══════════════════════════════════════════════════════════
// 🏥 Clinic Settings API (Prisma + PostgreSQL)
// Multi-tenant: reads/writes using clinicId from JWT
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';
import { verifyPassword } from '@/lib/auth';
import { DEFAULT_SERVICES } from '@/lib/services-data';

export const maxDuration = 30;

// GET: Get clinic settings
export async function GET(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);

    if (!effectiveClinicId) {
      return NextResponse.json({
        name: 'عيادتي', description: '', phone: '', address: '', logo: '', primaryColor: 'emerald',
      });
    }

    const clinic = await prisma.clinic.findUnique({ where: { id: effectiveClinicId } });
    if (!clinic) {
      return NextResponse.json({
        name: 'عيادتي', description: '', phone: '', address: '', logo: '', primaryColor: 'emerald',
      });
    }

    return NextResponse.json({
      id: clinic.id,
      name: clinic.name || '',
      description: clinic.description || '',
      phone: clinic.phone || '',
      address: clinic.address || '',
      logo: clinic.logo || '',
      primaryColor: clinic.primaryColor || 'emerald',
    });
  } catch (error) {
    console.error('Get clinic error:', error);
    return NextResponse.json({
      name: 'عيادتي', description: '', phone: '', address: '', logo: '', primaryColor: 'emerald',
    });
  }
}

// PUT: Update clinic settings
export async function PUT(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const body = await request.json();
    const { name, description, phone, address, logo, primaryColor } = body;

    if (!effectiveClinicId) {
      return NextResponse.json({ error: 'لم يتم تحديد العيادة' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = String(name);
    if (description !== undefined) updateData.description = String(description);
    if (phone !== undefined) updateData.phone = String(phone);
    if (address !== undefined) updateData.address = String(address);
    if (primaryColor !== undefined) updateData.primaryColor = String(primaryColor);

    // Logo size guard
    if (logo !== undefined) {
      if (logo && logo.length > 900000) {
        console.warn('Logo too large, skipping save. Size:', logo.length);
      } else {
        updateData.logo = String(logo);
      }
    }

    const updated = await prisma.clinic.upsert({
      where: { id: effectiveClinicId },
      create: {
        id: effectiveClinicId,
        name: String(name || 'عيادتي'),
        description: String(description || ''),
        phone: String(phone || ''),
        address: String(address || ''),
        logo: (logo && logo.length <= 900000) ? String(logo) : '',
        primaryColor: String(primaryColor || 'emerald'),
        setupComplete: true,
      },
      update: updateData,
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name || '',
      description: updated.description || '',
      phone: updated.phone || '',
      address: updated.address || '',
      logo: updated.logo || '',
      primaryColor: updated.primaryColor || 'emerald',
    });
  } catch (error: any) {
    console.error('Update clinic error:', error);
    return NextResponse.json({ error: error?.message || 'خطأ في تحديث بيانات العيادة' }, { status: 500 });
  }
}

// DELETE: Full system reset (for current clinic only)
export async function DELETE(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const body = await request.json();
    const { confirmCode, adminPassword, adminId } = body;

    if (confirmCode !== 'حذف جميع البيانات') {
      return NextResponse.json({ error: 'كلمة التأكيد غير صحيحة' }, { status: 400 });
    }
    if (!adminId || !adminPassword) {
      return NextResponse.json({ error: 'يرجى إدخال كلمة المرور' }, { status: 400 });
    }
    if (!effectiveClinicId) {
      return NextResponse.json({ error: 'لم يتم تحديد العيادة' }, { status: 400 });
    }

    // Verify admin password
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
    }
    const passwordValid = await verifyPassword(adminPassword, admin.password);
    if (!passwordValid || (admin.role !== 'admin' && admin.role !== 'super_admin')) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
    }

    // Delete operational data — keep admin + clinic settings + services will be re-seeded
    await prisma.$transaction([
      prisma.user.deleteMany({
        where: { clinicId: effectiveClinicId, NOT: { id: adminId } },
      }),
      prisma.patient.deleteMany({ where: { clinicId: effectiveClinicId } }),
      prisma.visit.deleteMany({ where: { clinicId: effectiveClinicId } }),
      prisma.invoice.deleteMany({ where: { clinicId: effectiveClinicId } }),
      prisma.emergency.deleteMany({ where: { clinicId: effectiveClinicId } }),
      prisma.notification.deleteMany({ where: { clinicId: effectiveClinicId } }),
      prisma.service.deleteMany({ where: { clinicId: effectiveClinicId } }),
      prisma.salaryWithdrawal.deleteMany({ where: { clinicId: effectiveClinicId } }),
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
        clinicId: effectiveClinicId,
      })),
    });

    return NextResponse.json({ success: true, message: 'تم حذف جميع البيانات بنجاح وإعادة تحميل الخدمات' });
  } catch (error) {
    console.error('System reset error:', error);
    return NextResponse.json({ error: 'خطأ في إعادة تهيئة النظام' }, { status: 500 });
  }
}
