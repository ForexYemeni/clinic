// ═══════════════════════════════════════════════════════════
// 🔔 Subscription Expiry Check API
// Triggers notification checks for expiring subscriptions
// Called periodically or on dashboard load
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { checkSubscriptionExpiry } from '@/lib/notifications';

// POST: Trigger subscription expiry check
export async function POST(request: NextRequest) {
  try {
    await checkSubscriptionExpiry();
    return NextResponse.json({ success: true, message: 'تم فحص انتهاء الاشتراكات' });
  } catch (error) {
    console.error('Expiry check error:', error);
    return NextResponse.json({ error: 'خطأ في فحص الاشتراكات' }, { status: 500 });
  }
}
