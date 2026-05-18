import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Update in Firestore
    await adminDb.collection('users').doc(id).update({
      ...(body.name && { name: body.name }),
      ...(body.phone && { phone: body.phone }),
      ...(body.active !== undefined && { active: body.active }),
    });
    
    // Update in Firebase Auth if needed
    if (body.active !== undefined) {
      await adminAuth.updateUser(id, { disabled: !body.active });
    }
    
    return NextResponse.json({ id, ...body });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await adminDb.collection('users').doc(id).delete();
    try { await adminAuth.deleteUser(id); } catch {}
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
