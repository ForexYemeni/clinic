import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

// GET: List all active services (status != 'deleted')
export async function GET() {
  try {
    const snapshot = await adminDb
      .collection('services')
      .orderBy('category')
      .get();

    const services = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((service: any) => service.status !== 'deleted');

    return NextResponse.json(services);
  } catch (error) {
    console.error('Services list error:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب الخدمات' },
      { status: 500 }
    );
  }
}

// POST: Add new service (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nameAr, price, duration, category, description } = body;

    if (!nameAr || price === undefined) {
      return NextResponse.json(
        { error: 'يرجى إدخال اسم الخدمة والسعر' },
        { status: 400 }
      );
    }

    const serviceData = {
      nameAr,
      price: Number(price),
      duration: duration || 15,
      category: category || 'أخرى',
      description: description || '',
      active: true,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('services').add(serviceData);

    return NextResponse.json(
      { id: docRef.id, ...serviceData },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create service error:', error);
    return NextResponse.json(
      { error: 'خطأ في إضافة الخدمة' },
      { status: 500 }
    );
  }
}
