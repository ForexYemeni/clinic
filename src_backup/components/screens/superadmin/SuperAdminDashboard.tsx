'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, Activity, AlertTriangle, Plus, ChevronLeft, Phone, MapPin, Shield, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatCurrency } from '@/lib/constants';
import { NotificationBell } from '@/components/shared/NotificationBell';

interface ClinicInfo {
  id: string;
  name: string;
  city: string;
  active: boolean;
  patients: number;
  nurses: number;
  activeEmergencies: number;
}

interface DashboardData {
  totalClinics: number;
  activeClinics: number;
  totalPatients: number;
  totalNurses: number;
  totalAdmins: number;
  clinics: ClinicInfo[];
}

export function SuperAdminDashboard() {
  const { setScreen } = useAppStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/dashboard?role=super_admin');
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

  if (loading) {
    return (
      <div className="p-4 space-y-4 pb-24">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const stats = [
    { label: 'إجمالي العيادات', value: data?.totalClinics || 0, icon: Building2, gradient: 'from-purple-500 to-purple-600', onClick: () => setScreen('super-clinics') },
    { label: 'المرضى', value: data?.totalPatients || 0, icon: Users, gradient: 'from-emerald-500 to-emerald-600' },
    { label: 'الممرضين', value: data?.totalNurses || 0, icon: Activity, gradient: 'from-teal-500 to-teal-600' },
    { label: 'مدراء العيادات', value: data?.totalAdmins || 0, icon: Shield, gradient: 'from-blue-500 to-blue-600' },
  ];

  return (
    <div className="p-4 space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">الإدارة الرئيسية</h2>
          <p className="text-xs text-muted-foreground">لوحة تحكم المنصة</p>
        </div>
        <NotificationBell />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => (
          <motion.button
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={stat.onClick}
            className={`bg-gradient-to-br ${stat.gradient} rounded-2xl p-4 text-white text-right shadow-lg active:scale-[0.97] transition-transform w-full`}
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold mt-2">{stat.value}</p>
            <p className="text-xs opacity-80 mt-0.5">{stat.label}</p>
          </motion.button>
        ))}
      </div>

      {/* Active Emergencies across all clinics */}
      {(data?.clinics || []).filter(c => c.activeEmergencies > 0).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-200 dark:border-red-800"
        >
          <h3 className="font-bold text-sm mb-2 flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-4 h-4" />
            طوارئ نشطة
          </h3>
          {data!.clinics.filter(c => c.activeEmergencies > 0).map(clinic => (
            <div key={clinic.id} className="flex items-center justify-between py-1">
              <span className="text-sm">{clinic.name}</span>
              <span className="text-sm font-bold text-red-600 dark:text-red-400">{clinic.activeEmergencies} حالة</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Clinics List */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-border"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-500" />
            العيادات ({data?.clinics.length || 0})
          </h3>
          <button
            onClick={() => setScreen('super-clinics')}
            className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1"
          >
            عرض الكل <ChevronLeft className="w-3 h-3" />
          </button>
        </div>

        {(data?.clinics || []).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">لا توجد عيادات بعد</p>
            <button
              onClick={() => setScreen('super-add-clinic')}
              className="mt-3 text-sm text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1 mx-auto"
            >
              <Plus className="w-4 h-4" /> إضافة عيادة
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {data!.clinics.slice(0, 5).map(clinic => (
              <div key={clinic.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${clinic.active ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="text-sm font-medium">{clinic.name}</p>
                    {clinic.city && <p className="text-[10px] text-muted-foreground">{clinic.city}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{clinic.patients} مريض</span>
                  <span>{clinic.nurses} ممرض</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 gap-3"
      >
        <button
          onClick={() => setScreen('super-add-clinic')}
          className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-border text-center active:scale-[0.97] transition-transform"
        >
          <Plus className="w-8 h-8 mx-auto text-purple-500" />
          <p className="text-sm font-medium mt-2">إضافة عيادة</p>
        </button>
        <button
          onClick={() => setScreen('super-clinics')}
          className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-border text-center active:scale-[0.97] transition-transform"
        >
          <Building2 className="w-8 h-8 mx-auto text-purple-500" />
          <p className="text-sm font-medium mt-2">إدارة العيادات</p>
        </button>
      </motion.div>
    </div>
  );
}
