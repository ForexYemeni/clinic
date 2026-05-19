'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Building2, Users, CreditCard, Clock, AlertTriangle, Shield, Calendar, Phone, MapPin, FileText, UserCog, Pause, Play, PlusCircle, Trash2, TrendingUp, RotateCcw, Lock, Eye, EyeOff, Loader2, CheckCircle, UserCheck, Settings, LayoutTemplate, Stethoscope, Siren, Bell } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { apiGet, apiPut, apiDelete } from '@/lib/api';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/constants';

interface ClinicDetailData {
  id: string;
  name: string;
  phone: string;
  address: string;
  description: string;
  logo: string;
  primaryColor: string;
  active: boolean;
  subscription: {
    status: string;
    type: string;
    startDate: string;
    endDate: string;
    trialDays?: number;
  };
  ownerPhone: string;
  setupComplete: boolean;
  createdAt: string;
  updatedAt: string;
  stats: {
    userCount: number;
    patientCount: number;
    serviceCount: number;
    invoiceCount: number;
    totalRevenue: number;
  };
  users: Array<{
    id: string;
    name: string;
    phone: string;
    role: string;
    active: boolean;
    createdAt?: string;
  }>;
  subscriptionCheck: {
    valid: boolean;
    status: string;
    endDate: string;
    daysRemaining: number;
  };
}

