import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest } from '@/lib/auth';

// GET: List emergencies (?status=active, filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    const auth = extractAuthFromRequest(request);
    const clinicId = auth?.clinicId || null;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let docs: FirebaseFirestore.QueryDocumentSnapshot[] = [];

    const buildQuery = (baseQuery: FirebaseFirestore.Query) => {
      let q = baseQuery;
      if (clinicId) q = q.where('clinicId', '==', clinicId);
      if (status) q = q.where('status', '==', status);
      return q;
    };

    try {
      const snapshot = await buildQuery(adminDb.collection('emergencies')).orderBy('createdAt', 'desc').get();
      docs = snapshot.docs;
    } catch {
      try {
        const snapshot = await buildQuery(adminDb.collection('emergencies')).get();
        docs = snapshot.docs.sort((a, b) => {
          const da = a.data()?.createdAt || '';
          const db = b.data()?.createdAt || '';
          return db.localeCompare(da);
        });
      } catch {
        const snapshot = await adminDb.collection('emergencies').get();
        docs = snapshot.docs.filter(doc => {
          const data = doc.data();
          if (clinicId && data.clinicId !== clinicId) return false;
          if (status && data.status !== status) return false;
          return true;
        });
      }
    }

    const emergencies = [];
    for (const doc of docs) {
      const data = { id: doc.id, ...doc.data() } as any;
      if (data.patientId) {
        try {
          const patientDoc = await adminDb.collection('patients').doc(data.patientId).get();
          if (patientDoc.exists) data.patient = { id: patientDoc.id, name: patientDoc.data()?.name, phone: patientDoc.data()?.phone };
        } catch {}
      }
      if (data.nurseId) {
        try {
          const nurseDoc = await adminDb.collection('users').doc(data.nurseId).get();
          if (nurseDoc.exists) data.nurse = { id: nurseDoc.id, name: nurseDoc.data()?.name };
        } catch {}
      }
      emergencies.push(data);
    }

    return NextResponse.json(emergencies);
  } catch (error) {
    console.error('Emergencies list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب الحالات الطارئة' }, { status: 500 });
  }
}

// POST: Add new emergency
export async function POST(request: NextRequest) {
  try {
    const auth = extractAuthFromRequest(request);
    const clinicId = auth?.clinicId || null;
    const body = await request.json();
    const { patientId, nurseId, severity, notes, actions, procedures } = body;

    if (!patientId) {
      return NextResponse.json({ error: 'يرجى تحديد المريض' }, { status: 400 });
    }

    let patientName = '';
    if (patientId) {
      const patientDoc = await adminDb.collection('patients').doc(patientId).get();
      if (patientDoc.exists) patientName = patientDoc.data()?.name || '';
    }

    let nurseName = '';
    if (nurseId) {
      const nurseDoc = await adminDb.collection('users').doc(nurseId).get();
      if (nurseDoc.exists) nurseName = nurseDoc.data()?.name || '';
    }

    const emergencyData = {
      patientId, patientName, nurseId: nurseId || '', nurseName,
      severity: severity || 'moderate', status: 'active',
      notes: notes || '', actions: actions || '', procedures: procedures || '',
      arrivalTime: new Date().toISOString(), clinicId,
      createdAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('emergencies').add(emergencyData);

    return NextResponse.json({ id: docRef.id, ...emergencyData }, { status: 201 });
  } catch (error) {
    console.error('Create emergency error:', error);
    return NextResponse.json({ error: 'خطأ في إضافة الحالة الطارئة' }, { status: 500 });
  }
}
