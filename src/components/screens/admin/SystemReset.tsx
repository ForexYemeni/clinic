'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Shield,
  Trash2,
  CheckCircle,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  Users,
  Stethoscope,
  FileText,
  Siren,
  Bell,
  UserCog,
  Settings,
  LayoutTemplate,
  UserCheck,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CONFIRM_TEXT = 'حذف جميع البيانات';

const deletedItems = [
  { icon: Users, label: 'المرضى', desc: 'جميع بيانات المرضى وسجلاتهم' },
  { icon: Stethoscope, label: 'الزيارات', desc: 'جميع سجلات الزيارات والمتابعات' },
  { icon: FileText, label: 'الفواتير', desc: 'جميع الفواتير والمدفوعات' },
  { icon: Siren, label: 'الحالات الطارئة', desc: 'جميع سجلات الطوارئ' },
  { icon: Bell, label: 'الإشعارات', desc: 'جميع الإشعارات والتنبيهات' },
  { icon: UserCog, label: 'الممرضون', desc: 'جميع حسابات الممرضين' },
];

const keptItems = [
  { icon: UserCheck, label: 'حساب المدير', desc: 'بيانات الدخول والصلاحيات' },
  { icon: Settings, label: 'إعدادات العيادة', desc: 'الإعدادات العامة والتخصيص' },
  { icon: LayoutTemplate, label: 'قوالب الخدمات', desc: 'الخدمات والأسعار المعرفة' },
];

