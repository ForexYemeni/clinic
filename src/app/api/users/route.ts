// ═══════════════════════════════════════════════════════════
// 👥 Users (Nurses) API (Prisma + PostgreSQL)
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId, hashPassword } from '@/lib/auth';

// GET: List nurses (filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    if (!effectiveClinicId) return NextResponse.json([]);

    const users = await prisma.user.findMany({
      where: { role: 'nurse', clinicId: effectiveClinicId },
      orderBy: { createdAt: 'desc' },
    });

    const nurses = users.map((u) => ({
      id: u.id,
      name: u.name || '',
      phone: u.phone || '',
      role: u.role,
      active: u.active !== false,
      clinicId: u.clinicId || null,
      salary: u.salary || 0,
      createdAt: u.createdAt ? u.createdAt.toISOString() : '',
    }));

    return NextResponse.json(nurses);
  } catch (error) {
    console.error('Nurses list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب الممرضين' }, { status: 500 });
  }
}

// POST: Add nurse (hashed password, linked to clinicId)
export async function POST(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const body = await request.json();
    const { name, phone, password, salary } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'يرجى إدخال اسم الممرض ورقم الهاتف' }, { status: 400 });
    }
    const phoneRegex = /^\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: 'رقم الهاتف يجب أن يكون 9 أرقام' }, { status: 400 });
    }
    if (!effectiveClinicId) {
      return NextResponse.json({ error: 'لم يتم تحديد العيادة' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json({ error: 'رقم الهاتف مستخدم بالفعل' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password || '1234');

    const created = await prisma.user.create({
      data: {
        name,
        phone,
        password: hashedPassword,
        role: 'nurse',
        clinicId: effectiveClinicId,
        active: true,
        salary: Number(salary) || 0,
      },
    });

    return NextResponse.json({
      id: created.id,
      name: created.name,
      phone: created.phone,
      role: created.role,
      active: created.active,
      clinicId: created.clinicId,
      salary: created.salary,
      createdAt: created.createdAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Create nurse error:', error);
    return NextResponse.json({ error: 'خطأ في إضافة الممرض' }, { status: 500 });
  }
}
