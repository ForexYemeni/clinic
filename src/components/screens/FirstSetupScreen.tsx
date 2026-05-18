'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, AlertCircle, Eye, EyeOff, Phone, Building, User, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

const FirstSetupScreen = React.memo(function FirstSetupScreen() {
  const { setUser, setScreen, setIsFirstSetup, setClinicName } = useAppStore();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    adminName: '',
    phone: '',
    clinicName: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = 2;

  const validateStep1 = () => {
    if (!form.adminName.trim()) {
      setError('يرجى إدخال اسم المدير');
      return false;
    }
    const phoneClean = form.phone.replace(/\D/g, '');
    if (phoneClean.length !== 9) {
      setError('رقم الهاتف يجب أن يكون 9 أرقام');
      return false;
    }
    if (!form.clinicName.trim()) {
      setError('يرجى إدخال اسم العيادة');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (form.password.length < 4) {
      setError('كلمة المرور يجب أن تكون 4 أحرف على الأقل');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError('كلمة المرور غير متطابقة');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSetup = async () => {
    setError('');
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const phoneClean = form.phone.replace(/\D/g, '');
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminName: form.adminName,
          phone: phoneClean,
          clinicName: form.clinicName,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setUser(data.user);
      setClinicName(data.clinicName);
      setIsFirstSetup(data.isFirstSetup !== undefined ? data.isFirstSetup : true);
      toast.success('تم إعداد النظام بنجاح');
      setScreen('admin-dashboard');
    } catch {
      setError('خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-br from-emerald-600/10 to-teal-600/10 dark:from-emerald-600/5 dark:to-teal-600/5 rounded-b-[40px]" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 relative z-10">
        <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 mx-auto mb-3">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-center text-foreground">إعداد النظام</h1>
          <p className="text-muted-foreground text-center text-sm mt-1">الخطوة الأولى لبدء الاستخدام</p>
        </motion.div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <React.Fragment key={i}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                i + 1 <= step ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {i + 1}
              </div>
              {i < totalSteps - 1 && (
                <div className={`w-12 h-1 rounded-full transition-all duration-300 ${
                  i + 1 < step ? 'bg-emerald-500' : 'bg-muted'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ x: step === 1 ? -20 : 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm"
        >
          <Card className="border-0 shadow-xl shadow-emerald-900/5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
            <CardContent className="p-6 space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-xl flex items-center gap-2 border border-red-200/50 dark:border-red-800/50"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}

              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> اسم المدير *
                    </Label>
                    <Input
                      value={form.adminName}
                      onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                      className="h-12 rounded-xl bg-white/50 dark:bg-gray-700/50"
                      placeholder="أدخل اسمك الكامل"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> رقم الهاتف *
                    </Label>
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 9) setForm({ ...form, phone: val });
                      }}
                      className="h-12 rounded-xl bg-white/50 dark:bg-gray-700/50"
                      placeholder="050000000"
                      dir="ltr"
                      maxLength={9}
                    />
                    <p className="text-[10px] text-muted-foreground">9 أرقام بدون رمز الدولة</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5" /> اسم العيادة *
                    </Label>
                    <Input
                      value={form.clinicName}
                      onChange={(e) => setForm({ ...form, clinicName: e.target.value })}
                      className="h-12 rounded-xl bg-white/50 dark:bg-gray-700/50"
                      placeholder="عيادة الإسعافات الأولية"
                    />
                  </div>
                  <Button
                    onClick={handleNext}
                    className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
                  >
                    التالي
                  </Button>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl mb-2">
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                      المدير: {form.adminName} | العيادة: {form.clinicName}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">كلمة المرور الجديدة *</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="h-12 rounded-xl bg-white/50 dark:bg-gray-700/50 pl-10"
                        dir="ltr"
                        placeholder="أدخل كلمة المرور"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground touch-feedback"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">تأكيد كلمة المرور *</Label>
                    <Input
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      className="h-12 rounded-xl bg-white/50 dark:bg-gray-700/50"
                      dir="ltr"
                      placeholder="أعد إدخال كلمة المرور"
                      onKeyDown={(e) => e.key === 'Enter' && handleSetup()}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => { setStep(1); setError(''); }}
                      className="flex-1 h-12 rounded-xl font-semibold"
                    >
                      رجوع
                    </Button>
                    <Button
                      onClick={handleSetup}
                      disabled={loading}
                      className="flex-1 h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          جاري الإعداد...
                        </div>
                      ) : 'إعداد النظام'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
});

export { FirstSetupScreen };
