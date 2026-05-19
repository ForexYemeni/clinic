import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest } from '@/lib/auth';

// GET: List invoices (?patientId=xxx, ?status=unpaid, filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    const auth = extractAuthFromRequest(request);
    const clinicId = auth?.clinicId || null;
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');

    let docs: FirebaseFirestore.QueryDocumentSnapshot[] = [];

    // Build query with clinicId filter
    const buildQuery = (baseQuery: FirebaseFirestore.Query) => {
      let q = baseQuery;
      if (clinicId) q = q.where('clinicId', '==', clinicId);
      if (patientId) q = q.where('patientId', '==', patientId);
      else if (status) q = q.where('status', '==', status);
      return q;
    };

    try {
      const snapshot = buildQuery(adminDb.collection('invoices')).orderBy('createdAt', 'desc').get();
      docs = (await snapshot).docs;
    } catch (idxErr) {
      console.warn('Invoices ordered query failed, fallback:', idxErr);
      try {
        const snapshot = await buildQuery(adminDb.collection('invoices')).get();
        docs = snapshot.docs.sort((a, b) => {
          const da = a.data()?.createdAt || '';
          const db = b.data()?.createdAt || '';
          return db.localeCompare(da);
        });
      } catch {
        const snapshot = await adminDb.collection('invoices').get();
        docs = snapshot.docs.filter(doc => {
          const data = doc.data();
          if (clinicId && data.clinicId !== clinicId) return false;
          if (patientId && data.patientId !== patientId) return false;
          if (status && data.status !== status) return false;
          return true;
        });
      }
    }

    const invoices = [];
    for (const doc of docs) {
      const data = { id: doc.id, ...doc.data() } as any;
      data.remaining = data.remaining ?? (data.total - (data.paid || 0));
      if (!data.status) {
        if ((data.paid || 0) >= data.total) data.status = 'paid';
        else if ((data.paid || 0) > 0) data.status = 'partial';
        else data.status = 'unpaid';
      }
      if (data.patientId) {
        try {
          const patientDoc = await adminDb.collection('patients').doc(data.patientId).get();
          if (patientDoc.exists) {
            const pData = patientDoc.data();
            data.patientName = pData?.name || '';
            data.patient = { id: patientDoc.id, name: pData?.name || '', phone: pData?.phone || '' };
          }
        } catch {}
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
    const auth = extractAuthFromRequest(request);
    const clinicId = auth?.clinicId || null;
    const body = await request.json();
    const { patientId, visitId, items } = body;

    if (!patientId) {
      return NextResponse.json({ error: 'يرجى تحديد المريض' }, { status: 400 });
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
      clinicId,
      items: invoiceItems,
      total,
      paid,
      remaining,
      status,
      createdAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('invoices').add(invoiceData);

    return NextResponse.json({ id: docRef.id, ...invoiceData }, { status: 201 });
  } catch (error) {
    console.error('Create invoice error:', error);
    return NextResponse.json({ error: 'خطأ في إنشاء الفاتورة' }, { status: 500 });
  }
}
