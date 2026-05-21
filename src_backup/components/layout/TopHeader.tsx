'use client';

import React, { useMemo } from 'react';
import { Heart, Moon, Sun, Lock, LogOut, Shield, Building2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

const TopHeader = React.memo(function TopHeader() {
  const { user, theme, toggleTheme, setScreen, clinicName, logout } = useAppStore();
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin';

  const roleLabel = useMemo(() => {
    if (isSuperAdmin) return 'إدارة رئيسية';
    if (isAdmin) return 'إدارة';
    return 'ممرض';
  }, [isSuperAdmin, isAdmin]);

  const roleBadgeClass = useMemo(() => {
    if (isSuperAdmin) return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
    if (isAdmin) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
    return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
  }, [isSuperAdmin, isAdmin]);

  return (
    <header className="sticky top-0 z-40 glass-header border-b border-border">
      <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 bg-gradient-to-br ${isSuperAdmin ? 'from-purple-500 to-purple-600' : 'from-emerald-500 to-teal-600'} rounded-xl flex items-center justify-center shadow-sm`}>
            {isSuperAdmin ? <Shield className="w-5 h-5 text-white" /> : <Heart className="w-5 h-5 text-white" fill="currentColor" />}
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">{clinicName}</h1>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">{user?.name}</span>
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${roleBadgeClass}`}>
                {roleLabel}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {user?.role === 'nurse' && (
            <button
              onClick={() => setScreen('nurse-change-password')}
              className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={toggleTheme}
            className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              if (confirm('هل تريد تسجيل الخروج؟')) {
                logout();
                toast.success('تم تسجيل الخروج');
              }
            }}
            className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
});

export { TopHeader };
