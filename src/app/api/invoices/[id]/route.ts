import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (body.dueDate) body.dueDate = new Date(body.dueDate).toISOString();
    await adminDb.collection('invoices').doc(id).update(body);
    return NextResponse.json({ id, ...body });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
