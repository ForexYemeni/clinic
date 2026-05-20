import dbConnect from '@/lib/mongodb';
import Patient from '@/models/Patient';
import Visit from '@/models/Visit';
import Emergency from '@/models/Emergency';
import Service from '@/models/Service';
import User from '@/models/User';
import Invoice from '@/models/Invoice';
import Clinic from '@/models/Clinic';
import { toClient } from '@/lib/mongoose-helpers';
import { NextRequest, NextResponse } from 'next/server';

// GET: Dashboard stats based on role
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'admin';
    const nurseId = searchParams.get('nurseId');
    const clinicId = searchParams.get('clinicId');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Super admin: platform-wide stats
    if (role === 'super_admin') {
      const [totalClinics, activeClinics, totalPatients, totalNurses, totalAdmins] = await Promise.all([
        Clinic.countDocuments(),
        Clinic.countDocuments({ active: true }),
        Patient.countDocuments(clinicId ? { clinicId } : {}),
        User.countDocuments({ role: 'nurse', ...(clinicId ? { clinicId } : {}), active: true }),
        User.countDocuments({ role: 'admin', ...(clinicId ? { clinicId } : {}) }),
      ]);

      // Get clinics with basic stats
      const clinics = await Clinic.find().sort({ createdAt: -1 }).lean();
      const clinicsWithData = [];
      for (const c of clinics) {
        const cid = c._id.toString();
        const [pCount, nCount, eCount] = await Promise.all([
          Patient.countDocuments({ clinicId: cid }),
          User.countDocuments({ clinicId: cid, role: 'nurse' }),
          Emergency.countDocuments({ clinicId: cid, status: 'active' }),
        ]);
        clinicsWithData.push({
          id: cid,
          name: c.name,
          city: c.city,
          active: c.active !== false,
          patients: pCount,
          nurses: nCount,
          activeEmergencies: eCount,
        });
      }

      return NextResponse.json({
        role: 'super_admin',
        totalClinics,
        activeClinics,
        totalPatients,
        totalNurses,
        totalAdmins,
        clinics: clinicsWithData,
      });
    }

    // Nurse dashboard
    if (role === 'nurse' && nurseId) {
      const [todayVisits, activeEmergencies] = await Promise.all([
        Visit.find({ nurseId, ...(clinicId ? { clinicId } : {}), visitDate: { $gte: today } }).lean(),
        Emergency.find({ nurseId, ...(clinicId ? { clinicId } : {}), status: 'active' }).lean(),
      ]);

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

    // Admin dashboard (clinic-scoped)
    const clinicFilter = clinicId ? { clinicId } : {};
    const [
      patientsSnap, visitsSnap, emergenciesSnap, servicesSnap,
      nursesSnap, invoicesSnap, todayVisitsSnap, todayEmergenciesSnap,
    ] = await Promise.all([
      Patient.find(clinicFilter).lean(),
      Visit.find(clinicFilter).lean(),
      Emergency.find(clinicFilter).lean(),
      Service.find({ ...clinicFilter, status: 'active' }).lean(),
      User.find({ ...clinicFilter, role: 'nurse', active: true }).lean(),
      Invoice.find({ ...clinicFilter, status: { $in: ['unpaid', 'partial'] } }).lean(),
      Visit.find({ ...clinicFilter, visitDate: { $gte: today } }).lean(),
      Emergency.find({ ...clinicFilter, status: 'active' }).lean(),
    ]);

    const totalPatients = patientsSnap.length;
    const activeEmergencies = todayEmergenciesSnap.length;
    const activeServices = servicesSnap.length;
    const activeNurses = nursesSnap.length;
    const pendingInvoices = invoicesSnap.length;

    const totalRevenue = visitsSnap.reduce((sum, doc) => sum + (doc.totalPrice || 0), 0);
    const todayRevenue = todayVisitsSnap.reduce((sum, doc) => sum + (doc.totalPrice || 0), 0);
    const todayPatients = new Set(todayVisitsSnap.map((doc) => doc.patientId).filter(Boolean)).size;

    const unpaidAmount = invoicesSnap.reduce(
      (sum, doc) => sum + ((doc.remaining) ?? (doc.total - (doc.paid || 0))), 0
    );

    // Services by category
    const categoryMap: Record<string, number> = {};
    servicesSnap.forEach((doc) => {
      const cat = doc.category || 'أخرى';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const servicesByCategory = Object.entries(categoryMap).map(([category, count]) => ({ category, count }));

    // Top services
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

    // Recent emergencies
    const recentEmergencies = [];
    const activeEmergencyDocs = emergenciesSnap.filter((d) => d.status === 'active').slice(0, 5);
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

    // Monthly stats
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const monthlyVisits = await Visit.find({ ...clinicFilter, visitDate: { $gte: monthAgo } }).lean();
    const monthlyPatients = new Set(monthlyVisits.map(v => v.patientId).filter(Boolean)).size;
    const monthlyRevenue = monthlyVisits.reduce((sum, doc) => sum + (doc.totalPrice || 0), 0);

    return NextResponse.json({
      role: 'admin',
      totalPatients,
      totalVisits: visitsSnap.length,
      totalEmergencies: emergenciesSnap.length,
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
      monthlyRevenue,
      monthlyPatients,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'خطأ في جلب بيانات لوحة التحكم' }, { status: 500 });
  }
}
