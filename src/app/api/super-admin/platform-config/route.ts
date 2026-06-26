// ═══════════════════════════════════════════════════════════
// ⚙️ Super Admin - Platform Configuration API (Prisma)
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest } from '@/lib/auth';
import { getPlatformConfig, setPlatformConfig, createAuditLog } from '@/lib/multi-tenant';

// GET: Get current platform configuration
export async function GET(request: NextRequest) {
  try {
    const auth = extractAuthFromRequest(request);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const config = await getPlatformConfig();
    if (!config) {
      return NextResponse.json({ configured: false, message: 'لم يتم تكوين المنصة بعد' });
    }

    const safeConfig: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(config)) {
      if (key === 'jwtSecret' && typeof value === 'string' && value.length > 10) {
        safeConfig[key] = value.substring(0, 10) + '...[مخفي]';
      } else {
        safeConfig[key] = value;
      }
    }

    return NextResponse.json({ configured: true, config: safeConfig });
  } catch (error) {
    console.error('Get platform config error:', error);
    return NextResponse.json({ error: 'خطأ في جلب إعدادات المنصة' }, { status: 500 });
  }
}

// PUT: Update platform configuration
export async function PUT(request: NextRequest) {
  try {
    const auth = extractAuthFromRequest(request);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json();
    const { supportPhone, supportWhatsApp, version, defaultClinicId, platformConfig: customConfig } = body;

    const updateData: any = {};
    if (supportPhone !== undefined) updateData.supportPhone = supportPhone;
    if (supportWhatsApp !== undefined) updateData.supportWhatsApp = supportWhatsApp;
    if (version !== undefined) updateData.version = version;
    if (defaultClinicId !== undefined) updateData.defaultClinicId = defaultClinicId;
    if (customConfig !== undefined) updateData.platformConfig = customConfig;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'يرجى تقديم بيانات الإعداد' }, { status: 400 });
    }

    await setPlatformConfig(updateData);

    try {
      await createAuditLog({
        clinicId: null,
        userId: auth.userId,
        action: 'update_platform_config',
        details: 'Platform configuration updated',
      });
    } catch {}

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update platform config error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث إعدادات المنصة' }, { status: 500 });
  }
}
