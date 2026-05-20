// ═══════════════════════════════════════════════════════════
// 🔔 Notifications API - Full CRUD
// List, create, mark-read, mark-all-read, unread count
// ═══════════════════════════════════════════════════════════

import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

// GET: List notifications with filters and unread count
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const clinicId = searchParams.get('clinicId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const countOnly = searchParams.get('count') === 'true';

    let query = adminDb.collection('notifications');

    if (userId) {
      query = query.where('userId', '==', userId);
    }
    if (clinicId) {
      query = query.where('clinicId', '==', clinicId);
    }
    if (unreadOnly) {
      query = query.where('read', '==', false);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').limit(100).get();

    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // If only count requested
    if (countOnly) {
      const unreadCount = notifications.filter((n: any) => !n.read).length;
      return NextResponse.json({ count: unreadCount, total: notifications.length });
    }

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Notifications list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب الإشعارات' }, { status: 500 });
  }
}

// POST: Create a new notification
export async function POST(request: NextRequest) {
  try {
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
      createdAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('notifications').add(notifData);

    return NextResponse.json({ id: docRef.id, ...notifData }, { status: 201 });
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json({ error: 'خطأ في إنشاء الإشعار' }, { status: 500 });
  }
}

// PUT: Mark notifications as read (single or all)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, markAll, userId } = body;

    if (markAll && userId) {
      // Mark all as read for a user
      const snapshot = await adminDb
        .collection('notifications')
        .where('userId', '==', userId)
        .where('read', '==', false)
        .get();

      const batch = adminDb.batch();
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });
      await batch.commit();

      return NextResponse.json({ success: true, markedCount: snapshot.size });
    }

    if (id) {
      // Mark single notification as read
      await adminDb.collection('notifications').doc(id).update({ read: true });
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'يرجى تحديد الإشعار' }, { status: 400 });
    }

    await adminDb.collection('notifications').doc(id).delete();
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json({ error: 'خطأ في حذف الإشعار' }, { status: 500 });
  }
}
