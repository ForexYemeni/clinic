'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import { useData } from '@/hooks/useData';
import { PatientItem, severityLabels } from '@/lib/constants';
import { toast } from 'sonner';

const NurseAddCase = React.memo(function NurseAddCase() {
  const { setScreen, user } = useAppStore();
  const { data: patients } = useData<PatientItem[]>('/api/patients');
  const [form, setForm] = useState({ patientId: '', severity: 'moderate', notes: '', actions: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.patientId) { toast.error('يرجى اختيار المريض'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/emergencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, nurseId: user?.id, arrivalTime: new Date().toISOString() }),
      });
      if (res.ok) { toast.success('تم تسجيل حالة الطوارئ'); setScreen('nurse-emergencies'); }
      else toast.error('خطأ في التسجيل');
    } catch { toast.error('خطأ في الاتصال'); }
    finally { setSaving(false); }
  };

  return (
    <div className="px-4 pb-24 pt-2 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setScreen('nurse-add-emergency')}>
          <AlertTriangle className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold">تسجيل حالة طوارئ</h2>
      </div>
      <Card className="border-0 shadow-sm border-r-4 border-r-red-500 overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">المريض *</Label>
            <Select value={form.patientId} onValueChange={(v) => setForm({...form, patientId: v})}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="اختر المريض" /></SelectTrigger>
              <SelectContent>
                {(patients || []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">مستوى الخطورة</Label>
            <Select value={form.severity} onValueChange={(v) => setForm({...form, severity: v})}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(severityLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">ملاحظات</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="rounded-xl min-h-[80px]" placeholder="وصف الحالة..." />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">الإجراءات المتخذة</Label>
            <Textarea value={form.actions} onChange={(e) => setForm({...form, actions: e.target.value})} className="rounded-xl min-h-[80px]" placeholder="الإجراءات..." />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 font-semibold shadow-sm">
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><AlertTriangle className="w-4 h-4 ml-1" /> تسجيل الحالة</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
});

export { NurseAddCase };
