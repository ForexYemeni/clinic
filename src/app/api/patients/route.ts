import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { notifyClinicUsers } from '@/lib/notifications';

// GET: List all patients (with search by name)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const snapshot = await adminDb
      .collection('patients')
      .orderBy('createdAt', 'desc')
      .get();

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
    return NextResponse.json(
      { error: 'خطأ في جلب المرضى' },
      { status: 500 }
    );
  }
}

// POST: Add new patient
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, age, gender, phone, emergencyPhone, address, bloodType, chronicDiseases, allergies, medicalHistory, notes } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'يرجى إدخال اسم المريض' },
        { status: 400 }
      );
    }

    const patientData = {
      name,
      age: age || null,
      gender: gender || '',
      phone: phone || '',
      emergencyPhone: emergencyPhone || '',
      address: address || '',
      bloodType: bloodType || '',
      chronicDiseases: chronicDiseases || '',
      allergies: allergies || '',
      medicalHistory: medicalHistory || '',
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('patients').add(patientData);

    // Send notification to clinic users about new patient
    const clinicId = body.clinicId || '';
    const createdBy = body.createdBy || '';
    if (clinicId) {
      try {
        await notifyClinicUsers({
          clinicId,
          excludeUserId: createdBy,
          type: 'patient',
          title: 'مريض جديد',
          message: `تم تسجيل المريض ${name} بنجاح`,
          priority: 'normal',
          relatedId: docRef.id,
        });
      } catch (notifError) {
        console.error('Failed to send patient notification:', notifError);
      }
    }

    return NextResponse.json(
      { id: docRef.id, ...patientData },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create patient error:', error);
    return NextResponse.json(
      { error: 'خطأ في إضافة المريض' },
      { status: 500 }
    );
  }
}
