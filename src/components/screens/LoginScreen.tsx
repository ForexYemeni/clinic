'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Phone, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

export function LoginScreen() {
  const { setScreen, setUser, setIsFirstSetup, clinicName } = useAppStore();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.setupNeeded) {
          setIsFirstSetup(true);
          setScreen('admin-setup');
          return;
        }
        setError(data.error || 'خطأ في تسجيل الدخول');
        return;
      }

      setUser(data.user);
      // Fetch and update clinic settings on login
      try {
        const cRes = await fetch('/api/clinic');
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

      if (data.user.role === 'admin') {
        setScreen('admin-dashboard');
      } else {
        setScreen('nurse-patients');
      }
      toast.success(`مرحباً ${data.user.name}`);
    } catch {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950">
      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center pt-12 pb-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-200 dark:shadow-emerald-900/40"
        >
          <Heart className="w-12 h-12 text-white" fill="currentColor" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-bold mt-4 text-emerald-800 dark:text-emerald-300"
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
                className="w-full h-12 pr-10 pl-14 bg-white dark:bg-gray-800 border border-border rounded-xl text-base font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
                className="w-full h-12 pr-10 pl-10 bg-white dark:bg-gray-800 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-gradient-to-l from-emerald-600 to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40 disabled:opacity-60 active:scale-[0.98] transition-all"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            ) : (
              'تسجيل الدخول'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          لأول مرة؟ سيتم إنشاء حساب الإدارة تلقائياً
        </p>
      </motion.div>
    </div>
  );
}
