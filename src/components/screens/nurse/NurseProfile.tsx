'use client';

import React from 'react';
import { Bell, FileText, Settings, ChevronLeft, LogOut, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppStore, ScreenType } from '@/lib/store';

const NurseProfile = React.memo(function NurseProfile() {
  const { user, setScreen, logout } = useAppStore();

  const menuItems = [
    { id: 'nurse-notifications', label: 'الإشعارات', icon: Bell, color: 'bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 dark:from-amber-900/30 dark:to-amber-800/20 dark:text-amber-400' },
    { id: 'nurse-daily-report', label: 'التقارير اليومية', icon: FileText, color: 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 dark:from-blue-900/30 dark:to-blue-800/20 dark:text-blue-400' },
    { id: 'nurse-settings', label: 'الإعدادات', icon: Settings, color: 'bg-gradient-to-br from-gray-100 to-gray-50 text-gray-600 dark:from-gray-900/30 dark:to-gray-800/20 dark:text-gray-400' },
  ];

  return (
    <div className="px-4 pb-24 pt-2 space-y-4">
      {/* Profile card with gradient */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-6 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full border-4 border-white/10" />
          <div className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full border-4 border-white/5" />
          <Avatar className="w-16 h-16 border-2 border-white/30 ring-4 ring-white/10">
            <AvatarFallback className="bg-white/20 text-white text-xl font-bold backdrop-blur-sm">{user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-white relative z-10">
            <h3 className="text-lg font-bold">{user?.name}</h3>
            <p className="text-emerald-100 text-sm" dir="ltr">{user?.email}</p>
            <Badge className="mt-1 bg-white/20 text-white text-[10px] backdrop-blur-sm border border-white/10">
              <Heart className="w-3 h-3 ml-1" /> ممرض
            </Badge>
          </div>
        </div>
      </Card>

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

      <Button variant="destructive" className="w-full h-12 rounded-xl font-semibold" onClick={logout}>
        <LogOut className="w-4 h-4 ml-1" /> تسجيل الخروج
      </Button>
    </div>
  );
});

export { NurseProfile };
