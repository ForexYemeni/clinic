import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const snapshot = await adminDb.collection('patients').orderBy('createdAt', 'desc').get();
    const patients = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(patients);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const docRef = await adminDb.collection('patients').add({
      ...body,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ id: docRef.id, ...body });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 });
  }
}
