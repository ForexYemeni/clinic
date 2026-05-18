'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Droplets, Calendar } from 'lucide-react';

interface PatientCardProps {
  patient: {
    id: string;
    name: string;
    age: number;
    gender: string;
    phone?: string | null;
    bloodType?: string | null;
    createdAt: string;
    _count?: {
      visits?: number;
      emergencies?: number;
      appointments?: number;
    };
  };
  onClick?: () => void;
}

export function PatientCard({ patient, onClick }: PatientCardProps) {
  return (
    <Card
      className="medical-card p-4 cursor-pointer active:scale-[0.98] transition-transform"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
          patient.gender === 'male' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-pink-100 dark:bg-pink-900/30'
        }`}>
          <User className={`w-5 h-5 ${
            patient.gender === 'male' ? 'text-blue-600 dark:text-blue-400' : 'text-pink-600 dark:text-pink-400'
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-foreground truncate">{patient.name}</h3>
            {patient.bloodType && (
              <Badge variant="outline" className="text-xs shrink-0 mr-2">
                <Droplets className="w-3 h-3 ml-1 text-red-500" />
                {patient.bloodType}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{patient.age} سنة</span>
            <span>•</span>
            <span>{patient.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
          </div>
          {patient.phone && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <Phone className="w-3 h-3" />
              <span dir="ltr">{patient.phone}</span>
            </div>
          )}
          {patient._count && (
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>{patient._count.visits || 0} زيارة</span>
              <span>{patient._count.emergencies || 0} طوارئ</span>
              <span>{patient._count.appointments || 0} موعد</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
