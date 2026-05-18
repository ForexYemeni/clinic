'use client';

import React from 'react';
import { Briefcase, Calendar, DollarSign, Bell, Settings, ChevronLeft, LogOut } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore, ScreenType } from '@/lib/store';

const AdminMoreMenu = React.memo(function AdminMoreMenu() {
  const { setScreen, logout } = useAppStore();
  const menuItems = [
    { id: 'admin-nurses', label: 'إدارة الممرضين', icon: Briefcase, color: 'text-teal-600 bg-gradient-to-br from-teal-100 to-teal-50 dark:from-teal-900/30 dark:to-teal-800/20' },
    { id: 'admin-appointments', label: 'المواعيد', icon: Calendar, color: 'text-blue-600 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20' },
    { id: 'admin-finance', label: 'النظام المالي', icon: DollarSign, color: 'text-emerald-600 bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-800/20' },
    { id: 'admin-notifications', label: 'الإشعارات', icon: Bell, color: 'text-amber-600 bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20' },
    { id: 'admin-settings', label: 'الإعدادات', icon: Settings, color: 'text-gray-600 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-900/30 dark:to-gray-800/20' },
  ];

  return (
    <div className="px-4 pb-24 pt-2 space-y-3">
      <h2 className="text-lg font-bold">المزيد</h2>
      <div className="space-y-2">
        {menuItems.map((item) => (
          <Card key={item.id} className="border-0 shadow-sm touch-feedback group hover:shadow-md transition-all" onClick={() => setScreen(item.id as ScreenType)}>
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color} group-hover:scale-105 transition-transform`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold">{item.label}</span>
              <ChevronLeft className="w-4 h-4 mr-auto text-muted-foreground group-hover:translate-x-[-2px] transition-transform" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Button variant="destructive" className="w-full h-12 rounded-xl font-semibold mt-6" onClick={logout}>
        <LogOut className="w-4 h-4 ml-1" /> تسجيل الخروج
      </Button>
    </div>
  );
});

export { AdminMoreMenu };
