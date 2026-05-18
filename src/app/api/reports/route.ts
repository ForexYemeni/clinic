import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'daily';

    let startDate = new Date();
    if (type === 'daily') {
      startDate.setHours(0, 0, 0, 0);
    } else if (type === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (type === 'monthly') {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const [patients, services, emergencies, payments, appointments] = await Promise.all([
      db.patient.count({
        where: { createdAt: { gte: startDate } },
      }),
      db.patientService.count({
        where: { createdAt: { gte: startDate } },
      }),
      db.emergency.count({
        where: { arrivalTime: { gte: startDate } },
      }),
      db.payment.aggregate({
        where: { type: 'payment', createdAt: { gte: startDate } },
        _sum: { amount: true },
        _count: true,
      }),
      db.appointment.count({
        where: { createdAt: { gte: startDate } },
      }),
    ]);

    // Daily reports from nurses
    const dailyReports = await db.dailyReport.findMany({
      where: { date: { gte: startDate } },
      include: {
        nurse: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });

    // Payment method breakdown
    const paymentByMethod = await db.payment.groupBy({
      by: ['method'],
      where: { type: 'payment', createdAt: { gte: startDate } },
      _sum: { amount: true },
      _count: true,
    });

    return NextResponse.json({
      period: type,
      startDate,
      stats: {
        newPatients: patients,
        servicesProvided: services,
        emergencies: emergencies,
        revenue: payments._sum.amount || 0,
        paymentCount: payments._count,
        appointments,
      },
      dailyReports,
      paymentByMethod,
    });
  } catch (error) {
    return NextResponse.json({ error: 'خطأ في جلب التقارير' }, { status: 500 });
  }
}
