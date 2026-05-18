'use client';

import React, { useState } from 'react';
import { ChevronRight, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import { BLOOD_TYPES } from '@/lib/constants';
import { toast } from 'sonner';

const AddPatientForm = React.memo(function AddPatientForm() {
  const { setScreen } = useAppStore();
  const [form, setForm] = useState({ name: '', age: '', gender: 'male', phone: '', emergencyPhone: '', address: '', bloodType: '', chronicDiseases: '', allergies: '', medicalHistory: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.age) { toast.error('يرجى إدخال الاسم والعمر'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, age: parseInt(form.age) }),
      });
      if (res.ok) { toast.success('تم إضافة المريض بنجاح'); setScreen('admin-patients'); }
      else toast.error('خطأ في إضافة المريض');
    } catch { toast.error('خطأ في الاتصال'); }
    finally { setSaving(false); }
  };

  return (
    <div className="px-4 pb-24 pt-2 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setScreen('admin-patients')}>
          <ChevronRight className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold">إضافة مريض جديد</h2>
      </div>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">الاسم الكامل *</Label>
            <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="h-11 rounded-xl" placeholder="أدخل اسم المريض" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">العمر *</Label>
              <Input type="number" value={form.age} onChange={(e) => setForm({...form, age: e.target.value})} className="h-11 rounded-xl" placeholder="العمر" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">الجنس</Label>
              <Select value={form.gender} onValueChange={(v) => setForm({...form, gender: v})}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">ذكر</SelectItem>
                  <SelectItem value="female">أنثى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">رقم الهاتف</Label>
            <Input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="h-11 rounded-xl" placeholder="05XXXXXXXX" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">هاتف الطوارئ</Label>
            <Input value={form.emergencyPhone} onChange={(e) => setForm({...form, emergencyPhone: e.target.value})} className="h-11 rounded-xl" placeholder="05XXXXXXXX" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">العنوان</Label>
            <Input value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="h-11 rounded-xl" placeholder="العنوان" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">فصيلة الدم</Label>
            <Select value={form.bloodType} onValueChange={(v) => setForm({...form, bloodType: v})}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="اختر فصيلة الدم" /></SelectTrigger>
              <SelectContent>
                {BLOOD_TYPES.map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">الأمراض المزمنة</Label>
            <Input value={form.chronicDiseases} onChange={(e) => setForm({...form, chronicDiseases: e.target.value})} className="h-11 rounded-xl" placeholder="مفصولة بفاصلة" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">الحساسية</Label>
            <Input value={form.allergies} onChange={(e) => setForm({...form, allergies: e.target.value})} className="h-11 rounded-xl" placeholder="مفصولة بفاصلة" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">التاريخ الطبي</Label>
            <Textarea value={form.medicalHistory} onChange={(e) => setForm({...form, medicalHistory: e.target.value})} className="rounded-xl min-h-[80px]" placeholder="التاريخ الطبي للمريض" />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 font-semibold shadow-sm">
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4 ml-1" /> حفظ المريض</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
});

export { AddPatientForm };
