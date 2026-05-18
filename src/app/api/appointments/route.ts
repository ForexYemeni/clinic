import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const appointments = await db.appointment.findMany({
      orderBy: { date: 'asc' },
      include: { patient: true, nurse: true },
    });
    return NextResponse.json(appointments);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.date) body.date = new Date(body.date);
    const appointment = await db.appointment.create({ data: body });
    return NextResponse.json(appointment);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
