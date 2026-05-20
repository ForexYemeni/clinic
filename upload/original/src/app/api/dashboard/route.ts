import { adminDb } from '@/lib/firebase-admin';
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
    const todayStr = today.toISOString();

    // Helper to build clinic-scoped query
    const withClinic = (col: string) => {
      return adminDb.collection(col).where('clinicId', '==', effectiveClinicId);
    };

    if (role === 'nurse' && nurseId) {
      const [todayVisitsSnap, activeEmergenciesSnap, allEmergenciesSnap, allVisitsSnap] = await Promise.all([
        withClinic('visits').where('nurseId', '==', nurseId).where('visitDate', '>=', todayStr).get()
          .catch(() => withClinic('visits').where('nurseId', '==', nurseId).get()),
        withClinic('emergencies').where('nurseId', '==', nurseId).where('status', '==', 'active').get()
          .catch(() => adminDb.collection('emergencies').where('nurseId', '==', nurseId).where('status', '==', 'active').where('clinicId', '==', effectiveClinicId).get()),
        withClinic('emergencies').where('nurseId', '==', nurseId).get()
          .catch(() => adminDb.collection('emergencies').where('nurseId', '==', nurseId).where('clinicId', '==', effectiveClinicId).get()),
        withClinic('visits').where('nurseId', '==', nurseId).get()
          .catch(() => withClinic('visits').where('nurseId', '==', nurseId).get()),
      ]);

      const patientIds = new Set<string>();
      todayVisitsSnap.docs.forEach((doc) => {
        const pid = doc.data().patientId;
        if (pid) patientIds.add(pid);
      });

      // Count today's services from visits
      let todayServices = 0;
      todayVisitsSnap.docs.forEach((doc) => {
        const sids: string[] = doc.data().serviceIds || [];
        todayServices += sids.length;
      });

      // Recent emergencies for nurse
      const recentEmergencies = [];
      const activeEmergencyDocs = activeEmergenciesSnap.docs.slice(0, 5);
      for (const doc of activeEmergencyDocs) {
        const data = { id: doc.id, ...doc.data() } as any;
        if (data.patientId) {
          const patientDoc = await adminDb.collection('patients').doc(data.patientId).get();
          if (patientDoc.exists) data.patient = { id: patientDoc.id, name: patientDoc.data()?.name };
        }
        recentEmergencies.push(data);
      }

      // Subscription info for nurse
      const clinicDoc = await adminDb.collection('clinics').doc(effectiveClinicId).get();
      let subscription: null | { status: string; type: string; endDate: string; trialDays?: number } = null;
      let subscriptionCheck: { valid: boolean; status: string; endDate: string; daysRemaining: number } = { valid: false, status: 'expired', endDate: '', daysRemaining: 0 };
      if (clinicDoc.exists) {
        const clinicData = clinicDoc.data();
        const sub = clinicData?.subscription;
        if (sub) {
          subscription = {
            status: sub.status || 'inactive',
            type: sub.type || 'free',
            endDate: sub.endDate || '',
            ...(sub.trialDays !== undefined ? { trialDays: sub.trialDays } : {}),
          };
          const endMs = sub.endDate ? new Date(sub.endDate).getTime() : 0;
          const nowMs = Date.now();
          const daysRemaining = endMs > nowMs ? Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24)) : 0;
          subscriptionCheck = {
            valid: sub.status === 'active' && daysRemaining > 0,
            status: sub.status || 'expired',
            endDate: sub.endDate || '',
            daysRemaining,
          };
        }
      }

      return NextResponse.json({
        role: 'nurse',
        todayPatients: patientIds.size,
        todayVisits: todayVisitsSnap.size,
        todayServices,
        activeEmergencies: activeEmergenciesSnap.size,
        totalEmergencies: allEmergenciesSnap.size,
        totalVisits: allVisitsSnap.size,
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
        pendingTasks: activeEmergenciesSnap.size,
        subscription,
        subscriptionCheck,
      });
    }

    // Admin dashboard - all queries scoped to effectiveClinicId
    const [
      patientsSnap, visitsSnap, emergenciesSnap, servicesSnap, nursesSnap, invoicesSnap,
    ] = await Promise.all([
      withClinic('patients').get().catch(() => adminDb.collection('patients').where('clinicId', '==', effectiveClinicId).get()),
      withClinic('visits').get().catch(() => adminDb.collection('visits').where('clinicId', '==', effectiveClinicId).get()),
      withClinic('emergencies').get().catch(() => adminDb.collection('emergencies').where('clinicId', '==', effectiveClinicId).get()),
      withClinic('services').where('status', '==', 'active').get().catch(() => adminDb.collection('services').where('status', '==', 'active').where('clinicId', '==', effectiveClinicId).get()),
      adminDb.collection('users').where('role', '==', 'nurse').where('clinicId', '==', effectiveClinicId).where('active', '==', true).get(),
      withClinic('invoices').where('status', 'in', ['unpaid', 'partial']).get()
        .catch(() => adminDb.collection('invoices').where('clinicId', '==', effectiveClinicId).get()),
    ]);

    // Today stats
    const todayVisitsSnap = await withClinic('visits').where('visitDate', '>=', todayStr).get()
      .catch(() => withClinic('visits').get());
    const todayEmergenciesSnap = await withClinic('emergencies').where('status', '==', 'active').get()
      .catch(() => adminDb.collection('emergencies').where('status', '==', 'active').where('clinicId', '==', effectiveClinicId).get());

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

    // Subscription info
    const clinicDoc = await adminDb.collection('clinics').doc(effectiveClinicId).get();
    let subscription: null | { status: string; type: string; endDate: string; trialDays?: number } = null;
    let subscriptionCheck: { valid: boolean; status: string; endDate: string; daysRemaining: number } = { valid: false, status: 'expired', endDate: '', daysRemaining: 0 };

    if (clinicDoc.exists) {
      const clinicData = clinicDoc.data();
      const sub = clinicData?.subscription;
      if (sub) {
        subscription = {
          status: sub.status || 'inactive',
          type: sub.type || 'free',
          endDate: sub.endDate || '',
          ...(sub.trialDays !== undefined ? { trialDays: sub.trialDays } : {}),
        };
        const endMs = sub.endDate ? new Date(sub.endDate).getTime() : 0;
        const nowMs = Date.now();
        const daysRemaining = endMs > nowMs ? Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24)) : 0;
        subscriptionCheck = {
          valid: sub.status === 'active' && daysRemaining > 0,
          status: sub.status || 'expired',
          endDate: sub.endDate || '',
          daysRemaining,
        };
      }
    }

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
      subscription, subscriptionCheck,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'خطأ في جلب بيانات لوحة التحكم' }, { status: 500 });
  }
}
