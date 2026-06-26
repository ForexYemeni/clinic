import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Patient from '@/models/Patient';
import Visit from '@/models/Visit';
import Invoice from '@/models/Invoice';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';
import { toClient } from '@/lib/mongoose-helpers';

// GET: List invoices (?patientId=xxx, ?status=unpaid, ?nurseId=xxx, filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');
    const nurseId = searchParams.get('nurseId');

    if (!effectiveClinicId) {
      return NextResponse.json([]);
    }

    let results: any[];

    // Build query with clinicId filter always
    try {
      const filter: Record<string, unknown> = { clinicId: effectiveClinicId };
      if (patientId) filter.patientId = patientId;
      else if (status) filter.status = status;
      results = await Invoice.find(filter).sort({ createdAt: -1 }).lean();
    } catch (idxErr) {
      console.warn('Invoices ordered query failed, fallback:', idxErr);
      try {
        const filter: Record<string, unknown> = { clinicId: effectiveClinicId };
        if (patientId) filter.patientId = patientId;
        else if (status) filter.status = status;
        results = await Invoice.find(filter).lean();
        // Sort in memory as fallback
        results.sort((a, b) => {
          const da = a.createdAt || '';
          const db = b.createdAt || '';
          return new Date(db).getTime() - new Date(da).getTime();
        });
      } catch {
        // Last resort - fetch with just clinicId
        results = await Invoice.find({ clinicId: effectiveClinicId }).lean();
        // Filter client-side
        results = results.filter(doc => {
          if (patientId && doc.patientId !== patientId) return false;
          if (status && doc.status !== status) return false;
          return true;
        });
      }
    }

    const invoices = [];
    for (const doc of results) {
      const data = toClient(doc) as any;
      data.remaining = data.remaining ?? (data.total - (data.paid || 0));
      if (!data.status) {
        if ((data.paid || 0) >= data.total) data.status = 'paid';
        else if ((data.paid || 0) > 0) data.status = 'partial';
        else data.status = 'unpaid';
      }
      if (data.patientId) {
        try {
          const patientDoc = await Patient.findById(data.patientId).lean();
          if (patientDoc) {
            data.patientName = patientDoc.name || '';
            data.patient = { id: patientDoc._id.toString(), name: patientDoc.name || '', phone: patientDoc.phone || '' };
          }
        } catch {}
      }
      // Extract nurse name and nurseId from visit if available
      if (data.visitId) {
        try {
          const visitDoc = await Visit.findById(data.visitId).lean();
          if (visitDoc) {
            data.nurseName = visitDoc.nurseName || '';
            data.nurseId = visitDoc.nurseId || '';
          }
        } catch {}
      }
      // Also check items for nurse names
      if (!data.nurseName && data.items && Array.isArray(data.items)) {
        const nurseNames = data.items
          .map((item: any) => item.nurseName)
          .filter(Boolean);
        if (nurseNames.length > 0) {
          data.nurseName = nurseNames[0]; // Use first nurse name
        }
      }
      // Last resort: look up nurse by nurseId from visit
      if (!data.nurseName && data.nurseId) {
        try {
          const nurseDoc = await User.findById(data.nurseId).lean();
          if (nurseDoc) {
            data.nurseName = nurseDoc.name || '';
          }
        } catch {}
      }
      // Filter by nurseId if requested
      if (nurseId) {
        if (data.nurseId !== nurseId) continue;
      }
      invoices.push(data);
    }

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Invoices list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب الفواتير' }, { status: 500 });
  }
}

// POST: Create invoice manually
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const body = await request.json();
    const { patientId, visitId, items } = body;

    if (!patientId) {
      return NextResponse.json({ error: 'يرجى تحديد المريض' }, { status: 400 });
    }

    if (!effectiveClinicId) {
      return NextResponse.json({ error: 'لم يتم تحديد العيادة' }, { status: 400 });
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
      visitId: visitId || null,
      clinicId: effectiveClinicId,
      items: invoiceItems,
      total,
      paid,
      remaining,
      status,
    };

    const created = await Invoice.create(invoiceData);
    const clientResult = toClient(created.toObject());

    return NextResponse.json({ ...clientResult }, { status: 201 });
  } catch (error) {
    console.error('Create invoice error:', error);
    return NextResponse.json({ error: 'خطأ في إنشاء الفاتورة' }, { status: 500 });
  }
}
