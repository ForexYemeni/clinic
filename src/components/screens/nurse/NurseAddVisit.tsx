'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Plus, Search, User as UserIcon, Stethoscope, Check, AlertCircle,
  Heart, X, CreditCard, Banknote, Receipt, Loader2, Baby, UserCheck, Sparkles
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatCurrency, type PatientItem, type ServiceItem, BLOOD_TYPES } from '@/lib/constants';
import { toast } from 'sonner';
import { SuccessCard } from '@/components/shared/SuccessCard';

// ═══ Complaint Tags ═══
const COMPLAINT_CATEGORIES = [
  {
    name: 'أعراض عامة', icon: '🤒',
    color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
    activeColor: 'bg-red-500 text-white border-red-500',
    items: ['حمى', 'صداع', 'دوخة', 'إرهاق', 'ألم عام', 'فقدان شهية', 'تعرق'],
  },
  {
    name: 'الجهاز الهضمي', icon: '🤢',
    color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
    activeColor: 'bg-orange-500 text-white border-orange-500',
    items: ['طرش', 'إسهال', 'ألم بطن', 'إمساك', 'انتفاخ', 'حرقة معدة', 'غثيان'],
  },
  {
    name: 'الجهاز التنفسي', icon: '🫁',
    color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
    activeColor: 'bg-blue-500 text-white border-blue-500',
    items: ['سعال', 'ضيق تنفس', 'سيلان أنف', 'احتقان', 'عطس', 'ألم صدر', 'بلغم'],
  },
  {
    name: 'الجلد والأنسجة', icon: '🩹',
    color: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800',
    activeColor: 'bg-pink-500 text-white border-pink-500',
    items: ['نزيف', 'حروق', 'طفح جلدي', 'حكة', 'تورم', 'جروح', 'كدمات'],
  },
  {
    name: 'العظام والمفاصل', icon: '🦴',
    color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
    activeColor: 'bg-purple-500 text-white border-purple-500',
    items: ['ألم مفاصل', 'ألم ظهر', 'كسور', 'تواء', 'تشنج', 'ألم عضلات'],
  },
  {
    name: 'الأذن والأنف والحنجرة', icon: '👂',
    color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800',
    activeColor: 'bg-teal-500 text-white border-teal-500',
    items: ['ألم أذن', 'التهاب حلق', 'نزيف أنف', 'طنين أذن', 'صعوبة بلع'],
  },
  {
    name: 'العين', icon: '👁️',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
    activeColor: 'bg-indigo-500 text-white border-indigo-500',
    items: ['ألم عين', 'احمرار', 'رؤية ضبابية', 'دموع', 'حكة عين'],
  },
  {
    name: 'القلب والأوعية', icon: '❤️',
    color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
    activeColor: 'bg-rose-500 text-white border-rose-500',
    items: ['خفقان', 'ألم صدر', 'ضغط مرتفع', 'ضغط منخفض', 'وخز'],
  },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'نقدي', icon: Banknote },
  { value: 'card', label: 'بطاقة', icon: CreditCard },
  { value: 'transfer', label: 'تحويل', icon: Receipt },
];

