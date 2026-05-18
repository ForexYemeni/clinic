import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const snapshot = await adminDb.collection('invoices').orderBy('createdAt', 'desc').get();
    const invoices = [];
    for (const doc of snapshot.docs) {
      const data = { id: doc.id, ...doc.data() } as any;
      data.remaining = data.remaining || (data.total - data.paid);
      // Derive status if not set
      if (!data.status || data.status === 'unpaid') {
        if (data.paid >= data.total) data.status = 'paid';
        else if (data.paid > 0) data.status = 'partial';
        else data.status = 'unpaid';
      }
      if (data.patientId) {
        const patientDoc = await adminDb.collection('patients').doc(data.patientId).get();
        if (patientDoc.exists) data.patient = { id: patientDoc.id, name: patientDoc.data()?.name };
      }
      invoices.push(data);
    }
    return NextResponse.json(invoices);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const total = body.total || (body.items || []).reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const paid = body.paid || 0;
    const remaining = total - paid;
    const status = paid >= total ? 'paid' : paid > 0 ? 'partial' : 'unpaid';

    const data = {
      ...body,
      total,
      paid,
      remaining,
      status,
      createdAt: new Date().toISOString(),
    };
    const docRef = await adminDb.collection('invoices').add(data);
    return NextResponse.json({ id: docRef.id, ...data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
