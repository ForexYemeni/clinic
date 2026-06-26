// ═══════════════════════════════════════════════════════════
// 🔧 Super Admin - Database Configuration API
// Platform configuration management (formerly Firebase config)
// ═══════════════════════════════════════════════════════════

import connectMongoDB from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest } from '@/lib/auth';
import { getPlatformConfig, setPlatformConfig, createAuditLog } from '@/lib/multi-tenant';

// GET: Get current database configuration
export async function GET(request: NextRequest) {
  try {
    const auth = extractAuthFromRequest(request);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    await connectMongoDB();

    const config = await getPlatformConfig();
    if (!config?.firebaseConfig) {
      return NextResponse.json({
        configured: false,
        message: 'لم يتم تكوين Firebase بعد',
      });
    }

    // Don't expose the private key fully
    const safeConfig = { ...config.firebaseConfig };
    if (safeConfig.privateKey) {
      safeConfig.privateKey = safeConfig.privateKey.substring(0, 30) + '...[مخفي]';
    }

    return NextResponse.json({
      configured: true,
      config: safeConfig,
    });
  } catch (error) {
    console.error('Get database config error:', error);
    return NextResponse.json({ error: 'خطأ في جلب إعدادات Firebase' }, { status: 500 });
  }
}

// PUT: Update database configuration
export async function PUT(request: NextRequest) {
  try {
    const auth = extractAuthFromRequest(request);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    await connectMongoDB();

    const body = await request.json();
    const { projectId, clientEmail, privateKey, apiKey, authDomain, storageBucket, messagingSenderId, appId } = body;

    if (!projectId || !clientEmail || !privateKey) {
      return NextResponse.json({ error: 'يرجى تقديم بيانات Firebase الكاملة' }, { status: 400 });
    }

    // Format private key if needed
    let formattedKey = privateKey;
    if (!formattedKey.includes('-----BEGIN PRIVATE KEY-----')) {
      formattedKey = `-----BEGIN PRIVATE KEY-----\n${formattedKey}\n-----END PRIVATE KEY-----\n`;
    }

    const firebaseConfig = {
      projectId,
      clientEmail,
      privateKey: formattedKey,
      apiKey: apiKey || '',
      authDomain: authDomain || `${projectId}.firebaseapp.com`,
      storageBucket: storageBucket || `${projectId}.appspot.com`,
      messagingSenderId: messagingSenderId || '',
      appId: appId || '',
    };

    // Save to platform config
    await setPlatformConfig({ firebaseConfig });

    await createAuditLog({
      clinicId: null,
      userId: auth.userId,
      action: 'update_firebase_config',
      details: `Updated Firebase config for project: ${projectId}`,
      severity: 'warning',
    });

    return NextResponse.json({
      success: true,
      message: 'تم تحديث إعدادات Firebase بنجاح',
      projectId,
    });
  } catch (error) {
    console.error('Update database config error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث إعدادات Firebase' }, { status: 500 });
  }
}
