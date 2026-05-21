'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Phone, Lock, Eye, EyeOff, AlertCircle, AlertTriangle, Clock, Shield, MessageCircle, X, ArrowRight, Stethoscope, Activity, Droplets, Thermometer, Pill } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

interface PlatformContact {
  supportPhone: string;
  supportWhatsApp: string;
}

interface SubscriptionErrorInfo {
  subscriptionExpired: boolean;
  subscriptionStatus: string;
  subscriptionEndDate: string;
  clinicName: string;
}

// Timeout wrapper for fetch - prevents hanging requests
function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timeoutId);
  });
}

export function LoginScreen() {
  const { setScreen, setUser, setIsFirstSetup, clinicName, clinicSettings, setClinicId, setToken, setSubscription } = useAppStore();
  const logo = clinicSettings.logo;
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Subscription error state
  const [subError, setSubError] = useState<SubscriptionErrorInfo | null>(null);
  const [contact, setContact] = useState<PlatformContact | null>(null);
  const [showCallCard, setShowCallCard] = useState(false);

  // On mount, check localStorage for saved phone and rememberMe preference
  useEffect(() => {
    try {
      const savedPhone = localStorage.getItem('clinic-remember-phone');
      const savedRemember = localStorage.getItem('clinic-remember-me');
      if (savedRemember === 'true' && savedPhone) {
        setPhone(savedPhone);
        setRememberMe(true);
      }
    } catch {}
  }, []);

  // Fetch platform contact info
  useEffect(() => {
    const fetchContact = async () => {
      try {
        const res = await fetchWithTimeout('/api/platform', {}, 5000);
        if (res.ok) {
          const data = await res.json();
          setContact({
            supportPhone: data.supportPhone || '',
            supportWhatsApp: data.supportWhatsApp || '',
          });
        }
      } catch {}
    };
    fetchContact();
  }, []);

  const supportPhone = contact?.supportPhone || '';
  const supportWhatsApp = contact?.supportWhatsApp || contact?.supportPhone || '';
  const hasPhone = supportPhone.length > 0;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (phone.length !== 9) {
      setError('رقم الهاتف يجب أن يكون 9 أرقام');
      return;
    }
    if (!password) {
      setError('أدخل كلمة المرور');
      return;
    }

    // Save or remove phone based on rememberMe
    try {
      if (rememberMe) {
        localStorage.setItem('clinic-remember-phone', phone);
        localStorage.setItem('clinic-remember-me', 'true');
      } else {
        localStorage.removeItem('clinic-remember-phone');
        localStorage.removeItem('clinic-remember-me');
      }
    } catch {}

    setLoading(true);
    try {
      const res = await fetchWithTimeout('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      }, 10000);

      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error('خطأ في الاتصال بالخادم');
      }

      if (!res.ok) {
        if (res.status === 503 && data?.dbDown) {
          throw new Error('قاعدة البيانات غير متاحة حالياً. يرجى المحاولة بعد قليل.');
        }
        if (res.status === 403 && data?.subscriptionExpired) {
          setSubError({
            subscriptionExpired: data.subscriptionExpired,
            subscriptionStatus: data.subscriptionStatus || 'expired',
            subscriptionEndDate: data.subscriptionEndDate || '',
            clinicName: data.clinicName || clinicName,
          });
          setLoading(false);
          return;
        }
        throw new Error(data?.error || 'خطأ في تسجيل الدخول');
      }

      // Success - set user data
      setUser(data.user);
      setToken(data.token);
      if (data.clinic?.id) setClinicId(data.clinic.id);

      if (data.subscription) {
        setSubscription(data.subscription);
      }

      try {
        const cRes = await fetchWithTimeout('/api/clinic', {
          headers: { 'Authorization': `Bearer ${data.token}` },
        }, 5000);
        if (cRes.ok) {
          const cData = await cRes.json();
          useAppStore.getState().setClinicSettings({
            name: cData.name || 'عيادتي',
            description: cData.description || '',
            phone: cData.phone || '',
            address: cData.address || '',
            logo: cData.logo || '',
            primaryColor: cData.primaryColor || 'emerald',
          });
        }
      } catch {}

      // Route based on role and subscription
      if (data.user.role === 'super_admin') {
        setScreen('super-admin-dashboard');
      } else if (data.subscriptionExpired) {
        setScreen('subscription-expired');
      } else if (!data.subscription?.valid) {
        setScreen('subscription-expired');
      } else if (data.user.role === 'admin') {
        setScreen('admin-dashboard');
      } else {
        setScreen('nurse-dashboard');
      }

      toast.success(`مرحباً ${data.user.name}`);
    } catch (err: any) {
      setError(err.message || 'خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  // If subscription error is shown, display the professional card overlay
  if (subError) {
    const isSuspended = subError.subscriptionStatus === 'suspended';

    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="flex-1 flex flex-col items-center justify-center pt-12 pb-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-3xl flex items-center justify-center shadow-xl shadow-red-200 dark:shadow-red-900/40 mb-6"
          >
            {isSuspended ? (
              <AlertTriangle className="w-12 h-12 text-white" />
            ) : (
              <Clock className="w-12 h-12 text-white" />
            )}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-foreground mb-2"
          >
            {isSuspended ? 'الحساب موقوف' : 'انتهى الاشتراك'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-muted-foreground max-w-xs text-center"
          >
            {isSuspended
              ? `حساب عيادة "${subError.clinicName}" موقوف حالياً. تواصل مع إدارة المنصة لإعادة التفعيل.`
              : `انتهت فترة اشتراك عيادة "${subError.clinicName}". تواصل مع إدارة المنصة لتجديد الاشتراك.`}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="px-6 pb-4"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-bold">{subError.clinicName}</p>
                <p className="text-xs text-muted-foreground">
                  حالة الاشتراك: <span className="font-bold text-red-600">{isSuspended ? 'موقوف' : 'منتهي'}</span>
                </p>
              </div>
            </div>

            {subError.subscriptionEndDate && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>تاريخ الانتهاء</span>
                  <span className="font-mono">{new Date(subError.subscriptionEndDate).toLocaleDateString('ar-SA')}</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="px-6 pb-6"
        >
          <AnimatePresence>
            {showCallCard ? (
              <motion.div
                key="call-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 shadow-lg shadow-blue-500/20 relative"
              >
                <button
                  onClick={() => setShowCallCard(false)}
                  className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">تواصل مع إدارة المنصة</p>
                    <p className="text-[10px] text-white/80">للتجديد أو الاستفسار أو إعادة التفعيل</p>
                  </div>
                </div>

                {hasPhone ? (
                  <div className="space-y-2">
                    <a
                      href={`tel:+967${supportPhone}`}
                      className="flex items-center justify-center gap-2 h-11 bg-white text-blue-600 rounded-xl text-sm font-bold shadow-sm active:scale-[0.97] transition-transform"
                    >
                      <Phone className="w-4 h-4" />
                      اتصال: {supportPhone}
                    </a>

                    {supportWhatsApp && (
                      <a
                        href={`https://wa.me/967${supportWhatsApp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 h-11 bg-green-500 text-white rounded-xl text-sm font-bold shadow-sm active:scale-[0.97] transition-transform"
                      >
                        <MessageCircle className="w-4 h-4" />
                        واتساب
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="bg-white/20 rounded-xl p-3 text-center">
                    <p className="text-xs text-white/90">لم يتم إضافة رقم تواصل بعد</p>
                    <p className="text-[10px] text-white/70 mt-1">يرجى التواصل مع مشرف النظام</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.button
                key="contact-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCallCard(true)}
                className="w-full bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 text-center active:scale-[0.98] transition-transform border border-blue-200 dark:border-blue-800"
              >
                <Phone className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
                  للتجديد أو الاستفسار، تواصل مع إدارة المنصة
                </p>
                <p className="text-[10px] text-blue-500 dark:text-blue-400 mt-1">اضغط للتواصل</p>
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="px-6 pb-8">
          <button
            onClick={() => { setSubError(null); setShowCallCard(false); }}
            className="w-full h-12 bg-gray-100 dark:bg-gray-800 text-foreground font-bold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            العودة لتسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-clinic-50 via-white to-clinic-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 animate-gradient-bg" />

      {/* Floating medical icons decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [-10, 10, -10], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[15%] right-[10%] opacity-[0.04]"
        >
          <Heart className="w-16 h-16 text-clinic-600" />
        </motion.div>
        <motion.div
          animate={{ y: [10, -10, 10], rotate: [0, -5, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute top-[25%] left-[8%] opacity-[0.04]"
        >
          <Stethoscope className="w-14 h-14 text-clinic-600" />
        </motion.div>
        <motion.div
          animate={{ y: [-8, 12, -8], rotate: [0, 8, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-[35%] right-[5%] opacity-[0.04]"
        >
          <Activity className="w-12 h-12 text-clinic-600" />
        </motion.div>
        <motion.div
          animate={{ y: [12, -8, 12], rotate: [0, -3, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute top-[50%] left-[15%] opacity-[0.04]"
        >
          <Droplets className="w-10 h-10 text-clinic-600" />
        </motion.div>
        <motion.div
          animate={{ y: [-6, 8, -6], rotate: [0, 6, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute bottom-[25%] left-[12%] opacity-[0.04]"
        >
          <Thermometer className="w-11 h-11 text-clinic-600" />
        </motion.div>
        <motion.div
          animate={{ y: [8, -6, 8], rotate: [0, -7, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          className="absolute top-[70%] right-[18%] opacity-[0.04]"
        >
          <Pill className="w-10 h-10 text-clinic-600" />
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <div className="flex-1 flex flex-col items-center justify-center pt-12 pb-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="w-20 h-20 bg-gradient-to-br from-clinic-500 to-clinic-600 rounded-3xl flex items-center justify-center shadow-xl shadow-clinic-200 dark:shadow-clinic-900/40 overflow-hidden animate-pulse-slow"
          >
            {logo ? (
              <img src={logo} alt="شعار" className="w-12 h-12 object-contain" />
            ) : (
              <Heart className="w-12 h-12 text-white" fill="currentColor" />
            )}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-bold mt-4 text-clinic-800 dark:text-clinic-300"
          >
            {clinicName}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-muted-foreground mt-1"
          >
            تسجيل الدخول للمتابعة
          </motion.p>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex-1 px-6 pb-8"
        >
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Phone Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">رقم الهاتف</label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">
                  967+
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                    setPhone(val);
                    setError('');
                  }}
                  placeholder="7XXXXXXXX"
                  className="w-full h-12 pr-10 pl-14 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-border rounded-xl text-base font-mono focus:outline-none focus:ring-2 focus:ring-clinic-500 focus:border-transparent transition-all"
                  dir="ltr"
                  inputMode="numeric"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">كلمة المرور</label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="أدخل كلمة المرور"
                  className="w-full h-12 pr-10 pl-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-clinic-500 focus:border-transparent transition-all"
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

            {/* Remember Me */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  rememberMe
                    ? 'bg-clinic-600 border-clinic-600'
                    : 'bg-white dark:bg-gray-800 border-border'
                }`}
              >
                {rememberMe && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <label
                onClick={() => setRememberMe(!rememberMe)}
                className="text-sm text-muted-foreground cursor-pointer select-none"
              >
                تذكرني
              </label>
            </div>

            {/* Error */}
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

            {/* Login Button with shimmer */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-l from-clinic-600 to-clinic-700 text-white font-bold rounded-xl shadow-lg shadow-clinic-200 dark:shadow-clinic-900/40 disabled:opacity-60 active:scale-[0.98] transition-all relative overflow-hidden"
            >
              {loading && (
                <div className="absolute inset-0 animate-shimmer bg-gradient-to-l from-transparent via-white/20 to-transparent" />
              )}
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto relative z-10" />
              ) : (
                <span className="relative z-10">تسجيل الدخول</span>
              )}
            </button>
          </form>
        </motion.div>
      </div>

      {/* CSS animations */}
      <style jsx global>{`
        @keyframes gradient-bg {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-bg {
          background-size: 200% 200%;
          animation: gradient-bg 15s ease infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
