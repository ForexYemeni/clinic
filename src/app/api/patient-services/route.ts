import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patientId, serviceId, nurseId, status } = body;
    
    const docRef = await adminDb.collection('patientServices').add({
      patientId,
      serviceId,
      nurseId: nurseId || null,
      status: status || 'completed',
      createdAt: new Date().toISOString(),
    });
    
    return NextResponse.json({ id: docRef.id, ...body });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create patient service' }, { status: 500 });
  }
}
