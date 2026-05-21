import dbConnect from '@/lib/mongodb';
import Service from '@/models/Service';
import { toClient } from '@/lib/mongoose-helpers';
import { NextRequest, NextResponse } from 'next/server';

// GET: List all active services (status != 'deleted', filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId') || '';

    let query = Service.find({ status: { $ne: 'deleted' } });
    if (clinicId) query = query.where('clinicId', clinicId);

    const services = await query.lean();

    const result = services
      .map((doc) => toClient(doc))
      .sort((a: any, b: any) => {
        const catA = a.category || '';
        const catB = b.category || '';
        if (catA !== catB) return catA.localeCompare(catB, 'ar');
        return (a.nameAr || '').localeCompare(b.nameAr || '', 'ar');
      });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Services list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب الخدمات' }, { status: 500 });
  }
}

// POST: Add new service (admin only)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { nameAr, price, duration, category, description, clinicId } = body;

    if (!nameAr || price === undefined) {
      return NextResponse.json({ error: 'يرجى إدخال اسم الخدمة والسعر' }, { status: 400 });
    }

    const serviceData = {
      nameAr,
      price: Number(price),
      duration: duration || 15,
      category: category || 'أخرى',
      description: description || '',
      active: true,
      status: 'active',
      clinicId: clinicId || '',
      createdAt: new Date(),
    };

    const doc = await Service.create(serviceData);

    return NextResponse.json(toClient(doc.toObject()), { status: 201 });
  } catch (error) {
    console.error('Create service error:', error);
    return NextResponse.json({ error: 'خطأ في إضافة الخدمة' }, { status: 500 });
  }
}
