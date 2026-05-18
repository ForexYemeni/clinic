'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmergencyBadge } from '@/components/shared/EmergencyBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SearchBar } from '@/components/shared/SearchBar';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ModalSheet } from '@/components/shared/ModalSheet';
import { ClipboardList, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Emergency {
  id: string;
  severity: string;
  arrivalTime: string;
  treatmentTime: string | null;
  actions: string | null;
  status: string;
  notes: string | null;
  patient: { id: string; name: string; age: number; bloodType: string | null };
  nurse: { id: string; name: string } | null;
}

export function NurseCases() {
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [selectedEm, setSelectedEm] = useState<Emergency | null>(null);

  useEffect(() => {
    fetchEmergencies();
  }, []);

  const fetchEmergencies = async () => {
    try {
      const res = await fetch('/api/emergencies');
      const data = await res.json();
      setEmergencies(data.emergencies || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/emergencies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, treatmentTime: status !== 'active' ? new Date().toISOString() : undefined }),
      });
      if (res.ok) {
        toast.success('تم تحديث الحالة');
        setShowDetail(false);
        fetchEmergencies();
      }
    } catch {
      toast.error('خطأ في التحديث');
    }
  };

  const filtered = emergencies.filter((em) => em.patient.name.includes(search));

  if (loading) return <LoadingSpinner text="جاري تحميل الحالات..." />;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-foreground mb-4">الحالات</h2>

      <SearchBar value={search} onChange={setSearch} placeholder="بحث عن حالة..." />

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="لا توجد حالات" description="لا توجد حالات طوارئ حالياً" />
      ) : (
        <div className="space-y-3 mt-4">
          {filtered.map((em) => (
            <Card
              key={em.id}
              className={`medical-card p-4 cursor-pointer ${
                em.severity === 'critical' && em.status === 'active' ? 'border-red-200 dark:border-red-800' : ''
              }`}
              onClick={() => { setSelectedEm(em); setShowDetail(true); }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {em.status === 'active' && em.severity === 'critical' && (
                    <div className="w-2 h-2 rounded-full bg-red-500 pulse-emergency" />
                  )}
                  <h3 className="font-semibold">{em.patient.name}</h3>
                </div>
                <EmergencyBadge severity={em.severity} size="sm" />
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(em.arrivalTime), 'HH:mm', { locale: ar })}
                </span>
                <StatusBadge status={em.status} size="sm" />
              </div>
            </Card>
          ))}
        </div>
      )}

      <ModalSheet open={showDetail} onClose={() => setShowDetail(false)} title="تفاصيل الحالة">
        {selectedEm && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{selectedEm.patient.name}</h3>
              <EmergencyBadge severity={selectedEm.severity} />
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">العمر:</span> {selectedEm.patient.age} سنة</p>
              {selectedEm.patient.bloodType && (
                <p><span className="text-muted-foreground">فصيلة الدم:</span> {selectedEm.patient.bloodType}</p>
              )}
              <p><span className="text-muted-foreground">وقت الوصول:</span> {format(new Date(selectedEm.arrivalTime), 'dd/MM/yyyy HH:mm', { locale: ar })}</p>
              <p><span className="text-muted-foreground">الممرض:</span> {selectedEm.nurse?.name || 'لم يُعين'}</p>
              <p><span className="text-muted-foreground">الحالة:</span> <StatusBadge status={selectedEm.status} size="sm" /></p>
            </div>
            {selectedEm.actions && (
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">الإجراءات:</p>
                {(() => {
                  try {
                    return JSON.parse(selectedEm.actions).map((a: string, i: number) => (
                      <p key={i} className="text-sm">• {a}</p>
                    ));
                  } catch {
                    return <p className="text-sm">{selectedEm.actions}</p>;
                  }
                })()}
              </div>
            )}
            {selectedEm.notes && (
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">ملاحظات:</p>
                <p className="text-sm">{selectedEm.notes}</p>
              </div>
            )}
            {selectedEm.status === 'active' && (
              <div className="flex gap-2">
                <Button onClick={() => handleStatusUpdate(selectedEm.id, 'treated')} className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700">
                  تم العلاج
                </Button>
                <Button onClick={() => handleStatusUpdate(selectedEm.id, 'transferred')} variant="outline" className="flex-1 h-12 rounded-xl">
                  تحويل
                </Button>
              </div>
            )}
          </div>
        )}
      </ModalSheet>
    </div>
  );
}
