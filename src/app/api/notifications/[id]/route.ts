import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';

// PUT: Update notification (mark as read)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { id } = await params;
    const body = await request.json();

    // Check if notification exists
    const notifDoc = await Notification.findById(id).lean();
    if (!notifDoc) {
      return NextResponse.json(
        { error: 'الإشعار غير موجود' },
        { status: 404 }
      );
    }

    // Verify clinic ownership (strict)
    const notifClinicId = notifDoc.clinicId;
    if (!effectiveClinicId || (notifClinicId && notifClinicId !== effectiveClinicId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.read !== undefined) updateData.read = body.read;

    await Notification.findByIdAndUpdate(id, { $set: updateData });

    return NextResponse.json({ id, ...updateData });
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json(
      { error: 'خطأ في تحديث الإشعار' },
      { status: 500 }
    );
  }
}
