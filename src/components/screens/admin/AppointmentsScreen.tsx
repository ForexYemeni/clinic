'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Calendar, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { useData } from '@/hooks/useData';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { AppointmentItem, formatTime, statusColors, statusLabels, appointmentTypeLabels, appointmentTypeColors } from '@/lib/constants';
import { toast } from 'sonner';

const AppointmentsScreen = React.memo(function AppointmentsScreen() {
  const { setScreen, user } = useAppStore();
  const { data: appointments, loading, refresh } = useData<AppointmentItem[]>('/api/appointments');
  const [filter, setFilter] = useState('all');

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toDateString(), [today]);

  const todayAppts = useMemo(() => (appointments || []).filter((a) => new Date(a.date).toDateString() === todayStr), [appointments, todayStr]);
  const upcomingAppts = useMemo(() => (appointments || []).filter((a) => new Date(a.date) > today && a.status === 'scheduled'), [appointments, today]);
  const displayAppts = useMemo(() => {
    if (!appointments) return [];
    if (filter === 'all') return appointments;
    if (filter === 'today') return todayAppts;
    return appointments.filter((a) => a.status === filter);
  }, [appointments, filter, todayAppts]);

  const handleStatusChange = useCallback(async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(`تم تحديث الموعد إلى: ${statusLabels[newStatus]}`);
      refresh();
    } catch {
      toast.error('خطأ في التحديث');
    }
  }, [refresh]);

  if (loading && !appointments) return <SkeletonLoader type="card-list" />;

  return (
    <div className="px-4 pb-24 pt-2 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">المواعيد</h2>
        <Button size="sm" className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 shadow-sm" onClick={() => setScreen('admin-add-appointment')}>
          <Plus className="w-4 h-4 ml-1" /> موعد جديد
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-3 text-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10">
            <p className="text-lg font-bold text-emerald-600">{todayAppts.length}</p>
            <p className="text-[10px] text-muted-foreground">اليوم</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-3 text-center bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10">
            <p className="text-lg font-bold text-blue-600">{upcomingAppts.length}</p>
            <p className="text-[10px] text-muted-foreground">قادمة</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-3 text-center bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10">
            <p className="text-lg font-bold text-amber-600">{(appointments || []).filter((a) => a.status === 'scheduled').length}</p>
            <p className="text-[10px] text-muted-foreground">مجدولة</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'today', label: 'اليوم' },
          { id: 'all', label: 'الكل' },
          { id: 'scheduled', label: 'مجدول' },
          { id: 'confirmed', label: 'مؤكد' },
          { id: 'completed', label: 'مكتمل' },
          { id: 'cancelled', label: 'ملغي' },
        ].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all touch-feedback ${filter === f.id ? 'bg-emerald-600 text-white shadow-sm' : 'bg-muted text-muted-foreground'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {displayAppts.length === 0 ? (
        <EmptyState icon={Calendar} title="لا توجد مواعيد" />
      ) : (
        <div className="space-y-2">
          {displayAppts.map((appt) => (
            <Card key={appt.id} className="border-0 shadow-sm touch-feedback overflow-hidden">
              <CardContent className="p-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-12 text-center shrink-0">
                    <p className="text-sm font-bold">{formatTime(appt.date)}</p>
                    <p className="text-[10px] text-muted-foreground">{appt.duration || 30} د</p>
                  </div>
                  <div className="w-px h-10 bg-border shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{appt.patient?.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {appt.type && (
                        <Badge className={`text-[8px] h-4 ${appointmentTypeColors[appt.type] || ''}`}>
                          {appointmentTypeLabels[appt.type] || appt.type}
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground truncate">{appt.notes}</p>
                    </div>
                  </div>
                  <Badge className={`text-[9px] shrink-0 ${statusColors[appt.status]}`}>{statusLabels[appt.status]}</Badge>
                </div>
                {/* Quick actions */}
                {appt.status === 'scheduled' && (
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/50">
                    <button onClick={(e) => { e.stopPropagation(); handleStatusChange(appt.id, 'confirmed'); }} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-medium touch-feedback">
                      <CheckCircle className="w-3 h-3" /> تأكيد
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleStatusChange(appt.id, 'completed'); }} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium touch-feedback">
                      <Clock className="w-3 h-3" /> إكمال
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleStatusChange(appt.id, 'cancelled'); }} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-medium touch-feedback">
                      <XCircle className="w-3 h-3" /> إلغاء
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
});

export { AppointmentsScreen };
