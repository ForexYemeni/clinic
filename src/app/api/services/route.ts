import dbConnect from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';
import Service from '@/models/Service';
import { toClient, toClientList } from '@/lib/mongoose-helpers';

// GET: List all active services (filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);

    if (!effectiveClinicId) {
      return NextResponse.json([]);
    }

    let results;
    try {
      results = await Service.find({ clinicId: effectiveClinicId }).lean();
    } catch {
      results = await Service.find({ clinicId: effectiveClinicId }).lean();
    }

    const services = toClientList(results)
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
    await dbConnect();
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
    };

    const created = await Service.create(serviceData);

    return NextResponse.json({ id: created._id.toString(), ...toClient(created.toObject()) }, { status: 201 });
  } catch (error) {
    console.error('Create service error:', error);
    return NextResponse.json({ error: 'خطأ في إضافة الخدمة' }, { status: 500 });
  }
}

// DELETE: Delete ALL services for this clinic (so admin can rely only on their own custom services)
// Default services can be reloaded at any time via POST /api/services/reseed
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);

    // Only admins can perform this destructive action
    if (!auth || (auth.role !== 'admin' && auth.role !== 'super_admin')) {
      return NextResponse.json({ error: 'غير مصرح. هذه العملية متاحة لمدير العيادة فقط' }, { status: 403 });
    }

    if (!effectiveClinicId) {
      return NextResponse.json({ error: 'لم يتم تحديد العيادة' }, { status: 400 });
    }

    // Count existing services before deletion (for the response message)
    const countResult = await Service.countDocuments({ clinicId: effectiveClinicId });

    // Permanently delete ALL services for this clinic
    await Service.deleteMany({ clinicId: effectiveClinicId });

    return NextResponse.json({
      success: true,
      message: `تم حذف جميع الخدمات (${countResult})`,
      deleted: countResult,
      total: 0,
    });
  } catch (error) {
    console.error('Delete all services error:', error);
    return NextResponse.json({ error: 'خطأ في حذف جميع الخدمات' }, { status: 500 });
  }
}
