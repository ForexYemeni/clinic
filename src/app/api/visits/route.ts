import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const docRef = await adminDb.collection('visits').add({
      ...body,
      visitDate: body.visitDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ id: docRef.id, ...body });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create visit' }, { status: 500 });
  }
}
