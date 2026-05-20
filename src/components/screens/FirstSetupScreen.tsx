'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Phone, User, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

export function FirstSetupScreen() {
  const { setScreen, setUser, setClinicName } = useAppStore();
  const [adminName, setAdminName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const handleNext = () => {
    if (step === 1) {
      if (!adminName.trim()) { setError('أدخل اسم مدير النظام'); return; }
      if (adminPhone.length !== 9) { setError('رقم الهاتف يجب أن يكون 9 أرقام'); return; }
      setError('');
      setStep(2);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 4) {
      setError('كلمة المرور يجب أن تكون 4 أحرف على الأقل');
      return;
    }
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminName: adminName.trim(),
          adminPhone,
          password,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'خطأ في الإعداد');
        return;
      }

      setClinicName('الإدارة الرئيسية');
      setUser(data.user);
      setScreen('super-dashboard');
      toast.success('تم إعداد النظام بنجاح! يمكنك الآن إضافة العيادات');
    } catch {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950">
      {/* Header */}
      <div className="flex flex-col items-center pt-10 pb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
          <Shield className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-lg font-bold mt-3 text-purple-800 dark:text-purple-300">إعداد النظام لأول مرة</h1>
        <p className="text-sm text-muted-foreground mt-1">إنشاء حساب المدير الرئيسي</p>
        
        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-4">
          <div className={`w-8 h-1.5 rounded-full transition-all ${step >= 1 ? 'bg-purple-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
          <div className={`w-8 h-1.5 rounded-full transition-all ${step >= 2 ? 'bg-purple-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 pb-8">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">اسم مدير النظام</label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => { setAdminName(e.target.value); setError(''); }}
                  placeholder="أدخل اسمك الكامل"
                  className="w-full h-12 pr-10 pl-4 bg-white dark:bg-gray-800 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">رقم الهاتف</label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">
                  967+
                </div>
                <input
                  type="tel"
                  value={adminPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                    setAdminPhone(val);
                    setError('');
                  }}
                  placeholder="7XXXXXXXX"
                  className="w-full h-12 pr-10 pl-14 bg-white dark:bg-gray-800 border border-border rounded-xl text-base font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  dir="ltr"
                  inputMode="numeric"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-xl"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              onClick={handleNext}
              className="w-full h-12 bg-gradient-to-l from-purple-600 to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-purple-200 dark:shadow-purple-900/40 active:scale-[0.98] transition-all"
            >
              التالي
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
          >
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">كلمة المرور</label>
                <div className="relative">
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="أدخل كلمة المرور"
                    className="w-full h-12 pr-10 pl-10 bg-white dark:bg-gray-800 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">تأكيد كلمة المرور</label>
                <div className="relative">
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                    placeholder="أعد إدخال كلمة المرور"
                    className="w-full h-12 pr-10 pl-4 bg-white dark:bg-gray-800 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-xl"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-l from-purple-600 to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-purple-200 dark:shadow-purple-900/40 disabled:opacity-60 active:scale-[0.98] transition-all"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : (
                  'إنشاء حساب المدير الرئيسي'
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setError(''); }}
                className="w-full h-10 flex items-center justify-center gap-2 text-sm text-muted-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                رجوع
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}
