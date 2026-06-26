// ═══════════════════════════════════════════════════════════
// 👤 Patient Detail API (Prisma + PostgreSQL)
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';

// GET: Get patient detail with visits, services, invoices
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { id } = await params;

    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) {
      return NextResponse.json({ error: 'المريض غير موجود' }, { status: 404 });
    }

    if (!effectiveClinicId || (patient.clinicId && patient.clinicId !== effectiveClinicId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    // Fetch related visits + invoices in parallel
    const [visits, invoiceResults] = await Promise.all([
      prisma.visit.findMany({
        where: { patientId: id, clinicId: effectiveClinicId },
        orderBy: { visitDate: 'desc' },
      }),
      prisma.invoice.findMany({
        where: { patientId: id, clinicId: effectiveClinicId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const invoices = invoiceResults.map((inv) => ({
      ...inv,
      remaining: inv.remaining ?? (inv.total - (inv.paid || 0)),
    }));

    // Fetch unique services used in visits
    const serviceIds = new Set<string>();
    visits.forEach((v) => {
      (v.serviceIds || []).forEach((sid) => serviceIds.add(sid));
    });
    const services = serviceIds.size > 0
      ? await prisma.service.findMany({ where: { id: { in: Array.from(serviceIds) } } })
      : [];

    return NextResponse.json({
      ...patient,
      visits,
      services,
      invoices,
    });
  } catch (error) {
    console.error('Get patient error:', error);
    return NextResponse.json({ error: 'خطأ في جلب بيانات المريض' }, { status: 500 });
  }
}

// PUT: Update patient info
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { id } = await params;
    const body = await request.json();

    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) {
      return NextResponse.json({ error: 'المريض غير موجود' }, { status: 404 });
    }
    if (!effectiveClinicId || (patient.clinicId && patient.clinicId !== effectiveClinicId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.age !== undefined) updateData.age = body.age ? Number(body.age) : null;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.emergencyPhone !== undefined) updateData.emergencyPhone = body.emergencyPhone;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.bloodType !== undefined) updateData.bloodType = body.bloodType;
    if (body.chronicDiseases !== undefined) updateData.chronicDiseases = body.chronicDiseases;
    if (body.allergies !== undefined) updateData.allergies = body.allergies;
    if (body.medicalHistory !== undefined) updateData.medicalHistory = body.medicalHistory;
    if (body.notes !== undefined) updateData.notes = body.notes;

    await prisma.patient.update({ where: { id }, data: updateData });

    return NextResponse.json({ id, ...updateData } as any);
  } catch (error) {
    console.error('Update patient error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث بيانات المريض' }, { status: 500 });
  }
}

// DELETE: Delete patient
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { id } = await params;

    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) {
      return NextResponse.json({ error: 'المريض غير موجود' }, { status: 404 });
    }
    if (!effectiveClinicId || (patient.clinicId && patient.clinicId !== effectiveClinicId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const clinicFilter = effectiveClinicId || patient.clinicId;
    if (!clinicFilter) {
      return NextResponse.json({ error: 'لم يتم تحديد العيادة' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.visit.deleteMany({ where: { patientId: id, clinicId: clinicFilter } }),
      prisma.invoice.deleteMany({ where: { patientId: id, clinicId: clinicFilter } }),
      prisma.patient.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Delete patient error:', error);
    return NextResponse.json({ error: 'خطأ في حذف المريض' }, { status: 500 });
  }
}
