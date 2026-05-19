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

      const totalWithdrawals = withdrawals.reduce((sum: number, w: any) => sum + (w.amount || 0), 0);

      return NextResponse.json({
        nurse: nurseData,
        salary: nurseData.salary || 0,
        totalWithdrawals,
        remainingBalance: (nurseData.salary || 0) - totalWithdrawals,
        withdrawals,
      });
    }

    return NextResponse.json(withdrawals);
  } catch (error) {
    console.error('Salary withdrawals list error:', error);
    return NextResponse.json({ error: 'خطأ في جلب بيانات السحوبات' }, { status: 500 });
  }
}

// POST: Add a salary withdrawal
export async function POST(request: NextRequest) {
  try {
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const body = await request.json();
    const { nurseId, amount, description, type } = body;

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

    // Calculate current balance
    const existingWithdrawals = await adminDb.collection('salaryWithdrawals')
      .where('nurseId', '==', nurseId)
      .where('clinicId', '==', effectiveClinicId)
      .get();

    const totalWithdrawn = existingWithdrawals.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
    const salary = nurseData.salary || 0;
    const remaining = salary - totalWithdrawn;

    if (Number(amount) > remaining && salary > 0) {
      return NextResponse.json({
        error: `المبلغ يتجاوز الرصيد المتاح. الرصيد المتبقي: ${remaining.toLocaleString('ar-YE')} ر.ي`,
        remaining,
      }, { status: 400 });
    }

    const withdrawalData = {
      nurseId,
      nurseName: nurseData.name || '',
      clinicId: effectiveClinicId,
      amount: Number(amount),
      description: description || (type === 'cash' ? 'سحب نقدي' : 'سحب من الراتب'),
      type: type || 'cash',
      createdBy: auth?.userId || '',
      createdAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('salaryWithdrawals').add(withdrawalData);

    // Return updated balance info
    const newTotalWithdrawn = totalWithdrawn + Number(amount);
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
