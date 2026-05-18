import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

// GET: List emergencies (?status=active)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let snapshot;
    if (status) {
      snapshot = await adminDb
        .collection('emergencies')
        .where('status', '==', status)
        .orderBy('createdAt', 'desc')
        .get();
    } else {
      snapshot = await adminDb
        .collection('emergencies')
        .orderBy('createdAt', 'desc')
        .get();
    }

    const emergencies = [];
    for (const doc of snapshot.docs) {
      const data = { id: doc.id, ...doc.data() } as any;
      // Enrich with patient data
      if (data.patientId) {
        const patientDoc = await adminDb.collection('patients').doc(data.patientId).get();
        if (patientDoc.exists) {
          data.patient = { id: patientDoc.id, name: patientDoc.data()?.name, phone: patientDoc.data()?.phone };
        }
      }
      // Enrich with nurse data
      if (data.nurseId) {
        const nurseDoc = await adminDb.collection('users').doc(data.nurseId).get();
        if (nurseDoc.exists) {
          data.nurse = { id: nurseDoc.id, name: nurseDoc.data()?.name };
        }
      }
      emergencies.push(data);
    }

    return NextResponse.json(emergencies);
  } catch (error) {
    console.error('Emergencies list error:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب الحالات الطارئة' },
      { status: 500 }
    );
  }
}

// POST: Add new emergency
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, nurseId, severity, notes } = body;

    if (!patientId) {
      return NextResponse.json(
        { error: 'يرجى تحديد المريض' },
        { status: 400 }
      );
    }

    // Enrich with patient name
    let patientName = '';
    if (patientId) {
      const patientDoc = await adminDb.collection('patients').doc(patientId).get();
      if (patientDoc.exists) {
        patientName = patientDoc.data()?.name || '';
      }
    }

    // Enrich with nurse name
    let nurseName = '';
    if (nurseId) {
      const nurseDoc = await adminDb.collection('users').doc(nurseId).get();
      if (nurseDoc.exists) {
        nurseName = nurseDoc.data()?.name || '';
      }
    }

    const emergencyData = {
      patientId,
      patientName,
      nurseId: nurseId || '',
      nurseName,
      severity: severity || 'medium',
      status: 'active',
      notes: notes || '',
      actions: '',
      procedures: '',
      arrivalTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('emergencies').add(emergencyData);

    return NextResponse.json(
      { id: docRef.id, ...emergencyData },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create emergency error:', error);
    return NextResponse.json(
      { error: 'خطأ في إضافة الحالة الطارئة' },
      { status: 500 }
    );
  }
}
