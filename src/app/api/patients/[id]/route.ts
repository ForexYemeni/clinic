import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

// GET: Get patient detail with visits, services, invoices
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await adminDb.collection('patients').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'المريض غير موجود' },
        { status: 404 }
      );
    }

    const patientData = { id: doc.id, ...doc.data() };

    // Get related visits
    const visitsSnap = await adminDb
      .collection('visits')
      .where('patientId', '==', id)
      .orderBy('visitDate', 'desc')
      .get();

    const visits = visitsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Get related invoices
    const invoicesSnap = await adminDb
      .collection('invoices')
      .where('patientId', '==', id)
      .orderBy('createdAt', 'desc')
      .get();

    const invoices = invoicesSnap.docs.map((d) => {
      const data = { id: d.id, ...d.data() } as any;
      data.remaining = data.remaining ?? (data.total - (data.paid || 0));
      return data;
    });

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
      const serviceDoc = await adminDb.collection('services').doc(serviceId).get();
      if (serviceDoc.exists) {
        services.push({ id: serviceDoc.id, ...serviceDoc.data() });
      }
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
    const { id } = await params;

    // Check if patient exists
    const patientDoc = await adminDb.collection('patients').doc(id).get();
    if (!patientDoc.exists) {
      return NextResponse.json(
        { error: 'المريض غير موجود' },
        { status: 404 }
      );
    }

    // Delete related visits, invoices
    const [visitsSnap, invoicesSnap] = await Promise.all([
      adminDb.collection('visits').where('patientId', '==', id).get(),
      adminDb.collection('invoices').where('patientId', '==', id).get(),
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
