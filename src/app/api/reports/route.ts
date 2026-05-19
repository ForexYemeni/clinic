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

    const now = new Date();
    let startDate = new Date();
    if (type === 'daily') { startDate.setHours(0, 0, 0, 0); }
    else if (type === 'monthly') { startDate.setMonth(startDate.getMonth() - 1); startDate.setHours(0, 0, 0, 0); }
    else if (type === 'weekly') { startDate.setDate(startDate.getDate() - 7); startDate.setHours(0, 0, 0, 0); }
    const startStr = startDate.toISOString();

    if (type === 'services') {
      let visitsQuery = withClinic('visits');
      // Filter by nurseId if provided
      if (nurseId) {
        visitsQuery = adminDb.collection('visits')
          .where('clinicId', '==', effectiveClinicId)
          .where('nurseId', '==', nurseId);
      }
      const visitsSnapshot = await visitsQuery.get()
        .catch(() => adminDb.collection('visits').where('clinicId', '==', effectiveClinicId).get());

      const serviceCountMap: Record<string, { count: number; name: string; revenue: number }> = {};

      for (const visitDoc of visitsSnapshot.docs) {
        const visitData = visitDoc.data();
        const serviceIds: string[] = visitData.serviceIds || [];
        for (const serviceId of serviceIds) {
          if (!serviceCountMap[serviceId]) {
            const serviceDoc = await adminDb.collection('services').doc(serviceId).get();
            const serviceData = serviceDoc.exists ? serviceDoc.data() : null;
            serviceCountMap[serviceId] = { count: 0, name: serviceData?.nameAr || 'غير معروف', revenue: 0 };
          }
          serviceCountMap[serviceId].count += 1;
          const serviceDoc = await adminDb.collection('services').doc(serviceId).get();
          if (serviceDoc.exists) serviceCountMap[serviceId].revenue += serviceDoc.data()?.price || 0;
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
    const buildFilteredQuery = (col: string, dateField: string = 'createdAt') => {
      if (nurseId) {
        // Nurse-specific: filter by both clinicId and nurseId
        return adminDb.collection(col)
          .where('clinicId', '==', effectiveClinicId)
          .where('nurseId', '==', nurseId)
          .where(dateField, '>=', startStr)
          .get()
          .catch(() =>
            adminDb.collection(col)
              .where('clinicId', '==', effectiveClinicId)
              .where('nurseId', '==', nurseId)
              .get()
              .catch(() =>
                adminDb.collection(col)
                  .where('clinicId', '==', effectiveClinicId)
                  .get()
              )
          );
      }
      return adminDb.collection(col)
        .where('clinicId', '==', effectiveClinicId)
        .where(dateField, '>=', startStr)
        .get()
        .catch(() =>
          adminDb.collection(col)
            .where('clinicId', '==', effectiveClinicId)
            .get()
        );
    };

    const [patientsSnap, visitsSnap, invoicesSnap] = await Promise.all([
      // Patients don't have nurseId, so always use clinicId only
      withClinic('patients').where('createdAt', '>=', startStr).get().catch(() => withClinic('patients').get()),
      nurseId
        ? adminDb.collection('visits').where('clinicId', '==', effectiveClinicId).where('nurseId', '==', nurseId).get().catch(() => withClinic('visits').get())
        : withClinic('visits').where('visitDate', '>=', startStr).get().catch(() => withClinic('visits').get()),
      // Invoices don't have nurseId directly, use clinicId
      withClinic('invoices').where('createdAt', '>=', startStr).get().catch(() => withClinic('invoices').get()),
    ]);

    const totalPatients = patientsSnap.size;
    const totalVisits = visitsSnap.size;
    const totalServices = visitsSnap.docs.reduce((sum, doc) => sum + ((doc.data().serviceIds || []) as string[]).length, 0);
    const totalRevenue = invoicesSnap.docs.reduce((sum, doc) => sum + (doc.data().paid || 0), 0);
    const totalInvoiced = invoicesSnap.docs.reduce((sum, doc) => sum + (doc.data().total || 0), 0);
    const unpaidAmount = invoicesSnap.docs.reduce((sum, doc) => sum + ((doc.data().remaining) ?? (doc.data().total - (doc.data().paid || 0))), 0);
    const paidInvoices = invoicesSnap.docs.filter((d) => d.data().status === 'paid').length;
    const unpaidInvoices = invoicesSnap.docs.filter((d) => d.data().status === 'unpaid' || d.data().status === 'partial').length;

    const emergenciesSnap = await withClinic('emergencies').where('createdAt', '>=', startStr).get()
      .catch(() => withClinic('emergencies').get());

    // Build daily breakdown for monthly reports
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
