// ═══════════════════════════════════════════════════════════
// ⚙️ Super Admin - Platform Configuration API
// Manage platform-wide configuration settings (MongoDB-based)
// ═══════════════════════════════════════════════════════════

import dbConnect from '@/lib/mongodb';
import PlatformConfig from '@/models/PlatformConfig';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest } from '@/lib/auth';
import { getPlatformConfig, setPlatformConfig, createAuditLog } from '@/lib/multi-tenant';

// GET: Get current platform configuration
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const auth = extractAuthFromRequest(request);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const config = await getPlatformConfig();
    if (!config) {
      return NextResponse.json({
        configured: false,
        message: 'لم يتم تكوين المنصة بعد',
      });
    }

    // Build safe config - mask sensitive fields if any
    const safeConfig: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(config)) {
      if (key === 'jwtSecret' && typeof value === 'string' && value.length > 10) {
        safeConfig[key] = value.substring(0, 10) + '...[مخفي]';
      } else {
        safeConfig[key] = value;
      }
    }

    return NextResponse.json({
      configured: true,
      config: safeConfig,
    });
  } catch (error) {
    console.error('Get platform config error:', error);
    return NextResponse.json({ error: 'خطأ في جلب إعدادات المنصة' }, { status: 500 });
  }
}

// PUT: Update platform configuration
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const auth = extractAuthFromRequest(request);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json();
    const {
      supportPhone,
      supportWhatsApp,
      version,
      defaultClinicId,
      platformConfig: customConfig,
    } = body;

    // Build update object from provided fields
    const updateData: Record<string, unknown> = {};

    if (supportPhone !== undefined) updateData.supportPhone = supportPhone;
    if (supportWhatsApp !== undefined) updateData.supportWhatsApp = supportWhatsApp;
    if (version !== undefined) updateData.version = version;
    if (defaultClinicId !== undefined) updateData.defaultClinicId = defaultClinicId;
    if (customConfig !== undefined) updateData.platformConfig = customConfig;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'يرجى تقديم بيانات الإعداد' }, { status: 400 });
    }

    // Save to platform config
    await setPlatformConfig(updateData);

    await createAuditLog({
      clinicId: null,
      userId: auth.userId,
      action: 'update_platform_config',
      details: `Updated platform config: ${Object.keys(updateData).join(', ')}`,
      severity: 'warning',
    });

    return NextResponse.json({
      success: true,
      message: 'تم تحديث إعدادات المنصة بنجاح',
      updatedFields: Object.keys(updateData),
    });
  } catch (error) {
    console.error('Update platform config error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث إعدادات المنصة' }, { status: 500 });
  }
}
