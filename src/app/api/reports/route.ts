// ═══════════════════════════════════════════════════════════
// 📈 Reports API (Prisma + PostgreSQL)
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';

// GET: Get reports data (filtered by clinicId, optional nurseId)
export async function GET(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'daily';
    const nurseId = searchParams.get('nurseId') || '';

    if (!effectiveClinicId) {
      return NextResponse.json({
        type,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        totalRevenue: 0, totalPatients: 0, totalServices: 0, totalVisits: 0,
        totalInvoiced: 0, unpaidAmount: 0,
        paidInvoices: 0, unpaidInvoices: 0,
        emergencies: 0, dailyBreakdown: [],
      });
    }

    const now = new Date();
    const startDate = new Date();
    if (type === 'daily') startDate.setHours(0, 0, 0, 0);
    else if (type === 'monthly') { startDate.setMonth(startDate.getMonth() - 1); startDate.setHours(0, 0, 0, 0); }
    else if (type === 'weekly') { startDate.setDate(startDate.getDate() - 7); startDate.setHours(0, 0, 0, 0); }

    // ─── Services report ───
    if (type === 'services') {
      const visitsResults = await prisma.visit.findMany({
        where: {
          clinicId: effectiveClinicId,
          ...(nurseId ? { nurseId } : {}),
          visitDate: { gte: startDate },
        },
      });

      const serviceCountMap: Record<string, { count: number; name: string; revenue: number }> = {};

      // Get all unique service IDs and fetch them in one query
      const allServiceIds = new Set<string>();
      visitsResults.forEach((v) => (v.serviceIds || []).forEach((sid) => allServiceIds.add(sid)));
      const services = allServiceIds.size > 0
        ? await prisma.service.findMany({ where: { id: { in: Array.from(allServiceIds) } } })
        : [];
      const serviceMap: Record<string, any> = {};
      services.forEach((s) => { serviceMap[s.id] = s; });

      for (const v of visitsResults) {
        for (const sid of (v.serviceIds || [])) {
          if (!serviceCountMap[sid]) {
            const sDoc = serviceMap[sid];
            serviceCountMap[sid] = {
              count: 0,
              name: sDoc?.nameAr || 'غير معروف',
              revenue: 0,
            };
          }
          serviceCountMap[sid].count += 1;
          if (serviceMap[sid]) serviceCountMap[sid].revenue += serviceMap[sid].price || 0;
        }
      }

      const serviceStats = Object.entries(serviceCountMap)
        .map(([id, data]) => ({ serviceId: id, name: data.name, count: data.count, revenue: data.revenue }))
        .sort((a, b) => b.count - a.count);

      const maxCount = serviceStats.length > 0 ? Math.max(...serviceStats.map((s) => s.count)) : 0;

      return NextResponse.json({
        type: 'services',
        services: serviceStats,
        totalServices: serviceStats.length,
        totalUsage: serviceStats.reduce((sum, s) => sum + s.count, 0),
        totalRevenue: serviceStats.reduce((sum, s) => sum + s.revenue, 0),
        maxCount,
      });
    }

    // ─── Standard report (daily / weekly / monthly) ───
    const [patientsResults, visitsResults, invoicesResults, emergenciesResults] = await Promise.all([
      prisma.patient.findMany({ where: { clinicId: effectiveClinicId, createdAt: { gte: startDate } } }),
      prisma.visit.findMany({
        where: {
          clinicId: effectiveClinicId,
          ...(nurseId ? { nurseId } : {}),
          visitDate: { gte: startDate },
        },
      }),
      prisma.invoice.findMany({ where: { clinicId: effectiveClinicId, createdAt: { gte: startDate } } }),
      prisma.emergency.findMany({ where: { clinicId: effectiveClinicId, createdAt: { gte: startDate } } }),
    ]);

    // Filter invoices by nurseId if provided
    let filteredInvoiceDocs: any[] = invoicesResults;
    if (nurseId) {
      const nurseVisitIds = new Set(visitsResults.map((v) => v.id));
      filteredInvoiceDocs = invoicesResults.filter((inv) => {
        if (inv.visitId && nurseVisitIds.has(inv.visitId)) return true;
        return false;
      });
    }

    const totalPatients = nurseId
      ? visitsResults.reduce((count, v) => (v.patientId ? count + 1 : count), 0)
      : patientsResults.length;
    const totalVisits = visitsResults.length;
    const totalServices = visitsResults.reduce((sum, v) => sum + (v.serviceIds || []).length, 0);
    const totalRevenue = filteredInvoiceDocs.reduce((sum, d) => sum + (d.paid || 0), 0);
    const totalInvoiced = filteredInvoiceDocs.reduce((sum, d) => sum + (d.total || 0), 0);
    const unpaidAmount = filteredInvoiceDocs.reduce((sum, d) => sum + (d.remaining ?? (d.total - (d.paid || 0))), 0);
    const paidInvoices = filteredInvoiceDocs.filter((d) => d.status === 'paid').length;
    const unpaidInvoices = filteredInvoiceDocs.filter((d) => d.status === 'unpaid' || d.status === 'partial').length;

    // Daily breakdown
    let dailyBreakdown: { date: string; patients: number; revenue: number; visits: number }[] = [];
    if (type === 'monthly' || type === 'weekly') {
      const dayMap: Record<string, { patients: number; revenue: number; visits: number }> = {};

      for (const v of visitsResults) {
        const dayKey = (v.visitDate || v.createdAt).toISOString().slice(0, 10);
        if (!dayMap[dayKey]) dayMap[dayKey] = { patients: 0, revenue: 0, visits: 0 };
        dayMap[dayKey].visits += 1;
      }
      for (const inv of filteredInvoiceDocs) {
        const dayKey = (inv.createdAt).toISOString().slice(0, 10);
        if (!dayMap[dayKey]) dayMap[dayKey] = { patients: 0, revenue: 0, visits: 0 };
        dayMap[dayKey].revenue += inv.paid || 0;
      }
      if (!nurseId) {
        for (const p of patientsResults) {
          const dayKey = (p.createdAt).toISOString().slice(0, 10);
          if (!dayMap[dayKey]) dayMap[dayKey] = { patients: 0, revenue: 0, visits: 0 };
          dayMap[dayKey].patients += 1;
        }
      }

      dailyBreakdown = Object.entries(dayMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => ({ date, ...data }));
    }

    return NextResponse.json({
      type,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      totalRevenue,
      totalPatients,
      totalServices,
      totalVisits,
      totalInvoiced,
      unpaidAmount,
      paidInvoices,
      unpaidInvoices,
      emergencies: emergenciesResults.length,
      dailyBreakdown,
    });
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json({ error: 'خطأ في جلب التقارير' }, { status: 500 });
  }
}
