import dbConnect from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';
import SalaryWithdrawal from '@/models/SalaryWithdrawal';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { toClient, toClientList } from '@/lib/mongoose-helpers';

// Helper: determine if a transaction is a deposit (added to nurse account) or a withdrawal
function isDeposit(tx: any): boolean {
  return tx.type === 'deposit';
}

// Helper: determine if a transaction is a debt (invoice paid on behalf of nurse)
function isDebt(tx: any): boolean {
  return tx.type === 'debt' || tx.isDebt === true;
}

// GET: List salary transactions (?nurseId=xxx, filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { searchParams } = new URL(request.url);
    const nurseId = searchParams.get('nurseId') || '';

    if (!effectiveClinicId) {
      return NextResponse.json([]);
    }

    let filter: Record<string, any> = { clinicId: effectiveClinicId };
    if (nurseId) {
      filter.nurseId = nurseId;
    }

    let results;
    try {
      results = await SalaryWithdrawal.find(filter)
        .sort({ createdAt: -1 })
        .lean();
    } catch {
      try {
        results = await SalaryWithdrawal.find(filter).lean();
      } catch {
        // Last resort
        const allResults = await SalaryWithdrawal.find({ clinicId: effectiveClinicId }).lean();
        results = nurseId
          ? allResults.filter(d => d.nurseId === nurseId)
          : allResults;
      }
    }

    const transactions = toClientList(results).sort((a: any, b: any) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });

    // If nurseId provided, also get nurse info and salary
    if (nurseId) {
      let nurseData: any = {};
      try {
        const nurseDoc = await User.findById(nurseId).lean();
        if (nurseDoc !== null) {
          const nd = toClient(nurseDoc);
          nurseData = {
            name: nd.name || '',
            phone: nd.phone || '',
            salary: nd.salary || 0,
            active: nd.active !== false,
            createdAt: nd.createdAt || '',
          };
        }
      } catch {}

      // Approved (or legacy without status) transactions
      const approved = transactions.filter((t: any) => t.status === 'approved' || !t.status);

      // Withdrawals = money taken OUT of salary (includes regular withdrawals + debts + deductions)
      // Does NOT include deposits (which ADD to nurse account but still come from salary)
      // Note: a "deposit" is still subtracted from the salary pool, but it's labeled as a deposit
      // to the nurse's personal account. We count both withdrawals and deposits against salary balance.
      const withdrawals = approved.filter((t: any) => !isDeposit(t) && !isDebt(t));
      const totalWithdrawals = withdrawals.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

      const debts = approved.filter((t: any) => isDebt(t));
      const totalDebts = debts.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

      // Deposits = money transferred/deposited to nurse's account (wallet/cash given to nurse)
      // These DO count against salary balance (they are paid out from the salary pool)
      const deposits = approved.filter((t: any) => isDeposit(t));
      const totalDeposits = deposits.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

      // Total deducted from salary = withdrawals + debts + deposits
      const totalDeducted = totalWithdrawals + totalDebts + totalDeposits;

      // Pending requests count (only nurse-initiated withdrawal requests, not deposits)
      const pendingRequests = transactions.filter((t: any) => t.status === 'pending');

      return NextResponse.json({
        nurse: nurseData,
        salary: nurseData.salary || 0,
        totalWithdrawals,
        totalDebts,
        totalDeposits,
        totalDeducted,
        remainingBalance: (nurseData.salary || 0) - totalDeducted,
        withdrawals: transactions,
        pendingCount: pendingRequests.length,
      });
    }

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Salary transactions list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب بيانات المعاملات' }, { status: 500 });
  }
}

