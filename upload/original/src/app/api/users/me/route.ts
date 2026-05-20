// ═══════════════════════════════════════════════════════════
// 🔑 Current User API - Password Change
// Allows authenticated users to change their own password
// ═══════════════════════════════════════════════════════════

import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest, verifyPassword, hashPassword } from '@/lib/auth';
import { createAuditLog } from '@/lib/multi-tenant';

// PUT: Change current user's password
export async function PUT(request: NextRequest) {
  try {
    const auth = extractAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'يرجى تسجيل الدخول' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'يرجى إدخال كلمة المرور الحالية والجديدة' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' }, { status: 400 });
    }

    // Get current user
    const userDoc = await adminDb.collection('users').doc(auth.userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    const userData = userDoc.data();

    // Verify current password
    const passwordValid = await verifyPassword(currentPassword, userData.password);
    if (!passwordValid) {
      await createAuditLog({
        clinicId: auth.clinicId || null,
        userId: auth.userId,
        action: 'password_change_failed',
        details: 'Invalid current password',
        severity: 'warning',
      });
      return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 401 });
    }

    // Hash and save new password
    const hashedPassword = await hashPassword(newPassword);
    await adminDb.collection('users').doc(auth.userId).update({ password: hashedPassword });

    await createAuditLog({
      clinicId: auth.clinicId || null,
      userId: auth.userId,
      action: 'password_change',
      details: `User ${userData.name} changed their password`,
      severity: 'info',
    });

    return NextResponse.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'خطأ في تغيير كلمة المرور' }, { status: 500 });
  }
}
