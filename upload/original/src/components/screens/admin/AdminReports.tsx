'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, DollarSign, Users, Activity, Calendar, TrendingUp, FileText, AlertTriangle, CheckCircle, Clock, ArrowRight, RefreshCw, Stethoscope, ChevronDown, X } from 'lucide-react';
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

interface NurseInfo {
  id: string;
  name: string;
  phone?: string;
  active: boolean;
}

export function AdminReports() {
  const { setScreen } = useAppStore();
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'services'>('daily');
  const [reportData, setReportData] = useState<ReportStats | null>(null);
  const [servicesData, setServicesData] = useState<ServicesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Nurse filter state
  const [nurses, setNurses] = useState<NurseInfo[]>([]);
  const [selectedNurseId, setSelectedNurseId] = useState<string>('');
  const [showNursePicker, setShowNursePicker] = useState(false);

  // Fetch nurses list
  useEffect(() => {
    const fetchNurses = async () => {
      try {
        const res = await fetch('/api/users?role=nurse');
        if (res.ok) {
          const data = await res.json();
          setNurses(data);
        }
      } catch {}
    };
    fetchNurses();
  }, []);

  const fetchReport = async (type: string, nurseId?: string) => {
    setLoading(true);
    setError('');
    try {
      const nurseParam = nurseId ? `&nurseId=${nurseId}` : '';
      if (type === 'services') {
        const data = await apiGet<ServicesReport>(`/api/reports?type=services${nurseParam}`);
        setServicesData(data);
      } else {
        const data = await apiGet<ReportStats>(`/api/reports?type=${type}${nurseParam}`);
        setReportData(data);
      }
    } catch (err: any) {
      console.error('Report fetch error:', err);
      setError(err?.message || 'خطأ في تحميل التقرير');
      toast.error('خطأ في تحميل التقرير');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchReport(reportType, selectedNurseId || undefined);
  }, [reportType, selectedNurseId]);

  const handleNurseSelect = (nurseId: string) => {
    setSelectedNurseId(nurseId);
    setShowNursePicker(false);
  };

  const selectedNurse = nurses.find(n => n.id === selectedNurseId);
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
        <button onClick={() => setScreen('admin-more')} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-xl border border-border shadow-sm active:scale-[0.97] transition-all">
          <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-foreground" />
          </div>
          <span className="text-sm font-medium">رجوع</span>
        </button>
      </div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-500" />
          التقارير والإحصائيات
        </h2>
        <button
          onClick={() => fetchReport(reportType, selectedNurseId || undefined)}
          className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center active:scale-95 transition-transform"
          title="تحديث"
        >
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        {selectedNurse ? `تقارير ${selectedNurse.name}` : 'ملخص شامل لأداء العيادة'}
      </p>

      {/* Nurse Selector */}
      <div className="mb-4">
        <button
          onClick={() => setShowNursePicker(!showNursePicker)}
          className="w-full bg-white dark:bg-gray-800 rounded-2xl border border-border p-3 shadow-sm active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                selectedNurseId
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20'
                  : 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/20'
              }`}>
                <Stethoscope className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">
                  {selectedNurse ? selectedNurse.name : 'جميع الموظفين'}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {selectedNurse ? `تقارير ${selectedNurse.name} فقط` : 'تقارير العيادة بالكامل'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedNurseId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNurseSelect('');
                  }}
                  className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-red-500" />
                </button>
              )}
              <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showNursePicker ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </button>

        {/* Nurse Picker Dropdown */}
        <AnimatePresence>
          {showNursePicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-2 bg-white dark:bg-gray-800 rounded-2xl border border-border overflow-hidden shadow-sm max-h-60 overflow-y-auto">
                <button
                  onClick={() => handleNurseSelect('')}
                  className={`w-full px-4 py-3 flex items-center gap-3 border-b border-border active:bg-gray-50 dark:active:bg-gray-700 transition-colors ${
                    !selectedNurseId ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">جميع الموظفين</p>
                    <p className="text-[10px] text-muted-foreground">تقارير العيادة بالكامل</p>
                  </div>
                  {!selectedNurseId && (
                    <CheckCircle className="w-4 h-4 text-purple-600 mr-auto" />
                  )}
                </button>

                {nurses.map(nurse => (
                  <button
                    key={nurse.id}
                    onClick={() => handleNurseSelect(nurse.id)}
                    className={`w-full px-4 py-3 flex items-center gap-3 border-b border-border last:border-b-0 active:bg-gray-50 dark:active:bg-gray-700 transition-colors ${
                      selectedNurseId === nurse.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      nurse.active ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
                    }`}>
                      <Stethoscope className={`w-4 h-4 ${nurse.active ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`} />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold">{nurse.name}</p>
                        {!nurse.active && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">معطل</span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground" dir="ltr">{nurse.phone}</p>
                    </div>
                    {selectedNurseId === nurse.id && (
                      <CheckCircle className="w-4 h-4 text-blue-600 mr-auto" />
                    )}
                  </button>
                ))}

                {nurses.length === 0 && (
                  <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>لا يوجد ممرضين</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Report Type Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {reportTabs.map(rt => {
          const Icon = rt.icon;
          return (
            <button
              key={rt.id}
              onClick={() => setReportType(rt.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
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
            onClick={() => fetchReport(reportType, selectedNurseId || undefined)}
            className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold active:scale-95 transition-transform"
          >
            إعادة المحاولة
          </button>
        </motion.div>
      ) : loading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>
      ) : (
        <AnimatePresence mode="wait">
          {reportType === 'services' ? (
            <motion.div key="services" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              {/* Services Summary */}
              {servicesData && (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0 }}
                    className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3 text-white shadow-lg shadow-purple-500/20"
                  >
                    <p className="text-lg font-bold">{servicesData.totalServices}</p>
                    <p className="text-[10px] opacity-80">خدمة مختلفة</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 }}
                    className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 text-white shadow-lg shadow-green-500/20"
                  >
                    <p className="text-lg font-bold">{servicesData.totalUsage}</p>
                    <p className="text-[10px] opacity-80">إجمالي الاستخدام</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 text-white shadow-lg shadow-blue-500/20"
                  >
                    <p className="text-lg font-bold">{formatCurrency(servicesData.totalRevenue)}</p>
                    <p className="text-[10px] opacity-80">إجمالي الإيرادات</p>
                  </motion.div>
                </div>
              )}

              {/* Service List */}
              {servicesData?.services?.map((s, i) => (
                <motion.div
                  key={s.serviceId}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-3.5 border border-border shadow-sm"
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
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0 }}
                  className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white shadow-lg shadow-green-500/20"
                >
                  <DollarSign className="w-6 h-6 mb-1 opacity-80" />
                  <p className="text-xs opacity-80">إيرادات {periodLabel}</p>
                  <p className="text-xl font-bold">{formatCurrency(reportData?.totalRevenue || 0)}</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 }}
                  className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-500/20"
                >
                  <Users className="w-6 h-6 mb-1 opacity-80" />
                  <p className="text-xs opacity-80">مرضى {periodLabel}</p>
                  <p className="text-xl font-bold">{reportData?.totalPatients || 0}</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-4 text-white shadow-lg shadow-teal-500/20"
                >
                  <Activity className="w-6 h-6 mb-1 opacity-80" />
                  <p className="text-xs opacity-80">خدمات مقدمة</p>
                  <p className="text-xl font-bold">{reportData?.totalServices || 0}</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 }}
                  className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg shadow-purple-500/20"
                >
                  <Calendar className="w-6 h-6 mb-1 opacity-80" />
                  <p className="text-xs opacity-80">زيارات {periodLabel}</p>
                  <p className="text-xl font-bold">{reportData?.totalVisits || 0}</p>
                </motion.div>
              </div>

              {/* Financial Details */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border overflow-hidden shadow-sm">
                <div className="p-3 border-b border-border flex items-center gap-2">
                  <FileText className="w-4 h-4 text-clinic-600" />
                  <h3 className="text-sm font-bold">
                    {selectedNurseId ? `تفاصيل مالية - ${selectedNurse?.name}` : 'تفاصيل مالية'}
                  </h3>
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

              {/* Profit/Loss Summary for nurse */}
              {selectedNurseId && (reportData?.totalInvoiced || 0) > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 text-white shadow-lg shadow-blue-600/20"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5" />
                    <h3 className="text-sm font-bold">صافي الأرباح والخسائر - {selectedNurse?.name}</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm text-center">
                      <p className="text-[10px] text-white/70 mb-1">إجمالي الفواتير</p>
                      <p className="text-sm font-bold">{formatCurrency(reportData?.totalInvoiced || 0)}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm text-center">
                      <p className="text-[10px] text-white/70 mb-1">المحصل</p>
                      <p className="text-sm font-bold text-green-200">{formatCurrency(reportData?.totalRevenue || 0)}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm text-center">
                      <p className="text-[10px] text-white/70 mb-1">غير محصل</p>
                      <p className="text-sm font-bold text-red-200">{formatCurrency(reportData?.unpaidAmount || 0)}</p>
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold">نسبة التحصيل</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        (reportData?.totalRevenue || 0) >= (reportData?.totalInvoiced || 1) * 0.7
                          ? 'bg-green-400/20 text-green-200'
                          : (reportData?.totalRevenue || 0) >= (reportData?.totalInvoiced || 1) * 0.4
                          ? 'bg-yellow-400/20 text-yellow-200'
                          : 'bg-red-400/20 text-red-200'
                      }`}>
                        {Math.round(((reportData?.totalRevenue || 0) / (reportData?.totalInvoiced || 1)) * 100)}%
                      </span>
                    </div>
                    <div className="bg-white/10 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-l from-green-400 to-green-300 h-3 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(((reportData?.totalRevenue || 0) / (reportData?.totalInvoiced || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Payment Progress */}
              {(reportData?.totalInvoiced || 0) > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border p-3 space-y-2 shadow-sm">
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
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border overflow-hidden shadow-sm">
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
