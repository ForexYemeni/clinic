'use client';

import React from 'react';
import { Users, AlertTriangle, Stethoscope, UserPlus, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { useData } from '@/hooks/useData';
import { StatCard } from '@/components/shared/StatCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { DashboardData, statGradients } from '@/lib/constants';
import { PwaInstallBanner } from '@/components/shared/PwaInstallPrompt';

const NurseDashboard = React.memo(function NurseDashboard() {
  const { setScreen, user } = useAppStore();
  const nurseParam = user?.id ? `?role=nurse&nurseId=${user.id}` : '?role=nurse';
  const { data, loading } = useData<DashboardData>(`/api/dashboard${nurseParam}`);

  if (loading && !data) return <SkeletonLoader type="dashboard" />;
  if (!data) return <EmptyState icon={AlertTriangle} title="خطأ في تحميل البيانات" />;

  return (
    <div className="px-4 pb-24 pt-2 space-y-4">
      {/* PWA Install Banner */}
      <PwaInstallBanner />

      <div>
        <h2 className="text-lg font-bold">مرحباً {user?.name} 👋</h2>
        <p className="text-sm text-muted-foreground">لوحة التحكم</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users} label="إجمالي المرضى" value={data.totalPatients} color="text-white" gradient={statGradients.emerald} />
        <StatCard icon={AlertTriangle} label="طوارئ نشطة" value={data.activeEmergencies} color="text-white" gradient={statGradients.red} />
        <StatCard icon={Stethoscope} label="خدمات اليوم" value={data.todayServices} color="text-white" gradient={statGradients.teal} />
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-bold">إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'مريض جديد', icon: UserPlus, screen: 'nurse-patients' as const, color: 'bg-gradient-to-br from-clinic-100 to-teal-50 text-clinic-600 dark:from-clinic-900/30 dark:to-teal-900/20 dark:text-clinic-400' },
              { label: 'حالة طوارئ', icon: AlertTriangle, screen: 'nurse-emergencies' as const, color: 'bg-gradient-to-br from-red-100 to-red-50 text-red-600 dark:from-red-900/30 dark:to-red-800/20 dark:text-red-400' },
              { label: 'تقرير يومي', icon: FileText, screen: 'nurse-reports' as const, color: 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 dark:from-blue-900/30 dark:to-blue-800/20 dark:text-blue-400' },
            ].map((item) => (
              <button key={item.screen} onClick={() => setScreen(item.screen)} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl touch-feedback ${item.color} hover:shadow-sm transition-shadow`}>
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Emergencies */}
      {data.recentEmergencies.length > 0 && (
        <Card className="border-0 shadow-sm border-r-4 border-r-red-500">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" /> طوارئ نشطة
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            {data.recentEmergencies.slice(0, 3).map((em) => (
              <div key={em.id} className="flex items-center gap-3 p-2.5 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100/50 dark:border-red-800/20">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse-slow" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{em.patient?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{em.notes}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
});

export { NurseDashboard };
