'use client';

import React, { useMemo } from 'react';
import { Building2, Users, AlertTriangle, FileText, MoreHorizontal, Shield, LayoutDashboard } from 'lucide-react';
import { useAppStore, ScreenType } from '@/lib/store';

const BottomNav = React.memo(function BottomNav() {
  const { currentScreen, setScreen, user } = useAppStore();
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin';

  const superAdminTabs = useMemo(() => [
    { id: 'super-dashboard', label: 'الرئيسية', icon: LayoutDashboard, matchPrefix: 'super-dashboard' },
    { id: 'super-clinics', label: 'العيادات', icon: Building2, matchPrefix: 'super-clinic' },
    { id: 'super-add-clinic', label: 'إضافة', icon: Building2, matchPrefix: 'super-add-clinic' },
  ], []);

  const adminTabs = useMemo(() => [
    { id: 'admin-dashboard', label: 'الرئيسية', icon: Users, matchPrefix: 'admin-dashboard' },
    { id: 'admin-patients', label: 'المرضى', icon: Users, matchPrefix: 'admin-patient' },
    { id: 'admin-services', label: 'الخدمات', icon: FileText, matchPrefix: 'admin-service' },
    { id: 'admin-emergencies', label: 'الطوارئ', icon: AlertTriangle, matchPrefix: 'admin-emergenc' },
    { id: 'admin-more', label: 'المزيد', icon: MoreHorizontal, matchPrefix: 'admin-' },
  ], []);

  const nurseTabs = useMemo(() => [
    { id: 'nurse-patients', label: 'المرضى', icon: Users, matchPrefix: 'nurse-patient' },
    { id: 'nurse-emergencies', label: 'الطوارئ', icon: AlertTriangle, matchPrefix: 'nurse-emergenc' },
    { id: 'nurse-reports', label: 'التقارير', icon: FileText, matchPrefix: 'nurse-report' },
    { id: 'nurse-more', label: 'المزيد', icon: MoreHorizontal, matchPrefix: 'nurse-more' },
  ], []);

  const tabs = isSuperAdmin ? superAdminTabs : isAdmin ? adminTabs : nurseTabs;

  const activeTab = useMemo(() => {
    const screen = currentScreen as string;
    if (!isSuperAdmin && !isAdmin && (screen === 'nurse-add-visit' || screen === 'nurse-add-emergency')) {
      return 'nurse-patients';
    }
    if (!isSuperAdmin && !isAdmin && (screen === 'nurse-change-password' || screen === 'nurse-finance')) {
      return 'nurse-more';
    }
    for (const tab of tabs) {
      if (screen.startsWith(tab.matchPrefix)) return tab.id;
    }
    return tabs[0].id;
  }, [currentScreen, tabs, isSuperAdmin, isAdmin]);

  const accentColor = isSuperAdmin ? 'purple' : 'emerald';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-nav border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setScreen(tab.id as ScreenType)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 touch-feedback ${
                isActive
                  ? accentColor === 'purple'
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? (accentColor === 'purple' ? 'bg-purple-50 dark:bg-purple-900/30' : 'bg-emerald-50 dark:bg-emerald-900/30') + ' scale-110' : ''}`}>
                <tab.icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] mt-0.5 transition-all duration-200 ${isActive ? 'font-bold' : ''}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});

export { BottomNav };
