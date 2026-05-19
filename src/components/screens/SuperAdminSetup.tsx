'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Phone, Lock, Eye, EyeOff, AlertCircle, Heart, Building2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { apiPost } from '@/lib/api';

export function SuperAdminSetup() {
  const { setScreen, setUser, setClinicId, setToken, setIsFirstSetup } = useAppStore();
  const [step, setStep] = useState(1); // 1: admin info, 2: clinic info
  const [adminName, setAdminName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [clinicName, setClinicName] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStep1 = () => {
    if (!adminName || !adminPhone || !adminPassword) {
      setError('يرجى ملء جميع الحقول');
      return;
    }
    if (adminPhone.length !== 9) {
      setError('رقم الهاتف يجب أن يكون 9 أرقام');
      return;
    }
    if (adminPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicName) {
      setError('يرجى إدخال اسم العيادة');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await apiPost('/api/platform/setup', {
        superAdminName: adminName,
        superAdminPhone: adminPhone,
        superAdminPassword: adminPassword,
        clinicName,
        clinicPhone: clinicPhone || adminPhone,
      });

      setUser(data.user);
      setToken(data.token);
      if (data.clinic?.id) setClinicId(data.clinic.id);
      setIsFirstSetup(false);

      toast.success('تم إعداد المنصة بنجاح!');

      if (data.recoveryCode) {
        toast.success(`كود الاسترداد: ${data.recoveryCode} - احفظه في مكان آمن`, { duration: 10000 });
      }

      setScreen('super-admin-dashboard');
    } catch (err: any) {
      setError(err.message || 'خطأ في الإعداد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center pt-12 pb-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-700 rounded-3xl flex items-center justify-center shadow-xl shadow-purple-200 dark:shadow-purple-900/40"
        >
          <Shield className="w-12 h-12 text-white" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-bold mt-4 text-purple-800 dark:text-purple-300"
        >
          إعداد المنصة
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-muted-foreground mt-1"
        >
          إنشاء حساب الإدارة الرئيسية
        </motion.p>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mt-4">
          <div className={`w-8 h-1.5 rounded-full ${step >= 1 ? 'bg-purple-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
          <div className={`w-8 h-1.5 rounded-full ${step >= 2 ? 'bg-purple-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
        </div>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex-1 px-6 pb-8"
      >
        {step === 1 ? (
          <form onSubmit={(e) => { e.preventDefault(); handleStep1(); }} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">اسم مدير المنصة</label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => { setAdminName(e.target.value); setError(''); }}
                placeholder="الاسم الكامل"
                className="w-full h-12 px-4 bg-white dark:bg-gray-800 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">رقم الهاتف</label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">967+</div>
                <input
                  type="tel"
                  value={adminPhone}
                  onChange={(e) => { setAdminPhone(e.target.value.replace(/\D/g, '').slice(0, 9)); setError(''); }}
                  placeholder="7XXXXXXXX"
                  className="w-full h-12 pr-10 pl-14 bg-white dark:bg-gray-800 border border-border rounded-xl text-base font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  dir="ltr"
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">كلمة المرور</label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => { setAdminPassword(e.target.value); setError(''); }}
                  placeholder="6 أحرف على الأقل"
                  className="w-full h-12 pr-10 pl-10 bg-white dark:bg-gray-800 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <button type="submit" className="w-full h-12 bg-gradient-to-l from-purple-600 to-purple-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-60 active:scale-[0.98] transition-all">
              التالي
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-bold text-purple-800 dark:text-purple-300">معلومات العيادة الأولى</span>
              </div>
              <p className="text-xs text-muted-foreground">سيتم إنشاء عيادتك الاولى بفترة تجريبية 30 يوم</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">اسم العيادة</label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => { setClinicName(e.target.value); setError(''); }}
                placeholder="اسم العيادة"
                className="w-full h-12 px-4 bg-white dark:bg-gray-800 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">رقم هاتف العيادة (اختياري)</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">967+</div>
                <input
                  type="tel"
                  value={clinicPhone}
                  onChange={(e) => setClinicPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  placeholder={adminPhone}
                  className="w-full h-12 px-4 pl-14 bg-white dark:bg-gray-800 border border-border rounded-xl text-base font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  dir="ltr"
                  inputMode="numeric"
                />
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="h-12 px-6 bg-gray-100 dark:bg-gray-800 text-foreground rounded-xl font-bold">
                رجوع
              </button>
              <button type="submit" disabled={loading} className="flex-1 h-12 bg-gradient-to-l from-purple-600 to-purple-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-60 active:scale-[0.98] transition-all">
                {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'إنشاء المنصة'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
