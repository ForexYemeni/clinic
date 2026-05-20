import dbConnect from '@/lib/mongodb';
import Patient from '@/models/Patient';
import Visit from '@/models/Visit';
import Emergency from '@/models/Emergency';
import Service from '@/models/Service';
import User from '@/models/User';
import Invoice from '@/models/Invoice';
import { toClient } from '@/lib/mongoose-helpers';
import { checkSubscriptionExpiry } from '@/lib/notifications';
import { NextRequest, NextResponse } from 'next/server';

// GET: Dashboard stats based on role
// ?role=admin - total stats
// ?role=nurse - today's patients, pending tasks
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'admin';
    const nurseId = searchParams.get('nurseId');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (role === 'nurse' && nurseId) {
      // Nurse dashboard: today's patients, pending tasks
      const [todayVisits, activeEmergencies] = await Promise.all([
        Visit.find({
          nurseId,
          visitDate: { $gte: today },
        }).lean(),
        Emergency.find({
          nurseId,
          status: 'active',
        }).lean(),
      ]);

      // Get unique patient IDs from today's visits
      const patientIds = new Set<string>();
      todayVisits.forEach((doc) => {
        if (doc.patientId) patientIds.add(doc.patientId);
      });

      return NextResponse.json({
        role: 'nurse',
        todayPatients: patientIds.size,
        todayVisits: todayVisits.length,
        activeEmergencies: activeEmergencies.length,
        pendingTasks: activeEmergencies.length,
      });
    }

    // Admin dashboard: total stats
    const [
      patientsSnap,
      visitsSnap,
      emergenciesSnap,
      servicesSnap,
      nursesSnap,
      invoicesSnap,
      todayVisitsSnap,
      todayEmergenciesSnap,
    ] = await Promise.all([
      Patient.find().lean(),
      Visit.find().lean(),
      Emergency.find().lean(),
      Service.find({ status: 'active' }).lean(),
      User.find({ role: 'nurse', active: true }).lean(),
      Invoice.find({ status: { $in: ['unpaid', 'partial'] } }).lean(),
      Visit.find({ visitDate: { $gte: today } }).lean(),
      Emergency.find({ status: 'active' }).lean(),
    ]);

    const totalPatients = patientsSnap.length;
    const totalVisits = visitsSnap.length;
    const totalEmergencies = emergenciesSnap.length;
    const activeEmergencies = todayEmergenciesSnap.length;
    const activeServices = servicesSnap.length;
    const activeNurses = nursesSnap.length;
    const pendingInvoices = invoicesSnap.length;

    // Calculate revenue
    const totalRevenue = visitsSnap.reduce(
      (sum, doc) => sum + (doc.totalPrice || 0),
      0
    );

    const todayRevenue = todayVisitsSnap.reduce(
      (sum, doc) => sum + (doc.totalPrice || 0),
      0
    );

    const todayPatients = new Set(
      todayVisitsSnap.map((doc) => doc.patientId).filter(Boolean)
    ).size;

    // Unpaid amount
    const unpaidAmount = invoicesSnap.reduce(
      (sum, doc) => sum + ((doc.remaining) ?? (doc.total - (doc.paid || 0))),
      0
    );

    // Services by category
    const categoryMap: Record<string, number> = {};
    servicesSnap.forEach((doc) => {
      const cat = doc.category || 'أخرى';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const servicesByCategory = Object.entries(categoryMap).map(
      ([category, count]) => ({ category, count })
    );

    // Top services (most used across all visits)
    const serviceCountMap: Record<string, number> = {};
    const serviceNameMap: Record<string, string> = {};
    for (const visitDoc of visitsSnap) {
      const sids: string[] = visitDoc.serviceIds || [];
      for (const sid of sids) {
        serviceCountMap[sid] = (serviceCountMap[sid] || 0) + 1;
        if (!serviceNameMap[sid]) {
          const sDoc = await Service.findById(sid).lean();
          if (sDoc) serviceNameMap[sid] = sDoc.nameAr || '';
        }
      }
    }
    const topServices = Object.entries(serviceCountMap)
      .map(([id, count]) => ({ name: serviceNameMap[id] || '', count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent emergencies (active)
    const recentEmergencies = [];
    const activeEmergencyDocs = emergenciesSnap
      .filter((d) => d.status === 'active')
      .slice(0, 5);
    for (const doc of activeEmergencyDocs) {
      const data = toClient(doc) as any;
      if (data.patientId) {
        const patientDoc = await Patient.findById(data.patientId).lean();
        if (patientDoc) {
          data.patient = { id: patientDoc._id.toString(), name: patientDoc.name };
        }
      }
      if (data.nurseId) {
        const nurseDoc = await User.findById(data.nurseId).lean();
        if (nurseDoc) {
          data.nurse = { id: nurseDoc._id.toString(), name: nurseDoc.name };
        }
      }
      recentEmergencies.push(data);
    }

    return NextResponse.json({
      role: 'admin',
      totalPatients,
      totalVisits,
      totalEmergencies,
      activeEmergencies,
      activeServices,
      activeNurses,
      totalRevenue,
      todayRevenue,
      todayPatients,
      todayVisits: todayVisitsSnap.length,
      pendingInvoices,
      unpaidAmount,
      servicesByCategory,
      topServices,
      recentEmergencies,
    });

    // Background: check subscription expiry (non-blocking)
    checkSubscriptionExpiry().catch(() => {});
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب بيانات لوحة التحكم' },
      { status: 500 }
    );
  }
}
