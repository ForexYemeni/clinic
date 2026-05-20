'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2, X, Users, AlertTriangle, Stethoscope, CreditCard, Clock, Shield, Heart, Database } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatRelativeTime, type NotificationItem } from '@/lib/constants';

// ═══ Notification type config ═══
const notifTypeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  patient: { icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  visit: { icon: Stethoscope, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  emergency: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  subscription: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  payment: { icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  system: { icon: Shield, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-700' },
  nurse: { icon: Users, color: 'text-teal-600', bg: 'bg-teal-100 dark:bg-teal-900/30' },
  data_reset: { icon: Database, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30' },
};

const priorityColors: Record<string, string> = {
  urgent: 'border-l-4 border-l-red-500',
  high: 'border-l-4 border-l-amber-500',
  normal: '',
  low: '',
};

export function NotificationBell() {
  const { user, setScreen } = useAppStore();
  const clinicId = user?.clinicId || '';
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}&count=true&clinicId=${clinicId}`);
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch {}
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}&clinicId=${clinicId}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [user]);

  // Poll for unread count every 15 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch full notifications when panel opens
  useEffect(() => {
    if (showPanel) {
      fetchNotifications();
    }
  }, [showPanel, fetchNotifications]);

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false);
      }
    }
    if (showPanel) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [showPanel]);

  const handleMarkRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, clinicId }),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true, userId: user.id, clinicId }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      const wasUnread = notifications.find(n => n.id === id && !n.read);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    if (!notif.read) handleMarkRead(notif.id);
    setShowPanel(false);
    // Navigate based on type
    const type = (notif as any).type;
    if (type === 'patient') setScreen('admin-patients');
    else if (type === 'emergency') setScreen('admin-emergencies');
    else if (type === 'payment' || type === 'visit') setScreen('admin-finance');
    else if (type === 'subscription') setScreen('admin-settings');
    else setScreen('admin-notifications');
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-95"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-sm"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute left-0 top-full mt-2 w-[340px] max-h-[80vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-border overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-3 border-b border-border flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold">الإشعارات</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] px-2 py-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg font-bold transition-colors flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" />
                    تعيين الكل كمقروء
                  </button>
                )}
                <button
                  onClick={() => setShowPanel(false)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[60vh]">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Bell className="w-10 h-10 mx-auto opacity-20 mb-2" />
                  <p className="text-sm">لا توجد إشعارات</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notif) => {
                    const type = (notif as any).type || 'system';
                    const priority = (notif as any).priority || 'normal';
                    const config = notifTypeConfig[type] || notifTypeConfig.system;
                    const Icon = config.icon;
                    const isUnread = !notif.read;

                    return (
                      <motion.div
                        key={notif.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${priorityColors[priority]} ${isUnread ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                      >
                        <div className="flex items-start gap-2.5">
                          {/* Icon */}
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                            <Icon className={`w-4 h-4 ${config.color}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-xs leading-relaxed ${isUnread ? 'font-bold' : 'font-medium'}`}>
                                {notif.title}
                              </p>
                              {isUnread && (
                                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                              {notif.message}
                            </p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1">
                              {formatRelativeTime(notif.createdAt)}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            {isUnread && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleMarkRead(notif.id); }}
                                className="p-1 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                title="تعيين كمقروء"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(notif.id); }}
                              className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-border bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() => { setShowPanel(false); setScreen('admin-notifications'); }}
                className="w-full py-2 text-xs font-bold text-clinic-600 hover:bg-clinic-50 dark:hover:bg-clinic-900/20 rounded-xl transition-colors"
              >
                عرض جميع الإشعارات
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
