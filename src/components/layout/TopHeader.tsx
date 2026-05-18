'use client';

import React, { useMemo, useCallback } from 'react';
import { Heart, Moon, Sun, Lock, LogOut } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

const TopHeader = React.memo(function TopHeader() {
  const { user, theme, toggleTheme, setScreen, clinicName } = useAppStore();
  const isAdmin = user?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 glass-header border-b border-border">
      <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm">
            <Heart className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">{clinicName}</h1>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">{user?.name}</span>
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                isAdmin ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              }`}>
                {isAdmin ? 'إدارة' : 'ممرض'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {!isAdmin && (
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
        </div>
      </div>
    </header>
  );
});

export { TopHeader };
