import dbConnect from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';
import Patient from '@/models/Patient';
import Visit from '@/models/Visit';
import Invoice from '@/models/Invoice';
import Service from '@/models/Service';
import Emergency from '@/models/Emergency';
import { toClient } from '@/lib/mongoose-helpers';

// GET: Get reports data (filtered by clinicId, optional nurseId)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'daily';
    const nurseId = searchParams.get('nurseId') || '';

    if (!effectiveClinicId) {
      return NextResponse.json({
        type,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        totalRevenue: 0,
        totalPatients: 0,
        totalServices: 0,
        totalVisits: 0,
        totalInvoiced: 0,
        unpaidAmount: 0,
        paidInvoices: 0,
        unpaidInvoices: 0,
        emergencies: 0,
        dailyBreakdown: [],
      });
    }

    // Safe query helper - tries query with date filter first, falls back to without
    const safeQueryWithDate = async (
      model: any,
      dateField: string,
      startDate: string,
      extraFilters: Record<string, string> = {},
    ) => {
      try {
        const filter: Record<string, any> = { clinicId: effectiveClinicId, ...extraFilters };
        filter[dateField] = { $gte: startDate };
        return await model.find(filter).lean();
      } catch {
        // Fallback: just filter by clinicId + extra filters (no date)
        try {
          const filter: Record<string, any> = { clinicId: effectiveClinicId, ...extraFilters };
          return await model.find(filter).lean();
        } catch {
          // Final fallback: clinicId only
          try {
            return await model.find({ clinicId: effectiveClinicId }).lean();
          } catch {
            return [];
          }
        }
      }
    };

    const now = new Date();
    let startDate = new Date();
    if (type === 'daily') { startDate.setHours(0, 0, 0, 0); }
    else if (type === 'monthly') { startDate.setMonth(startDate.getMonth() - 1); startDate.setHours(0, 0, 0, 0); }
    else if (type === 'weekly') { startDate.setDate(startDate.getDate() - 7); startDate.setHours(0, 0, 0, 0); }
    const startStr = startDate.toISOString();

    if (type === 'services') {
      // Get all visits for this clinic (optionally filtered by nurseId)
      const visitsExtraFilters = nurseId ? { nurseId } : {};
      const visitsResults = await safeQueryWithDate(Visit, 'visitDate', startStr, visitsExtraFilters);

      const serviceCountMap: Record<string, { count: number; name: string; revenue: number }> = {};

      for (const visitDoc of visitsResults) {
        const visitData = toClient(visitDoc);
        const serviceIdsList: string[] = visitData.serviceIds || [];
        for (const serviceId of serviceIdsList) {
          if (!serviceCountMap[serviceId]) {
            try {
              const serviceDoc = await Service.findById(serviceId).lean();
              const serviceData = serviceDoc !== null ? toClient(serviceDoc) : null;
              serviceCountMap[serviceId] = { count: 0, name: serviceData?.nameAr || 'غير معروف', revenue: 0 };
            } catch {
              serviceCountMap[serviceId] = { count: 0, name: 'غير معروف', revenue: 0 };
            }
          }
          serviceCountMap[serviceId].count += 1;
          try {
            const serviceDoc = await Service.findById(serviceId).lean();
            if (serviceDoc !== null) serviceCountMap[serviceId].revenue += toClient(serviceDoc).price || 0;
          } catch {
            // Skip revenue if can't fetch service
          }
        }
      }

      const serviceStats = Object.entries(serviceCountMap).map(([id, data]) => ({
        serviceId: id, name: data.name, count: data.count, revenue: data.revenue,
      })).sort((a, b) => b.count - a.count);

      const maxCount = serviceStats.length > 0 ? Math.max(...serviceStats.map(s => s.count)) : 0;

      return NextResponse.json({
        type: 'services', services: serviceStats,
        totalServices: serviceStats.length,
        totalUsage: serviceStats.reduce((sum, s) => sum + s.count, 0),
        totalRevenue: serviceStats.reduce((sum, s) => sum + s.revenue, 0),
        maxCount,
      });
    }

    // Build queries with optional nurseId filtering
    const visitsExtraFilters = nurseId ? { nurseId } : {};

    const [patientsResults, visitsResults, invoicesResults] = await Promise.all([
      // Patients - always use clinicId only (no nurseId)
      safeQueryWithDate(Patient, 'createdAt', startStr),
      // Visits - optionally filtered by nurseId
      safeQueryWithDate(Visit, 'visitDate', startStr, visitsExtraFilters),
      // Invoices - always use clinicId only (filtered by nurseId below)
      safeQueryWithDate(Invoice, 'createdAt', startStr),
    ]);

    // Convert to client format
    const visitsClient = visitsResults.map((v: any) => toClient(v));
    const invoicesClient = invoicesResults.map((i: any) => toClient(i));
    const patientsClient = patientsResults.map((p: any) => toClient(p));

    // If nurseId is provided, filter invoices that belong to this nurse's visits
    let filteredInvoiceDocs = invoicesClient;
    if (nurseId) {
      const nurseVisitIds = new Set(visitsClient.map((d: any) => d.id));
      filteredInvoiceDocs = invoicesClient.filter((invDoc: any) => {
        // Check if invoice's visitId matches one of the nurse's visits
        if (invDoc.visitId && nurseVisitIds.has(invDoc.visitId)) return true;
        // Check if invoice has nurseId directly
        if (invDoc.nurseId === nurseId) return true;
        // Check if any item in the invoice has this nurse's name via visit lookup
        return false;
      });
    }

    const totalPatients = nurseId ? visitsClient.reduce((count: number, doc: any) => {
      const pid = doc.patientId;
      return pid ? count + 1 : count;
    }, 0) : patientsResults.length;
    const totalVisits = visitsResults.length;
    const totalServices = visitsClient.reduce((sum: number, doc: any) => sum + ((doc.serviceIds || []) as string[]).length, 0);
    const totalRevenue = filteredInvoiceDocs.reduce((sum: number, doc: any) => sum + (doc.paid || 0), 0);
    const totalInvoiced = filteredInvoiceDocs.reduce((sum: number, doc: any) => sum + (doc.total || 0), 0);
    const unpaidAmount = filteredInvoiceDocs.reduce((sum: number, doc: any) => sum + ((doc.remaining) ?? (doc.total - (doc.paid || 0))), 0);
    const paidInvoices = filteredInvoiceDocs.filter((d: any) => d.status === 'paid').length;
    const unpaidInvoices = filteredInvoiceDocs.filter((d: any) => d.status === 'unpaid' || d.status === 'partial').length;

    const emergenciesResults = await safeQueryWithDate(Emergency, 'createdAt', startStr);

    // Build daily breakdown for monthly/weekly reports
    let dailyBreakdown: { date: string; patients: number; revenue: number; visits: number }[] = [];
    if (type === 'monthly' || type === 'weekly') {
      const dayMap: Record<string, { patients: number; revenue: number; visits: number }> = {};

      // Group visits by date
      for (const visitDoc of visitsClient) {
        const vd = visitDoc;
        const visitDate = vd.visitDate || vd.createdAt || '';
        const dayKey = visitDate.slice(0, 10); // YYYY-MM-DD
        if (!dayMap[dayKey]) dayMap[dayKey] = { patients: 0, revenue: 0, visits: 0 };
        dayMap[dayKey].visits += 1;
      }

      // Group invoices by date (use filtered invoices for nurseId)
      for (const invDoc of filteredInvoiceDocs) {
        const id = invDoc;
        const invDate = id.createdAt || '';
        const dayKey = invDate.slice(0, 10);
        if (!dayMap[dayKey]) dayMap[dayKey] = { patients: 0, revenue: 0, visits: 0 };
        dayMap[dayKey].revenue += id.paid || 0;
      }

      // Group patients by date (skip for nurseId - patients counted from visits)
      for (const patDoc of (nurseId ? [] : patientsClient)) {
        const pd = patDoc;
        const patDate = pd.createdAt || '';
        const dayKey = patDate.slice(0, 10);
        if (!dayMap[dayKey]) dayMap[dayKey] = { patients: 0, revenue: 0, visits: 0 };
        dayMap[dayKey].patients += 1;
      }

      dailyBreakdown = Object.entries(dayMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => ({ date, ...data }));
    }

    return NextResponse.json({
      type,
      startDate: startStr,
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
