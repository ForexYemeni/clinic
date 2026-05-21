'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, AlertTriangle, Activity, DollarSign, TrendingUp, Clock, Stethoscope, ChevronLeft, Wallet, Bell, Calendar, CreditCard, Heart } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatRelativeTime, severityLabels, severityColors, type DashboardData, type EmergencyItem, formatDate } from '@/lib/constants';
import { PwaInstallBanner } from '@/components/shared/PwaInstallPrompt';

interface PendingWithdrawal {
  id: string;
  nurseName: string;
  amount: number;
  withdrawalMethod: string;
  walletName?: string;
  walletPhone?: string;
  createdAt: string;
}

export function AdminDashboard() {
  const { setScreen, clinicId, clinicName } = useAppStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<PendingWithdrawal[]>([]);

  // Get today's date in Arabic
  const todayDate = useMemo(() => {
    return new Date().toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/dashboard?role=admin');
        if (res.ok) {
          const d = await res.json();
          setData(d);
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch pending withdrawal requests
  useEffect(() => {
    const fetchPendingWithdrawals = async () => {
      try {
        const nursesRes = await fetch('/api/users?role=nurse');
        if (!nursesRes.ok) return;
        const nurses = await nursesRes.json();

        const allPending: PendingWithdrawal[] = [];
        for (const nurse of nurses) {
          try {
            const res = await fetch(`/api/salary?nurseId=${nurse.id}`);
            if (res.ok) {
              const salaryData = await res.json();
              const pending = (salaryData.withdrawals || []).filter(
                (w: any) => w.status === 'pending'
              );
              for (const w of pending) {
                allPending.push({
                  id: w.id,
                  nurseName: w.nurseName || nurse.name,
                  amount: w.amount,
                  withdrawalMethod: w.withdrawalMethod || 'cash',
                  walletName: w.walletName,
                  walletPhone: w.walletPhone,
                  createdAt: w.createdAt,
                });
              }
            }
          } catch {}
        }
        setPendingWithdrawals(allPending);
      } catch {}
    };
    fetchPendingWithdrawals();
    const interval = setInterval(fetchPendingWithdrawals, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => [
    { label: 'إجمالي المرضى', value: data?.totalPatients || 0, icon: Users, gradient: 'from-clinic-500 to-clinic-600', onClick: () => setScreen('admin-patients'), trend: data?.totalPatients ? '↑' : undefined },
    { label: 'طوارئ نشطة', value: data?.activeEmergencies || 0, icon: AlertTriangle, gradient: 'from-red-500 to-red-600', onClick: () => setScreen('admin-emergencies'), trend: data?.activeEmergencies ? '↑' : '↓' },
    { label: 'خدمات اليوم', value: data?.todayServices || 0, icon: Activity, gradient: 'from-teal-500 to-clinic-600', onClick: () => setScreen('admin-services'), trend: data?.todayServices ? '↑' : '↓' },
    { label: 'إيرادات اليوم', value: data?.todayRevenue || 0, icon: DollarSign, gradient: 'from-amber-500 to-amber-600', isCurrency: true, onClick: () => setScreen('admin-finance'), trend: data?.todayRevenue ? '↑' : '↓' },
  ], [data, setScreen]);

  // Monthly revenue target (configurable, default 100000)
  const monthlyTarget = 100000;
  const monthlyProgress = data?.monthlyRevenue ? Math.min((data.monthlyRevenue / monthlyTarget) * 100, 100) : 0;

  if (loading) {
    return (
      <div className="p-4 space-y-4 pb-24">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 pb-24">
      {/* PWA Install Banner - Prominent at top */}
      <PwaInstallBanner />

      {/* Professional Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-l from-clinic-500 to-teal-600 rounded-2xl p-4 text-white shadow-lg shadow-clinic-500/20 relative overflow-hidden"
      >
        {/* Decorative circles */}
        <div className="absolute -top-6 -left-6 w-24 h-24 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm opacity-80">مرحباً</p>
              <p className="text-lg font-bold">{clinicName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
            <Calendar className="w-4 h-4 text-white/70" />
            <p className="text-xs text-white/90">{todayDate}</p>
          </div>
          <p className="text-xs text-white/70 mt-2">
            {data?.todayServices || 0} خدمة اليوم • {data?.activeEmergencies || 0} حالة طوارئ
          </p>
        </div>
      </motion.div>

      {/* Subscription Status Widget - Compact bar when days > 15, full widget when <= 15 */}
      {data?.subscription && data?.subscriptionCheck && data.subscription.type !== 'lifetime' && (
        data.subscriptionCheck.daysRemaining <= 15 ? (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-4 text-white shadow-lg relative overflow-hidden ${
              data.subscriptionCheck.daysRemaining <= 3
                ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/25'
                : data.subscriptionCheck.daysRemaining <= 7
                ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/25'
                : 'bg-gradient-to-br from-blue-500 to-indigo-500 shadow-blue-500/25'
            }`}
          >
            <div className="absolute -top-6 -left-6 w-20 h-20 bg-white/5 rounded-full" />
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/5 rounded-full" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 opacity-80" />
                  <span className="text-sm font-bold opacity-90">
                    {data.subscription.type === 'trial' ? 'فترة تجريبية' : data.subscription.type === 'monthly' ? 'اشتراك شهري' : data.subscription.type === 'yearly' ? 'اشتراك سنوي' : 'اشتراك'}
                  </span>
                </div>
                {!data.subscriptionCheck.valid && (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-white/20 font-bold">منتهي</span>
                )}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold">
                    {data.subscriptionCheck.daysRemaining > 0 ? data.subscriptionCheck.daysRemaining : 0}
                  </p>
                  <p className="text-xs opacity-80">يوم متبقي</p>
                </div>
                {data.subscription.endDate && (
                  <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm text-left">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-white/70" />
                      <div>
                        <p className="text-[9px] text-white/60">تاريخ الانتهاء</p>
                        <p className="text-xs font-bold text-white/90">{formatDate(data.subscription.endDate)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {data.subscriptionCheck.daysRemaining <= 7 && data.subscriptionCheck.daysRemaining > 0 && (
                <div className="mt-3 bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-yellow-200" />
                    <p className="text-[10px] text-white/80">ينتهي الاشتراك قريباً! تواصل مع الإدارة الرئيسية للتمديد</p>
                  </div>
                </div>
              )}
              {data.subscriptionCheck.daysRemaining <= 0 && (
                <div className="mt-3 bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-200" />
                    <p className="text-[10px] text-white/80">انتهى الاشتراك! تواصل مع الإدارة الرئيسية للتجديد</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 flex items-center justify-between border border-green-200 dark:border-green-800"
          >
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-green-700 dark:text-green-300">
                الاشتراك نشط • {data.subscriptionCheck.daysRemaining} يوم متبقي
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-bold">
              {data.subscription.type === 'trial' ? 'تجريبي' : data.subscription.type === 'monthly' ? 'شهري' : 'سنوي'}
            </span>
          </motion.div>
        )
      )}

      {/* Pending Withdrawal Requests Banner */}
      <AnimatePresence>
        {pendingWithdrawals.length > 0 && (
          <motion.button
            initial={{ opacity: 0, y: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            onClick={() => setScreen('admin-nurse-salary')}
            className="w-full bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-4 text-white shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-transform relative overflow-hidden"
          >
            <div className="absolute -top-6 -left-6 w-20 h-20 bg-white/5 rounded-full" />
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/5 rounded-full" />

            <div className="relative flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm relative">
                <Wallet className="w-6 h-6 text-white" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-amber-600 text-[10px] font-bold flex items-center justify-center shadow-sm">
                  {pendingWithdrawals.length}
                </span>
              </div>
              <div className="flex-1 text-right">
                <p className="text-sm font-bold">
                  {pendingWithdrawals.length} طلب سحب قيد المراجعة
                </p>
                <p className="text-[10px] text-white/80">
                  {pendingWithdrawals.length === 1
                    ? `${pendingWithdrawals[0].nurseName} يطلب ${formatCurrency(pendingWithdrawals[0].amount)}${pendingWithdrawals[0].withdrawalMethod === 'transfer' ? ' (تحويل)' : ' (نقدي)'}`
                    : `من ${new Set(pendingWithdrawals.map(w => w.nurseName)).size} ممرض`}
                </p>
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <ChevronLeft className="w-4 h-4 text-white" />
              </div>
            </div>

            {pendingWithdrawals.length === 1 && pendingWithdrawals[0].withdrawalMethod === 'transfer' && pendingWithdrawals[0].walletPhone && (
              <div className="relative mt-3 bg-white/10 rounded-lg p-2.5 backdrop-blur-sm">
                <p className="text-[10px] text-white/70 mb-1">بيانات التحويل:</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/80">جوال: <span className="font-bold text-white" dir="ltr">{pendingWithdrawals[0].walletPhone}</span></span>
                  <span className="text-white/80">مبلغ: <span className="font-bold text-white">{formatCurrency(pendingWithdrawals[0].amount)}</span></span>
                </div>
              </div>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => (
          <motion.button
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={stat.onClick}
            className={`bg-gradient-to-br ${stat.gradient} rounded-2xl p-4 text-white text-right shadow-lg active:scale-[0.97] transition-transform hover:scale-[1.02]`}
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <stat.icon className="w-5 h-5" />
              </div>
              {stat.trend && (
                <span className={`text-xs font-bold ${stat.trend === '↑' ? 'text-green-200' : 'text-red-200'}`}>
                  {stat.trend}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold mt-2">
              {stat.isCurrency ? formatCurrency(stat.value) : stat.value}
            </p>
            <p className="text-xs opacity-80 mt-0.5">{stat.label}</p>
          </motion.button>
        ))}
      </div>

      {/* Monthly Summary with progress bar */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-border"
      >
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-clinic-500" />
          ملخص الشهر
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-clinic-50 dark:bg-clinic-900/20 rounded-xl p-3">
            <p className="text-xs text-muted-foreground">الإيرادات</p>
            <p className="text-lg font-bold text-clinic-700 dark:text-clinic-400">
              {formatCurrency(data?.monthlyRevenue || 0)}
            </p>
          </div>
          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-3">
            <p className="text-xs text-muted-foreground">المرضى</p>
            <p className="text-lg font-bold text-teal-700 dark:text-teal-400">
              {data?.monthlyPatients || 0}
            </p>
          </div>
        </div>
        {/* Mini progress bar showing monthly revenue vs target */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-muted-foreground">تقدم الإيرادات الشهرية</span>
            <span className="text-[10px] font-bold text-clinic-600 dark:text-clinic-400">{Math.round(monthlyProgress)}%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${monthlyProgress}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
              className="h-full bg-gradient-to-l from-clinic-500 to-teal-500 rounded-full"
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[9px] text-muted-foreground">{formatCurrency(data?.monthlyRevenue || 0)}</span>
            <span className="text-[9px] text-muted-foreground">هدف: {formatCurrency(monthlyTarget)}</span>
          </div>
        </div>
      </motion.div>

      {/* Top Services */}
      {data?.topServices && data.topServices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-border"
        >
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-teal-500" />
            الخدمات الأكثر طلباً
          </h3>
          <div className="space-y-2">
            {data.topServices.slice(0, 5).map((svc, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-clinic-100 dark:bg-clinic-900/30 rounded-lg flex items-center justify-center text-xs font-bold text-clinic-700 dark:text-clinic-400">
                    {i + 1}
                  </span>
                  <span className="text-sm">{svc.name}</span>
                </div>
                <span className="text-sm font-mono text-muted-foreground">{svc.count} مرة</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Emergencies */}
      {data?.recentEmergencies && data.recentEmergencies.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-border"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              آخر الطوارئ
            </h3>
            <button onClick={() => setScreen('admin-emergencies')} className="text-xs text-clinic-600 dark:text-clinic-400 flex items-center gap-1">
              عرض الكل <ChevronLeft className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {data.recentEmergencies.slice(0, 3).map((em: EmergencyItem) => (
              <div key={em.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${em.severity === 'critical' ? 'bg-red-500' : em.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                  <div>
                    <p className="text-sm font-medium">{em.patientName || 'غير محدد'}</p>
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(em.arrivalTime)}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${severityColors[em.severity] || ''}`}>
                  {severityLabels[em.severity] || em.severity}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-3 gap-3"
      >
        <button
          onClick={() => setScreen('admin-add-patient')}
          className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-border text-center active:scale-[0.97] transition-transform hover:scale-[1.02]"
        >
          <Users className="w-8 h-8 mx-auto text-clinic-500" />
          <p className="text-sm font-medium mt-2">إضافة مريض</p>
        </button>
        <button
          onClick={() => setScreen('nurse-add-visit')}
          className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-border text-center active:scale-[0.97] transition-transform hover:scale-[1.02]"
        >
          <Activity className="w-8 h-8 mx-auto text-teal-500" />
          <p className="text-sm font-medium mt-2">زيارة جديدة</p>
        </button>
        <button
          onClick={() => setScreen('admin-add-emergency')}
          className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-border text-center active:scale-[0.97] transition-transform hover:scale-[1.02]"
        >
          <AlertTriangle className="w-8 h-8 mx-auto text-red-500" />
          <p className="text-sm font-medium mt-2">حالة طوارئ</p>
        </button>
      </motion.div>
    </div>
  );
}
