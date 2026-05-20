'use client';

import React, { useState } from 'react';
import { Building2, Moon, Sun, Lock, LogOut, Shield, Info } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

export function SettingsScreen() {
  const { user, theme, toggleTheme, clinicName, setClinicName, logout } = useAppStore();
  const [editingName, setEditingName] = useState(false);
  const [newClinicName, setNewClinicName] = useState(clinicName);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', newPassword: '', confirm: '' });

  const handleSaveName = async () => {
    if (!newClinicName.trim()) return;
    try {
      // Update clinic name in database would require an API call
      setClinicName(newClinicName.trim());
      setEditingName(false);
      toast.success('تم تحديث اسم العيادة');
    } catch {
      toast.error('خطأ في التحديث');
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
    if (confirm('هل تريد تسجيل الخروج؟')) {
      logout();
    }
  };

  return (
    <div className="p-4 pb-24">
      <h2 className="text-lg font-bold mb-4">الإعدادات</h2>

      {/* Clinic Name */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-border mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">اسم العيادة</p>
              {editingName ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={newClinicName}
                    onChange={(e) => setNewClinicName(e.target.value)}
                    className="h-8 px-2 text-sm bg-gray-50 dark:bg-gray-700 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button onClick={handleSaveName} className="text-xs text-emerald-600 font-medium">حفظ</button>
                  <button onClick={() => setEditingName(false)} className="text-xs text-muted-foreground">إلغاء</button>
                </div>
              ) : (
                <p className="text-sm font-medium">{clinicName}</p>
              )}
            </div>
          </div>
          {!editingName && (
            <button onClick={() => setEditingName(true)} className="text-xs text-emerald-600">تعديل</button>
          )}
        </div>
      </div>

      {/* Theme */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-border mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
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
      </div>

      {/* Change Password */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-border mb-3">
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
              className="w-full h-10 px-3 bg-gray-50 dark:bg-gray-700 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords(p => ({ ...p, confirm: e.target.value }))}
              placeholder="تأكيد كلمة المرور"
              className="w-full h-10 px-3 bg-gray-50 dark:bg-gray-700 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex gap-2">
              <button onClick={handleChangePassword} className="flex-1 h-10 bg-emerald-600 text-white rounded-xl text-sm font-medium">حفظ</button>
              <button onClick={() => setChangingPassword(false)} className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl text-sm font-medium">إلغاء</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setChangingPassword(true)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-sm font-medium">تغيير كلمة المرور</p>
            </div>
          </button>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full bg-white dark:bg-gray-800 rounded-xl p-4 border border-border flex items-center gap-3 mb-3 active:scale-[0.98] transition-transform"
      >
        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
          <LogOut className="w-5 h-5 text-red-600" />
        </div>
        <p className="text-sm font-medium text-red-600">تسجيل الخروج</p>
      </button>

      {/* App Info */}
      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground">عيادة الإسعافات الأولية v2.0</p>
        <p className="text-[10px] text-muted-foreground mt-1">جميع الحقوق محفوظة</p>
      </div>
    </div>
  );
}
