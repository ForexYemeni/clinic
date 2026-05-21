'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, Wallet, TrendingUp, TrendingDown, ArrowRight, RefreshCw,
  Clock, Banknote, Plus, X, Send, Phone, User as UserIcon,
  FileText, AlertCircle, CheckCircle2, XCircle, ChevronDown,
  CreditCard, ArrowDownLeft, Calendar
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/constants';
import { apiGet } from '@/lib/api';
import { toast } from 'sonner';

interface SalaryData {
  nurse: { name: string; phone: string; salary: number; active: boolean; createdAt?: string };
  salary: number;
  totalWithdrawals: number;
  totalDebts: number;
  remainingBalance: number;
  withdrawals: WithdrawalItem[];
  pendingCount: number;
}

interface WithdrawalItem {
  id: string;
  amount: number;
  description: string;
  type: string;
  status?: string;
  withdrawalMethod?: string;
  walletName?: string;
  walletPhone?: string;
  walletOwner?: string;
  isDebt?: boolean;
  invoiceId?: string;
  patientName?: string;
  rejectionReason?: string;
  requestedBy?: string;
  createdAt: string;
}

export function NurseSalary() {
  const { user, setScreen } = useAppStore();
  const [data, setData] = useState<SalaryData | null>(null);
  const [loading, setLoading] = useState(true);

  // Withdrawal request state
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestType, setRequestType] = useState<'cash' | 'transfer'>('cash');
  const [requestAmount, setRequestAmount] = useState('');
  const [requestDesc, setRequestDesc] = useState('');
  // Transfer fields
  const [walletName, setWalletName] = useState('');
  const [walletPhone, setWalletPhone] = useState('');
  const [walletOwner, setWalletOwner] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filter state
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'debts' | 'rejected'>('all');

  const fetchSalary = useCallback(async () => {
    if (!user?.id) return;
    try {
      const result = await apiGet<SalaryData>(`/api/salary?nurseId=${user.id}`);
      setData(result);
    } catch (err: any) {
      toast.error('خطأ في تحميل بيانات الراتب');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchSalary(); }, [fetchSalary]);

  const handleSubmitRequest = async () => {
    if (!requestAmount || Number(requestAmount) <= 0) {
      toast.error('أدخل مبلغ صحيح');
      return;
    }

    if (requestType === 'transfer') {
      if (!walletName.trim()) { toast.error('أدخل اسم المحفظة'); return; }
      if (!walletPhone.trim()) { toast.error('أدخل رقم الجوال'); return; }
      if (!walletOwner.trim()) { toast.error('أدخل اسم صاحب المحفظة'); return; }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nurseId: user?.id,
          amount: Number(requestAmount),
          description: requestDesc || undefined,
          type: 'cash',
          withdrawalMethod: requestType,
          walletName: requestType === 'transfer' ? walletName : undefined,
          walletPhone: requestType === 'transfer' ? walletPhone : undefined,
          walletOwner: requestType === 'transfer' ? walletOwner : undefined,
          requestedBy: 'nurse',
        }),
      });

      if (res.ok) {
        toast.success('تم إرسال طلب السحب بنجاح');
        setShowRequestForm(false);
        setRequestAmount('');
        setRequestDesc('');
        setWalletName('');
        setWalletPhone('');
        setWalletOwner('');
        fetchSalary();
      } else {
        const result = await res.json();
        toast.error(result.error || 'خطأ في إرسال الطلب');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-4 space-y-3 pb-24">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>;
  }

  const salary = data?.salary || 0;
  const totalWithdrawn = data?.totalWithdrawals || 0;
  const totalDebts = data?.totalDebts || 0;
  const remaining = data?.remainingBalance || 0;
  const withdrawalPercentage = salary > 0 ? Math.min((totalWithdrawn / salary) * 100, 100) : 0;

  const allWithdrawals = data?.withdrawals || [];
  const pendingRequests = allWithdrawals.filter(w => w.status === 'pending');
  const rejectedWithdrawals = allWithdrawals.filter(w => w.status === 'rejected');
  const debts = allWithdrawals.filter(w => (w.type === 'debt' || w.isDebt) && (w.status === 'approved' || !w.status));
  const approvedWithdrawals = allWithdrawals.filter(w => w.status !== 'pending' && w.type !== 'debt' && !w.isDebt);

  // Filtered display
  let displayItems: WithdrawalItem[] = [];
  if (activeTab === 'all') {
    displayItems = allWithdrawals;
  } else if (activeTab === 'pending') {
    displayItems = pendingRequests;
  } else if (activeTab === 'debts') {
    displayItems = debts;
  } else if (activeTab === 'rejected') {
    displayItems = rejectedWithdrawals;
  }

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setScreen('nurse-more')} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-xl border border-border shadow-sm active:scale-[0.97] transition-all">
          <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-foreground" />
          </div>
          <span className="text-sm font-medium">رجوع</span>
        </button>
        <div className="flex-1" />
        <button
          onClick={fetchSalary}
          className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center active:scale-95 transition-transform"
        >
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Wallet className="w-5 h-5 text-clinic-500" />
        راتبي
      </h2>

      {/* Salary Overview Card - Payslip style */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 bg-gradient-to-br from-clinic-500 to-teal-600 rounded-2xl text-white shadow-lg shadow-clinic-500/20 relative overflow-hidden"
      >
        {/* Decorative */}
        <div className="absolute -top-6 -left-6 w-24 h-24 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 -right-4 w-16 h-16 bg-white/5 rounded-full" />

        {/* Payslip header band */}
        <div className="bg-white/10 px-5 py-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 opacity-80" />
              <span className="text-sm font-bold">كشف راتب</span>
            </div>
            <span className="text-xs opacity-70">{new Date().toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>

        <div className="relative p-5">
          {/* Employment Start Date */}
          {data?.nurse?.createdAt && (
            <div className="flex items-center gap-2 mb-4 bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
              <Calendar className="w-4 h-4 text-white/70" />
              <div>
                <p className="text-[9px] text-white/60">تاريخ بداية التوظيف</p>
                <p className="text-xs font-bold text-white/90">{formatDate(data.nurse.createdAt)}</p>
              </div>
            </div>
          )}

          {/* Salary amount */}
          <div className="text-center mb-4">
            <p className="text-[10px] text-white/60 mb-1">الراتب الشهري</p>
            <p className="text-4xl font-bold">{formatCurrency(salary)}</p>
          </div>

          {/* Visual salary breakdown with icons */}
          <div className="space-y-2.5">
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-red-400/30 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-red-200" />
                </div>
                <div>
                  <p className="text-[9px] text-white/60">المسحوب</p>
                  <p className="text-sm font-bold text-red-200">{formatCurrency(totalWithdrawn)}</p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-[9px] text-white/50">من الراتب</p>
                <p className="text-xs font-bold text-red-200">{salary > 0 ? Math.round(withdrawalPercentage) : 0}%</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-amber-400/30 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-amber-200" />
                </div>
                <div>
                  <p className="text-[9px] text-white/60">مديونيات</p>
                  <p className="text-sm font-bold text-amber-200">{formatCurrency(totalDebts)}</p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-[9px] text-white/50">فواتير مسددة</p>
                <p className="text-xs font-bold text-amber-200">{allWithdrawals.filter(w => w.isDebt || w.type === 'debt').length} فاتورة</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-green-400/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-200" />
                </div>
                <div>
                  <p className="text-[9px] text-white/60">المتبقي</p>
                  <p className={`text-sm font-bold ${remaining >= 0 ? 'text-green-200' : 'text-red-200'}`}>{formatCurrency(remaining)}</p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-[9px] text-white/50">متاح للسحب</p>
                <p className={`text-xs font-bold ${remaining >= 0 ? 'text-green-200' : 'text-red-200'}`}>{salary > 0 ? Math.round(((salary - totalWithdrawn) / salary) * 100) : 0}%</p>
              </div>
            </div>
          </div>

          {/* Progress bar with gradient fill and animation */}
          {salary > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-white/70">نسبة السحب من الراتب</span>
                <span className="text-[10px] font-bold text-white/90">{Math.round(withdrawalPercentage)}%</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${withdrawalPercentage}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  className={`h-full rounded-full ${
                    withdrawalPercentage >= 90 ? 'bg-gradient-to-l from-red-400 to-red-500' :
                    withdrawalPercentage >= 60 ? 'bg-gradient-to-l from-yellow-400 to-amber-500' :
                    'bg-gradient-to-l from-green-400 to-emerald-500'
                  }`}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick preview of recent withdrawals */}
      {approvedWithdrawals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-border"
        >
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Banknote className="w-4 h-4 text-red-500" />
            آخر السحوبات
          </h3>
          <div className="space-y-2">
            {approvedWithdrawals.slice(0, 3).map((w) => (
              <div key={w.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                    <Banknote className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">{w.description || 'سحب من الراتب'}</p>
                    <p className="text-[10px] text-muted-foreground">{formatDate(w.createdAt)}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-red-600 dark:text-red-400">-{formatCurrency(w.amount)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Pending Requests Alert */}
      {pendingRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-3.5 border border-amber-200 dark:border-amber-800"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                {pendingRequests.length} طلب قيد المراجعة
              </p>
              <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70">
                بانتظار موافقة إدارة العيادة
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Rejected Withdrawals Alert */}
      {rejectedWithdrawals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 bg-red-50 dark:bg-red-900/20 rounded-2xl p-3.5 border border-red-200 dark:border-red-800"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-700 dark:text-red-300">
                {rejectedWithdrawals.length} طلب مرفوض
              </p>
              <p className="text-[10px] text-red-600/70 dark:text-red-400/70">
                {rejectedWithdrawals[0]?.rejectionReason || 'تم رفض الطلب من قبل الإدارة'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Withdrawal Request Button */}
      <div className="mb-4">
        <AnimatePresence mode="wait">
          {showRequestForm ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 shadow-lg shadow-blue-500/20 relative overflow-hidden"
            >
              {/* Decorative */}
              <div className="absolute -top-6 -left-6 w-20 h-20 bg-white/5 rounded-full" />
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/5 rounded-full" />

              {/* Close button */}
              <button
                onClick={() => setShowRequestForm(false)}
                className="absolute top-3 left-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center z-10"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>

              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Send className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">طلب سحب من الراتب</p>
                    <p className="text-[10px] text-white/70">سيتم مراجعة طلبك من قبل الإدارة</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Withdrawal Method Selector */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRequestType('cash')}
                      className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        requestType === 'cash'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'bg-white/10 text-white/80 border border-white/20'
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      سحب نقدي
                    </button>
                    <button
                      onClick={() => setRequestType('transfer')}
                      className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        requestType === 'transfer'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'bg-white/10 text-white/80 border border-white/20'
                      }`}
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      سحب عبر تحويل
                    </button>
                  </div>

                  {/* Amount Input */}
                  <div>
                    <label className="text-[10px] text-white/70 mb-1 block">المبلغ (ر.ي)</label>
                    <input
                      type="number"
                      value={requestAmount}
                      onChange={(e) => setRequestAmount(e.target.value)}
                      placeholder="0"
                      className="w-full h-11 px-4 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm font-bold text-lg"
                      dir="ltr"
                    />
                  </div>

                  {/* Remaining info */}
                  {remaining > 0 && requestAmount && (
                    <div className="bg-white/10 rounded-xl p-2.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-white/70">المتبقي بعد السحب</span>
                        <span className={`font-bold ${remaining - Number(requestAmount) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                          {formatCurrency(remaining - Number(requestAmount))}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <label className="text-[10px] text-white/70 mb-1 block">ملاحظات (اختياري)</label>
                    <input
                      type="text"
                      value={requestDesc}
                      onChange={(e) => setRequestDesc(e.target.value)}
                      placeholder="سبب السحب أو ملاحظات..."
                      className="w-full h-10 px-4 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
                    />
                  </div>

                  {/* Transfer Details */}
                  <AnimatePresence>
                    {requestType === 'transfer' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 overflow-hidden"
                      >
                        <div className="bg-white/10 rounded-xl p-3">
                          <p className="text-[10px] text-white/70 mb-2 font-bold">بيانات التحويل</p>
                          <div className="space-y-2.5">
                            <div className="relative">
                              <Wallet className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                              <input
                                type="text"
                                value={walletName}
                                onChange={(e) => setWalletName(e.target.value)}
                                placeholder="اسم المحفظة (مثال: محفظة جيب)"
                                className="w-full h-10 pr-10 pl-3 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                              />
                            </div>
                            <div className="relative">
                              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                              <input
                                type="tel"
                                value={walletPhone}
                                onChange={(e) => setWalletPhone(e.target.value)}
                                placeholder="رقم الجوال"
                                className="w-full h-10 pr-10 pl-3 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                                dir="ltr"
                              />
                            </div>
                            <div className="relative">
                              <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                              <input
                                type="text"
                                value={walletOwner}
                                onChange={(e) => setWalletOwner(e.target.value)}
                                placeholder="اسم صاحب المحفظة"
                                className="w-full h-10 pr-10 pl-3 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSubmitRequest}
                      disabled={submitting || !requestAmount}
                      className="flex-1 h-11 bg-white text-blue-600 rounded-xl text-sm font-bold active:scale-[0.97] transition-transform shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {submitting ? (
                        <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      إرسال الطلب
                    </button>
                    <button
                      onClick={() => setShowRequestForm(false)}
                      className="flex-1 h-11 bg-white/20 text-white rounded-xl text-sm font-medium backdrop-blur-sm active:scale-[0.97] transition-transform"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="btn"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              onClick={() => setShowRequestForm(true)}
              className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 border-2 border-dashed border-blue-200 dark:border-blue-900/40 flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 active:scale-[0.98] transition-transform shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm font-bold">طلب سحب من الراتب</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Tab Filter */}
      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {[
          { id: 'all' as const, label: 'الكل', count: allWithdrawals.length },
          { id: 'pending' as const, label: 'قيد المراجعة', count: pendingRequests.length },
          { id: 'debts' as const, label: 'مديونيات', count: debts.length },
          { id: 'rejected' as const, label: 'مرفوضة', count: rejectedWithdrawals.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id ? 'bg-clinic-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-[10px] px-1.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Transaction History */}
      <div className="space-y-3">
        <AnimatePresence>
          {displayItems.length > 0 ? (
            displayItems.map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-white dark:bg-gray-800 rounded-2xl border overflow-hidden shadow-sm ${
                  w.status === 'pending'
                    ? 'border-amber-200 dark:border-amber-800'
                    : w.status === 'rejected'
                    ? 'border-red-200 dark:border-red-800 opacity-60'
                    : w.isDebt || w.type === 'debt'
                    ? 'border-amber-200 dark:border-amber-800'
                    : 'border-border'
                }`}
              >
                <div className="p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        w.status === 'pending'
                          ? 'bg-amber-50 dark:bg-amber-900/20'
                          : w.status === 'rejected'
                          ? 'bg-red-50 dark:bg-red-900/20'
                          : w.isDebt || w.type === 'debt'
                          ? 'bg-amber-50 dark:bg-amber-900/20'
                          : 'bg-red-50 dark:bg-red-900/20'
                      }`}>
                        {w.status === 'pending' ? (
                          <Clock className="w-5 h-5 text-amber-500" />
                        ) : w.status === 'rejected' ? (
                          <XCircle className="w-5 h-5 text-red-500" />
                        ) : w.isDebt || w.type === 'debt' ? (
                          <FileText className="w-5 h-5 text-amber-500" />
                        ) : (
                          <Banknote className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold">
                          {w.isDebt || w.type === 'debt'
                            ? `مديونية - ${w.patientName || 'مريض'}`
                            : w.description || 'سحب من الراتب'
                          }
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <p className="text-[10px] text-muted-foreground">{formatDate(w.createdAt)}</p>
                          {/* Status badge */}
                          {w.status === 'pending' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              قيد المراجعة
                            </span>
                          )}
                          {w.status === 'approved' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              تمت الموافقة
                            </span>
                          )}
                          {w.status === 'rejected' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              مرفوض
                            </span>
                          )}
                          {/* Withdrawal method badge */}
                          {w.withdrawalMethod === 'transfer' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 flex items-center gap-0.5">
                              <ArrowDownLeft className="w-2.5 h-2.5" />
                              تحويل
                            </span>
                          )}
                          {(!w.withdrawalMethod || w.withdrawalMethod === 'cash') && !w.isDebt && w.type !== 'debt' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              نقدي
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-red-600 dark:text-red-400">
                        -{formatCurrency(w.amount)}
                      </p>
                    </div>
                  </div>

                  {/* Transfer details */}
                  {w.withdrawalMethod === 'transfer' && w.walletName && (
                    <div className="mt-2 bg-purple-50 dark:bg-purple-900/10 rounded-lg p-2 text-xs">
                      <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 mb-1">بيانات التحويل</p>
                      <div className="space-y-0.5">
                        {w.walletName && <p className="text-muted-foreground">المحفظة: <span className="text-foreground font-medium">{w.walletName}</span></p>}
                        {w.walletPhone && <p className="text-muted-foreground">الجوال: <span className="text-foreground font-medium" dir="ltr">{w.walletPhone}</span></p>}
                        {w.walletOwner && <p className="text-muted-foreground">الاسم: <span className="text-foreground font-medium">{w.walletOwner}</span></p>}
                      </div>
                    </div>
                  )}

                  {/* Debt details */}
                  {(w.isDebt || w.type === 'debt') && w.patientName && (
                    <div className="mt-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg p-2.5 text-xs">
                      <div className="flex items-center gap-1.5 mb-1">
                        <FileText className="w-3 h-3 text-amber-600" />
                        <p className="text-amber-700 dark:text-amber-300 font-bold">مديونية - فاتورة مسددة</p>
                      </div>
                      <p className="text-muted-foreground">
                        فاتورة مريض: <span className="text-foreground font-bold">{w.patientName}</span>
                      </p>
                      {w.invoiceId && (
                        <p className="text-muted-foreground mt-0.5">
                          رقم الفاتورة: <span className="text-foreground font-medium" dir="ltr">{w.invoiceId.slice(-8)}</span>
                        </p>
                      )}
                      <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70 mt-1">
                        تم تسديد الفاتورة بالكامل وخصم المبلغ من راتبك
                      </p>
                    </div>
                  )}

                  {/* Rejection reason */}
                  {w.status === 'rejected' && w.rejectionReason && (
                    <div className="mt-2 bg-red-50 dark:bg-red-900/10 rounded-lg p-2 text-xs">
                      <p className="text-red-600 dark:text-red-400">
                        سبب الرفض: {w.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">
                {activeTab === 'pending' ? 'لا توجد طلبات قيد المراجعة' :
                 activeTab === 'debts' ? 'لا توجد مديونيات' :
                 activeTab === 'rejected' ? 'لا توجد طلبات مرفوضة' :
                 'لا توجد سحوبات بعد'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {activeTab === 'all' ? 'ستظهر هنا سحوباتك من الراتب' : ''}
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
