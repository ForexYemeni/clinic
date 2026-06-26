// ═══════════════════════════════════════════════════════════
// 💵 Invoices API (Prisma + PostgreSQL)
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

// GET: List invoices (?patientId=xxx, ?status=unpaid, ?nurseId=xxx, filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');
    const nurseId = searchParams.get('nurseId');

    if (!effectiveClinicId) return NextResponse.json([]);

    const where: any = { clinicId: effectiveClinicId };
    if (patientId) where.patientId = patientId;
    else if (status) where.status = status;

    const results = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const invoices: any[] = [];
    for (const doc of results) {
      const data: any = { ...doc, remaining: doc.remaining ?? (doc.total - (doc.paid || 0)) };
      if (!data.status) {
        if ((data.paid || 0) >= data.total) data.status = 'paid';
        else if ((data.paid || 0) > 0) data.status = 'partial';
        else data.status = 'unpaid';
      }
      if (data.patientId) {
        const patient = await prisma.patient.findUnique({
          where: { id: data.patientId },
          select: { id: true, name: true, phone: true },
        });
        if (patient) {
          data.patientName = patient.name || '';
          data.patient = patient;
        }
      }
      if (data.visitId) {
        const visit = await prisma.visit.findUnique({
          where: { id: data.visitId },
          select: { id: true, nurseId: true, nurseName: true, visitDate: true },
        });
        if (visit) {
          data.nurseName = visit.nurseName || '';
          data.nurseId = visit.nurseId || '';
          data.visit = visit;
        }
      }
      // Optional nurse filter (after enrichment)
      if (nurseId && data.nurseId !== nurseId) continue;
      invoices.push(data);
    }

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Invoices list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب الفواتير' }, { status: 500 });
  }
}

// POST: Add manual payment to an invoice (?invoiceId=xxx) or create new invoice
export async function POST(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const body = await request.json();

    if (!effectiveClinicId) {
      return NextResponse.json({ error: 'لم يتم تحديد العيادة' }, { status: 400 });
    }

    // If invoiceId provided, add payment to existing invoice
    if (body.invoiceId) {
      const invoice = await prisma.invoice.findUnique({ where: { id: body.invoiceId } });
      if (!invoice) {
        return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });
      }
      if (invoice.clinicId !== effectiveClinicId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
      }

      const paymentAmount = Number(body.amount) || 0;
      if (paymentAmount <= 0) {
        return NextResponse.json({ error: 'المبلغ غير صحيح' }, { status: 400 });
      }

      const newPaid = (invoice.paid || 0) + paymentAmount;
      const newRemaining = Math.max(0, invoice.total - newPaid);
      const newStatus = newRemaining <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';

      const updated = await prisma.invoice.update({
        where: { id: body.invoiceId },
        data: {
          paid: newPaid,
          remaining: newRemaining,
          status: newStatus,
          paymentMethod: body.paymentMethod || invoice.paymentMethod,
        },
      });

      return NextResponse.json({
        ...updated,
        remaining: newRemaining,
        paymentAdded: paymentAmount,
      });
    }

    // Otherwise: create new invoice
    const { patientId, patientName, items, total, paid, paymentMethod } = body;
    if (!patientId) {
      return NextResponse.json({ error: 'يرجى تحديد المريض' }, { status: 400 });
    }

    const totalAmount = Number(total) || 0;
    const paidAmount = paid ? Math.min(Number(paid), totalAmount) : 0;
    const remaining = totalAmount - paidAmount;
    const status = remaining <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';

    const created = await prisma.invoice.create({
      data: {
        patientId,
        patientName: patientName || '',
        visitId: '',
        items: items || [],
        total: totalAmount,
        paid: paidAmount,
        remaining,
        status,
        paymentMethod: paymentMethod || '',
        clinicId: effectiveClinicId,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Create/update invoice error:', error);
    return NextResponse.json({ error: 'خطأ في حفظ الفاتورة' }, { status: 500 });
  }
}
