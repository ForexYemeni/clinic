'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, AlertTriangle, Activity, DollarSign, TrendingUp, Clock, Stethoscope, ChevronLeft } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatRelativeTime, severityLabels, severityColors, type DashboardData, type EmergencyItem } from '@/lib/constants';

export function AdminDashboard() {
  const { setScreen } = useAppStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

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

  const stats = useMemo(() => [
    { label: 'إجمالي المرضى', value: data?.totalPatients || 0, icon: Users, gradient: 'from-clinic-500 to-clinic-600', onClick: () => setScreen('admin-patients') },
    { label: 'طوارئ نشطة', value: data?.activeEmergencies || 0, icon: AlertTriangle, gradient: 'from-red-500 to-red-600', onClick: () => setScreen('admin-emergencies') },
    { label: 'خدمات اليوم', value: data?.todayServices || 0, icon: Activity, gradient: 'from-teal-500 to-clinic-600', onClick: () => setScreen('admin-services') },
    { label: 'إيرادات اليوم', value: data?.todayRevenue || 0, icon: DollarSign, gradient: 'from-amber-500 to-amber-600', isCurrency: true, onClick: () => setScreen('admin-finance') },
  ], [data, setScreen]);

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
      {/* Quick Stats */}
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
              <TrendingUp className="w-4 h-4 opacity-60" />
            </div>
            <p className="text-2xl font-bold mt-2">
              {stat.isCurrency ? formatCurrency(stat.value) : stat.value}
            </p>
            <p className="text-xs opacity-80 mt-0.5">{stat.label}</p>
          </motion.button>
        ))}
      </div>

      {/* Monthly Summary */}
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
        <div className="grid grid-cols-2 gap-3">
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
          className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-border text-center active:scale-[0.97] transition-transform"
        >
          <Users className="w-8 h-8 mx-auto text-clinic-500" />
          <p className="text-sm font-medium mt-2">إضافة مريض</p>
        </button>
        <button
          onClick={() => setScreen('nurse-add-visit')}
          className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-border text-center active:scale-[0.97] transition-transform"
        >
          <Activity className="w-8 h-8 mx-auto text-teal-500" />
          <p className="text-sm font-medium mt-2">زيارة جديدة</p>
        </button>
        <button
          onClick={() => setScreen('admin-add-emergency')}
          className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-border text-center active:scale-[0.97] transition-transform"
        >
          <AlertTriangle className="w-8 h-8 mx-auto text-red-500" />
          <p className="text-sm font-medium mt-2">حالة طوارئ</p>
        </button>
      </motion.div>
    </div>
  );
}
