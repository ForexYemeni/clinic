// ═══════════════════════════════════════════════════════════
// 🩺 Visits API (Prisma + PostgreSQL)
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';

// GET: List visits (?patientId=xxx, filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!effectiveClinicId) return NextResponse.json([]);

    const where: any = { clinicId: effectiveClinicId };
    if (patientId) where.patientId = patientId;

    const visits = await prisma.visit.findMany({
      where,
      orderBy: { visitDate: 'desc' },
    });
    return NextResponse.json(visits);
  } catch (error) {
    console.error('Visits list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب الزيارات' }, { status: 500 });
  }
}

// POST: Add new visit with services (auto-generate invoice)
export async function POST(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const body = await request.json();
    const {
      patientId, nurseId, nurseName, reason, diagnosis, vitalSigns,
      medications, serviceIds, notes, paidAmount, paymentMethod, complaints,
    } = body;

    if (!patientId) return NextResponse.json({ error: 'يرجى تحديد المريض' }, { status: 400 });
    if (!nurseId) return NextResponse.json({ error: 'يرجى تحديد مقدم الخدمة' }, { status: 400 });
    if (!effectiveClinicId) return NextResponse.json({ error: 'لم يتم تحديد العيادة' }, { status: 400 });

    // Verify patient belongs to clinic
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient || patient.clinicId !== effectiveClinicId) {
      return NextResponse.json({ error: 'المريض غير موجود في هذه العيادة' }, { status: 404 });
    }

    // Auto-calculate total price from service IDs (only services from same clinic, not deleted)
    const items: { serviceId: string; serviceName: string; price: number; quantity: number; nurseName: string }[] = [];
    let totalPrice = 0;

    if (serviceIds && Array.isArray(serviceIds) && serviceIds.length > 0) {
      const services = await prisma.service.findMany({
        where: { id: { in: serviceIds }, clinicId: effectiveClinicId, status: { not: 'deleted' } },
      });
      for (const s of services) {
        const price = s.price || 0;
        items.push({ serviceId: s.id, serviceName: s.nameAr || '', price, quantity: 1, nurseName: nurseName || '' });
        totalPrice += price;
      }
    }

    const paid = paidAmount ? Math.min(Number(paidAmount), totalPrice) : 0;
    const remaining = totalPrice - paid;
    const invoiceStatus = remaining <= 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid';

    // Use a transaction to ensure visit + invoice are created atomically
    const visit = await prisma.$transaction(async (tx) => {
      const newVisit = await tx.visit.create({
        data: {
          patientId,
          patientName: patient.name || '',
          nurseId,
          nurseName: nurseName || '',
          reason: reason || '',
          diagnosis: diagnosis || '',
          status: 'completed',
          visitDate: new Date(),
          vsBloodPressure: vitalSigns?.bloodPressure || '',
          vsHeartRate: vitalSigns?.heartRate || '',
          vsTemperature: vitalSigns?.temperature || '',
          vsOxygenLevel: vitalSigns?.oxygenLevel || '',
          vsSugarLevel: vitalSigns?.sugarLevel || '',
          medications: medications || [],
          serviceIds: serviceIds || [],
          complaints: complaints || [],
          totalPrice,
          clinicId: effectiveClinicId,
        },
      });

      // Create invoice for this visit
      const invoice = await tx.invoice.create({
        data: {
          patientId,
          patientName: patient.name || '',
          visitId: newVisit.id,
          items: items as any,
          total: totalPrice,
          paid,
          remaining,
          status: invoiceStatus,
          paymentMethod: paymentMethod || '',
          clinicId: effectiveClinicId,
        },
      });

      return { visit: newVisit, invoice };
    });

    return NextResponse.json({
      id: visit.visit.id,
      visit: visit.visit,
      invoice: visit.invoice,
      totalPrice,
      paid,
      remaining,
    }, { status: 201 });
  } catch (error) {
    console.error('Create visit error:', error);
    return NextResponse.json({ error: 'خطأ في إضافة الزيارة' }, { status: 500 });
  }
}
