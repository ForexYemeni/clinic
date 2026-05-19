'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, DollarSign, Users, Activity } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatCurrency } from '@/lib/constants';

export function NurseReports() {
  const { user } = useAppStore();
  const [reportType, setReportType] = useState<'daily' | 'monthly'>('daily');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/reports?type=${reportType}${user?.id ? `&nurseId=${user.id}` : ''}`);
        if (res.ok) setData(await res.json());
      } catch {} finally { setLoading(false); }
    };
    fetchReport();
  }, [reportType, user?.id]);

  return (
    <div className="p-4 pb-24">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-purple-500" />
        التقارير
      </h2>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setReportType('daily')}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${reportType === 'daily' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground'}`}
        >
          يومي
        </button>
        <button
          onClick={() => setReportType('monthly')}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${reportType === 'monthly' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground'}`}
        >
          شهري
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-border text-center">
            <DollarSign className="w-6 h-6 mx-auto text-clinic-500 mb-1" />
            <p className="text-xs text-muted-foreground">الإيرادات</p>
            <p className="text-lg font-bold text-clinic-600">{formatCurrency(data?.totalRevenue || 0)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-border text-center">
            <Users className="w-6 h-6 mx-auto text-blue-500 mb-1" />
            <p className="text-xs text-muted-foreground">المرضى</p>
            <p className="text-lg font-bold text-blue-600">{data?.totalPatients || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-border text-center">
            <Activity className="w-6 h-6 mx-auto text-teal-500 mb-1" />
            <p className="text-xs text-muted-foreground">الخدمات</p>
            <p className="text-lg font-bold text-teal-600">{data?.totalServices || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-border text-center">
            <BarChart3 className="w-6 h-6 mx-auto text-purple-500 mb-1" />
            <p className="text-xs text-muted-foreground">الزيارات</p>
            <p className="text-lg font-bold text-purple-600">{data?.totalVisits || 0}</p>
          </div>
        </div>
      )}
    </div>
  );
}
