'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: string;
  gradient?: string;
  trend?: string;
  animate?: boolean;
}

// Animated counter hook
function useAnimatedCounter(target: number, duration = 1200): number {
  const [current, setCurrent] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = null;
    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.floor(eased * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return current;
}

const StatCard = React.memo(function StatCard({ icon: Icon, label, value, color, gradient, trend, animate = true }: StatCardProps) {
  const numericValue = typeof value === 'number' ? value : 0;
  const isNumeric = typeof value === 'number';
  const animatedNum = useAnimatedCounter(numericValue);

  return (
    <Card className="border-0 shadow-sm touch-feedback overflow-hidden relative">
      {gradient && (
        <div className={`absolute inset-0 ${gradient} opacity-[0.07]`} />
      )}
      <CardContent className="p-4 relative">
        <div className="flex items-start justify-between">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <div className={`flex items-center text-xs font-semibold ${trend.startsWith('+') ? 'text-clinic-600' : 'text-red-500'}`}>
              {trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trend}
            </div>
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold tabular-nums">
            {isNumeric && animate ? animatedNum.toLocaleString('ar-SA') : value}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
});

export { StatCard };
