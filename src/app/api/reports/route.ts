import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'daily';

    let startDate = new Date();
    if (type === 'daily') {
      startDate.setHours(0, 0, 0, 0);
    } else if (type === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (type === 'monthly') {
      startDate.setMonth(startDate.getMonth() - 1);
    }
    const startStr = startDate.toISOString();

    const [patientsSnap, servicesSnap, emergenciesSnap, paymentsSnap, dailyReportsSnap] = await Promise.all([
      adminDb.collection('patients').where('createdAt', '>=', startStr).get(),
      adminDb.collection('patientServices').where('createdAt', '>=', startStr).get(),
      adminDb.collection('emergencies').where('arrivalTime', '>=', startStr).get(),
      adminDb.collection('payments').where('type', '==', 'payment').where('createdAt', '>=', startStr).get(),
      adminDb.collection('dailyReports').where('date', '>=', startStr).get(),
    ]);

    const newPatients = patientsSnap.size;
    const servicesProvided = servicesSnap.size;
    const emergencies = emergenciesSnap.size;

    const revenue = paymentsSnap.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
    const paymentCount = paymentsSnap.size;

    const dailyReports = [];
    for (const doc of dailyReportsSnap.docs) {
      const data = { id: doc.id, ...doc.data() } as Record<string, unknown>;
      if (data.nurseId) {
        const nurseDoc = await adminDb.collection('users').doc(data.nurseId as string).get();
        if (nurseDoc.exists) {
          data.nurse = { name: nurseDoc.data()?.name };
        }
      }
      dailyReports.push(data);
    }
    dailyReports.sort((a, b) => {
      const da = (a as Record<string, unknown>).date as string || '';
      const db = (b as Record<string, unknown>).date as string || '';
      return db.localeCompare(da);
    });

    const methodMap: Record<string, { sum: number; count: number }> = {};
    paymentsSnap.docs.forEach(doc => {
      const data = doc.data();
      const method = data.method || 'cash';
      if (!methodMap[method]) methodMap[method] = { sum: 0, count: 0 };
      methodMap[method].sum += data.amount || 0;
      methodMap[method].count += 1;
    });
    const paymentByMethod = Object.entries(methodMap).map(([method, val]) => ({
      method,
      _sum: { amount: val.sum },
      _count: val.count,
    }));

    return NextResponse.json({
      period: type,
      startDate: startStr,
      stats: {
        newPatients,
        servicesProvided,
        emergencies,
        revenue,
        paymentCount,
      },
      dailyReports,
      paymentByMethod,
    });
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json({ error: 'خطأ في جلب التقارير' }, { status: 500 });
  }
}
