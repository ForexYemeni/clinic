// ═══════════════════════════════════════════════════════════
// 💊 Service Detail API (Prisma + PostgreSQL)
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';

// PUT: Update service
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { id } = await params;
    const body = await request.json();

    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) {
      return NextResponse.json({ error: 'الخدمة غير موجودة' }, { status: 404 });
    }
    if (!effectiveClinicId || (service.clinicId && service.clinicId !== effectiveClinicId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const updateData: any = {};
    if (body.nameAr !== undefined) updateData.nameAr = body.nameAr;
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.duration !== undefined) updateData.duration = Number(body.duration);
    if (body.category !== undefined) updateData.category = body.category;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.color !== undefined) updateData.color = body.color;

    if (body.status === 'paused') {
      updateData.status = 'paused';
      updateData.active = false;
    } else if (body.status === 'active') {
      updateData.status = 'active';
      updateData.active = true;
    }
    if (body.active !== undefined) {
      updateData.active = body.active;
      if (body.active) updateData.status = 'active';
    }

    await prisma.service.update({ where: { id }, data: updateData });

    return NextResponse.json({ id, ...updateData } as any);
  } catch (error) {
    console.error('Update service error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث الخدمة' }, { status: 500 });
  }
}

// DELETE: Soft delete service
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { id } = await params;

    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) {
      return NextResponse.json({ error: 'الخدمة غير موجودة' }, { status: 404 });
    }
    if (!effectiveClinicId || (service.clinicId && service.clinicId !== effectiveClinicId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    await prisma.service.update({
      where: { id },
      data: { status: 'deleted', active: false },
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Delete service error:', error);
    return NextResponse.json({ error: 'خطأ في حذف الخدمة' }, { status: 500 });
  }
}
