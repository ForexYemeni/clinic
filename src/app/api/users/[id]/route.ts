import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

// PUT: Update nurse (change password, toggle active)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if user exists
    const userDoc = await adminDb.collection('users').doc(id).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // Only allow updating nurses (not admin)
    if (userData.role === 'admin') {
      return NextResponse.json(
        { error: 'لا يمكن تعديل بيانات المدير من هنا' },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.password !== undefined) updateData.password = body.password;
    if (body.active !== undefined) updateData.active = body.active;

    await adminDb.collection('users').doc(id).update(updateData);

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
    const { id } = await params;

    // Check if user exists
    const userDoc = await adminDb.collection('users').doc(id).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // Prevent deleting admin
    if (userData.role === 'admin') {
      return NextResponse.json(
        { error: 'لا يمكن حذف المدير' },
        { status: 403 }
      );
    }

    await adminDb.collection('users').doc(id).delete();

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Delete nurse error:', error);
    return NextResponse.json(
      { error: 'خطأ في حذف الممرض' },
      { status: 500 }
    );
  }
}
