'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonLoaderProps {
  type: 'dashboard' | 'card-list' | 'patient-detail' | 'form' | 'chart';
  count?: number;
}

function DashboardSkeleton() {
  return (
    <div className="px-4 pb-24 pt-2 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="w-10 h-4" />
              </div>
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <Skeleton className="h-4 w-32 mb-3" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <Skeleton className="h-4 w-28 mb-3" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CardListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="px-4 pb-24 pt-2 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-9 w-20 rounded-xl" />
      </div>
      <Skeleton className="h-11 w-full rounded-xl" />
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-3.5 flex items-center gap-3">
              <Skeleton className="w-11 h-11 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-5 w-14 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PatientDetailSkeleton() {
  return (
    <div className="pb-24 pt-0">
      <div className="bg-gradient-to-br from-clinic-600 to-clinic-600 -mx-4 px-4 pt-2 pb-6 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="w-9 h-9 rounded-xl bg-white/20" />
          <Skeleton className="h-5 w-24 bg-white/20" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full bg-white/20" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32 bg-white/20" />
            <Skeleton className="h-3 w-20 bg-white/20" />
          </div>
        </div>
      </div>
      <div className="flex gap-1 px-4 -mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="flex-1 h-10 rounded-xl" />
        ))}
      </div>
      <div className="px-4 mt-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-3.5 flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-4 w-28" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="px-4 pb-24 pt-2 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-xl" />
        <Skeleton className="h-6 w-36" />
      </div>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
          <Skeleton className="h-12 w-full rounded-xl" />
        </CardContent>
      </Card>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="px-4 pb-24 pt-2 space-y-4">
      <Skeleton className="h-6 w-32" />
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <Skeleton className="h-4 w-28 mb-3" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </CardContent>
      </Card>
    </div>
  );
}

const SkeletonLoader = React.memo(function SkeletonLoader({ type, count }: SkeletonLoaderProps) {
  switch (type) {
    case 'dashboard': return <DashboardSkeleton />;
    case 'card-list': return <CardListSkeleton count={count} />;
    case 'patient-detail': return <PatientDetailSkeleton />;
    case 'form': return <FormSkeleton />;
    case 'chart': return <ChartSkeleton />;
    default: return <DashboardSkeleton />;
  }
});

export { SkeletonLoader };
