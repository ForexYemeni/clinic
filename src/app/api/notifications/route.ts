import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

// GET: List notifications (?userId=xxx)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let snapshot;
    if (userId) {
      snapshot = await adminDb
        .collection('notifications')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
    } else {
      snapshot = await adminDb
        .collection('notifications')
        .orderBy('createdAt', 'desc')
        .get();
    }

    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Notifications list error:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب الإشعارات' },
      { status: 500 }
    );
  }
}
