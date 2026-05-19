import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest } from '@/lib/auth';

// GET: Dashboard stats based on role (filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    const auth = extractAuthFromRequest(request);
    const clinicId = auth?.clinicId || null;
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'admin';
    const nurseId = searchParams.get('nurseId');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    // Helper to add clinicId filter
    const withClinic = (col: string) => {
      let q: FirebaseFirestore.Query = adminDb.collection(col);
      if (clinicId) q = q.where('clinicId', '==', clinicId);
      return q;
    };

    if (role === 'nurse' && nurseId) {
      const [todayVisitsSnap, activeEmergenciesSnap] = await Promise.all([
        withClinic('visits').where('nurseId', '==', nurseId).where('visitDate', '>=', todayStr).get().catch(() => withClinic('visits').where('nurseId', '==', nurseId).get()),
        withClinic('emergencies').where('nurseId', '==', nurseId).where('status', '==', 'active').get().catch(() => adminDb.collection('emergencies').where('nurseId', '==', nurseId).where('status', '==', 'active').get()),
      ]);

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

    // Admin dashboard
    const [
      patientsSnap, visitsSnap, emergenciesSnap, servicesSnap, nursesSnap, invoicesSnap,
    ] = await Promise.all([
      withClinic('patients').get().catch(() => adminDb.collection('patients').get()),
      withClinic('visits').get().catch(() => adminDb.collection('visits').get()),
      withClinic('emergencies').get().catch(() => adminDb.collection('emergencies').get()),
      withClinic('services').where('status', '==', 'active').get().catch(() => adminDb.collection('services').where('status', '==', 'active').get()),
      clinicId ? adminDb.collection('users').where('role', '==', 'nurse').where('clinicId', '==', clinicId).where('active', '==', true).get() : adminDb.collection('users').where('role', '==', 'nurse').where('active', '==', true).get(),
      withClinic('invoices').where('status', 'in', ['unpaid', 'partial']).get().catch(() => adminDb.collection('invoices').get()),
    ]);

    // Today stats
    const todayVisitsSnap = await withClinic('visits').where('visitDate', '>=', todayStr).get().catch(() => withClinic('visits').get());
    const todayEmergenciesSnap = await withClinic('emergencies').where('status', '==', 'active').get().catch(() => adminDb.collection('emergencies').where('status', '==', 'active').get());

    const totalPatients = patientsSnap.size;
    const activeEmergencies = todayEmergenciesSnap.size;
    const activeServices = servicesSnap.size;
    const activeNurses = nursesSnap.size;

    // Filter invoices for pending only
    const pendingInvoices = invoicesSnap.docs.filter(d => ['unpaid', 'partial'].includes(d.data().status)).length;

    const totalRevenue = visitsSnap.docs.reduce((sum, doc) => sum + (doc.data().totalPrice || 0), 0);
    const todayRevenue = todayVisitsSnap.docs.reduce((sum, doc) => sum + (doc.data().totalPrice || 0), 0);
    const todayPatients = new Set(todayVisitsSnap.docs.map((doc) => doc.data().patientId).filter(Boolean)).size;
    const unpaidAmount = invoicesSnap.docs.filter(d => ['unpaid', 'partial'].includes(d.data().status)).reduce((sum, doc) => sum + ((doc.data().remaining) ?? (doc.data().total - (doc.data().paid || 0))), 0);

    // Services by category
    const categoryMap: Record<string, number> = {};
    servicesSnap.docs.forEach((doc) => {
      const cat = doc.data().category || 'أخرى';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const servicesByCategory = Object.entries(categoryMap).map(([category, count]) => ({ category, count }));

    // Top services
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
    const topServices = Object.entries(serviceCountMap).map(([id, count]) => ({ name: serviceNameMap[id] || '', count })).sort((a, b) => b.count - a.count).slice(0, 5);

    // Recent emergencies
    const recentEmergencies = [];
    const activeEmergencyDocs = emergenciesSnap.docs.filter((d) => d.data().status === 'active').slice(0, 5);
    for (const doc of activeEmergencyDocs) {
      const data = { id: doc.id, ...doc.data() } as any;
      if (data.patientId) {
        const patientDoc = await adminDb.collection('patients').doc(data.patientId).get();
        if (patientDoc.exists) data.patient = { id: patientDoc.id, name: patientDoc.data()?.name };
      }
      if (data.nurseId) {
        const nurseDoc = await adminDb.collection('users').doc(data.nurseId).get();
        if (nurseDoc.exists) data.nurse = { id: nurseDoc.id, name: nurseDoc.data()?.name };
      }
      recentEmergencies.push(data);
    }

    return NextResponse.json({
      role: 'admin',
      totalPatients, totalVisits: visitsSnap.size, totalEmergencies: emergenciesSnap.size,
      activeEmergencies, activeServices, activeNurses,
      totalRevenue, todayRevenue, todayPatients, todayVisits: todayVisitsSnap.size,
      pendingInvoices, unpaidAmount, servicesByCategory, topServices, recentEmergencies,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'خطأ في جلب بيانات لوحة التحكم' }, { status: 500 });
  }
}
