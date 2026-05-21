// ═══════════════════════════════════════════════════════════
// 📋 Super Admin - Audit Logs API
// Read-only access to all audit log entries
// ═══════════════════════════════════════════════════════════

import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest } from '@/lib/auth';

// GET: List all audit logs (super admin only)
export async function GET(request: NextRequest) {
  try {
    const auth = extractAuthFromRequest(request);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const severity = searchParams.get('severity');

    let query = adminDb.collection('audit_logs') as FirebaseFirestore.Query;

    if (severity && ['info', 'warning', 'critical'].includes(severity)) {
      query = query.where('severity', '==', severity);
    }

    // Try with ordering first
    let snapshot: FirebaseFirestore.QuerySnapshot;
    try {
      snapshot = await query.orderBy('timestamp', 'desc').limit(limit).get();
    } catch {
      // Fallback without ordering (needs composite index)
      snapshot = await query.limit(limit).get();
    }

    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort client-side if ordering failed
    logs.sort((a: any, b: any) => {
      const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tB - tA;
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Audit logs error:', error);
    return NextResponse.json({ error: 'خطأ في جلب سجلات المراجعة' }, { status: 500 });
  }
}