// POST: Add a salary transaction (withdrawal, deposit, or debt)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
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
    const nurseDoc = await User.findById(nurseId).lean();
    if (nurseDoc === null) {
      return NextResponse.json({ error: 'الممرض غير موجود' }, { status: 404 });
    }

    const nurseData = toClient(nurseDoc);
    if (nurseData.clinicId !== effectiveClinicId && auth?.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    // Determine status based on who initiated
    // Nurse requests are pending, admin additions are approved immediately
    const status = requestedBy === 'nurse' ? 'pending' : 'approved';

    // Resolve the transaction type:
    // - 'deposit'  -> admin transferred money to nurse's account (still deducted from salary)
    // - 'debt'     -> invoice paid on behalf of nurse
    // - 'withdrawal' / 'cash' / 'deduction' -> normal salary withdrawal
    let resolvedType: string = type || 'withdrawal';
    if (isDebt || type === 'debt') {
      resolvedType = 'debt';
    } else if (type === 'deposit') {
      resolvedType = 'deposit';
    } else if (!type) {
      resolvedType = 'withdrawal';
    }

    // If admin transfers money to nurse's wallet/account, treat as deposit to nurse account
    // (still deducted from salary balance, but labeled as a deposit)
    if (requestedBy === 'admin' && withdrawalMethod === 'transfer' && resolvedType !== 'debt') {
      resolvedType = 'deposit';
    }

    // Calculate current balance (only approved transactions of all types - they all reduce salary)
    const existingTransactions = await SalaryWithdrawal.find({
      nurseId: nurseId,
      clinicId: effectiveClinicId,
    }).lean();

    const totalDeducted = existingTransactions
      .filter(doc => {
        const d = toClient(doc);
        return d.status === 'approved' || !d.status;
      })
      .reduce((sum, doc) => sum + (toClient(doc).amount || 0), 0);

    const salary = nurseData.salary || 0;
    const remaining = salary - totalDeducted;

    // Nurse-specific validation: check amount against salary and available balance
    if (requestedBy === 'nurse') {
      // Cannot request more than total salary
      if (Number(amount) > salary) {
        return NextResponse.json({
          error: 'لا يمكن طلب سلفة أكبر من راتبك الشهري',
        }, { status: 400 });
      }

      // Calculate available balance accounting for pending requests
      const pendingAmount = existingTransactions
        .filter(doc => toClient(doc).status === 'pending')
        .reduce((sum, doc) => sum + (toClient(doc).amount || 0), 0);
      const nurseRemaining = remaining - pendingAmount;

      if (Number(amount) > nurseRemaining && salary > 0) {
        return NextResponse.json({
          error: `المبلغ يتجاوز رصيدك المتاح. الرصيد المتبقي: ${nurseRemaining.toLocaleString('ar-YE')} ر.ي`,
          remaining: nurseRemaining,
        }, { status: 400 });
      }
    }

    // Only check balance for approved (immediate) transactions by admin
    // Pending requests by nurses don't immediately deduct
    if (status === 'approved' && Number(amount) > remaining && salary > 0) {
      return NextResponse.json({
        error: `المبلغ يتجاوز الرصيد المتاح. الرصيد المتبقي: ${remaining.toLocaleString('ar-YE')} ر.ي`,
        remaining,
      }, { status: 400 });
    }

    // Build description based on type if not provided
    let finalDescription = description || '';
    if (!finalDescription) {
      if (resolvedType === 'deposit') {
        finalDescription = withdrawalMethod === 'transfer'
          ? 'تحويل إلى حساب الممرض'
          : 'إيداع نقدي في حساب الممرض';
      } else if (resolvedType === 'debt') {
        finalDescription = 'مديونية';
      } else if (resolvedType === 'cash') {
        finalDescription = 'سحب نقدي';
      } else if (resolvedType === 'deduction') {
        finalDescription = 'خصم من الراتب';
      } else {
        finalDescription = 'سحب من الراتب';
      }
    }

    const txData: any = {
      nurseId,
      nurseName: nurseData.name || '',
      clinicId: effectiveClinicId,
      amount: Number(amount),
      description: finalDescription,
      type: resolvedType,
      withdrawalMethod: withdrawalMethod || 'cash',
      status,
      requestedBy: requestedBy || 'admin',
      createdBy: auth?.userId || '',
    };

    // Add wallet details for transfer
    if (withdrawalMethod === 'transfer') {
      txData.walletName = walletName || '';
      txData.walletPhone = walletPhone || '';
      txData.walletOwner = walletOwner || '';
    }

    // Add debt assignment details
    if (resolvedType === 'debt') {
      txData.isDebt = true;
      txData.invoiceId = invoiceId || '';
      txData.patientName = patientName || '';
    }

    const created = await SalaryWithdrawal.create(txData);
    const createdId = created._id.toString();

    // Create notification for admin when nurse requests withdrawal
    if (requestedBy === 'nurse') {
      try {
        const methodLabel = withdrawalMethod === 'transfer' ? 'تحويل' : 'نقدي';
        await Notification.create({
          clinicId: effectiveClinicId,
          type: 'salary_request',
          title: 'طلب سحب من الراتب',
          message: `${nurseData.name} طلب سحب ${Number(amount).toLocaleString('ar-YE')} ر.ي (${methodLabel})`,
          nurseId,
          nurseName: nurseData.name || '',
          withdrawalId: createdId,
          amount: Number(amount),
          withdrawalMethod: withdrawalMethod || 'cash',
          read: false,
        });
      } catch (e) {
        console.error('Failed to create notification:', e);
      }
    }

    // Return updated balance info (for approved transactions)
    const newTotalDeducted = status === 'approved' ? totalDeducted + Number(amount) : totalDeducted;
    const newRemaining = salary - newTotalDeducted;

    return NextResponse.json({
      id: createdId,
      ...toClient(created.toObject()),
      salary,
      totalWithdrawn: newTotalDeducted,
      remainingBalance: newRemaining,
    }, { status: 201 });
  } catch (error) {
    console.error('Salary transaction create error:', error);
    return NextResponse.json({ error: 'خطأ في تسجيل المعاملة' }, { status: 500 });
  }
}

