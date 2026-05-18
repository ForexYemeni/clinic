'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { useAppStore } from '@/lib/store';
import { Bell, AlertTriangle, Calendar, Wrench, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

const typeIcons: Record<string, typeof Bell> = {
  emergency: AlertTriangle,
  appointment: Calendar,
  service: Wrench,
  system: Bell,
};

const typeColors: Record<string, string> = {
  emergency: 'text-red-500 bg-red-100 dark:bg-red-900/30',
  appointment: 'text-primary bg-teal-100 dark:bg-teal-900/30',
  service: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30',
  system: 'text-muted-foreground bg-muted',
};

export function NotificationScreen() {
  const { user, notifications, setNotifications, markAllNotificationsRead, markNotificationRead } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}`);
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });
      markNotificationRead(id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await Promise.all(
        notifications.filter(n => !n.read).map(n =>
          fetch(`/api/notifications/${n.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ read: true }),
          })
        )
      );
      markAllNotificationsRead();
      toast.success('تم قراءة جميع الإشعارات');
    } catch (error) {
      console.error(error);
    }
  };

  const filtered = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filter);

  if (loading) return <LoadingSpinner text="جاري تحميل الإشعارات..." />;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">الإشعارات</h2>
        {notifications.some(n => !n.read) && (
          <Button variant="ghost" size="sm" className="text-primary" onClick={handleMarkAllRead}>
            <CheckCheck className="w-4 h-4 ml-1" />
            قراءة الكل
          </Button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
        {['all', 'emergency', 'appointment', 'service', 'system'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}>
            <Badge variant={filter === f ? 'default' : 'outline'} className="cursor-pointer whitespace-nowrap">
              {f === 'all' ? 'الكل' : f === 'emergency' ? 'طوارئ' : f === 'appointment' ? 'مواعيد' : f === 'service' ? 'خدمات' : 'نظام'}
            </Badge>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Bell} title="لا توجد إشعارات" />
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => {
            const Icon = typeIcons[notif.type] || Bell;
            return (
              <Card
                key={notif.id}
                className={`medical-card p-4 cursor-pointer ${!notif.read ? 'border-primary/30 bg-primary/5' : ''}`}
                onClick={() => !notif.read && handleMarkRead(notif.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${typeColors[notif.type] || typeColors.system}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm ${!notif.read ? 'font-bold' : 'font-medium'}`}>{notif.title}</h4>
                      {!notif.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notif.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {format(new Date(notif.createdAt), 'dd/MM/yyyy HH:mm', { locale: ar })}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
