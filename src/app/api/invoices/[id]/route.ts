import { adminDb } from '@/lib/firebase-admin';
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

    // Check if invoice exists
    const invoiceDoc = await adminDb.collection('invoices').doc(id).get();
    if (!invoiceDoc.exists) {
      return NextResponse.json(
        { error: 'الفاتورة غير موجودة' },
        { status: 404 }
      );
    }

    // Verify clinic ownership
    const invoiceClinicId = invoiceDoc.data()?.clinicId;
    if (effectiveClinicId && invoiceClinicId && invoiceClinicId !== effectiveClinicId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const currentData = invoiceDoc.data();
    const updateData: Record<string, unknown> = {};

    // If adding a payment
    if (body.paid !== undefined && typeof body.paid === 'number' && body.paid > 0) {
      const newPaid = (currentData.paid || 0) + body.paid;
      const total = currentData.total || 0;
      const remaining = total - newPaid;
      const status: string = newPaid >= total ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';

      updateData.paid = newPaid;
      updateData.remaining = remaining;
      updateData.status = status;
    }

    // Allow updating items
    if (body.items !== undefined) {
      updateData.items = body.items;
      const total = body.items.reduce(
        (sum: number, item: any) => sum + (item.price * (item.quantity || 1)),
        0
      );
      updateData.total = total;
      const paid = updateData.paid !== undefined ? updateData.paid : (currentData.paid || 0);
      updateData.remaining = total - paid;
      updateData.status = paid >= total ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
    }

    // Allow direct status override
    if (body.status !== undefined && ['paid', 'unpaid', 'partial'].includes(body.status)) {
      updateData.status = body.status;
      if (body.status === 'paid') {
        updateData.paid = currentData.total || 0;
        updateData.remaining = 0;
      }
    }

    await adminDb.collection('invoices').doc(id).update(updateData);

    return NextResponse.json({ id, ...updateData });
  } catch (error) {
    console.error('Update invoice error:', error);
    return NextResponse.json(
      { error: 'خطأ في تحديث الفاتورة' },
      { status: 500 }
    );
  }
}
