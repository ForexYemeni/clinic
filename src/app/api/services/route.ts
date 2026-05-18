import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const snapshot = await adminDb.collection('services').orderBy('category').get();
    const services = [];
    for (const doc of snapshot.docs) {
      const data = { id: doc.id, ...doc.data() };
      // Get count of patient services
      const psSnap = await adminDb.collection('patientServices').where('serviceId', '==', doc.id).get();
      (data as any)._count = { patientServices: psSnap.size };
      services.push(data);
    }
    return NextResponse.json(services);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const docRef = await adminDb.collection('services').add({ ...body, createdAt: new Date().toISOString() });
    return NextResponse.json({ id: docRef.id, ...body });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
