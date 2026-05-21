import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Emergency from '@/models/Emergency';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';

// PUT: Update emergency (change status, add actions/procedures)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { id } = await params;
    const body = await request.json();

    // Check if emergency exists
    const emergencyDoc = await Emergency.findById(id).lean();
    if (!emergencyDoc) {
      return NextResponse.json(
        { error: 'الحالة الطارئة غير موجودة' },
        { status: 404 }
      );
    }

    // Verify clinic ownership (strict)
    const emergencyClinicId = emergencyDoc.clinicId;
    if (!effectiveClinicId || (emergencyClinicId && emergencyClinicId !== effectiveClinicId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.severity !== undefined) updateData.severity = body.severity;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.actions !== undefined) updateData.actions = body.actions;
    if (body.procedures !== undefined) updateData.procedures = body.procedures;
    if (body.nurseId !== undefined) updateData.nurseId = body.nurseId;

    // If nurseId is being updated, fetch nurse name
    if (body.nurseId) {
      const nurseDoc = await User.findById(body.nurseId).lean();
      if (nurseDoc) {
        updateData.nurseName = nurseDoc.name || '';
      }
    }

    await Emergency.findByIdAndUpdate(id, { $set: updateData });

    return NextResponse.json({ id, ...updateData });
  } catch (error) {
    console.error('Update emergency error:', error);
    return NextResponse.json(
      { error: 'خطأ في تحديث الحالة الطارئة' },
      { status: 500 }
    );
  }
}