export function SystemReset() {
  const { user, setScreen } = useAppStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [confirmInput, setConfirmInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const isConfirmValid = confirmInput === CONFIRM_TEXT;
  const isPasswordValid = password.length >= 4;
  const canProceed = isConfirmValid && isPasswordValid;

  const handleNextToStep2 = () => {
    setStep(2);
  };

  const handleReset = async () => {
    if (!user) return;

    setStep(3);
    setIsProcessing(true);

    try {
      const res = await fetch('/api/data-reset-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPassword: password,
          adminId: user.id,
        }),
      });

      if (res.ok) {
        setIsProcessing(false);
        setIsSuccess(true);
        toast.success('تم إرسال طلب حذف البيانات بنجاح');
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'فشل إرسال الطلب');
      }
    } catch (err: unknown) {
      setIsProcessing(false);
      const message = err instanceof Error ? err.message : 'حدث خطأ أثناء إرسال الطلب';
      toast.error(message);
      setStep(2);
    }
  };

  const handleSuccessDone = () => {
    setScreen('admin-dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-950 pb-24" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur-md border-b border-gray-800">
        <div className="flex items-center gap-3 px-4 h-14">
          {step !== 3 && (
            <button
              onClick={() => (step === 1 ? setScreen('admin-settings') : setStep((step - 1) as 1 | 2))}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-800 active:scale-95 transition-transform"
            >
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <h1 className="text-base font-bold text-white flex-1">إعادة تعيين النظام</h1>
          {step !== 3 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <span className={step >= 1 ? 'text-red-400' : ''}>١</span>
              <span>/</span>
              <span className={step >= 2 ? 'text-red-400' : ''}>٢</span>
              <span>/</span>
              <span className={step >= 3 ? 'text-red-400' : ''}>٣</span>
            </div>
          )}
        </div>

        {/* Step progress bar */}
        <div className="h-0.5 bg-gray-800">
          <motion.div
            className="h-full bg-gradient-to-l from-red-500 to-amber-500"
            initial={false}
            animate={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ============ STEP 1: WARNING ============ */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.3 }}
            className="px-4 pt-6"
          >
            {/* Big warning banner */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-red-950/60 border border-red-800/60 rounded-2xl p-5 mb-6 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-3 bg-red-900/50 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-lg font-bold text-red-300 mb-2">تحذير! إجراء خطير</h2>
              <p className="text-sm text-red-400/80 leading-relaxed">
                هذا الإجراء سيحذف جميع البيانات التشغيلية بشكل نهائي ولا يمكن التراجع عنه
              </p>
            </motion.div>

            {/* What gets DELETED */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Trash2 className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-bold text-red-400">سيتم حذفه نهائيًا</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {deletedItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="bg-red-950/30 border border-red-900/40 rounded-xl p-3"
                  >
                    <item.icon className="w-5 h-5 text-red-400 mb-1.5" />
                    <p className="text-xs font-bold text-red-300">{item.label}</p>
                    <p className="text-[10px] text-red-400/60 mt-0.5">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* What STAYS */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-clinic-400" />
                <h3 className="text-sm font-bold text-clinic-400">سيتم الاحتفاظ به</h3>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {keptItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.06 }}
                    className="bg-clinic-950/30 border border-clinic-900/40 rounded-xl p-3 flex items-center gap-3"
                  >
                    <div className="w-9 h-9 bg-clinic-900/40 rounded-lg flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-clinic-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-clinic-300">{item.label}</p>
                      <p className="text-[10px] text-clinic-400/60">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Proceed button */}
            <button
              onClick={handleNextToStep2}
              className="w-full h-13 bg-gradient-to-l from-red-600 to-red-700 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.97] transition-transform shadow-lg shadow-red-900/30"
            >
              <AlertTriangle className="w-4 h-4" />
              فهمت، أريد المتابعة
            </button>
          </motion.div>
        )}

        {/* ============ STEP 2: CONFIRMATION ============ */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.3 }}
            className="px-4 pt-6"
          >
            {/* Scary confirmation header */}
            <div className="bg-red-950/60 border border-red-800/60 rounded-2xl p-5 mb-6 text-center">
              <div className="w-14 h-14 mx-auto mb-3 bg-red-900/50 rounded-full flex items-center justify-center">
                <Lock className="w-7 h-7 text-red-400" />
              </div>
              <h2 className="text-lg font-bold text-red-300 mb-2">تأكيد نهائي</h2>
              <p className="text-sm text-red-400/80 leading-relaxed">
                يرجى إدخال النص المطلوب وكلمة المرور لتأكيد العملية
              </p>
            </div>

            {/* Confirmation text input */}
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-400 mb-2 block">
                اكتب بالضبط:
              </label>
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 mb-2 text-center">
                <p className="text-sm font-bold text-red-400 tracking-wide font-mono">
                  {CONFIRM_TEXT}
                </p>
              </div>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={CONFIRM_TEXT}
                className="w-full h-12 px-4 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 text-center font-mono"
                dir="rtl"
              />
              {confirmInput.length > 0 && !isConfirmValid && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[11px] text-red-400 mt-1.5 text-center"
                >
                  النص غير مطابق، يرجى إدخال النص بالضبط كما هو موضح
                </motion.p>
              )}
              {isConfirmValid && (
                <motion.p
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-[11px] text-clinic-400 mt-1.5 text-center flex items-center justify-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  النص مطابق
                </motion.p>
              )}
            </div>

            {/* Password input */}
            <div className="mb-8">
              <label className="text-xs font-medium text-gray-400 mb-2 block">
                كلمة مرور المدير
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="w-full h-12 px-4 pl-11 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                  dir="rtl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 active:scale-90 transition-transform"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Execute button */}
            <button
              onClick={handleReset}
              disabled={!canProceed}
              className={`w-full h-13 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                canProceed
                  ? 'bg-gradient-to-l from-red-600 to-red-700 text-white active:scale-[0.97] shadow-lg shadow-red-900/30'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              تنفيذ إعادة التعيين
            </button>

            {!canProceed && (
              <p className="text-[11px] text-gray-600 text-center mt-3">
                يجب إدخال نص التأكيد وكلمة المرور لتفعيل الزر
              </p>
            )}
          </motion.div>
        )}

        {/* ============ STEP 3: PROCESSING / SUCCESS ============ */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.3 }}
            className="px-4 pt-6"
          >
            {isProcessing ? (
              /* Processing state */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-full border-4 border-red-900/30 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
                  </div>
                  <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-red-500 animate-spin" />
                </div>
                <h2 className="text-lg font-bold text-white mb-2">جارٍ إعادة التعيين</h2>
                <p className="text-sm text-gray-500">يرجى الانتظار، لا تغلق التطبيق...</p>
              </motion.div>
            ) : isSuccess ? (
              /* Success state */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-clinic-900/50 border-2 border-clinic-500/40 flex items-center justify-center mb-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.3 }}
                  >
                    <CheckCircle className="w-10 h-10 text-clinic-400" />
                  </motion.div>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-xl font-bold text-white mb-2"
                >
                  تم إرسال الطلب!
                </motion.p>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-sm text-gray-400 text-center leading-relaxed mb-2"
                >
                  تم إرسال طلب حذف البيانات إلى الإدارة الرئيسية
                </motion.p>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="text-xs text-gray-600 text-center leading-relaxed mb-8"
                >
                  سيتم مراجعة الطلب والموافقة عليه أو رفضه من قبل الإدارة الرئيسية. لن يتم حذف أي بيانات حتى تتم الموافقة.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="w-full"
                >
                  <button
                    onClick={handleSuccessDone}
                    className="w-full h-12 bg-gradient-to-l to-clinic-600 to-clinic-700 text-white rounded-2xl text-sm font-bold active:scale-[0.97] transition-transform shadow-lg shadow-clinic-900/30"
                  >
                    العودة للوحة التحكم
                  </button>
                </motion.div>
              </motion.div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
