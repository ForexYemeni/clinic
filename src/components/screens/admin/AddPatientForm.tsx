'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, User, Phone, Droplets, Stethoscope, Check,
  Search, Plus, X, CreditCard, Banknote, Receipt,
  Baby, UserCheck, Sparkles, Heart, AlertCircle, Loader2
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { BLOOD_TYPES, formatCurrency, type ServiceItem } from '@/lib/constants';
import { toast } from 'sonner';
import { SuccessCard } from '@/components/shared/SuccessCard';

// ═══════════════════════════════════════════════════════════
// 🏥 COMPLAINT CATEGORIES & TAGS
// ═══════════════════════════════════════════════════════════
const COMPLAINT_CATEGORIES = [
  {
    name: 'أعراض عامة',
    icon: '🤒',
    color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
    activeColor: 'bg-red-500 text-white border-red-500',
    items: ['حمى', 'صداع', 'دوخة', 'إرهاق', 'ألم عام', 'فقدان شهية', 'تعرق'],
  },
  {
    name: 'الجهاز الهضمي',
    icon: '🤢',
    color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
    activeColor: 'bg-orange-500 text-white border-orange-500',
    items: ['طرش', 'إسهال', 'ألم بطن', 'إمساك', 'انتفاخ', 'حرقة معدة', 'غثيان'],
  },
  {
    name: 'الجهاز التنفسي',
    icon: '🫁',
    color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
    activeColor: 'bg-blue-500 text-white border-blue-500',
    items: ['سعال', 'ضيق تنفس', 'سيلان أنف', 'احتقان', 'عطس', 'ألم صدر', 'بلغم'],
  },
  {
    name: 'الجلد والأنسجة',
    icon: '🩹',
    color: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800',
    activeColor: 'bg-pink-500 text-white border-pink-500',
    items: ['نزيف', 'حروق', 'طفح جلدي', 'حكة', 'تورم', 'جروح', 'كدمات'],
  },
  {
    name: 'العظام والمفاصل',
    icon: '🦴',
    color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
    activeColor: 'bg-purple-500 text-white border-purple-500',
    items: ['ألم مفاصل', 'ألم ظهر', 'كسور', 'تواء', 'تشنج', 'ألم عضلات'],
  },
  {
    name: 'الأذن والأنف والحنجرة',
    icon: '👂',
    color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800',
    activeColor: 'bg-teal-500 text-white border-teal-500',
    items: ['ألم أذن', 'التهاب حلق', 'نزيف أنف', 'طنين أذن', 'صعوبة بلع'],
  },
  {
    name: 'العين',
    icon: '👁️',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
    activeColor: 'bg-indigo-500 text-white border-indigo-500',
    items: ['ألم عين', 'احمرار', 'رؤية ضبابية', 'دموع', 'حكة عين'],
  },
  {
    name: 'القلب والأوعية',
    icon: '❤️',
    color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
    activeColor: 'bg-rose-500 text-white border-rose-500',
    items: ['خفقان', 'ألم صدر', 'ضغط مرتفع', 'ضغط منخفض', 'وخز'],
  },
];

