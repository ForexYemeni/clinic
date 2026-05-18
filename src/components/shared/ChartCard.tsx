'use client';

import { Card } from '@/components/ui/card';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, children, className = '' }: ChartCardProps) {
  return (
    <Card className={`medical-card ${className}`}>
      <h3 className="font-semibold text-foreground mb-4">{title}</h3>
      <div className="w-full overflow-hidden">
        {children}
      </div>
    </Card>
  );
}
