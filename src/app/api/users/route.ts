import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const snapshot = await adminDb.collection('users').where('role', '==', 'nurse').get();
    const users = [];
    for (const doc of snapshot.docs) {
      const data = { id: doc.id, ...doc.data() };
      users.push(data);
    }
    // Also get admin
    const adminSnap = await adminDb.collection('users').where('role', '==', 'admin').get();
    for (const doc of adminSnap.docs) {
      users.push({ id: doc.id, ...doc.data() });
    }
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, role, phone } = body;
    
    // Create in Firebase Auth
    const { adminAuth } = await import('@/lib/firebase-admin');
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });
    
    // Set custom claims for role
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: role || 'nurse' });
    
    // Store in Firestore
    await adminDb.collection('users').doc(userRecord.uid).set({
      name,
      email,
      role: role || 'nurse',
      phone: phone || '',
      active: true,
      createdAt: new Date().toISOString(),
    });
    
    return NextResponse.json({ id: userRecord.uid, name, email, role });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}
