import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const doc = await adminDb.collection('patients').doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    
    const patientData = { id: doc.id, ...doc.data() };
    
    // Get related data
    const [visitsSnap, servicesSnap, medicationsSnap, emergenciesSnap, paymentsSnap, invoicesSnap] = await Promise.all([
      adminDb.collection('visits').where('patientId', '==', id).orderBy('visitDate', 'desc').get(),
      adminDb.collection('patientServices').where('patientId', '==', id).get(),
      adminDb.collection('medications').where('patientId', '==', id).orderBy('createdAt', 'desc').get(),
      adminDb.collection('emergencies').where('patientId', '==', id).orderBy('createdAt', 'desc').get(),
      adminDb.collection('payments').where('patientId', '==', id).orderBy('createdAt', 'desc').get(),
      adminDb.collection('invoices').where('patientId', '==', id).orderBy('createdAt', 'desc').get(),
    ]);

    // Enrich patient services with service and nurse data
    const patientServices = [];
    for (const psDoc of servicesSnap.docs) {
      const psData = { id: psDoc.id, ...psDoc.data() } as any;
      if (psData.serviceId) {
        const serviceDoc = await adminDb.collection('services').doc(psData.serviceId).get();
        if (serviceDoc.exists) psData.service = { id: serviceDoc.id, ...serviceDoc.data() };
      }
      if (psData.nurseId) {
        const nurseDoc = await adminDb.collection('users').doc(psData.nurseId).get();
        if (nurseDoc.exists) psData.nurse = { id: nurseDoc.id, name: nurseDoc.data()?.name };
      }
      patientServices.push(psData);
    }

    const emergencies = emergenciesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const visits = visitsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const medications = medicationsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const payments = paymentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const invoices = invoicesSnap.docs.map(d => {
      const data = { id: d.id, ...d.data() } as any;
      data.remaining = data.remaining || (data.total - data.paid);
      return data;
    });

    return NextResponse.json({
      ...patientData,
      visits,
      services: patientServices,
      medications,
      emergencies,
      payments,
      invoices,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch patient' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    await adminDb.collection('patients').doc(id).update(body);
    return NextResponse.json({ id, ...body });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await adminDb.collection('patients').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete patient' }, { status: 500 });
  }
}
