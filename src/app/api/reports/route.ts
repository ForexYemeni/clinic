import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

// GET: Get reports data
// ?type=daily - today's revenue, patients, services
// ?type=monthly - month's revenue, patients, services
// ?type=services - service usage stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'daily';

    const now = new Date();
    let startDate = new Date();

    if (type === 'daily') {
      startDate.setHours(0, 0, 0, 0);
    } else if (type === 'monthly') {
      startDate.setMonth(startDate.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
    }

    const startStr = startDate.toISOString();

    if (type === 'services') {
      // Service usage stats
      const visitsSnapshot = await adminDb.collection('visits').get();
      const serviceCountMap: Record<string, { count: number; name: string; revenue: number }> = {};

      for (const visitDoc of visitsSnapshot.docs) {
        const visitData = visitDoc.data();
        const serviceIds: string[] = visitData.serviceIds || [];
        for (const serviceId of serviceIds) {
          if (!serviceCountMap[serviceId]) {
            const serviceDoc = await adminDb.collection('services').doc(serviceId).get();
            const serviceData = serviceDoc.exists ? serviceDoc.data() : null;
            serviceCountMap[serviceId] = {
              count: 0,
              name: serviceData?.nameAr || 'غير معروف',
              revenue: 0,
            };
          }
          serviceCountMap[serviceId].count += 1;
          // Get price from service
          const serviceDoc = await adminDb.collection('services').doc(serviceId).get();
          if (serviceDoc.exists) {
            serviceCountMap[serviceId].revenue += serviceDoc.data()?.price || 0;
          }
        }
      }

      const serviceStats = Object.entries(serviceCountMap)
        .map(([id, data]) => ({
          serviceId: id,
          serviceName: data.name,
          usageCount: data.count,
          totalRevenue: data.revenue,
        }))
        .sort((a, b) => b.usageCount - a.usageCount);

      return NextResponse.json({
        type: 'services',
        services: serviceStats,
        totalServices: serviceStats.length,
        totalUsage: serviceStats.reduce((sum, s) => sum + s.usageCount, 0),
        totalRevenue: serviceStats.reduce((sum, s) => sum + s.totalRevenue, 0),
      });
    }

    // Daily or Monthly report
    const [patientsSnap, visitsSnap, invoicesSnap] = await Promise.all([
      adminDb.collection('patients').where('createdAt', '>=', startStr).get(),
      adminDb.collection('visits').where('visitDate', '>=', startStr).get(),
      adminDb.collection('invoices').where('createdAt', '>=', startStr).get(),
    ]);

    const newPatients = patientsSnap.size;
    const totalVisits = visitsSnap.size;
    const servicesProvided = visitsSnap.docs.reduce(
      (sum, doc) => sum + ((doc.data().serviceIds || []) as string[]).length,
      0
    );
    const revenue = invoicesSnap.docs.reduce(
      (sum, doc) => sum + (doc.data().paid || 0),
      0
    );
    const totalInvoiced = invoicesSnap.docs.reduce(
      (sum, doc) => sum + (doc.data().total || 0),
      0
    );
    const unpaidAmount = invoicesSnap.docs.reduce(
      (sum, doc) => sum + ((doc.data().remaining) ?? (doc.data().total - (doc.data().paid || 0))),
      0
    );
    const paidInvoices = invoicesSnap.docs.filter((d) => d.data().status === 'paid').length;
    const unpaidInvoices = invoicesSnap.docs.filter((d) => d.data().status === 'unpaid' || d.data().status === 'partial').length;

    // Emergencies in period
    const emergenciesSnap = await adminDb
      .collection('emergencies')
      .where('createdAt', '>=', startStr)
      .get();
    const emergencies = emergenciesSnap.size;

    return NextResponse.json({
      type,
      startDate: startStr,
      endDate: now.toISOString(),
      stats: {
        newPatients,
        totalVisits,
        servicesProvided,
        revenue,
        totalInvoiced,
        unpaidAmount,
        paidInvoices,
        unpaidInvoices,
        emergencies,
      },
    });
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب التقارير' },
      { status: 500 }
    );
  }
}
