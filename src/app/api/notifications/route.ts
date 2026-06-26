import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';
import { toClientList } from '@/lib/mongoose-helpers';

// GET: List notifications (filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!effectiveClinicId) {
      return NextResponse.json([]);
    }

    let results;
    try {
      const filter: Record<string, unknown> = { clinicId: effectiveClinicId };
      if (userId) filter.userId = userId;
      results = await Notification.find(filter).sort({ createdAt: -1 }).lean();
    } catch {
      const filter: Record<string, unknown> = { clinicId: effectiveClinicId };
      if (userId) filter.userId = userId;
      results = await Notification.find(filter).lean();
    }

    const notifications = toClientList(results);
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Notifications list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب الإشعارات' }, { status: 500 });
  }
}
