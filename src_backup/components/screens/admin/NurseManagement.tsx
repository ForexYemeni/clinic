'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Phone, UserCheck, UserX, Trash2, Lock } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { type NurseItem } from '@/lib/constants';
import { toast } from 'sonner';

export function NurseManagement() {
  const { setScreen, user } = useAppStore();
  const clinicId = user?.clinicId || '';
  const [nurses, setNurses] = useState<NurseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNurse, setNewNurse] = useState({ name: '', phone: '', password: '' });

  const fetchNurses = useCallback(async () => {
    try {
      const res = await fetch(`/api/users?role=nurse${clinicId ? `&clinicId=${clinicId}` : ''}`);
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
        body: JSON.stringify({ ...newNurse, role: 'nurse', clinicId }),
      });
      if (res.ok) {
        toast.success('تمت إضافة الممرض');
        setShowAddForm(false);
        setNewNurse({ name: '', phone: '', password: '' });
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
        fetchNurses();
      }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذا الممرض؟')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('تم حذف الممرض');
        fetchNurses();
      }
    } catch {}
  };

  const handleChangePassword = async (id: string) => {
    const newPassword = prompt('أدخل كلمة المرور الجديدة:');
    if (!newPassword) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      if (res.ok) toast.success('تم تغيير كلمة المرور');
    } catch {}
  };

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">إدارة الممرضين</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium active:scale-[0.97] transition-transform"
        >
          <Plus className="w-4 h-4" />
          إضافة ممرض
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 mb-4 border border-emerald-200 dark:border-emerald-800">
          <h3 className="font-bold text-sm mb-3">ممرض جديد</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={newNurse.name}
              onChange={(e) => setNewNurse(p => ({ ...p, name: e.target.value }))}
              placeholder="اسم الممرض"
              className="w-full h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">967+</div>
              <input
                type="tel"
                value={newNurse.phone}
                onChange={(e) => setNewNurse(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
                placeholder="رقم الهاتف (9 أرقام)"
                className="w-full h-10 px-3 pl-12 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                dir="ltr"
              />
            </div>
            <input
              type="password"
              value={newNurse.password}
              onChange={(e) => setNewNurse(p => ({ ...p, password: e.target.value }))}
              placeholder="كلمة المرور"
              className="w-full h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex gap-2">
              <button onClick={handleAddNurse} className="flex-1 h-10 bg-emerald-600 text-white font-medium rounded-xl active:scale-[0.97] transition-transform">
                إضافة
              </button>
              <button onClick={() => setShowAddForm(false)} className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 font-medium rounded-xl active:scale-[0.97] transition-transform">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nurse List */}
      {loading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>
      ) : nurses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>لا يوجد ممرضين</p>
        </div>
      ) : (
        <div className="space-y-2">
          {nurses.map(nurse => (
            <div key={nurse.id} className={`bg-white dark:bg-gray-800 rounded-xl p-3 border border-border ${!nurse.active ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${nurse.active ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    {nurse.active ? <UserCheck className="w-5 h-5 text-emerald-600" /> : <UserX className="w-5 h-5 text-gray-400" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{nurse.name}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">{nurse.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleChangePassword(nurse.id)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="تغيير كلمة المرور">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleToggleActive(nurse.id, nurse.active)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title={nurse.active ? 'تعطيل' : 'تفعيل'}>
                    {nurse.active ? <UserX className="w-4 h-4 text-yellow-600" /> : <UserCheck className="w-4 h-4 text-emerald-600" />}
                  </button>
                  <button onClick={() => handleDelete(nurse.id)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="حذف">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
