// ═══════════════════════════════════════════════════════════
// 🏥 Clinic Settings API
// Multi-tenant: reads/writes to clinics collection using clinicId from JWT
// ═══════════════════════════════════════════════════════════

import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import User from '@/models/User';
import Patient from '@/models/Patient';
import Visit from '@/models/Visit';
import Invoice from '@/models/Invoice';
import Emergency from '@/models/Emergency';
import Notification from '@/models/Notification';
import Service from '@/models/Service';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';
import { DEFAULT_SERVICES } from '@/lib/services-data';
import { isMongoUnavailableError, handleMongoError } from '@/lib/mongo-error-handler';
import { toClient } from '@/lib/mongoose-helpers';

// Route segment config for larger body size (logo uploads)
export const maxDuration = 30;

// Helper to get clinic data from clinics collection only (multi-tenant)
async function getClinicData(clinicId: string | null) {
  if (!clinicId) {
    return null;
  }

  // Multi-tenant system - always use clinics collection with clinicId
  const doc = await Clinic.findById(clinicId).lean();
  if (doc) {
    return { source: 'clinics', ...toClient(doc) };
  }

  return null;
}

// GET: Get clinic settings
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    let data;
    try {
      data = await getClinicData(effectiveClinicId);
    } catch (dbError) {
      // If MongoDB is down, return default settings instead of failing
      if (isMongoUnavailableError(dbError)) {
        return NextResponse.json({ name: 'عيادتي', description: '', phone: '', address: '', logo: '', primaryColor: 'emerald' });
      }
      throw dbError;
    }

    if (!data) {
      return NextResponse.json({ name: 'عيادتي', description: '', phone: '', address: '', logo: '', primaryColor: 'emerald' });
    }

    return NextResponse.json({
      id: data.id,
      name: data.name || '',
      description: data.description || '',
      phone: data.phone || '',
      address: data.address || '',
      logo: data.logo || '',
      primaryColor: data.primaryColor || 'emerald',
    });
  } catch (error) {
    console.error('Get clinic error:', error);
    if (isMongoUnavailableError(error)) {
      // Return default settings instead of error for GET - allows app to still render
      return NextResponse.json({ name: 'عيادتي', description: '', phone: '', address: '', logo: '', primaryColor: 'emerald' });
    }
    return NextResponse.json({ error: 'خطأ في جلب بيانات العيادة' }, { status: 500 });
  }
}

// PUT: Update clinic settings
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const body = await request.json();
    const { name, description, phone, address, logo, primaryColor } = body;

    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (name !== undefined) updateData.name = String(name);
    if (description !== undefined) updateData.description = String(description);
    if (phone !== undefined) updateData.phone = String(phone);
    if (address !== undefined) updateData.address = String(address);
    if (primaryColor !== undefined) updateData.primaryColor = String(primaryColor);

    // Handle logo separately - validate size
    if (logo !== undefined) {
      if (logo && logo.length > 900000) {
        console.warn('Logo too large, skipping logo save. Size:', logo.length);
      } else {
        updateData.logo = String(logo);
      }
    }

    // Use effectiveClinicId to find the correct clinic document
    if (effectiveClinicId) {
      const clinicDoc = await Clinic.findById(effectiveClinicId).lean();
      if (clinicDoc) {
        await Clinic.findByIdAndUpdate(effectiveClinicId, { $set: updateData });
        const existingData = toClient(clinicDoc);
        return NextResponse.json({
          id: effectiveClinicId,
          name: updateData.name ?? existingData.name ?? '',
          description: updateData.description ?? existingData.description ?? '',
          phone: updateData.phone ?? existingData.phone ?? '',
          address: updateData.address ?? existingData.address ?? '',
          logo: updateData.logo ?? existingData.logo ?? '',
          primaryColor: updateData.primaryColor ?? existingData.primaryColor ?? 'emerald',
        });
      }
    }

    // No clinic document found in clinics collection - create one with effectiveClinicId
    if (!effectiveClinicId) {
      return NextResponse.json({ error: 'لم يتم تحديد العيادة' }, { status: 400 });
    }

    const createData = {
      name: String(name || 'عيادتي'),
      description: String(description || ''),
      phone: String(phone || ''),
      address: String(address || ''),
      logo: (logo && logo.length <= 900000) ? String(logo) : '',
      primaryColor: String(primaryColor || 'emerald'),
      setupComplete: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await Clinic.findByIdAndUpdate(effectiveClinicId, { $set: createData }, { upsert: true });
    return NextResponse.json({ id: effectiveClinicId, ...createData });
  } catch (error: any) {
    console.error('Update clinic error:', error);
    const errorMessage = error?.message || 'خطأ في تحديث بيانات العيادة';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE: Full system reset (for current clinic only)
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const body = await request.json();
    const { confirmCode, adminPassword, adminId } = body;

    if (confirmCode !== 'حذف جميع البيانات') {
      return NextResponse.json({ error: 'كلمة التأكيد غير صحيحة' }, { status: 400 });
    }

    if (!adminId || !adminPassword) {
      return NextResponse.json({ error: 'يرجى إدخال كلمة المرور' }, { status: 400 });
    }

    if (!effectiveClinicId) {
      return NextResponse.json({ error: 'لم يتم تحديد العيادة' }, { status: 400 });
    }

    // Verify admin password
    const adminDoc = await User.findById(adminId).lean();
    if (!adminDoc) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
    }

    // Support both hashed and plaintext passwords
    const { verifyPassword } = await import('@/lib/auth');
    const passwordValid = await verifyPassword(adminPassword, adminDoc.password);
    if (!passwordValid || (adminDoc.role !== 'admin' && adminDoc.role !== 'super_admin')) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
    }

    // Delete operational data - ONLY for this clinic

    // Delete all users except admin (for this clinic ONLY)
    await User.deleteMany({
      clinicId: effectiveClinicId,
      _id: { $ne: adminId },
    });

    // Delete operational collections - ONLY for this clinic
    await Patient.deleteMany({ clinicId: effectiveClinicId });
    await Visit.deleteMany({ clinicId: effectiveClinicId });
    await Invoice.deleteMany({ clinicId: effectiveClinicId });
    await Emergency.deleteMany({ clinicId: effectiveClinicId });
    await Notification.deleteMany({ clinicId: effectiveClinicId });
    await Service.deleteMany({ clinicId: effectiveClinicId });

    // Re-seed default services for this clinic
    const servicesWithClinicId = DEFAULT_SERVICES.map(s => ({
      ...s,
      clinicId: effectiveClinicId,
      active: true,
      status: 'active',
      createdAt: new Date(),
    }));

    await Service.insertMany(servicesWithClinicId);

    return NextResponse.json({ success: true, message: 'تم حذف جميع البيانات بنجاح وإعادة تحميل الخدمات' });
  } catch (error) {
    console.error('System reset error:', error);
    return NextResponse.json({ error: 'خطأ في إعادة تهيئة النظام' }, { status: 500 });
  }
}
