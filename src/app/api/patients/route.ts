import dbConnect from '@/lib/mongodb';
import Patient from '@/models/Patient';
import { toClient } from '@/lib/mongoose-helpers';
import { notifyClinicUsers } from '@/lib/notifications';
import { NextRequest, NextResponse } from 'next/server';

// GET: List all patients (with search by name, filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const clinicId = searchParams.get('clinicId') || '';

    let query = Patient.find();
    if (clinicId) query = query.where('clinicId', clinicId);
    if (search) query = query.where('name').regex(new RegExp(search, 'i'));
    query = query.sort({ createdAt: -1 });

    const patients = await query.lean();
    const result = patients.map((doc) => toClient(doc));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Patients list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب المرضى' }, { status: 500 });
  }
}

// POST: Add new patient
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { name, age, gender, phone, emergencyPhone, address, bloodType, chronicDiseases, allergies, medicalHistory, notes, clinicId } = body;

    if (!name) {
      return NextResponse.json({ error: 'يرجى إدخال اسم المريض' }, { status: 400 });
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
      clinicId: clinicId || '',
      createdAt: new Date(),
    };

    const doc = await Patient.create(patientData);
    const result = toClient(doc.toObject());

    // Send notification to clinic users about new patient
    const cid = clinicId || '';
    const createdBy = body.createdBy || '';
    if (cid) {
      try {
        await notifyClinicUsers({
          clinicId: cid,
          excludeUserId: createdBy,
          type: 'patient',
          title: 'مريض جديد',
          message: `تم تسجيل المريض ${name} بنجاح`,
          priority: 'normal',
          relatedId: doc._id.toString(),
        });
      } catch (notifError) {
        console.error('Failed to send patient notification:', notifError);
      }
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Create patient error:', error);
    return NextResponse.json({ error: 'خطأ في إضافة المريض' }, { status: 500 });
  }
}
