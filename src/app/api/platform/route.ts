// ═══════════════════════════════════════════════════════════
// 🏗️ Platform Configuration API (Prisma + PostgreSQL)
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest } from '@/lib/auth';
import { getPlatformConfig, setPlatformConfig } from '@/lib/multi-tenant';

// GET: Get platform config
export async function GET(request: NextRequest) {
  try {
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

    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({
        supportPhone: config.supportPhone || '',
        supportWhatsApp: config.supportWhatsApp || '',
      });
    }

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
    const auth = extractAuthFromRequest(request);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json();
    const { supportPhone, supportWhatsApp, defaultClinicId } = body;

    const updateData: any = {};
    if (supportPhone !== undefined) updateData.supportPhone = supportPhone;
    if (supportWhatsApp !== undefined) updateData.supportWhatsApp = supportWhatsApp;
    if (defaultClinicId !== undefined) updateData.defaultClinicId = defaultClinicId;

    await setPlatformConfig(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update platform config error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث إعدادات المنصة' }, { status: 500 });
  }
}
