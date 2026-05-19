'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ScrollText, Search, Shield, AlertTriangle, Info, AlertCircle, Clock, Filter } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { apiGet } from '@/lib/api';
import { formatDate, formatRelativeTime } from '@/lib/constants';

interface AuditLogItem {
  id: string;
  clinicId: string;
  userId: string;
  action: string;
  details: string;
  severity: string;
  timestamp: string;
}

const actionLabels: Record<string, string> = {
  login_success: 'تسجيل دخول ناجح',
  login_failed: 'محاولة دخول فاشلة',
  create_clinic: 'إنشاء عيادة',
  suspend_clinic: 'إيقاف عيادة',
  activate_clinic: 'تفعيل عيادة',
  delete_clinic: 'حذف عيادة',
  update_firebase_config: 'تحديث إعدادات Firebase',
  update_settings: 'تحديث الإعدادات',
  extend_subscription: 'تمديد اشتراك',
  password_change: 'تغيير كلمة المرور',
  system_reset: 'إعادة تهيئة النظام',
  create_user: 'إنشاء مستخدم',
  update_user: 'تحديث مستخدم',
  delete_user: 'حذف مستخدم',
};

const severityConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  info: { icon: Info, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  warning: { icon: AlertCircle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  critical: { icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
};

export function SuperAdminAuditLogs() {
  const { setScreen } = useAppStore();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const loadLogs = async () => {
    try {
      const data = await apiGet<AuditLogItem[]>('/api/super-admin/audit-logs');
      setLogs(data);
    } catch (err) {
      console.error('Load audit logs error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(); }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchQuery ||
      log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      actionLabels[log.action]?.includes(searchQuery);
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="p-4 space-y-4 pb-20">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => setScreen('super-admin-dashboard')} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800">
          <ChevronLeft className="w-5 h-5 rotate-180" />
        </button>
        <div>
          <h2 className="text-lg font-bold">سجل المراجعة</h2>
          <p className="text-xs text-muted-foreground">{filteredLogs.length} سجل</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="بحث في السجلات..."
          className="w-full h-10 pr-10 pl-4 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Severity Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { value: 'all', label: 'الكل' },
          { value: 'info', label: 'معلومات' },
          { value: 'warning', label: 'تحذير' },
          { value: 'critical', label: 'حرج' },
        ].map(f => (
          <button key={f.value} onClick={() => setSeverityFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              severityFilter === f.value
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Logs List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log, idx) => {
            const config = severityConfig[log.severity] || severityConfig.info;
            const IconComponent = config.icon;
            return (
              <motion.div
                key={log.id || idx}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-border p-3"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                    <IconComponent className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold truncate">
                        {actionLabels[log.action] || log.action}
                      </p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                        {log.severity === 'info' ? 'معلومات' : log.severity === 'warning' ? 'تحذير' : 'حرج'}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.details}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatRelativeTime(log.timestamp)}</span>
                      </div>
                      {log.clinicId && log.clinicId !== 'platform' && (
                        <span className="truncate">معرف العيادة: {log.clinicId.slice(0, 8)}...</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <ScrollText className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">لا توجد سجلات</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
