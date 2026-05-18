'use client';

import { Bell, Moon, Sun, LogOut, User } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function TopHeader() {
  const { user, theme, toggleTheme, unreadCount, setScreen, logout } = useAppStore();

  return (
    <header className="top-header">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Right: User info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-sm">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-sm">{user?.name || ''}</h2>
            <p className="text-xs text-muted-foreground">
              {user?.role === 'admin' ? 'مدير النظام' : 'طبيب تمريض'}
            </p>
          </div>
        </div>

        {/* Left: Actions */}
        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full"
            onClick={toggleTheme}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Sun className="w-5 h-5 text-muted-foreground" />
            )}
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full relative"
            onClick={() => setScreen('notifications')}
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-0.5 -left-0.5 h-5 min-w-5 flex items-center justify-center p-0 text-[10px] bg-red-500 text-white border-2 border-card">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>

          {/* Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full">
                <LogOut className="w-5 h-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setScreen('settings')}>
                الإعدادات
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={logout}
                className="text-red-600 dark:text-red-400"
              >
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
