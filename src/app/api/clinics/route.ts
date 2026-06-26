import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import User from '@/models/User';
import Patient from '@/models/Patient';
import Visit from '@/models/Visit';
import Invoice from '@/models/Invoice';
import Emergency from '@/models/Emergency';
import Service from '@/models/Service';
import { toClient } from '@/lib/mongoose-helpers';
import { NextRequest, NextResponse } from 'next/server';

// GET: List all clinics (with stats for super admin)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const withStats = searchParams.get('withStats') === 'true';
    const clinicId = searchParams.get('clinicId');

    if (clinicId) {
      // Get single clinic details
      const clinicDoc = await Clinic.findById(clinicId).lean();
      if (!clinicDoc) {
        return NextResponse.json({ error: 'العيادة غير موجودة' }, { status: 404 });
      }

      const clinicData = toClient(clinicDoc);

      // Get admin info
      if (clinicData.adminId) {
        const adminDoc = await User.findById(clinicData.adminId).lean();
        if (adminDoc) {
          clinicData.adminName = adminDoc.name;
          clinicData.adminPhone = adminDoc.phone;
        }
      }

      if (withStats) {
        const [patientCount, nurseCount, visitCount, emergencyCount, invoiceDocs] = await Promise.all([
          Patient.countDocuments({ clinicId }),
          User.countDocuments({ clinicId, role: 'nurse' }),
          Visit.countDocuments({ clinicId }),
          Emergency.countDocuments({ clinicId, status: 'active' }),
          Invoice.find({ clinicId, status: { $in: ['unpaid', 'partial'] } }).lean(),
        ]);

        const unpaidAmount = invoiceDocs.reduce((sum, doc) => sum + ((doc.remaining) ?? (doc.total - (doc.paid || 0))), 0);

        clinicData.stats = {
          patients: patientCount,
          nurses: nurseCount,
          visits: visitCount,
          activeEmergencies: emergencyCount,
          unpaidAmount,
        };
      }

      return NextResponse.json(clinicData);
    }

    // List all clinics
    const clinics = await Clinic.find().sort({ createdAt: -1 }).lean();

    const result = [];
    for (const doc of clinics) {
      const clinicData: any = toClient(doc);

      // Get admin info
      if (clinicData.adminId) {
        const adminDoc = await User.findById(clinicData.adminId).lean();
        if (adminDoc) {
          clinicData.adminName = adminDoc.name;
          clinicData.adminPhone = adminDoc.phone;
        }
      }

      if (withStats) {
        const [patientCount, nurseCount] = await Promise.all([
          Patient.countDocuments({ clinicId: doc._id.toString() }),
          User.countDocuments({ clinicId: doc._id.toString(), role: 'nurse' }),
        ]);
        clinicData.stats = { patients: patientCount, nurses: nurseCount };
      }

      result.push(clinicData);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Clinics list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب العيادات' }, { status: 500 });
  }
}

// POST: Create new clinic (super admin)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { clinicName, adminName, adminPhone, password, address, phone, city } = body;

    if (!clinicName || !adminName || !adminPhone || !password) {
      return NextResponse.json({ error: 'يرجى ملء جميع الحقول المطلوبة' }, { status: 400 });
    }

    const phoneRegex = /^\d{9}$/;
    if (!phoneRegex.test(adminPhone)) {
      return NextResponse.json({ error: 'رقم هاتف المدير يجب أن يكون 9 أرقام' }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل' }, { status: 400 });
    }

    const existingUser = await User.findOne({ phone: adminPhone }).lean();
    if (existingUser) {
      return NextResponse.json({ error: 'رقم الهاتف مستخدم بالفعل' }, { status: 409 });
    }

    const clinic = await Clinic.create({
      name: clinicName,
      address: address || '',
      phone: phone || '',
      city: city || '',
      adminPhone,
      active: true,
      setupComplete: true,
      subscription: { plan: 'free', startDate: new Date(), endDate: null, status: 'active' },
      createdAt: new Date(),
    });

    const clinicId = clinic._id.toString();

    const adminUser = await User.create({
      name: adminName,
      phone: adminPhone,
      password,
      role: 'admin',
      active: true,
      clinicId,
      createdAt: new Date(),
    });

    await Clinic.findByIdAndUpdate(clinicId, { adminId: adminUser._id.toString() });

    // Default services
    const { DEFAULT_SERVICES } = await import('@/lib/constants');
    const servicesToInsert = DEFAULT_SERVICES.map((service: any) => ({
      ...service,
      clinicId,
      active: true,
      status: 'active',
      createdAt: new Date(),
    }));
    await Service.insertMany(servicesToInsert);

    return NextResponse.json({
      success: true,
      clinic: { id: clinicId, name: clinicName, address: address || '', phone: phone || '', city: city || '', active: true },
      admin: { id: adminUser._id.toString(), name: adminName, phone: adminPhone, role: 'admin' },
    }, { status: 201 });
  } catch (error) {
    console.error('Create clinic error:', error);
    return NextResponse.json({ error: 'خطأ في إنشاء العيادة' }, { status: 500 });
  }
}

// PUT: Update clinic
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { id, name, address, phone, city, active } = body;

    if (!id) {
      return NextResponse.json({ error: 'يرجى تحديد العيادة' }, { status: 400 });
    }

    const clinicDoc = await Clinic.findById(id).lean();
    if (!clinicDoc) {
      return NextResponse.json({ error: 'العيادة غير موجودة' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (city !== undefined) updateData.city = city;
    if (active !== undefined) updateData.active = active;

    await Clinic.findByIdAndUpdate(id, updateData);

    // If clinic is deactivated, deactivate all its users
    if (active === false) {
      await User.updateMany({ clinicId: id }, { active: false });
    } else if (active === true) {
      // Reactivate admin
      await User.updateOne({ _id: clinicDoc.adminId, role: 'admin' }, { active: true });
    }

    return NextResponse.json({ success: true, id, ...updateData });
  } catch (error) {
    console.error('Update clinic error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث العيادة' }, { status: 500 });
  }
}

// DELETE: Delete clinic and all its data
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'يرجى تحديد العيادة' }, { status: 400 });
    }

    const clinicDoc = await Clinic.findById(id).lean();
    if (!clinicDoc) {
      return NextResponse.json({ error: 'العيادة غير موجودة' }, { status: 404 });
    }

    // Delete all clinic data
    await Promise.all([
      User.deleteMany({ clinicId: id }),
      Patient.deleteMany({ clinicId: id }),
      Visit.deleteMany({ clinicId: id }),
      Invoice.deleteMany({ clinicId: id }),
      Emergency.deleteMany({ clinicId: id }),
      Service.deleteMany({ clinicId: id }),
      Clinic.findByIdAndDelete(id),
    ]);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Delete clinic error:', error);
    return NextResponse.json({ error: 'خطأ في حذف العيادة' }, { status: 500 });
  }
}
