import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';

// PUT: Update user (change password, toggle active)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;
    const body = await request.json();

    const userDoc = await User.findById(id).lean();
    if (!userDoc) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // For admin and super_admin, only allow password changes
    if (userDoc.role === 'admin' || userDoc.role === 'super_admin') {
      const allowedFields = ['password'];
      const requestedFields = Object.keys(body);
      const disallowedFields = requestedFields.filter(f => !allowedFields.includes(f));
      if (disallowedFields.length > 0) {
        return NextResponse.json(
          { error: 'لا يمكن تعديل بيانات المدير سوى كلمة المرور' },
          { status: 403 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.password !== undefined) updateData.password = body.password;
    if (body.active !== undefined) updateData.active = body.active;

    await User.findByIdAndUpdate(id, updateData);

    return NextResponse.json({ id, ...updateData });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث بيانات المستخدم' }, { status: 500 });
  }
}

// DELETE: Delete user (only nurses)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    const userDoc = await User.findById(id).lean();
    if (!userDoc) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    if (userDoc.role === 'admin' || userDoc.role === 'super_admin') {
      return NextResponse.json({ error: 'لا يمكن حذف المدير' }, { status: 403 });
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'خطأ في حذف المستخدم' }, { status: 500 });
  }
}
