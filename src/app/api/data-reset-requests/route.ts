// ═══════════════════════════════════════════════════════════
// 📋 Data Reset Requests API (Prisma + PostgreSQL)
// Super admin reviews; clinic admin requests
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';
import { notifySuperAdmins } from '@/lib/notifications';

// GET: List pending data reset requests (for super admin)
export async function GET(request: NextRequest) {
  try {
    const { auth } = extractAuthAndClinicId(request);
    if (auth?.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const requests = await prisma.dataResetRequest.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Data reset requests list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب الطلبات' }, { status: 500 });
  }
}

// POST: Create a data reset request (for admin)
export async function POST(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const body = await request.json();
    const { reason } = body;

    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }
    if (!effectiveClinicId) {
      return NextResponse.json({ error: 'لم يتم تحديد العيادة' }, { status: 400 });
    }

    const created = await prisma.dataResetRequest.create({
      data: {
        requestedBy: auth.userId,
        requesterName: '',
        clinicId: effectiveClinicId,
        reason: reason || '',
        status: 'pending',
      },
    });

    // Notify super admins
    try {
      await notifySuperAdmins({
        type: 'data_reset',
        title: 'طلب إعادة تعيين بيانات',
        message: `طلب جديد لإعادة تعيين البيانات لعيادة (${effectiveClinicId})`,
        priority: 'high',
        relatedId: created.id,
      });
    } catch {}

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Create data reset request error:', error);
    return NextResponse.json({ error: 'خطأ في إنشاء الطلب' }, { status: 500 });
  }
}

// PUT: Approve/reject a data reset request (super admin only)
export async function PUT(request: NextRequest) {
  try {
    const { auth } = extractAuthAndClinicId(request);
    if (auth?.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 });
    }

    const updated = await prisma.dataResetRequest.update({
      where: { id },
      data: { status },
    });

    // If approved, perform the data reset for the clinic
    if (status === 'approved') {
      await prisma.$transaction([
        prisma.patient.deleteMany({ where: { clinicId: updated.clinicId } }),
        prisma.visit.deleteMany({ where: { clinicId: updated.clinicId } }),
        prisma.invoice.deleteMany({ where: { clinicId: updated.clinicId } }),
        prisma.emergency.deleteMany({ where: { clinicId: updated.clinicId } }),
        prisma.notification.deleteMany({ where: { clinicId: updated.clinicId } }),
        prisma.salaryWithdrawal.deleteMany({ where: { clinicId: updated.clinicId } }),
      ]);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update data reset request error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث الطلب' }, { status: 500 });
  }
}
