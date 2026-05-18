'use client';

import React, { useState } from 'react';
import { ChevronRight, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import { useData } from '@/hooks/useData';
import { PatientItem, appointmentTypeLabels } from '@/lib/constants';
import { toast } from 'sonner';

const AddAppointmentForm = React.memo(function AddAppointmentForm() {
  const { setScreen, user } = useAppStore();
  const { data: patients } = useData<PatientItem[]>('/api/patients');
  const [form, setForm] = useState({ patientId: '', date: '', time: '', type: 'checkup', notes: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.patientId || !form.date || !form.time) { toast.error('يرجى ملء جميع الحقول المطلوبة'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, date: new Date(`${form.date}T${form.time}`), nurseId: user?.id }),
      });
      if (res.ok) { toast.success('تم حجز الموعد بنجاح'); setScreen('admin-appointments'); }
      else toast.error('خطأ في حجز الموعد');
    } catch { toast.error('خطأ في الاتصال'); }
    finally { setSaving(false); }
  };

  return (
    <div className="px-4 pb-24 pt-2 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setScreen('admin-appointments')}>
          <ChevronRight className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold">حجز موعد جديد</h2>
      </div>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">المريض *</Label>
            <Select value={form.patientId} onValueChange={(v) => setForm({...form, patientId: v})}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="اختر المريض" /></SelectTrigger>
              <SelectContent>{(patients || []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">التاريخ *</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">الوقت *</Label>
              <Input type="time" value={form.time} onChange={(e) => setForm({...form, time: e.target.value})} className="h-11 rounded-xl" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">نوع الموعد</Label>
            <Select value={form.type} onValueChange={(v) => setForm({...form, type: v})}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(appointmentTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">ملاحظات</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="rounded-xl min-h-[60px]" placeholder="ملاحظات إضافية" />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 font-semibold shadow-sm">
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Calendar className="w-4 h-4 ml-1" /> حجز الموعد</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
});

export { AddAppointmentForm };
