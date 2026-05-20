import dbConnect from '@/lib/mongodb';
import Visit from '@/models/Visit';
import Service from '@/models/Service';
import Invoice from '@/models/Invoice';
import { toClient } from '@/lib/mongoose-helpers';
import { NextRequest, NextResponse } from 'next/server';

// GET: List visits (?patientId=xxx)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    let query = Visit.find();
    if (patientId) {
      query = query.where('patientId', patientId);
    }
    const snapshot = await query.sort({ visitDate: -1 }).lean();

    const visits = snapshot.map((doc) => toClient(doc));

    return NextResponse.json(visits);
  } catch (error) {
    console.error('Visits list error:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب الزيارات' },
      { status: 500 }
    );
  }
}

// POST: Add new visit with services (auto-generate invoice)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      patientId,
      nurseId,
      nurseName,
      reason,
      diagnosis,
      vitalSigns,
      medications,
      serviceIds,
      notes,
    } = body;

    if (!patientId) {
      return NextResponse.json(
        { error: 'يرجى تحديد المريض' },
        { status: 400 }
      );
    }

    if (!nurseId) {
      return NextResponse.json(
        { error: 'يرجى تحديد الممرض' },
        { status: 400 }
      );
    }

    // Auto-calculate total price from service IDs
    const items: { serviceId: string; serviceName: string; price: number; quantity: number; nurseName: string }[] = [];
    let totalPrice = 0;

    if (serviceIds && Array.isArray(serviceIds) && serviceIds.length > 0) {
      for (const serviceId of serviceIds) {
        try {
          const serviceDoc = await Service.findById(serviceId).lean();
          if (serviceDoc) {
            if (serviceDoc.status !== 'deleted') {
              const price = serviceDoc.price || 0;
              items.push({
                serviceId,
                serviceName: serviceDoc.nameAr || '',
                price,
                quantity: 1,
                nurseName: nurseName || '',
              });
              totalPrice += price;
            }
          }
        } catch {}
      }
    }

    // Create visit
    const visitData = {
      patientId,
      nurseId,
      nurseName: nurseName || '',
      reason: reason || '',
      diagnosis: diagnosis || '',
      status: 'completed',
      visitDate: new Date(),
      notes: notes || '',
      vitalSigns: vitalSigns || {
        bloodPressure: '',
        heartRate: '',
        temperature: '',
        oxygenLevel: '',
        sugarLevel: '',
      },
      medications: medications || [],
      serviceIds: serviceIds || [],
      totalPrice,
      createdAt: new Date(),
    };

    const visitDoc = await Visit.create(visitData);
    const visitResult = toClient(visitDoc.toObject());

    // Auto-generate invoice for this visit
    let invoiceData = null;
    if (items.length > 0) {
      const invoice = {
        patientId,
        visitId: visitDoc._id.toString(),
        items,
        total: totalPrice,
        paid: 0,
        remaining: totalPrice,
        status: 'unpaid',
        createdAt: new Date(),
      };

      const invoiceDoc = await Invoice.create(invoice);
      invoiceData = toClient(invoiceDoc.toObject());
    }

    return NextResponse.json(
      {
        visit: visitResult,
        invoice: invoiceData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create visit error:', error);
    return NextResponse.json(
      { error: 'خطأ في إضافة الزيارة' },
      { status: 500 }
    );
  }
}
