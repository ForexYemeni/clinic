'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { severityLabels } from '@/lib/constants';
import { toast } from 'sonner';

export function AddEmergencyForm() {
  const { setScreen, user } = useAppStore();
  const clinicId = user?.clinicId || '';
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [form, setForm] = useState({
    patientId: '', severity: 'moderate', notes: '', actions: '', procedures: '',
  });

  useEffect(() => {
    fetch(`/api/patients?clinicId=${clinicId}`).then(r => r.json()).then(setPatients).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.notes && !form.patientId) {
      toast.error('أدخل معلومات الحالة');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/emergencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, clinicId }),
      });
      if (res.ok) {
        toast.success('تمت إضافة حالة الطوارئ');
        setScreen('admin-emergencies');
      } else {
        const data = await res.json();
        toast.error(data.error || 'خطأ في الإضافة');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 pb-24">
      <button onClick={() => setScreen('admin-emergencies')} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowRight className="w-4 h-4" /> رجوع
      </button>

      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        إضافة حالة طوارئ
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Patient Selection */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">المريض</label>
          <select
            value={form.patientId}
            onChange={(e) => setForm(p => ({ ...p, patientId: e.target.value }))}
            className="w-full h-11 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">اختر المريض (اختياري)</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Severity */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">مستوى الخطورة</label>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(severityLabels).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setForm(p => ({ ...p, severity: key }))}
                className={`py-2 rounded-xl text-xs font-medium transition-all ${
                  form.severity === key
                    ? key === 'critical' ? 'bg-red-600 text-white' : key === 'high' ? 'bg-orange-500 text-white' : key === 'moderate' ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">ملاحظات الحالة</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
            placeholder="وصف حالة الطوارئ..."
            rows={3}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">الإجراءات المتخذة</label>
          <textarea
            value={form.actions}
            onChange={(e) => setForm(p => ({ ...p, actions: e.target.value }))}
            placeholder="الإجراءات التي تم اتخاذها..."
            rows={2}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          />
        </div>

        {/* Procedures */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">الإجراءات الطبية</label>
          <textarea
            value={form.procedures}
            onChange={(e) => setForm(p => ({ ...p, procedures: e.target.value }))}
            placeholder="الإجراءات الطبية المنفذة..."
            rows={2}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-gradient-to-l from-red-600 to-red-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-60 active:scale-[0.98] transition-transform"
        >
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'إضافة حالة الطوارئ'}
        </button>
      </form>
    </div>
  );
}
