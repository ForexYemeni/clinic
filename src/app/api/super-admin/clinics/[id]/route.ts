// ═══════════════════════════════════════════════════════════
// 👑 Super Admin - Single Clinic Management API
// Update, suspend, activate, delete individual clinics
// ═══════════════════════════════════════════════════════════

import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Patient from '@/models/Patient';
import Service from '@/models/Service';
import Visit from '@/models/Visit';
import Invoice from '@/models/Invoice';
import Emergency from '@/models/Emergency';
import Notification from '@/models/Notification';
import Clinic from '@/models/Clinic';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest, verifyPassword } from '@/lib/auth';
import { getClinicById, setClinicSubscription, createAuditLog, checkClinicSubscription } from '@/lib/multi-tenant';
import { DEFAULT_SERVICES } from '@/lib/services-data';
import { toClient, toClientList } from '@/lib/mongoose-helpers';

// GET: Get single clinic details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const auth = extractAuthFromRequest(request);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { id } = await params;
    const clinic = await getClinicById(id);
    if (!clinic) {
      return NextResponse.json({ error: 'العيادة غير موجودة' }, { status: 404 });
    }

    // Get additional stats
    const [
      userCount,
      patientCount,
      serviceCount,
      invoiceCount,
      invoices,
      users,
    ] = await Promise.all([
      User.countDocuments({ clinicId: id }).catch(() => 0),
      Patient.countDocuments({ clinicId: id }).catch(() => 0),
      Service.countDocuments({ clinicId: id }).catch(() => 0),
      Invoice.countDocuments({ clinicId: id }).catch(() => 0),
      Invoice.find({ clinicId: id }).lean().catch(() => []),
      User.find({ clinicId: id }).lean().catch(() => []),
    ]);

    // Calculate total revenue
    let totalRevenue = 0;
    if (Array.isArray(invoices)) {
      invoices.forEach((inv: any) => {
        totalRevenue += inv.paid || 0;
      });
    }

    // Get users list (without passwords)
    const usersList = Array.isArray(users)
      ? users.map((u: any) => {
          const clientUser = toClient(u);
          clientUser.password = undefined;
          return clientUser;
        })
      : [];

    // Subscription status
    const subCheck = await checkClinicSubscription(id);

    return NextResponse.json({
      ...clinic,
      stats: {
        userCount: userCount || 0,
        patientCount: patientCount || 0,
        serviceCount: serviceCount || 0,
        invoiceCount: invoiceCount || 0,
        totalRevenue,
      },
      users: usersList,
      subscriptionCheck: subCheck,
    });
  } catch (error) {
    console.error('Get clinic error:', error);
    return NextResponse.json({ error: 'خطأ في جلب بيانات العيادة' }, { status: 500 });
  }
}

