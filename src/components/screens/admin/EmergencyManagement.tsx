'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { AlertTriangle, Plus, Clock, User, CheckCircle, ArrowRightLeft, Archive } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { useData } from '@/hooks/useData';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import {
  EmergencyItem, formatTime, formatRelativeTime,
  severityColors, severityLabels, severityDotColors, severityBorderColors,
  statusColors, statusLabels,
} from '@/lib/constants';
import { toast } from 'sonner';

const EmergencyManagement = React.memo(function EmergencyManagement() {
  const { setScreen } = useAppStore();
  const { data: emergencies, loading, refresh } = useData<EmergencyItem[]>('/api/emergencies');
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    if (!emergencies) return [];
    return filter === 'all' ? emergencies : emergencies.filter((e) => e.status === filter);
  }, [emergencies, filter]);

  const activeCount = useMemo(() => (emergencies || []).filter((e) => e.status === 'active').length, [emergencies]);

  const handleStatusChange = useCallback(async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/emergencies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(`تم تحديث الحالة إلى: ${statusLabels[newStatus]}`);
      refresh();
    } catch {
      toast.error('خطأ في التحديث');
    }
  }, [refresh]);

  if (loading && !emergencies) return <SkeletonLoader type="card-list" />;

  return (
    <div className="px-4 pb-24 pt-2 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">الطوارئ</h2>
        <Button size="sm" className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 shadow-sm" onClick={() => setScreen('admin-add-emergency')}>
          <Plus className="w-4 h-4 ml-1" /> حالة جديدة
        </Button>
      </div>

      {activeCount > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl flex items-center gap-2 border border-red-200 dark:border-red-800 animate-pulse-glow">
          <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
          <span className="text-sm font-semibold text-red-700 dark:text-red-400">{activeCount} حالة طوارئ نشطة</span>
        </div>
      )}

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'active', label: 'نشطة' },
          { id: 'treated', label: 'تم العلاج' },
          { id: 'transferred', label: 'محولة' },
          { id: 'archived', label: 'مؤرشفة' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all duration-200 touch-feedback ${
              filter === f.id ? 'bg-emerald-600 text-white shadow-sm' : 'bg-muted text-muted-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="لا توجد حالات طوارئ" />
      ) : (
        <div className="space-y-2">
          {filtered.map((em) => (
            <Card
              key={em.id}
              className={`border-0 shadow-sm touch-feedback overflow-hidden ${
                em.severity === 'critical' ? `border-r-4 ${severityBorderColors[em.severity]}` :
                em.severity === 'high' ? `border-r-4 ${severityBorderColors[em.severity]}` : ''
              } ${em.status === 'active' && em.severity === 'critical' ? 'animate-pulse-glow' : ''}`}
            >
              <CardContent className="p-3.5">
                <div className="flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${severityDotColors[em.severity]} ${em.status === 'active' ? 'animate-pulse-slow' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold truncate">{em.patient?.name}</p>
                      <Badge className={`text-[9px] ${severityColors[em.severity]}`}>{severityLabels[em.severity]}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{em.notes}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(em.arrivalTime)}</span>
                      <span className="text-[9px]">{formatRelativeTime(em.arrivalTime)}</span>
                      {em.nurse && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {em.nurse.name}</span>}
                    </div>
                    {em.actions && <p className="text-xs bg-muted/50 p-2 rounded-lg mt-2">{em.actions}</p>}

                    {/* Quick status buttons for active emergencies */}
                    {em.status === 'active' && (
                      <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-border/50">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(em.id, 'treated'); }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-medium touch-feedback"
                        >
                          <CheckCircle className="w-3 h-3" /> تم العلاج
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(em.id, 'transferred'); }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-medium touch-feedback"
                        >
                          <ArrowRightLeft className="w-3 h-3" /> تحويل
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(em.id, 'archived'); }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400 text-[10px] font-medium touch-feedback"
                        >
                          <Archive className="w-3 h-3" /> أرشفة
                        </button>
                      </div>
                    )}
                  </div>
                  <Badge className={`text-[9px] shrink-0 ${statusColors[em.status]}`}>{statusLabels[em.status]}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Emergency FAB */}
      <button
        onClick={() => setScreen('admin-add-emergency')}
        className="fixed bottom-20 left-4 z-30 w-14 h-14 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 flex items-center justify-center touch-feedback animate-slide-up"
      >
        <div className="absolute inset-0 rounded-full animate-ping bg-red-400/20" />
        <AlertTriangle className="w-6 h-6 relative" />
      </button>
    </div>
  );
});

export { EmergencyManagement };
