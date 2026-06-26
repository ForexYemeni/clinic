// ═══════════════════════════════════════════════════════════
// 💰 Salary API (Prisma + PostgreSQL)
// Transaction types: withdrawal/cash, deposit (transfer to bank, deducted),
//                    deduction, debt (invoice paid on behalf), bonus (added to balance)
// ═══════════════════════════════════════════════════════════

import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';

function isDeposit(tx: any): boolean { return tx.type === 'deposit'; }
function isDebt(tx: any): boolean { return tx.type === 'debt' || tx.isDebt === true; }
function isBonus(tx: any): boolean { return tx.type === 'bonus'; }

// GET: List salary transactions (?nurseId=xxx, filtered by clinicId)
export async function GET(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { searchParams } = new URL(request.url);
    const nurseId = searchParams.get('nurseId') || '';

    if (!effectiveClinicId) return NextResponse.json([]);

    const where: any = { clinicId: effectiveClinicId };
    if (nurseId) where.nurseId = nurseId;

    const results = await prisma.salaryWithdrawal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const transactions = results;

    // If nurseId provided, also return nurse info and computed totals
    if (nurseId) {
      const nurse = await prisma.user.findUnique({ where: { id: nurseId } });
      const nurseData = nurse
        ? {
            name: nurse.name || '',
            phone: nurse.phone || '',
            salary: nurse.salary || 0,
            active: nurse.active !== false,
            createdAt: nurse.createdAt.toISOString(),
          }
        : {};

      const baseSalary = nurse?.salary || 0;
      const totalDeducted = transactions
        .filter((t) => !isBonus(t) && t.status !== 'rejected')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalBonuses = transactions
        .filter((t) => isBonus(t) && t.status !== 'rejected')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const remainingBalance = baseSalary - totalDeducted + totalBonuses;

      return NextResponse.json({
        nurse: nurseData,
        salary: baseSalary,
        totalDeducted,
        totalBonuses,
        remainingBalance,
        withdrawals: transactions,
        transactions,
      });
    }

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Salary list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب معاملات الراتب' }, { status: 500 });
  }
}

// POST: Add new salary transaction
export async function POST(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const body = await request.json();
    const {
      nurseId, nurseName, amount, type, bonusType, description,
      withdrawalMethod, walletName, walletPhone, walletOwner,
      notes, createdBy, requestedBy,
    } = body;

    if (!nurseId || !amount) {
      return NextResponse.json({ error: 'يرجى تحديد الممرض والمبلغ' }, { status: 400 });
    }
    if (!effectiveClinicId) {
      return NextResponse.json({ error: 'لم يتم تحديد العيادة' }, { status: 400 });
    }
    if (Number(amount) <= 0) {
      return NextResponse.json({ error: 'المبلغ يجب أن يكون أكبر من صفر' }, { status: 400 });
    }

    // Verify nurse belongs to clinic
    const nurse = await prisma.user.findUnique({ where: { id: nurseId } });
    if (!nurse || nurse.clinicId !== effectiveClinicId) {
      return NextResponse.json({ error: 'الممرض غير موجود في هذه العيادة' }, { status: 404 });
    }

    const txType = type || 'withdrawal';
    const txAmount = Number(amount);
    const isBonusTx = txType === 'bonus';

    // For non-bonus transactions: check nurse has enough balance
    if (!isBonusTx) {
      const baseSalary = nurse.salary || 0;
      const allTxns = await prisma.salaryWithdrawal.findMany({
        where: { nurseId, status: { not: 'rejected' } },
      });
      const totalDeducted = allTxns.filter((t) => t.type !== 'bonus').reduce((s, t) => s + t.amount, 0);
      const totalBonuses = allTxns.filter((t) => t.type === 'bonus').reduce((s, t) => s + t.amount, 0);
      const currentBalance = baseSalary - totalDeducted + totalBonuses;
      if (txAmount > currentBalance) {
        return NextResponse.json({
          error: `الرصيد غير كافٍ. رصيد الممرض الحالي: ${currentBalance.toLocaleString('ar-YE')} ر.ي`,
        }, { status: 400 });
      }
    }

    // Create transaction (status approved by default for admin-initiated)
    const created = await prisma.salaryWithdrawal.create({
      data: {
        nurseId,
        nurseName: nurseName || nurse.name,
        amount: txAmount,
        type: txType as any,
        bonusType: bonusType || 'bonus',
        description: description || '',
        status: 'approved',
        withdrawalMethod: withdrawalMethod || 'cash',
        walletName: walletName || '',
        walletPhone: walletPhone || '',
        walletOwner: walletOwner || '',
        isDebt: txType === 'debt',
        requestedBy: requestedBy || 'admin',
        createdBy: createdBy || auth?.userId || '',
        approvedAt: new Date(),
        approvedBy: auth?.userId || '',
        notes: notes || '',
        clinicId: effectiveClinicId,
      },
    });

    // Compute new remaining balance
    const baseSalary = nurse.salary || 0;
    const allTxnsAfter = await prisma.salaryWithdrawal.findMany({
      where: { nurseId, status: { not: 'rejected' } },
    });
    const totalDeductedAfter = allTxnsAfter.filter((t) => t.type !== 'bonus').reduce((s, t) => s + t.amount, 0);
    const totalBonusesAfter = allTxnsAfter.filter((t) => t.type === 'bonus').reduce((s, t) => s + t.amount, 0);
    const newRemaining = baseSalary - totalDeductedAfter + totalBonusesAfter;

    return NextResponse.json({
      ...created,
      newRemaining,
    }, { status: 201 });
  } catch (error) {
    console.error('Create salary transaction error:', error);
    return NextResponse.json({ error: 'خطأ في حفظ المعاملة' }, { status: 500 });
  }
}

// PUT: Update transaction status (approve/reject pending requests)
export async function PUT(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const body = await request.json();
    const { id, status, rejectionReason, reviewedBy } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'يرجى تحديد المعاملة والحالة' }, { status: 400 });
    }
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 });
    }

    const txn = await prisma.salaryWithdrawal.findUnique({ where: { id } });
    if (!txn) {
      return NextResponse.json({ error: 'المعاملة غير موجودة' }, { status: 404 });
    }
    if (!effectiveClinicId || txn.clinicId !== effectiveClinicId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const updated = await prisma.salaryWithdrawal.update({
      where: { id },
      data: {
        status,
        reviewedBy: reviewedBy || auth?.userId || '',
        reviewedAt: new Date(),
        rejectionReason: status === 'rejected' ? (rejectionReason || '') : '',
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update salary transaction error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث المعاملة' }, { status: 500 });
  }
}