// PUT: Update clinic (subscription, status, settings)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const auth = extractAuthFromRequest(request);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, ...data } = body;

    const clinic = await getClinicById(id);
    if (!clinic) {
      return NextResponse.json({ error: 'العيادة غير موجودة' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };

    switch (action) {
      case 'extend_subscription': {
        // Extend subscription by N days (from existing end date if active)
        const days = data.days || 30;
        const type = data.subscriptionType || clinic.subscription?.type || 'monthly';
        const subscription = await setClinicSubscription(id, { type, days, extendFromExisting: true });
        await createAuditLog({ clinicId: id, userId: auth.userId, action: 'extend_subscription', details: `Extended ${clinic.name} subscription by ${days} days` });
        return NextResponse.json({ success: true, subscription });
      }

      case 'suspend': {
        updateData.active = false;
        await Clinic.findByIdAndUpdate(id, {
          $set: {
            active: false,
            'subscription.status': 'suspended',
            updatedAt: new Date(),
          },
        });
        await createAuditLog({ clinicId: id, userId: auth.userId, action: 'suspend_clinic', details: `Suspended clinic: ${clinic.name}` });
        return NextResponse.json({ success: true, status: 'suspended' });
      }

      case 'activate': {
        const currentSub = clinic.subscription;
        const days = data.days;

        if (days && days > 0) {
          // Days explicitly specified — set new subscription with those days
          const subscription = await setClinicSubscription(id, {
            type: data.subscriptionType || currentSub?.type || 'monthly',
            days,
            status: 'active',
            extendFromExisting: true,
          });
          await createAuditLog({ clinicId: id, userId: auth.userId, action: 'activate_clinic', details: `Activated clinic: ${clinic.name} with ${days} days` });
          return NextResponse.json({ success: true, subscription });
        } else {
          // No days specified — just reactivate with existing end date
          const newStatus = currentSub?.type === 'trial' ? 'trial' : 'active';
          await Clinic.findByIdAndUpdate(id, {
            $set: {
              'subscription.status': newStatus,
              active: true,
              updatedAt: new Date(),
            },
          });
          await createAuditLog({ clinicId: id, userId: auth.userId, action: 'activate_clinic', details: `Reactivated clinic: ${clinic.name} (preserved existing end date)` });
          return NextResponse.json({ success: true, subscription: { ...currentSub, status: newStatus } });
        }
      }

      case 'update_settings': {
        // Update clinic settings (name, phone, address, etc.)
        const settingsUpdate: Record<string, unknown> = { updatedAt: new Date() };
        if (data.name) settingsUpdate.name = data.name;
        if (data.phone) settingsUpdate.phone = data.phone;
        if (data.address) settingsUpdate.address = data.address;
        if (data.description) settingsUpdate.description = data.description;
        if (data.logo !== undefined) settingsUpdate['theme.logoUrl'] = data.logo;
        if (data.primaryColor) settingsUpdate['theme.primaryColor'] = data.primaryColor;
        await Clinic.findByIdAndUpdate(id, { $set: settingsUpdate });
        return NextResponse.json({ success: true });
      }

      case 'reset_data': {
        // Reset all clinic data but keep the clinic and admin user
        // Requires super_admin password verification
        if (!data.superAdminPassword) {
          return NextResponse.json({ error: 'يرجى إدخال كلمة المرور' }, { status: 400 });
        }

        // Verify super_admin password
        const superAdminDoc = await User.findById(auth.userId).lean();
        if (!superAdminDoc) {
          return NextResponse.json({ error: 'حساب المدير غير موجود' }, { status: 401 });
        }
        const passwordValid = await verifyPassword(data.superAdminPassword, superAdminDoc.password);
        if (!passwordValid) {
          return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
        }

        // Delete nurses (keep admin)
        await User.deleteMany({ clinicId: id, role: 'nurse' });

        // Delete operational data
        await Promise.all([
          Patient.deleteMany({ clinicId: id }).catch(() => {}),
          Visit.deleteMany({ clinicId: id }).catch(() => {}),
          Invoice.deleteMany({ clinicId: id }).catch(() => {}),
          Emergency.deleteMany({ clinicId: id }).catch(() => {}),
          Notification.deleteMany({ clinicId: id }).catch(() => {}),
        ]);

        // Delete old services and re-seed defaults
        await Service.deleteMany({ clinicId: id }).catch(() => {});

        // Re-seed default services
        const servicesWithClinicId = DEFAULT_SERVICES.map(s => ({
          ...s,
          clinicId: id,
          active: true,
          status: 'active',
        }));
        await Service.create(servicesWithClinicId);

        await createAuditLog({
          clinicId: id,
          userId: auth.userId,
          action: 'reset_clinic_data',
          details: `Reset all data for clinic: ${clinic.name}`,
          severity: 'critical',
        });

        return NextResponse.json({ success: true, message: 'تم إعادة تعيين بيانات العيادة بنجاح' });
      }

      default:
        return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
    }
  } catch (error) {
    console.error('Update clinic error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث العيادة' }, { status: 500 });
  }
}

// DELETE: Delete a clinic and all its data
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const auth = extractAuthFromRequest(request);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { id } = await params;
    const clinic = await getClinicById(id);
    if (!clinic) {
      return NextResponse.json({ error: 'العيادة غير موجودة' }, { status: 404 });
    }

    // Delete all data associated with this clinic
    // Delete clinic users (except super_admin)
    await User.deleteMany({ clinicId: id, role: { $ne: 'super_admin' } });

    // Delete operational collections
    await Promise.all([
      Patient.deleteMany({ clinicId: id }).catch(() => {}),
      Service.deleteMany({ clinicId: id }).catch(() => {}),
      Visit.deleteMany({ clinicId: id }).catch(() => {}),
      Invoice.deleteMany({ clinicId: id }).catch(() => {}),
      Emergency.deleteMany({ clinicId: id }).catch(() => {}),
      Notification.deleteMany({ clinicId: id }).catch(() => {}),
    ]);

    // Delete clinic document
    await Clinic.findByIdAndDelete(id);

    await createAuditLog({ clinicId: null, userId: auth.userId, action: 'delete_clinic', details: `Deleted clinic: ${clinic.name}`, severity: 'critical' });

    return NextResponse.json({ success: true, message: 'تم حذف العيادة وجميع بياناتها' });
  } catch (error) {
    console.error('Delete clinic error:', error);
    return NextResponse.json({ error: 'خطأ في حذف العيادة' }, { status: 500 });
  }
}
