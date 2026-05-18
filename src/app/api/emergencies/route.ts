import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const emergencies = await db.emergency.findMany({
      orderBy: { createdAt: 'desc' },
      include: { patient: true, nurse: true },
    });
    return NextResponse.json(emergencies);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const emergency = await db.emergency.create({ data: body });
    return NextResponse.json(emergency);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
