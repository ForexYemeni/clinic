import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';

// PUT: Update nurse (change password, toggle active)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;
    const body = await request.json();

    // Check if user exists
    const userDoc = await User.findById(id).lean();
    if (!userDoc) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // Allow admin to change their own password, but block other admin modifications
    if (userDoc.role === 'admin') {
      // Only allow password changes for admin users
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
    console.error('Update nurse error:', error);
    return NextResponse.json(
      { error: 'خطأ في تحديث بيانات الممرض' },
      { status: 500 }
    );
  }
}

// DELETE: Delete nurse
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    // Check if user exists
    const userDoc = await User.findById(id).lean();
    if (!userDoc) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // Prevent deleting admin
    if (userDoc.role === 'admin') {
      return NextResponse.json(
        { error: 'لا يمكن حذف المدير' },
        { status: 403 }
      );
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Delete nurse error:', error);
    return NextResponse.json(
      { error: 'خطأ في حذف الممرض' },
      { status: 500 }
    );
  }
}
