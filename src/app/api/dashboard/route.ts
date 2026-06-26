// ═══════════════════════════════════════════════════════════
// 📊 Dashboard API (Prisma + PostgreSQL)
// Returns stats based on role, filtered by clinicId
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';

// GET: Dashboard stats based on role (filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'admin';
    const nurseId = searchParams.get('nurseId');

    if (!effectiveClinicId) {
      return NextResponse.json({
        role,
        totalPatients: 0, totalVisits: 0, totalEmergencies: 0,
        activeEmergencies: 0, activeServices: 0, activeNurses: 0,
        totalRevenue: 0, todayRevenue: 0, todayPatients: 0, todayVisits: 0,
        pendingInvoices: 0, unpaidAmount: 0,
        servicesByCategory: [], topServices: [], recentEmergencies: [],
        subscription: null,
        subscriptionCheck: { valid: false, status: 'expired', endDate: '', daysRemaining: 0 },
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ─── Nurse dashboard ───
    if (role === 'nurse' && nurseId) {
      const [todayVisits, activeEmergencies, allEmergencies, allVisits] = await Promise.all([
        prisma.visit.findMany({ where: { clinicId: effectiveClinicId, nurseId, visitDate: { gte: today } } }),
        prisma.emergency.findMany({ where: { clinicId: effectiveClinicId, nurseId, status: 'active' } }),
        prisma.emergency.findMany({ where: { clinicId: effectiveClinicId, nurseId } }),
        prisma.visit.findMany({ where: { clinicId: effectiveClinicId, nurseId } }),
      ]);

      const patientIds = new Set<string>();
      todayVisits.forEach((v) => { if (v.patientId) patientIds.add(v.patientId); });

      let todayServices = 0;
      todayVisits.forEach((v) => { todayServices += (v.serviceIds || []).length; });

      // Recent emergencies
      const recentEmergencies: any[] = [];
      for (const doc of activeEmergencies.slice(0, 5)) {
        const data: any = { ...doc };
        if (data.patientId) {
          const p = await prisma.patient.findUnique({ where: { id: data.patientId }, select: { id: true, name: true } });
          if (p) data.patient = p;
        }
        recentEmergencies.push(data);
      }

      // Subscription
      const clinic = await prisma.clinic.findUnique({ where: { id: effectiveClinicId } });
      const sub = clinic && clinic.subEndDate
        ? {
            status: clinic.subStatus || 'active',
            type: clinic.subType || 'free',
            endDate: clinic.subEndDate.toISOString(),
            trialDays: clinic.subTrialDays,
          }
        : null;

      let subscriptionCheck: any = { valid: false, status: 'expired', endDate: '', daysRemaining: 0 };
      if (clinic && clinic.subEndDate) {
        const daysRemaining = Math.ceil((clinic.subEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        subscriptionCheck = {
          valid: clinic.subStatus === 'active' && daysRemaining > 0,
          status: clinic.subStatus || 'expired',
          endDate: clinic.subEndDate.toISOString(),
          daysRemaining,
        };
      }

      return NextResponse.json({
        role: 'nurse',
        todayPatients: patientIds.size,
        todayVisits: todayVisits.length,
        todayServices,
        activeEmergencies: activeEmergencies.length,
        totalEmergencies: allEmergencies.length,
        totalVisits: allVisits.length,
        totalPatients: patientIds.size,
        totalRevenue: 0,
        totalServices: 0,
        totalNurses: 0,
        todayRevenue: 0,
        pendingInvoices: 0,
        monthlyRevenue: 0,
        monthlyPatients: 0,
        unpaidAmount: 0,
        servicesByCategory: [],
        topServices: [],
        recentEmergencies,
        recentPayments: [],
        dailyRevenue: [],
        pendingTasks: activeEmergencies.length,
        subscription: sub,
        subscriptionCheck,
      });
    }

    // ─── Admin dashboard ───
    const [patients, visits, emergencies, services, nurses, invoices] = await Promise.all([
      prisma.patient.findMany({ where: { clinicId: effectiveClinicId } }),
      prisma.visit.findMany({ where: { clinicId: effectiveClinicId } }),
      prisma.emergency.findMany({ where: { clinicId: effectiveClinicId } }),
      prisma.service.findMany({ where: { clinicId: effectiveClinicId, status: 'active' } }),
      prisma.user.findMany({ where: { role: 'nurse', clinicId: effectiveClinicId, active: true } }),
      prisma.invoice.findMany({ where: { clinicId: effectiveClinicId, status: { in: ['unpaid', 'partial'] } } }),
    ]);

    const todayVisitsDocs = await prisma.visit.findMany({
      where: { clinicId: effectiveClinicId, visitDate: { gte: today } },
    });

    const totalPatients = patients.length;
    const activeEmergencies = emergencies.filter((e) => e.status === 'active').length;
    const activeServices = services.length;
    const activeNurses = nurses.length;
    const pendingInvoices = invoices.filter((d) => ['unpaid', 'partial'].includes(d.status)).length;

    const totalRevenue = visits.reduce((sum, v) => sum + (v.totalPrice || 0), 0);
    const todayRevenue = todayVisitsDocs.reduce((sum, v) => sum + (v.totalPrice || 0), 0);
    const todayPatients = new Set(todayVisitsDocs.map((v) => v.patientId).filter(Boolean)).size;
    const unpaidAmount = invoices
      .filter((d) => ['unpaid', 'partial'].includes(d.status))
      .reduce((sum, d) => sum + (d.remaining ?? (d.total - (d.paid || 0))), 0);

    // Services by category
    const categoryMap: Record<string, number> = {};
    services.forEach((s) => {
      const cat = s.category || 'أخرى';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const servicesByCategory = Object.entries(categoryMap).map(([category, count]) => ({ category, count }));

    // Top services
    const serviceCountMap: Record<string, number> = {};
    const serviceNameMap: Record<string, string> = {};
    const servicePriceMap: Record<string, number> = {};
    services.forEach((s) => {
      serviceNameMap[s.id] = s.nameAr || '';
      servicePriceMap[s.id] = s.price || 0;
    });
    for (const v of visits) {
      for (const sid of (v.serviceIds || [])) {
        serviceCountMap[sid] = (serviceCountMap[sid] || 0) + 1;
      }
    }
    const topServices = Object.entries(serviceCountMap)
      .map(([id, count]) => ({ name: serviceNameMap[id] || '', count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Subscription
    const clinic = await prisma.clinic.findUnique({ where: { id: effectiveClinicId } });
    let subscription: any = null;
    let subscriptionCheck: any = { valid: false, status: 'expired', endDate: '', daysRemaining: 0 };
    if (clinic) {
      if (clinic.subEndDate) {
        subscription = {
          status: clinic.subStatus || 'inactive',
          type: clinic.subType || 'free',
          endDate: clinic.subEndDate.toISOString(),
          ...(clinic.subTrialDays !== undefined ? { trialDays: clinic.subTrialDays } : {}),
        };
        const daysRemaining = Math.ceil((clinic.subEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        subscriptionCheck = {
          valid: clinic.subStatus === 'active' && daysRemaining > 0,
          status: clinic.subStatus || 'expired',
          endDate: clinic.subEndDate.toISOString(),
          daysRemaining,
        };
      }
    }

    // Recent emergencies
    const recentEmergencies: any[] = [];
    for (const doc of emergencies.filter((d) => d.status === 'active').slice(0, 5)) {
      const data: any = { ...doc };
      if (data.patientId) {
        const p = await prisma.patient.findUnique({ where: { id: data.patientId }, select: { id: true, name: true } });
        if (p) data.patient = p;
      }
      if (data.nurseId) {
        const n = await prisma.user.findUnique({ where: { id: data.nurseId }, select: { id: true, name: true } });
        if (n) data.nurse = n;
      }
      recentEmergencies.push(data);
    }

    return NextResponse.json({
      role: 'admin',
      totalPatients,
      totalVisits: visits.length,
      totalEmergencies: emergencies.length,
      activeEmergencies,
      activeServices,
      activeNurses,
      totalRevenue,
      todayRevenue,
      todayPatients,
      todayVisits: todayVisitsDocs.length,
      pendingInvoices,
      unpaidAmount,
      servicesByCategory,
      topServices,
      recentEmergencies,
      subscription,
      subscriptionCheck,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'خطأ في جلب بيانات لوحة التحكم' }, { status: 500 });
  }
}
