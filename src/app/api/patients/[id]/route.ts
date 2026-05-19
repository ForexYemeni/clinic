import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';

// GET: Get patient detail with visits, services, invoices
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { id } = await params;
    const doc = await adminDb.collection('patients').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'المريض غير موجود' },
        { status: 404 }
      );
    }

    // Verify clinic ownership
    const patientClinicId = doc.data()?.clinicId;
    if (effectiveClinicId && patientClinicId && patientClinicId !== effectiveClinicId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const patientData = { id: doc.id, ...doc.data() };

    // Get related visits (filtered by clinicId)
    let visits: any[] = [];
    try {
      const visitsSnap = await adminDb
        .collection('visits')
        .where('patientId', '==', id)
        .where('clinicId', '==', effectiveClinicId || patientClinicId)
        .orderBy('visitDate', 'desc')
        .get();
      visits = visitsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (visitErr) {
      console.warn('Visits query failed, trying without orderBy:', visitErr);
      try {
        const visitsSnap = await adminDb
          .collection('visits')
          .where('patientId', '==', id)
          .where('clinicId', '==', effectiveClinicId || patientClinicId)
          .get();
        visits = visitsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => (b.visitDate || '').localeCompare(a.visitDate || ''));
      } catch (e2) {
        console.error('Visits query fallback also failed:', e2);
      }
    }

    // Get related invoices (filtered by clinicId)
    let invoices: any[] = [];
    try {
      const invoicesSnap = await adminDb
        .collection('invoices')
        .where('patientId', '==', id)
        .where('clinicId', '==', effectiveClinicId || patientClinicId)
        .orderBy('createdAt', 'desc')
        .get();
      invoices = invoicesSnap.docs.map((d) => {
        const data = { id: d.id, ...d.data() } as any;
        data.remaining = data.remaining ?? (data.total - (data.paid || 0));
        return data;
      });
    } catch (invErr) {
      console.warn('Invoices query failed, trying without orderBy:', invErr);
      try {
        const invoicesSnap = await adminDb
          .collection('invoices')
          .where('patientId', '==', id)
          .where('clinicId', '==', effectiveClinicId || patientClinicId)
          .get();
        invoices = invoicesSnap.docs.map((d) => {
          const data = { id: d.id, ...d.data() } as any;
          data.remaining = data.remaining ?? (data.total - (data.paid || 0));
          return data;
        }).sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      } catch (e2) {
        console.error('Invoices query fallback also failed:', e2);
      }
    }

    // Get unique service IDs from visits
    const serviceIds = new Set<string>();
    visits.forEach((visit: any) => {
      if (visit.serviceIds && Array.isArray(visit.serviceIds)) {
        visit.serviceIds.forEach((sid: string) => serviceIds.add(sid));
      }
    });

    // Fetch service details for those IDs
    const services: any[] = [];
    for (const serviceId of serviceIds) {
      try {
        const serviceDoc = await adminDb.collection('services').doc(serviceId).get();
        if (serviceDoc.exists) {
          services.push({ id: serviceDoc.id, ...serviceDoc.data() });
        }
      } catch {}
    }

    return NextResponse.json({
      ...patientData,
      visits,
      services,
      invoices,
    });
  } catch (error) {
    console.error('Get patient error:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب بيانات المريض' },
      { status: 500 }
    );
  }
}

// PUT: Update patient info
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { id } = await params;
    const body = await request.json();

    // Check if patient exists
    const patientDoc = await adminDb.collection('patients').doc(id).get();
    if (!patientDoc.exists) {
      return NextResponse.json(
        { error: 'المريض غير موجود' },
        { status: 404 }
      );
    }

    // Verify clinic ownership
    const patientClinicId = patientDoc.data()?.clinicId;
    if (effectiveClinicId && patientClinicId && patientClinicId !== effectiveClinicId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.age !== undefined) updateData.age = body.age;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.emergencyPhone !== undefined) updateData.emergencyPhone = body.emergencyPhone;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.bloodType !== undefined) updateData.bloodType = body.bloodType;
    if (body.chronicDiseases !== undefined) updateData.chronicDiseases = body.chronicDiseases;
    if (body.allergies !== undefined) updateData.allergies = body.allergies;
    if (body.medicalHistory !== undefined) updateData.medicalHistory = body.medicalHistory;
    if (body.notes !== undefined) updateData.notes = body.notes;

    await adminDb.collection('patients').doc(id).update(updateData);

    return NextResponse.json({ id, ...updateData });
  } catch (error) {
    console.error('Update patient error:', error);
    return NextResponse.json(
      { error: 'خطأ في تحديث بيانات المريض' },
      { status: 500 }
    );
  }
}

// DELETE: Delete patient
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { id } = await params;

    // Check if patient exists
    const patientDoc = await adminDb.collection('patients').doc(id).get();
    if (!patientDoc.exists) {
      return NextResponse.json(
        { error: 'المريض غير موجود' },
        { status: 404 }
      );
    }

    // Verify clinic ownership
    const patientClinicId = patientDoc.data()?.clinicId;
    if (effectiveClinicId && patientClinicId && patientClinicId !== effectiveClinicId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    // Delete related visits, invoices (only for this clinic)
    const clinicFilter = effectiveClinicId || patientClinicId;
    const [visitsSnap, invoicesSnap] = await Promise.all([
      clinicFilter
        ? adminDb.collection('visits').where('patientId', '==', id).where('clinicId', '==', clinicFilter).get()
        : adminDb.collection('visits').where('patientId', '==', id).get(),
      clinicFilter
        ? adminDb.collection('invoices').where('patientId', '==', id).where('clinicId', '==', clinicFilter).get()
        : adminDb.collection('invoices').where('patientId', '==', id).get(),
    ]);

    const batch = adminDb.batch();
    visitsSnap.docs.forEach((doc) => batch.delete(doc.ref));
    invoicesSnap.docs.forEach((doc) => batch.delete(doc.ref));
    batch.delete(adminDb.collection('patients').doc(id));
    await batch.commit();

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Delete patient error:', error);
    return NextResponse.json(
      { error: 'خطأ في حذف المريض' },
      { status: 500 }
    );
  }
}
