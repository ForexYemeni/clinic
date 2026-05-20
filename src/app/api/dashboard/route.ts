import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { checkSubscriptionExpiry } from '@/lib/notifications';

// GET: Dashboard stats based on role
// ?role=admin - total stats
// ?role=nurse - today's patients, pending tasks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'admin';
    const nurseId = searchParams.get('nurseId');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    if (role === 'nurse' && nurseId) {
      // Nurse dashboard: today's patients, pending tasks
      const [todayVisitsSnap, activeEmergenciesSnap] = await Promise.all([
        adminDb.collection('visits')
          .where('nurseId', '==', nurseId)
          .where('visitDate', '>=', todayStr)
          .get(),
        adminDb.collection('emergencies')
          .where('nurseId', '==', nurseId)
          .where('status', '==', 'active')
          .get(),
      ]);

      // Get unique patient IDs from today's visits
      const patientIds = new Set<string>();
      todayVisitsSnap.docs.forEach((doc) => {
        const pid = doc.data().patientId;
        if (pid) patientIds.add(pid);
      });

      return NextResponse.json({
        role: 'nurse',
        todayPatients: patientIds.size,
        todayVisits: todayVisitsSnap.size,
        activeEmergencies: activeEmergenciesSnap.size,
        pendingTasks: activeEmergenciesSnap.size,
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
      adminDb.collection('patients').get(),
      adminDb.collection('visits').get(),
      adminDb.collection('emergencies').get(),
      adminDb.collection('services').where('status', '==', 'active').get(),
      adminDb.collection('users').where('role', '==', 'nurse').where('active', '==', true).get(),
      adminDb.collection('invoices').where('status', 'in', ['unpaid', 'partial']).get(),
      adminDb.collection('visits').where('visitDate', '>=', todayStr).get(),
      adminDb.collection('emergencies').where('status', '==', 'active').get(),
    ]);

    const totalPatients = patientsSnap.size;
    const totalVisits = visitsSnap.size;
    const totalEmergencies = emergenciesSnap.size;
    const activeEmergencies = todayEmergenciesSnap.size;
    const activeServices = servicesSnap.size;
    const activeNurses = nursesSnap.size;
    const pendingInvoices = invoicesSnap.size;

    // Calculate revenue
    const totalRevenue = visitsSnap.docs.reduce(
      (sum, doc) => sum + (doc.data().totalPrice || 0),
      0
    );

    const todayRevenue = todayVisitsSnap.docs.reduce(
      (sum, doc) => sum + (doc.data().totalPrice || 0),
      0
    );

    const todayPatients = new Set(
      todayVisitsSnap.docs.map((doc) => doc.data().patientId).filter(Boolean)
    ).size;

    // Unpaid amount
    const unpaidAmount = invoicesSnap.docs.reduce(
      (sum, doc) => sum + ((doc.data().remaining) ?? (doc.data().total - (doc.data().paid || 0))),
      0
    );

    // Services by category
    const categoryMap: Record<string, number> = {};
    servicesSnap.docs.forEach((doc) => {
      const cat = doc.data().category || 'أخرى';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const servicesByCategory = Object.entries(categoryMap).map(
      ([category, count]) => ({ category, count })
    );

    // Top services (most used across all visits)
    const serviceCountMap: Record<string, number> = {};
    const serviceNameMap: Record<string, string> = {};
    for (const visitDoc of visitsSnap.docs) {
      const sids: string[] = visitDoc.data().serviceIds || [];
      for (const sid of sids) {
        serviceCountMap[sid] = (serviceCountMap[sid] || 0) + 1;
        if (!serviceNameMap[sid]) {
          const sDoc = await adminDb.collection('services').doc(sid).get();
          if (sDoc.exists) serviceNameMap[sid] = sDoc.data()?.nameAr || '';
        }
      }
    }
    const topServices = Object.entries(serviceCountMap)
      .map(([id, count]) => ({ name: serviceNameMap[id] || '', count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent emergencies (active)
    const recentEmergencies = [];
    const activeEmergencyDocs = emergenciesSnap.docs
      .filter((d) => d.data().status === 'active')
      .slice(0, 5);
    for (const doc of activeEmergencyDocs) {
      const data = { id: doc.id, ...doc.data() } as any;
      if (data.patientId) {
        const patientDoc = await adminDb.collection('patients').doc(data.patientId).get();
        if (patientDoc.exists) {
          data.patient = { id: patientDoc.id, name: patientDoc.data()?.name };
        }
      }
      if (data.nurseId) {
        const nurseDoc = await adminDb.collection('users').doc(data.nurseId).get();
        if (nurseDoc.exists) {
          data.nurse = { id: nurseDoc.id, name: nurseDoc.data()?.name };
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
      todayVisits: todayVisitsSnap.size,
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
