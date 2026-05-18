'use client';

import React, { useMemo } from 'react';
import { Bell, ChevronRight, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { useData } from '@/hooks/useData';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import {
  NotificationItem, formatRelativeTime,
  notificationTypeIcons, notificationTypeColors,
} from '@/lib/constants';
import { toast } from 'sonner';

const NotificationsScreen = React.memo(function NotificationsScreen() {
  const { user, setScreen } = useAppStore();
  const { data: notifications, loading, refresh } = useData<NotificationItem[]>(
    user ? `/api/notifications?userId=${user.id}` : null
  );

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ read: true }) });
    refresh();
  };

  const markAllRead = async () => {
    const unread = (notifications || []).filter(n => !n.read);
    await Promise.all(unread.map(n => fetch(`/api/notifications/${n.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ read: true }) })));
    toast.success('تم قراءة جميع الإشعارات');
    refresh();
  };

  const grouped = useMemo(() => {
    if (!notifications) return {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);

    const groups: Record<string, NotificationItem[]> = {};
    for (const n of notifications) {
      const d = new Date(n.createdAt);
      let group: string;
      if (d >= today) group = 'today';
      else if (d >= yesterday) group = 'yesterday';
      else group = 'older';

      if (!groups[group]) groups[group] = [];
      groups[group].push(n);
    }
    return groups;
  }, [notifications]);

  const groupLabels: Record<string, string> = { today: 'اليوم', yesterday: 'أمس', older: 'أقدم' };

  if (loading) return <SkeletonLoader type="card-list" />;

  return (
    <div className="px-4 pb-24 pt-2 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setScreen(user?.role === 'admin' ? 'admin-more' : 'admin-more')}>
            <ChevronRight className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-bold">الإشعارات</h2>
        </div>
        <Button variant="ghost" size="sm" className="text-xs text-emerald-600" onClick={markAllRead}>قراءة الكل</Button>
      </div>

      {!notifications || notifications.length === 0 ? (
        <EmptyState icon={Bell} title="لا توجد إشعارات" />
      ) : (
        Object.entries(grouped).map(([group, items]) => (
          <div key={group}>
            <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">{groupLabels[group]}</p>
            <div className="space-y-2">
              {items.map((n) => {
                const Icon = notificationTypeIcons[n.type] || Info;
                return (
                  <Card
                    key={n.id}
                    className={`border-0 shadow-sm touch-feedback ${!n.read ? 'border-r-4 border-r-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}
                    onClick={() => !n.read && markAsRead(n.id)}
                  >
                    <CardContent className="p-3.5 flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${notificationTypeColors[n.type] || notificationTypeColors.system}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!n.read ? 'font-bold' : 'font-medium'}`}>{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{formatRelativeTime(n.createdAt)}</p>
                      </div>
                      {!n.read && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-2 shrink-0 animate-pulse-slow" />}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
});

export { NotificationsScreen };
