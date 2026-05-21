'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign } from 'lucide-react';

interface ServiceCardProps {
  service: {
    id: string;
    name: string;
    nameAr: string;
    price: number;
    duration: number;
    category?: string | null;
    active: boolean;
    _count?: { patientServices: number };
  };
  onClick?: () => void;
}

export function ServiceCard({ service, onClick }: ServiceCardProps) {
  return (
    <Card
      className={`medical-card p-4 cursor-pointer transition-all ${
        !service.active ? 'opacity-50' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{service.nameAr}</h3>
          <p className="text-xs text-muted-foreground mt-1">{service.name}</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-sm text-primary font-semibold">
              <DollarSign className="w-3.5 h-3.5" />
              <span>{service.price} ر.س</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>{service.duration} دقيقة</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {service.category && (
            <Badge variant="secondary" className="text-xs">
              {service.category}
            </Badge>
          )}
          <Badge variant={service.active ? 'default' : 'outline'} className="text-xs">
            {service.active ? 'نشط' : 'معطل'}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
