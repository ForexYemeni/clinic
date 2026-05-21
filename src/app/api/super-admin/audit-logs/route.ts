// ═══════════════════════════════════════════════════════════
// 📋 Super Admin - Audit Logs API
// Read-only access to all audit log entries
// ═══════════════════════════════════════════════════════════

import dbConnect from '@/lib/mongodb';
import AuditLog from '@/models/AuditLog';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest } from '@/lib/auth';
import { toClientList } from '@/lib/mongoose-helpers';

// GET: List all audit logs (super admin only)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const auth = extractAuthFromRequest(request);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const severity = searchParams.get('severity');

    let query: Record<string, unknown> = {};

    if (severity && ['info', 'warning', 'critical'].includes(severity)) {
      query.severity = severity;
    }

    // Fetch with ordering (MongoDB supports sorting natively)
    let logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    // Convert to client format
    const result = toClientList(logs);

    // Sort client-side as backup
    result.sort((a: any, b: any) => {
      const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tB - tA;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Audit logs error:', error);
    return NextResponse.json({ error: 'خطأ في جلب سجلات المراجعة' }, { status: 500 });
  }
}
