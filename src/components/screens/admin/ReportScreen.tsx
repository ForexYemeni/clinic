'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/shared/StatCard';
import { ChartCard } from '@/components/shared/ChartCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Users, BriefcaseMedical, Siren, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ReportData {
  period: string;
  stats: {
    newPatients: number;
    servicesProvided: number;
    emergencies: number;
    revenue: number;
    paymentCount: number;
    appointments: number;
  };
  dailyReports: Array<{
    id: string;
    date: string;
    patientsCount: number;
    servicesCount: number;
    emergenciesCount: number;
    notes: string | null;
    nurse: { name: string };
  }>;
  paymentByMethod: Array<{
    method: string;
    _sum: { amount: number };
    _count: number;
  }>;
}

const COLORS = ['#0d9488', '#059669', '#f59e0b'];

export function ReportScreen() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');

  useEffect(() => {
    fetchReport();
  }, [period]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?type=${period}`);
      const data = await res.json();
      setData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="جاري تحميل التقرير..." />;
  if (!data) return null;

  const methodLabels: Record<string, string> = { cash: 'نقدي', card: 'بطاقة', insurance: 'تأمين' };
  const pieData = data.paymentByMethod.map((p) => ({
    name: methodLabels[p.method] || p.method,
    value: p._sum.amount || 0,
  }));

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-foreground mb-4">التقارير</h2>

      {/* Period selector */}
      <div className="flex gap-2 mb-4">
        {[
          { id: 'daily', label: 'يومي' },
          { id: 'weekly', label: 'أسبوعي' },
          { id: 'monthly', label: 'شهري' },
        ].map((p) => (
          <Button
            key={p.id}
            variant={period === p.id ? 'default' : 'outline'}
            size="sm"
            className="rounded-xl"
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard icon={Users} value={data.stats.newPatients} label="مرضى جدد" gradient="stat-gradient-teal" />
        <StatCard icon={BriefcaseMedical} value={data.stats.servicesProvided} label="خدمات مقدمة" gradient="stat-gradient-emerald" />
        <StatCard icon={Siren} value={data.stats.emergencies} label="حالات طوارئ" gradient="stat-gradient-red" />
        <StatCard icon={DollarSign} value={data.stats.revenue.toLocaleString()} label="الإيرادات (ر.س)" gradient="stat-gradient-amber" />
      </div>

      {/* Payment method distribution */}
      {pieData.length > 0 && (
        <ChartCard title="توزيع طرق الدفع" className="mb-4">
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
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value} ر.س`]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {/* Daily reports */}
      {data.dailyReports.length > 0 && (
        <Card className="medical-card">
          <h3 className="font-semibold mb-3">تقارير التمريض</h3>
          <div className="space-y-3">
            {data.dailyReports.map((report) => (
              <div key={report.id} className="bg-muted/50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{report.nurse.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(report.date).toLocaleDateString('ar-SA')}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <p className="font-bold text-foreground">{report.patientsCount}</p>
                    <p className="text-muted-foreground">مرضى</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-foreground">{report.servicesCount}</p>
                    <p className="text-muted-foreground">خدمات</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-foreground">{report.emergenciesCount}</p>
                    <p className="text-muted-foreground">طوارئ</p>
                  </div>
                </div>
                {report.notes && (
                  <p className="text-xs text-muted-foreground mt-2">{report.notes}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
