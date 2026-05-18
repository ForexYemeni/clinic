'use client';

import React from 'react';
import { Moon, Sun, Bell, LogOut, Info, ChevronLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppStore } from '@/lib/store';

const SettingsScreen = React.memo(function SettingsScreen() {
  const { user, theme, toggleTheme, logout, setScreen, clinicName } = useAppStore();

  return (
    <div className="px-4 pb-24 pt-2 space-y-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setScreen(user?.role === 'admin' ? 'admin-more' : 'admin-more')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold">الإعدادات</h2>
      </div>

      {/* Profile card */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-emerald-500 to-teal-600 relative">
          <div className="absolute -bottom-8 right-4">
            <Avatar className="w-16 h-16 border-4 border-background ring-2 ring-emerald-200 dark:ring-emerald-800">
              <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-600 dark:text-emerald-400 text-xl font-bold">
                {user?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        <CardContent className="pt-12 pb-4 px-4">
          <h3 className="font-bold text-base">{user?.name}</h3>
          <p className="text-sm text-muted-foreground" dir="ltr">{user?.phone}</p>
          <Badge className="mt-2 text-[10px] bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-700 dark:text-emerald-400 border-0">
            {user?.role === 'admin' ? 'مدير النظام' : 'ممرض'}
          </Badge>
        </CardContent>
      </Card>

      {/* Settings groups */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${theme === 'light' ? 'bg-amber-50 text-amber-500 dark:bg-amber-900/30' : 'bg-blue-50 text-blue-500 dark:bg-blue-900/30'}`}>
                {theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </div>
              <span className="text-sm font-medium">الوضع {theme === 'light' ? 'الفاتح' : 'الليلي'}</span>
            </div>
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          </div>
          <Separator />
          <button className="flex items-center gap-3 p-4 w-full touch-feedback" onClick={() => setScreen('admin-notifications')}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Bell className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">الإشعارات</span>
            <ChevronLeft className="w-4 h-4 mr-auto text-muted-foreground" />
          </button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-xs font-semibold text-muted-foreground">معلومات التطبيق</h4>
          </div>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <p>{clinicName} - الإصدار 3.0</p>
            <p>نظام إدارة احترافي لعيادات الإسعافات</p>
          </div>
        </CardContent>
      </Card>

      <Button variant="destructive" className="w-full h-12 rounded-xl font-semibold" onClick={logout}>
        <LogOut className="w-4 h-4 ml-1" /> تسجيل الخروج
      </Button>
    </div>
  );
});

export { SettingsScreen };
