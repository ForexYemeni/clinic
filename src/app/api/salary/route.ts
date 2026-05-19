import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';

// GET: List salary withdrawals (?nurseId=xxx, filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { searchParams } = new URL(request.url);
    const nurseId = searchParams.get('nurseId') || '';

    if (!effectiveClinicId) {
      return NextResponse.json([]);
    }

    let snapshot;
    try {
      let query: any = adminDb.collection('salaryWithdrawals')
        .where('clinicId', '==', effectiveClinicId);

      if (nurseId) {
        query = query.where('nurseId', '==', nurseId);
      }

      snapshot = await query.orderBy('createdAt', 'desc').get();
    } catch {
      try {
        let query: any = adminDb.collection('salaryWithdrawals')
          .where('clinicId', '==', effectiveClinicId);

        if (nurseId) {
          query = query.where('nurseId', '==', nurseId);
        }

        snapshot = await query.get();
      } catch {
        // Last resort
        const allSnap = await adminDb.collection('salaryWithdrawals')
          .where('clinicId', '==', effectiveClinicId).get();
        snapshot = {
          docs: nurseId
            ? allSnap.docs.filter(d => d.data().nurseId === nurseId)
            : allSnap.docs
        };
      }
    }

    const withdrawals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })).sort((a: any, b: any) => {
      const da = a.createdAt || '';
      const db = b.createdAt || '';
      return db.localeCompare(da);
    });

    // If nurseId provided, also get nurse info and salary
    if (nurseId) {
      let nurseData: any = {};
      try {
        const nurseDoc = await adminDb.collection('users').doc(nurseId).get();
        if (nurseDoc.exists) {
          const nd = nurseDoc.data();
          nurseData = {
            name: nd.name || '',
            phone: nd.phone || '',
            salary: nd.salary || 0,
            active: nd.active !== false,
          };
        }
      } catch {}

      // Only count approved withdrawals toward total
      const approvedWithdrawals = withdrawals.filter((w: any) => w.status === 'approved' || !w.status);
      const totalWithdrawals = approvedWithdrawals.reduce((sum: number, w: any) => sum + (w.amount || 0), 0);

      // Separate debts from regular withdrawals
      const debts = withdrawals.filter((w: any) => w.type === 'debt' && (w.status === 'approved' || !w.status));
      const totalDebts = debts.reduce((sum: number, w: any) => sum + (w.amount || 0), 0);

      // Pending requests count
      const pendingRequests = withdrawals.filter((w: any) => w.status === 'pending');

      return NextResponse.json({
        nurse: nurseData,
        salary: nurseData.salary || 0,
        totalWithdrawals,
        totalDebts,
        remainingBalance: (nurseData.salary || 0) - totalWithdrawals,
        withdrawals,
        pendingCount: pendingRequests.length,
      });
    }

    return NextResponse.json(withdrawals);
  } catch (error) {
    console.error('Salary withdrawals list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب بيانات السحوبات' }, { status: 500 });
  }
}

// POST: Add a salary withdrawal or request
export async function POST(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const body = await request.json();
    const {
      nurseId, amount, description, type,
      // Withdrawal method: cash or transfer
      withdrawalMethod,
      // Wallet details for transfer
      walletName, walletPhone, walletOwner,
      // Who initiated this
      requestedBy,
      // Debt assignment fields
      invoiceId, patientName, isDebt,
    } = body;

    if (!nurseId) {
      return NextResponse.json({ error: 'يرجى تحديد الممرض' }, { status: 400 });
    }

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'يرجى إدخال مبلغ صحيح' }, { status: 400 });
    }

    if (!effectiveClinicId) {
      return NextResponse.json({ error: 'لم يتم تحديد العيادة' }, { status: 400 });
    }

    // Get nurse info
    const nurseDoc = await adminDb.collection('users').doc(nurseId).get();
    if (!nurseDoc.exists) {
      return NextResponse.json({ error: 'الممرض غير موجود' }, { status: 404 });
    }

    const nurseData = nurseDoc.data();
    if (nurseData.clinicId !== effectiveClinicId && auth?.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    // Determine status based on who initiated
    // Nurse requests are pending, admin additions are approved immediately
    const status = requestedBy === 'nurse' ? 'pending' : 'approved';

    // Calculate current balance (only approved withdrawals)
    const existingWithdrawals = await adminDb.collection('salaryWithdrawals')
      .where('nurseId', '==', nurseId)
      .where('clinicId', '==', effectiveClinicId)
      .get();

    const totalWithdrawn = existingWithdrawals.docs
      .filter(doc => {
        const d = doc.data();
        return d.status === 'approved' || !d.status;
      })
      .reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

    const salary = nurseData.salary || 0;
    const remaining = salary - totalWithdrawn;

    // Only check balance for approved (immediate) withdrawals by admin
    // Pending requests by nurses don't immediately deduct
    if (status === 'approved' && Number(amount) > remaining && salary > 0) {
      return NextResponse.json({
        error: `المبلغ يتجاوز الرصيد المتاح. الرصيد المتبقي: ${remaining.toLocaleString('ar-YE')} ر.ي`,
        remaining,
      }, { status: 400 });
    }

    const withdrawalData: any = {
      nurseId,
      nurseName: nurseData.name || '',
      clinicId: effectiveClinicId,
      amount: Number(amount),
      description: description || (type === 'cash' ? 'سحب نقدي' : type === 'debt' ? 'مديونية' : 'سحب من الراتب'),
      type: type || 'cash',
      status,
      requestedBy: requestedBy || 'admin',
      createdBy: auth?.userId || '',
      createdAt: new Date().toISOString(),
    };

    // Add withdrawal method
    if (withdrawalMethod) {
      withdrawalData.withdrawalMethod = withdrawalMethod;
    }

    // Add wallet details for transfer
    if (withdrawalMethod === 'transfer') {
      withdrawalData.walletName = walletName || '';
      withdrawalData.walletPhone = walletPhone || '';
      withdrawalData.walletOwner = walletOwner || '';
    }

    // Add debt assignment details
    if (isDebt || type === 'debt') {
      withdrawalData.isDebt = true;
      withdrawalData.invoiceId = invoiceId || '';
      withdrawalData.patientName = patientName || '';
    }

    const docRef = await adminDb.collection('salaryWithdrawals').add(withdrawalData);

    // Create notification for admin when nurse requests withdrawal
    if (requestedBy === 'nurse') {
      try {
        const methodLabel = withdrawalMethod === 'transfer' ? 'تحويل' : 'نقدي';
        await adminDb.collection('notifications').add({
          clinicId: effectiveClinicId,
          type: 'salary_request',
          title: 'طلب سحب من الراتب',
          message: `${nurseData.name} طلب سحب ${Number(amount).toLocaleString('ar-YE')} ر.ي (${methodLabel})`,
          nurseId,
          nurseName: nurseData.name || '',
          withdrawalId: docRef.id,
          amount: Number(amount),
          withdrawalMethod: withdrawalMethod || 'cash',
          read: false,
          createdAt: new Date().toISOString(),
        });
      } catch (e) {
        console.error('Failed to create notification:', e);
      }
    }

    // Return updated balance info (for approved withdrawals)
    const newTotalWithdrawn = status === 'approved' ? totalWithdrawn + Number(amount) : totalWithdrawn;
    const newRemaining = salary - newTotalWithdrawn;

    return NextResponse.json({
      id: docRef.id,
      ...withdrawalData,
      salary,
      totalWithdrawn: newTotalWithdrawn,
      remainingBalance: newRemaining,
    }, { status: 201 });
  } catch (error) {
    console.error('Salary withdrawal create error:', error);
    return NextResponse.json({ error: 'خطأ في تسجيل السحب' }, { status: 500 });
  }
}

