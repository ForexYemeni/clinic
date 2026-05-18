'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight, Plus, Search, User as UserIcon, Phone, Stethoscope, Check, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatCurrency, type PatientItem, type ServiceItem } from '@/lib/constants';
import { toast } from 'sonner';

export function NurseAddVisit() {
  const { setScreen, user } = useAppStore();
  const [step, setStep] = useState<'select-patient' | 'add-visit'>('select-patient');
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedPatientName, setSelectedPatientName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Visit form
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [visitForm, setVisitForm] = useState({
    reason: '',
    diagnosis: '',
    notes: '',
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    oxygenLevel: '',
    sugarLevel: '',
    medications: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, sRes] = await Promise.all([fetch('/api/patients'), fetch('/api/services')]);
        if (pRes.ok) setPatients(await pRes.json());
        if (sRes.ok) {
          const sData = await sRes.json();
          setServices(sData.filter((s: ServiceItem) => s.status === 'active'));
        }
      } catch {} finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const filteredPatients = patients.filter(p => p.name.includes(search) || (p.phone && p.phone.includes(search)));

  const totalAmount = selectedServices.reduce((sum, id) => {
    const svc = services.find(s => s.id === id);
    return sum + (svc?.price || 0);
  }, 0);

  const toggleService = (id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!selectedPatientId) { toast.error('اختر المريض'); return; }
    if (selectedServices.length === 0) { toast.error('اختر خدمة واحدة على الأقل'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientId,
          nurseId: user?.id,
          nurseName: user?.name,
          reason: visitForm.reason || 'زيارة عامة',
          diagnosis: visitForm.diagnosis,
          notes: visitForm.notes,
          vitalSigns: {
            bloodPressure: visitForm.bloodPressure || undefined,
            heartRate: visitForm.heartRate ? Number(visitForm.heartRate) : undefined,
            temperature: visitForm.temperature ? Number(visitForm.temperature) : undefined,
            oxygenLevel: visitForm.oxygenLevel ? Number(visitForm.oxygenLevel) : undefined,
            sugarLevel: visitForm.sugarLevel ? Number(visitForm.sugarLevel) : undefined,
          },
          medications: visitForm.medications ? visitForm.medications.split('،').map(m => m.trim()).filter(Boolean) : [],
          serviceIds: selectedServices,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('تم تسجيل الزيارة وإنشاء الفاتورة تلقائياً');
        setScreen('nurse-patients');
      } else {
        const data = await res.json();
        toast.error(data.error || 'خطأ في التسجيل');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 pb-24">
      <button onClick={() => step === 'add-visit' ? setStep('select-patient') : setScreen('nurse-patients')} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowRight className="w-4 h-4" /> رجوع
      </button>

      {step === 'select-patient' ? (
        <>
          <h2 className="text-lg font-bold mb-4">اختر المريض</h2>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو رقم الهاتف..."
              className="w-full h-10 pr-9 pl-4 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>
          ) : (
            <div className="space-y-2">
              {filteredPatients.map(patient => (
                <button
                  key={patient.id}
                  onClick={() => {
                    setSelectedPatientId(patient.id);
                    setSelectedPatientName(patient.name);
                    setStep('add-visit');
                  }}
                  className="w-full bg-white dark:bg-gray-800 rounded-xl p-3 border border-border text-right active:scale-[0.98] transition-transform flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{patient.name}</p>
                      <p className="text-xs text-muted-foreground">{patient.age} سنة</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Or create new patient inline */}
          <button
            onClick={() => {
              setScreen('admin-add-patient');
            }}
            className="w-full mt-4 flex items-center justify-center gap-2 h-12 border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-600 text-sm font-medium active:scale-[0.98] transition-transform"
          >
            <Plus className="w-4 h-4" />
            إضافة مريض جديد
          </button>
        </>
      ) : (
        <>
          <h2 className="text-lg font-bold mb-2">تسجيل زيارة</h2>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 mb-4 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{selectedPatientName}</span>
          </div>

          {/* Services Selection */}
          <div className="mb-4">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-500" />
              الخدمات المقدمة *
            </h3>
            <div className="space-y-2">
              {services.map(svc => (
                <button
                  key={svc.id}
                  onClick={() => toggleService(svc.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    selectedServices.includes(svc.id)
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-border bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      selectedServices.includes(svc.id) ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      {selectedServices.includes(svc.id) ? <Check className="w-3.5 h-3.5" /> : <span className="text-xs">{services.indexOf(svc) + 1}</span>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{svc.nameAr}</p>
                      <p className="text-[10px] text-muted-foreground">{svc.category} - {svc.duration} دقيقة</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">{formatCurrency(svc.price)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Total */}
          {selectedServices.length > 0 && (
            <div className="bg-emerald-600 text-white rounded-xl p-3 mb-4 flex items-center justify-between">
              <span className="text-sm">الإجمالي ({selectedServices.length} خدمات)</span>
              <span className="text-lg font-bold">{formatCurrency(totalAmount)}</span>
            </div>
          )}

          {/* Vital Signs */}
          <div className="mb-4">
            <h3 className="font-bold text-sm mb-2">القراءات الحيوية</h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={visitForm.bloodPressure}
                onChange={(e) => setVisitForm(p => ({ ...p, bloodPressure: e.target.value }))}
                placeholder="الضغط (120/80)"
                className="h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                dir="ltr"
              />
              <input
                type="number"
                value={visitForm.heartRate}
                onChange={(e) => setVisitForm(p => ({ ...p, heartRate: e.target.value }))}
                placeholder="معدل النبض"
                className="h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                dir="ltr"
              />
              <input
                type="number"
                value={visitForm.temperature}
                onChange={(e) => setVisitForm(p => ({ ...p, temperature: e.target.value }))}
                placeholder="الحرارة (°C)"
                className="h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                dir="ltr"
              />
              <input
                type="number"
                value={visitForm.oxygenLevel}
                onChange={(e) => setVisitForm(p => ({ ...p, oxygenLevel: e.target.value }))}
                placeholder="الأكسجين (%)"
                className="h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                dir="ltr"
              />
              <input
                type="number"
                value={visitForm.sugarLevel}
                onChange={(e) => setVisitForm(p => ({ ...p, sugarLevel: e.target.value }))}
                placeholder="السكر"
                className="h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                dir="ltr"
              />
            </div>
          </div>

          {/* Diagnosis & Notes */}
          <div className="space-y-3 mb-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">التشخيص</label>
              <input
                type="text"
                value={visitForm.diagnosis}
                onChange={(e) => setVisitForm(p => ({ ...p, diagnosis: e.target.value }))}
                placeholder="التشخيص"
                className="w-full h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">الأدوية</label>
              <input
                type="text"
                value={visitForm.medications}
                onChange={(e) => setVisitForm(p => ({ ...p, medications: e.target.value }))}
                placeholder="الأدوية مفصولة بفاصلة (،)"
                className="w-full h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">ملاحظات</label>
              <textarea
                value={visitForm.notes}
                onChange={(e) => setVisitForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="ملاحظات إضافية"
                rows={2}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-12 bg-gradient-to-l from-emerald-600 to-teal-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-60 active:scale-[0.98] transition-transform"
          >
            {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : `تسجيل الزيارة - ${formatCurrency(totalAmount)}`}
          </button>
        </>
      )}
    </div>
  );
}
