// ═══════════════════════════════════════════════════════════
// 🔔 Single Notification API
// ═══════════════════════════════════════════════════════════

import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { NextRequest, NextResponse } from 'next/server';

// PUT: Update single notification (mark as read/unread)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;
    const body = await request.json();

    const notifDoc = await Notification.findById(id).lean();
    if (!notifDoc) {
      return NextResponse.json({ error: 'الإشعار غير موجود' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.read !== undefined) updateData.read = body.read;

    await Notification.findByIdAndUpdate(id, updateData);

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
    await dbConnect();

    const { id } = await params;

    const notifDoc = await Notification.findById(id).lean();
    if (!notifDoc) {
      return NextResponse.json({ error: 'الإشعار غير موجود' }, { status: 404 });
    }

    await Notification.findByIdAndDelete(id);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json({ error: 'خطأ في حذف الإشعار' }, { status: 500 });
  }
}
