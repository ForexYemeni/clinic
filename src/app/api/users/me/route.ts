// ═══════════════════════════════════════════════════════════
// 🔑 Current User API (Prisma + PostgreSQL)
// Allows authenticated users to change their own password
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
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

    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    const passwordValid = await verifyPassword(currentPassword, user.password);
    if (!passwordValid) {
      return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 });
    }

    const hashedNew = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: auth.userId },
      data: { password: hashedNew },
    });

    try {
      await createAuditLog({
        clinicId: auth.clinicId,
        userId: auth.userId,
        action: 'password_changed',
        details: 'User changed their own password',
        severity: 'info',
      });
    } catch {}

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'خطأ في تغيير كلمة المرور' }, { status: 500 });
  }
}
