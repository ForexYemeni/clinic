'use client';

import React from 'react';
import { Users, AlertTriangle, Calendar, Stethoscope, UserPlus, FileText, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { useData } from '@/hooks/useData';
import { StatCard } from '@/components/shared/StatCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { DashboardData, formatTime, statusColors, statusLabels, statGradients, ScreenType } from '@/lib/constants';

const NurseDashboard = React.memo(function NurseDashboard() {
  const { setScreen, user } = useAppStore();
  const { data, loading } = useData<DashboardData>('/api/dashboard');

  if (loading && !data) return <SkeletonLoader type="dashboard" />;
  if (!data) return <EmptyState icon={AlertTriangle} title="خطأ في تحميل البيانات" />;

  return (
    <div className="px-4 pb-24 pt-2 space-y-4">
      <div>
        <h2 className="text-lg font-bold">مرحباً {user?.name} 👋</h2>
        <p className="text-sm text-muted-foreground">لوحة التحكم</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users} label="إجمالي المرضى" value={data.totalPatients} color="text-white" gradient={statGradients.emerald} />
        <StatCard icon={AlertTriangle} label="طوارئ نشطة" value={data.activeEmergencies} color="text-white" gradient={statGradients.red} />
        <StatCard icon={Calendar} label="مواعيد اليوم" value={data.todayAppointments} color="text-white" gradient={statGradients.blue} />
        <StatCard icon={Stethoscope} label="خدمات اليوم" value={data.totalServices} color="text-white" gradient={statGradients.amber} />
      </div>

      {/* Today's Schedule */}
      {data.todaySchedule.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" /> مواعيد اليوم
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            {data.todaySchedule.slice(0, 4).map((appt) => (
              <div key={appt.id} className="flex items-center gap-3 p-2.5 bg-muted/50 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{formatTime(appt.date)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{appt.patient?.name}</p>
                  <p className="text-xs text-muted-foreground">{appt.notes}</p>
                </div>
                <Badge className={`text-[9px] ${statusColors[appt.status]}`}>{statusLabels[appt.status]}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-bold">إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'مريض جديد', icon: UserPlus, screen: 'nurse-patients' as ScreenType, color: 'bg-gradient-to-br from-emerald-100 to-teal-50 text-emerald-600 dark:from-emerald-900/30 dark:to-teal-900/20 dark:text-emerald-400' },
              { label: 'حالة طوارئ', icon: AlertTriangle, screen: 'nurse-cases' as ScreenType, color: 'bg-gradient-to-br from-red-100 to-red-50 text-red-600 dark:from-red-900/30 dark:to-red-800/20 dark:text-red-400' },
              { label: 'تقرير يومي', icon: FileText, screen: 'nurse-daily-report' as ScreenType, color: 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 dark:from-blue-900/30 dark:to-blue-800/20 dark:text-blue-400' },
            ].map((item) => (
              <button key={item.screen} onClick={() => setScreen(item.screen)} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl touch-feedback ${item.color} hover:shadow-sm transition-shadow`}>
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export { NurseDashboard };
