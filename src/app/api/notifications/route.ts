import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';

// GET: List notifications (filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!effectiveClinicId) {
      return NextResponse.json([]);
    }

    let snapshot;
    try {
      let q = adminDb.collection('notifications').where('clinicId', '==', effectiveClinicId);
      if (userId) q = q.where('userId', '==', userId);
      snapshot = await q.orderBy('createdAt', 'desc').get();
    } catch {
      let q = adminDb.collection('notifications').where('clinicId', '==', effectiveClinicId);
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
