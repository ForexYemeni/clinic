'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, DollarSign, Users, Activity, Calendar, TrendingUp, FileText, AlertTriangle, CheckCircle, Clock, ChevronLeft, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatCurrency } from '@/lib/constants';
import { apiGet } from '@/lib/api';

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

interface ServiceStat {
  serviceId: string;
  name: string;
  count: number;
  revenue: number;
}

interface ServicesReport {
  type: string;
  services: ServiceStat[];
  totalServices: number;
  totalUsage: number;
  totalRevenue: number;
  maxCount: number;
}

export function AdminReports() {
  const { setScreen } = useAppStore();
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'services'>('daily');
  const [reportData, setReportData] = useState<ReportStats | null>(null);
  const [servicesData, setServicesData] = useState<ServicesReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const token = useAppStore.getState().token;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        if (reportType === 'services') {
          const data = await apiGet<ServicesReport>('/api/reports?type=services');
          setServicesData(data);
        } else {
          const data = await apiGet<ReportStats>(`/api/reports?type=${reportType}`);
          setReportData(data);
        }
      } catch (err) {
        console.error('Report fetch error:', err);
      } finally { setLoading(false); }
    };
    fetchReport();
  }, [reportType]);

  const periodLabel = reportType === 'daily' ? 'اليوم' : reportType === 'weekly' ? 'الأسبوع' : 'الشهر';

  const reportTabs = [
    { id: 'daily' as const, label: 'يومي', icon: Clock },
    { id: 'weekly' as const, label: 'أسبوعي', icon: Calendar },
    { id: 'monthly' as const, label: 'شهري', icon: TrendingUp },
    { id: 'services' as const, label: 'الخدمات', icon: BarChart3 },
  ];

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setScreen('admin-dashboard')} className="flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowRight className="w-4 h-4" /> رجوع
        </button>
      </div>
      <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-purple-500" />
        التقارير والإحصائيات
      </h2>
      <p className="text-xs text-muted-foreground mb-4">ملخص شامل لأداء العيادة</p>

      {/* Report Type Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto">
        {reportTabs.map(rt => {
          const Icon = rt.icon;
          return (
            <button
              key={rt.id}
              onClick={() => setReportType(rt.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
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

      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>
      ) : (
        <AnimatePresence mode="wait">
          {reportType === 'services' ? (
            <motion.div key="services" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              {/* Services Summary */}
              {servicesData && (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-purple-600">{servicesData.totalServices}</p>
                    <p className="text-[10px] text-muted-foreground">خدمة مختلفة</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-green-600">{servicesData.totalUsage}</p>
                    <p className="text-[10px] text-muted-foreground">إجمالي الاستخدام</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-blue-600">{formatCurrency(servicesData.totalRevenue)}</p>
                    <p className="text-[10px] text-muted-foreground">إجمالي الإيرادات</p>
                  </div>
                </div>
              )}

              {/* Service List */}
              {servicesData?.services?.map((s, i) => (
                <motion.div
                  key={s.serviceId}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-3.5 border border-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xs font-bold text-purple-600">
                        {i + 1}
                      </div>
                      <span className="text-sm font-bold">{s.name}</span>
                    </div>
                    <span className="text-sm font-bold text-clinic-600">{s.count} مرة</span>
                  </div>
                  <div className="mt-2 bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((s.count / (servicesData.maxCount || 1)) * 100, 100)}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                      className="bg-gradient-to-l from-purple-500 to-clinic-500 h-2.5 rounded-full"
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                    <span>الإيرادات: <span className="font-bold text-green-600">{formatCurrency(s.revenue)}</span></span>
                    <span>{Math.round((s.count / (servicesData.totalUsage || 1)) * 100)}% من الاستخدام</span>
                  </div>
                </motion.div>
              ))}

              {(!servicesData?.services || servicesData.services.length === 0) && (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">لا توجد بيانات خدمات بعد</p>
                  <p className="text-xs text-muted-foreground mt-1">ستظهر الإحصائيات بعد تسجيل زيارات</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key={reportType} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Main Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white shadow-lg shadow-green-500/20">
                  <DollarSign className="w-6 h-6 mb-1 opacity-80" />
                  <p className="text-xs opacity-80">إيرادات {periodLabel}</p>
                  <p className="text-xl font-bold">{formatCurrency(reportData?.totalRevenue || 0)}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-500/20">
                  <Users className="w-6 h-6 mb-1 opacity-80" />
                  <p className="text-xs opacity-80">مرضى {periodLabel}</p>
                  <p className="text-xl font-bold">{reportData?.totalPatients || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-4 text-white shadow-lg shadow-teal-500/20">
                  <Activity className="w-6 h-6 mb-1 opacity-80" />
                  <p className="text-xs opacity-80">خدمات مقدمة</p>
                  <p className="text-xl font-bold">{reportData?.totalServices || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg shadow-purple-500/20">
                  <Calendar className="w-6 h-6 mb-1 opacity-80" />
                  <p className="text-xs opacity-80">زيارات {periodLabel}</p>
                  <p className="text-xl font-bold">{reportData?.totalVisits || 0}</p>
                </div>
              </div>

              {/* Financial Details */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border overflow-hidden">
                <div className="p-3 border-b border-border flex items-center gap-2">
                  <FileText className="w-4 h-4 text-clinic-600" />
                  <h3 className="text-sm font-bold">تفاصيل مالية</h3>
                </div>
                <div className="divide-y divide-border">
                  <div className="px-3 py-2.5 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">إجمالي الفواتير</span>
                    <span className="text-sm font-bold">{formatCurrency(reportData?.totalInvoiced || 0)}</span>
                  </div>
                  <div className="px-3 py-2.5 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">المبالغ المدفوعة</span>
                    <span className="text-sm font-bold text-green-600">{formatCurrency(reportData?.totalRevenue || 0)}</span>
                  </div>
                  <div className="px-3 py-2.5 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">المبالغ المتبقية</span>
                    <span className="text-sm font-bold text-amber-600">{formatCurrency(reportData?.unpaidAmount || 0)}</span>
                  </div>
                  <div className="px-3 py-2.5 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">فواتير مدفوعة</span>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-sm font-bold text-green-600">{reportData?.paidInvoices || 0}</span>
                    </div>
                  </div>
                  <div className="px-3 py-2.5 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">فواتير معلقة</span>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-sm font-bold text-amber-600">{reportData?.unpaidInvoices || 0}</span>
                    </div>
                  </div>
                  {(reportData?.emergencies || 0) > 0 && (
                    <div className="px-3 py-2.5 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">حالات الطوارئ</span>
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-sm font-bold text-red-600">{reportData?.emergencies || 0}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Progress */}
              {(reportData?.totalInvoiced || 0) > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">نسبة التحصيل</span>
                    <span className="text-xs font-bold text-green-600">
                      {Math.round(((reportData?.totalRevenue || 0) / (reportData?.totalInvoiced || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-l from-green-400 to-green-600 h-3 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(((reportData?.totalRevenue || 0) / (reportData?.totalInvoiced || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Daily Breakdown */}
              {reportData?.dailyBreakdown && reportData.dailyBreakdown.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border overflow-hidden">
                  <div className="p-3 border-b border-border">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      تفاصيل يومية
                    </h3>
                  </div>
                  <div className="divide-y divide-border max-h-60 overflow-y-auto">
                    {reportData.dailyBreakdown.map((d, i) => (
                      <div key={i} className="px-3 py-2.5 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{d.date}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-xs">{d.visits} زيارة</span>
                          <span className="text-xs">{d.patients} مريض</span>
                          <span className="text-xs font-bold text-clinic-600">{formatCurrency(d.revenue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state for no data */}
              {(!reportData || (reportData.totalVisits === 0 && reportData.totalPatients === 0)) && (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">لا توجد بيانات لـ{periodLabel}</p>
                  <p className="text-xs text-muted-foreground mt-1">ستظهر الإحصائيات بعد تسجيل زيارات ومرضى</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
