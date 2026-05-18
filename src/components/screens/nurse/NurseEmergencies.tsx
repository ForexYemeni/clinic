'use client';

import React, { useMemo } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { useData } from '@/hooks/useData';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import {
  EmergencyItem, formatTime,
  severityColors, severityLabels, severityDotColors, severityBorderColors,
  statusColors, statusLabels,
} from '@/lib/constants';

const NurseEmergencies = React.memo(function NurseEmergencies() {
  const { setScreen } = useAppStore();
  const { data: emergencies, loading } = useData<EmergencyItem[]>('/api/emergencies');

  if (loading && !emergencies) return <SkeletonLoader type="card-list" />;

  return (
    <div className="px-4 pb-24 pt-2 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">الطوارئ</h2>
        <Button size="sm" className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 shadow-sm" onClick={() => setScreen('nurse-add-emergency')}>
          <Plus className="w-4 h-4 ml-1" /> حالة جديدة
        </Button>
      </div>
      {!emergencies || emergencies.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="لا توجد حالات طوارئ" />
      ) : (
        <div className="space-y-2">
          {emergencies.map((em) => (
            <Card key={em.id} className={`border-0 shadow-sm overflow-hidden ${em.status === 'active' ? `border-r-4 ${severityBorderColors[em.severity]}` : ''}`}>
              <CardContent className="p-3.5">
                <div className="flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${severityDotColors[em.severity]} ${em.status === 'active' ? 'animate-pulse-slow' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold">{em.patient?.name}</p>
                      <Badge className={`text-[9px] ${severityColors[em.severity]}`}>{severityLabels[em.severity]}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{em.notes}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{formatTime(em.arrivalTime)}</p>
                  </div>
                  <Badge className={`text-[9px] shrink-0 ${statusColors[em.status]}`}>{statusLabels[em.status]}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
});

export { NurseEmergencies };
