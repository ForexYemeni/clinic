import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import Patient from '@/models/Patient';
import { toClient } from '@/lib/mongoose-helpers';
import { NextRequest, NextResponse } from 'next/server';

// GET: List invoices (?patientId=xxx, ?status=unpaid)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');

    let query = Invoice.find();
    if (patientId) {
      query = query.where('patientId', patientId);
    } else if (status) {
      query = query.where('status', status);
    }
    const docs = await query.sort({ createdAt: -1 }).lean();

    const invoices = [];
    for (const doc of docs) {
      const data = toClient(doc) as any;
      // Recalculate remaining and status if missing
      data.remaining = data.remaining ?? (data.total - (data.paid || 0));
      if (!data.status) {
        if ((data.paid || 0) >= data.total) data.status = 'paid';
        else if ((data.paid || 0) > 0) data.status = 'partial';
        else data.status = 'unpaid';
      }
      // Enrich with patient name
      if (data.patientId) {
        try {
          const patientDoc = await Patient.findById(data.patientId).lean();
          if (patientDoc) {
            data.patientName = patientDoc.name || '';
            data.patient = { id: patientDoc._id.toString(), name: patientDoc.name || '', phone: patientDoc.phone || '' };
          }
        } catch {}
      }
      invoices.push(data);
    }

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Invoices list error:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب الفواتير' },
      { status: 500 }
    );
  }
}

// POST: Create invoice manually
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { patientId, visitId, items } = body;

    if (!patientId) {
      return NextResponse.json(
        { error: 'يرجى تحديد المريض' },
        { status: 400 }
      );
    }

    const invoiceItems = items || [];
    const total = invoiceItems.reduce(
      (sum: number, item: any) => sum + (item.price * (item.quantity || 1)),
      0
    );
    const paid = body.paid || 0;
    const remaining = total - paid;
    const status: string = paid >= total ? 'paid' : paid > 0 ? 'partial' : 'unpaid';

    const invoiceData = {
      patientId,
      visitId: visitId || '',
      items: invoiceItems,
      total,
      paid,
      remaining,
      status,
      createdAt: new Date(),
    };

    const doc = await Invoice.create(invoiceData);

    return NextResponse.json(
      toClient(doc.toObject()),
      { status: 201 }
    );
  } catch (error) {
    console.error('Create invoice error:', error);
    return NextResponse.json(
      { error: 'خطأ في إنشاء الفاتورة' },
      { status: 500 }
    );
  }
}
