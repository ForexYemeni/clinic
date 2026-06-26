// ═══════════════════════════════════════════════════════════
// 🏗️ Platform Configuration API
// Manages global platform settings and Firebase config
// ═══════════════════════════════════════════════════════════

import dbConnect from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest } from '@/lib/auth';
import { getPlatformConfig, setPlatformConfig } from '@/lib/multi-tenant';

// GET: Get platform config
// - super_admin: gets everything
// - other roles: only gets public info (supportPhone, supportWhatsApp)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const auth = extractAuthFromRequest(request);
    const config = await getPlatformConfig();

    if (!config) {
      return NextResponse.json({
        superAdminCreated: false,
        version: '2.0.0',
        supportPhone: '',
        supportWhatsApp: '',
      });
    }

    // Non-super-admin users only get public info (for subscription expired page)
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({
        supportPhone: config.supportPhone || '',
        supportWhatsApp: config.supportWhatsApp || '',
      });
    }

    // Super admin gets everything
    return NextResponse.json({
      superAdminCreated: config.superAdminCreated,
      version: config.version,
      hasPlatformConfig: !!config.platformConfig,
      defaultClinicId: config.defaultClinicId,
      supportPhone: config.supportPhone || '',
      supportWhatsApp: config.supportWhatsApp || '',
    });
  } catch (error) {
    console.error('Platform config error:', error);
    return NextResponse.json({ error: 'خطأ في جلب إعدادات المنصة' }, { status: 500 });
  }
}

// PUT: Update platform config (super admin only)
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const auth = extractAuthFromRequest(request);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json();
    const { platformConfig, defaultClinicId, supportPhone, supportWhatsApp } = body;

    const updates: Record<string, unknown> = {};
    if (platformConfig) updates.platformConfig = platformConfig;
    if (defaultClinicId) updates.defaultClinicId = defaultClinicId;
    if (supportPhone !== undefined) updates.supportPhone = supportPhone;
    if (supportWhatsApp !== undefined) updates.supportWhatsApp = supportWhatsApp;

    await setPlatformConfig(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update platform error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث إعدادات المنصة' }, { status: 500 });
  }
}
