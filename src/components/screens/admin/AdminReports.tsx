'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, DollarSign, Users, Activity, Calendar } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatCurrency } from '@/lib/constants';

export function AdminReports() {
  const { setScreen } = useAppStore();
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'services'>('daily');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/reports?type=${reportType}`);
        if (res.ok) setReportData(await res.json());
      } catch {} finally { setLoading(false); }
    };
    fetchReport();
  }, [reportType]);

  return (
    <div className="p-4 pb-24">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-purple-500" />
        التقارير
      </h2>

      {/* Report Type */}
      <div className="flex gap-2 mb-4">
        {[
          { id: 'daily' as const, label: 'يومي' },
          { id: 'monthly' as const, label: 'شهري' },
          { id: 'services' as const, label: 'الخدمات' },
        ].map(rt => (
          <button
            key={rt.id}
            onClick={() => setReportType(rt.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              reportType === rt.id ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground'
            }`}
          >
            {rt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>
      ) : reportType === 'services' ? (
        <div className="space-y-2">
          <h3 className="text-sm font-bold">إحصائيات الخدمات</h3>
          {reportData?.services?.map((s: any, i: number) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{s.name}</span>
                <span className="text-sm text-emerald-600 font-bold">{s.count} مرة</span>
              </div>
              <div className="mt-2 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${Math.min((s.count / (reportData.maxCount || 1)) * 100, 100)}%` }} />
              </div>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>الإيرادات: {formatCurrency(s.revenue || 0)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-border text-center">
              <DollarSign className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
              <p className="text-xs text-muted-foreground">{reportType === 'daily' ? 'إيرادات اليوم' : 'إيرادات الشهر'}</p>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(reportData?.totalRevenue || 0)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-border text-center">
              <Users className="w-6 h-6 mx-auto text-blue-500 mb-1" />
              <p className="text-xs text-muted-foreground">{reportType === 'daily' ? 'مرضى اليوم' : 'مرضى الشهر'}</p>
              <p className="text-lg font-bold text-blue-600">{reportData?.totalPatients || 0}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-border text-center">
              <Activity className="w-6 h-6 mx-auto text-teal-500 mb-1" />
              <p className="text-xs text-muted-foreground">الخدمات المقدمة</p>
              <p className="text-lg font-bold text-teal-600">{reportData?.totalServices || 0}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-border text-center">
              <Calendar className="w-6 h-6 mx-auto text-purple-500 mb-1" />
              <p className="text-xs text-muted-foreground">الزيارات</p>
              <p className="text-lg font-bold text-purple-600">{reportData?.totalVisits || 0}</p>
            </div>
          </div>

          {/* Daily Breakdown */}
          {reportData?.dailyBreakdown && reportData.dailyBreakdown.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-border">
              <h3 className="text-sm font-bold mb-3">تفاصيل يومية</h3>
              <div className="space-y-2">
                {reportData.dailyBreakdown.map((d: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <span className="text-xs text-muted-foreground">{d.date}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs">{d.patients} مريض</span>
                      <span className="text-xs font-bold text-emerald-600">{formatCurrency(d.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
