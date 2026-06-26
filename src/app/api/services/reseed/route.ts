import dbConnect from '@/lib/mongodb';
import Service from '@/models/Service';
import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_SERVICES } from '@/lib/services-data';
import { extractAuthAndClinicId } from '@/lib/auth';
import { toClient } from '@/lib/mongoose-helpers';

// POST: Re-seed missing services (adds services that don't exist yet, with clinicId)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);

    if (!effectiveClinicId) {
      return NextResponse.json({ error: 'لم يتم تحديد العيادة' }, { status: 400 });
    }

    const existingServices = await Service.find({ clinicId: effectiveClinicId }).lean();
    const existingNames = new Set(
      existingServices
        .map(doc => doc.nameAr)
        .filter(Boolean)
    );

    const missingServices = DEFAULT_SERVICES.filter(service => !existingNames.has(service.nameAr));

    if (missingServices.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'جميع الخدمات موجودة بالفعل',
        added: 0,
        total: existingServices.length,
      });
    }

    // Create missing services
    const servicesToCreate = missingServices.map(service => ({
      ...service,
      clinicId: effectiveClinicId,
      active: true,
      status: 'active',
    }));
    await Service.create(servicesToCreate);

    return NextResponse.json({
      success: true,
      message: `تمت إضافة ${missingServices.length} خدمة جديدة`,
      added: missingServices.length,
      total: existingServices.length + missingServices.length,
    });
  } catch (error) {
    console.error('Reseed services error:', error);
    return NextResponse.json({ error: 'خطأ في إعادة تحميل الخدمات' }, { status: 500 });
  }
}

// DELETE: Delete all services and re-seed from defaults (for current clinic)
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);

    if (!effectiveClinicId) {
      return NextResponse.json({ error: 'لم يتم تحديد العيادة' }, { status: 400 });
    }

    // Delete existing services for this clinic ONLY
    await Service.deleteMany({ clinicId: effectiveClinicId });

    // Re-seed with clinicId
    const servicesToCreate = DEFAULT_SERVICES.map(service => ({
      ...service,
      clinicId: effectiveClinicId,
      active: true,
      status: 'active',
    }));
    await Service.create(servicesToCreate);

    return NextResponse.json({
      success: true,
      message: `تم إعادة تحميل ${DEFAULT_SERVICES.length} خدمة`,
      total: DEFAULT_SERVICES.length,
    });
  } catch (error) {
    console.error('Reset services error:', error);
    return NextResponse.json({ error: 'خطأ في إعادة تهيئة الخدمات' }, { status: 500 });
  }
}
