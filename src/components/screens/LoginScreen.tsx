'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, AlertCircle, Eye, EyeOff, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

const LoginScreen = React.memo(function LoginScreen() {
  const { setUser, setScreen, setIsFirstSetup, setClinicName } = useAppStore();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingSetup, setCheckingSetup] = useState(true);

  // Check setup status and load saved credentials
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await fetch('/api/clinic');
        const data = await res.json();
        setIsFirstSetup(data.isFirstSetup);
        setClinicName(data.name);
        if (!data.isFirstSetup) {
          setScreen('admin-setup');
          return;
        }
      } catch {
        // Default to login
      }
      setCheckingSetup(false);
    };

    // Load saved phone
    const savedPhone = localStorage.getItem('clinic-remember-phone');
    if (savedPhone) {
      setPhone(savedPhone);
    } else {
      setPhone('050000000');
    }
    const savedPass = localStorage.getItem('clinic-remember-pass');
    if (savedPass) {
      setPassword(savedPass);
    } else {
      setPassword('admin123');
    }

    checkSetup();
  }, [setIsFirstSetup, setClinicName, setScreen]);

  const handleLogin = async () => {
    // Validate phone
    const phoneClean = phone.replace(/\D/g, '');
    if (phoneClean.length !== 9) {
      setError('رقم الهاتف يجب أن يكون 9 أرقام');
      return;
    }
    if (!password) {
      setError('يرجى إدخال كلمة المرور');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneClean, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setUser(data.user);
      if (data.clinicName) setClinicName(data.clinicName);
      if (data.isFirstSetup !== undefined) setIsFirstSetup(data.isFirstSetup);
      setScreen(data.user.role === 'admin' ? 'admin-dashboard' : 'nurse-dashboard');
      toast.success(`مرحباً ${data.user.name}`);

      // Save phone if remember
      localStorage.setItem('clinic-remember-phone', phoneClean);
      localStorage.setItem('clinic-remember-pass', password);
    } catch {
      setError('خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-br from-emerald-600/10 to-teal-600/10 dark:from-emerald-600/5 dark:to-teal-600/5 rounded-b-[40px]" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 relative z-10">
        <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-8">
          {/* Animated medical cross */}
          <div className="relative mb-4">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
              className="absolute inset-0 w-20 h-20 mx-auto"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-3 bg-emerald-300/50 rounded-full" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-3 bg-emerald-300/50 rounded-full" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-1 bg-emerald-300/50 rounded-full" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-1 bg-emerald-300/50 rounded-full" />
            </motion.div>
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 mx-auto relative">
              <Heart className="w-10 h-10 text-white" fill="currentColor" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-foreground">عيادة الإسعافات الأولية</h1>
          <p className="text-muted-foreground text-center text-sm mt-1">تسجيل الدخول للمتابعة</p>
        </motion.div>

        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="w-full max-w-sm">
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
              <div className="space-y-2">
                <Label className="text-xs font-semibold">رقم الهاتف</Label>
                <div className="relative">
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 9) setPhone(val);
                    }}
                    placeholder="050000000"
                    className="h-12 rounded-xl bg-white/50 dark:bg-gray-700/50 pr-10"
                    dir="ltr"
                    maxLength={9}
                  />
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-[10px] text-muted-foreground">9 أرقام بدون رمز الدولة</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">كلمة المرور</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 rounded-xl bg-white/50 dark:bg-gray-700/50 pl-10"
                    dir="ltr"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
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
              <Button
                onClick={handleLogin}
                disabled={loading}
                className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25 transition-all duration-300"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    جاري الدخول...
                  </div>
                ) : 'تسجيل الدخول'}
              </Button>
            </CardContent>
          </Card>

          <div className="mt-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur rounded-2xl p-4 border border-white/30 dark:border-gray-700/30">
            <p className="text-xs text-muted-foreground mb-2 font-semibold">حسابات تجريبية:</p>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between items-center cursor-pointer touch-feedback p-2 rounded-xl hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors" onClick={() => { setPhone('050000000'); setPassword('admin123'); }}>
                <span>المدير: 050000000</span>
                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600">مدير</Badge>
              </div>
              <div className="flex justify-between items-center cursor-pointer touch-feedback p-2 rounded-xl hover:bg-teal-50/50 dark:hover:bg-teal-900/10 transition-colors" onClick={() => { setPhone('050000001'); setPassword('nurse123'); }}>
                <span>الممرضة: 050000001</span>
                <Badge variant="outline" className="text-[10px] border-teal-500/30 text-teal-600">ممرض</Badge>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
});

export { LoginScreen };
