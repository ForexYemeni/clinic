// ═══════════════════════════════════════════════════════════
// 🚨 Emergencies API (Prisma + PostgreSQL)
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

// GET: List emergencies (?status=active, filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    if (!effectiveClinicId) return NextResponse.json([]);

    const where: any = { clinicId: effectiveClinicId };
    if (status) where.status = status;

    const results = await prisma.emergency.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with patient + nurse info
    const emergencies: any[] = [];
    for (const doc of results) {
      const data: any = { ...doc };
      if (data.patientId) {
        const patient = await prisma.patient.findUnique({
          where: { id: data.patientId },
          select: { id: true, name: true, phone: true },
        });
        if (patient) data.patient = patient;
      }
      if (data.nurseId) {
        const nurse = await prisma.user.findUnique({
          where: { id: data.nurseId },
          select: { id: true, name: true },
        });
        if (nurse) data.nurse = nurse;
      }
      emergencies.push(data);
    }

    return NextResponse.json(emergencies);
  } catch (error) {
    console.error('Emergencies list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب الحالات الطارئة' }, { status: 500 });
  }
}

// POST: Add new emergency
export async function POST(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const body = await request.json();
    const { patientId, patientName, nurseId, nurseName, severity, notes, actions, procedures, arrivalTime } = body;

    if (!effectiveClinicId) {
      return NextResponse.json({ error: 'لم يتم تحديد العيادة' }, { status: 400 });
    }

    const created = await prisma.emergency.create({
      data: {
        patientId: patientId || '',
        patientName: patientName || '',
        nurseId: nurseId || '',
        nurseName: nurseName || '',
        severity: severity || 'moderate',
        status: 'active',
        notes: notes || '',
        actions: actions || '',
        procedures: procedures || '',
        arrivalTime: arrivalTime ? new Date(arrivalTime) : new Date(),
        clinicId: effectiveClinicId,
      },
    });

    // Notify admins of the clinic about the new emergency
    try {
      const admins = await prisma.user.findMany({
        where: { clinicId: effectiveClinicId, role: 'admin', active: true },
        select: { id: true },
      });
      for (const a of admins) {
        await createNotification({
          userId: a.id,
          clinicId: effectiveClinicId,
          type: 'emergency',
          title: 'حالة طارئة جديدة',
          message: `حالة طارئة جديدة: ${patientName || 'مريض'} - ${severity || 'متوسطة'}`,
          priority: severity === 'critical' || severity === 'high' ? 'urgent' : 'high',
          relatedId: created.id,
        });
      }
    } catch {}

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Create emergency error:', error);
    return NextResponse.json({ error: 'خطأ في إضافة الحالة الطارئة' }, { status: 500 });
  }
}
