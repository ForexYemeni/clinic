import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const snapshot = await adminDb.collection('services').orderBy('category').get();
    const services = [];
    for (const doc of snapshot.docs) {
      const data = { id: doc.id, ...doc.data() };
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
    const data = {
      ...body,
      active: body.active !== false,
      createdAt: new Date().toISOString(),
    };
    const docRef = await adminDb.collection('services').add(data);
    return NextResponse.json({ id: docRef.id, ...data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
