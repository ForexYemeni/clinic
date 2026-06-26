// ═══════════════════════════════════════════════════════════
// 💊 Services API (Prisma + PostgreSQL)
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';

// GET: List services (filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    if (!effectiveClinicId) return NextResponse.json([]);

    const results = await prisma.service.findMany({
      where: { clinicId: effectiveClinicId, status: { not: 'deleted' } },
    });

    const services = results.sort((a, b) => {
      const catA = a.category || '';
      const catB = b.category || '';
      if (catA !== catB) return catA.localeCompare(catB, 'ar');
      return (a.nameAr || '').localeCompare(b.nameAr || '', 'ar');
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Services list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب الخدمات' }, { status: 500 });
  }
}

// POST: Add new service (admin only)
export async function POST(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const body = await request.json();
    const { nameAr, price, duration, category, description, icon, color } = body;

    if (!nameAr || price === undefined) {
      return NextResponse.json({ error: 'يرجى إدخال اسم الخدمة والسعر' }, { status: 400 });
    }
    if (!effectiveClinicId) {
      return NextResponse.json({ error: 'لم يتم تحديد العيادة' }, { status: 400 });
    }

    const created = await prisma.service.create({
      data: {
        nameAr,
        price: Number(price),
        duration: Number(duration) || 15,
        category: category || 'أخرى',
        description: description || '',
        icon: icon || '💊',
        color: color || 'emerald',
        active: true,
        status: 'active',
        clinicId: effectiveClinicId,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Create service error:', error);
    return NextResponse.json({ error: 'خطأ في إضافة الخدمة' }, { status: 500 });
  }
}

// DELETE: Delete ALL services for this clinic
export async function DELETE(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);

    if (!auth || (auth.role !== 'admin' && auth.role !== 'super_admin')) {
      return NextResponse.json({ error: 'غير مصرح. هذه العملية متاحة لمدير العيادة فقط' }, { status: 403 });
    }
    if (!effectiveClinicId) {
      return NextResponse.json({ error: 'لم يتم تحديد العيادة' }, { status: 400 });
    }

    const countResult = await prisma.service.count({ where: { clinicId: effectiveClinicId } });
    await prisma.service.deleteMany({ where: { clinicId: effectiveClinicId } });

    return NextResponse.json({
      success: true,
      message: `تم حذف جميع الخدمات (${countResult})`,
      deleted: countResult,
      total: 0,
    });
  } catch (error) {
    console.error('Delete all services error:', error);
    return NextResponse.json({ error: 'خطأ في حذف جميع الخدمات' }, { status: 500 });
  }
}
