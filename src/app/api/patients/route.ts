import dbConnect from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';
import Patient from '@/models/Patient';
import { toClientList } from '@/lib/mongoose-helpers';

// GET: List all patients (with search by name, filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    if (!effectiveClinicId) {
      return NextResponse.json([]);
    }

    let results;
    try {
      results = await Patient.find({ clinicId: effectiveClinicId })
        .sort({ createdAt: -1 })
        .lean();
    } catch {
      results = await Patient.find({ clinicId: effectiveClinicId }).lean();
    }

    let patients = toClientList(results);

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
    await dbConnect();
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
    };

    const created = await Patient.create(patientData);

    return NextResponse.json({ id: created._id.toString(), ...toClient(created.toObject()) }, { status: 201 });
  } catch (error) {
    console.error('Create patient error:', error);
    return NextResponse.json({ error: 'خطأ في إضافة المريض' }, { status: 500 });
  }
}
