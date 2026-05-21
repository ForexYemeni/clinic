'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, Wallet, TrendingUp, TrendingDown, ArrowRight, RefreshCw, Clock, Banknote,
  Plus, X, Trash2, AlertTriangle, User, CheckCircle2, XCircle, FileText, Send,
  ArrowDownLeft, Phone, MessageSquare, Copy, Check, Calendar
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { type NurseItem, formatCurrency, formatDate } from '@/lib/constants';
import { apiGet } from '@/lib/api';
import { toast } from 'sonner';

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

interface SalaryData {
  nurse: { name: string; phone: string; salary: number; active: boolean; createdAt?: string };
  salary: number;
  totalWithdrawals: number;
  totalDebts: number;
  remainingBalance: number;
  withdrawals: WithdrawalItem[];
  pendingCount: number;
}

export function AdminNurseSalary() {
  const { setScreen, selectedNurseId: storeNurseId } = useAppStore();
  const [nurses, setNurses] = useState<NurseItem[]>([]);
  const [selectedNurseId, setSelectedNurseId] = useState<string>('');
  const [salaryData, setSalaryData] = useState<SalaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingNurse, setLoadingNurse] = useState(false);

  // Add withdrawal state
  const [showAddWithdrawal, setShowAddWithdrawal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalDesc, setWithdrawalDesc] = useState('');
  const [withdrawalType, setWithdrawalType] = useState<'cash' | 'deduction'>('cash');
  const [addingWithdrawal, setAddingWithdrawal] = useState(false);

  // Edit salary state
  const [showEditSalary, setShowEditSalary] = useState(false);
  const [newSalary, setNewSalary] = useState('');
  const [savingSalary, setSavingSalary] = useState(false);

  // Delete withdrawal state
  const [deleteWithdrawalId, setDeleteWithdrawalId] = useState<string | null>(null);

  // Approve/Reject state
  const [reviewItem, setReviewItem] = useState<WithdrawalItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewing, setReviewing] = useState(false);

  // Tab filter
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'debts'>('all');

  const fetchNurses = useCallback(async () => {
    try {
      const res = await fetch('/api/users?role=nurse');
      if (res.ok) {
        const data = await res.json();
        setNurses(data);
        if (storeNurseId) {
          setSelectedNurseId(storeNurseId);
        } else if (data.length > 0 && !selectedNurseId) {
          const nurseWithSalary = data.find((n: NurseItem) => (n.salary || 0) > 0);
          if (nurseWithSalary) {
            setSelectedNurseId(nurseWithSalary.id);
          } else {
            setSelectedNurseId(data[0].id);
          }
        }
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [storeNurseId, selectedNurseId]);

  const fetchSalaryData = useCallback(async (nurseId: string) => {
    setLoadingNurse(true);
    try {
      const result = await apiGet<SalaryData>(`/api/salary?nurseId=${nurseId}`);
      setSalaryData(result);
    } catch {
      setSalaryData(null);
    } finally {
      setLoadingNurse(false);
    }
  }, []);

  useEffect(() => { fetchNurses(); }, [fetchNurses]);

  useEffect(() => {
    if (selectedNurseId) {
      fetchSalaryData(selectedNurseId);
    }
  }, [selectedNurseId, fetchSalaryData]);

  const handleAddWithdrawal = async () => {
    if (!withdrawalAmount || Number(withdrawalAmount) <= 0) {
      toast.error('أدخل مبلغ صحيح');
      return;
    }
    if (!selectedNurseId) return;

    setAddingWithdrawal(true);
    try {
      const res = await fetch('/api/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nurseId: selectedNurseId,
          amount: Number(withdrawalAmount),
          description: withdrawalDesc || undefined,
          type: withdrawalType,
          requestedBy: 'admin',
        }),
      });

      if (res.ok) {
        toast.success('تم تسجيل السحب بنجاح');
        setShowAddWithdrawal(false);
        setWithdrawalAmount('');
        setWithdrawalDesc('');
        fetchSalaryData(selectedNurseId);
      } else {
        const data = await res.json();
        toast.error(data.error || 'خطأ في تسجيل السحب');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    } finally {
      setAddingWithdrawal(false);
    }
  };

  const handleDeleteWithdrawal = async (id: string) => {
    try {
      const res = await fetch(`/api/salary?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('تم حذف السحب');
        setDeleteWithdrawalId(null);
        if (selectedNurseId) fetchSalaryData(selectedNurseId);
      }
    } catch {
      toast.error('خطأ في الحذف');
    }
  };

  const handleUpdateSalary = async () => {
    if (!newSalary || Number(newSalary) < 0) {
      toast.error('أدخل راتب صحيح');
      return;
    }
    if (!selectedNurseId) return;

    setSavingSalary(true);
    try {
      const res = await fetch(`/api/users/${selectedNurseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salary: Number(newSalary) }),
      });
      if (res.ok) {
        toast.success('تم تحديث الراتب');
        setShowEditSalary(false);
        fetchSalaryData(selectedNurseId);
        fetchNurses();
      } else {
        toast.error('خطأ في تحديث الراتب');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    } finally {
      setSavingSalary(false);
    }
  };

  const handleReviewRequest = async (action: 'approve' | 'reject') => {
    if (!reviewItem) return;

    setReviewing(true);
    try {
      const res = await fetch('/api/salary', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reviewItem.id,
          action,
          rejectionReason: action === 'reject' ? rejectionReason : undefined,
        }),
      });

      if (res.ok) {
        toast.success(action === 'approve' ? 'تمت الموافقة على الطلب' : 'تم رفض الطلب');
        setReviewItem(null);
        setRejectionReason('');
        if (selectedNurseId) fetchSalaryData(selectedNurseId);
      } else {
        const data = await res.json();
        toast.error(data.error || 'خطأ في معالجة الطلب');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    } finally {
      setReviewing(false);
    }
  };

  const selectedNurse = nurses.find(n => n.id === selectedNurseId);
  const salary = salaryData?.salary || 0;
  const totalWithdrawn = salaryData?.totalWithdrawals || 0;
  const totalDebts = salaryData?.totalDebts || 0;
  const remaining = salaryData?.remainingBalance || 0;
  const withdrawalPercentage = salary > 0 ? Math.min((totalWithdrawn / salary) * 100, 100) : 0;

  const allWithdrawals = salaryData?.withdrawals || [];
  const pendingRequests = allWithdrawals.filter(w => w.status === 'pending');
  const debts = allWithdrawals.filter(w => (w.type === 'debt' || w.isDebt) && (w.status === 'approved' || !w.status));

  let displayItems: WithdrawalItem[] = [];
  if (activeTab === 'all') {
    displayItems = allWithdrawals;
  } else if (activeTab === 'pending') {
    displayItems = pendingRequests;
  } else if (activeTab === 'debts') {
    displayItems = debts;
  }

  if (loading) {
    return <div className="p-4 space-y-3 pb-24">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>;
  }

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setScreen('admin-nurses')} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-xl border border-border shadow-sm active:scale-[0.97] transition-all">
          <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-foreground" />
          </div>
          <span className="text-sm font-medium">رجوع</span>
        </button>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Wallet className="w-5 h-5 text-clinic-500" />
          إدارة الرواتب
        </h2>
      </div>

      {/* Nurse Selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {nurses.map(nurse => (
          <button
            key={nurse.id}
            onClick={() => { setSelectedNurseId(nurse.id); setSalaryData(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              selectedNurseId === nurse.id
                ? 'bg-clinic-600 text-white shadow-lg shadow-clinic-600/20'
                : 'bg-white dark:bg-gray-800 text-muted-foreground border border-border'
            } ${!nurse.active ? 'opacity-60' : ''}`}
          >
            <User className="w-4 h-4" />
            {nurse.name}
            {(nurse.salary || 0) > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                selectedNurseId === nurse.id ? 'bg-white/20' : 'bg-clinic-100 dark:bg-clinic-900/30 text-clinic-600'
              }`}>
                {formatCurrency(nurse.salary || 0)}
              </span>
            )}
            {/* Pending indicator */}
            {selectedNurseId === nurse.id && salaryData?.pendingCount && salaryData.pendingCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-bold">
                {salaryData.pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loadingNurse && (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>
      )}

      {!loadingNurse && selectedNurse && (
        <>
          {/* Pending Requests Alert */}
          {pendingRequests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-4 text-white shadow-lg shadow-amber-500/20 relative overflow-hidden"
            >
              <div className="absolute -top-6 -left-6 w-20 h-20 bg-white/5 rounded-full" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{pendingRequests.length} طلب سحب قيد المراجعة</p>
                    <p className="text-[10px] text-white/80">بانتظار موافقتك أو رفضك</p>
                  </div>
                </div>

                {/* Quick review for pending items */}
                <div className="space-y-2">
                  {pendingRequests.map(req => (
                    <div key={req.id} className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{formatCurrency(req.amount)}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/20">
                            {req.withdrawalMethod === 'transfer' ? 'تحويل' : 'نقدي'}
                          </span>
                        </div>
                        <span className="text-[10px] text-white/70">{formatDate(req.createdAt)}</span>
                      </div>
                      {req.withdrawalMethod === 'transfer' && req.walletName && (
                        <div className="bg-white/10 rounded-lg p-2 mb-2 space-y-1">
                          <p className="text-[10px] text-white/60 font-bold">بيانات التحويل</p>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-white/70">المحفظة: <span className="text-white font-medium">{req.walletName}</span></span>
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-white/70">الجوال: <span className="text-white font-medium" dir="ltr">{req.walletPhone}</span></span>
                            <button
                              onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(req.walletPhone || ''); toast.success('تم نسخ رقم الجوال'); }}
                              className="flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-md text-white/90 active:scale-95 transition-transform"
                            >
                              <Copy className="w-2.5 h-2.5" />
                              نسخ
                            </button>
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-white/70">الاسم: <span className="text-white font-medium">{req.walletOwner}</span></span>
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-white/70">المبلغ: <span className="text-white font-bold">{formatCurrency(req.amount)}</span></span>
                            <button
                              onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(String(req.amount)); toast.success('تم نسخ المبلغ'); }}
                              className="flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-md text-white/90 active:scale-95 transition-transform"
                            >
                              <Copy className="w-2.5 h-2.5" />
                              نسخ
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setReviewItem(req)}
                          className="flex-1 h-8 bg-white/20 text-white rounded-lg text-xs font-medium backdrop-blur-sm active:scale-[0.97] transition-transform flex items-center justify-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          مراجعة
                        </button>
                        <button
                          onClick={() => { setReviewItem(req); handleReviewRequest('approve'); }}
                          disabled={reviewing}
                          className="flex-1 h-8 bg-white text-green-600 rounded-lg text-xs font-bold active:scale-[0.97] transition-transform shadow-sm disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          موافقة
                        </button>
                        <button
                          onClick={() => setReviewItem(req)}
                          className="flex-1 h-8 bg-white/20 text-white rounded-lg text-xs font-medium backdrop-blur-sm active:scale-[0.97] transition-transform flex items-center justify-center gap-1"
                        >
                          <XCircle className="w-3 h-3" />
                          رفض
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Salary Overview Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-gradient-to-br from-clinic-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-clinic-500/20 relative overflow-hidden"
          >
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-white/5 rounded-full" />
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />

            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 opacity-80" />
                  <span className="text-sm opacity-80">راتب {selectedNurse.name}</span>
                </div>
                <button
                  onClick={() => { setNewSalary(String(salary)); setShowEditSalary(true); }}
                  className="text-[10px] bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm font-medium active:scale-95 transition-transform"
                >
                  تعديل الراتب
                </button>
              </div>

              <p className="text-3xl font-bold mb-2">{formatCurrency(salary)}</p>

              {/* Employment Start Date */}
              {salaryData?.nurse?.createdAt && (
                <div className="flex items-center gap-2 mb-4 bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
                  <Calendar className="w-4 h-4 text-white/70" />
                  <div>
                    <p className="text-[9px] text-white/60">تاريخ بداية التوظيف</p>
                    <p className="text-xs font-bold text-white/90">{formatDate(salaryData.nurse.createdAt)}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingDown className="w-3 h-3 text-red-300" />
                    <span className="text-[9px] text-white/70">المسحوب</span>
                  </div>
                  <p className="text-sm font-bold text-red-200">{formatCurrency(totalWithdrawn)}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <FileText className="w-3 h-3 text-amber-300" />
                    <span className="text-[9px] text-white/70">مديونيات</span>
                  </div>
                  <p className="text-sm font-bold text-amber-200">{formatCurrency(totalDebts)}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className="w-3 h-3 text-green-300" />
                    <span className="text-[9px] text-white/70">المتبقي</span>
                  </div>
                  <p className={`text-sm font-bold ${remaining >= 0 ? 'text-green-200' : 'text-red-200'}`}>{formatCurrency(remaining)}</p>
                </div>
              </div>

              {salary > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-white/70">نسبة السحب</span>
                    <span className="text-[10px] font-bold">{Math.round(withdrawalPercentage)}%</span>
                  </div>
                  <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-700 ${
                        withdrawalPercentage >= 90 ? 'bg-red-400' :
                        withdrawalPercentage >= 60 ? 'bg-yellow-400' :
                        'bg-green-400'
                      }`}
                      style={{ width: `${withdrawalPercentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Review Withdrawal Request Card */}
          <AnimatePresence>
            {reviewItem && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 shadow-lg shadow-indigo-500/20 relative overflow-hidden"
              >
                <div className="absolute -top-6 -left-6 w-20 h-20 bg-white/5 rounded-full" />

                <button
                  onClick={() => { setReviewItem(null); setRejectionReason(''); }}
                  className="absolute top-3 left-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center z-10"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>

                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">مراجعة طلب السحب</p>
                      <p className="text-[10px] text-white/70">{selectedNurse.name} - {formatCurrency(reviewItem.amount)}</p>
                    </div>
                  </div>

                  {/* Request details */}
                  <div className="bg-white/10 rounded-xl p-3 mb-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/70">المبلغ</span>
                      <span className="font-bold text-white">{formatCurrency(reviewItem.amount)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/70">الطريقة</span>
                      <span className="font-medium text-white">{reviewItem.withdrawalMethod === 'transfer' ? 'تحويل' : 'نقدي'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/70">التاريخ</span>
                      <span className="text-white">{formatDate(reviewItem.createdAt)}</span>
                    </div>
                    {reviewItem.description && (
                      <div className="flex justify-between text-xs">
                        <span className="text-white/70">الوصف</span>
                        <span className="text-white">{reviewItem.description}</span>
                      </div>
                    )}
                  </div>

                  {/* Transfer details - with copyable fields */}
                  {reviewItem.withdrawalMethod === 'transfer' && reviewItem.walletName && (
                    <div className="bg-white/10 rounded-xl p-3 mb-3">
                      <p className="text-[10px] font-bold text-white/70 mb-2">بيانات التحويل</p>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">المحفظة</span>
                          <span className="text-white font-medium">{reviewItem.walletName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">رقم الجوال</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-sm" dir="ltr">{reviewItem.walletPhone}</span>
                            <button
                              onClick={() => { navigator.clipboard.writeText(reviewItem.walletPhone || ''); toast.success('تم نسخ رقم الجوال'); }}
                              className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-lg text-white/90 text-[10px] active:scale-95 transition-transform backdrop-blur-sm"
                            >
                              <Copy className="w-3 h-3" />
                              نسخ
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">اسم صاحب المحفظة</span>
                          <span className="text-white font-medium">{reviewItem.walletOwner}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-white/10">
                          <span className="text-white/60">المبلغ</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-sm">{formatCurrency(reviewItem.amount)}</span>
                            <button
                              onClick={() => { navigator.clipboard.writeText(String(reviewItem.amount)); toast.success('تم نسخ المبلغ'); }}
                              className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-lg text-white/90 text-[10px] active:scale-95 transition-transform backdrop-blur-sm"
                            >
                              <Copy className="w-3 h-3" />
                              نسخ
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rejection reason input */}
                  <div className="mb-3">
                    <label className="text-[10px] text-white/70 mb-1 block">سبب الرفض (اختياري عند الرفض)</label>
                    <input
                      type="text"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="أدخل سبب الرفض..."
                      className="w-full h-10 px-4 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReviewRequest('approve')}
                      disabled={reviewing}
                      className="flex-1 h-10 bg-green-500 text-white rounded-xl text-sm font-bold active:scale-[0.97] transition-transform shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {reviewing ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      موافقة
                    </button>
                    <button
                      onClick={() => handleReviewRequest('reject')}
                      disabled={reviewing}
                      className="flex-1 h-10 bg-white text-red-600 rounded-xl text-sm font-bold active:scale-[0.97] transition-transform shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      رفض
                    </button>
                    <button
                      onClick={() => { setReviewItem(null); setRejectionReason(''); }}
                      className="flex-1 h-10 bg-white/20 text-white rounded-xl text-sm font-medium backdrop-blur-sm active:scale-[0.97] transition-transform"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add Withdrawal Button */}
          <div className="mb-4">
            <AnimatePresence mode="wait">
              {showAddWithdrawal ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-blue-700 dark:text-blue-300">تسجيل سحب جديد</h3>
                    <button onClick={() => setShowAddWithdrawal(false)} className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                      <X className="w-3.5 h-3.5 text-blue-500" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Type selector */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setWithdrawalType('cash')}
                        className={`flex-1 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          withdrawalType === 'cash'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white dark:bg-gray-800 text-muted-foreground border border-border'
                        }`}
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        سحب نقدي
                      </button>
                      <button
                        onClick={() => setWithdrawalType('deduction')}
                        className={`flex-1 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          withdrawalType === 'deduction'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-white dark:bg-gray-800 text-muted-foreground border border-border'
                        }`}
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        خصم من الراتب
                      </button>
                    </div>

                    {/* Amount */}
                    <input
                      type="number"
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      placeholder="المبلغ (ر.ي)"
                      className="w-full h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      dir="ltr"
                    />

                    {/* Description */}
                    <input
                      type="text"
                      value={withdrawalDesc}
                      onChange={(e) => setWithdrawalDesc(e.target.value)}
                      placeholder="الوصف (اختياري)"
                      className="w-full h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {/* Remaining info */}
                    {remaining > 0 && withdrawalAmount && (
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 text-xs">
                        <div className="flex justify-between mb-1">
                          <span className="text-muted-foreground">المتبقي بعد السحب</span>
                          <span className={`font-bold ${remaining - Number(withdrawalAmount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(remaining - Number(withdrawalAmount))}
                          </span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleAddWithdrawal}
                      disabled={addingWithdrawal || !withdrawalAmount}
                      className="w-full h-10 bg-blue-600 text-white rounded-xl text-sm font-bold active:scale-[0.97] transition-transform disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {addingWithdrawal ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      تسجيل السحب
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="btn"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  onClick={() => setShowAddWithdrawal(true)}
                  className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 border-2 border-dashed border-blue-200 dark:border-blue-900/40 flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 active:scale-[0.98] transition-transform shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-sm font-bold">تسجيل سحب من راتب {selectedNurse.name}</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Edit Salary Card */}
          <AnimatePresence>
            {showEditSalary && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-4 bg-gradient-to-br from-clinic-500 to-teal-600 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden"
              >
                <div className="absolute -top-6 -left-6 w-20 h-20 bg-white/5 rounded-full" />
                <button
                  onClick={() => setShowEditSalary(false)}
                  className="absolute top-3 left-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center z-10"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>

                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">تعديل الراتب</p>
                      <p className="text-[10px] text-white/70">{selectedNurse.name}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="number"
                      value={newSalary}
                      onChange={(e) => setNewSalary(e.target.value)}
                      placeholder="الراتب الشهري الجديد"
                      className="w-full h-11 px-4 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
                      dir="ltr"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateSalary}
                        disabled={savingSalary}
                        className="flex-1 h-10 bg-white text-clinic-600 rounded-xl text-sm font-bold active:scale-[0.97] transition-transform shadow-sm disabled:opacity-50"
                      >
                        {savingSalary ? 'جارٍ الحفظ...' : 'حفظ الراتب'}
                      </button>
                      <button
                        onClick={() => setShowEditSalary(false)}
                        className="flex-1 h-10 bg-white/20 text-white rounded-xl text-sm font-medium backdrop-blur-sm active:scale-[0.97] transition-transform"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Delete Withdrawal Confirmation */}
          <AnimatePresence>
            {deleteWithdrawalId && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-4 shadow-lg shadow-amber-500/20 relative overflow-hidden"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">حذف السحب</p>
                    <p className="text-[10px] text-white/80">سيتم إعادة المبلغ لرصيد الممرض</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeleteWithdrawal(deleteWithdrawalId)}
                    className="flex-1 h-9 bg-white text-amber-600 rounded-xl text-sm font-bold active:scale-[0.97] transition-transform shadow-sm"
                  >
                    نعم، حذف
                  </button>
                  <button
                    onClick={() => setDeleteWithdrawalId(null)}
                    className="flex-1 h-9 bg-white/20 text-white rounded-xl text-sm font-medium backdrop-blur-sm active:scale-[0.97] transition-transform"
                  >
                    إلغاء
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tab Filter */}
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {[
              { id: 'all' as const, label: 'الكل', count: allWithdrawals.length },
              { id: 'pending' as const, label: 'قيد المراجعة', count: pendingRequests.length },
              { id: 'debts' as const, label: 'مديونيات', count: debts.length },
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

          {/* Withdrawal History */}
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold">سجل السحوبات</h3>
            {allWithdrawals.length > 0 && (
              <span className="text-[10px] text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                {allWithdrawals.length} عملية
              </span>
            )}
          </div>

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
                              : w.type === 'cash'
                              ? 'bg-red-50 dark:bg-red-900/20'
                              : 'bg-amber-50 dark:bg-amber-900/20'
                          }`}>
                            {w.status === 'pending' ? (
                              <Clock className="w-5 h-5 text-amber-500" />
                            ) : w.status === 'rejected' ? (
                              <XCircle className="w-5 h-5 text-red-500" />
                            ) : w.isDebt || w.type === 'debt' ? (
                              <FileText className="w-5 h-5 text-amber-500" />
                            ) : (
                              <Banknote className={`w-5 h-5 ${w.type === 'cash' ? 'text-red-500' : 'text-amber-500'}`} />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold">
                              {w.isDebt || w.type === 'debt'
                                ? `مديونية - ${w.patientName || 'مريض'}`
                                : w.description || (w.type === 'cash' ? 'سحب نقدي' : 'خصم من الراتب')
                              }
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <p className="text-[10px] text-muted-foreground">{formatDate(w.createdAt)}</p>
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
                              {!w.status && w.type !== 'debt' && !w.isDebt && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                                  w.type === 'cash'
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                }`}>
                                  {w.type === 'cash' ? 'نقدي' : 'خصم'}
                                </span>
                              )}
                              {w.withdrawalMethod === 'transfer' && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 flex items-center gap-0.5">
                                  <ArrowDownLeft className="w-2.5 h-2.5" />
                                  تحويل
                                </span>
                              )}
                              {w.requestedBy === 'nurse' && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                  طلب ممرض
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-red-600 dark:text-red-400">
                            -{formatCurrency(w.amount)}
                          </p>
                          <button
                            onClick={() => setDeleteWithdrawalId(w.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>

                      {/* Transfer details - copyable in history */}
                      {w.withdrawalMethod === 'transfer' && w.walletName && (
                        <div className="mt-2 bg-purple-50 dark:bg-purple-900/10 rounded-lg p-2 text-xs">
                          <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 mb-1">بيانات التحويل</p>
                          <div className="space-y-1">
                            {w.walletName && <p className="text-muted-foreground">المحفظة: <span className="text-foreground font-medium">{w.walletName}</span></p>}
                            {w.walletPhone && (
                              <div className="flex items-center justify-between">
                                <p className="text-muted-foreground">الجوال: <span className="text-foreground font-medium" dir="ltr">{w.walletPhone}</span></p>
                                <button
                                  onClick={() => { navigator.clipboard.writeText(w.walletPhone || ''); toast.success('تم نسخ رقم الجوال'); }}
                                  className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 rounded-md text-purple-700 dark:text-purple-300 active:scale-95 transition-transform"
                                >
                                  <Copy className="w-2.5 h-2.5" />
                                  نسخ
                                </button>
                              </div>
                            )}
                            {w.walletOwner && <p className="text-muted-foreground">الاسم: <span className="text-foreground font-medium">{w.walletOwner}</span></p>}
                            <div className="flex items-center justify-between pt-1 border-t border-purple-100 dark:border-purple-900/20">
                              <p className="text-muted-foreground">المبلغ: <span className="text-foreground font-bold">{formatCurrency(w.amount)}</span></p>
                              <button
                                onClick={() => { navigator.clipboard.writeText(String(w.amount)); toast.success('تم نسخ المبلغ'); }}
                                className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 rounded-md text-purple-700 dark:text-purple-300 active:scale-95 transition-transform"
                              >
                                <Copy className="w-2.5 h-2.5" />
                                نسخ
                              </button>
                            </div>
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
                          <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70 mt-1">
                            تم تسديد الفاتورة بالكامل وخصم المبلغ من راتب الممرض
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
                  <p className="text-muted-foreground text-sm">لا توجد سحوبات بعد</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