// PUT: Approve or reject a pending withdrawal request
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const body = await request.json();
    const { id, action, rejectionReason } = body;

    if (!id) {
      return NextResponse.json({ error: 'يرجى تحديد الطلب' }, { status: 400 });
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 });
    }

    const doc = await SalaryWithdrawal.findById(id).lean();
    if (doc === null) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    const data = toClient(doc);
    if (data.clinicId !== effectiveClinicId && auth?.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    if (data.status !== 'pending') {
      return NextResponse.json({ error: 'تم معالجة هذا الطلب مسبقاً' }, { status: 400 });
    }

    // If approving, check if balance is sufficient
    if (action === 'approve') {
      const existingTransactions = await SalaryWithdrawal.find({
        nurseId: data.nurseId,
        clinicId: effectiveClinicId,
      }).lean();

      const totalDeducted = existingTransactions
        .filter(d => {
          const wd = toClient(d);
          return (wd.status === 'approved' || !wd.status) && wd.id !== id;
        })
        .reduce((sum, d) => sum + (toClient(d).amount || 0), 0);

      const nurseDoc = await User.findById(data.nurseId).lean();
      const salary = nurseDoc !== null ? (toClient(nurseDoc).salary || 0) : 0;
      const remaining = salary - totalDeducted;

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
      reviewedAt: new Date(),
    };

    if (action === 'approve') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = auth?.userId || '';
    } else {
      updateData.rejectedBy = auth?.userId || '';
    }

    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    await SalaryWithdrawal.findByIdAndUpdate(id, { $set: updateData });

    // Notify the nurse about the decision
    try {
      const statusLabel = action === 'approve' ? 'موافق' : 'مرفوض';
      await Notification.create({
        clinicId: effectiveClinicId,
        type: 'salary_response',
        title: `طلب السحب ${statusLabel}`,
        message: action === 'approve'
          ? `تمت الموافقة على طلب سحب ${data.amount.toLocaleString('ar-YE')} ر.ي`
          : `تم رفض طلب سحب ${data.amount.toLocaleString('ar-YE')} ر.ي${rejectionReason ? ` - السبب: ${rejectionReason}` : ''}`,
        userId: data.nurseId,
        withdrawalId: id,
        read: false,
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
    console.error('Salary transaction update error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث الطلب' }, { status: 500 });
  }
}

// DELETE: Delete a salary transaction
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { searchParams } = new URL(request.url);
    const withdrawalId = searchParams.get('id');

    if (!withdrawalId) {
      return NextResponse.json({ error: 'يرجى تحديد المعاملة' }, { status: 400 });
    }

    const doc = await SalaryWithdrawal.findById(withdrawalId).lean();
    if (doc === null) {
      return NextResponse.json({ error: 'المعاملة غير موجودة' }, { status: 404 });
    }

    const data = toClient(doc);
    if (data.clinicId !== effectiveClinicId && auth?.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    await SalaryWithdrawal.findByIdAndDelete(withdrawalId);

    return NextResponse.json({ success: true, id: withdrawalId });
  } catch (error) {
    console.error('Salary transaction delete error:', error);
    return NextResponse.json({ error: 'خطأ في حذف المعاملة' }, { status: 500 });
  }
}