// PUT: Approve or reject a withdrawal request
export async function PUT(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const body = await request.json();
    const { id, action, rejectionReason } = body;

    if (!id) {
      return NextResponse.json({ error: 'يرجى تحديد الطلب' }, { status: 400 });
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 });
    }

    const doc = await adminDb.collection('salaryWithdrawals').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    const data = doc.data();
    if (data.clinicId !== effectiveClinicId && auth?.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    if (data.status !== 'pending') {
      return NextResponse.json({ error: 'تم معالجة هذا الطلب مسبقاً' }, { status: 400 });
    }

    // If approving, check if balance is sufficient
    if (action === 'approve') {
      const existingWithdrawals = await adminDb.collection('salaryWithdrawals')
        .where('nurseId', '==', data.nurseId)
        .where('clinicId', '==', effectiveClinicId)
        .get();

      const totalWithdrawn = existingWithdrawals.docs
        .filter(d => {
          const wd = d.data();
          return (wd.status === 'approved' || !wd.status) && d.id !== id;
        })
        .reduce((sum, d) => sum + (d.data().amount || 0), 0);

      const nurseDoc = await adminDb.collection('users').doc(data.nurseId).get();
      const salary = nurseDoc.exists ? (nurseDoc.data()?.salary || 0) : 0;
      const remaining = salary - totalWithdrawn;

      if (data.amount > remaining && salary > 0) {
        return NextResponse.json({
          error: `المبلغ يتجاوز الرصيد المتاح. الرصيد المتبقي: ${remaining.toLocaleString('ar-YE')} ر.ي`,
          remaining,
        }, { status: 400 });
      }
    }

    const updateData: any = {
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewedBy: auth?.userId || '',
      reviewedAt: new Date().toISOString(),
    };

    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    await adminDb.collection('salaryWithdrawals').doc(id).update(updateData);

    // Notify the nurse about the decision
    try {
      const statusLabel = action === 'approve' ? 'موافق' : 'مرفوض';
      await adminDb.collection('notifications').add({
        clinicId: effectiveClinicId,
        type: 'salary_response',
        title: `طلب السحب ${statusLabel}`,
        message: action === 'approve'
          ? `تمت الموافقة على طلب سحب ${data.amount.toLocaleString('ar-YE')} ر.ي`
          : `تم رفض طلب سحب ${data.amount.toLocaleString('ar-YE')} ر.ي${rejectionReason ? ` - السبب: ${rejectionReason}` : ''}`,
        userId: data.nurseId,
        withdrawalId: id,
        read: false,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Failed to create notification:', e);
    }

    return NextResponse.json({
      success: true,
      id,
      status: updateData.status,
    });
  } catch (error) {
    console.error('Salary withdrawal update error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث الطلب' }, { status: 500 });
  }
}

// DELETE: Delete a salary withdrawal
export async function DELETE(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { searchParams } = new URL(request.url);
    const withdrawalId = searchParams.get('id');

    if (!withdrawalId) {
      return NextResponse.json({ error: 'يرجى تحديد السحب' }, { status: 400 });
    }

    const doc = await adminDb.collection('salaryWithdrawals').doc(withdrawalId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'السحب غير موجود' }, { status: 404 });
    }

    const data = doc.data();
    if (data.clinicId !== effectiveClinicId && auth?.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    await adminDb.collection('salaryWithdrawals').doc(withdrawalId).delete();

    return NextResponse.json({ success: true, id: withdrawalId });
  } catch (error) {
    console.error('Salary withdrawal delete error:', error);
    return NextResponse.json({ error: 'خطأ في حذف السحب' }, { status: 500 });
  }
}
