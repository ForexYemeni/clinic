// ═══════════════════════════════════════════════════════════
// 🚨 Emergency Detail API (Prisma + PostgreSQL)
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';

// PUT: Update emergency (status, actions, procedures, nurse)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { id } = await params;
    const body = await request.json();

    const emergency = await prisma.emergency.findUnique({ where: { id } });
    if (!emergency) {
      return NextResponse.json({ error: 'الحالة الطارئة غير موجودة' }, { status: 404 });
    }
    if (!effectiveClinicId || (emergency.clinicId && emergency.clinicId !== effectiveClinicId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const updateData: any = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.severity !== undefined) updateData.severity = body.severity;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.actions !== undefined) updateData.actions = body.actions;
    if (body.procedures !== undefined) updateData.procedures = body.procedures;
    if (body.nurseId !== undefined) {
      updateData.nurseId = body.nurseId;
      if (body.nurseId) {
        const nurse = await prisma.user.findUnique({ where: { id: body.nurseId }, select: { name: true } });
        if (nurse) updateData.nurseName = nurse.name || '';
      }
    }

    await prisma.emergency.update({ where: { id }, data: updateData });

    return NextResponse.json({ id, ...updateData } as any);
  } catch (error) {
    console.error('Update emergency error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث الحالة الطارئة' }, { status: 500 });
  }
}
