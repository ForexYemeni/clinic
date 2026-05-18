'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, AlertTriangle, Calendar, DollarSign, Plus, Clock, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { useData } from '@/hooks/useData';
import { StatCard } from '@/components/shared/StatCard';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  DashboardData, formatCurrency, formatTime,
  severityColors, severityLabels, statusColors, statusLabels,
  CHART_COLORS, statGradients,
} from '@/lib/constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard = React.memo(function AdminDashboard() {
  const { setScreen } = useAppStore();
  const { data, loading, refresh } = useData<DashboardData>('/api/dashboard');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const handleRefresh = useCallback(() => {
    refresh();
    setLastUpdated(new Date());
  }, [refresh]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.servicesByCategory.map((s) => ({
      name: s.category,
      value: s._count.id,
    }));
  }, [data]);

  const revenueData = useMemo(() => [
    { name: 'السبت', revenue: 450 },
    { name: 'الأحد', revenue: 680 },
    { name: 'الاثنين', revenue: 520 },
    { name: 'الثلاثاء', revenue: 890 },
    { name: 'الأربعاء', revenue: 750 },
    { name: 'الخميس', revenue: 960 },
  ], []);

  if (loading && !data) return <SkeletonLoader type="dashboard" />;
  if (!data) return <EmptyState icon={AlertTriangle} title="خطأ في تحميل البيانات" description="اسحب للأسفل للتحديث" />;

  return (
    <div className="px-4 pb-24 space-y-4 pt-2">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">مرحباً بك 👋</h2>
          <p className="text-sm text-muted-foreground">لوحة التحكم الرئيسية</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl touch-feedback" onClick={handleRefresh}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 shadow-sm shadow-emerald-500/20" onClick={() => setScreen('admin-add-patient')}>
            <Plus className="w-4 h-4 ml-1" /> مريض
          </Button>
        </div>
      </div>

      {/* Last updated */}
      <p className="text-[10px] text-muted-foreground -mt-2">
        آخر تحديث: {lastUpdated.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users} label="إجمالي المرضى" value={data.totalPatients} color="text-white" gradient={statGradients.emerald} trend="+12%" />
        <StatCard icon={AlertTriangle} label="حالات الطوارئ" value={data.activeEmergencies} color="text-white" gradient={statGradients.red} />
        <StatCard icon={Calendar} label="مواعيد اليوم" value={data.todayAppointments} color="text-white" gradient={statGradients.blue} />
        <StatCard icon={DollarSign} label="إيرادات اليوم" value={formatCurrency(data.todayRevenue)} color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" gradient={statGradients.amber} trend="+8%" />
      </div>

      {/* Revenue Chart */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-bold">الإيرادات الأسبوعية</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }}
                formatter={(v: number) => [formatCurrency(v), 'الإيرادات']}
              />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#0d9488" />
                </linearGradient>
              </defs>
              <Bar dataKey="revenue" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Services Distribution */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-bold">توزيع الخدمات</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={55} strokeWidth={0} paddingAngle={2}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {chartData.map((item, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-muted-foreground truncate">{item.name}</span>
                  <span className="font-semibold mr-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Emergencies */}
      {data.recentEmergencies.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-sm border-r-4 border-r-red-500">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> حالات الطوارئ النشطة
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setScreen('admin-emergencies')}>عرض الكل</Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-2">
              {data.recentEmergencies.slice(0, 3).map((em) => (
                <div key={em.id} className="flex items-center gap-3 p-2.5 bg-red-50 dark:bg-red-900/10 rounded-xl touch-feedback border border-red-100/50 dark:border-red-800/20" onClick={() => { useAppStore.getState().setSelectedEmergencyId(em.id); setScreen('admin-emergencies'); }}>
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse-slow" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{em.patient?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{em.notes}</p>
                  </div>
                  <Badge className={`text-[10px] ${severityColors[em.severity]}`}>{severityLabels[em.severity]}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Today Schedule */}
      {data.todaySchedule.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" /> مواعيد اليوم
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setScreen('admin-appointments')}>عرض الكل</Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            {data.todaySchedule.slice(0, 4).map((appt) => (
              <div key={appt.id} className="flex items-center gap-3 p-2.5 bg-muted/50 rounded-xl touch-feedback" onClick={() => setScreen('admin-appointments')}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{formatTime(appt.date)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{appt.patient?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{appt.notes}</p>
                </div>
                <Badge className={`text-[10px] ${statusColors[appt.status] || ''}`}>{statusLabels[appt.status]}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
});

export { AdminDashboard };
