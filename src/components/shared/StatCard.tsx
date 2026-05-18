'use client';

import { Card } from '@/components/ui/card';
import { type LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  gradient: string;
  iconColor?: string;
}

export function StatCard({ icon: Icon, value, label, gradient, iconColor = 'text-white' }: StatCardProps) {
  return (
    <Card className="medical-card p-4 relative overflow-hidden">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${gradient}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground truncate">{label}</p>
        </div>
      </div>
    </Card>
  );
}
