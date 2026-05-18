import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [
      totalPatients,
      totalEmergencies,
      activeEmergencies,
      totalAppointments,
      todayAppointments,
      totalPayments,
      totalServices,
      totalNurses,
      todayPayments,
      pendingInvoices,
    ] = await Promise.all([
      db.patient.count(),
      db.emergency.count(),
      db.emergency.count({ where: { status: 'active' } }),
      db.appointment.count(),
      db.appointment.count({ where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      db.payment.aggregate({ _sum: { amount: true } }),
      db.patientService.count(),
      db.user.count({ where: { role: 'nurse', active: true } }),
      db.payment.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      db.invoice.count({ where: { status: { in: ['unpaid', 'partial'] } } }),
    ]);

    const servicesByCategory = await db.service.groupBy({
      by: ['category'],
      _count: { id: true },
      where: { active: true },
    });

    const recentEmergencies = await db.emergency.findMany({
      where: { status: 'active' },
      orderBy: { arrivalTime: 'desc' },
      take: 5,
      include: { patient: true, nurse: true },
    });

    const recentPayments = await db.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { patient: true },
    });

    const todaySchedule = await db.appointment.findMany({
      where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)), lt: new Date(new Date().setHours(23, 59, 59, 999)) } },
      orderBy: { date: 'asc' },
      include: { patient: true, nurse: true },
    });

    return NextResponse.json({
      totalPatients,
      totalEmergencies,
      activeEmergencies,
      totalAppointments,
      todayAppointments,
      totalRevenue: totalPayments._sum.amount || 0,
      totalServices,
      totalNurses,
      todayRevenue: todayPayments._sum.amount || 0,
      pendingInvoices,
      servicesByCategory,
      recentEmergencies,
      recentPayments,
      todaySchedule,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
