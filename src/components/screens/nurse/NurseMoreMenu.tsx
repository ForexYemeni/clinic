'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Lock, LogOut, User as UserIcon, ChevronLeft } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export function NurseMoreMenu() {
  const { user, setScreen, logout } = useAppStore();

  const menuItems = [
    {
      id: 'nurse-finance',
      label: 'المالية',
      subtitle: 'عرض الفواتير والمدفوعات',
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      action: () => setScreen('nurse-finance'),
    },
    {
      id: 'nurse-change-password',
      label: 'تغيير كلمة المرور',
      subtitle: 'تحديث كلمة المرور الخاصة بك',
      icon: Lock,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      action: () => setScreen('nurse-change-password'),
    },
  ];

  return (
    <div className="p-4 pb-24">
      {/* Nurse Info Card */}
      <div className="bg-gradient-to-l from-emerald-600 to-teal-600 rounded-2xl p-4 text-white mb-6 shadow-lg shadow-emerald-500/20">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <UserIcon className="w-7 h-7" />
          </div>
          <div>
            <p className="font-bold text-lg">{user?.name || 'ممرض'}</p>
            <p className="text-sm opacity-80" dir="ltr">{user?.phone}</p>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm mt-1 inline-block">
              ممرض
            </span>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-2">
        {menuItems.map((item, i) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={item.action}
            className="w-full flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-3.5 border border-border text-right active:scale-[0.98] transition-transform"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.bg}`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.subtitle}</p>
            </div>
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        ))}
      </div>

      {/* Logout */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={logout}
        className="w-full mt-6 flex items-center justify-center gap-2 h-12 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 font-medium text-sm active:scale-[0.98] transition-transform"
      >
        <LogOut className="w-4 h-4" />
        تسجيل الخروج
      </motion.button>
    </div>
  );
}
