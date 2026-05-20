'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, Phone, MapPin, Users, Activity, AlertTriangle, ToggleLeft, ToggleRight, Trash2, Eye, EyeOff, ArrowLeft, X, Check } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

interface ClinicItem {
  id: string;
  name: string;
  address: string;
  phone: string;
  city: string;
  active: boolean;
  adminName?: string;
  adminPhone?: string;
  stats?: {
    patients: number;
    nurses: number;
    activeEmergencies: number;
    unpaidAmount: number;
  };
}

export function ClinicManagement() {
  const { setScreen } = useAppStore();
  const [clinics, setClinics] = useState<ClinicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);

  // Add form state
  const [newClinic, setNewClinic] = useState({
    clinicName: '', adminName: '', adminPhone: '', password: '',
    address: '', phone: '', city: '',
  });

  const fetchClinics = useCallback(async () => {
    try {
      const res = await fetch('/api/clinics?withStats=true');
      if (res.ok) {
        const data = await res.json();
        setClinics(data);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClinics(); }, [fetchClinics]);

  const handleAddClinic = async () => {
    if (!newClinic.clinicName.trim()) { toast.error('أدخل اسم العيادة'); return; }
    if (!newClinic.adminName.trim()) { toast.error('أدخل اسم مدير العيادة'); return; }
    if (newClinic.adminPhone.length !== 9) { toast.error('رقم هاتف المدير يجب أن يكون 9 أرقام'); return; }
    if (!newClinic.password || newClinic.password.length < 4) { toast.error('كلمة المرور يجب أن تكون 4 أحرف على الأقل'); return; }

    try {
      const res = await fetch('/api/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClinic),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success('تم إنشاء العيادة بنجاح');
        setShowAddForm(false);
        setNewClinic({ clinicName: '', adminName: '', adminPhone: '', password: '', address: '', phone: '', city: '' });
        fetchClinics();
      } else {
        toast.error(data.error || 'خطأ في إنشاء العيادة');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const action = currentActive ? 'تعطيل' : 'تفعيل';
    if (!confirm(`هل تريد ${action} هذه العيادة؟`)) return;

    try {
      const res = await fetch('/api/clinics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !currentActive }),
      });
      if (res.ok) {
        toast.success(currentActive ? 'تم تعطيل العيادة' : 'تم تفعيل العيادة');
        fetchClinics();
      }
    } catch {
      toast.error('خطأ في تحديث العيادة');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل تريد حذف عيادة "${name}"؟ سيتم حذف جميع بياناتها!`)) return;
    if (!confirm('تأكيد نهائي: حذف العيادة وكل بياناتها لا يمكن التراجع عنه!')) return;

    try {
      const res = await fetch(`/api/clinics?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('تم حذف العيادة');
        fetchClinics();
      }
    } catch {
      toast.error('خطأ في حذف العيادة');
    }
  };

  const selectedClinic = clinics.find(c => c.id === showDetail);

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">إدارة العيادات</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium active:scale-[0.97] transition-transform"
        >
          <Plus className="w-4 h-4" />
          إضافة عيادة
        </button>
      </div>

      {/* Add Clinic Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 mb-4 border border-purple-200 dark:border-purple-800"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm">عيادة جديدة</h3>
            <button onClick={() => setShowAddForm(false)}>
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={newClinic.clinicName}
              onChange={(e) => setNewClinic(p => ({ ...p, clinicName: e.target.value }))}
              placeholder="اسم العيادة *"
              className="w-full h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newClinic.city}
                onChange={(e) => setNewClinic(p => ({ ...p, city: e.target.value }))}
                placeholder="المدينة"
                className="w-full h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="text"
                value={newClinic.phone}
                onChange={(e) => setNewClinic(p => ({ ...p, phone: e.target.value }))}
                placeholder="هاتف العيادة"
                className="w-full h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                dir="ltr"
              />
            </div>
            <input
              type="text"
              value={newClinic.address}
              onChange={(e) => setNewClinic(p => ({ ...p, address: e.target.value }))}
              placeholder="العنوان"
              className="w-full h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="border-t border-border pt-3 mt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">بيانات مدير العيادة</p>
              <div className="space-y-2">
                <input
                  type="text"
                  value={newClinic.adminName}
                  onChange={(e) => setNewClinic(p => ({ ...p, adminName: e.target.value }))}
                  placeholder="اسم المدير *"
                  className="w-full h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">967+</div>
                  <input
                    type="tel"
                    value={newClinic.adminPhone}
                    onChange={(e) => setNewClinic(p => ({ ...p, adminPhone: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
                    placeholder="رقم هاتف المدير (9 أرقام) *"
                    className="w-full h-10 px-3 pl-12 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    dir="ltr"
                  />
                </div>
                <input
                  type="password"
                  value={newClinic.password}
                  onChange={(e) => setNewClinic(p => ({ ...p, password: e.target.value }))}
                  placeholder="كلمة المرور *"
                  className="w-full h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleAddClinic} className="flex-1 h-10 bg-purple-600 text-white font-medium rounded-xl active:scale-[0.97] transition-transform flex items-center justify-center gap-1">
                <Check className="w-4 h-4" /> إنشاء
              </button>
              <button onClick={() => setShowAddForm(false)} className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 font-medium rounded-xl active:scale-[0.97] transition-transform">
                إلغاء
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Clinic Detail View */}
      {selectedClinic && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 border border-border"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">{selectedClinic.name}</h3>
            <button onClick={() => setShowDetail(null)}>
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <div className="space-y-2 text-sm">
            {selectedClinic.city && <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /> {selectedClinic.city}</p>}
            {selectedClinic.phone && <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /> <span dir="ltr">{selectedClinic.phone}</span></p>}
            {selectedClinic.address && <p className="text-muted-foreground">{selectedClinic.address}</p>}
            {selectedClinic.adminName && <p>المدير: <strong>{selectedClinic.adminName}</strong> {selectedClinic.adminPhone && <span dir="ltr" className="text-muted-foreground">({selectedClinic.adminPhone})</span>}</p>}
            {selectedClinic.stats && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-2 text-center">
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{selectedClinic.stats.patients}</p>
                  <p className="text-[10px] text-muted-foreground">مرضى</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2 text-center">
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{selectedClinic.stats.nurses}</p>
                  <p className="text-[10px] text-muted-foreground">ممرضين</p>
                </div>
                {selectedClinic.stats.activeEmergencies > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-2 text-center col-span-2">
                    <p className="text-lg font-bold text-red-700 dark:text-red-400">{selectedClinic.stats.activeEmergencies}</p>
                    <p className="text-[10px] text-muted-foreground">طوارئ نشطة</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Clinics List */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>
      ) : clinics.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="w-16 h-16 mx-auto mb-3 opacity-20" />
          <p className="font-medium">لا توجد عيادات</p>
          <p className="text-sm mt-1">أضف أول عيادة للبدء</p>
        </div>
      ) : (
        <div className="space-y-2">
          {clinics.map(clinic => (
            <div key={clinic.id} className={`bg-white dark:bg-gray-800 rounded-xl p-3 border border-border ${!clinic.active ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${clinic.active ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    <Building2 className={`w-5 h-5 ${clinic.active ? 'text-purple-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{clinic.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      {clinic.city && <span>{clinic.city}</span>}
                      {clinic.stats && (
                        <>
                          <span>{clinic.stats.patients} مريض</span>
                          <span>{clinic.stats.nurses} ممرض</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setShowDetail(clinic.id)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="تفاصيل">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleToggleActive(clinic.id, clinic.active)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title={clinic.active ? 'تعطيل' : 'تفعيل'}>
                    {clinic.active ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                  </button>
                  <button onClick={() => handleDelete(clinic.id, clinic.name)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="حذف">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              {clinic.stats && clinic.stats.activeEmergencies > 0 && (
                <div className="mt-2 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{clinic.stats.activeEmergencies} حالة طوارئ نشطة</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
