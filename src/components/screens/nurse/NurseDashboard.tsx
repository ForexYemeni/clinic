'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, AlertTriangle, Stethoscope, UserPlus, FileText, Calendar, Activity, CreditCard, Wallet, Heart } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatDate, severityColors, severityLabels, type DashboardData, type EmergencyItem } from '@/lib/constants';
import { PwaInstallBanner } from '@/components/shared/PwaInstallPrompt';

interface SalaryData {
  nurse: { name: string; phone: string; salary: number; active: boolean };
  salary: number;
  totalWithdrawals: number;
  totalDebts: number;
  remainingBalance: number;
  withdrawals: any[];
  pendingCount: number;
}

const NurseDashboard = React.memo(function NurseDashboard() {
  const { setScreen, user } = useAppStore();
  const nurseParam = user?.id ? `?role=nurse&nurseId=${user.id}` : '?role=nurse';

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [salaryData, setSalaryData] = useState<SalaryData | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`/api/dashboard${nurseParam}`);
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
  }, [nurseParam]);

  // Fetch salary data for remaining balance
  useEffect(() => {
    if (!user?.id) return;
    const fetchSalary = async () => {
      try {
        const res = await fetch(`/api/salary?nurseId=${user.id}`);
        if (res.ok) {
          const d = await res.json();
          setSalaryData(d);
        }
      } catch {}
    };
    fetchSalary();
  }, [user?.id]);

  // Get today's date in Arabic
  const todayDate = useMemo(() => {
    return new Date().toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  if (loading) {
    return (
      <div className="p-4 space-y-4 pb-24">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 pb-24 text-center py-16">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>
        <p className="text-lg font-bold text-foreground mb-2">خطأ في تحميل البيانات</p>
        <p className="text-sm text-muted-foreground">يرجى إعادة تحميل الصفحة</p>
      </div>
    );
  }

  const stats = [
    { label: 'زيارات اليوم', value: data.todayServices || 0, icon: Calendar, gradient: 'from-clinic-500 to-clinic-600', onClick: () => setScreen('nurse-patients') },
    { label: 'طوارئ نشطة', value: data.activeEmergencies || 0, icon: AlertTriangle, gradient: 'from-red-500 to-red-600', onClick: () => setScreen('nurse-emergencies') },
    { label: 'خدمات اليوم', value: data.todayServices || 0, icon: Stethoscope, gradient: 'from-teal-500 to-teal-600', onClick: () => setScreen('nurse-patients') },
    { label: 'رصيد الراتب', value: salaryData?.remainingBalance || 0, icon: Wallet, gradient: 'from-amber-500 to-amber-600', isCurrency: true, onClick: () => setScreen('nurse-salary') },
  ];

  return (
    <div className="px-4 pb-24 pt-2 space-y-5">
      {/* PWA Install Banner */}
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
              <p className="text-lg font-bold">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
            <Calendar className="w-4 h-4 text-white/70" />
            <p className="text-xs text-white/90">{todayDate}</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid - 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => (
          <motion.button
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={stat.onClick}
            className={`bg-gradient-to-br ${stat.gradient} rounded-2xl p-4 text-white text-right shadow-lg active:scale-[0.97] transition-transform`}
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <stat.icon className="w-5 h-5" />
              </div>
              <Activity className="w-4 h-4 opacity-60" />
            </div>
            <p className="text-2xl font-bold mt-2">
              {stat.isCurrency ? formatCurrency(stat.value) : stat.value}
            </p>
            <p className="text-xs opacity-80 mt-0.5">{stat.label}</p>
          </motion.button>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-border"
      >
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-clinic-500" />
          إجراءات سريعة
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'إضافة زيارة', icon: UserPlus, screen: 'nurse-add-visit' as const, color: 'bg-gradient-to-br from-clinic-100 to-teal-50 text-clinic-600 dark:from-clinic-900/30 dark:to-teal-900/20 dark:text-clinic-400' },
            { label: 'حالة طوارئ', icon: AlertTriangle, screen: 'nurse-emergencies' as const, color: 'bg-gradient-to-br from-red-100 to-red-50 text-red-600 dark:from-red-900/30 dark:to-red-800/20 dark:text-red-400' },
            { label: 'تقارير', icon: FileText, screen: 'nurse-reports' as const, color: 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 dark:from-blue-900/30 dark:to-blue-800/20 dark:text-blue-400' },
          ].map((item) => (
            <button key={item.screen} onClick={() => setScreen(item.screen)} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl touch-feedback ${item.color} hover:shadow-sm transition-shadow active:scale-[0.97]`}>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Active Emergencies */}
      {data.recentEmergencies.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-r-4 border-r-red-500 border-border"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              طوارئ نشطة
            </h3>
            <button onClick={() => setScreen('nurse-emergencies')} className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              عرض الكل
            </button>
          </div>
          <div className="space-y-2">
            {data.recentEmergencies.slice(0, 3).map((em: EmergencyItem) => (
              <div key={em.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${em.severity === 'critical' ? 'bg-red-500' : em.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'} animate-pulse`} />
                  <div>
                    <p className="text-sm font-medium">{em.patient?.name || 'غير محدد'}</p>
                    <p className="text-xs text-muted-foreground">{em.notes || 'لا توجد ملاحظات'}</p>
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
    </div>
  );
});

export { NurseDashboard };
