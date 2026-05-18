'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';
import { Moon, Sun, Shield, Heart, LogOut, Info, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

export function SettingsScreen() {
  const { user, theme, toggleTheme, logout } = useAppStore();

  const menuItems = [
    {
      icon: Shield,
      label: 'الأمان والخصوصية',
      description: 'إعدادات الأمان',
      onClick: () => toast.info('قريباً'),
    },
    {
      icon: Info,
      label: 'حول التطبيق',
      description: 'الإصدار 1.0.0',
      onClick: () => toast.info('عيادة الإسعافات الأولية - الإصدار 1.0.0'),
    },
  ];

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-foreground mb-4">الإعدادات</h2>

      {/* Profile card */}
      <Card className="medical-card p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground">{user?.name}</h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-primary font-medium mt-1">
              {user?.role === 'admin' ? 'مدير النظام' : 'طبيب تمريض'}
            </p>
          </div>
        </div>
      </Card>

      {/* Theme */}
      <Card className="medical-card p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === 'light' ? <Moon className="w-5 h-5 text-muted-foreground" /> : <Sun className="w-5 h-5 text-muted-foreground" />}
            <div>
              <Label className="font-medium">الوضع الداكن</Label>
              <p className="text-xs text-muted-foreground">
                {theme === 'light' ? 'تفعيل الوضع الداكن' : 'تفعيل الوضع الفاتح'}
              </p>
            </div>
          </div>
          <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
        </div>
      </Card>

      {/* Menu items */}
      <Card className="medical-card mb-4">
        {menuItems.map((item, i) => (
          <div key={i}>
            <button
              onClick={item.onClick}
              className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <div className="text-right">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            {i < menuItems.length - 1 && <Separator />}
          </div>
        ))}
      </Card>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full h-12 rounded-xl text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
        onClick={logout}
      >
        <LogOut className="w-4 h-4 ml-2" />
        تسجيل الخروج
      </Button>

      {/* App info */}
      <div className="text-center mt-6 mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Heart className="w-4 h-4 text-primary fill-primary" />
          <span className="text-sm font-semibold text-primary">عيادة الإسعافات الأولية</span>
        </div>
        <p className="text-xs text-muted-foreground">الإصدار 1.0.0</p>
      </div>
    </div>
  );
}
