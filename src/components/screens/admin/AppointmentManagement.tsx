'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SearchBar } from '@/components/shared/SearchBar';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ModalSheet } from '@/components/shared/ModalSheet';
import { FAB } from '@/components/shared/FAB';
import { Plus, CalendarDays, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Appointment {
  id: string;
  date: string;
  duration: number;
  type: string | null;
  status: string;
  notes: string | null;
  patient: { id: string; name: string; age: number; phone: string };
  nurse: { id: string; name: string } | null;
}

export function AppointmentManagement() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [patients, setPatients] = useState<Array<{ id: string; name: string }>>([]);
  const [nurses, setNurses] = useState<Array<{ id: string; name: string }>>([]);
  const [form, setForm] = useState({
    patientId: '', nurseId: '', date: '', time: '', duration: '30', type: 'checkup', notes: '',
  });

  useEffect(() => {
    fetchAppointments();
    fetchPatientsAndNurses();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments');
      const data = await res.json();
      setAppointments(data.appointments || []);
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
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          date: new Date(`${form.date}T${form.time}`),
          duration: parseInt(form.duration),
        }),
      });
      if (res.ok) {
        toast.success('تم إضافة الموعد');
        setShowAdd(false);
        setForm({ patientId: '', nurseId: '', date: '', time: '', duration: '30', type: 'checkup', notes: '' });
        fetchAppointments();
      }
    } catch {
      toast.error('خطأ في إضافة الموعد');
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success('تم تحديث الموعد');
        fetchAppointments();
      }
    } catch {
      toast.error('خطأ في التحديث');
    }
  };

  const filtered = appointments.filter((appt) => {
    const matchSearch = appt.patient.name.includes(search);
    const matchStatus = filterStatus === 'all' || appt.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) return <LoadingSpinner text="جاري تحميل المواعيد..." />;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-foreground mb-4">إدارة المواعيد</h2>

      <SearchBar value={search} onChange={setSearch} placeholder="بحث بالاسم..." />

      <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
        {['all', 'scheduled', 'confirmed', 'completed', 'cancelled'].map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}>
            <Badge variant={filterStatus === s ? 'default' : 'outline'} className="cursor-pointer whitespace-nowrap">
              {s === 'all' ? 'الكل' : s === 'scheduled' ? 'مجدول' : s === 'confirmed' ? 'مؤكد' : s === 'completed' ? 'مكتمل' : 'ملغي'}
            </Badge>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CalendarDays} title="لا توجد مواعيد" description="قم بإضافة موعد جديد" />
      ) : (
        <div className="space-y-3 mt-4">
          {filtered.map((appt) => (
            <Card key={appt.id} className="medical-card p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-foreground">{appt.patient.name}</h3>
                <StatusBadge status={appt.status} size="sm" />
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {format(new Date(appt.date), 'dd/MM/yyyy', { locale: ar })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {format(new Date(appt.date), 'HH:mm', { locale: ar })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {appt.nurse?.name || 'لم يُحدد'}
                </span>
                <div className="flex gap-1">
                  {appt.status === 'scheduled' && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatusUpdate(appt.id, 'confirmed')}>
                      تأكيد
                    </Button>
                  )}
                  {(appt.status === 'scheduled' || appt.status === 'confirmed') && (
                    <Button size="sm" variant="outline" className="h-7 text-xs text-red-500" onClick={() => handleStatusUpdate(appt.id, 'cancelled')}>
                      إلغاء
                    </Button>
                  )}
                  {appt.status === 'confirmed' && (
                    <Button size="sm" className="h-7 text-xs" onClick={() => handleStatusUpdate(appt.id, 'completed')}>
                      إكمال
                    </Button>
                  )}
                </div>
              </div>
              {appt.notes && <p className="text-xs text-muted-foreground mt-2 bg-muted/50 p-2 rounded-lg">{appt.notes}</p>}
            </Card>
          ))}
        </div>
      )}

      <FAB onClick={() => setShowAdd(true)} />

      <ModalSheet open={showAdd} onClose={() => setShowAdd(false)} title="إضافة موعد جديد">
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
            <Label>الممرض</Label>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>التاريخ *</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>الوقت *</Label>
              <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="h-12 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>المدة (دقيقة)</Label>
              <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} type="number" className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>النوع</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checkup">فحص</SelectItem>
                  <SelectItem value="follow-up">متابعة</SelectItem>
                  <SelectItem value="treatment">علاج</SelectItem>
                  <SelectItem value="emergency">طوارئ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="ملاحظات" className="rounded-xl" />
          </div>
          <Button onClick={handleAdd} className="w-full h-12 rounded-xl" disabled={!form.patientId || !form.date || !form.time}>
            إضافة الموعد
          </Button>
        </div>
      </ModalSheet>
    </div>
  );
}
