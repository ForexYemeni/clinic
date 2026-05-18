import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [patientsSnap, emergenciesSnap, servicesSnap, nursesSnap, paymentsSnap, invoicesSnap] = await Promise.all([
      adminDb.collection('patients').get(),
      adminDb.collection('emergencies').get(),
      adminDb.collection('patientServices').get(),
      adminDb.collection('users').where('role', '==', 'nurse').where('active', '==', true).get(),
      adminDb.collection('payments').get(),
      adminDb.collection('invoices').where('status', 'in', ['unpaid', 'partial']).get(),
    ]);

    const totalPatients = patientsSnap.size;
    const totalEmergencies = emergenciesSnap.size;
    const activeEmergencies = emergenciesSnap.docs.filter(d => d.data().status === 'active').length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const todayServices = servicesSnap.docs.filter(d => {
      const date = d.data().createdAt;
      return date && new Date(date) >= new Date(todayStr);
    }).length;

    const totalRevenue = paymentsSnap.docs.reduce((sum, d) => {
      const data = d.data();
      return sum + (data.type === 'payment' ? (data.amount || 0) : -(data.amount || 0));
    }, 0);

    const todayRevenue = paymentsSnap.docs.filter(d => {
      const date = d.data().createdAt;
      return date && new Date(date) >= new Date(todayStr);
    }).reduce((sum, d) => {
      const data = d.data();
      return sum + (data.type === 'payment' ? (data.amount || 0) : -(data.amount || 0));
    }, 0);

    const totalServices = servicesSnap.size;
    const totalNurses = nursesSnap.size;
    const pendingInvoices = invoicesSnap.size;

    // Services by category
    const categoryMap: Record<string, number> = {};
    const servicesCatSnap = await adminDb.collection('services').where('active', '==', true).get();
    servicesCatSnap.docs.forEach(d => {
      const cat = d.data().category || 'أخرى';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const servicesByCategory = Object.entries(categoryMap).map(([category, count]) => ({
      category,
      count,
    }));

    // Top services (most used)
    const serviceCountMap: Record<string, number> = {};
    const serviceNameMap: Record<string, string> = {};
    for (const psDoc of servicesSnap.docs) {
      const serviceId = psDoc.data().serviceId;
      if (serviceId) {
        serviceCountMap[serviceId] = (serviceCountMap[serviceId] || 0) + 1;
        if (!serviceNameMap[serviceId]) {
          const serviceDoc = await adminDb.collection('services').doc(serviceId).get();
          if (serviceDoc.exists) serviceNameMap[serviceId] = serviceDoc.data()?.nameAr || '';
        }
      }
    }
    const topServices = Object.entries(serviceCountMap)
      .map(([id, count]) => ({ name: serviceNameMap[id] || '', count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent emergencies (active)
    const recentEmergencies = [];
    const activeEmergenciesDocs = emergenciesSnap.docs.filter(d => d.data().status === 'active').slice(0, 5);
    for (const doc of activeEmergenciesDocs) {
      const data = { id: doc.id, ...doc.data() } as any;
      if (data.patientId) {
        const patientDoc = await adminDb.collection('patients').doc(data.patientId).get();
        if (patientDoc.exists) data.patient = { id: patientDoc.id, ...patientDoc.data() };
      }
      if (data.nurseId) {
        const nurseDoc = await adminDb.collection('users').doc(data.nurseId).get();
        if (nurseDoc.exists) data.nurse = { id: nurseDoc.id, name: nurseDoc.data()?.name };
      }
      recentEmergencies.push(data);
    }

    // Recent payments
    const recentPayments = [];
    const sortedPayments = paymentsSnap.docs.sort((a, b) => {
      const da = a.data().createdAt || '';
      const db = b.data().createdAt || '';
      return db.localeCompare(da);
    }).slice(0, 5);
    for (const doc of sortedPayments) {
      const data = { id: doc.id, ...doc.data() } as any;
      if (data.patientId) {
        const patientDoc = await adminDb.collection('patients').doc(data.patientId).get();
        if (patientDoc.exists) data.patient = { id: patientDoc.id, name: patientDoc.data()?.name };
      }
      recentPayments.push(data);
    }

    return NextResponse.json({
      totalPatients,
      totalEmergencies,
      activeEmergencies,
      todayServices,
      totalRevenue,
      totalServices,
      totalNurses,
      todayRevenue,
      pendingInvoices,
      servicesByCategory,
      recentEmergencies,
      recentPayments,
      topServices,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}
