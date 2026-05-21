'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Phone, User, Building2, Lock, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { apiPost } from '@/lib/api';

export function FirstSetupScreen() {
  const { setScreen, setUser, setClinicName, setClinicId, setToken } = useAppStore();
  const [adminName, setAdminName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [clinicNameInput, setClinicNameInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const handleNext = () => {
    if (step === 1) {
      if (!adminName.trim()) { setError('أدخل اسم المدير'); return; }
      if (adminPhone.length !== 9) { setError('رقم الهاتف يجب أن يكون 9 أرقام'); return; }
      setError('');
      setStep(2);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!clinicNameInput.trim()) { setError('أدخل اسم العيادة'); return; }
    if (password.length < 4) { setError('كلمة المرور يجب أن تكون 4 أحرف على الأقل'); return; }
    if (password !== confirmPassword) { setError('كلمتا المرور غير متطابقتين'); return; }

    setLoading(true);
    try {
      const data = await apiPost('/api/setup', {
        adminName: adminName.trim(),
        adminPhone,
        clinicName: clinicNameInput.trim(),
        password,
      });

      setClinicName(clinicNameInput.trim());
      setUser(data.user);
      setToken(data.token);
      if (data.clinic?.id) setClinicId(data.clinic.id);

      if (data.recoveryCode) {
        toast.success(`كود الاسترداد: ${data.recoveryCode} - احفظه في مكان آمن`, { duration: 10000 });
      }

      setScreen('admin-dashboard');
      toast.success('تم إعداد العيادة بنجاح!');
    } catch (err: any) {
      setError(err.message || 'خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-clinic-50 via-white to-clinic-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="flex flex-col items-center pt-10 pb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-clinic-500 to-clinic-600 rounded-2xl flex items-center justify-center shadow-xl overflow-hidden">
          <Heart className="w-9 h-9 text-white" fill="currentColor" />
        </div>
        <h1 className="text-lg font-bold mt-3 text-clinic-800 dark:text-clinic-300">إعداد العيادة لأول مرة</h1>
        <p className="text-sm text-muted-foreground mt-1">يجب إعداد العيادة قبل البدء</p>
        
        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-4">
          <div className={`w-8 h-1.5 rounded-full transition-all ${step >= 1 ? 'bg-clinic-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
          <div className={`w-8 h-1.5 rounded-full transition-all ${step >= 2 ? 'bg-clinic-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 pb-8">
        {/* Go to login button */}
        <button
          onClick={() => useAppStore.getState().setScreen('login')}
          className="w-full p-2 mb-2 text-center text-sm text-muted-foreground hover:text-clinic-600 transition-colors"
        >
          لديك حساب بالفعل؟ تسجيل الدخول
        </button>

        {step === 1 ? (
          <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">اسم المدير</label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><User className="w-5 h-5" /></div>
                <input type="text" value={adminName} onChange={(e) => { setAdminName(e.target.value); setError(''); }} placeholder="أدخل اسمك الكامل"
                  className="w-full h-12 pr-10 pl-4 bg-white dark:bg-gray-800 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-clinic-500 transition-all" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">رقم الهاتف</label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Phone className="w-5 h-5" /></div>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">967+</div>
                <input type="tel" value={adminPhone} onChange={(e) => { setAdminPhone(e.target.value.replace(/\D/g, '').slice(0, 9)); setError(''); }} placeholder="7XXXXXXXX"
                  className="w-full h-12 pr-10 pl-14 bg-white dark:bg-gray-800 border border-border rounded-xl text-base font-mono focus:outline-none focus:ring-2 focus:ring-clinic-500 transition-all" dir="ltr" inputMode="numeric" />
              </div>
            </div>
            {error && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
              </motion.div>
            )}
            <button onClick={handleNext} className="w-full h-12 bg-gradient-to-l from-clinic-600 to-clinic-700 text-white font-bold rounded-xl shadow-lg shadow-clinic-200 dark:shadow-clinic-900/40 active:scale-[0.98] transition-all">
              التالي
            </button>
          </motion.div>
        ) : (
          <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">اسم العيادة</label>
                <div className="relative">
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Building2 className="w-5 h-5" /></div>
                  <input type="text" value={clinicNameInput} onChange={(e) => { setClinicNameInput(e.target.value); setError(''); }} placeholder="مثال: عيادة الأمل للإسعافات"
                    className="w-full h-12 pr-10 pl-4 bg-white dark:bg-gray-800 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-clinic-500 transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">كلمة المرور</label>
                <div className="relative">
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Lock className="w-5 h-5" /></div>
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} placeholder="أدخل كلمة المرور"
                    className="w-full h-12 pr-10 pl-10 bg-white dark:bg-gray-800 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-clinic-500 transition-all" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">تأكيد كلمة المرور</label>
                <div className="relative">
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Lock className="w-5 h-5" /></div>
                  <input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }} placeholder="أعد إدخال كلمة المرور"
                    className="w-full h-12 pr-10 pl-4 bg-white dark:bg-gray-800 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-clinic-500 transition-all" />
                </div>
              </div>
              {error && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
                </motion.div>
              )}
              <button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-l from-clinic-600 to-clinic-700 text-white font-bold rounded-xl shadow-lg shadow-clinic-200 dark:shadow-clinic-900/40 disabled:opacity-60 active:scale-[0.98] transition-all">
                {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'إنشاء العيادة'}
              </button>
              <button type="button" onClick={() => { setStep(1); setError(''); }} className="w-full h-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <ArrowLeft className="w-4 h-4" /> رجوع
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}
