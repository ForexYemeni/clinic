import dbConnect from '@/lib/mongodb';
import Visit from '@/models/Visit';
import Service from '@/models/Service';
import Invoice from '@/models/Invoice';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';
import { toClient } from '@/lib/mongoose-helpers';

// GET: List visits (?patientId=xxx, filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!effectiveClinicId) {
      return NextResponse.json([]);
    }

    const query: Record<string, unknown> = { clinicId: effectiveClinicId };
    if (patientId) query.patientId = patientId;

    const visits = await Visit.find(query)
      .sort({ visitDate: -1 })
      .lean();

    const result = visits.map((doc) => ({ id: doc._id.toString(), ...doc }));
    return NextResponse.json(result);
  } catch (error) {
    console.error('Visits list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب الزيارات' }, { status: 500 });
  }
}

// POST: Add new visit with services (auto-generate invoice)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const body = await request.json();
    const { patientId, nurseId, nurseName, reason, diagnosis, vitalSigns, medications, serviceIds, notes, paidAmount, paymentMethod, complaints } = body;

    if (!patientId) {
      return NextResponse.json({ error: 'يرجى تحديد المريض' }, { status: 400 });
    }
    if (!nurseId) {
      return NextResponse.json({ error: 'يرجى تحديد مقدم الخدمة' }, { status: 400 });
    }

    if (!effectiveClinicId) {
      return NextResponse.json({ error: 'لم يتم تحديد العيادة' }, { status: 400 });
    }

    // Auto-calculate total price from service IDs
    const items: { serviceId: string; serviceName: string; price: number; quantity: number; nurseName: string }[] = [];
    let totalPrice = 0;

    if (serviceIds && Array.isArray(serviceIds) && serviceIds.length > 0) {
      for (const serviceId of serviceIds) {
        const serviceDoc = await Service.findById(serviceId).lean();
        if (serviceDoc) {
          // Verify service belongs to the same clinic
          if (serviceDoc.clinicId && serviceDoc.clinicId !== effectiveClinicId) {
            continue; // Skip services from other clinics
          }
          if (serviceDoc.status !== 'deleted') {
            const price = serviceDoc.price || 0;
            items.push({ serviceId, serviceName: serviceDoc.nameAr || '', price, quantity: 1, nurseName: nurseName || '' });
            totalPrice += price;
          }
        }
      }
    }

    // Calculate payment info
    const paid = paidAmount ? Math.min(Number(paidAmount), totalPrice) : 0;
    const remaining = totalPrice - paid;
    const invoiceStatus = remaining <= 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid';

    // Create visit
    const visitData = {
      patientId,
      nurseId,
      nurseName: nurseName || '',
      reason: reason || '',
      diagnosis: diagnosis || '',
      complaints: complaints || [],
      status: 'completed',
      visitDate: new Date(),
      notes: notes || '',
      vitalSigns: vitalSigns || { bloodPressure: '', heartRate: '', temperature: '', oxygenLevel: '', sugarLevel: '' },
      medications: medications || [],
      serviceIds: serviceIds || [],
      totalPrice,
      clinicId: effectiveClinicId,
    };

    const visitDoc = await Visit.create(visitData);
    const visitId = visitDoc._id.toString();

    // Auto-generate invoice
    let invoiceData = null;
    if (items.length > 0) {
      const invoice = {
        patientId,
        visitId,
        clinicId: effectiveClinicId,
        items,
        total: totalPrice,
        paid,
        remaining,
        status: invoiceStatus,
      };
      const invoiceDoc = await Invoice.create(invoice);
      const invoiceId = invoiceDoc._id.toString();
      invoiceData = { id: invoiceId, ...invoice };
    }

    return NextResponse.json({
      visit: { id: visitId, ...visitData, visitDate: visitData.visitDate.toISOString() },
      invoice: invoiceData,
    }, { status: 201 });
  } catch (error) {
    console.error('Create visit error:', error);
    return NextResponse.json({ error: 'خطأ في إضافة الزيارة' }, { status: 500 });
  }
}
