'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Building2, Users, Clock, CreditCard, AlertTriangle, Database, ChevronLeft, Plus, Search, Moon, Sun, Key, ScrollText, FileText, BarChart3, Trash2, RotateCcw, Eye, EyeOff, Loader2, CheckCircle, Lock, Phone, MessageCircle, X, Pause, Play, PlusCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/constants';

// ═══ Data Reset Requests Section ═══
interface DataResetRequest {
  id: string;
  clinicId: string;
  clinicName: string;
  adminId: string;
  adminName: string;
  adminPhone: string;
  status: string;
  createdAt: string;
}

function DataResetRequestsSection() {
  const { user } = useAppStore();
  const [requests, setRequests] = useState<DataResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showApproveCard, setShowApproveCard] = useState<DataResetRequest | null>(null);
  const [superAdminPassword, setSuperAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const data = await apiGet<DataResetRequest[]>('/api/data-reset-requests');
      setRequests(data);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); const interval = setInterval(fetchRequests, 30000); return () => clearInterval(interval); }, [fetchRequests]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    try {
      await apiPut('/api/data-reset-requests', {
        id,
        action,
        superAdminPassword: action === 'approve' ? superAdminPassword : undefined,
      });
      toast.success(action === 'approve' ? 'تمت الموافقة وتنفيذ الحذف' : 'تم رفض الطلب');
      setShowApproveCard(null);
      setSuperAdminPassword('');
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || 'خطأ');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading || requests.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
        <Trash2 className="w-4 h-4 text-red-500" />
        طلبات حذف البيانات
        <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">{requests.length}</span>
      </h3>

      {/* Approve confirmation card */}
      <AnimatePresence>
        {showApproveCard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden"
          >
            <div className="absolute -top-6 -left-6 w-20 h-20 bg-white/5 rounded-full" />
            <button onClick={() => { setShowApproveCard(null); setSuperAdminPassword(''); }} className="absolute top-3 left-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center z-10">
              <X className="w-3.5 h-3.5 text-white" />
            </button>
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">تأكيد حذف بيانات {showApproveCard.clinicName}</p>
                  <p className="text-[10px] text-white/70">هذا الإجراء لا يمكن التراجع عنه</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-2.5 mb-3 space-y-1 text-xs backdrop-blur-sm">
                <div className="flex justify-between"><span className="text-white/70">المدير</span><span className="font-bold">{showApproveCard.adminName}</span></div>
                <div className="flex justify-between"><span className="text-white/70">الهاتف</span><span className="font-medium" dir="ltr">{showApproveCard.adminPhone}</span></div>
                <div className="flex justify-between"><span className="text-white/70">التاريخ</span><span className="font-medium">{formatDate(showApproveCard.createdAt)}</span></div>
              </div>
              <div className="mb-3">
                <label className="text-[10px] text-white/70 mb-1 block">كلمة مرور الإدارة الرئيسية</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={superAdminPassword}
                    onChange={e => setSuperAdminPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    className="w-full h-10 px-4 pl-10 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAction(showApproveCard.id, 'approve')} disabled={processingId === showApproveCard.id || !superAdminPassword} className="flex-1 h-10 bg-white text-red-600 rounded-xl text-sm font-bold active:scale-[0.97] transition-transform shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5">
                  {processingId === showApproveCard.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  موافقة وتنفيذ الحذف
                </button>
                <button onClick={() => { setShowApproveCard(null); setSuperAdminPassword(''); }} className="flex-1 h-10 bg-white/20 text-white rounded-xl text-sm font-medium backdrop-blur-sm active:scale-[0.97] transition-transform">
                  إلغاء
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {requests.map(req => (
        <motion.div
          key={req.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-red-200 dark:border-red-800 p-3.5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">{req.clinicName}</p>
              <p className="text-xs text-muted-foreground">طلب من: {req.adminName} • {formatDate(req.createdAt)}</p>
            </div>
            <span className="text-[9px] px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold">حذف بيانات</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowApproveCard(req)} disabled={processingId === req.id} className="flex-1 h-9 bg-red-600 text-white rounded-xl text-xs font-bold active:scale-[0.97] transition-transform disabled:opacity-50 flex items-center justify-center gap-1">
              {processingId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              موافقة
            </button>
            <button onClick={() => handleAction(req.id, 'reject')} disabled={processingId === req.id} className="flex-1 h-9 bg-gray-100 dark:bg-gray-700 text-muted-foreground rounded-xl text-xs font-bold active:scale-[0.97] transition-transform disabled:opacity-50">
              رفض
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

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
  primaryColor?: string;
  logo?: string;
  address?: string;
  description?: string;
}

interface Props {
  initialTab?: 'dashboard' | 'clinics' | 'add' | 'firebase' | 'settings';
}

export function SuperAdminDashboard({ initialTab = 'dashboard' }: Props) {
  const { setScreen, setSelectedClinicId, theme, toggleTheme } = useAppStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clinics' | 'add' | 'firebase' | 'settings'>(initialTab);
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

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Support contact state
  const [supportPhone, setSupportPhone] = useState('');
  const [supportWhatsApp, setSupportWhatsApp] = useState('');
  const [savingContact, setSavingContact] = useState(false);

  // Platform reset state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2 | 3>(1);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetProcessing, setResetProcessing] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const RESET_CONFIRM_TEXT = 'حذف كامل المنصة';

  // Clinic action confirmation card state
  const [showClinicActionCard, setShowClinicActionCard] = useState<{
    type: 'suspend' | 'activate' | 'extend';
    clinicId: string;
    clinicName: string;
    days?: number;
  } | null>(null);
  const [clinicActionProcessing, setClinicActionProcessing] = useState(false);

  // Sync tab with initialTab prop
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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

  useEffect(() => { loadClinics(); loadPlatformSettings(); }, []);

  const loadPlatformSettings = async () => {
    try {
      const data = await apiGet<any>('/api/platform');
      if (data.supportPhone) setSupportPhone(data.supportPhone);
      if (data.supportWhatsApp) setSupportWhatsApp(data.supportWhatsApp);
    } catch {}
  };

  const handleSaveContact = async () => {
    setSavingContact(true);
    try {
      await apiPut('/api/platform', { supportPhone, supportWhatsApp });
      toast.success('تم حفظ معلومات التواصل');
    } catch (err: any) {
      toast.error(err.message || 'خطأ في حفظ المعلومات');
    } finally {
      setSavingContact(false);
    }
  };

  const handleAddClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClinicName || !newAdminPhone) {
      toast.error('يرجى إدخال اسم العيادة ورقم هاتف المدير');
      return;
    }
    setAddingClinic(true);
    try {
      await apiPost('/api/super-admin/clinics', {
        name: newClinicName,
        phone: newClinicPhone || newAdminPhone,
        ownerPhone: newAdminPhone,
        adminName: newAdminName || 'مدير العيادة',
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
    setClinicActionProcessing(true);
    try {
      await apiPut(`/api/super-admin/clinics/${clinicId}`, { action: 'suspend' });
      toast.success('تم إيقاف العيادة');
      setShowClinicActionCard(null);
      loadClinics();
    } catch (err: any) {
      toast.error(err.message || 'خطأ');
    } finally {
      setClinicActionProcessing(false);
    }
  };

  const handleActivateClinic = async (clinicId: string, days: number = 30) => {
    setClinicActionProcessing(true);
    try {
      await apiPut(`/api/super-admin/clinics/${clinicId}`, { action: 'activate', days, subscriptionType: 'monthly' });
      toast.success('تم تفعيل العيادة');
      setShowClinicActionCard(null);
      loadClinics();
    } catch (err: any) {
      toast.error(err.message || 'خطأ');
    } finally {
      setClinicActionProcessing(false);
    }
  };

  const handleExtendClinic = async (clinicId: string, days: number) => {
    setClinicActionProcessing(true);
    try {
      await apiPut(`/api/super-admin/clinics/${clinicId}`, { action: 'extend_subscription', days, subscriptionType: 'monthly' });
      toast.success(`تم التمديد ${days} يوم`);
      setShowClinicActionCard(null);
      loadClinics();
    } catch (err: any) {
      toast.error(err.message || 'خطأ');
    } finally {
      setClinicActionProcessing(false);
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    setChangingPassword(true);
    try {
      await apiPut('/api/users/me', { currentPassword, newPassword });
      toast.success('تم تغيير كلمة المرور بنجاح');
      setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
    } catch (err: any) {
      toast.error(err.message || 'خطأ في تغيير كلمة المرور');
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePlatformReset = async () => {
    if (resetConfirmText !== RESET_CONFIRM_TEXT || !resetPassword) return;
    setResetStep(3);
    setResetProcessing(true);
    try {
      await apiDelete('/api/platform/reset', {
        superAdminPassword: resetPassword,
        confirmText: resetConfirmText,
      });
      setResetProcessing(false);
      setResetSuccess(true);
      toast.success('تم حذف جميع بيانات المنصة بنجاح');
      loadClinics();
    } catch (err: any) {
      setResetProcessing(false);
      toast.error(err.message || 'خطأ في إعادة تعيين المنصة');
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
  const totalPatients = clinics.reduce((sum, c) => sum + (c.patientCount || 0), 0);

  // ═══ DASHBOARD TAB ═══
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
            <p className="text-2xl font-bold">{totalPatients}</p>
            <p className="text-xs opacity-80">إجمالي المرضى</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground">إجراءات سريعة</h3>
          <button onClick={() => setScreen('super-admin-add-clinic')} className="w-full flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-700 dark:text-purple-300 touch-feedback">
            <Plus className="w-5 h-5" />
            <div className="text-right">
              <p className="text-sm font-bold">إضافة عيادة جديدة</p>
              <p className="text-xs opacity-70">إنشاء عيادة بفترة تجريبية</p>
            </div>
          </button>
          <button onClick={() => setScreen('super-admin-clinics')} className="w-full flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-700 dark:text-blue-300 touch-feedback">
            <Building2 className="w-5 h-5" />
            <div className="text-right">
              <p className="text-sm font-bold">إدارة العيادات</p>
              <p className="text-xs opacity-70">عرض وتعديل وحذف العيادات</p>
            </div>
          </button>
          <button onClick={() => setScreen('super-admin-audit-logs')} className="w-full flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-700 dark:text-amber-300 touch-feedback">
            <ScrollText className="w-5 h-5" />
            <div className="text-right">
              <p className="text-sm font-bold">سجل المراجعة</p>
              <p className="text-xs opacity-70">تتبع جميع العمليات والإجراءات</p>
            </div>
          </button>
          <button onClick={() => setScreen('super-admin-firebase-config')} className="w-full flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-orange-700 dark:text-orange-300 touch-feedback">
            <Database className="w-5 h-5" />
            <div className="text-right">
              <p className="text-sm font-bold">إعدادات Firebase</p>
              <p className="text-xs opacity-70">ربط قاعدة بيانات Firebase جديدة</p>
            </div>
          </button>
        </div>

        {/* Subscription Summary */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground">ملخص الاشتراكات</h3>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">فترة تجريبية</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{clinics.filter(c => c.subscription?.type === 'trial').length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">اشتراك نشط</span>
              <span className="text-sm font-bold text-green-600 dark:text-green-400">{clinics.filter(c => c.subscription?.status === 'active' && c.subscription?.type !== 'trial').length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">موقوفة</span>
              <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{clinics.filter(c => c.subscription?.status === 'suspended').length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">منتهية</span>
              <span className="text-sm font-bold text-red-600 dark:text-red-400">{expiredClinics}</span>
            </div>
          </div>
        </div>

        {/* Data Reset Requests */}
        <DataResetRequestsSection />

        {/* Recent Clinics */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground">آخر العيادات</h3>
          {clinics.slice(0, 5).map(clinic => (
            <div key={clinic.id} onClick={() => { setSelectedClinicId(clinic.id); setScreen('super-admin-clinic-detail'); }} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-border cursor-pointer active:scale-[0.98] transition-transform">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 flex items-center justify-center">
                  {clinic.logo ? (
                    <img src={clinic.logo} alt="" className="w-6 h-6 object-contain rounded" />
                  ) : (
                    <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold">{clinic.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(clinic.createdAt)}</p>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-full ${statusColor(clinic.subscription?.status || 'expired')}`}>
                {statusLabel(clinic.subscription?.status || 'expired')}
              </span>
            </div>
          ))}
          {clinics.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">لا توجد عيادات بعد</p>
              <button onClick={() => setScreen('super-admin-add-clinic')} className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-xl border border-purple-200 dark:border-purple-800 text-sm font-bold active:scale-[0.97] transition-all">
                <Plus className="w-4 h-4" /> إضافة عيادة جديدة
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══ CLINICS LIST TAB ═══
  if (activeTab === 'clinics') {
    return (
      <div className="p-4 space-y-4 pb-20">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setScreen('super-admin-dashboard')} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800">
            <ChevronLeft className="w-5 h-5 rotate-180" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold">إدارة العيادات</h2>
            <p className="text-xs text-muted-foreground">{filteredClinics.length} عيادة</p>
          </div>
          <button onClick={() => setScreen('super-admin-add-clinic')} className="h-9 w-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Plus className="w-5 h-5" />
          </button>
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
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 flex items-center justify-center">
                        {clinic.logo ? (
                          <img src={clinic.logo} alt="" className="w-7 h-7 object-contain rounded" />
                        ) : (
                          <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold">{clinic.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{clinic.phone} • {clinic.userCount} مستخدم • {clinic.patientCount} مريض</p>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full ${statusColor(clinic.subscription?.status || 'expired')}`}>
                      {statusLabel(clinic.subscription?.status || 'expired')}
                    </span>
                  </div>

                  {/* Subscription Info */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{clinic.subscription?.type === 'trial' ? 'تجريبي' : clinic.subscription?.type === 'lifetime' ? 'مدى الحياة' : clinic.subscription?.type === 'yearly' ? 'سنوي' : 'شهري'}</span>
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
                      <button onClick={() => setShowClinicActionCard({ type: 'suspend', clinicId: clinic.id, clinicName: clinic.name })}
                        className="text-xs px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg font-bold touch-feedback">
                        إيقاف
                      </button>
                    )}
                    {clinic.subscription?.status === 'expired' && (
                      <button onClick={() => setShowClinicActionCard({ type: 'activate', clinicId: clinic.id, clinicName: clinic.name, days: 30 })}
                        className="text-xs px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg font-bold touch-feedback">
                        تفعيل 30 يوم
                      </button>
                    )}
                    {clinic.subscription?.status === 'suspended' && (
                      <button onClick={() => setShowClinicActionCard({ type: 'activate', clinicId: clinic.id, clinicName: clinic.name, days: 30 })}
                        className="text-xs px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg font-bold touch-feedback">
                        إعادة تفعيل
                      </button>
                    )}
                    <button onClick={() => setShowClinicActionCard({ type: 'extend', clinicId: clinic.id, clinicName: clinic.name, days: 30 })}
                      className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg font-bold touch-feedback">
                      تمديد 30 يوم
                    </button>
                  </div>
                </motion.div>
              );
            })}
            {filteredClinics.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">لا توجد نتائج</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ Clinic Action Confirmation Modal ═══ */}
        <AnimatePresence>
          {showClinicActionCard && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                onClick={() => !clinicActionProcessing && setShowClinicActionCard(null)}
              />

              {/* Centered Modal Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
              >
                <div className="w-full max-w-sm pointer-events-auto">
                  <div
                    className={`rounded-3xl shadow-2xl relative overflow-hidden ${
                      showClinicActionCard.type === 'suspend'
                        ? 'bg-gradient-to-br from-yellow-500 to-amber-600 shadow-yellow-500/30'
                        : showClinicActionCard.type === 'activate'
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/30'
                        : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30'
                    }`}
                  >
                    {/* Decorative circles */}
                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
                    <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full" />
                    <div className="absolute top-1/2 -right-4 w-16 h-16 bg-white/5 rounded-full" />

                    {/* Close button */}
                    <button
                      onClick={() => setShowClinicActionCard(null)}
                      disabled={clinicActionProcessing}
                      className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center z-10 backdrop-blur-sm disabled:opacity-50"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>

                    <div className="relative p-5">
                      {/* Header with icon and title */}
                      <div className="flex flex-col items-center text-center mb-5">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-3 bg-white/20">
                          {showClinicActionCard.type === 'suspend' ? (
                            <Pause className="w-8 h-8 text-white" />
                          ) : showClinicActionCard.type === 'activate' ? (
                            <Play className="w-8 h-8 text-white" />
                          ) : (
                            <PlusCircle className="w-8 h-8 text-white" />
                          )}
                        </div>
                        <p className="text-lg font-bold text-white">
                          {showClinicActionCard.type === 'suspend' ? 'إيقاف العيادة'
                            : showClinicActionCard.type === 'activate' ? 'تفعيل العيادة'
                            : 'تمديد الاشتراك'}
                        </p>
                        <p className="text-xs text-white/70 mt-0.5">{showClinicActionCard.clinicName}</p>
                      </div>

                      {/* Action details card */}
                      <div className="bg-white/10 rounded-2xl p-4 mb-4 backdrop-blur-sm space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">اسم العيادة</span>
                          <span className="font-bold text-white">{showClinicActionCard.clinicName}</span>
                        </div>
                        {showClinicActionCard.type === 'activate' && (
                          <div className="flex justify-between text-sm">
                            <span className="text-white/70">مدة التفعيل</span>
                            <span className="font-bold text-white">{showClinicActionCard.days} يوم</span>
                          </div>
                        )}
                        {showClinicActionCard.type === 'extend' && (
                          <div className="flex justify-between text-sm">
                            <span className="text-white/70">مدة التمديد</span>
                            <span className="font-bold text-white">{showClinicActionCard.days} يوم</span>
                          </div>
                        )}
                      </div>

                      {/* Warning message */}
                      {showClinicActionCard.type === 'suspend' && (
                        <div className="bg-white/10 rounded-2xl p-4 mb-4 backdrop-blur-sm">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-yellow-200/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <AlertTriangle className="w-4 h-4 text-yellow-200" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-yellow-100">تحذير</p>
                              <p className="text-xs text-white/80 leading-relaxed">سيتم إيقاف العيادة فوراً ولن يتمكن مدير العيادة أو الممرضون من الدخول للنظام حتى يتم تفعيلها مرة أخرى</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {showClinicActionCard.type === 'activate' && (
                        <div className="bg-white/10 rounded-2xl p-4 mb-4 backdrop-blur-sm">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-green-200/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <CheckCircle className="w-4 h-4 text-green-200" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-green-100">تفعيل العيادة</p>
                              <p className="text-xs text-white/80 leading-relaxed">سيتم تفعيل العيادة وإضافة {showClinicActionCard.days} يوم للاشتراك</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {showClinicActionCard.type === 'extend' && (
                        <div className="bg-white/10 rounded-2xl p-4 mb-4 backdrop-blur-sm">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-200/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <PlusCircle className="w-4 h-4 text-blue-200" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-blue-100">تمديد الاشتراك</p>
                              <p className="text-xs text-white/80 leading-relaxed">سيتم إضافة {showClinicActionCard.days} يوم إلى اشتراك العيادة الحالي</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            if (showClinicActionCard.type === 'suspend') {
                              handleSuspendClinic(showClinicActionCard.clinicId);
                            } else if (showClinicActionCard.type === 'activate') {
                              handleActivateClinic(showClinicActionCard.clinicId, showClinicActionCard.days);
                            } else {
                              handleExtendClinic(showClinicActionCard.clinicId, showClinicActionCard.days || 30);
                            }
                          }}
                          disabled={clinicActionProcessing}
                          className={`flex-1 h-12 rounded-xl text-sm font-bold active:scale-[0.97] transition-transform shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 bg-white ${
                            showClinicActionCard.type === 'suspend'
                              ? 'text-yellow-700'
                              : showClinicActionCard.type === 'activate'
                              ? 'text-green-700'
                              : 'text-blue-700'
                          }`}
                        >
                          {clinicActionProcessing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              {showClinicActionCard.type === 'suspend' ? <Pause className="w-5 h-5" />
                                : showClinicActionCard.type === 'activate' ? <Play className="w-5 h-5" />
                                : <PlusCircle className="w-5 h-5" />}
                            </>
                          )}
                          {showClinicActionCard.type === 'suspend' ? 'نعم، إيقاف العيادة'
                            : showClinicActionCard.type === 'activate' ? 'نعم، تفعيل العيادة'
                            : 'نعم، تمديد الاشتراك'}
                        </button>
                        <button
                          onClick={() => setShowClinicActionCard(null)}
                          disabled={clinicActionProcessing}
                          className="flex-1 h-12 bg-white/20 text-white rounded-xl text-sm font-bold backdrop-blur-sm active:scale-[0.97] transition-transform disabled:opacity-50"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ═══ ADD CLINIC TAB ═══
  if (activeTab === 'add') {
    return (
      <div className="p-4 space-y-4 pb-20">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setScreen('super-admin-clinics')} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800">
            <ChevronLeft className="w-5 h-5 rotate-180" />
          </button>
          <h2 className="text-lg font-bold">إضافة عيادة جديدة</h2>
        </div>

        <form onSubmit={handleAddClinic} className="space-y-4">
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
            <h3 className="text-sm font-bold text-purple-800 dark:text-purple-300 mb-1">معلومات العيادة</h3>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">اسم العيادة *</label>
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

          {subType === 'trial' && (
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
          )}

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-1">معلومات مدير العيادة</h3>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">اسم المدير *</label>
            <input type="text" value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} placeholder="الاسم الكامل"
              className="w-full h-12 px-4 bg-white dark:bg-gray-800 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">رقم هاتف المدير *</label>
            <input type="tel" value={newAdminPhone} onChange={(e) => setNewAdminPhone(e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="7XXXXXXXX"
              className="w-full h-12 px-4 bg-white dark:bg-gray-800 border border-border rounded-xl text-base font-mono focus:outline-none focus:ring-2 focus:ring-purple-500" dir="ltr" inputMode="numeric" required />
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

  // ═══ FIREBASE CONFIG TAB ═══
  if (activeTab === 'firebase') {
    return (
      <div className="p-4 space-y-4 pb-20">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setScreen('super-admin-settings')} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800">
            <ChevronLeft className="w-5 h-5 rotate-180" />
          </button>
          <div>
            <h2 className="text-lg font-bold">إعدادات Firebase</h2>
            <p className="text-xs text-muted-foreground">ربط قاعدة بيانات Firebase جديدة</p>
          </div>
        </div>

        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
          <p className="text-xs text-orange-700 dark:text-orange-300">
            تحذير: تغيير إعدادات Firebase سيؤثر على اتصال التطبيق بقاعدة البيانات. تأكد من صحة البيانات قبل الحفظ.
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

  // ═══ SETTINGS TAB ═══
  if (activeTab === 'settings') {
    return (
      <>
        <div className="p-4 space-y-4 pb-20">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => setScreen('super-admin-dashboard')} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800">
              <ChevronLeft className="w-5 h-5 rotate-180" />
            </button>
            <h2 className="text-lg font-bold">إعدادات المنصة</h2>
          </div>

          {/* Support Contact Info */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Phone className="w-4 h-4" />
                معلومات التواصل
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                رقم التواصل الذي يظهر للعيادات عند انتهاء الاشتراك أو إيقاف الحساب. يمكنهم الاتصال أو مراسلة واتساب مباشرة.
              </p>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">رقم الهاتف للدعم</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">967+</div>
                  <input
                    type="tel"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    placeholder="7XXXXXXXX"
                    className="w-full h-10 px-3 pl-12 bg-gray-50 dark:bg-gray-700 border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">رقم واتساب (إن مختلف)</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">967+</div>
                  <input
                    type="tel"
                    value={supportWhatsApp}
                    onChange={(e) => setSupportWhatsApp(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    placeholder="اتركه فارغاً لاستخدام رقم الهاتف"
                    className="w-full h-10 px-3 pl-12 bg-gray-50 dark:bg-gray-700 border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    dir="ltr"
                  />
                </div>
              </div>
              {supportPhone && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2.5 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  <span className="text-[11px] text-blue-700 dark:text-blue-300">
                    المعاينة: اتصال أو واتساب على {supportPhone}
                  </span>
                </div>
              )}
              <button
                onClick={handleSaveContact}
                disabled={savingContact}
                className="w-full h-10 bg-blue-600 text-white text-sm font-bold rounded-xl disabled:opacity-60 active:scale-[0.98] transition-all"
              >
                {savingContact ? 'جارٍ الحفظ...' : 'حفظ معلومات التواصل'}
              </button>
            </div>
          </div>

          {/* Appearance */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Moon className="w-4 h-4" />
                المظهر
              </h3>
            </div>
            <button onClick={toggleTheme} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-3">
                {theme === 'light' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-blue-500" />}
                <div className="text-right">
                  <p className="text-sm font-medium">الوضع</p>
                  <p className="text-xs text-muted-foreground">{theme === 'light' ? 'فاتح' : 'داكن'}</p>
                </div>
              </div>
              <div className={`w-12 h-7 rounded-full transition-colors ${theme === 'dark' ? 'bg-purple-600' : 'bg-gray-200'} relative`}>
                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${theme === 'dark' ? 'translate-x-5.5 left-0' : 'left-0.5'}`} />
              </div>
            </button>
          </div>

          {/* Security */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Key className="w-4 h-4" />
                الأمان
              </h3>
            </div>

            <form onSubmit={handleChangePassword} className="p-4 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">كلمة المرور الحالية</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="أدخل كلمة المرور الحالية"
                  className="w-full h-10 px-3 bg-gray-50 dark:bg-gray-700 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">كلمة المرور الجديدة</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="6 أحرف على الأقل"
                  className="w-full h-10 px-3 bg-gray-50 dark:bg-gray-700 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">تأكيد كلمة المرور الجديدة</label>
                <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="أعد كتابة كلمة المرور"
                  className="w-full h-10 px-3 bg-gray-50 dark:bg-gray-700 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" required />
              </div>
              <button type="submit" disabled={changingPassword} className="w-full h-10 bg-purple-600 text-white text-sm font-bold rounded-xl disabled:opacity-60 active:scale-[0.98] transition-all">
                {changingPassword ? 'جارٍ التغيير...' : 'تغيير كلمة المرور'}
              </button>
            </form>
          </div>

          {/* Platform */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Database className="w-4 h-4" />
                قاعدة البيانات
              </h3>
            </div>
            <button onClick={() => setScreen('super-admin-firebase-config')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-orange-500" />
                <div className="text-right">
                  <p className="text-sm font-medium">إعدادات Firebase</p>
                  <p className="text-xs text-muted-foreground">ربط قاعدة بيانات Firebase جديدة</p>
                </div>
              </div>
              <ChevronLeft className="w-4 h-4 rotate-90 text-muted-foreground" />
            </button>
          </div>

          {/* Reports */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                التقارير
              </h3>
            </div>
            <button onClick={() => setScreen('super-admin-audit-logs')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <ScrollText className="w-5 h-5 text-amber-500" />
                <div className="text-right">
                  <p className="text-sm font-medium">سجل المراجعة</p>
                  <p className="text-xs text-muted-foreground">عرض جميع العمليات والإجراءات</p>
                </div>
              </div>
              <ChevronLeft className="w-4 h-4 rotate-90 text-muted-foreground" />
            </button>
          </div>

          {/* ═══ Danger Zone - Full Platform Reset ═══ */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-red-200 dark:border-red-900/50 overflow-hidden">
            <div className="p-4 border-b border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
              <h3 className="text-sm font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4" />
                منطقة الخطر
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                حذف كامل المنصة سيؤدي إلى إزالة جميع العيادات وبياناتها نهائياً بما في ذلك المرضى والزيارات والفواتير والممرضين والإشعارات وجميع سجلات المراجعة. سيتم الاحتفاظ بحساب الإدارة الرئيسية فقط.
              </p>

              {/* What will be deleted */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Building2, label: 'جميع العيادات', color: 'red' },
                  { icon: Users, label: 'جميع المرضى', color: 'red' },
                  { icon: FileText, label: 'جميع الفواتير', color: 'red' },
                  { icon: CreditCard, label: 'جميع الاشتراكات', color: 'red' },
                  { icon: ScrollText, label: 'سجلات المراجعة', color: 'red' },
                  { icon: Database, label: 'جميع الخدمات', color: 'red' },
                ].map((item, i) => (
                  <div key={i} className="bg-red-50 dark:bg-red-900/10 rounded-xl p-2.5 flex items-center gap-2">
                    <item.icon className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-bold text-red-600 dark:text-red-400">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* What will be kept */}
              <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-3">
                <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-1">سيتم الاحتفاظ به:</p>
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-[11px] text-green-700 dark:text-green-400">حساب الإدارة الرئيسية فقط</span>
                </div>
              </div>

              <button
                onClick={() => { setShowResetModal(true); setResetStep(1); }}
                className="w-full h-12 bg-gradient-to-l from-red-500 to-red-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-red-200 dark:shadow-none"
              >
                <Trash2 className="w-5 h-5" />
                حذف كامل بيانات المنصة
              </button>
            </div>
          </div>
        </div>

        {/* ═══ PLATFORM RESET MODAL ═══ */}
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
                  <h2 className="text-base font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                    حذف كامل المنصة
                  </h2>
                  <button onClick={closeResetModal} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800">
                    ✕
                  </button>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-gray-200 dark:bg-gray-800">
                  <motion.div
                    className="h-full bg-gradient-to-l from-red-500 to-red-700"
                    animate={{ width: resetStep === 1 ? '50%' : resetStep === 2 ? '100%' : '100%' }}
                  />
                </div>

                <div className="p-4">
                  {/* STEP 1: Warning */}
                  {resetStep === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-center">
                        <div className="w-16 h-16 mx-auto mb-3 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-base font-bold text-red-700 dark:text-red-400 mb-1">تحذير! إجراء لا يمكن التراجع عنه</h3>
                        <p className="text-xs text-red-600/70 dark:text-red-400/70">سيتم حذف جميع بيانات المنصة نهائياً ولن يمكن استرجاعها</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { icon: Building2, label: 'جميع العيادات' },
                          { icon: Users, label: 'جميع المرضى' },
                          { icon: FileText, label: 'جميع الفواتير والزيارات' },
                          { icon: CreditCard, label: 'جميع الاشتراكات' },
                          { icon: ScrollText, label: 'سجلات المراجعة' },
                          { icon: Database, label: 'الخدمات والإشعارات' },
                        ].map((item, i) => (
                          <div key={i} className="bg-red-50 dark:bg-red-900/10 rounded-xl p-2.5 flex items-center gap-2">
                            <item.icon className="w-4 h-4 text-red-500" />
                            <span className="text-xs font-bold text-red-600 dark:text-red-400">{item.label}</span>
                          </div>
                        ))}
                      </div>

                      <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-3">
                        <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-1">سيتم الاحتفاظ به فقط:</p>
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-[11px] text-green-700 dark:text-green-400">حساب الإدارة الرئيسية (مع كلمة المرور)</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setResetStep(2)}
                        className="w-full h-12 bg-gradient-to-l from-red-500 to-red-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        فهمت، أريد المتابعة
                      </button>
                    </motion.div>
                  )}

                  {/* STEP 2: Confirmation */}
                  {resetStep === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-2 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                          <Lock className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-sm font-bold text-red-700 dark:text-red-400">تأكيد نهائي - لا يمكن التراجع</h3>
                      </div>

                      {/* Confirmation text */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">اكتب بالضبط:</label>
                        <div className="bg-gray-50 dark:bg-gray-800 border border-border rounded-xl p-3 text-center">
                          <p className="text-sm font-bold text-red-500 font-mono">{RESET_CONFIRM_TEXT}</p>
                        </div>
                        <input
                          type="text"
                          value={resetConfirmText}
                          onChange={(e) => setResetConfirmText(e.target.value)}
                          placeholder={RESET_CONFIRM_TEXT}
                          className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border border-border rounded-xl text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
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
                            className="w-full h-12 px-4 pl-10 bg-gray-50 dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
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
                          onClick={handlePlatformReset}
                          disabled={resetConfirmText !== RESET_CONFIRM_TEXT || !resetPassword}
                          className={`flex-1 h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                            resetConfirmText === RESET_CONFIRM_TEXT && resetPassword
                              ? 'bg-gradient-to-l from-red-500 to-red-600 text-white active:scale-[0.98]'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                          تنفيذ حذف كامل المنصة
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
                            <div className="w-16 h-16 rounded-full border-4 border-red-200 flex items-center justify-center">
                              <Loader2 className="w-7 h-7 text-red-500 animate-spin" />
                            </div>
                          </div>
                          <h3 className="text-base font-bold mb-1">جارٍ حذف بيانات المنصة</h3>
                          <p className="text-xs text-muted-foreground">يرجى الانتظار، لا تغلق التطبيق...</p>
                        </>
                      ) : resetSuccess ? (
                        <>
                          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                          </div>
                          <h3 className="text-base font-bold mb-1">تم بنجاح!</h3>
                          <p className="text-xs text-muted-foreground mb-4 text-center">تم حذف جميع بيانات المنصة. تم الاحتفاظ بحساب الإدارة الرئيسية فقط.</p>
                          <button
                            onClick={() => { closeResetModal(); loadClinics(); }}
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
      </>
    );
  }

  return null;
}
