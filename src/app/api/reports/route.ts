import dbConnect from '@/lib/mongodb';
import Patient from '@/models/Patient';
import Visit from '@/models/Visit';
import Invoice from '@/models/Invoice';
import Emergency from '@/models/Emergency';
import Service from '@/models/Service';
import { NextRequest, NextResponse } from 'next/server';

// GET: Get reports data
// ?type=daily - today's revenue, patients, services
// ?type=monthly - month's revenue, patients, services
// ?type=services - service usage stats
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

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

    if (type === 'services') {
      // Service usage stats
      const visitsSnapshot = await Visit.find().lean();
      const serviceCountMap: Record<string, { count: number; name: string; revenue: number }> = {};

      for (const visitDoc of visitsSnapshot) {
        const serviceIds: string[] = visitDoc.serviceIds || [];
        for (const serviceId of serviceIds) {
          if (!serviceCountMap[serviceId]) {
            const serviceDoc = await Service.findById(serviceId).lean();
            serviceCountMap[serviceId] = {
              count: 0,
              name: serviceDoc?.nameAr || 'غير معروف',
              revenue: 0,
            };
          }
          serviceCountMap[serviceId].count += 1;
          // Get price from service
          const serviceDoc = await Service.findById(serviceId).lean();
          if (serviceDoc) {
            serviceCountMap[serviceId].revenue += serviceDoc.price || 0;
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
      Patient.find({ createdAt: { $gte: startDate } }).lean(),
      Visit.find({ visitDate: { $gte: startDate } }).lean(),
      Invoice.find({ createdAt: { $gte: startDate } }).lean(),
    ]);

    const newPatients = patientsSnap.length;
    const totalVisits = visitsSnap.length;
    const servicesProvided = visitsSnap.reduce(
      (sum, doc) => sum + ((doc.serviceIds || []) as string[]).length,
      0
    );
    const revenue = invoicesSnap.reduce(
      (sum, doc) => sum + (doc.paid || 0),
      0
    );
    const totalInvoiced = invoicesSnap.reduce(
      (sum, doc) => sum + (doc.total || 0),
      0
    );
    const unpaidAmount = invoicesSnap.reduce(
      (sum, doc) => sum + ((doc.remaining) ?? (doc.total - (doc.paid || 0))),
      0
    );
    const paidInvoices = invoicesSnap.filter((d) => d.status === 'paid').length;
    const unpaidInvoices = invoicesSnap.filter((d) => d.status === 'unpaid' || d.status === 'partial').length;

    // Emergencies in period
    const emergenciesSnap = await Emergency
      .find({ createdAt: { $gte: startDate } })
      .lean();
    const emergencies = emergenciesSnap.length;

    return NextResponse.json({
      type,
      startDate: startDate.toISOString(),
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
