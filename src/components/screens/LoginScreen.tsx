'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

const LoginScreen = React.memo(function LoginScreen() {
  const { setUser, setScreen } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Load saved email
  useEffect(() => {
    const saved = localStorage.getItem('clinic-remember-email');
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    } else {
      setEmail('admin@clinic.com');
    }
    const savedPass = localStorage.getItem('clinic-remember-pass');
    if (savedPass) {
      setPassword(savedPass);
    } else {
      setPassword('admin123');
    }
  }, []);

  const handleLogin = async () => {
    if (!email || !password) { setError('يرجى إدخال البريد وكلمة المرور'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setUser(data.user);
      setScreen(data.user.role === 'admin' ? 'admin-dashboard' : 'nurse-dashboard');
      toast.success(`مرحباً ${data.user.name}`);

      // Save email if remember me
      if (rememberMe) {
        localStorage.setItem('clinic-remember-email', email);
        localStorage.setItem('clinic-remember-pass', password);
      } else {
        localStorage.removeItem('clinic-remember-email');
        localStorage.removeItem('clinic-remember-pass');
      }
    } catch {
      setError('خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

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
                <Label className="text-xs font-semibold">البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@clinic.com"
                  className="h-12 rounded-xl bg-white/50 dark:bg-gray-700/50"
                  dir="ltr"
                />
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
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-muted-foreground text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs text-muted-foreground">تذكرني</span>
              </label>
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
              <div className="flex justify-between items-center cursor-pointer touch-feedback p-2 rounded-xl hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors" onClick={() => { setEmail('admin@clinic.com'); setPassword('admin123'); }}>
                <span>المدير: admin@clinic.com</span>
                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600">مدير</Badge>
              </div>
              <div className="flex justify-between items-center cursor-pointer touch-feedback p-2 rounded-xl hover:bg-teal-50/50 dark:hover:bg-teal-900/10 transition-colors" onClick={() => { setEmail('noura@clinic.com'); setPassword('nurse123'); }}>
                <span>الممرضة: noura@clinic.com</span>
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
