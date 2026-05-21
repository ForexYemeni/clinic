'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2, Users, AlertTriangle, Stethoscope, CreditCard, Clock, Shield, Heart, Database, Filter, ChevronLeft } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatRelativeTime, type NotificationItem } from '@/lib/constants';

// ═══ Notification type config ═══
const notifTypeConfig: Record<string, { icon: typeof Bell; color: string; bg: string; label: string }> = {
  patient: { icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'مرضى' },
  visit: { icon: Stethoscope, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'زيارات' },
  emergency: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', label: 'طوارئ' },
  subscription: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'اشتراكات' },
  payment: { icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', label: 'مدفوعات' },
  system: { icon: Shield, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-700', label: 'نظام' },
  nurse: { icon: Users, color: 'text-teal-600', bg: 'bg-teal-100 dark:bg-teal-900/30', label: 'ممرضين' },
  data_reset: { icon: Database, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30', label: 'حذف بيانات' },
};

const priorityColors: Record<string, string> = {
  urgent: 'border-r-4 border-r-red-500 bg-red-50/50 dark:bg-red-900/10',
  high: 'border-r-4 border-r-amber-500 bg-amber-50/30 dark:bg-amber-900/5',
  normal: '',
  low: '',
};

const filterTabs = [
  { key: 'all', label: 'الكل' },
  { key: 'unread', label: 'غير مقروء' },
  ...Object.entries(notifTypeConfig).map(([key, val]) => ({ key, label: val.label })),
];

export function NotificationsScreen() {
  const { user, setScreen } = useAppStore();
  const clinicId = user?.clinicId || '';
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}&clinicId=${clinicId}`);
      if (res.ok) setNotifications(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, clinicId }),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    setMarkingAll(true);
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true, userId: user.id, clinicId }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {} finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {}
  };

  // Filter notifications
  const filtered = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.read;
    return (n as any).type === activeFilter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setScreen('admin-more')} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800">
          <ChevronLeft className="w-5 h-5 rotate-180" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold">الإشعارات</h2>
          <p className="text-xs text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : 'لا توجد إشعارات جديدة'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            تعيين الكل كمقروء
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-hide mb-4">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === tab.key
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
            <Bell className="w-10 h-10 opacity-20" />
          </div>
          <p className="text-sm font-medium">لا توجد إشعارات</p>
          <p className="text-xs mt-1">
            {activeFilter !== 'all' ? 'لا توجد إشعارات من هذا النوع' : 'ستظهر الإشعارات هنا عند حدوث أي نشاط'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((n, i) => {
              const type = (n as any).type || 'system';
              const priority = (n as any).priority || 'normal';
              const config = notifTypeConfig[type] || notifTypeConfig.system;
              const Icon = config.icon;
              const isUnread = !n.read;

              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: i * 0.03 }}
                  className={`bg-white dark:bg-gray-800 rounded-2xl p-3.5 border border-border ${priorityColors[priority]} ${isUnread ? 'shadow-sm' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${isUnread ? 'font-bold' : 'font-medium'}`}>
                          {n.title}
                        </p>
                        {isUnread && (
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5 animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px] text-muted-foreground/60">
                          {formatRelativeTime(n.createdAt)}
                        </p>
                        <div className="flex items-center gap-1">
                          {isUnread && (
                            <button
                              onClick={() => handleMarkRead(n.id)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                              title="تعيين كمقروء"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(n.id)}
                            className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
