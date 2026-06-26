// ═══════════════════════════════════════════════════════════
// 💵 Invoice Detail API (Prisma + PostgreSQL)
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';

// PUT: Update invoice (add payment, change status)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { id } = await params;
    const body = await request.json();

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });
    }
    if (!effectiveClinicId || (invoice.clinicId && invoice.clinicId !== effectiveClinicId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const updateData: any = {};

    // Add payment
    if (body.paid !== undefined && typeof body.paid === 'number' && body.paid > 0) {
      const newPaid = (invoice.paid || 0) + body.paid;
      const total = invoice.total || 0;
      const remaining = total - newPaid;
      const status = newPaid >= total ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';
      updateData.paid = newPaid;
      updateData.remaining = remaining;
      updateData.status = status;
    }

    // Update items
    if (body.items !== undefined) {
      updateData.items = body.items;
      const total = body.items.reduce(
        (sum: number, item: any) => sum + (item.price * (item.quantity || 1)),
        0
      );
      updateData.total = total;
      const paid = updateData.paid !== undefined ? updateData.paid : (invoice.paid || 0);
      updateData.remaining = total - paid;
      updateData.status = paid >= total ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
    }

    // Direct status override
    if (body.status !== undefined && ['paid', 'unpaid', 'partial'].includes(body.status)) {
      updateData.status = body.status;
      if (body.status === 'paid') {
        updateData.paid = invoice.total || 0;
        updateData.remaining = 0;
      }
    }

    const updated = await prisma.invoice.update({ where: { id }, data: updateData });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update invoice error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث الفاتورة' }, { status: 500 });
  }
}

// DELETE: Delete invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });
    }
    if (!effectiveClinicId || (invoice.clinicId && invoice.clinicId !== effectiveClinicId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    await prisma.invoice.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Delete invoice error:', error);
    return NextResponse.json({ error: 'خطأ في حذف الفاتورة' }, { status: 500 });
  }
}
