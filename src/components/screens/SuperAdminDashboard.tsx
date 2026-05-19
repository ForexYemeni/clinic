'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Building2, Users, Clock, CreditCard, AlertTriangle, Settings, Database, ChevronLeft, Plus, Search } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/constants';

interface ClinicData {
  id: string;
  name: string;
  phone: string;
  active: boolean;
  subscription: {
    status: string;
    type: string;
    startDate: string;
    endDate: string;
    trialDays?: number;
  };
  userCount: number;
  patientCount: number;
  createdAt: string;
}

export function SuperAdminDashboard() {
  const { setScreen, setSelectedClinicId } = useAppStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clinics' | 'add' | 'firebase' | 'settings'>('dashboard');
  const [clinics, setClinics] = useState<ClinicData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add clinic form state
  const [newClinicName, setNewClinicName] = useState('');
  const [newClinicPhone, setNewClinicPhone] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [trialDays, setTrialDays] = useState(14);
  const [subType, setSubType] = useState('trial');
  const [addingClinic, setAddingClinic] = useState(false);

  // Firebase config state
  const [firebaseProjectId, setFirebaseProjectId] = useState('');
  const [firebaseClientEmail, setFirebaseClientEmail] = useState('');
  const [firebasePrivateKey, setFirebasePrivateKey] = useState('');
  const [savingFirebase, setSavingFirebase] = useState(false);

  const loadClinics = async () => {
    try {
      const data = await apiGet<ClinicData[]>('/api/super-admin/clinics');
      setClinics(data);
    } catch (err) {
      console.error('Load clinics error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClinics(); }, []);

  const handleAddClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClinicName) return;
    setAddingClinic(true);
    try {
      await apiPost('/api/super-admin/clinics', {
        name: newClinicName,
        phone: newClinicPhone || newAdminPhone,
        ownerPhone: newAdminPhone,
        adminName: newAdminName,
        adminPassword: newAdminPassword || '1234',
        subscriptionType: subType,
        trialDays,
      });
      toast.success('تم إنشاء العيادة بنجاح');
      setNewClinicName(''); setNewClinicPhone(''); setNewAdminName(''); setNewAdminPhone(''); setNewAdminPassword('');
      setActiveTab('clinics');
      loadClinics();
    } catch (err: any) {
      toast.error(err.message || 'خطأ في إنشاء العيادة');
    } finally {
      setAddingClinic(false);
    }
  };

  const handleSuspendClinic = async (clinicId: string) => {
    try {
      await apiPut(`/api/super-admin/clinics/${clinicId}`, { action: 'suspend' });
      toast.success('تم إيقاف العيادة');
      loadClinics();
    } catch (err: any) {
      toast.error(err.message || 'خطأ');
    }
  };

  const handleActivateClinic = async (clinicId: string, days: number = 30) => {
    try {
      await apiPut(`/api/super-admin/clinics/${clinicId}`, { action: 'activate', days, subscriptionType: 'monthly' });
      toast.success('تم تفعيل العيادة');
      loadClinics();
    } catch (err: any) {
      toast.error(err.message || 'خطأ');
    }
  };

  const handleExtendClinic = async (clinicId: string, days: number) => {
    try {
      await apiPut(`/api/super-admin/clinics/${clinicId}`, { action: 'extend_subscription', days, subscriptionType: 'monthly' });
      toast.success(`تم التمديد ${days} يوم`);
      loadClinics();
    } catch (err: any) {
      toast.error(err.message || 'خطأ');
    }
  };

  const handleDeleteClinic = async (clinicId: string, clinicName: string) => {
    if (!confirm(`هل أنت متأكد من حذف عيادة "${clinicName}"؟ سيتم حذف جميع البيانات نهائياً!`)) return;
    try {
      await apiDelete(`/api/super-admin/clinics/${clinicId}`);
      toast.success('تم حذف العيادة');
      loadClinics();
    } catch (err: any) {
      toast.error(err.message || 'خطأ');
    }
  };

  const handleSaveFirebase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFirebase(true);
    try {
      await apiPut('/api/super-admin/firebase-config', {
        projectId: firebaseProjectId,
        clientEmail: firebaseClientEmail,
        privateKey: firebasePrivateKey,
      });
      toast.success('تم تحديث إعدادات Firebase');
    } catch (err: any) {
      toast.error(err.message || 'خطأ في تحديث Firebase');
    } finally {
      setSavingFirebase(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'trial': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'expired': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'suspended': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'trial': return 'تجريبي';
      case 'expired': return 'منتهي';
      case 'suspended': return 'موقوف';
      default: return status;
    }
  };

  const filteredClinics = clinics.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const totalClinics = clinics.length;
  const activeClinics = clinics.filter(c => c.subscription?.status === 'active' || c.subscription?.status === 'trial').length;
  const expiredClinics = clinics.filter(c => c.subscription?.status === 'expired').length;

  // Dashboard Tab
  if (activeTab === 'dashboard') {
    return (
      <div className="p-4 space-y-4 pb-20">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              لوحة تحكم المنصة
            </h2>
            <p className="text-xs text-muted-foreground">الإدارة المركزية للعيادات</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
            <Building2 className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-2xl font-bold">{totalClinics}</p>
            <p className="text-xs opacity-80">إجمالي العيادات</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white">
            <Users className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-2xl font-bold">{activeClinics}</p>
            <p className="text-xs opacity-80">عيادات نشطة</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 text-white">
            <AlertTriangle className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-2xl font-bold">{expiredClinics}</p>
            <p className="text-xs opacity-80">اشتراكات منتهية</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
            <CreditCard className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-2xl font-bold">{clinics.filter(c => c.subscription?.type === 'trial').length}</p>
            <p className="text-xs opacity-80">فترة تجريبية</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground">إجراءات سريعة</h3>
          <button onClick={() => setActiveTab('add')} className="w-full flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-700 dark:text-purple-300 touch-feedback">
            <Plus className="w-5 h-5" />
            <div className="text-right">
              <p className="text-sm font-bold">إضافة عيادة جديدة</p>
              <p className="text-xs opacity-70">إنشاء عيادة بفترة تجريبية</p>
            </div>
          </button>
          <button onClick={() => setActiveTab('clinics')} className="w-full flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-700 dark:text-blue-300 touch-feedback">
            <Building2 className="w-5 h-5" />
            <div className="text-right">
              <p className="text-sm font-bold">إدارة العيادات</p>
              <p className="text-xs opacity-70">عرض وتعديل وحذف العيادات</p>
            </div>
          </button>
          <button onClick={() => setActiveTab('firebase')} className="w-full flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-orange-700 dark:text-orange-300 touch-feedback">
            <Database className="w-5 h-5" />
            <div className="text-right">
              <p className="text-sm font-bold">إعدادات Firebase</p>
              <p className="text-xs opacity-70">ربط قاعدة بيانات Firebase جديدة</p>
            </div>
          </button>
        </div>

        {/* Recent Clinics */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground">آخر العيادات</h3>
          {clinics.slice(0, 5).map(clinic => (
            <div key={clinic.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-border">
              <div>
                <p className="text-sm font-bold">{clinic.name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(clinic.createdAt)}</p>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-full ${statusColor(clinic.subscription?.status || 'expired')}`}>
                {statusLabel(clinic.subscription?.status || 'expired')}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Clinics List Tab
  if (activeTab === 'clinics') {
    return (
      <div className="p-4 space-y-4 pb-20">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setActiveTab('dashboard')} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800">
            <ChevronLeft className="w-5 h-5 rotate-180" />
          </button>
          <div>
            <h2 className="text-lg font-bold">إدارة العيادات</h2>
            <p className="text-xs text-muted-foreground">{filteredClinics.length} عيادة</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم أو الهاتف..."
            className="w-full h-10 pr-10 pl-4 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClinics.map(clinic => {
              const endDate = clinic.subscription?.endDate ? new Date(clinic.subscription.endDate) : null;
              const daysRemaining = endDate ? Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

              return (
                <motion.div
                  key={clinic.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-border p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold">{clinic.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{clinic.phone} • {clinic.userCount} مستخدم • {clinic.patientCount} مريض</p>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full ${statusColor(clinic.subscription?.status || 'expired')}`}>
                      {statusLabel(clinic.subscription?.status || 'expired')}
                    </span>
                  </div>

                  {/* Subscription Info */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{clinic.subscription?.type === 'trial' ? 'تجريبي' : clinic.subscription?.type === 'lifetime' ? 'مدى الحياة' : 'اشتراك'}</span>
                    </div>
                    {endDate && clinic.subscription?.type !== 'lifetime' && (
                      <div className={daysRemaining <= 7 ? 'text-red-500 font-bold' : ''}>
                        <span>{daysRemaining > 0 ? `${daysRemaining} يوم متبقي` : 'منتهي'}</span>
                      </div>
                    )}
                    <span>{formatDate(clinic.createdAt)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => { setSelectedClinicId(clinic.id); setScreen('super-admin-clinic-detail'); }}
                      className="text-xs px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg font-bold touch-feedback">
                      التفاصيل
                    </button>
                    {(clinic.subscription?.status === 'active' || clinic.subscription?.status === 'trial') && (
                      <button onClick={() => handleSuspendClinic(clinic.id)}
                        className="text-xs px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg font-bold touch-feedback">
                        إيقاف
                      </button>
                    )}
                    {clinic.subscription?.status === 'expired' && (
                      <button onClick={() => handleActivateClinic(clinic.id, 30)}
                        className="text-xs px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg font-bold touch-feedback">
                        تفعيل 30 يوم
                      </button>
                    )}
                    {clinic.subscription?.status === 'suspended' && (
                      <button onClick={() => handleActivateClinic(clinic.id, 30)}
                        className="text-xs px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg font-bold touch-feedback">
                        إعادة تفعيل
                      </button>
                    )}
                    <button onClick={() => handleExtendClinic(clinic.id, 30)}
                      className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg font-bold touch-feedback">
                      تمديد 30 يوم
                    </button>
                    <button onClick={() => handleDeleteClinic(clinic.id, clinic.name)}
                      className="text-xs px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg font-bold touch-feedback">
                      حذف
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Add Clinic Tab
  if (activeTab === 'add') {
    return (
      <div className="p-4 space-y-4 pb-20">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setActiveTab('dashboard')} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800">
            <ChevronLeft className="w-5 h-5 rotate-180" />
          </button>
          <h2 className="text-lg font-bold">إضافة عيادة جديدة</h2>
        </div>

        <form onSubmit={handleAddClinic} className="space-y-4">
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
            <h3 className="text-sm font-bold text-purple-800 dark:text-purple-300 mb-1">معلومات العيادة</h3>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">اسم العيادة</label>
            <input type="text" value={newClinicName} onChange={(e) => setNewClinicName(e.target.value)} placeholder="اسم العيادة"
              className="w-full h-12 px-4 bg-white dark:bg-gray-800 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-500" required />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">رقم هاتف العيادة</label>
            <input type="tel" value={newClinicPhone} onChange={(e) => setNewClinicPhone(e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="7XXXXXXXX"
              className="w-full h-12 px-4 bg-white dark:bg-gray-800 border border-border rounded-xl text-base font-mono focus:outline-none focus:ring-2 focus:ring-purple-500" dir="ltr" inputMode="numeric" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">نوع الاشتراك</label>
            <select value={subType} onChange={(e) => setSubType(e.target.value)}
              className="w-full h-12 px-4 bg-white dark:bg-gray-800 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="trial">فترة تجريبية</option>
              <option value="monthly">شهري</option>
              <option value="yearly">سنوي</option>
              <option value="lifetime">مدى الحياة</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">مدة الفترة التجريبية (أيام)</label>
            <select value={trialDays} onChange={(e) => setTrialDays(Number(e.target.value))}
              className="w-full h-12 px-4 bg-white dark:bg-gray-800 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value={7}>7 أيام</option>
              <option value={14}>14 يوم</option>
              <option value={30}>30 يوم</option>
              <option value={60}>60 يوم</option>
              <option value={90}>90 يوم</option>
            </select>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-1">معلومات مدير العيادة</h3>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">اسم المدير</label>
            <input type="text" value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} placeholder="الاسم الكامل"
              className="w-full h-12 px-4 bg-white dark:bg-gray-800 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">رقم هاتف المدير</label>
            <input type="tel" value={newAdminPhone} onChange={(e) => setNewAdminPhone(e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="7XXXXXXXX"
              className="w-full h-12 px-4 bg-white dark:bg-gray-800 border border-border rounded-xl text-base font-mono focus:outline-none focus:ring-2 focus:ring-purple-500" dir="ltr" inputMode="numeric" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">كلمة مرور المدير</label>
            <input type="text" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} placeholder="اتركه فارغاً لـ 1234"
              className="w-full h-12 px-4 bg-white dark:bg-gray-800 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>

          <button type="submit" disabled={addingClinic} className="w-full h-12 bg-gradient-to-l from-purple-600 to-purple-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-60 active:scale-[0.98] transition-all">
            {addingClinic ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'إنشاء العيادة'}
          </button>
        </form>
      </div>
    );
  }

  // Firebase Config Tab
  if (activeTab === 'firebase') {
    return (
      <div className="p-4 space-y-4 pb-20">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setActiveTab('dashboard')} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800">
            <ChevronLeft className="w-5 h-5 rotate-180" />
          </button>
          <div>
            <h2 className="text-lg font-bold">إعدادات Firebase</h2>
            <p className="text-xs text-muted-foreground">ربط قاعدة بيانات Firebase جديدة</p>
          </div>
        </div>

        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
          <p className="text-xs text-orange-700 dark:text-orange-300">
            ⚠️ تغيير إعدادات Firebase سيؤثر على اتصال التطبيق بقاعدة البيانات. تأكد من صحة البيانات قبل الحفظ.
          </p>
        </div>

        <form onSubmit={handleSaveFirebase} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Project ID</label>
            <input type="text" value={firebaseProjectId} onChange={(e) => setFirebaseProjectId(e.target.value)} placeholder="my-firebase-project"
              className="w-full h-12 px-4 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500" dir="ltr" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Client Email</label>
            <input type="email" value={firebaseClientEmail} onChange={(e) => setFirebaseClientEmail(e.target.value)} placeholder="firebase-adminsdk@project.iam.gserviceaccount.com"
              className="w-full h-12 px-4 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500" dir="ltr" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Private Key</label>
            <textarea value={firebasePrivateKey} onChange={(e) => setFirebasePrivateKey(e.target.value)} placeholder="-----BEGIN PRIVATE KEY-----..."
              className="w-full h-32 px-4 py-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" dir="ltr" />
          </div>

          <button type="submit" disabled={savingFirebase} className="w-full h-12 bg-gradient-to-l from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-60 active:scale-[0.98] transition-all">
            {savingFirebase ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'حفظ إعدادات Firebase'}
          </button>
        </form>
      </div>
    );
  }

  return null;
}
