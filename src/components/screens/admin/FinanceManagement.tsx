'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ChartCard } from '@/components/shared/ChartCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { DollarSign, CreditCard, Receipt, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Payment {
  id: string;
  amount: number;
  method: string;
  type: string;
  description: string | null;
  createdAt: string;
  patient: { name: string };
}

interface Invoice {
  id: string;
  items: string;
  total: number;
  paid: number;
  status: string;
  dueDate: string | null;
  createdAt: string;
  patient: { name: string };
}

export function FinanceManagement() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pRes, iRes] = await Promise.all([
        fetch('/api/payments'),
        fetch('/api/invoices'),
      ]);
      const pData = await pRes.json();
      const iData = await iRes.json();
      setPayments(pData.payments || []);
      setInvoices(iData.invoices || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="جاري تحميل البيانات المالية..." />;

  const totalRevenue = payments.filter(p => p.type === 'payment').reduce((sum, p) => sum + p.amount, 0);
  const totalRefunds = payments.filter(p => p.type === 'refund').reduce((sum, p) => sum + p.amount, 0);
  const unpaidTotal = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + (i.total - i.paid), 0);

  // Revenue by day chart data
  const revenueByDay: Record<string, number> = {};
  payments.filter(p => p.type === 'payment').forEach(p => {
    const day = new Date(p.createdAt).toLocaleDateString('ar-SA');
    revenueByDay[day] = (revenueByDay[day] || 0) + p.amount;
  });
  const revenueData = Object.entries(revenueByDay).map(([date, amount]) => ({ date, amount }));

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-foreground mb-4">الإدارة المالية</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard icon={DollarSign} value={totalRevenue.toLocaleString()} label="إجمالي الإيرادات" gradient="stat-gradient-emerald" />
        <StatCard icon={TrendingUp} value={totalRefunds.toLocaleString()} label="إجمالي الاستردادات" gradient="stat-gradient-red" />
        <StatCard icon={CreditCard} value={payments.length} label="عدد العمليات" gradient="stat-gradient-teal" />
        <StatCard icon={Receipt} value={unpaidTotal.toLocaleString()} label="مستحقات غير مدفوعة" gradient="stat-gradient-amber" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3 h-11">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="payments">المدفوعات</TabsTrigger>
          <TabsTrigger value="invoices">الفواتير</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-3">
          {revenueData.length > 0 && (
            <ChartCard title="الإيرادات">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => [`${value} ر.س`, 'المبلغ']}
                    />
                    <Bar dataKey="amount" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          )}

          {/* Payment method breakdown */}
          <Card className="medical-card mt-3">
            <h3 className="font-semibold mb-3">توزيع طرق الدفع</h3>
            <div className="space-y-2">
              {['cash', 'card', 'insurance'].map((method) => {
                const methodPayments = payments.filter(p => p.method === method && p.type === 'payment');
                const total = methodPayments.reduce((s, p) => s + p.amount, 0);
                const methodLabel = method === 'cash' ? 'نقدي' : method === 'card' ? 'بطاقة' : 'تأمين';
                return (
                  <div key={method} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                    <span className="text-sm">{methodLabel}</span>
                    <span className="text-sm font-bold">{total} ر.س ({methodPayments.length} عملية)</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-3 space-y-3">
          {payments.map((pay) => (
            <Card key={pay.id} className="medical-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{pay.patient.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {pay.description || (pay.type === 'payment' ? 'دفعة' : 'استرداد')} • {format(new Date(pay.createdAt), 'dd/MM/yyyy', { locale: ar })}
                  </p>
                </div>
                <div className="text-left">
                  <span className={`text-sm font-bold ${pay.type === 'payment' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {pay.type === 'payment' ? '+' : '-'}{pay.amount} ر.س
                  </span>
                  <Badge variant="outline" className="text-xs block mt-1">
                    {pay.method === 'cash' ? 'نقدي' : pay.method === 'card' ? 'بطاقة' : 'تأمين'}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="invoices" className="mt-3 space-y-3">
          {invoices.map((inv) => (
            <Card key={inv.id} className="medical-card p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">{inv.patient.name}</h3>
                <StatusBadge status={inv.status} size="sm" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  الإجمالي: {inv.total} ر.س
                </span>
                <span className="font-semibold text-emerald-600">
                  مدفوع: {inv.paid} ر.س
                </span>
              </div>
              {inv.total - inv.paid > 0 && (
                <p className="text-xs text-red-500 mt-1">
                  متبقي: {inv.total - inv.paid} ر.س
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(inv.createdAt), 'dd/MM/yyyy', { locale: ar })}
              </p>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
