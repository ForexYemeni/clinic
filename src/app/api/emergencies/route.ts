import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Patient from '@/models/Patient';
import Emergency from '@/models/Emergency';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';
import { toClient } from '@/lib/mongoose-helpers';

// GET: List emergencies (?status=active, filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    if (!effectiveClinicId) {
      return NextResponse.json([]);
    }

    let results: any[];

    try {
      const filter: Record<string, unknown> = { clinicId: effectiveClinicId };
      if (status) filter.status = status;
      results = await Emergency.find(filter).sort({ createdAt: -1 }).lean();
    } catch {
      try {
        const filter: Record<string, unknown> = { clinicId: effectiveClinicId };
        if (status) filter.status = status;
        results = await Emergency.find(filter).lean();
        // Sort in memory as fallback
        results.sort((a, b) => {
          const da = a.createdAt || '';
          const db = b.createdAt || '';
          return new Date(db).getTime() - new Date(da).getTime();
        });
      } catch {
        // Last resort - fetch with clinicId filter only and filter status client-side
        results = await Emergency.find({ clinicId: effectiveClinicId }).lean();
        if (status) {
          results = results.filter(doc => doc.status === status);
        }
      }
    }

    const emergencies = [];
    for (const doc of results) {
      const data = toClient(doc) as any;
      if (data.patientId) {
        try {
          const patientDoc = await Patient.findById(data.patientId).lean();
          if (patientDoc) data.patient = { id: patientDoc._id.toString(), name: patientDoc.name, phone: patientDoc.phone };
        } catch {}
      }
      if (data.nurseId) {
        try {
          const nurseDoc = await User.findById(data.nurseId).lean();
          if (nurseDoc) data.nurse = { id: nurseDoc._id.toString(), name: nurseDoc.name };
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
    await dbConnect();
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const body = await request.json();
    const { patientId, nurseId, severity, notes, actions, procedures } = body;

    if (!patientId) {
      return NextResponse.json({ error: 'يرجى تحديد المريض' }, { status: 400 });
    }

    if (!effectiveClinicId) {
      return NextResponse.json({ error: 'لم يتم تحديد العيادة' }, { status: 400 });
    }

    let patientName = '';
    if (patientId) {
      const patientDoc = await Patient.findById(patientId).lean();
      if (patientDoc) patientName = patientDoc.name || '';
    }

    let nurseName = '';
    if (nurseId) {
      const nurseDoc = await User.findById(nurseId).lean();
      if (nurseDoc) nurseName = nurseDoc.name || '';
    }

    const emergencyData = {
      patientId, patientName, nurseId: nurseId || '', nurseName,
      severity: severity || 'moderate', status: 'active',
      notes: notes || '', actions: actions || '', procedures: procedures || '',
      arrivalTime: new Date(), clinicId: effectiveClinicId,
    };

    const created = await Emergency.create(emergencyData);
    const clientResult = toClient(created.toObject());

    return NextResponse.json({ ...clientResult }, { status: 201 });
  } catch (error) {
    console.error('Create emergency error:', error);
    return NextResponse.json({ error: 'خطأ في إضافة الحالة الطارئة' }, { status: 500 });
  }
}
