import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';

// GET: List all patients (with search by name, filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    if (!effectiveClinicId) {
      return NextResponse.json([]);
    }

    let snapshot;
    try {
      snapshot = await adminDb
        .collection('patients')
        .where('clinicId', '==', effectiveClinicId)
        .orderBy('createdAt', 'desc')
        .get();
    } catch {
      snapshot = await adminDb
        .collection('patients')
        .where('clinicId', '==', effectiveClinicId)
        .get();
    }

    let patients = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Filter by name if search query provided
    if (search) {
      const searchLower = search.toLowerCase();
      patients = patients.filter((patient: any) =>
        (patient.name || '').toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json(patients);
  } catch (error) {
    console.error('Patients list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب المرضى' }, { status: 500 });
  }
}

// POST: Add new patient
export async function POST(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const body = await request.json();
    const { name, age, ageCategory, gender, phone, emergencyPhone, address, bloodType, chronicDiseases, allergies, medicalHistory, notes, complaints } = body;

    if (!name) {
      return NextResponse.json({ error: 'يرجى إدخال اسم المريض' }, { status: 400 });
    }

    if (!effectiveClinicId) {
      return NextResponse.json({ error: 'لم يتم تحديد العيادة' }, { status: 400 });
    }

    const patientData = {
      name,
      age: age || null,
      ageCategory: ageCategory || 'adult',
      gender: gender || '',
      phone: phone || '',
      emergencyPhone: emergencyPhone || '',
      address: address || '',
      bloodType: bloodType || '',
      chronicDiseases: chronicDiseases || '',
      allergies: allergies || '',
      medicalHistory: medicalHistory || '',
      notes: notes || '',
      complaints: complaints || [],
      clinicId: effectiveClinicId,
      createdAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('patients').add(patientData);

    return NextResponse.json({ id: docRef.id, ...patientData }, { status: 201 });
  } catch (error) {
    console.error('Create patient error:', error);
    return NextResponse.json({ error: 'خطأ في إضافة المريض' }, { status: 500 });
  }
}
