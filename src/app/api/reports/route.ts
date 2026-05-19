import { adminDb } from '@/lib/firebase-admin';
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

    const withClinic = (col: string) => {
      return adminDb.collection(col).where('clinicId', '==', effectiveClinicId);
    };

    // Safe query helper - tries indexed query first, falls back to unindexed
    const safeQuery = async (
      col: string,
      filters: { field: string; value: string }[],
    ) => {
      try {
        let query: any = adminDb.collection(col);
        for (const f of filters) {
          query = query.where(f.field, '==', f.value);
        }
        const snap = await query.get();
        return snap;
      } catch {
        // Fallback: just filter by clinicId only
        try {
          const snap = await adminDb.collection(col)
            .where('clinicId', '==', effectiveClinicId)
            .get();
          return snap;
        } catch {
          return { docs: [], size: 0 };
        }
      }
    };

    // Safe query with date range
    const safeQueryWithDate = async (
      col: string,
      dateField: string,
      startDate: string,
      extraFilters: { field: string; value: string }[] = [],
    ) => {
      try {
        let query: any = adminDb.collection(col)
          .where('clinicId', '==', effectiveClinicId);
        for (const f of extraFilters) {
          query = query.where(f.field, '==', f.value);
        }
        query = query.where(dateField, '>=', startDate);
        const snap = await query.get();
        return snap;
      } catch {
        // Fallback: just filter by clinicId + extra filters (no date)
        try {
          let query: any = adminDb.collection(col)
            .where('clinicId', '==', effectiveClinicId);
          for (const f of extraFilters) {
            query = query.where(f.field, '==', f.value);
          }
          const snap = await query.get();
          return snap;
        } catch {
          // Final fallback: clinicId only
          try {
            const snap = await adminDb.collection(col)
              .where('clinicId', '==', effectiveClinicId)
              .get();
            return snap;
          } catch {
            return { docs: [], size: 0 };
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
      const visitsExtraFilters = nurseId ? [{ field: 'nurseId', value: nurseId }] : [];
      const visitsSnapshot = await safeQueryWithDate('visits', 'visitDate', startStr, visitsExtraFilters);

      const serviceCountMap: Record<string, { count: number; name: string; revenue: number }> = {};

      for (const visitDoc of visitsSnapshot.docs) {
        const visitData = visitDoc.data();
        const serviceIds: string[] = visitData.serviceIds || [];
        for (const serviceId of serviceIds) {
          if (!serviceCountMap[serviceId]) {
            try {
              const serviceDoc = await adminDb.collection('services').doc(serviceId).get();
              const serviceData = serviceDoc.exists ? serviceDoc.data() : null;
              serviceCountMap[serviceId] = { count: 0, name: serviceData?.nameAr || 'غير معروف', revenue: 0 };
            } catch {
              serviceCountMap[serviceId] = { count: 0, name: 'غير معروف', revenue: 0 };
            }
          }
          serviceCountMap[serviceId].count += 1;
          try {
            const serviceDoc = await adminDb.collection('services').doc(serviceId).get();
            if (serviceDoc.exists) serviceCountMap[serviceId].revenue += serviceDoc.data()?.price || 0;
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
    const visitsExtraFilters = nurseId ? [{ field: 'nurseId', value: nurseId }] : [];
    const visitsDateField = nurseId ? 'visitDate' : 'visitDate';

    const [patientsSnap, visitsSnap, invoicesSnap] = await Promise.all([
      // Patients - always use clinicId only (no nurseId)
      safeQueryWithDate('patients', 'createdAt', startStr),
      // Visits - optionally filtered by nurseId
      safeQueryWithDate('visits', visitsDateField, startStr, visitsExtraFilters),
      // Invoices - always use clinicId only
      safeQueryWithDate('invoices', 'createdAt', startStr),
    ]);

    const totalPatients = patientsSnap.size;
    const totalVisits = visitsSnap.size;
    const totalServices = visitsSnap.docs.reduce((sum, doc) => sum + ((doc.data().serviceIds || []) as string[]).length, 0);
    const totalRevenue = invoicesSnap.docs.reduce((sum, doc) => sum + (doc.data().paid || 0), 0);
    const totalInvoiced = invoicesSnap.docs.reduce((sum, doc) => sum + (doc.data().total || 0), 0);
    const unpaidAmount = invoicesSnap.docs.reduce((sum, doc) => sum + ((doc.data().remaining) ?? (doc.data().total - (doc.data().paid || 0))), 0);
    const paidInvoices = invoicesSnap.docs.filter((d) => d.data().status === 'paid').length;
    const unpaidInvoices = invoicesSnap.docs.filter((d) => d.data().status === 'unpaid' || d.data().status === 'partial').length;

    const emergenciesSnap = await safeQueryWithDate('emergencies', 'createdAt', startStr);

    // Build daily breakdown for monthly/weekly reports
    let dailyBreakdown: { date: string; patients: number; revenue: number; visits: number }[] = [];
    if (type === 'monthly' || type === 'weekly') {
      const dayMap: Record<string, { patients: number; revenue: number; visits: number }> = {};

      // Group visits by date
      for (const visitDoc of visitsSnap.docs) {
        const vd = visitDoc.data();
        const visitDate = vd.visitDate || vd.createdAt || '';
        const dayKey = visitDate.slice(0, 10); // YYYY-MM-DD
        if (!dayMap[dayKey]) dayMap[dayKey] = { patients: 0, revenue: 0, visits: 0 };
        dayMap[dayKey].visits += 1;
      }

      // Group invoices by date
      for (const invDoc of invoicesSnap.docs) {
        const id = invDoc.data();
        const invDate = id.createdAt || '';
        const dayKey = invDate.slice(0, 10);
        if (!dayMap[dayKey]) dayMap[dayKey] = { patients: 0, revenue: 0, visits: 0 };
        dayMap[dayKey].revenue += id.paid || 0;
      }

      // Group patients by date
      for (const patDoc of patientsSnap.docs) {
        const pd = patDoc.data();
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
      emergencies: emergenciesSnap.size,
      dailyBreakdown,
    });
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json({ error: 'خطأ في جلب التقارير' }, { status: 500 });
  }
}
