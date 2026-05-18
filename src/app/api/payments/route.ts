import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const snapshot = await adminDb.collection('payments').orderBy('createdAt', 'desc').get();
    const payments = [];
    for (const doc of snapshot.docs) {
      const data = { id: doc.id, ...doc.data() } as any;
      if (data.patientId) {
        const patientDoc = await adminDb.collection('patients').doc(data.patientId).get();
        if (patientDoc.exists) data.patient = { id: patientDoc.id, ...patientDoc.data() };
      }
      payments.push(data);
    }
    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const docRef = await adminDb.collection('payments').add({ ...body, createdAt: new Date().toISOString() });
    return NextResponse.json({ id: docRef.id, ...body });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
