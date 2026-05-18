'use client';

import React from 'react';
import { Users, DollarSign, Bell, Settings, FileText, Stethoscope, BarChart3, UserCog } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export function AdminMoreMenu() {
  const { setScreen } = useAppStore();

  const menuItems = [
    { id: 'admin-nurses', label: 'الممرضين', icon: UserCog, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
    { id: 'admin-finance', label: 'المالية', icon: DollarSign, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' },
    { id: 'admin-reports', label: 'التقارير', icon: BarChart3, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400' },
    { id: 'admin-notifications', label: 'الإشعارات', icon: Bell, color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' },
    { id: 'admin-settings', label: 'الإعدادات', icon: Settings, color: 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400' },
  ];

  return (
    <div className="p-4 pb-24">
      <h2 className="text-lg font-bold mb-4">المزيد</h2>
      <div className="space-y-2">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setScreen(item.id as any)}
            className="w-full flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-4 border border-border active:scale-[0.98] transition-transform"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