export function NurseAddVisit() {
  const { setScreen, user, selectedPatientId: preselectedPatientId } = useAppStore();
  const isAdmin = user?.role === 'admin';
  const [step, setStep] = useState<'select-patient' | 'add-visit'>(
    preselectedPatientId ? 'add-visit' : 'select-patient'
  );
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [search, setSearch] = useState('');
  const [activePatientId, setActivePatientId] = useState(preselectedPatientId || '');
  const [selectedPatientName, setSelectedPatientName] = useState('');
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [servicesError, setServicesError] = useState('');

  // Success card state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{
    patientName: string;
    services: { name: string; price: number }[];
    total: number;
    paid: number;
    remaining: number;
    invoiceId: string;
  }>({ patientName: '', services: [], total: 0, paid: 0, remaining: 0, invoiceId: '' });

  // Visit form
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedComplaints, setSelectedComplaints] = useState<string[]>([]);
  const [customComplaint, setCustomComplaint] = useState('');
  const [visitForm, setVisitForm] = useState({
    diagnosis: '',
    notes: '',
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    oxygenLevel: '',
    sugarLevel: '',
    medications: '',
  });

  // Payment
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Sub-step in add-visit
  const [visitSubStep, setVisitSubStep] = useState<'complaints' | 'services' | 'vitals'>('complaints');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = useAppStore.getState().token;
        const pRes = await fetch('/api/patients', {
          headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        });
        if (pRes.ok) {
          const pData = await pRes.json();
          setPatients(pData);
          if (preselectedPatientId || activePatientId) {
            const pid = activePatientId || preselectedPatientId;
            const found = pData.find((p: PatientItem) => p.id === pid);
            if (found) setSelectedPatientName(found.name);
          }
        }
      } catch {
        toast.error('خطأ في تحميل المرضى');
      } finally {
        setLoading(false);
      }
    };

    const fetchServices = async () => {
      try {
        setServicesError('');
        const token = useAppStore.getState().token;
        const sRes = await fetch('/api/services', {
          headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        });
        if (sRes.ok) {
          const sData = await sRes.json();
          const activeServices = sData.filter((s: any) => s.status === 'active' || s.active === true);
          setServices(activeServices);
          if (activeServices.length === 0) {
            setServicesError('لا توجد خدمات نشطة. يجب إضافة خدمات أولاً.');
          }
        } else {
          const errData = await sRes.json().catch(() => ({}));
          setServicesError('خطأ في تحميل الخدمات: ' + (errData.error || 'خطأ غير معروف'));
        }
      } catch {
        setServicesError('خطأ في الاتصال بالخادم لتحميل الخدمات');
      } finally {
        setServicesLoading(false);
      }
    };

    fetchData();
    fetchServices();
  }, [preselectedPatientId, activePatientId]);

  const filteredPatients = patients.filter(p =>
    p.name.includes(search) || (p.phone && p.phone.includes(search))
  );

  const totalAmount = selectedServices.reduce((sum, id) => {
    const svc = services.find(s => s.id === id);
    return sum + (svc?.price || 0);
  }, 0);

  const paidNum = Number(paidAmount) || 0;
  const remainingAmount = totalAmount - paidNum;

  const toggleService = useCallback((id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }, []);

  const toggleComplaint = useCallback((complaint: string) => {
    setSelectedComplaints(prev =>
      prev.includes(complaint) ? prev.filter(c => c !== complaint) : [...prev, complaint]
    );
  }, []);

  const addCustomComplaint = useCallback(() => {
    if (customComplaint.trim() && !selectedComplaints.includes(customComplaint.trim())) {
      setSelectedComplaints(prev => [...prev, customComplaint.trim()]);
      setCustomComplaint('');
    }
  }, [customComplaint, selectedComplaints]);

  const handleSelectPatient = (id: string, name: string) => {
    setActivePatientId(id);
    setSelectedPatientName(name);
    setStep('add-visit');
  };

  const handleSubmit = async () => {
    if (!activePatientId) { toast.error('اختر المريض'); return; }

    setSubmitting(true);
    try {
      const token = useAppStore.getState().token;
      const res = await fetch('/api/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          patientId: activePatientId || preselectedPatientId,
          nurseId: user?.id,
          nurseName: user?.name,
          reason: selectedComplaints.length > 0 ? selectedComplaints.join('، ') : 'زيارة عامة',
          complaints: selectedComplaints,
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
          paidAmount: paidNum,
          paymentMethod,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const visitServices = selectedServices.map(id => {
          const svc = services.find(s => s.id === id);
          return { name: svc?.nameAr || 'خدمة', price: svc?.price || 0 };
        });

        setSuccessData({
          patientName: selectedPatientName,
          services: visitServices,
          total: totalAmount,
          paid: paidNum,
          remaining: remainingAmount,
          invoiceId: data.invoice?.id?.slice(-6) || '',
        });
        setShowSuccess(true);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'خطأ في التسجيل');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setScreen(isAdmin ? 'admin-patients' : 'nurse-patients');
  };

  // Sub-steps for visit
  const visitSubSteps = [
    { key: 'complaints', label: 'الشكوى', icon: Heart },
    { key: 'services', label: 'الخدمات', icon: Stethoscope },
    { key: 'vitals', label: 'القراءات', icon: UserIcon },
  ] as const;

  return (
    <div className="p-4 pb-24">
      {/* Success Card Overlay */}
      <SuccessCard
        visible={showSuccess}
        onClose={handleSuccessClose}
        type="visit"
        title="تم تسجيل الزيارة بنجاح"
        message="تم إنشاء الفاتورة تلقائياً"
        patientName={successData.patientName}
        services={successData.services}
        total={successData.total}
        paid={successData.paid}
        remaining={successData.remaining}
        invoiceId={successData.invoiceId}
      />

      <button
        onClick={() => {
          if (step === 'add-visit' && !preselectedPatientId) {
            setStep('select-patient');
          } else {
            setScreen(isAdmin ? 'admin-patients' : 'nurse-patients');
          }
        }}
        className="flex items-center gap-1 text-sm text-muted-foreground mb-4"
      >
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
              className="w-full h-10 pr-9 pl-4 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500"
            />
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">لا يوجد مرضى</p>
              <button
                onClick={() => setScreen('admin-add-patient')}
                className="mt-3 text-clinic-600 text-sm font-medium"
              >
                إضافة مريض جديد
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPatients.map(patient => (
                <button
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient.id, patient.name)}
                  className="w-full bg-white dark:bg-gray-800 rounded-xl p-3 border border-border text-right active:scale-[0.98] transition-transform flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-clinic-100 dark:bg-clinic-900/30 rounded-xl flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-clinic-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{patient.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {patient.ageCategory === 'elderly' ? 'كبير' : patient.ageCategory === 'infant' ? 'كبير' : patient.ageCategory === 'child' ? 'طفل' : 'بالغ'}
                      {patient.gender ? ` - ${patient.gender === 'male' ? 'ذكر' : 'أنثى'}` : ''}
                      {patient.phone ? ` - ${patient.phone}` : ''}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Add new patient */}
          <button
            onClick={() => setScreen('admin-add-patient')}
            className="w-full mt-4 flex items-center justify-center gap-2 h-12 border-2 border-dashed border-clinic-300 dark:border-clinic-700 rounded-xl text-clinic-600 text-sm font-medium active:scale-[0.98] transition-transform"
          >
            <Plus className="w-4 h-4" />
            إضافة مريض جديد
          </button>
        </>
      ) : (
        <>
          <h2 className="text-lg font-bold mb-2">تسجيل زيارة</h2>

          {/* Selected Patient */}
          <div className="bg-clinic-50 dark:bg-clinic-900/20 rounded-xl p-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-clinic-600" />
              <span className="text-sm font-medium text-clinic-800 dark:text-clinic-300">{selectedPatientName}</span>
            </div>
            {!preselectedPatientId && (
              <button onClick={() => setStep('select-patient')} className="text-xs text-clinic-600 font-medium">
                تغيير
              </button>
            )}
          </div>

          {/* Sub-step tabs */}
          <div className="flex gap-2 mb-4">
            {visitSubSteps.map(s => {
              const Icon = s.icon;
              const isActive = visitSubStep === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setVisitSubStep(s.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-clinic-500 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {s.label}
                  {s.key === 'complaints' && selectedComplaints.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-white/30 text-[10px] flex items-center justify-center">{selectedComplaints.length}</span>
                  )}
                  {s.key === 'services' && selectedServices.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-white/30 text-[10px] flex items-center justify-center">{selectedServices.length}</span>
                  )}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {/* ═══ COMPLAINTS SUB-STEP ═══ */}
            {visitSubStep === 'complaints' && (
              <motion.div key="complaints" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Selected complaints */}
                {selectedComplaints.length > 0 && (
                  <div className="bg-clinic-50 dark:bg-clinic-900/20 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-clinic-700 dark:text-clinic-300">الشكوى ({selectedComplaints.length})</span>
                      <button onClick={() => setSelectedComplaints([])} className="text-xs text-red-500">مسح</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedComplaints.map((c, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-clinic-500 text-white rounded-lg text-xs font-medium">
                          {c}
                          <button onClick={() => toggleComplaint(c)}><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {COMPLAINT_CATEGORIES.map((cat, catIdx) => (
                  <div key={catIdx} className="space-y-1.5">
                    <h4 className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                      <span>{cat.icon}</span> {cat.name}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.items.map(complaint => {
                        const isActive = selectedComplaints.includes(complaint);
                        return (
                          <button key={complaint} type="button" onClick={() => toggleComplaint(complaint)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all active:scale-95 ${isActive ? cat.activeColor : cat.color}`}
                          >
                            {complaint}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Custom */}
                <div className="flex gap-2">
                  <input type="text" value={customComplaint} onChange={e => setCustomComplaint(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomComplaint(); }}}
                    placeholder="شكوى أخرى..." className="flex-1 h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500" />
                  <button onClick={addCustomComplaint} disabled={!customComplaint.trim()}
                    className="h-10 px-3 bg-clinic-500 text-white rounded-xl text-xs font-bold disabled:opacity-40">+</button>
                </div>

                {/* Diagnosis */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">التشخيص</label>
                  <input type="text" value={visitForm.diagnosis} onChange={e => setVisitForm(p => ({ ...p, diagnosis: e.target.value }))}
                    placeholder="التشخيص" className="w-full h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500" />
                </div>

                <button onClick={() => setVisitSubStep('services')}
                  className="w-full h-10 bg-gradient-to-l from-clinic-500 to-clinic-600 text-white font-bold rounded-xl text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
                  التالي: الخدمات <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              </motion.div>
            )}

            {/* ═══ SERVICES SUB-STEP ═══ */}
            {visitSubStep === 'services' && (
              <motion.div key="services" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                {servicesLoading ? (
                  <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>
                ) : servicesError ? (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                    <AlertCircle className="w-8 h-8 mx-auto text-red-400 mb-2" />
                    <p className="text-sm text-red-600 dark:text-red-400">{servicesError}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Array.from(new Set(services.map(s => s.category || 'أخرى'))).map(category => (
                      <div key={category}>
                        <p className="text-xs font-medium text-muted-foreground mb-1 mt-2">{category}</p>
                        {services.filter(s => (s.category || 'أخرى') === category).map(svc => (
                          <button
                            key={svc.id}
                            onClick={() => toggleService(svc.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all mb-1.5 active:scale-[0.99] ${
                              selectedServices.includes(svc.id)
                                ? 'border-clinic-500 bg-clinic-50 dark:bg-clinic-900/20'
                                : 'border-transparent bg-white dark:bg-gray-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                selectedServices.includes(svc.id) ? 'bg-clinic-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-700'
                              }`}>
                                {selectedServices.includes(svc.id) ? <Check className="w-4 h-4" /> : <span className="text-[10px]">{services.indexOf(svc) + 1}</span>}
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">{svc.nameAr}</p>
                                <p className="text-[10px] text-muted-foreground">{svc.duration} دقيقة</p>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-clinic-600 dark:text-clinic-400">{formatCurrency(svc.price)}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Payment section */}
                {selectedServices.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-clinic-200 dark:border-clinic-800 overflow-hidden">
                    {/* Total */}
                    <div className="p-3 bg-clinic-50 dark:bg-clinic-900/20 flex items-center justify-between">
                      <span className="text-sm font-bold">الإجمالي ({selectedServices.length} خدمات)</span>
                      <span className="text-lg font-bold text-clinic-600">{formatCurrency(totalAmount)}</span>
                    </div>

                    {/* Payment */}
                    <div className="p-3 space-y-2.5">
                      <h4 className="text-xs font-bold flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-clinic-600" /> التسديد
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {PAYMENT_METHODS.map(m => {
                          const Icon = m.icon;
                          return (
                            <button key={m.value} type="button" onClick={() => setPaymentMethod(m.value)}
                              className={`p-2 rounded-xl flex flex-col items-center gap-1 border-2 transition-all ${paymentMethod === m.value ? 'border-clinic-500 bg-clinic-50 dark:bg-clinic-900/20' : 'border-transparent bg-gray-50 dark:bg-gray-700/50'}`}>
                              <Icon className={`w-4 h-4 ${paymentMethod === m.value ? 'text-clinic-600' : 'text-muted-foreground'}`} />
                              <span className={`text-[10px] font-bold ${paymentMethod === m.value ? 'text-clinic-600' : 'text-muted-foreground'}`}>{m.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      <input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)}
                        placeholder="المبلغ المدفوع" max={totalAmount}
                        className="w-full h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500" dir="ltr" inputMode="numeric" />
                      <div className="flex gap-1.5">
                        <button onClick={() => setPaidAmount(String(totalAmount))} className="flex-1 h-7 text-[10px] font-bold bg-green-50 dark:bg-green-900/20 text-green-700 rounded-lg">دفع الكل</button>
                        <button onClick={() => setPaidAmount('0')} className="flex-1 h-7 text-[10px] font-bold bg-red-50 dark:bg-red-900/20 text-red-700 rounded-lg">بدون دفع</button>
                      </div>
                      {paidNum > 0 && remainingAmount > 0 && (
                        <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-between">
                          <span className="text-xs font-bold">المتبقي</span>
                          <span className="text-sm font-bold text-amber-600">{formatCurrency(remainingAmount)}</span>
                        </div>
                      )}
                      {paidNum > 0 && remainingAmount <= 0 && (
                        <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-center">
                          <span className="text-xs font-bold text-green-600">تم الدفع بالكامل ✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => setVisitSubStep('complaints')} className="h-10 px-4 bg-gray-100 dark:bg-gray-800 font-bold rounded-xl text-xs">رجوع</button>
                  <button onClick={() => setVisitSubStep('vitals')} className="flex-1 h-10 bg-gradient-to-l from-clinic-500 to-clinic-600 text-white font-bold rounded-xl text-xs active:scale-[0.98] transition-transform flex items-center justify-center gap-1">
                    التالي: القراءات <ArrowRight className="w-3 h-3 rotate-180" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ═══ VITALS SUB-STEP ═══ */}
            {visitSubStep === 'vitals' && (
              <motion.div key="vitals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">القراءات الحيوية</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" value={visitForm.bloodPressure} onChange={e => setVisitForm(p => ({ ...p, bloodPressure: e.target.value }))}
                      placeholder="الضغط (120/80)" className="h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500" dir="ltr" />
                    <input type="number" value={visitForm.heartRate} onChange={e => setVisitForm(p => ({ ...p, heartRate: e.target.value }))}
                      placeholder="النبض" className="h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500" dir="ltr" />
                    <input type="number" value={visitForm.temperature} onChange={e => setVisitForm(p => ({ ...p, temperature: e.target.value }))}
                      placeholder="الحرارة °C" className="h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500" dir="ltr" />
                    <input type="number" value={visitForm.oxygenLevel} onChange={e => setVisitForm(p => ({ ...p, oxygenLevel: e.target.value }))}
                      placeholder="الأكسجين %" className="h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500" dir="ltr" />
                    <input type="number" value={visitForm.sugarLevel} onChange={e => setVisitForm(p => ({ ...p, sugarLevel: e.target.value }))}
                      placeholder="السكر" className="h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500" dir="ltr" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">الأدوية</label>
                  <input type="text" value={visitForm.medications} onChange={e => setVisitForm(p => ({ ...p, medications: e.target.value }))}
                    placeholder="مفصولة بفاصلة (،)" className="w-full h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">ملاحظات</label>
                  <textarea value={visitForm.notes} onChange={e => setVisitForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="ملاحظات" rows={2} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500 resize-none" />
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setVisitSubStep('services')} className="h-10 px-4 bg-gray-100 dark:bg-gray-800 font-bold rounded-xl text-xs">رجوع</button>
                  <button onClick={handleSubmit} disabled={submitting || (selectedServices.length === 0)}
                    className="flex-1 h-12 bg-gradient-to-l from-clinic-500 to-clinic-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-60 active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : selectedServices.length > 0 ? (
                      `تسجيل الزيارة - ${formatCurrency(totalAmount)}`
                    ) : (
                      'اختر الخدمات أولاً'
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
