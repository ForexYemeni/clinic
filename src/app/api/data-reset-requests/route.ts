import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Clinic from '@/models/Clinic';
import Patient from '@/models/Patient';
import Visit from '@/models/Visit';
import Invoice from '@/models/Invoice';
import Emergency from '@/models/Emergency';
import Notification from '@/models/Notification';
import Service from '@/models/Service';
import SalaryWithdrawal from '@/models/SalaryWithdrawal';
import DataResetRequest from '@/models/DataResetRequest';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';
import { toClient } from '@/lib/mongoose-helpers';

// GET: List data reset requests (for super admin)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { auth } = extractAuthAndClinicId(request);
    if (auth?.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    let results;
    try {
      results = await DataResetRequest
        .find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .lean();
    } catch {
      results = await DataResetRequest
        .find({ status: 'pending' })
        .lean();
    }

    const requests = results.map(r => toClient(r));

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Data reset requests list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب الطلبات' }, { status: 500 });
  }
}

// POST: Create a data reset request (for admin)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    if (!auth || !effectiveClinicId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    if (auth.role !== 'admin') {
      return NextResponse.json({ error: 'فقط مدير العيادة يمكنه طلب حذف البيانات' }, { status: 403 });
    }

    const body = await request.json();
    const { adminPassword, adminId } = body;

    // Verify admin password
    if (!adminId || !adminPassword) {
      return NextResponse.json({ error: 'يرجى إدخال كلمة المرور' }, { status: 400 });
    }

    const adminDoc = await User.findById(adminId).lean();
    if (!adminDoc) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
    }

    const { verifyPassword } = await import('@/lib/auth');
    const passwordValid = await verifyPassword(adminPassword, adminDoc.password);
    if (!passwordValid || adminDoc.role !== 'admin') {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
    }

    // Check if there's already a pending request for this clinic
    const existingRequests = await DataResetRequest
      .find({ clinicId: effectiveClinicId, status: 'pending' })
      .lean();

    if (existingRequests.length > 0) {
      return NextResponse.json({ error: 'يوجد طلب حذف بيانات قيد المراجعة بالفعل لهذه العيادة' }, { status: 400 });
    }

    // Get clinic name
    const clinicDoc = await Clinic.findById(effectiveClinicId).lean();
    const clinicName = clinicDoc ? clinicDoc.name || '' : '';

    // Create the request
    const created = await DataResetRequest.create({
      clinicId: effectiveClinicId,
      clinicName,
      adminId,
      adminName: adminDoc.name || '',
      adminPhone: adminDoc.phone || '',
      status: 'pending',
      createdAt: new Date(),
    });

    const clientResult = toClient(created.toObject());

    return NextResponse.json({
      id: clientResult.id,
      message: 'تم إرسال طلب حذف البيانات بنجاح. سيتم مراجعته من قبل الإدارة الرئيسية.',
    }, { status: 201 });
  } catch (error) {
    console.error('Data reset request create error:', error);
    return NextResponse.json({ error: 'خطأ في إرسال الطلب' }, { status: 500 });
  }
}

// PUT: Approve or reject a data reset request (for super admin)
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const { auth } = extractAuthAndClinicId(request);
    if (auth?.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json();
    const { id, action, superAdminPassword } = body;

    if (!id || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 });
    }

    const doc = await DataResetRequest.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    if (doc.status !== 'pending') {
      return NextResponse.json({ error: 'تم معالجة هذا الطلب مسبقاً' }, { status: 400 });
    }

    if (action === 'approve') {
      // Verify super admin password
      if (!superAdminPassword) {
        return NextResponse.json({ error: 'يرجى إدخال كلمة المرور' }, { status: 400 });
      }

      const superAdminDoc = await User.findById(auth.userId).lean();
      if (!superAdminDoc) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const { verifyPassword } = await import('@/lib/auth');
      const passwordValid = await verifyPassword(superAdminPassword, superAdminDoc.password);
      if (!passwordValid) {
        return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
      }

      // Execute the data reset
      const clinicId = doc.clinicId;
      const adminId = doc.adminId;

      // Delete all users except admin
      await User.deleteMany({
        clinicId,
        _id: { $ne: adminId },
      });

      // Delete operational collections
      await Patient.deleteMany({ clinicId });
      await Visit.deleteMany({ clinicId });
      await Invoice.deleteMany({ clinicId });
      await Emergency.deleteMany({ clinicId });
      await Notification.deleteMany({ clinicId });
      await Service.deleteMany({ clinicId });

      // Also delete salary withdrawals
      try {
        await SalaryWithdrawal.deleteMany({ clinicId });
      } catch {}

      // Re-seed default services
      const { DEFAULT_SERVICES } = await import('@/lib/services-data');
      const servicesWithClinicId = DEFAULT_SERVICES.map(s => ({
        ...s,
        clinicId,
        active: true,
        status: 'active',
        createdAt: new Date(),
      }));

      await Service.insertMany(servicesWithClinicId);
    }

    // Update request status
    await DataResetRequest.findByIdAndUpdate(id, {
      $set: {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedBy: auth.userId,
        reviewedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'تمت الموافقة على الحذف وتنفيذه' : 'تم رفض طلب الحذف',
    });
  } catch (error) {
    console.error('Data reset request review error:', error);
    return NextResponse.json({ error: 'خطأ في معالجة الطلب' }, { status: 500 });
  }
}