const AGE_CATEGORIES = [
  { value: 'elderly', label: 'كبير', icon: UserCheck, color: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700', activeColor: 'bg-amber-500 text-white border-amber-500' },
  { value: 'child', label: 'طفل', icon: Baby, color: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700', activeColor: 'bg-blue-500 text-white border-blue-500' },
  { value: 'adult', label: 'بالغ', icon: User, color: 'bg-green-50 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700', activeColor: 'bg-green-500 text-white border-green-500' },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'نقدي', icon: Banknote },
  { value: 'card', label: 'بطاقة', icon: CreditCard },
  { value: 'transfer', label: 'تحويل', icon: Receipt },
];

// ═══════════════════════════════════════════════════════════
// 🏥 ADD PATIENT FORM - COMPLETE REDESIGN
// ═══════════════════════════════════════════════════════════
export function AddPatientForm() {
  const { setScreen, setSelectedPatientId, user } = useAppStore();

  // Form steps
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Basic info
  const [name, setName] = useState('');
  const [gender, setGender] = useState('male');
  const [ageCategory, setAgeCategory] = useState('elderly');
  const [phone, setPhone] = useState('');
  const [bloodType, setBloodType] = useState('');

  // Complaints
  const [selectedComplaints, setSelectedComplaints] = useState<string[]>([]);
  const [customComplaint, setCustomComplaint] = useState('');

  // Services
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesSearch, setServicesSearch] = useState('');

  // Payment
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Submission
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{
    patientName: string;
    services: { name: string; price: number }[];
    total: number;
    paid: number;
    remaining: number;
    invoiceId: string;
  }>({ patientName: '', services: [], total: 0, paid: 0, remaining: 0, invoiceId: '' });

  // Load services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const token = useAppStore.getState().token;
        const res = await fetch('/api/services', {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (res.ok) {
          const data = await res.json();
          const active = data.filter((s: any) => s.status === 'active' || s.active === true);
          setServices(active);
        }
      } catch {
        toast.error('خطأ في تحميل الخدمات');
      } finally {
        setServicesLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Calculations
  const totalAmount = selectedServices.reduce((sum, id) => {
    const svc = services.find(s => s.id === id);
    return sum + (svc?.price || 0);
  }, 0);

  const paidNum = Number(paidAmount) || 0;
  const remainingAmount = totalAmount - paidNum;

  // Toggle complaint
  const toggleComplaint = useCallback((complaint: string) => {
    setSelectedComplaints(prev =>
      prev.includes(complaint) ? prev.filter(c => c !== complaint) : [...prev, complaint]
    );
  }, []);

  // Add custom complaint
  const addCustomComplaint = useCallback(() => {
    if (customComplaint.trim() && !selectedComplaints.includes(customComplaint.trim())) {
      setSelectedComplaints(prev => [...prev, customComplaint.trim()]);
      setCustomComplaint('');
    }
  }, [customComplaint, selectedComplaints]);

  // Toggle service
  const toggleService = useCallback((id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }, []);

  // Validate step
  const canGoNext = () => {
    if (currentStep === 1) return name.trim().length > 0;
    if (currentStep === 2) return true; // complaints are optional
    return true;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('أدخل اسم المريض'); return; }
    setLoading(true);

    try {
      // Step 1: Create patient
      const token = useAppStore.getState().token;
      const pRes = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: name.trim(),
          gender,
          ageCategory,
          phone,
          bloodType: bloodType || undefined,
          complaints: selectedComplaints,
          age: ageCategory === 'elderly' ? 65 : ageCategory === 'child' ? 8 : 30,
        }),
      });

      if (!pRes.ok) {
        const data = await pRes.json();
        toast.error(data.error || 'خطأ في إضافة المريض');
        setLoading(false);
        return;
      }

      const patientData = await pRes.json();
      const patientId = patientData.id;

      // Step 2: Create visit with services if any selected
      if (selectedServices.length > 0) {
        const vRes = await fetch('/api/visits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            patientId,
            nurseId: user?.id,
            nurseName: user?.name,
            reason: selectedComplaints.length > 0 ? selectedComplaints.join('، ') : 'زيارة عامة',
            complaints: selectedComplaints,
            serviceIds: selectedServices,
            paidAmount: paidNum,
            paymentMethod,
          }),
        });

        if (!vRes.ok) {
          const data = await vRes.json();
          toast.error(data.error || 'خطأ في تسجيل الخدمات');
          setLoading(false);
          return;
        }

        const visitResult = await vRes.json();

        // Success data
        const visitServices = selectedServices.map(id => {
          const svc = services.find(s => s.id === id);
          return { name: svc?.nameAr || 'خدمة', price: svc?.price || 0 };
        });

        setSuccessData({
          patientName: name.trim(),
          services: visitServices,
          total: totalAmount,
          paid: paidNum,
          remaining: remainingAmount,
          invoiceId: visitResult.invoice?.id?.slice(-6) || '',
        });
        setShowSuccess(true);
      } else {
        // No services selected, just go to patient detail
        toast.success('تمت إضافة المريض بنجاح');
        setSelectedPatientId(patientId);
        setScreen('admin-patient-detail');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  // Filter services by search
  const filteredServices = services.filter(s =>
    !servicesSearch || s.nameAr.includes(servicesSearch)
  );

  // Group filtered services by category
  const serviceCategories = Array.from(new Set(filteredServices.map(s => s.category || 'أخرى')));

  // Step labels
  const stepLabels = ['المعلومات الأساسية', 'الشكوى والأعراض', 'الخدمات والدفع'];
  const stepIcons = [User, Heart, Stethoscope];

  return (
    <div className="p-4 pb-24">
      {/* Success Card Overlay */}
      <SuccessCard
        visible={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          setScreen('admin-patients');
        }}
        type="visit"
        title="تم تسجيل المريض والخدمات بنجاح"
        message="تم إنشاء الفاتورة تلقائياً"
        patientName={successData.patientName}
        services={successData.services}
        total={successData.total}
        paid={successData.paid}
        remaining={successData.remaining}
        invoiceId={successData.invoiceId}
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setScreen('admin-patients')} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-xl border border-border shadow-sm active:scale-[0.97] transition-all">
          <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-foreground" />
          </div>
          <span className="text-sm font-medium">رجوع</span>
        </button>
      </div>

      <h2 className="text-lg font-bold mb-1">إضافة مريض جديد</h2>
      <p className="text-xs text-muted-foreground mb-4">تسجيل المريض مع الشكوى والخدمات في خطوة واحدة</p>

      {/* Step Progress */}
      <div className="flex items-center gap-2 mb-6">
        {stepLabels.map((label, i) => {
          const step = i + 1 as 1 | 2 | 3;
          const StepIcon = stepIcons[i];
          const isActive = currentStep === step;
          const isDone = currentStep > step;
          return (
            <button
              key={step}
              onClick={() => { if (isDone || (step === 1) || (step === 2 && name.trim())) setCurrentStep(step); }}
              className={`flex-1 flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-clinic-50 dark:bg-clinic-900/20 border-2 border-clinic-500'
                  : isDone
                    ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-800 border border-border'
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                isDone ? 'bg-green-500 text-white' : isActive ? 'bg-clinic-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}>
                {isDone ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
              </div>
              <span className={`text-[10px] font-bold ${isActive ? 'text-clinic-700 dark:text-clinic-300' : isDone ? 'text-green-600' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* ═══════════════════════════════════════════════════ */}
        {/* STEP 1: Basic Info */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-1.5">
                <User className="w-4 h-4 text-clinic-600" />
                اسم المريض *
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="الاسم الكامل"
                  className="w-full h-12 pr-10 pl-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-clinic-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-1.5">
                <span className="text-clinic-600">{gender === 'male' ? '♂' : '♀'}</span>
                الجنس
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all border-2 ${
                    gender === 'male'
                      ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                      : 'bg-white dark:bg-gray-800 border-border text-blue-600 dark:text-blue-400'
                  }`}
                >
                  ♂ ذكر
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all border-2 ${
                    gender === 'female'
                      ? 'bg-pink-500 text-white border-pink-500 shadow-md'
                      : 'bg-white dark:bg-gray-800 border-border text-pink-600 dark:text-pink-400'
                  }`}
                >
                  ♀ أنثى
                </button>
              </div>
            </div>

            {/* Age Category */}
            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-clinic-600" />
                الفئة العمرية
              </label>
              <div className="grid grid-cols-3 gap-2">
                {AGE_CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const isActive = ageCategory === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setAgeCategory(cat.value)}
                      className={`p-3 rounded-xl flex flex-col items-center gap-1.5 border-2 transition-all ${
                        isActive ? cat.activeColor + ' shadow-md' : cat.color
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-bold">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-clinic-600" />
                رقم الهاتف
              </label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  placeholder="7XXXXXXXX"
                  className="w-full h-12 pr-10 pl-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-clinic-500"
                  dir="ltr"
                  inputMode="numeric"
                />
              </div>
            </div>

            {/* Blood Type */}
            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-red-500" />
                فصيلة الدم
                <span className="text-xs text-muted-foreground font-normal">(اختياري)</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['', ...BLOOD_TYPES].map(bt => (
                  <button
                    key={bt || 'none'}
                    type="button"
                    onClick={() => setBloodType(bt)}
                    className={`h-10 rounded-lg text-sm font-bold transition-all border-2 ${
                      bloodType === bt
                        ? 'bg-red-500 text-white border-red-500 shadow-md'
                        : 'bg-white dark:bg-gray-800 border-border text-muted-foreground'
                    }`}
                  >
                    {bt || '—'}
                  </button>
                ))}
              </div>
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={() => { if (name.trim()) setCurrentStep(2); else toast.error('أدخل اسم المريض'); }}
              disabled={!name.trim()}
              className="w-full h-12 bg-gradient-to-l from-clinic-500 to-clinic-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-60 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              التالي: الشكوى والأعراض
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* STEP 2: Complaints */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Selected complaints summary */}
            {selectedComplaints.length > 0 && (
              <div className="bg-clinic-50 dark:bg-clinic-900/20 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-clinic-700 dark:text-clinic-300">الشكوى المختارة ({selectedComplaints.length})</span>
                  <button
                    onClick={() => setSelectedComplaints([])}
                    className="text-xs text-red-500 font-medium"
                  >
                    مسح الكل
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedComplaints.map((c, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-clinic-500 text-white rounded-lg text-xs font-medium"
                    >
                      {c}
                      <button onClick={() => toggleComplaint(c)} className="hover:bg-white/20 rounded-full">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Complaint categories */}
            {COMPLAINT_CATEGORIES.map((cat, catIdx) => (
              <div key={catIdx} className="space-y-2">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <span className="text-base">{cat.icon}</span>
                  {cat.name}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {cat.items.map((complaint) => {
                    const isActive = selectedComplaints.includes(complaint);
                    return (
                      <button
                        key={complaint}
                        type="button"
                        onClick={() => toggleComplaint(complaint)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                          isActive ? cat.activeColor : cat.color
                        }`}
                      >
                        {complaint}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Custom complaint */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Plus className="w-4 h-4 text-clinic-600" />
                شكوى أخرى
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customComplaint}
                  onChange={(e) => setCustomComplaint(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomComplaint(); }}}
                  placeholder="اكتب شكوى ثم اضغط إضافة..."
                  className="flex-1 h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500"
                />
                <button
                  type="button"
                  onClick={addCustomComplaint}
                  disabled={!customComplaint.trim()}
                  className="h-10 px-4 bg-clinic-500 text-white rounded-xl text-sm font-bold disabled:opacity-40 active:scale-95 transition-transform"
                >
                  إضافة
                </button>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="h-12 px-5 bg-gray-100 dark:bg-gray-800 font-bold rounded-xl text-sm"
              >
                رجوع
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex-1 h-12 bg-gradient-to-l from-clinic-500 to-clinic-600 text-white font-bold rounded-xl shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                التالي: الخدمات والدفع
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
              {selectedComplaints.length === 0 && (
                <button
                  type="button"
                  onClick={() => { setCurrentStep(3); }}
                  className="h-12 px-3 text-xs text-muted-foreground"
                >
                  تخطي
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* STEP 3: Services & Payment */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Services Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={servicesSearch}
                onChange={(e) => setServicesSearch(e.target.value)}
                placeholder="بحث في الخدمات..."
                className="w-full h-10 pr-10 pl-4 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500"
              />
            </div>

            {/* Scrollable Services List */}
            {servicesLoading ? (
              <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>
            ) : services.length === 0 ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 text-center">
                <AlertCircle className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                <p className="text-sm text-yellow-700 dark:text-yellow-400">لا توجد خدمات متاحة</p>
                <p className="text-xs text-muted-foreground mt-1">يجب إضافة خدمات أولاً</p>
              </div>
            ) : (
              <div className="max-h-[45vh] overflow-y-auto overscroll-contain space-y-3 pr-1 scrollbar-thin">
                {serviceCategories.map(category => (
                  <div key={category}>
                    <p className="text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-clinic-500" />
                      {category}
                    </p>
                    <div className="space-y-1.5">
                      {filteredServices.filter(s => (s.category || 'أخرى') === category).map(svc => {
                        const isSelected = selectedServices.includes(svc.id);
                        return (
                          <button
                            key={svc.id}
                            type="button"
                            onClick={() => toggleService(svc.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all active:scale-[0.99] ${
                              isSelected
                                ? 'border-clinic-500 bg-clinic-50 dark:bg-clinic-900/20 shadow-sm'
                                : 'border-transparent bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                isSelected ? 'bg-clinic-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                              }`}>
                                {isSelected ? <Check className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold">{svc.nameAr}</p>
                                <p className="text-[10px] text-muted-foreground">{svc.duration} دقيقة</p>
                              </div>
                            </div>
                            <span className={`text-sm font-bold ${isSelected ? 'text-clinic-600 dark:text-clinic-400' : 'text-muted-foreground'}`}>
                              {formatCurrency(svc.price)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Services Summary & Payment - Outside scrollable area */}
            {selectedServices.length > 0 && (
              <motion.div
                id="payment-section"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-clinic-200 dark:border-clinic-800 overflow-hidden shadow-lg"
              >
                {/* Services list */}
                <div className="p-3 border-b border-border">
                  <h4 className="text-xs font-bold text-muted-foreground mb-2">الخدمات المختارة ({selectedServices.length})</h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {selectedServices.map(id => {
                      const svc = services.find(s => s.id === id);
                      return (
                        <div key={id} className="flex items-center justify-between py-1 px-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <span className="text-xs font-medium">{svc?.nameAr || 'خدمة'}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-clinic-600">{formatCurrency(svc?.price || 0)}</span>
                            <button onClick={() => toggleService(id)} className="text-red-400 hover:text-red-600">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Total */}
                <div className="p-3 bg-clinic-50 dark:bg-clinic-900/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">الإجمالي</span>
                    <span className="text-lg font-bold text-clinic-600 dark:text-clinic-400">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                {/* Payment */}
                <div className="p-3 space-y-3">
                  <h4 className="text-sm font-bold flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-clinic-600" />
                    التسديد
                  </h4>

                  {/* Payment method */}
                  <div className="grid grid-cols-3 gap-2">
                    {PAYMENT_METHODS.map(method => {
                      const Icon = method.icon;
                      const isActive = paymentMethod === method.value;
                      return (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => setPaymentMethod(method.value)}
                          className={`p-2.5 rounded-xl flex flex-col items-center gap-1 border-2 transition-all ${
                            isActive
                              ? 'border-clinic-500 bg-clinic-50 dark:bg-clinic-900/20'
                              : 'border-transparent bg-gray-50 dark:bg-gray-700/50'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? 'text-clinic-600' : 'text-muted-foreground'}`} />
                          <span className={`text-[10px] font-bold ${isActive ? 'text-clinic-600' : 'text-muted-foreground'}`}>
                            {method.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Paid amount */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">المبلغ المدفوع</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        placeholder="0"
                        className="w-full h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500"
                        dir="ltr"
                        inputMode="numeric"
                        max={totalAmount}
                      />
                      {/* Quick amount buttons */}
                      <div className="flex gap-1.5 mt-1.5">
                        <button
                          type="button"
                          onClick={() => setPaidAmount(String(totalAmount))}
                          className="flex-1 h-7 text-[10px] font-bold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg active:scale-95 transition-transform"
                        >
                          دفع الكل
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaidAmount('0')}
                          className="flex-1 h-7 text-[10px] font-bold bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg active:scale-95 transition-transform"
                        >
                          بدون دفع
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remaining */}
                  {paidNum > 0 && (
                    <div className={`p-2.5 rounded-xl flex items-center justify-between ${
                      remainingAmount <= 0
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : 'bg-amber-50 dark:bg-amber-900/20'
                    }`}>
                      <span className="text-xs font-bold">
                        {remainingAmount <= 0 ? 'تم الدفع بالكامل ✓' : 'المتبقي'}
                      </span>
                      {remainingAmount > 0 && (
                        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                          {formatCurrency(remainingAmount)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Navigation - shown when NO services selected */}
            {selectedServices.length === 0 && (
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="h-12 px-5 bg-gray-100 dark:bg-gray-800 font-bold rounded-xl text-sm"
                >
                  رجوع
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 h-12 bg-gradient-to-l from-clinic-500 to-clinic-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-60 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'تسجيل المريض بدون خدمات'
                  )}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Bottom Bar - Shows on Step 3 when services are selected */}
      {currentStep === 3 && selectedServices.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)] pb-safe">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="h-11 px-4 bg-gray-100 dark:bg-gray-800 font-bold rounded-xl text-sm active:scale-[0.97] transition-transform"
              >
                رجوع
              </button>
              <div>
                <p className="text-xs text-muted-foreground">{selectedServices.length} خدمة محددة</p>
                <p className="text-lg font-bold text-clinic-600 dark:text-clinic-400">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="h-11 px-5 bg-gradient-to-l from-clinic-600 to-clinic-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-60 active:scale-[0.97] transition-transform flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'تسجيل المريض والخدمات'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
