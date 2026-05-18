'use client';

import React, { useMemo, useCallback } from 'react';
import { Heart, Bell, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { useData } from '@/hooks/useData';
import { NotificationItem } from '@/lib/constants';

const TopHeader = React.memo(function TopHeader() {
  const { user, theme, toggleTheme, setScreen, clinicName } = useAppStore();
  const { data: notifications } = useData<NotificationItem[]>(
    user ? `/api/notifications?userId=${user.id}` : null,
    { refreshInterval: 60_000 }
  );

  const unreadCount = useMemo(() => {
    if (!notifications) return 0;
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const handleBellClick = useCallback(() => {
    setScreen(user?.role === 'admin' ? 'admin-notifications' : 'admin-notifications');
  }, [user?.role, setScreen]);

  return (
    <header className="sticky top-0 z-40 glass-header border-b border-border">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm">
            <Heart className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">{clinicName}</h1>
            <p className="text-[10px] text-muted-foreground">{user?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl touch-feedback relative" onClick={handleBellClick}>
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -left-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center px-1 font-bold animate-bounce-in">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl touch-feedback" onClick={toggleTheme}>
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </header>
  );
});

export { TopHeader };
