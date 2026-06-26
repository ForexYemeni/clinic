// ═══════════════════════════════════════════════════════════
// 💊 Services Reseed API (Prisma + PostgreSQL)
// Adds missing default services for a clinic
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_SERVICES } from '@/lib/services-data';
import { extractAuthAndClinicId } from '@/lib/auth';

// POST: Re-seed missing services
export async function POST(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    if (!effectiveClinicId) {
      return NextResponse.json({ error: 'لم يتم تحديد العيادة' }, { status: 400 });
    }

    const existing = await prisma.service.findMany({
      where: { clinicId: effectiveClinicId },
      select: { nameAr: true },
    });
    const existingNames = new Set(existing.map((s) => s.nameAr).filter(Boolean));

    const missing = DEFAULT_SERVICES.filter((s) => !existingNames.has(s.nameAr));

    if (missing.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'جميع الخدمات موجودة بالفعل',
        added: 0,
        total: existing.length,
      });
    }

    await prisma.service.createMany({
      data: missing.map((s) => ({
        nameAr: s.nameAr,
        price: s.price,
        duration: s.duration,
        category: s.category,
        description: s.description || '',
        icon: s.icon || '',
        color: s.color || '',
        active: true,
        status: 'active',
        clinicId: effectiveClinicId,
      })),
    });

    return NextResponse.json({
      success: true,
      message: `تمت إضافة ${missing.length} خدمة`,
      added: missing.length,
      total: existing.length + missing.length,
    });
  } catch (error) {
    console.error('Reseed services error:', error);
    return NextResponse.json({ error: 'خطأ في إعادة تحميل الخدمات' }, { status: 500 });
  }
}
