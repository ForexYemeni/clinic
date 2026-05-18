'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, AlertTriangle, Clock, ChevronLeft, Filter } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatRelativeTime, severityLabels, severityColors, severityBorderColors, statusColors, statusLabels, type EmergencyItem } from '@/lib/constants';

export function EmergencyManagement() {
  const { setScreen } = useAppStore();
  const [emergencies, setEmergencies] = useState<EmergencyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('active');

  const fetchEmergencies = useCallback(async () => {
    try {
      const res = await fetch(`/api/emergencies?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setEmergencies(data);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchEmergencies(); }, [fetchEmergencies]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/emergencies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchEmergencies();
    } catch {}
  };

  const statusFilters = [
    { id: 'active', label: 'نشطة' },
    { id: 'treated', label: 'تم العلاج' },
    { id: 'transferred', label: 'محولة' },
    { id: 'archived', label: 'مؤرشفة' },
  ];

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">إدارة الطوارئ</h2>
        <button
          onClick={() => setScreen('admin-add-emergency')}
          className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium active:scale-[0.97] transition-transform"
        >
          <Plus className="w-4 h-4" />
          حالة جديدة
        </button>
      </div>

      {/* Status Filters */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {statusFilters.map(f => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              statusFilter === f.id
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Emergency List */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>
      ) : emergencies.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground mt-3">لا توجد حالات طوارئ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {emergencies.map((em, i) => (
            <motion.div
              key={em.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-white dark:bg-gray-800 rounded-xl p-3 border-r-4 ${severityBorderColors[em.severity] || 'border-r-gray-400'} border border-border`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${severityColors[em.severity] || ''}`}>
                    {severityLabels[em.severity] || em.severity}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColors[em.status] || ''}`}>
                    {statusLabels[em.status] || em.status}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />{formatRelativeTime(em.arrivalTime)}
                </span>
              </div>
              <p className="text-sm font-medium">{em.patientName || 'مريض غير مسجل'}</p>
              {em.notes && <p className="text-xs text-muted-foreground mt-1">{em.notes}</p>}
              {em.actions && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">الإجراءات: {em.actions}</p>}
              {em.procedures && <p className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">الإجراءات الطبية: {em.procedures}</p>}
              {em.nurseName && <p className="text-xs text-muted-foreground mt-1">الممرض: {em.nurseName}</p>}

              {/* Status Actions */}
              {em.status === 'active' && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleUpdateStatus(em.id, 'treated')}
                    className="flex-1 h-8 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-lg font-medium active:scale-[0.97] transition-transform"
                  >
                    تم العلاج
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(em.id, 'transferred')}
                    className="flex-1 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-lg font-medium active:scale-[0.97] transition-transform"
                  >
                    تحويل
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(em.id, 'archived')}
                    className="flex-1 h-8 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400 text-xs rounded-lg font-medium active:scale-[0.97] transition-transform"
                  >
                    أرشفة
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
