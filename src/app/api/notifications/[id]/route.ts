import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

// PUT: Update notification (mark as read)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if notification exists
    const notifDoc = await adminDb.collection('notifications').doc(id).get();
    if (!notifDoc.exists) {
      return NextResponse.json(
        { error: 'الإشعار غير موجود' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (body.read !== undefined) updateData.read = body.read;

    await adminDb.collection('notifications').doc(id).update(updateData);

    return NextResponse.json({ id, ...updateData });
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json(
      { error: 'خطأ في تحديث الإشعار' },
      { status: 500 }
    );
  }
}
