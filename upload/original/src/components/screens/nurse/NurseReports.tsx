'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, DollarSign, Users, Activity, Calendar, Clock, ArrowRight, FileText, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatCurrency } from '@/lib/constants';
import { apiGet } from '@/lib/api';
import { toast } from 'sonner';

interface ReportStats {
  type: string;
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalPatients: number;
  totalServices: number;
  totalVisits: number;
  totalInvoiced: number;
  unpaidAmount: number;
  paidInvoices: number;
  unpaidInvoices: number;
  emergencies: number;
  dailyBreakdown: { date: string; patients: number; revenue: number; visits: number }[];
}

export function NurseReports() {
  const { user, setScreen } = useAppStore();
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [data, setData] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = async (type: string) => {
    setLoading(true);
    setError('');
    try {
      const nurseParam = user?.id ? `&nurseId=${user.id}` : '';
      const result = await apiGet<ReportStats>(`/api/reports?type=${type}${nurseParam}`);
      setData(result);
    } catch (err: any) {
      console.error('Report fetch error:', err);
      setError(err?.message || 'خطأ في تحميل التقرير');
      toast.error('خطأ في تحميل التقرير');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchReport(reportType);
  }, [reportType, user?.id]);

  const periodLabel = reportType === 'daily' ? 'اليوم' : reportType === 'weekly' ? 'الأسبوع' : 'الشهر';

  const reportTabs = [
    { id: 'daily' as const, label: 'يومي', icon: Clock },
    { id: 'weekly' as const, label: 'أسبوعي', icon: Calendar },
    { id: 'monthly' as const, label: 'شهري', icon: BarChart3 },
  ];

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setScreen('nurse-patients')} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-xl border border-border shadow-sm active:scale-[0.97] transition-all">
          <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-foreground" />
          </div>
          <span className="text-sm font-medium">رجوع</span>
        </button>
        <button
          onClick={() => fetchReport(reportType)}
          className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center active:scale-95 transition-transform"
          title="تحديث"
        >
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-purple-500" />
        تقاريري
      </h2>
      <p className="text-xs text-muted-foreground mb-4">ملخص أدائك في العيادة</p>

      {/* Report Type Tabs */}
      <div className="flex gap-2 mb-5">
        {reportTabs.map(rt => {
          const Icon = rt.icon;
          return (
            <button
              key={rt.id}
              onClick={() => setReportType(rt.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                reportType === rt.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                  : 'bg-white dark:bg-gray-800 text-muted-foreground border border-border'
              }`}
            >
              <Icon className="w-4 h-4" />
              {rt.label}
            </button>
          );
        })}
      </div>

      {error ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 text-center border border-red-200 dark:border-red-800"
        >
          <AlertTriangle className="w-10 h-10 mx-auto text-red-400 mb-3" />
          <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-1">خطأ في تحميل التقرير</p>
          <p className="text-xs text-muted-foreground mb-3">{error}</p>
          <button
            onClick={() => fetchReport(reportType)}
            className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold active:scale-95 transition-transform"
          >
            إعادة المحاولة
          </button>
        </motion.div>
      ) : loading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={reportType} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Main Stats */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0 }}
                className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white shadow-lg shadow-green-500/20"
              >
                <DollarSign className="w-6 h-6 mb-1 opacity-80" />
                <p className="text-xs opacity-80">إيرادات {periodLabel}</p>
                <p className="text-xl font-bold">{formatCurrency(data?.totalRevenue || 0)}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 }}
                className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-500/20"
              >
                <Users className="w-6 h-6 mb-1 opacity-80" />
                <p className="text-xs opacity-80">مرضى {periodLabel}</p>
                <p className="text-xl font-bold">{data?.totalPatients || 0}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-4 text-white shadow-lg shadow-teal-500/20"
              >
                <Activity className="w-6 h-6 mb-1 opacity-80" />
                <p className="text-xs opacity-80">خدمات مقدمة</p>
                <p className="text-xl font-bold">{data?.totalServices || 0}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg shadow-purple-500/20"
              >
                <Calendar className="w-6 h-6 mb-1 opacity-80" />
                <p className="text-xs opacity-80">زيارات {periodLabel}</p>
                <p className="text-xl font-bold">{data?.totalVisits || 0}</p>
              </motion.div>
            </div>

            {/* Financial Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border overflow-hidden shadow-sm">
              <div className="p-3 border-b border-border flex items-center gap-2">
                <FileText className="w-4 h-4 text-clinic-600" />
                <h3 className="text-sm font-bold">ملخص مالي</h3>
              </div>
              <div className="divide-y divide-border">
                <div className="px-3 py-2.5 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">إجمالي الفواتير</span>
                  <span className="text-sm font-bold">{formatCurrency(data?.totalInvoiced || 0)}</span>
                </div>
                <div className="px-3 py-2.5 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">المدفوع</span>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-sm font-bold text-green-600">{formatCurrency(data?.totalRevenue || 0)}</span>
                  </div>
                </div>
                <div className="px-3 py-2.5 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">المتبقي</span>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-sm font-bold text-amber-600">{formatCurrency(data?.unpaidAmount || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Progress */}
            {(data?.totalInvoiced || 0) > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border p-3 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">نسبة التحصيل</span>
                  <span className="text-xs font-bold text-green-600">
                    {Math.round(((data?.totalRevenue || 0) / (data?.totalInvoiced || 1)) * 100)}%
                  </span>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-l from-green-400 to-green-600 h-3 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(((data?.totalRevenue || 0) / (data?.totalInvoiced || 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Daily Breakdown */}
            {data?.dailyBreakdown && data.dailyBreakdown.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border overflow-hidden shadow-sm">
                <div className="p-3 border-b border-border">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    تفاصيل يومية
                  </h3>
                </div>
                <div className="divide-y divide-border max-h-60 overflow-y-auto">
                  {data.dailyBreakdown.map((d, i) => (
                    <div key={i} className="px-3 py-2.5 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{d.date}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs">{d.visits} زيارة</span>
                        <span className="text-xs font-bold text-clinic-600">{formatCurrency(d.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {(!data || (data.totalVisits === 0 && data.totalPatients === 0)) && (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">لا توجد بيانات لـ{periodLabel}</p>
                <p className="text-xs text-muted-foreground mt-1">ستظهر الإحصائيات بعد تسجيل زيارات</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
