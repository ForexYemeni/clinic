'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Moon, Sun, Lock, LogOut, Shield, Info, ChevronLeft, AlertTriangle, Download, Smartphone } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function SettingsScreen() {
  const { user, theme, toggleTheme, clinicName, setClinicName, logout } = useAppStore();
  const [editingName, setEditingName] = useState(false);
  const [newClinicName, setNewClinicName] = useState(clinicName);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', newPassword: '', confirm: '' });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  // PWA install support
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast.success('تم تثبيت التطبيق بنجاح!');
    });
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
    } catch {
      toast.error('خطأ في تثبيت التطبيق');
    }
    setDeferredPrompt(null);
    setInstalling(false);
  };

  const handleSaveName = async () => {
    if (!newClinicName.trim()) return;
    try {
      const res = await fetch('/api/clinic', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClinicName.trim() }),
      });
      if (res.ok) {
        setClinicName(newClinicName.trim());
        setEditingName(false);
        toast.success('تم تحديث اسم العيادة');
      } else {
        toast.error('خطأ في تحديث اسم العيادة');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    }
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword.length < 4) { toast.error('كلمة المرور يجب أن تكون 4 أحرف على الأقل'); return; }
    if (passwords.newPassword !== passwords.confirm) { toast.error('كلمتا المرور غير متطابقتين'); return; }
    try {
      const res = await fetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwords.newPassword }),
      });
      if (res.ok) {
        toast.success('تم تغيير كلمة المرور');
        setChangingPassword(false);
        setPasswords({ current: '', newPassword: '', confirm: '' });
      } else {
        toast.error('خطأ في تغيير كلمة المرور');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
  };

  return (
    <div className="p-4 pb-24">
      <h2 className="text-lg font-bold mb-4">الإعدادات</h2>

      {/* Clinic Name */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-border mb-3 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-clinic-100 dark:bg-clinic-900/30 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-clinic-600 dark:text-clinic-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">اسم العيادة</p>
              {editingName ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={newClinicName}
                    onChange={(e) => setNewClinicName(e.target.value)}
                    className="h-8 px-2 text-sm bg-gray-50 dark:bg-gray-700 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-clinic-500"
                  />
                  <button onClick={handleSaveName} className="text-xs text-clinic-600 font-medium">حفظ</button>
                  <button onClick={() => setEditingName(false)} className="text-xs text-muted-foreground">إلغاء</button>
                </div>
              ) : (
                <p className="text-sm font-medium">{clinicName}</p>
              )}
            </div>
          </div>
          {!editingName && (
            <button onClick={() => setEditingName(true)} className="text-xs text-clinic-600 font-medium px-2 py-1 bg-clinic-50 dark:bg-clinic-900/20 rounded-lg">تعديل</button>
          )}
        </div>
      </motion.div>

      {/* Theme */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-border mb-3 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              {theme === 'light' ? <Moon className="w-5 h-5 text-purple-600" /> : <Sun className="w-5 h-5 text-yellow-500" />}
            </div>
            <div>
              <p className="text-sm font-medium">المظهر</p>
              <p className="text-xs text-muted-foreground">{theme === 'light' ? 'فاتح' : 'داكن'}</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs font-medium active:scale-[0.97] transition-transform"
          >
            {theme === 'light' ? 'الوضع الداكن' : 'الوضع الفاتح'}
          </button>
        </div>
      </motion.div>

      {/* Change Password */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-border mb-3 shadow-sm"
      >
        {changingPassword ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" /> تغيير كلمة المرور
            </h3>
            <input
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
              placeholder="كلمة المرور الجديدة"
              className="w-full h-10 px-3 bg-gray-50 dark:bg-gray-700 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500"
            />
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords(p => ({ ...p, confirm: e.target.value }))}
              placeholder="تأكيد كلمة المرور"
              className="w-full h-10 px-3 bg-gray-50 dark:bg-gray-700 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500"
            />
            <div className="flex gap-2">
              <button onClick={handleChangePassword} className="flex-1 h-10 bg-clinic-600 text-white rounded-xl text-sm font-medium">حفظ</button>
              <button onClick={() => setChangingPassword(false)} className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl text-sm font-medium">إلغاء</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setChangingPassword(true)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">تغيير كلمة المرور</p>
                <p className="text-[10px] text-muted-foreground">تحديث كلمة المرور الخاصة بك</p>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </motion.div>

      {/* Install App Card */}
      {!isInstalled && deferredPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800/50 mb-3 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/25">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-right">
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">تثبيت التطبيق</p>
              <p className="text-[11px] text-muted-foreground">أضف التطبيق إلى شاشتك الرئيسية للوصول السريع</p>
            </div>
          </div>
          <button
            onClick={handleInstallApp}
            disabled={installing}
            className="w-full h-11 bg-gradient-to-l from-green-500 to-emerald-600 text-white rounded-xl text-sm font-bold shadow-md shadow-green-500/25 active:scale-[0.97] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            {installing ? 'جاري التثبيت...' : 'تثبيت التطبيق'}
          </button>
        </motion.div>
      )}

      {/* Already installed badge */}
      {isInstalled && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-3 border border-green-200 dark:border-green-800/50 mb-3 flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-green-700 dark:text-green-400">التطبيق مثبت</p>
            <p className="text-[10px] text-muted-foreground">التطبيق يعمل كتطبيق أصلي</p>
          </div>
        </motion.div>
      )}

      {/* Logout - Professional Danger Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <AnimatePresence mode="wait">
          {showLogoutConfirm ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 shadow-lg shadow-red-500/20 mb-3"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">تأكيد تسجيل الخروج</p>
                  <p className="text-[10px] text-white/80">سيتم تسجيل خروجك من الحساب الحالي</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={confirmLogout}
                  className="flex-1 h-10 bg-white text-red-600 rounded-xl text-sm font-bold active:scale-[0.97] transition-transform shadow-sm"
                >
                  نعم، تسجيل الخروج
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 h-10 bg-white/20 text-white rounded-xl text-sm font-medium backdrop-blur-sm active:scale-[0.97] transition-transform"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleLogout}
              className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 border border-red-200 dark:border-red-900/50 flex items-center gap-3 mb-3 active:scale-[0.98] transition-transform shadow-sm"
            >
              <div className="w-11 h-11 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 text-right">
                <p className="text-sm font-bold text-red-600 dark:text-red-400">تسجيل الخروج</p>
                <p className="text-[10px] text-muted-foreground">الخروج من حسابك الحالي</p>
              </div>
              <ChevronLeft className="w-4 h-4 text-red-400" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* App Info */}
      <div className="mt-6 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
          <Shield className="w-3 h-3 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground">{clinicName} v3.0</p>
        </div>
      </div>
    </div>
  );
}