export function SuperAdminClinicDetail() {
  const { selectedClinicId, setScreen, user } = useAppStore();
  const [clinic, setClinic] = useState<ClinicDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [extendDays, setExtendDays] = useState(30);
  const [showExtend, setShowExtend] = useState(false);

  // Reset data state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2 | 3>(1);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetProcessing, setResetProcessing] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const CONFIRM_TEXT = 'حذف جميع البيانات';

  const loadClinic = async () => {
    if (!selectedClinicId) return;
    try {
      const data = await apiGet<ClinicDetailData>(`/api/super-admin/clinics/${selectedClinicId}`);
      setClinic(data);
    } catch (err) {
      console.error('Load clinic detail error:', err);
      toast.error('خطأ في جلب بيانات العيادة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClinic(); }, [selectedClinicId]);

  const handleSuspend = async () => {
    if (!selectedClinicId) return;
    try {
      await apiPut(`/api/super-admin/clinics/${selectedClinicId}`, { action: 'suspend' });
      toast.success('تم إيقاف العيادة');
      loadClinic();
    } catch (err: any) {
      toast.error(err.message || 'خطأ');
    }
  };

  const handleActivate = async (days: number) => {
    if (!selectedClinicId) return;
    try {
      await apiPut(`/api/super-admin/clinics/${selectedClinicId}`, { action: 'activate', days, subscriptionType: 'monthly' });
      toast.success('تم تفعيل العيادة');
      loadClinic();
    } catch (err: any) {
      toast.error(err.message || 'خطأ');
    }
  };

  const handleExtend = async () => {
    if (!selectedClinicId) return;
    try {
      await apiPut(`/api/super-admin/clinics/${selectedClinicId}`, { action: 'extend_subscription', days: extendDays, subscriptionType: 'monthly' });
      toast.success(`تم التمديد ${extendDays} يوم`);
      setShowExtend(false);
      loadClinic();
    } catch (err: any) {
      toast.error(err.message || 'خطأ');
    }
  };

  const handleDelete = async () => {
    if (!selectedClinicId || !clinic) return;
    if (!confirm(`هل أنت متأكد من حذف عيادة "${clinic.name}"؟ سيتم حذف جميع البيانات نهائياً!`)) return;
    if (!confirm('تأكيد نهائي: لا يمكن التراجع عن هذا الإجراء!')) return;
    try {
      await apiDelete(`/api/super-admin/clinics/${selectedClinicId}`);
      toast.success('تم حذف العيادة');
      setScreen('super-admin-clinics');
    } catch (err: any) {
      toast.error(err.message || 'خطأ في حذف العيادة');
    }
  };

  const handleResetData = async () => {
    if (!selectedClinicId) return;
    if (resetConfirmText !== CONFIRM_TEXT || !resetPassword) return;

    setResetProcessing(true);
    try {
      await apiPut(`/api/super-admin/clinics/${selectedClinicId}`, {
        action: 'reset_data',
        superAdminPassword: resetPassword,
      });
      setResetProcessing(false);
      setResetSuccess(true);
      toast.success('تم إعادة تعيين بيانات العيادة بنجاح');
    } catch (err: any) {
      setResetProcessing(false);
      toast.error(err.message || 'خطأ في إعادة التعيين');
      setResetStep(2);
    }
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setResetStep(1);
    setResetConfirmText('');
    setResetPassword('');
    setResetSuccess(false);
    setResetProcessing(false);
  };

  const handleToggleNurseActive = async (nurseId: string, currentActive: boolean) => {
    try {
      await apiPut(`/api/users/${nurseId}`, { active: !currentActive });
      toast.success(currentActive ? 'تم تعطيل الممرض' : 'تم تفعيل الممرض');
      loadClinic();
    } catch (err: any) {
      toast.error(err.message || 'خطأ');
    }
  };

  const handleDeleteNurse = async (nurseId: string, nurseName: string) => {
    if (!confirm(`هل أنت متأكد من حذف الممرض "${nurseName}"؟`)) return;
    try {
      await apiDelete(`/api/users/${nurseId}`);
      toast.success('تم حذف الممرض');
      loadClinic();
    } catch (err: any) {
      toast.error(err.message || 'خطأ في حذف الممرض');
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="p-4 text-center py-12">
        <Building2 className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-30" />
        <p className="text-sm text-muted-foreground">العيادة غير موجودة</p>
        <button onClick={() => setScreen('super-admin-clinics')} className="text-purple-600 text-sm font-bold mt-2">العودة للعيادات</button>
      </div>
    );
  }

  const statusColorMap: Record<string, string> = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    trial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    suspended: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  };
  const statusLabelMap: Record<string, string> = { active: 'نشط', trial: 'تجريبي', expired: 'منتهي', suspended: 'موقوف' };

  const subStatus = clinic.subscription?.status || 'expired';
  const endDate = clinic.subscription?.endDate ? new Date(clinic.subscription.endDate) : null;
  const daysRemaining = clinic.subscriptionCheck?.daysRemaining || (endDate ? Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0);
  const subTypeLabel: Record<string, string> = { trial: 'تجريبي', monthly: 'شهري', yearly: 'سنوي', lifetime: 'مدى الحياة' };

  const adminUsers = clinic.users?.filter(u => u.role === 'admin') || [];
  const nurseUsers = clinic.users?.filter(u => u.role === 'nurse') || [];

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => setScreen('super-admin-clinics')} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800">
          <ChevronLeft className="w-5 h-5 rotate-180" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold">{clinic.name}</h2>
          <p className="text-xs text-muted-foreground">تفاصيل العيادة</p>
        </div>
        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${statusColorMap[subStatus] || 'bg-gray-100 text-gray-700'}`}>
          {statusLabelMap[subStatus] || subStatus}
        </span>
      </div>

      {/* Clinic Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 flex items-center justify-center">
            {clinic.logo ? (
              <img src={clinic.logo} alt="" className="w-10 h-10 object-contain rounded-xl" />
            ) : (
              <Building2 className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-base">{clinic.name}</h3>
            {clinic.description && <p className="text-xs text-muted-foreground mt-0.5">{clinic.description}</p>}
          </div>
        </div>
        <div className="p-4 space-y-2 text-xs">
          {clinic.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-3.5 h-3.5" />
              <span dir="ltr">+967 {clinic.phone}</span>
            </div>
          )}
          {clinic.address && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span>{clinic.address}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>تاريخ الإنشاء: {formatDate(clinic.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="w-3.5 h-3.5" />
            <span>هاتف المالك: <span dir="ltr">{clinic.ownerPhone}</span></span>
          </div>
        </div>
      </div>

      {/* Subscription Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-600" />
            الاشتراك
          </h3>
          <span className={`text-xs px-2 py-1 rounded-full ${statusColorMap[subStatus]}`}>
            {statusLabelMap[subStatus]}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
            <p className="text-[10px] text-muted-foreground">النوع</p>
            <p className="text-sm font-bold">{subTypeLabel[clinic.subscription?.type] || '-'}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
            <p className="text-[10px] text-muted-foreground">الأيام المتبقية</p>
            <p className={`text-sm font-bold ${daysRemaining <= 7 ? 'text-red-600' : daysRemaining <= 30 ? 'text-amber-600' : 'text-green-600'}`}>
              {clinic.subscription?.type === 'lifetime' ? 'غير محدود' : `${Math.max(0, daysRemaining)} يوم`}
            </p>
          </div>
          {clinic.subscription?.startDate && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground">تاريخ البدء</p>
              <p className="text-xs font-medium">{formatDate(clinic.subscription.startDate)}</p>
            </div>
          )}
          {clinic.subscription?.endDate && clinic.subscription?.type !== 'lifetime' && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground">تاريخ الانتهاء</p>
              <p className="text-xs font-medium">{formatDate(clinic.subscription.endDate)}</p>
            </div>
          )}
        </div>

        {/* Extend Section */}
        {showExtend ? (
          <div className="space-y-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
            <p className="text-xs font-bold text-purple-700 dark:text-purple-300">تمديد الاشتراك</p>
            <div className="flex gap-2">
              {[7, 14, 30, 60, 90].map(d => (
                <button key={d} onClick={() => setExtendDays(d)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${extendDays === d ? 'bg-purple-600 text-white' : 'bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'}`}>
                  {d} يوم
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={handleExtend} className="flex-1 h-9 bg-purple-600 text-white text-xs font-bold rounded-lg active:scale-[0.98] transition-all">تمديد</button>
              <button onClick={() => setShowExtend(false)} className="h-9 px-4 bg-gray-200 dark:bg-gray-700 text-xs font-bold rounded-lg">إلغاء</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowExtend(true)} className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg font-bold touch-feedback flex items-center gap-1">
              <PlusCircle className="w-3 h-3" /> تمديد
            </button>
            {(subStatus === 'active' || subStatus === 'trial') && (
              <button onClick={handleSuspend} className="text-xs px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg font-bold touch-feedback flex items-center gap-1">
                <Pause className="w-3 h-3" /> إيقاف
              </button>
            )}
            {(subStatus === 'expired' || subStatus === 'suspended') && (
              <button onClick={() => handleActivate(30)} className="text-xs px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg font-bold touch-feedback flex items-center gap-1">
                <Play className="w-3 h-3" /> تفعيل 30 يوم
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border p-4 space-y-3">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          الإحصائيات
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3 text-white">
            <Users className="w-4 h-4 mb-1 opacity-80" />
            <p className="text-lg font-bold">{clinic.stats?.userCount || 0}</p>
            <p className="text-[10px] opacity-80">المستخدمين</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 text-white">
            <Shield className="w-4 h-4 mb-1 opacity-80" />
            <p className="text-lg font-bold">{clinic.stats?.patientCount || 0}</p>
            <p className="text-[10px] opacity-80">المرضى</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 text-white">
            <FileText className="w-4 h-4 mb-1 opacity-80" />
            <p className="text-lg font-bold">{clinic.stats?.serviceCount || 0}</p>
            <p className="text-[10px] opacity-80">الخدمات</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-3 text-white">
            <CreditCard className="w-4 h-4 mb-1 opacity-80" />
            <p className="text-lg font-bold">{clinic.stats?.invoiceCount || 0}</p>
            <p className="text-[10px] opacity-80">الفواتير</p>
          </div>
        </div>
        {clinic.stats?.totalRevenue > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">إجمالي الإيرادات</span>
            <span className="text-sm font-bold text-green-600">{formatCurrency(clinic.stats.totalRevenue)}</span>
          </div>
        )}
      </div>

      {/* Admin Users Card */}
      {adminUsers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" />
              مدير العيادة ({adminUsers.length})
            </h3>
          </div>
          <div className="divide-y divide-border">
            {adminUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {u.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">+967 {u.phone}</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">مدير</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nurses Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <UserCog className="w-4 h-4 text-blue-600" />
            الممرضون ({nurseUsers.length})
          </h3>
        </div>
        <div className="divide-y divide-border">
          {nurseUsers.map(u => (
            <div key={u.id} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${u.active ? 'bg-blue-500' : 'bg-gray-400'}`}>
                  {u.name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className={`text-sm font-medium ${!u.active ? 'text-muted-foreground line-through' : ''}`}>{u.name}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">+967 {u.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.active ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {u.active ? 'ممرض' : 'معطل'}
                </span>
                <button
                  onClick={() => handleToggleNurseActive(u.id, u.active)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={u.active ? 'تعطيل' : 'تفعيل'}
                >
                  {u.active ? <Pause className="w-3.5 h-3.5 text-yellow-600" /> : <Play className="w-3.5 h-3.5 text-green-600" />}
                </button>
                <button
                  onClick={() => handleDeleteNurse(u.id, u.name)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="حذف"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            </div>
          ))}
          {nurseUsers.length === 0 && (
            <div className="p-4 text-center text-xs text-muted-foreground">لا يوجد ممرضين في هذه العيادة</div>
          )}
        </div>
      </div>

      {/* Reset Data Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-200 dark:border-amber-900/50 overflow-hidden">
        <div className="p-4 border-b border-amber-100 dark:border-amber-900/30">
          <h3 className="text-sm font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <RotateCcw className="w-4 h-4" />
            إعادة تعيين البيانات
          </h3>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground">حذف جميع البيانات التشغيلية (المرضى، الزيارات، الفواتير، الممرضين) مع الاحتفاظ بالعيادة وحساب المدير والإعدادات.</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-2">
              <p className="text-[10px] text-red-600 dark:text-red-400 font-bold">سيحذف</p>
              <p className="text-[9px] text-muted-foreground">المرضى والزيارات</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-2">
              <p className="text-[10px] text-red-600 dark:text-red-400 font-bold">سيحذف</p>
              <p className="text-[9px] text-muted-foreground">الفواتير والممرضين</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-2">
              <p className="text-[10px] text-green-600 dark:text-green-400 font-bold">يُحتفظ</p>
              <p className="text-[9px] text-muted-foreground">الإعدادات والمدير</p>
            </div>
          </div>
          <button
            onClick={() => { setShowResetModal(true); setResetStep(1); }}
            className="w-full h-10 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-sm font-bold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            إعادة تعيين بيانات العيادة
          </button>
        </div>
      </div>

      {/* Danger Zone - Delete Clinic */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-200 dark:border-red-900/50 overflow-hidden">
        <div className="p-4 border-b border-red-100 dark:border-red-900/30">
          <h3 className="text-sm font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-4 h-4" />
            منطقة الخطر
          </h3>
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground mb-3">حذف العيادة سيؤدي لحذف جميع البيانات نهائياً بما في ذلك المرضى والفواتير والزيارات والمستخدمين.</p>
          <button onClick={handleDelete} className="w-full h-10 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
            <Trash2 className="w-4 h-4" />
            حذف العيادة نهائياً
          </button>
        </div>
      </div>

      {/* ═══ RESET DATA MODAL ═══ */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center"
            onClick={(e) => { if (e.target === e.currentTarget) closeResetModal(); }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-border px-4 py-3 flex items-center justify-between">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-amber-600" />
                  إعادة تعيين بيانات {clinic.name}
                </h2>
                <button onClick={closeResetModal} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800">
                  ✕
                </button>
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-gray-200 dark:bg-gray-800">
                <motion.div
                  className="h-full bg-gradient-to-l from-amber-500 to-red-500"
                  animate={{ width: resetStep === 1 ? '50%' : resetStep === 2 ? '100%' : '100%' }}
                />
              </div>

              <div className="p-4">
                {/* STEP 1: Warning */}
                {resetStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-center">
                      <div className="w-14 h-14 mx-auto mb-3 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-7 h-7 text-red-500" />
                      </div>
                      <h3 className="text-base font-bold text-red-700 dark:text-red-400 mb-1">تحذير! إجراء خطير</h3>
                      <p className="text-xs text-red-600/70 dark:text-red-400/70">سيتم حذف جميع البيانات التشغيلية للعيادة نهائياً</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { icon: Users, label: 'المرضى' },
                        { icon: Stethoscope, label: 'الزيارات' },
                        { icon: FileText, label: 'الفواتير' },
                        { icon: Siren, label: 'الطوارئ' },
                        { icon: Bell, label: 'الإشعارات' },
                        { icon: UserCog, label: 'الممرضون' },
                      ].map((item, i) => (
                        <div key={i} className="bg-red-50 dark:bg-red-900/10 rounded-xl p-2.5 flex items-center gap-2">
                          <item.icon className="w-4 h-4 text-red-500" />
                          <span className="text-xs font-bold text-red-600 dark:text-red-400">{item.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-3">
                      <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-2">سيتم الاحتفاظ به:</p>
                      <div className="space-y-1">
                        {[
                          { icon: UserCheck, label: 'حساب مدير العيادة' },
                          { icon: Settings, label: 'إعدادات العيادة' },
                          { icon: LayoutTemplate, label: 'الخدمات الافتراضية (بعد إعادة تحميلها)' },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <item.icon className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-[11px] text-green-700 dark:text-green-400">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setResetStep(2)}
                      className="w-full h-12 bg-gradient-to-l from-amber-500 to-amber-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      فهمت، أريد المتابعة
                    </button>
                  </motion.div>
                )}

                {/* STEP 2: Confirmation */}
                {resetStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-center">
                      <div className="w-12 h-12 mx-auto mb-2 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center">
                        <Lock className="w-6 h-6 text-amber-600" />
                      </div>
                      <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400">تأكيد نهائي</h3>
                    </div>

                    {/* Confirmation text */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">اكتب بالضبط:</label>
                      <div className="bg-gray-50 dark:bg-gray-800 border border-border rounded-xl p-3 text-center">
                        <p className="text-sm font-bold text-red-500 font-mono">{CONFIRM_TEXT}</p>
                      </div>
                      <input
                        type="text"
                        value={resetConfirmText}
                        onChange={(e) => setResetConfirmText(e.target.value)}
                        placeholder={CONFIRM_TEXT}
                        className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border border-border rounded-xl text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                        dir="rtl"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">كلمة مرور الإدارة الرئيسية</label>
                      <div className="relative">
                        <input
                          type={showResetPassword ? 'text' : 'password'}
                          value={resetPassword}
                          onChange={(e) => setResetPassword(e.target.value)}
                          placeholder="أدخل كلمة المرور"
                          className="w-full h-12 px-4 pl-10 bg-gray-50 dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetPassword(!showResetPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleResetData}
                        disabled={resetConfirmText !== CONFIRM_TEXT || !resetPassword}
                        className={`flex-1 h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                          resetConfirmText === CONFIRM_TEXT && resetPassword
                            ? 'bg-gradient-to-l from-amber-500 to-amber-600 text-white active:scale-[0.98]'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <RotateCcw className="w-4 h-4" />
                        تنفيذ إعادة التعيين
                      </button>
                      <button
                        onClick={closeResetModal}
                        className="h-12 px-5 bg-gray-100 dark:bg-gray-800 font-bold rounded-xl text-sm"
                      >
                        إلغاء
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Processing / Success */}
                {resetStep === 3 && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-8 flex flex-col items-center">
                    {resetProcessing ? (
                      <>
                        <div className="relative mb-4">
                          <div className="w-16 h-16 rounded-full border-4 border-amber-200 flex items-center justify-center">
                            <Loader2 className="w-7 h-7 text-amber-500 animate-spin" />
                          </div>
                        </div>
                        <h3 className="text-base font-bold mb-1">جارٍ إعادة التعيين</h3>
                        <p className="text-xs text-muted-foreground">يرجى الانتظار، لا تغلق التطبيق...</p>
                      </>
                    ) : resetSuccess ? (
                      <>
                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-4">
                          <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-base font-bold mb-1">تم بنجاح!</h3>
                        <p className="text-xs text-muted-foreground mb-4 text-center">تم إعادة تعيين بيانات العيادة مع الاحتفاظ بالإعدادات والمدير</p>
                        <button
                          onClick={() => { closeResetModal(); loadClinic(); }}
                          className="w-full h-12 bg-gradient-to-l from-green-500 to-green-600 text-white font-bold rounded-xl active:scale-[0.98] transition-all"
                        >
                          تم
                        </button>
                      </>
                    ) : null}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
