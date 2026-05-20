import dbConnect from '@/lib/mongodb';
import Service from '@/models/Service';
import { toClient } from '@/lib/mongoose-helpers';
import { NextRequest, NextResponse } from 'next/server';

// GET: List all active services (status != 'deleted')
export async function GET() {
  try {
    await dbConnect();

    const services = await Service.find({ status: { $ne: 'deleted' } }).lean();

    const result = services
      .map((doc) => toClient(doc))
      .sort((a: any, b: any) => {
        // Sort by category then name
        const catA = a.category || '';
        const catB = b.category || '';
        if (catA !== catB) return catA.localeCompare(catB, 'ar');
        return (a.nameAr || '').localeCompare(b.nameAr || '', 'ar');
      });

    return NextResponse.json(result);
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
    await dbConnect();

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
      createdAt: new Date(),
    };

    const doc = await Service.create(serviceData);

    return NextResponse.json(
      toClient(doc.toObject()),
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
