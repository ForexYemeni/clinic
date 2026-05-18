import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

// GET: List visits (?patientId=xxx)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    let snapshot;
    if (patientId) {
      snapshot = await adminDb
        .collection('visits')
        .where('patientId', '==', patientId)
        .orderBy('visitDate', 'desc')
        .get();
    } else {
      snapshot = await adminDb
        .collection('visits')
        .orderBy('visitDate', 'desc')
        .get();
    }

    const visits = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json(visits);
  } catch (error) {
    console.error('Visits list error:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب الزيارات' },
      { status: 500 }
    );
  }
}

// POST: Add new visit with services (auto-generate invoice)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientId,
      nurseId,
      nurseName,
      reason,
      diagnosis,
      vitalSigns,
      medications,
      serviceIds,
      notes,
    } = body;

    if (!patientId) {
      return NextResponse.json(
        { error: 'يرجى تحديد المريض' },
        { status: 400 }
      );
    }

    if (!nurseId) {
      return NextResponse.json(
        { error: 'يرجى تحديد الممرض' },
        { status: 400 }
      );
    }

    // Auto-calculate total price from service IDs
    const items: { serviceId: string; serviceName: string; price: number; quantity: number; nurseName: string }[] = [];
    let totalPrice = 0;

    if (serviceIds && Array.isArray(serviceIds) && serviceIds.length > 0) {
      for (const serviceId of serviceIds) {
        const serviceDoc = await adminDb.collection('services').doc(serviceId).get();
        if (serviceDoc.exists) {
          const serviceData = serviceDoc.data();
          if (serviceData.status !== 'deleted') {
            const price = serviceData.price || 0;
            items.push({
              serviceId,
              serviceName: serviceData.nameAr || '',
              price,
              quantity: 1,
              nurseName: nurseName || '',
            });
            totalPrice += price;
          }
        }
      }
    }

    // Create visit
    const visitData = {
      patientId,
      nurseId,
      nurseName: nurseName || '',
      reason: reason || '',
      diagnosis: diagnosis || '',
      status: 'completed',
      visitDate: new Date().toISOString(),
      notes: notes || '',
      vitalSigns: vitalSigns || {
        bloodPressure: '',
        heartRate: '',
        temperature: '',
        oxygenLevel: '',
        sugarLevel: '',
      },
      medications: medications || [],
      serviceIds: serviceIds || [],
      totalPrice,
      createdAt: new Date().toISOString(),
    };

    const visitRef = await adminDb.collection('visits').add(visitData);

    // Auto-generate invoice for this visit
    let invoiceData = null;
    if (items.length > 0) {
      const invoice = {
        patientId,
        visitId: visitRef.id,
        items,
        total: totalPrice,
        paid: 0,
        remaining: totalPrice,
        status: 'unpaid',
        createdAt: new Date().toISOString(),
      };

      const invoiceRef = await adminDb.collection('invoices').add(invoice);
      invoiceData = { id: invoiceRef.id, ...invoice };
    }

    return NextResponse.json(
      {
        visit: { id: visitRef.id, ...visitData },
        invoice: invoiceData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create visit error:', error);
    return NextResponse.json(
      { error: 'خطأ في إضافة الزيارة' },
      { status: 500 }
    );
  }
}
