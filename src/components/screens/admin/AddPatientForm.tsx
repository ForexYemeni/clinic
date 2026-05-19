'use client';

import React, { useState } from 'react';
import { ArrowRight, User, Phone, MapPin, Droplets, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { BLOOD_TYPES, genderLabels } from '@/lib/constants';
import { toast } from 'sonner';

export function AddPatientForm() {
  const { setScreen, setSelectedPatientId } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', age: '', gender: 'male', phone: '', emergencyPhone: '',
    address: '', bloodType: '', chronicDiseases: '', allergies: '', medicalHistory: '', notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('أدخل اسم المريض'); return; }
    if (!form.age) { toast.error('أدخل العمر'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          age: Number(form.age),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('تمت إضافة المريض بنجاح');
        setSelectedPatientId(data.id);
        setScreen('admin-patient-detail');
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
      <button onClick={() => setScreen('admin-patients')} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowRight className="w-4 h-4" /> رجوع لقائمة المرضى
      </button>

      <h2 className="text-lg font-bold mb-4">إضافة مريض جديد</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">اسم المريض *</label>
          <div className="relative">
            <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="الاسم الكامل"
              className="w-full h-11 pr-10 pl-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500"
            />
          </div>
        </div>

        {/* Age & Gender */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">العمر *</label>
            <input
              type="number"
              value={form.age}
              onChange={(e) => setForm(p => ({ ...p, age: e.target.value }))}
              placeholder="العمر"
              className="w-full h-11 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500"
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">الجنس</label>
            <select
              value={form.gender}
              onChange={(e) => setForm(p => ({ ...p, gender: e.target.value }))}
              className="w-full h-11 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500"
            >
              {Object.entries(genderLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">رقم الهاتف</label>
          <div className="relative">
            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
              placeholder="رقم الهاتف"
              className="w-full h-11 pr-10 pl-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500"
              dir="ltr"
            />
          </div>
        </div>

        {/* Emergency Phone */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">رقم الطوارئ</label>
          <div className="relative">
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="tel"
              value={form.emergencyPhone}
              onChange={(e) => setForm(p => ({ ...p, emergencyPhone: e.target.value }))}
              placeholder="رقم هاتف للطوارئ"
              className="w-full h-11 pr-10 pl-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500"
              dir="ltr"
            />
          </div>
        </div>

        {/* Blood Type */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">فصيلة الدم</label>
          <select
            value={form.bloodType}
            onChange={(e) => setForm(p => ({ ...p, bloodType: e.target.value }))}
            className="w-full h-11 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500"
          >
            <option value="">غير محدد</option>
            {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
          </select>
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">العنوان</label>
          <div className="relative">
            <MapPin className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
            <textarea
              value={form.address}
              onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))}
              placeholder="العنوان"
              rows={2}
              className="w-full pr-10 pl-3 py-2 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500 resize-none"
            />
          </div>
        </div>

        {/* Chronic Diseases */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">أمراض مزمنة</label>
          <input
            type="text"
            value={form.chronicDiseases}
            onChange={(e) => setForm(p => ({ ...p, chronicDiseases: e.target.value }))}
            placeholder="مثال: السكري، الضغط"
            className="w-full h-11 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500"
          />
        </div>

        {/* Allergies */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">حساسية</label>
          <input
            type="text"
            value={form.allergies}
            onChange={(e) => setForm(p => ({ ...p, allergies: e.target.value }))}
            placeholder="مثال: بنسلين، غبار"
            className="w-full h-11 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500"
          />
        </div>

        {/* Medical History */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">التاريخ المرضي</label>
          <textarea
            value={form.medicalHistory}
            onChange={(e) => setForm(p => ({ ...p, medicalHistory: e.target.value }))}
            placeholder="التاريخ المرضي"
            rows={2}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500 resize-none"
          />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">ملاحظات</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
            placeholder="ملاحظات إضافية"
            rows={2}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-gradient-to-l to-clinic-600 to-teal-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-60 active:scale-[0.98] transition-transform"
        >
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'إضافة المريض'}
        </button>
      </form>
    </div>
  );
}
