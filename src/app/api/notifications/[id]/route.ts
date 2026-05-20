// ═══════════════════════════════════════════════════════════
// 🔔 Single Notification API
// ═══════════════════════════════════════════════════════════

import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

// PUT: Update single notification (mark as read/unread)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const notifDoc = await adminDb.collection('notifications').doc(id).get();
    if (!notifDoc.exists) {
      return NextResponse.json({ error: 'الإشعار غير موجود' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.read !== undefined) updateData.read = body.read;

    await adminDb.collection('notifications').doc(id).update(updateData);

    return NextResponse.json({ id, ...updateData });
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث الإشعار' }, { status: 500 });
  }
}

// DELETE: Delete single notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const notifDoc = await adminDb.collection('notifications').doc(id).get();
    if (!notifDoc.exists) {
      return NextResponse.json({ error: 'الإشعار غير موجود' }, { status: 404 });
    }

    await adminDb.collection('notifications').doc(id).delete();
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json({ error: 'خطأ في حذف الإشعار' }, { status: 500 });
  }
}
