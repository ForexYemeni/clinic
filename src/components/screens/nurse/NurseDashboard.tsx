'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, AlertTriangle, Stethoscope, UserPlus, FileText, TrendingUp } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatCurrency, type DashboardData, type EmergencyItem, severityLabels, severityColors, formatRelativeTime } from '@/lib/constants';
import { NotificationBell } from '@/components/shared/NotificationBell';

export function NurseDashboard() {
  const { setScreen, user } = useAppStore();
  const clinicId = user?.clinicId || '';
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`/api/dashboard?role=nurse${clinicId ? `&clinicId=${clinicId}` : ''}`);
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
  }, [clinicId]);

  if (loading) {
    return (
      <div className="p-4 space-y-4 pb-24">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">مرحباً {user?.name}</h2>
          <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <NotificationBell />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'إجمالي المرضى', value: data?.totalPatients || 0, icon: Users, gradient: 'from-emerald-500 to-emerald-600' },
          { label: 'طوارئ نشطة', value: data?.activeEmergencies || 0, icon: AlertTriangle, gradient: 'from-red-500 to-red-600' },
          { label: 'خدمات اليوم', value: data?.todayServices || 0, icon: Stethoscope, gradient: 'from-teal-500 to-teal-600' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`bg-gradient-to-br ${stat.gradient} rounded-2xl p-4 text-white shadow-lg`}
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <stat.icon className="w-5 h-5" />
              </div>
              <TrendingUp className="w-4 h-4 opacity-60" />
            </div>
            <p className="text-2xl font-bold mt-2">{stat.value}</p>
            <p className="text-xs opacity-80 mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { label: 'مريض جديد', icon: UserPlus, screen: 'nurse-patients' as const, color: 'from-emerald-100 to-teal-50 text-emerald-600 dark:from-emerald-900/30 dark:to-teal-900/20 dark:text-emerald-400' },
          { label: 'حالة طوارئ', icon: AlertTriangle, screen: 'nurse-emergencies' as const, color: 'from-red-100 to-red-50 text-red-600 dark:from-red-900/30 dark:to-red-800/20 dark:text-red-400' },
          { label: 'تقرير يومي', icon: FileText, screen: 'nurse-reports' as const, color: 'from-blue-100 to-blue-50 text-blue-600 dark:from-blue-900/30 dark:to-blue-800/20 dark:text-blue-400' },
        ].map((item) => (
          <button
            key={item.screen}
            onClick={() => setScreen(item.screen)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br ${item.color} active:scale-95 transition-transform`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold">{item.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Recent Emergencies */}
      {data?.recentEmergencies && data.recentEmergencies.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-border"
        >
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            طوارئ نشطة
          </h3>
          <div className="space-y-2">
            {data.recentEmergencies.slice(0, 3).map((em: EmergencyItem) => (
              <div key={em.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${em.severity === 'critical' ? 'bg-red-500 animate-pulse' : em.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
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
    </div>
  );
}
