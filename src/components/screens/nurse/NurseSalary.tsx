'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Wallet, TrendingUp, TrendingDown, ArrowRight, RefreshCw, Clock, Banknote } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/constants';
import { apiGet } from '@/lib/api';
import { toast } from 'sonner';

interface SalaryData {
  nurse: { name: string; phone: string; salary: number; active: boolean };
  salary: number;
  totalWithdrawals: number;
  remainingBalance: number;
  withdrawals: { id: string; amount: number; description: string; type: string; createdAt: string }[];
}

export function NurseSalary() {
  const { user, setScreen } = useAppStore();
  const [data, setData] = useState<SalaryData | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="p-4 space-y-3 pb-24">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>;
  }

  const salary = data?.salary || 0;
  const totalWithdrawn = data?.totalWithdrawals || 0;
  const remaining = data?.remainingBalance || 0;
  const withdrawalPercentage = salary > 0 ? Math.min((totalWithdrawn / salary) * 100, 100) : 0;

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

      {/* Salary Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 bg-gradient-to-br from-clinic-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-clinic-500/20 relative overflow-hidden"
      >
        {/* Decorative */}
        <div className="absolute -top-6 -left-6 w-24 h-24 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 opacity-80" />
            <span className="text-sm opacity-80">الراتب الشهري</span>
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
              <p className="text-lg font-bold text-green-200">{formatCurrency(remaining)}</p>
            </div>
          </div>

          {/* Progress bar */}
          {salary > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-white/70">نسبة السحب من الراتب</span>
                <span className="text-[10px] font-bold text-white/90">{Math.round(withdrawalPercentage)}%</span>
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

      {/* Withdrawal History */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold">سجل السحوبات</h3>
        {data?.withdrawals && data.withdrawals.length > 0 && (
          <span className="text-[10px] text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
            {data.withdrawals.length} عملية
          </span>
        )}
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {data?.withdrawals && data.withdrawals.length > 0 ? (
            data.withdrawals.map((w, i) => (
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
                      <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                        <Banknote className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{w.description || 'سحب من الراتب'}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <p className="text-[10px] text-muted-foreground">{formatDate(w.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-red-600 dark:text-red-400">
                        -{formatCurrency(w.amount)}
                      </p>
                      {w.type === 'cash' && (
                        <span className="text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                          نقدي
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">لا توجد سحوبات بعد</p>
              <p className="text-xs text-muted-foreground mt-1">ستظهر هنا سحوباتك من الراتب</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
