import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (body.dueDate) body.dueDate = new Date(body.dueDate);
    const invoice = await db.invoice.update({ where: { id }, data: body });
    return NextResponse.json(invoice);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
