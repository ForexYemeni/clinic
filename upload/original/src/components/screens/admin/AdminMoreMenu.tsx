'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, DollarSign, Bell, Settings, FileText, Stethoscope, BarChart3, UserCog, Building2, Trash2, ChevronLeft, LogOut, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export function AdminMoreMenu() {
  const { setScreen, logout } = useAppStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const menuItems = [
    { id: 'admin-nurses', label: 'الممرضين', subtitle: 'إدارة فريق التمريض', icon: UserCog, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { id: 'admin-finance', label: 'المالية', subtitle: 'الفواتير والمدفوعات', icon: DollarSign, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    { id: 'admin-reports', label: 'التقارير', subtitle: 'تقارير يومية وشهرية', icon: BarChart3, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { id: 'admin-notifications', label: 'الإشعارات', subtitle: 'التنبيهات والإشعارات', icon: Bell, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
    { id: 'admin-clinic-settings', label: 'إعدادات العيادة', subtitle: 'الاسم والشعار والهوية', icon: Building2, color: 'text-clinic-600 dark:text-clinic-400', bg: 'bg-clinic-100 dark:bg-clinic-900/30' },
    { id: 'admin-settings', label: 'الإعدادات', subtitle: 'المظهر والأمان', icon: Settings, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700' },
    { id: 'admin-system-reset', label: 'حذف البيانات', subtitle: 'إعادة تهيئة النظام', icon: Trash2, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  ];

  return (
    <div className="p-4 pb-24">
      <h2 className="text-lg font-bold mb-4">المزيد</h2>
      <div className="space-y-2">
        {menuItems.map((item, i) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => setScreen(item.id as any)}
            className="w-full flex items-center gap-3 bg-white dark:bg-gray-800 rounded-2xl p-3.5 border border-border active:scale-[0.98] transition-transform shadow-sm"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.bg}`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div className="flex-1 text-right">
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.subtitle}</p>
            </div>
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        ))}
      </div>

      {/* Logout - Professional Danger Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-4"
      >
        <AnimatePresence mode="wait">
          {showLogoutConfirm ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 shadow-lg shadow-red-500/20"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">تأكيد تسجيل الخروج</p>
                  <p className="text-[10px] text-white/80">سيتم تسجيل خروجك من الحساب الحالي</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={logout}
                  className="flex-1 h-10 bg-white text-red-600 rounded-xl text-sm font-bold active:scale-[0.97] transition-transform shadow-sm"
                >
                  نعم، تسجيل الخروج
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 h-10 bg-white/20 text-white rounded-xl text-sm font-medium backdrop-blur-sm active:scale-[0.97] transition-transform"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full bg-white dark:bg-gray-800 rounded-2xl p-3.5 border border-red-200 dark:border-red-900/50 flex items-center gap-3 active:scale-[0.98] transition-transform shadow-sm"
            >
              <div className="w-11 h-11 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 text-right">
                <p className="text-sm font-bold text-red-600 dark:text-red-400">تسجيل الخروج</p>
                <p className="text-[10px] text-muted-foreground">الخروج من حسابك الحالي</p>
              </div>
              <ChevronLeft className="w-4 h-4 text-red-400" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
