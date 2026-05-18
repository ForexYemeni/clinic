'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EmergencyBadge } from '@/components/shared/EmergencyBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SearchBar } from '@/components/shared/SearchBar';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ModalSheet } from '@/components/shared/ModalSheet';
import { FAB } from '@/components/shared/FAB';
import { Plus, Siren, Clock, User } from 'lucide-react';
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

const severityOptions = ['low', 'moderate', 'high', 'critical'];

export function EmergencyManagement() {
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedEm, setSelectedEm] = useState<Emergency | null>(null);
  const [patients, setPatients] = useState<Array<{ id: string; name: string }>>([]);
  const [nurses, setNurses] = useState<Array<{ id: string; name: string }>>([]);
  const [form, setForm] = useState({
    patientId: '', nurseId: '', severity: 'moderate', notes: '', actions: '',
  });

  useEffect(() => {
    fetchEmergencies();
    fetchPatientsAndNurses();
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

  const fetchPatientsAndNurses = async () => {
    try {
      const [pRes, nRes] = await Promise.all([
        fetch('/api/patients?limit=100'),
        fetch('/api/users?role=nurse'),
      ]);
      const pData = await pRes.json();
      const nData = await nRes.json();
      setPatients(pData.patients?.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })) || []);
      setNurses(nData.users?.map((u: { id: string; name: string }) => ({ id: u.id, name: u.name })) || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAdd = async () => {
    try {
      const res = await fetch('/api/emergencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('تم إضافة حالة الطوارئ');
        setShowAdd(false);
        setForm({ patientId: '', nurseId: '', severity: 'moderate', notes: '', actions: '' });
        fetchEmergencies();
      }
    } catch {
      toast.error('خطأ في إضافة الحالة');
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

  const filtered = emergencies.filter((em) => {
    const matchSearch = em.patient.name.includes(search);
    const matchStatus = filterStatus === 'all' || em.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) return <LoadingSpinner text="جاري تحميل حالات الطوارئ..." />;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-foreground mb-4">إدارة الطوارئ</h2>

      <SearchBar value={search} onChange={setSearch} placeholder="بحث بالاسم..." />

      <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
        {['all', 'active', 'treated', 'transferred', 'archived'].map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}>
            <Badge variant={filterStatus === s ? 'default' : 'outline'} className="cursor-pointer whitespace-nowrap">
              {s === 'all' ? 'الكل' : s === 'active' ? 'نشطة' : s === 'treated' ? 'تم العلاج' : s === 'transferred' ? 'محولة' : 'مؤرشفة'}
            </Badge>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Siren} title="لا توجد حالات طوارئ" />
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
                  <h3 className="font-semibold text-foreground">{em.patient.name}</h3>
                </div>
                <EmergencyBadge severity={em.severity} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(em.arrivalTime), 'HH:mm', { locale: ar })}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {em.nurse?.name || 'لم يُعين'}
                  </span>
                </div>
                <StatusBadge status={em.status} size="sm" />
              </div>
            </Card>
          ))}
        </div>
      )}

      <FAB onClick={() => setShowAdd(true)} icon={Plus} />

      <ModalSheet open={showAdd} onClose={() => setShowAdd(false)} title="إضافة حالة طوارئ">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>المريض *</Label>
            <Select value={form.patientId} onValueChange={(v) => setForm({ ...form, patientId: v })}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="اختر المريض" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>الممرض المسؤول</Label>
            <Select value={form.nurseId} onValueChange={(v) => setForm({ ...form, nurseId: v })}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="اختر الممرض" />
              </SelectTrigger>
              <SelectContent>
                {nurses.map((n) => (
                  <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>درجة الخطورة</Label>
            <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {severityOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === 'low' ? 'منخفضة' : s === 'moderate' ? 'متوسطة' : s === 'high' ? 'عالية' : 'حرجة'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>الإجراءات المتخذة</Label>
            <Textarea value={form.actions} onChange={(e) => setForm({ ...form, actions: e.target.value })} placeholder="الإجراءات" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="ملاحظات" className="rounded-xl" />
          </div>
          <Button onClick={handleAdd} className="w-full h-12 rounded-xl" disabled={!form.patientId}>
            إضافة الحالة
          </Button>
        </div>
      </ModalSheet>

      <ModalSheet open={showDetail} onClose={() => setShowDetail(false)} title="تفاصيل حالة الطوارئ">
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
              {selectedEm.treatmentTime && (
                <p><span className="text-muted-foreground">وقت العلاج:</span> {format(new Date(selectedEm.treatmentTime), 'dd/MM/yyyy HH:mm', { locale: ar })}</p>
              )}
              <p><span className="text-muted-foreground">الممرض:</span> {selectedEm.nurse?.name || 'لم يُعين'}</p>
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
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">الحالة:</span>
              <StatusBadge status={selectedEm.status} />
            </div>
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
