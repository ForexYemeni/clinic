// ═══════════════════════════════════════════════════════════
// 👤 Patients API (Prisma + PostgreSQL)
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';

// GET: List all patients (with search by name, filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    if (!effectiveClinicId) {
      return NextResponse.json([]);
    }

    const where: any = { clinicId: effectiveClinicId };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const patients = await prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error('Patients list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب المرضى' }, { status: 500 });
  }
}

// POST: Add new patient
export async function POST(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const body = await request.json();
    const {
      name, age, ageCategory, gender, phone, emergencyPhone,
      address, bloodType, chronicDiseases, allergies,
      medicalHistory, notes, complaints,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'يرجى إدخال اسم المريض' }, { status: 400 });
    }
    if (!effectiveClinicId) {
      return NextResponse.json({ error: 'لم يتم تحديد العيادة' }, { status: 400 });
    }

    const created = await prisma.patient.create({
      data: {
        name,
        age: age ? Number(age) : null,
        ageCategory: ageCategory || 'adult',
        gender: gender || '',
        phone: phone || '',
        emergencyPhone: emergencyPhone || '',
        address: address || '',
        bloodType: bloodType || '',
        chronicDiseases: chronicDiseases || '',
        allergies: allergies || '',
        medicalHistory: medicalHistory || '',
        notes: notes || '',
        complaints: complaints || [],
        clinicId: effectiveClinicId,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Create patient error:', error);
    return NextResponse.json({ error: 'خطأ في إضافة المريض' }, { status: 500 });
  }
}
