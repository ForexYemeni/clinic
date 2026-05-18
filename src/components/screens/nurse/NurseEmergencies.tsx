'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, AlertTriangle, Clock } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatRelativeTime, severityLabels, severityColors, severityBorderColors, statusColors, statusLabels, type EmergencyItem } from '@/lib/constants';

export function NurseEmergencies() {
  const { setScreen } = useAppStore();
  const [emergencies, setEmergencies] = useState<EmergencyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('active');

  const fetchEmergencies = useCallback(async () => {
    try {
      const res = await fetch(`/api/emergencies?status=${statusFilter}`);
      if (res.ok) setEmergencies(await res.json());
    } catch {} finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchEmergencies(); }, [fetchEmergencies]);

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">الطوارئ</h2>
        <button
          onClick={() => setScreen('nurse-add-emergency')}
          className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium active:scale-[0.97] transition-transform"
        >
          <Plus className="w-4 h-4" />
          حالة جديدة
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['active', 'treated', 'transferred', 'archived'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              statusFilter === s ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground'
            }`}
          >
            {statusLabels[s] || s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>
      ) : emergencies.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground mt-3">لا توجد حالات طوارئ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {emergencies.map(em => (
            <div key={em.id} className={`bg-white dark:bg-gray-800 rounded-xl p-3 border-r-4 ${severityBorderColors[em.severity] || ''} border border-border`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${severityColors[em.severity] || ''}`}>
                    {severityLabels[em.severity]}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColors[em.status] || ''}`}>
                    {statusLabels[em.status]}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />{formatRelativeTime(em.arrivalTime)}
                </span>
              </div>
              <p className="text-sm font-medium">{em.patientName || 'مريض'}</p>
              {em.notes && <p className="text-xs text-muted-foreground mt-1">{em.notes}</p>}
              {em.actions && <p className="text-xs text-emerald-600 mt-1">الإجراءات: {em.actions}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
