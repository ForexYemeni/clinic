'use client';

import React, { useState } from 'react';
import { ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

export function NurseChangePassword() {
  const { user, setScreen } = useAppStore();
  const [passwords, setPasswords] = useState({ newPassword: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword.length < 4) { toast.error('كلمة المرور يجب أن تكون 4 أحرف على الأقل'); return; }
    if (passwords.newPassword !== passwords.confirm) { toast.error('كلمتا المرور غير متطابقتين'); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwords.newPassword }),
      });
      if (res.ok) {
        toast.success('تم تغيير كلمة المرور');
        setScreen('nurse-patients');
      } else {
        toast.error('خطأ في تغيير كلمة المرور');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    } finally { setLoading(false); }
  };

  return (
    <div className="p-4 pb-24">
      <button onClick={() => setScreen('nurse-patients')} className="flex items-center gap-2 mb-4 px-3 py-2 bg-white dark:bg-gray-800 rounded-xl border border-border shadow-sm active:scale-[0.97] transition-all">
        <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <ArrowRight className="w-4 h-4 text-foreground" />
        </div>
        <span className="text-sm font-medium">رجوع</span>
      </button>

      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Lock className="w-5 h-5 text-amber-500" />
        تغيير كلمة المرور
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">كلمة المرور الجديدة</label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showPass ? 'text' : 'password'}
              value={passwords.newPassword}
              onChange={(e) => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
              placeholder="كلمة المرور الجديدة"
              className="w-full h-11 pr-10 pl-10 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500"
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">تأكيد كلمة المرور</label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords(p => ({ ...p, confirm: e.target.value }))}
              placeholder="أعد إدخال كلمة المرور"
              className="w-full h-11 pr-10 pl-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-gradient-to-l from-clinic-600 to-teal-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-60 active:scale-[0.98] transition-transform"
        >
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'تغيير كلمة المرور'}
        </button>
      </form>
    </div>
  );
}
