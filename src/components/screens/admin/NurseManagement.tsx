'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Phone, UserCheck, UserX, Trash2, Lock, AlertTriangle, X, ShieldAlert, DollarSign, Wallet, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { type NurseItem } from '@/lib/constants';
import { formatCurrency } from '@/lib/constants';
import { toast } from 'sonner';

export function NurseManagement() {
  const { setScreen, setSelectedNurseId } = useAppStore();
  const [nurses, setNurses] = useState<NurseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNurse, setNewNurse] = useState({ name: '', phone: '', password: '', salary: '' });

  // Confirmation states
  const [confirmAction, setConfirmAction] = useState<{ type: 'deactivate' | 'delete'; nurse: NurseItem } | null>(null);

  // Change password card state
  const [changePasswordNurse, setChangePasswordNurse] = useState<NurseItem | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchNurses = useCallback(async () => {
    try {
      const res = await fetch('/api/users?role=nurse');
      if (res.ok) {
        const data = await res.json();
        setNurses(data);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNurses(); }, [fetchNurses]);

  const handleAddNurse = async () => {
    if (!newNurse.name.trim()) { toast.error('أدخل اسم الممرض'); return; }
    if (newNurse.phone.length !== 9) { toast.error('رقم الهاتف يجب أن يكون 9 أرقام'); return; }
    if (!newNurse.password) { toast.error('أدخل كلمة المرور'); return; }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newNurse, salary: Number(newNurse.salary) || 0, role: 'nurse' }),
      });
      if (res.ok) {
        toast.success('تمت إضافة الممرض');
        setShowAddForm(false);
        setNewNurse({ name: '', phone: '', password: '', salary: '' });
        fetchNurses();
      } else {
        const data = await res.json();
        toast.error(data.error || 'خطأ في الإضافة');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });
      if (res.ok) {
        toast.success(!currentActive ? 'تم تفعيل الممرض' : 'تم تعطيل الممرض');
        setConfirmAction(null);
        fetchNurses();
      }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('تم حذف الممرض');
        setConfirmAction(null);
        fetchNurses();
      }
    } catch {}
  };

  const handleChangePassword = async () => {
    if (!changePasswordNurse || !newPassword.trim()) return;
    setChangingPassword(true);
    try {
      const res = await fetch(`/api/users/${changePasswordNurse.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      if (res.ok) {
        toast.success('تم تغيير كلمة المرور بنجاح');
        setChangePasswordNurse(null);
        setNewPassword('');
        setShowPassword(false);
      } else {
        toast.error('خطأ في تغيير كلمة المرور');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">إدارة الممرضين</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 bg-clinic-600 text-white px-4 py-2 rounded-xl text-sm font-medium active:scale-[0.97] transition-transform"
        >
          <Plus className="w-4 h-4" />
          إضافة ممرض
        </button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="bg-clinic-50 dark:bg-clinic-900/20 rounded-2xl p-4 border border-clinic-200 dark:border-clinic-800">
              <h3 className="font-bold text-sm mb-3">ممرض جديد</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newNurse.name}
                  onChange={(e) => setNewNurse(p => ({ ...p, name: e.target.value }))}
                  placeholder="اسم الممرض"
                  className="w-full h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500"
                />
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">967+</div>
                  <input
                    type="tel"
                    value={newNurse.phone}
                    onChange={(e) => setNewNurse(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
                    placeholder="رقم الهاتف (9 أرقام)"
                    className="w-full h-10 px-3 pl-12 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-clinic-500"
                    dir="ltr"
                  />
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newNurse.password}
                    onChange={(e) => setNewNurse(p => ({ ...p, password: e.target.value }))}
                    placeholder="كلمة المرور"
                    className="w-full h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Salary Field */}
                <div className="relative">
                  <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinic-500" />
                  <input
                    type="number"
                    value={newNurse.salary}
                    onChange={(e) => setNewNurse(p => ({ ...p, salary: e.target.value }))}
                    placeholder="الراتب الشهري (ر.ي)"
                    className="w-full h-10 pr-10 pl-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500"
                    dir="ltr"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddNurse} className="flex-1 h-10 bg-clinic-600 text-white font-medium rounded-xl active:scale-[0.97] transition-transform">
                    إضافة
                  </button>
                  <button onClick={() => { setShowAddForm(false); setShowPassword(false); }} className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 font-medium rounded-xl active:scale-[0.97] transition-transform">
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Professional Change Password Card */}
      <AnimatePresence>
        {changePasswordNurse && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 shadow-lg shadow-blue-500/20 relative overflow-hidden"
          >
            {/* Decorative */}
            <div className="absolute -top-6 -left-6 w-20 h-20 bg-white/5 rounded-full" />
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/5 rounded-full" />

            {/* Close button */}
            <button
              onClick={() => { setChangePasswordNurse(null); setNewPassword(''); setShowPassword(false); }}
              className="absolute top-3 left-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center z-10"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>

            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">تغيير كلمة المرور</p>
                  <p className="text-[11px] text-white/80">{changePasswordNurse.name}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="كلمة المرور الجديدة"
                    className="w-full h-11 px-4 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/80"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength indicator */}
                {newPassword.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            newPassword.length >= i * 2
                              ? newPassword.length >= 8
                                ? 'bg-green-400'
                                : newPassword.length >= 4
                                ? 'bg-yellow-400'
                                : 'bg-red-400'
                              : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-white/60">
                      {newPassword.length >= 8 ? 'كلمة مرور قوية' : newPassword.length >= 4 ? 'متوسطة' : 'ضعيفة - أدخل 4 أحرف على الأقل'}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleChangePassword}
                    disabled={!newPassword.trim() || changingPassword}
                    className="flex-1 h-10 bg-white text-blue-600 rounded-xl text-sm font-bold active:scale-[0.97] transition-transform shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {changingPassword ? (
                      <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    حفظ كلمة المرور
                  </button>
                  <button
                    onClick={() => { setChangePasswordNurse(null); setNewPassword(''); setShowPassword(false); }}
                    className="flex-1 h-10 bg-white/20 text-white rounded-xl text-sm font-medium backdrop-blur-sm active:scale-[0.97] transition-transform"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Card for Deactivate/Delete */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`mb-4 rounded-2xl p-4 shadow-lg relative overflow-hidden ${
              confirmAction.type === 'delete'
                ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/20'
                : 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/20'
            }`}
          >
            {/* Close button */}
            <button
              onClick={() => setConfirmAction(null)}
              className="absolute top-3 left-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                {confirmAction.type === 'delete' ? (
                  <Trash2 className="w-6 h-6 text-white" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {confirmAction.type === 'delete' ? 'حذف الممرض' : 'تعطيل الممرض'}
                </p>
                <p className="text-[11px] text-white/80">
                  {confirmAction.nurse.name}
                </p>
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-3 mb-3 space-y-1.5">
              {confirmAction.type === 'delete' ? (
                <>
                  <p className="text-xs text-white/90 leading-relaxed">
                    سيتم حذف الممرض <span className="font-bold">{confirmAction.nurse.name}</span> نهائياً من النظام.
                  </p>
                  <p className="text-[10px] text-white/70">
                    • لن يتمكن من تسجيل الدخول بعد الآن
                  </p>
                  <p className="text-[10px] text-white/70">
                    • ستبقى الزيارات المسجلة سابقاً محفوظة
                  </p>
                  <p className="text-[10px] text-white/70">
                    • لا يمكن التراجع عن هذا الإجراء
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-white/90 leading-relaxed">
                    سيتم تعطيل حساب الممرض <span className="font-bold">{confirmAction.nurse.name}</span> مؤقتاً.
                  </p>
                  <p className="text-[10px] text-white/70">
                    • لن يتمكن من تسجيل الدخول حتى يتم تفعيله
                  </p>
                  <p className="text-[10px] text-white/70">
                    • ستبقى بياناته محفوظة ويمكن إعادة تفعيله لاحقاً
                  </p>
                  <p className="text-[10px] text-white/70">
                    • الزيارات المسجلة سابقاً ستبقى كما هي
                  </p>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (confirmAction.type === 'delete') {
                    handleDelete(confirmAction.nurse.id);
                  } else {
                    handleToggleActive(confirmAction.nurse.id, confirmAction.nurse.active);
                  }
                }}
                className="flex-1 h-10 bg-white text-red-600 rounded-xl text-sm font-bold active:scale-[0.97] transition-transform shadow-sm"
              >
                {confirmAction.type === 'delete' ? 'نعم، حذف نهائي' : 'نعم، تعطيل'}
              </button>
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 h-10 bg-white/20 text-white rounded-xl text-sm font-medium backdrop-blur-sm active:scale-[0.97] transition-transform"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nurse List */}
      {loading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>
      ) : nurses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>لا يوجد ممرضين</p>
        </div>
      ) : (
        <div className="space-y-3">
          {nurses.map(nurse => (
            <motion.div
              key={nurse.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`bg-white dark:bg-gray-800 rounded-2xl border overflow-hidden shadow-sm ${
                !nurse.active
                  ? 'border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-900/5'
                  : 'border-border'
              }`}
            >
              {/* Deactivated banner */}
              {!nurse.active && (
                <div className="bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 flex items-center gap-1.5">
                  <ShieldAlert className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">الحساب معطل - لا يمكن تسجيل الدخول</span>
                </div>
              )}

              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      nurse.active
                        ? 'bg-clinic-100 dark:bg-clinic-900/30'
                        : 'bg-amber-100 dark:bg-amber-900/30'
                    }`}>
                      {nurse.active
                        ? <UserCheck className="w-5 h-5 text-clinic-600" />
                        : <UserX className="w-5 h-5 text-amber-500" />
                      }
                    </div>
                    <div>
                      <p className={`font-medium text-sm ${!nurse.active ? 'text-amber-700 dark:text-amber-300' : ''}`}>
                        {nurse.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground" dir="ltr">{nurse.phone}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                          nurse.active
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {nurse.active ? 'نشط' : 'معطل'}
                        </span>
                      </div>
                      {/* Salary badge */}
                      {(nurse.salary || 0) > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Wallet className="w-3 h-3 text-clinic-500" />
                          <span className="text-[10px] font-bold text-clinic-600 dark:text-clinic-400">
                            راتب: {formatCurrency(nurse.salary || 0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Salary management button */}
                    {(nurse.salary || 0) > 0 && (
                      <button
                        onClick={() => { setSelectedNurseId(nurse.id); setScreen('admin-nurse-salary'); }}
                        className="p-2 rounded-lg hover:bg-clinic-50 dark:hover:bg-clinic-900/20"
                        title="إدارة الراتب"
                      >
                        <DollarSign className="w-4 h-4 text-clinic-600" />
                      </button>
                    )}
                    <button onClick={() => setChangePasswordNurse(nurse)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="تغيير كلمة المرور">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => setConfirmAction({ type: 'deactivate', nurse })}
                      className="p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20"
                      title={nurse.active ? 'تعطيل' : 'تفعيل'}
                    >
                      {nurse.active
                        ? <UserX className="w-4 h-4 text-amber-600" />
                        : <UserCheck className="w-4 h-4 text-clinic-600" />
                      }
                    </button>
                    <button
                      onClick={() => setConfirmAction({ type: 'delete', nurse })}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
