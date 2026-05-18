import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

// PUT: Update service (change price, name, pause, activate)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if service exists
    const serviceDoc = await adminDb.collection('services').doc(id).get();
    if (!serviceDoc.exists) {
      return NextResponse.json(
        { error: 'الخدمة غير موجودة' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (body.nameAr !== undefined) updateData.nameAr = body.nameAr;
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.duration !== undefined) updateData.duration = Number(body.duration);
    if (body.category !== undefined) updateData.category = body.category;
    if (body.description !== undefined) updateData.description = body.description;

    // Handle pause/activate
    if (body.status === 'paused') {
      updateData.status = 'paused';
      updateData.active = false;
    } else if (body.status === 'active') {
      updateData.status = 'active';
      updateData.active = true;
    }

    if (body.active !== undefined) {
      updateData.active = body.active;
      if (body.active) {
        updateData.status = 'active';
      }
    }

    await adminDb.collection('services').doc(id).update(updateData);

    return NextResponse.json({
      id,
      ...updateData,
    });
  } catch (error) {
    console.error('Update service error:', error);
    return NextResponse.json(
      { error: 'خطأ في تحديث الخدمة' },
      { status: 500 }
    );
  }
}

// DELETE: Soft delete service (set status='deleted')
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if service exists
    const serviceDoc = await adminDb.collection('services').doc(id).get();
    if (!serviceDoc.exists) {
      return NextResponse.json(
        { error: 'الخدمة غير موجودة' },
        { status: 404 }
      );
    }

    // Soft delete - set status to 'deleted'
    await adminDb.collection('services').doc(id).update({
      status: 'deleted',
      active: false,
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Delete service error:', error);
    return NextResponse.json(
      { error: 'خطأ في حذف الخدمة' },
      { status: 500 }
    );
  }
}
