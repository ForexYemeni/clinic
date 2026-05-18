'use client';

import React, { useState } from 'react';
import { Save, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

const NurseReports = React.memo(function NurseReports() {
  const { user } = useAppStore();
  const [form, setForm] = useState({ patientsCount: 0, servicesCount: 0, emergenciesCount: 0, notes: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/daily-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, nurseId: user?.id, date: new Date().toISOString() }),
      });
      toast.success('تم حفظ التقرير اليومي');
    } catch {
      toast.error('خطأ في حفظ التقرير');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 pb-24 pt-2 space-y-4">
      <h2 className="text-lg font-bold">التقارير</h2>

      {/* Today's date */}
      <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-xl">
        <FileText className="w-4 h-4 text-blue-500" />
        <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
          {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-bold">التقرير اليومي</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">عدد المرضى</Label>
              <Input type="number" value={form.patientsCount} onChange={(e) => setForm({...form, patientsCount: parseInt(e.target.value) || 0})} className="h-11 rounded-xl text-center" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">الخدمات</Label>
              <Input type="number" value={form.servicesCount} onChange={(e) => setForm({...form, servicesCount: parseInt(e.target.value) || 0})} className="h-11 rounded-xl text-center" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">الطوارئ</Label>
              <Input type="number" value={form.emergenciesCount} onChange={(e) => setForm({...form, emergenciesCount: parseInt(e.target.value) || 0})} className="h-11 rounded-xl text-center" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">ملاحظات</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="rounded-xl min-h-[100px]" placeholder="ملاحظات اليوم..." />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-sm">
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4 ml-1" /> حفظ التقرير</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
});

export { NurseReports };
