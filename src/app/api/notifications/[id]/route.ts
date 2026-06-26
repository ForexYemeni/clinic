// ═══════════════════════════════════════════════════════════
// 🔔 Notification Detail API (Prisma + PostgreSQL)
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';

// PUT: Update notification (mark as read)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { id } = await params;
    const body = await request.json();

    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif) {
      return NextResponse.json({ error: 'الإشعار غير موجود' }, { status: 404 });
    }
    if (!effectiveClinicId || (notif.clinicId && notif.clinicId !== effectiveClinicId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const updateData: any = {};
    if (body.read !== undefined) updateData.read = body.read;

    await prisma.notification.update({ where: { id }, data: updateData });

    return NextResponse.json({ id, ...updateData } as any);
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث الإشعار' }, { status: 500 });
  }
}

// DELETE: Delete notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { id } = await params;

    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif) {
      return NextResponse.json({ error: 'الإشعار غير موجود' }, { status: 404 });
    }
    if (!effectiveClinicId || (notif.clinicId && notif.clinicId !== effectiveClinicId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    await prisma.notification.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json({ error: 'خطأ في حذف الإشعار' }, { status: 500 });
  }
}
