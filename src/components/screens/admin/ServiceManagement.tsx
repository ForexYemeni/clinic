'use client';

import React, { useMemo } from 'react';
import { Stethoscope } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { useData } from '@/hooks/useData';
import { SearchInput } from '@/components/shared/SearchInput';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { formatCurrency } from '@/lib/constants';

const ServiceManagement = React.memo(function ServiceManagement() {
  const { searchQuery, setSearchQuery } = useAppStore();
  const { data: services, loading } = useData<Record<string, unknown>[]>('/api/services');

  const filtered = useMemo(() => {
    if (!services) return [];
    if (!searchQuery) return services;
    return services.filter((s: Record<string, unknown>) => (s.nameAr as string)?.includes(searchQuery) || (s.category as string)?.includes(searchQuery));
  }, [services, searchQuery]);

  const categories = useMemo(() => [...new Set(filtered.map((s: Record<string, unknown>) => s.category as string))], [filtered]);

  if (loading && !services) return <SkeletonLoader type="card-list" />;

  return (
    <div className="px-4 pb-24 pt-2 space-y-3">
      <h2 className="text-lg font-bold">الخدمات الطبية</h2>
      <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="بحث عن خدمة..." />
      {filtered.length === 0 ? (
        <EmptyState icon={Stethoscope} title="لا توجد خدمات" description="لم يتم العثور على نتائج" />
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat}>
              <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">{cat}</p>
              <div className="space-y-2">
                {filtered.filter((s: Record<string, unknown>) => s.category === cat).map((s: Record<string, unknown>) => (
                  <Card key={s.id as string} className="border-0 shadow-sm touch-feedback overflow-hidden">
                    <CardContent className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/20 flex items-center justify-center">
                          <Stethoscope className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{s.nameAr as string}</p>
                          <p className="text-xs text-muted-foreground truncate">{s.description as string}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(s.price as number)}</p>
                          <p className="text-[10px] text-muted-foreground">{s.duration as number} دقيقة</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`text-[9px] ${s.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'}`}>
                          {s.active ? 'نشط' : 'معطل'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{((s._count as Record<string, number>)?.patientServices || 0)} تنفيذ</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export { ServiceManagement };
