'use client';

import React, { useMemo } from 'react';
import { Users, Plus, Phone, AlertTriangle, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppStore } from '@/lib/store';
import { useData } from '@/hooks/useData';
import { SearchInput } from '@/components/shared/SearchInput';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { PatientItem, genderLabels } from '@/lib/constants';

interface PatientListProps {
  role: 'admin' | 'nurse';
}

const PatientList = React.memo(function PatientList({ role }: PatientListProps) {
  const { setScreen, setSelectedPatientId, searchQuery, setSearchQuery } = useAppStore();
  const { data: patients, loading } = useData<PatientItem[]>('/api/patients');

  const filtered = useMemo(() => {
    if (!patients) return [];
    if (!searchQuery) return patients;
    return patients.filter((p) =>
      p.name.includes(searchQuery) || p.phone?.includes(searchQuery) || p.bloodType?.includes(searchQuery)
    );
  }, [patients, searchQuery]);

  if (loading && !patients) return <SkeletonLoader type="card-list" />;

  return (
    <div className="px-4 pb-24 pt-2 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">المرضى</h2>
        {role === 'admin' && (
          <Button size="sm" className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 shadow-sm" onClick={() => setScreen('admin-add-patient')}>
            <Plus className="w-4 h-4 ml-1" /> إضافة
          </Button>
        )}
      </div>
      <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="بحث عن مريض..." />
      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="لا يوجد مرضى" description="لم يتم العثور على نتائج" />
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <Card
              key={p.id}
              className="border-0 shadow-sm touch-feedback overflow-hidden group hover:shadow-md transition-shadow"
              onClick={() => { setSelectedPatientId(p.id); setScreen(role === 'admin' ? 'admin-patient-detail' : 'nurse-patient-detail'); }}
            >
              <CardContent className="p-3.5">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 ring-2 ring-emerald-100 dark:ring-emerald-900/30">
                    <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      {p.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{p.name}</p>
                      {p.bloodType && (
                        <Badge className="text-[9px] h-5 px-1.5 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-200/50 dark:border-red-800/30 rounded-full font-bold">
                          🩸 {p.bloodType}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">{p.age} سنة</span>
                      <span className="text-xs text-muted-foreground">{genderLabels[p.gender] || p.gender}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={`text-[9px] ${p.chronicDiseases ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                      {p.chronicDiseases ? 'أمراض مزمنة' : 'سليم'}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground">{p._count?.visits || 0} زيارة</p>
                  </div>
                </div>
                {/* Quick actions */}
                <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-border/50">
                  {p.phone && (
                    <button
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium touch-feedback"
                      onClick={(e) => { e.stopPropagation(); window.open(`tel:${p.phone}`, '_self'); }}
                    >
                      <Phone className="w-3 h-3" /> اتصال
                    </button>
                  )}
                  <button
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-medium touch-feedback"
                    onClick={(e) => { e.stopPropagation(); setSelectedPatientId(p.id); setScreen(role === 'admin' ? 'admin-patient-detail' : 'nurse-patient-detail'); }}
                  >
                    <Eye className="w-3 h-3" /> عرض
                  </button>
                  {role === 'admin' && (
                    <button
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-medium touch-feedback"
                      onClick={(e) => { e.stopPropagation(); setScreen('admin-add-emergency'); }}
                    >
                      <AlertTriangle className="w-3 h-3" /> طوارئ
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
});

export { PatientList };
