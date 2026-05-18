'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmergencyBadge } from '@/components/shared/EmergencyBadge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Users, CalendarDays, Siren, BriefcaseMedical, Clock, User } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { setNotifications } from '@/lib/store';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface DashboardData {
  stats: {
    totalPatients: number;
    todayAppointments: number;
    activeEmergencies: number;
    totalServices: number;
  };
  recentEmergencies: Array<{
    id: string;
    severity: string;
    status: string;
    arrivalTime: string;
    patient: { name: string };
    nurse: { name: string } | null;
  }>;
  todayAppointments: Array<{
    id: string;
    date: string;
    type: string | null;
    status: string;
    patient: { name: string; phone: string };
    nurse: { name: string } | null;
  }>;
}

export function NurseDashboard() {
  const { user, setScreen, setNotifications } = useAppStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
    fetchNotifications();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setData({
        stats: {
          totalPatients: data.stats.totalPatients,
          todayAppointments: data.stats.todayAppointments,
          activeEmergencies: data.stats.activeEmergencies,
          totalServices: data.stats.totalServices,
        },
        recentEmergencies: data.recentEmergencies,
        todayAppointments: data.todayAppointments,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}`);
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <LoadingSpinner text="جاري تحميل لوحة التحكم..." />;
  if (!data) return null;

  const myAppointments = data.todayAppointments.filter(a => a.nurse?.name === user?.name);

  return (
    <div className="p-4 space-y-4">
      {/* Greeting */}
      <div className="mb-2">
        <h2 className="text-xl font-bold text-foreground">مرحباً، {user?.name}</h2>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={CalendarDays} value={myAppointments.length} label="مواعيدي اليوم" gradient="stat-gradient-teal" />
        <StatCard icon={Siren} value={data.stats.activeEmergencies} label="حالات الطوارئ" gradient="stat-gradient-red" />
        <StatCard icon={Users} value={data.stats.totalPatients} label="إجمالي المرضى" gradient="stat-gradient-emerald" />
        <StatCard icon={BriefcaseMedical} value={data.stats.totalServices} label="الخدمات المتاحة" gradient="stat-gradient-amber" />
      </div>

      {/* Today's Appointments */}
      <Card className="medical-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            مواعيدي اليوم
          </h3>
          <button onClick={() => setScreen('appointments')} className="text-xs text-primary font-medium">عرض الكل</button>
        </div>
        {myAppointments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">لا توجد مواعيد اليوم</p>
        ) : (
          <div className="space-y-2">
            {myAppointments.map((appt) => (
              <div key={appt.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                <div>
                  <p className="text-sm font-medium">{appt.patient.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(appt.date), 'HH:mm', { locale: ar })}
                    {appt.type && ` - ${appt.type === 'checkup' ? 'فحص' : appt.type === 'follow-up' ? 'متابعة' : appt.type === 'treatment' ? 'علاج' : 'طوارئ'}`}
                  </p>
                </div>
                <StatusBadge status={appt.status} size="sm" />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Active Emergencies */}
      {data.recentEmergencies.length > 0 && (
        <Card className="medical-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Siren className="w-4 h-4 text-red-500" />
              حالات الطوارئ النشطة
            </h3>
            <button onClick={() => setScreen('cases')} className="text-xs text-primary font-medium">عرض الكل</button>
          </div>
          <div className="space-y-2">
            {data.recentEmergencies.map((em) => (
              <div key={em.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 pulse-emergency" />
                  <div>
                    <p className="text-sm font-medium">{em.patient.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(em.arrivalTime), 'HH:mm', { locale: ar })}
                    </p>
                  </div>
                </div>
                <EmergencyBadge severity={em.severity} size="sm" />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
