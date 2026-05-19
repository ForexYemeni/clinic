'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Wallet, TrendingUp, TrendingDown, ArrowRight, RefreshCw, Clock, Banknote, Plus, X, Trash2, AlertTriangle, User } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { type NurseItem, formatCurrency, formatDate } from '@/lib/constants';
import { apiGet } from '@/lib/api';
import { toast } from 'sonner';

interface SalaryData {
  nurse: { name: string; phone: string; salary: number; active: boolean };
  salary: number;
  totalWithdrawals: number;
  remainingBalance: number;
  withdrawals: { id: string; amount: number; description: string; type: string; createdAt: string }[];
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

  const fetchNurses = useCallback(async () => {
    try {
      const res = await fetch('/api/users?role=nurse');
      if (res.ok) {
        const data = await res.json();
        setNurses(data);
        // Use store's selectedNurseId if available, otherwise auto-select first nurse
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

  const selectedNurse = nurses.find(n => n.id === selectedNurseId);
  const salary = salaryData?.salary || 0;
  const totalWithdrawn = salaryData?.totalWithdrawals || 0;
  const remaining = salaryData?.remainingBalance || 0;
  const withdrawalPercentage = salary > 0 ? Math.min((totalWithdrawn / salary) * 100, 100) : 0;

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
          </button>
        ))}
      </div>

      {loadingNurse && (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>
      )}

      {!loadingNurse && selectedNurse && (
        <>
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

              <p className="text-3xl font-bold mb-4">{formatCurrency(salary)}</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingDown className="w-3.5 h-3.5 text-red-300" />
                    <span className="text-[10px] text-white/70">المسحوب</span>
                  </div>
                  <p className="text-lg font-bold text-red-200">{formatCurrency(totalWithdrawn)}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-green-300" />
                    <span className="text-[10px] text-white/70">المتبقي</span>
                  </div>
                  <p className={`text-lg font-bold ${remaining >= 0 ? 'text-green-200' : 'text-red-200'}`}>{formatCurrency(remaining)}</p>
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

          {/* Withdrawal History */}
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold">سجل السحوبات</h3>
            {salaryData?.withdrawals && salaryData.withdrawals.length > 0 && (
              <span className="text-[10px] text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                {salaryData.withdrawals.length} عملية
              </span>
            )}
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {salaryData?.withdrawals && salaryData.withdrawals.length > 0 ? (
                salaryData.withdrawals.map((w, i) => (
                  <motion.div
                    key={w.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-border overflow-hidden shadow-sm"
                  >
                    <div className="p-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            w.type === 'cash'
                              ? 'bg-red-50 dark:bg-red-900/20'
                              : 'bg-amber-50 dark:bg-amber-900/20'
                          }`}>
                            <Banknote className={`w-5 h-5 ${
                              w.type === 'cash' ? 'text-red-500' : 'text-amber-500'
                            }`} />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{w.description || (w.type === 'cash' ? 'سحب نقدي' : 'خصم من الراتب')}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <p className="text-[10px] text-muted-foreground">{formatDate(w.createdAt)}</p>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                                w.type === 'cash'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              }`}>
                                {w.type === 'cash' ? 'نقدي' : 'خصم'}
                              </span>
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
