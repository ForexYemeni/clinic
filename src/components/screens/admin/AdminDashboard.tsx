'use client';

import { useEffect, useState } from 'react';
import { Users, BriefcaseMedical, Siren, DollarSign, CalendarDays, TrendingUp, AlertTriangle } from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { ChartCard } from '@/components/shared/ChartCard';
import { EmergencyBadge } from '@/components/shared/EmergencyBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Card } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardData {
  stats: {
    totalPatients: number;
    totalServices: number;
    activeEmergencies: number;
    todayAppointments: number;
    totalRevenue: number;
    totalNurses: number;
  };
  revenueByDay: Record<string, number>;
  serviceDistribution: { name: string; count: number }[];
  emergencyBySeverity: { severity: string; _count: { severity: number } }[];
  recentEmergencies: Array<{
    id: string;
    severity: string;
    status: string;
    arrivalTime: string;
    patient: { name: string };
    nurse: { name: string } | null;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    method: string;
    description: string;
    createdAt: string;
    patient: { name: string };
  }>;
  todayAppointments: Array<{
    id: string;
    date: string;
    type: string;
    status: string;
    patient: { name: string; phone: string };
    nurse: { name: string } | null;
  }>;
}

const COLORS = ['#0d9488', '#059669', '#f59e0b', '#dc2626', '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6'];

export function AdminDashboard() {
  const { setScreen, setNotifications, user } = useAppStore();
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
      setData(data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
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
      console.error('Notifications fetch error:', error);
    }
  };

  if (loading) return <LoadingSpinner text="جاري تحميل لوحة التحكم..." />;

  if (!data) return null;

  const revenueData = Object.entries(data.revenueByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({
      date: new Date(date).toLocaleDateString('ar-SA', { weekday: 'short' }),
      amount,
    }));

  const pieData = data.serviceDistribution.map((s) => ({
    name: s.name,
    value: s.count,
  }));

  return (
    <div className="p-4 space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Users}
          value={data.stats.totalPatients}
          label="إجمالي المرضى"
          gradient="stat-gradient-teal"
        />
        <StatCard
          icon={Siren}
          value={data.stats.activeEmergencies}
          label="حالات الطوارئ"
          gradient="stat-gradient-red"
        />
        <StatCard
          icon={DollarSign}
          value={`${data.stats.totalRevenue.toLocaleString()}`}
          label="إجمالي الإيرادات (ر.س)"
          gradient="stat-gradient-emerald"
        />
        <StatCard
          icon={CalendarDays}
          value={data.stats.todayAppointments}
          label="مواعيد اليوم"
          gradient="stat-gradient-amber"
        />
      </div>

      {/* Revenue Chart */}
      {revenueData.length > 0 && (
        <ChartCard title="الإيرادات - آخر 7 أيام">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value} ر.س`, 'الإيرادات']}
                />
                <Bar dataKey="amount" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {/* Service Distribution */}
      {pieData.length > 0 && (
        <ChartCard title="توزيع الخدمات">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {/* Active Emergencies */}
      {data.recentEmergencies.length > 0 && (
        <Card className="medical-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              حالات الطوارئ النشطة
            </h3>
            <button
              onClick={() => setScreen('emergencies')}
              className="text-xs text-primary font-medium"
            >
              عرض الكل
            </button>
          </div>
          <div className="space-y-3">
            {data.recentEmergencies.map((em) => (
              <div
                key={em.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-xl cursor-pointer"
                onClick={() => setScreen('emergencies')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 pulse-emergency" />
                  <div>
                    <p className="text-sm font-medium">{em.patient.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {em.nurse?.name || 'لم يُعين بعد'}
                    </p>
                  </div>
                </div>
                <EmergencyBadge severity={em.severity} size="sm" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Today's Appointments */}
      {data.todayAppointments.length > 0 && (
        <Card className="medical-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              مواعيد اليوم
            </h3>
            <button
              onClick={() => setScreen('appointments')}
              className="text-xs text-primary font-medium"
            >
              عرض الكل
            </button>
          </div>
          <div className="space-y-2">
            {data.todayAppointments.slice(0, 5).map((appt) => (
              <div
                key={appt.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
              >
                <div>
                  <p className="text-sm font-medium">{appt.patient.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(appt.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    {appt.nurse && ` - ${appt.nurse.name}`}
                  </p>
                </div>
                <StatusBadge status={appt.status} size="sm" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Payments */}
      {data.recentPayments.length > 0 && (
        <Card className="medical-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              آخر المدفوعات
            </h3>
            <button
              onClick={() => setScreen('finance')}
              className="text-xs text-primary font-medium"
            >
              عرض الكل
            </button>
          </div>
          <div className="space-y-2">
            {data.recentPayments.slice(0, 5).map((pay) => (
              <div
                key={pay.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
              >
                <div>
                  <p className="text-sm font-medium">{pay.patient.name}</p>
                  <p className="text-xs text-muted-foreground">{pay.description}</p>
                </div>
                <span className="text-sm font-bold text-emerald-600">{pay.amount} ر.س</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
