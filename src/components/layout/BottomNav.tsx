'use client';

import React, { useMemo } from 'react';
import { Home, Users, AlertTriangle, FileText } from 'lucide-react';
import { useAppStore, ScreenType } from '@/lib/store';

const BottomNav = React.memo(function BottomNav() {
  const { currentScreen, setScreen, user } = useAppStore();
  const isAdmin = user?.role === 'admin';

  const adminTabs = useMemo(() => [
    { id: 'admin-dashboard', label: 'الرئيسية', icon: Home },
    { id: 'admin-patients', label: 'المرضى', icon: Users },
    { id: 'admin-services', label: 'الخدمات', icon: FileText },
    { id: 'admin-emergencies', label: 'الطوارئ', icon: AlertTriangle },
    { id: 'admin-more', label: 'المزيد', icon: Home },
  ], []);

  const nurseTabs = useMemo(() => [
    { id: 'nurse-dashboard', label: 'الرئيسية', icon: Home },
    { id: 'nurse-patients', label: 'المرضى', icon: Users },
    { id: 'nurse-emergencies', label: 'الطوارئ', icon: AlertTriangle },
    { id: 'nurse-reports', label: 'التقارير', icon: FileText },
  ], []);

  const tabs = isAdmin ? adminTabs : nurseTabs;

  const activeTab = useMemo(() => {
    const screen = currentScreen as string;
    for (const tab of tabs) {
      if (screen.startsWith(tab.id)) return tab.id;
    }
    return tabs[0].id;
  }, [currentScreen, tabs]);

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
                isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-emerald-50 dark:bg-emerald-900/30 scale-110' : ''}`}>
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
