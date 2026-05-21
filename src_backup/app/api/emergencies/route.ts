import dbConnect from '@/lib/mongodb';
import Emergency from '@/models/Emergency';
import Patient from '@/models/Patient';
import User from '@/models/User';
import { toClient } from '@/lib/mongoose-helpers';
import { notifyClinicUsers } from '@/lib/notifications';
import { NextRequest, NextResponse } from 'next/server';

// GET: List emergencies (?status=active&clinicId=xxx)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clinicId = searchParams.get('clinicId');

    let query = Emergency.find();
    if (clinicId) query = query.where('clinicId', clinicId);
    if (status) query = query.where('status', status);
    const docs = await query.sort({ createdAt: -1 }).lean();

    const emergencies = [];
    for (const doc of docs) {
      const data = toClient(doc) as any;
      if (data.patientId) {
        try {
          const patientDoc = await Patient.findById(data.patientId).lean();
          if (patientDoc) {
            data.patient = { id: patientDoc._id.toString(), name: patientDoc.name, phone: patientDoc.phone };
          }
        } catch {}
      }
      if (data.nurseId) {
        try {
          const nurseDoc = await User.findById(data.nurseId).lean();
          if (nurseDoc) {
            data.nurse = { id: nurseDoc._id.toString(), name: nurseDoc.name };
          }
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

    const body = await request.json();
    const { patientId, nurseId, severity, notes, actions, procedures, clinicId } = body;

    if (!patientId) {
      return NextResponse.json({ error: 'يرجى تحديد المريض' }, { status: 400 });
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
      patientId,
      patientName,
      nurseId: nurseId || '',
      nurseName,
      severity: severity || 'moderate',
      status: 'active',
      notes: notes || '',
      actions: actions || '',
      procedures: procedures || '',
      arrivalTime: new Date(),
      clinicId: clinicId || '',
      createdAt: new Date(),
    };

    const doc = await Emergency.create(emergencyData);

    const cid = clinicId || '';
    if (cid) {
      try {
        const severityLabel = severity === 'critical' ? 'حرجة' : severity === 'severe' ? 'شديدة' : 'متوسطة';
        await notifyClinicUsers({
          clinicId: cid,
          excludeUserId: nurseId,
          type: 'emergency',
          title: 'حالة طوارئ جديدة',
          message: `حالة طوارئ ${severityLabel} - المريض: ${patientName}`,
          priority: severity === 'critical' ? 'urgent' : 'high',
          relatedId: doc._id.toString(),
        });
      } catch (notifError) {
        console.error('Failed to send emergency notification:', notifError);
      }
    }

    return NextResponse.json(toClient(doc.toObject()), { status: 201 });
  } catch (error) {
    console.error('Create emergency error:', error);
    return NextResponse.json({ error: 'خطأ في إضافة الحالة الطارئة' }, { status: 500 });
  }
}
