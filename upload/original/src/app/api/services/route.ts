import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';

// GET: List all active services (filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);

    if (!effectiveClinicId) {
      return NextResponse.json([]);
    }

    let snapshot;
    try {
      snapshot = await adminDb.collection('services').where('clinicId', '==', effectiveClinicId).get();
    } catch {
      snapshot = await adminDb.collection('services').where('clinicId', '==', effectiveClinicId).get();
    }

    const services = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((service: any) => service.status !== 'deleted')
      .sort((a: any, b: any) => {
        const catA = a.category || '';
        const catB = b.category || '';
        if (catA !== catB) return catA.localeCompare(catB, 'ar');
        return (a.nameAr || '').localeCompare(b.nameAr || '', 'ar');
      });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Services list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب الخدمات' }, { status: 500 });
  }
}

// POST: Add new service (admin only)
export async function POST(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const body = await request.json();
    const { nameAr, price, duration, category, description, icon, color } = body;

    if (!nameAr || price === undefined) {
      return NextResponse.json({ error: 'يرجى إدخال اسم الخدمة والسعر' }, { status: 400 });
    }

    if (!effectiveClinicId) {
      return NextResponse.json({ error: 'لم يتم تحديد العيادة' }, { status: 400 });
    }

    const serviceData = {
      nameAr,
      price: Number(price),
      duration: duration || 15,
      category: category || 'أخرى',
      description: description || '',
      icon: icon || '💊',
      color: color || 'emerald',
      active: true,
      status: 'active',
      clinicId: effectiveClinicId,
      createdAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('services').add(serviceData);

    return NextResponse.json({ id: docRef.id, ...serviceData }, { status: 201 });
  } catch (error) {
    console.error('Create service error:', error);
    return NextResponse.json({ error: 'خطأ في إضافة الخدمة' }, { status: 500 });
  }
}
