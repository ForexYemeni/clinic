// ═══════════════════════════════════════════════════════════
// 🔔 Notifications API - Full CRUD
// List, create, mark-read, mark-all-read, unread count
// ═══════════════════════════════════════════════════════════

import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { toClient } from '@/lib/mongoose-helpers';
import { NextRequest, NextResponse } from 'next/server';

// GET: List notifications with filters and unread count
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const clinicId = searchParams.get('clinicId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const countOnly = searchParams.get('count') === 'true';

    const filter: Record<string, unknown> = {};
    if (userId) filter.userId = userId;
    if (clinicId) filter.clinicId = clinicId;
    if (unreadOnly) filter.read = false;

    const notifications = await Notification
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const result = notifications.map((doc) => toClient(doc));

    // If only count requested
    if (countOnly) {
      const unreadCount = result.filter((n: any) => !n.read).length;
      return NextResponse.json({ count: unreadCount, total: result.length });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Notifications list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب الإشعارات' }, { status: 500 });
  }
}

// POST: Create a new notification
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { userId, clinicId, type, title, message, priority, actionUrl, relatedId } = body;

    if (!userId || !title || !message) {
      return NextResponse.json({ error: 'يرجى تحديد المستخدم والعنوان والرسالة' }, { status: 400 });
    }

    const notifData = {
      userId,
      clinicId: clinicId || '',
      type: type || 'system',
      title,
      message,
      read: false,
      priority: priority || 'normal',
      actionUrl: actionUrl || '',
      relatedId: relatedId || '',
      createdAt: new Date(),
    };

    const doc = await Notification.create(notifData);

    return NextResponse.json(toClient(doc.toObject()), { status: 201 });
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json({ error: 'خطأ في إنشاء الإشعار' }, { status: 500 });
  }
}

// PUT: Mark notifications as read (single or all)
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { id, markAll, userId } = body;

    if (markAll && userId) {
      // Mark all as read for a user
      const result = await Notification.updateMany(
        { userId, read: false },
        { read: true }
      );

      return NextResponse.json({ success: true, markedCount: result.modifiedCount });
    }

    if (id) {
      // Mark single notification as read
      await Notification.findByIdAndUpdate(id, { read: true });
      return NextResponse.json({ success: true, id });
    }

    return NextResponse.json({ error: 'يرجى تحديد الإشعار أو المستخدم' }, { status: 400 });
  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث الإشعار' }, { status: 500 });
  }
}

// DELETE: Delete a notification
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'يرجى تحديد الإشعار' }, { status: 400 });
    }

    await Notification.findByIdAndDelete(id);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json({ error: 'خطأ في حذف الإشعار' }, { status: 500 });
  }
}
