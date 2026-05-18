import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const snapshot = await adminDb.collection('users').get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, password, role } = body;
    
    const phoneClean = (phone || '').replace(/\D/g, '');
    
    // Store in Firestore (no Firebase Auth - phone-based)
    const docRef = await adminDb.collection('users').add({
      name,
      phone: phoneClean,
      password: password || 'nurse123',
      role: role || 'nurse',
      active: true,
      createdAt: new Date().toISOString(),
    });
    
    return NextResponse.json({ id: docRef.id, name, phone: phoneClean, role });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}
