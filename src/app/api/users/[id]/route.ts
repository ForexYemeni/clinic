// ═══════════════════════════════════════════════════════════
// 👥 User Detail API (Prisma + PostgreSQL)
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, extractAuthAndClinicId } from '@/lib/auth';

// PUT: Update user (change password, toggle active, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { id } = await params;
    const body = await request.json();

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // Verify clinic ownership (unless super_admin)
    if (auth?.role !== 'super_admin') {
      if (!effectiveClinicId || (user.clinicId && user.clinicId !== effectiveClinicId)) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
      }
    }

    // Only allow updating nurses or self (not other admins)
    if (user.role === 'admin' && auth?.role !== 'super_admin' && auth?.userId !== id) {
      return NextResponse.json({ error: 'لا يمكن تعديل بيانات المدير من هنا' }, { status: 403 });
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.password !== undefined) {
      updateData.password = await hashPassword(body.password);
    }
    if (body.active !== undefined) updateData.active = body.active;
    if (body.salary !== undefined) updateData.salary = Number(body.salary) || 0;

    await prisma.user.update({ where: { id }, data: updateData });

    return NextResponse.json({ id, ...updateData, password: undefined } as any);
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث بيانات المستخدم' }, { status: 500 });
  }
}

// DELETE: Delete nurse
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }
    if (auth?.role !== 'super_admin') {
      if (!effectiveClinicId || (user.clinicId && user.clinicId !== effectiveClinicId)) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
      }
    }
    if (user.role === 'admin' || user.role === 'super_admin') {
      return NextResponse.json({ error: 'لا يمكن حذف حساب مدير' }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'خطأ في حذف المستخدم' }, { status: 500 });
  }
}
