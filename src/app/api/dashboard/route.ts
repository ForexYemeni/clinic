import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Clinic from '@/models/Clinic';
import Patient from '@/models/Patient';
import Visit from '@/models/Visit';
import Emergency from '@/models/Emergency';
import Service from '@/models/Service';
import Invoice from '@/models/Invoice';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';
import { toClient } from '@/lib/mongoose-helpers';

// GET: Dashboard stats based on role (filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
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

    if (role === 'nurse' && nurseId) {
      const [todayVisits, activeEmergencies, allEmergencies, allVisits] = await Promise.all([
        Visit.find({ clinicId: effectiveClinicId, nurseId, visitDate: { $gte: todayStr } }).lean()
          .catch(() => Visit.find({ clinicId: effectiveClinicId, nurseId }).lean()),
        Emergency.find({ clinicId: effectiveClinicId, nurseId, status: 'active' }).lean(),
        Emergency.find({ clinicId: effectiveClinicId, nurseId }).lean(),
        Visit.find({ clinicId: effectiveClinicId, nurseId }).lean(),
      ]);

      const patientIds = new Set<string>();
      todayVisits.forEach((doc) => {
        const pid = doc.patientId;
        if (pid) patientIds.add(pid);
      });

      // Count today's services from visits
      let todayServices = 0;
      todayVisits.forEach((doc) => {
        const sids: string[] = doc.serviceIds || [];
        todayServices += sids.length;
      });

      // Recent emergencies for nurse
      const recentEmergencies = [];
      const activeEmergencyDocs = activeEmergencies.slice(0, 5);
      for (const doc of activeEmergencyDocs) {
        const data = toClient(doc) as any;
        if (data.patientId) {
          const patientDoc = await Patient.findById(data.patientId).lean();
          if (patientDoc) data.patient = { id: patientDoc._id.toString(), name: patientDoc.name };
        }
        recentEmergencies.push(data);
      }

      // Subscription info for nurse
      const clinicDoc = await Clinic.findById(effectiveClinicId).lean();
      let subscription: null | { status: string; type: string; endDate: string; trialDays?: number } = null;
      let subscriptionCheck: { valid: boolean; status: string; endDate: string; daysRemaining: number } = { valid: false, status: 'expired', endDate: '', daysRemaining: 0 };
      if (clinicDoc) {
        const sub = (clinicDoc as any).subscription;
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
        todayVisits: todayVisits.length,
        todayServices,
        activeEmergencies: activeEmergencies.length,
        totalEmergencies: allEmergencies.length,
        totalVisits: allVisits.length,
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
        pendingTasks: activeEmergencies.length,
        subscription,
        subscriptionCheck,
      });
    }

    // Admin dashboard - all queries scoped to effectiveClinicId
    const [
      patients, visits, emergencies, services, nurses, invoices,
    ] = await Promise.all([
      Patient.find({ clinicId: effectiveClinicId }).lean(),
      Visit.find({ clinicId: effectiveClinicId }).lean(),
      Emergency.find({ clinicId: effectiveClinicId }).lean(),
      Service.find({ clinicId: effectiveClinicId, status: 'active' }).lean(),
      User.find({ role: 'nurse', clinicId: effectiveClinicId, active: true }).lean(),
      Invoice.find({ clinicId: effectiveClinicId, status: { $in: ['unpaid', 'partial'] } }).lean(),
    ]);

    // Today stats
    const todayVisitsDocs = await Visit.find({ clinicId: effectiveClinicId, visitDate: { $gte: todayStr } }).lean();
    const todayEmergenciesDocs = await Emergency.find({ clinicId: effectiveClinicId, status: 'active' }).lean();

    const totalPatients = patients.length;
    const activeEmergencies = todayEmergenciesDocs.length;
    const activeServices = services.length;
    const activeNurses = nurses.length;

    // Filter invoices for pending only
    const pendingInvoices = invoices.filter(d => ['unpaid', 'partial'].includes(d.status)).length;

    const totalRevenue = visits.reduce((sum, doc) => sum + (doc.totalPrice || 0), 0);
    const todayRevenue = todayVisitsDocs.reduce((sum, doc) => sum + (doc.totalPrice || 0), 0);
    const todayPatients = new Set(todayVisitsDocs.map((doc) => doc.patientId).filter(Boolean)).size;
    const unpaidAmount = invoices.filter(d => ['unpaid', 'partial'].includes(d.status)).reduce((sum, doc) => sum + ((doc.remaining) ?? (doc.total - (doc.paid || 0))), 0);

    // Services by category
    const categoryMap: Record<string, number> = {};
    services.forEach((doc) => {
      const cat = doc.category || 'أخرى';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const servicesByCategory = Object.entries(categoryMap).map(([category, count]) => ({ category, count }));

    // Top services
    const serviceCountMap: Record<string, number> = {};
    const serviceNameMap: Record<string, string> = {};
    for (const visitDoc of visits) {
      const sids: string[] = visitDoc.serviceIds || [];
      for (const sid of sids) {
        serviceCountMap[sid] = (serviceCountMap[sid] || 0) + 1;
        if (!serviceNameMap[sid]) {
          const sDoc = await Service.findById(sid).lean();
          if (sDoc) serviceNameMap[sid] = sDoc.nameAr || '';
        }
      }
    }
    const topServices = Object.entries(serviceCountMap).map(([id, count]) => ({ name: serviceNameMap[id] || '', count })).sort((a, b) => b.count - a.count).slice(0, 5);

    // Subscription info
    const clinicDoc = await Clinic.findById(effectiveClinicId).lean();
    let subscription: null | { status: string; type: string; endDate: string; trialDays?: number } = null;
    let subscriptionCheck: { valid: boolean; status: string; endDate: string; daysRemaining: number } = { valid: false, status: 'expired', endDate: '', daysRemaining: 0 };

    if (clinicDoc) {
      const sub = (clinicDoc as any).subscription;
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
    const activeEmergencyDocs = emergencies.filter((d) => d.status === 'active').slice(0, 5);
    for (const doc of activeEmergencyDocs) {
      const data = toClient(doc) as any;
      if (data.patientId) {
        const patientDoc = await Patient.findById(data.patientId).lean();
        if (patientDoc) data.patient = { id: patientDoc._id.toString(), name: patientDoc.name };
      }
      if (data.nurseId) {
        const nurseDoc = await User.findById(data.nurseId).lean();
        if (nurseDoc) data.nurse = { id: nurseDoc._id.toString(), name: nurseDoc.name };
      }
      recentEmergencies.push(data);
    }

    return NextResponse.json({
      role: 'admin',
      totalPatients, totalVisits: visits.length, totalEmergencies: emergencies.length,
      activeEmergencies, activeServices, activeNurses,
      totalRevenue, todayRevenue, todayPatients, todayVisits: todayVisitsDocs.length,
      pendingInvoices, unpaidAmount, servicesByCategory, topServices, recentEmergencies,
      subscription, subscriptionCheck,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'خطأ في جلب بيانات لوحة التحكم' }, { status: 500 });
  }
}
