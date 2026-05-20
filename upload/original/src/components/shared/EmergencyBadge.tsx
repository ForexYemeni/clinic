'use client';

import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertOctagon, AlertCircle, CheckCircle } from 'lucide-react';

interface EmergencyBadgeProps {
  severity: string;
  size?: 'sm' | 'md' | 'lg';
}

const severityConfig: Record<string, { label: string; class: string; icon: typeof AlertTriangle }> = {
  critical: { label: 'حرج', class: 'badge-critical', icon: AlertOctagon },
  high: { label: 'عالي', class: 'badge-high', icon: AlertTriangle },
  moderate: { label: 'متوسط', class: 'badge-moderate', icon: AlertCircle },
  low: { label: 'منخفض', class: 'badge-low', icon: CheckCircle },
};

export function EmergencyBadge({ severity, size = 'md' }: EmergencyBadgeProps) {
  const config = severityConfig[severity] || severityConfig.moderate;
  const Icon = config.icon;
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${config.class} ${sizeClasses[size]}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      {config.label}
    </span>
  );
}
