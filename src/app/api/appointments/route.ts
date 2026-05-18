import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const snapshot = await adminDb.collection('appointments').orderBy('date', 'asc').get();
    const appointments = [];
    for (const doc of snapshot.docs) {
      const data = { id: doc.id, ...doc.data() } as any;
      if (data.patientId) {
        const patientDoc = await adminDb.collection('patients').doc(data.patientId).get();
        if (patientDoc.exists) data.patient = { id: patientDoc.id, ...patientDoc.data() };
      }
      if (data.nurseId) {
        const nurseDoc = await adminDb.collection('users').doc(data.nurseId).get();
        if (nurseDoc.exists) data.nurse = { id: nurseDoc.id, name: nurseDoc.data()?.name };
      }
      appointments.push(data);
    }
    return NextResponse.json(appointments);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.date) body.date = new Date(body.date).toISOString();
    const docRef = await adminDb.collection('appointments').add({ ...body, createdAt: new Date().toISOString() });
    return NextResponse.json({ id: docRef.id, ...body });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
