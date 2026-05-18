'use client';

import React, { useMemo } from 'react';
import { ChevronRight, DollarSign, Receipt, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/lib/store';
import { useData } from '@/hooks/useData';
import { StatCard } from '@/components/shared/StatCard';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import {
  PaymentItem, InvoiceItem, formatCurrency, formatDate,
  statusColors, statusLabels, statGradients,
} from '@/lib/constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const FinanceManagement = React.memo(function FinanceManagement() {
  const { setScreen } = useAppStore();
  const { data: payments, loading: pLoading } = useData<PaymentItem[]>('/api/payments');
  const { data: invoices, loading: iLoading } = useData<InvoiceItem[]>('/api/invoices');
  const [tab, setTab] = React.useState<'payments' | 'invoices'>('payments');

  const loading = pLoading || iLoading;

  const totalRevenue = useMemo(() => (payments || []).reduce((sum, p) => sum + (p.type === 'payment' ? p.amount : -p.amount), 0), [payments]);
  const unpaidTotal = useMemo(() => (invoices || []).filter((i) => i.status !== 'paid').reduce((sum, i) => sum + (i.total - i.paid), 0), [invoices]);

  const revenueData = useMemo(() => [
    { name: 'السبت', revenue: 450 },
    { name: 'الأحد', revenue: 680 },
    { name: 'الاثنين', revenue: 520 },
    { name: 'الثلاثاء', revenue: 890 },
    { name: 'الأربعاء', revenue: 750 },
    { name: 'الخميس', revenue: 960 },
  ], []);

  if (loading && !payments && !invoices) return <SkeletonLoader type="chart" />;

  return (
    <div className="px-4 pb-24 pt-2 space-y-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setScreen('admin-more')}>
          <ChevronRight className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold">النظام المالي</h2>
      </div>

      {/* Summary cards with gradients */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={DollarSign} label="إجمالي الإيرادات" value={formatCurrency(totalRevenue)} color="text-white" gradient={statGradients.emerald} />
        <StatCard icon={Receipt} label="مستحقات معلقة" value={formatCurrency(unpaidTotal)} color="text-white" gradient={statGradients.red} />
      </div>

      {/* Mini revenue chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> اتجاه الإيرادات
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px' }} formatter={(v: number) => [formatCurrency(v), 'الإيرادات']} />
              <defs>
                <linearGradient id="financeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#0d9488" />
                </linearGradient>
              </defs>
              <Bar dataKey="revenue" fill="url(#financeGradient)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
        <button onClick={() => setTab('payments')} className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${tab === 'payments' ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground'}`}>المدفوعات</button>
        <button onClick={() => setTab('invoices')} className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${tab === 'invoices' ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground'}`}>الفواتير</button>
      </div>

      {tab === 'payments' ? (
        <div className="space-y-2">
          {(payments || []).map((p) => (
            <Card key={p.id} className="border-0 shadow-sm">
              <CardContent className="p-3.5 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.type === 'payment' ? 'bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/20' : 'bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20'}`}>
                  <DollarSign className={`w-5 h-5 ${p.type === 'payment' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{p.patient?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.description}</p>
                </div>
                <div className="text-left shrink-0">
                  <p className={`text-sm font-bold ${p.type === 'payment' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {p.type === 'payment' ? '+' : '-'}{formatCurrency(p.amount)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{formatDate(p.createdAt)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {(invoices || []).map((inv) => (
            <Card key={inv.id} className="border-0 shadow-sm">
              <CardContent className="p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">{inv.patient?.name}</p>
                  <Badge className={`text-[9px] ${statusColors[inv.status]}`}>{statusLabels[inv.status]}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">الإجمالي: {formatCurrency(inv.total)}</span>
                  <span className="text-muted-foreground">المدفوع: {formatCurrency(inv.paid)}</span>
                </div>
                {inv.total > inv.paid && (
                  <Progress value={(inv.paid / inv.total) * 100} className="h-1.5 mt-2" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
});

export { FinanceManagement };
