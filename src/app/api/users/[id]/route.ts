import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, extractAuthAndClinicId } from '@/lib/auth';

// PUT: Update user (change password, toggle active) - with bcrypt
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { id } = await params;
    const body = await request.json();

    const userDoc = await User.findById(id).lean();
    if (!userDoc) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    const userData = userDoc;

    // Verify clinic ownership (strict: unless super_admin)
    if (auth?.role !== 'super_admin') {
      if (!effectiveClinicId || (userData.clinicId && userData.clinicId !== effectiveClinicId)) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
      }
    }

    // Only allow updating nurses or self (not other admins)
    if (userData.role === 'admin' && auth?.role !== 'super_admin' && auth?.userId !== id) {
      return NextResponse.json({ error: 'لا يمكن تعديل بيانات المدير من هنا' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.password !== undefined) {
      // Hash the new password with bcrypt
      updateData.password = await hashPassword(body.password);
    }
    if (body.active !== undefined) updateData.active = body.active;
    if (body.salary !== undefined) updateData.salary = Number(body.salary) || 0;

    await User.findByIdAndUpdate(id, { $set: updateData });

    return NextResponse.json({ id, ...updateData, password: undefined });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث بيانات المستخدم' }, { status: 500 });
  }
}

// DELETE: Delete nurse
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { id } = await params;

    const userDoc = await User.findById(id).lean();
    if (!userDoc) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    const userData = userDoc;

    // Verify clinic ownership (strict: unless super_admin)
    if (auth?.role !== 'super_admin') {
      if (!effectiveClinicId || (userData.clinicId && userData.clinicId !== effectiveClinicId)) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
      }
    }

    // Prevent deleting admin or super_admin
    if (userData.role === 'admin' || userData.role === 'super_admin') {
      return NextResponse.json({ error: 'لا يمكن حذف المدير' }, { status: 403 });
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'خطأ في حذف المستخدم' }, { status: 500 });
  }
}
