'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatRelativeTime, notificationTypeColors, type NotificationItem } from '@/lib/constants';

export function NotificationsScreen() {
  const { user, setScreen } = useAppStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      try {
        const res = await fetch(`/api/notifications?userId=${user.id}`);
        if (res.ok) setNotifications(await res.json());
      } catch {} finally { setLoading(false); }
    };
    fetchNotifs();
  }, [user]);

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ read: true }) });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {}
  };

  return (
    <div className="p-4 pb-24">
      <h2 className="text-lg font-bold mb-4">الإشعارات</h2>
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto opacity-30 mb-3" />
          <p>لا توجد إشعارات</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id} className={`bg-white dark:bg-gray-800 rounded-xl p-3 border border-border ${!n.read ? 'border-r-4 border-r-clinic-500' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{formatRelativeTime(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <button onClick={() => handleMarkRead(n.id)} className="p-1.5 text-clinic-600">
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
