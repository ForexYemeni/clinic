import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

// GET: List invoices (?patientId=xxx, ?status=unpaid)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');

    let docs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
    try {
      let snapshot;
      if (patientId) {
        snapshot = await adminDb
          .collection('invoices')
          .where('patientId', '==', patientId)
          .orderBy('createdAt', 'desc')
          .get();
      } else if (status) {
        snapshot = await adminDb
          .collection('invoices')
          .where('status', '==', status)
          .orderBy('createdAt', 'desc')
          .get();
      } else {
        snapshot = await adminDb
          .collection('invoices')
          .orderBy('createdAt', 'desc')
          .get();
      }
      docs = snapshot.docs;
    } catch (idxErr) {
      console.warn('Invoices ordered query failed, fallback:', idxErr);
      let snapshot;
      if (patientId) {
        snapshot = await adminDb
          .collection('invoices')
          .where('patientId', '==', patientId)
          .get();
      } else if (status) {
        snapshot = await adminDb
          .collection('invoices')
          .where('status', '==', status)
          .get();
      } else {
        snapshot = await adminDb
          .collection('invoices')
          .get();
      }
      docs = snapshot.docs.sort((a, b) => {
        const da = a.data()?.createdAt || '';
        const db = b.data()?.createdAt || '';
        return db.localeCompare(da);
      });
    }

    const invoices = [];
    for (const doc of docs) {
      const data = { id: doc.id, ...doc.data() } as any;
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
    return NextResponse.json(
      { error: 'خطأ في جلب الفواتير' },
      { status: 500 }
    );
  }
}

// POST: Create invoice manually
export async function POST(request: NextRequest) {
  try {
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
      visitId: visitId || null,
      items: invoiceItems,
      total,
      paid,
      remaining,
      status,
      createdAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('invoices').add(invoiceData);

    return NextResponse.json(
      { id: docRef.id, ...invoiceData },
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
