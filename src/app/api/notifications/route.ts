import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest } from '@/lib/auth';

// GET: List notifications (filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    const auth = extractAuthFromRequest(request);
    const clinicId = auth?.clinicId || null;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let snapshot;
    try {
      let q = adminDb.collection('notifications');
      if (clinicId) q = q.where('clinicId', '==', clinicId);
      if (userId) q = q.where('userId', '==', userId);
      snapshot = await q.orderBy('createdAt', 'desc').get();
    } catch {
      let q = adminDb.collection('notifications');
      if (clinicId) q = q.where('clinicId', '==', clinicId);
      if (userId) q = q.where('userId', '==', userId);
      snapshot = await q.get();
    }

    const notifications = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Notifications list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب الإشعارات' }, { status: 500 });
  }
}
