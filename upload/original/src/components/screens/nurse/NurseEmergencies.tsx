'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, AlertTriangle, Clock, RefreshCw, User as UserIcon } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatRelativeTime, severityLabels, severityColors, severityBorderColors, statusColors, statusLabels, type EmergencyItem } from '@/lib/constants';

export function NurseEmergencies() {
  const { setScreen } = useAppStore();
  const [emergencies, setEmergencies] = useState<EmergencyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('active');

  const fetchEmergencies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/emergencies?status=${statusFilter}`);
      if (res.ok) setEmergencies(await res.json());
    } catch {} finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchEmergencies(); }, [fetchEmergencies]);

  const getPatientName = (em: EmergencyItem) => {
    return em.patientName || em.patient?.name || 'مريض';
  };

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">الطوارئ</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchEmergencies}
            className="w-9 h-9 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl text-muted-foreground active:scale-[0.97] transition-transform"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setScreen('nurse-add-emergency')}
            className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium active:scale-[0.97] transition-transform shadow-sm shadow-red-500/20"
          >
            <Plus className="w-4 h-4" />
            حالة جديدة
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['active', 'treated', 'transferred', 'archived'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              statusFilter === s ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground'
            }`}
          >
            {statusLabels[s] || s}
          </button>
        ))}
      </div>

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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`bg-white dark:bg-gray-800 rounded-2xl border-r-4 ${severityBorderColors[em.severity] || ''} border border-border overflow-hidden shadow-sm`}
            >
              {/* Emergency Header */}
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${severityColors[em.severity] || 'bg-gray-200 text-gray-600'}`}>
                      {severityLabels[em.severity] || em.severity}
                    </span>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${statusColors[em.status] || ''}`}>
                      {statusLabels[em.status] || em.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />{formatRelativeTime(em.arrivalTime || em.createdAt)}
                  </span>
                </div>
                {/* Patient Name */}
                <div className="flex items-center gap-2 mb-1">
                  <UserIcon className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-bold">{getPatientName(em)}</p>
                </div>
                {em.notes && (
                  <p className="text-xs text-muted-foreground mt-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">{em.notes}</p>
                )}
                {em.actions && (
                  <div className="mt-1.5 flex items-start gap-1.5">
                    <span className="text-[10px] bg-clinic-100 dark:bg-clinic-900/30 text-clinic-700 dark:text-clinic-400 px-2 py-0.5 rounded-full font-medium">الإجراءات</span>
                    <p className="text-xs text-clinic-700 dark:text-clinic-400">{em.actions}</p>
                  </div>
                )}
                {em.nurseName && (
                  <p className="text-[10px] text-muted-foreground mt-2">الممرض: {em.nurseName}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
