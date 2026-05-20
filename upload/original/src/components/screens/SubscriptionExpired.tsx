'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle, Shield, Phone, MessageCircle, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface PlatformContact {
  supportPhone: string;
  supportWhatsApp: string;
}

export function SubscriptionExpired() {
  const { clinicName, subscription, logout } = useAppStore();
  const status = subscription.status;
  const daysRemaining = subscription.daysRemaining;
  const [contact, setContact] = useState<PlatformContact | null>(null);
  const [showCallCard, setShowCallCard] = useState(false);

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const res = await fetch('/api/platform');
        if (res.ok) {
          const data = await res.json();
          setContact({
            supportPhone: data.supportPhone || '',
            supportWhatsApp: data.supportWhatsApp || '',
          });
        }
      } catch {}
    };
    fetchContact();
  }, []);

  const supportPhone = contact?.supportPhone || '';
  const supportWhatsApp = contact?.supportWhatsApp || contact?.supportPhone || '';
  const hasPhone = supportPhone.length > 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-3xl flex items-center justify-center shadow-xl mb-6"
      >
        {status === 'suspended' ? (
          <AlertTriangle className="w-12 h-12 text-white" />
        ) : (
          <Clock className="w-12 h-12 text-white" />
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {status === 'suspended' ? 'الحساب موقوف' : 'انتهى الاشتراك'}
        </h1>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          {status === 'suspended'
            ? `حساب عيادة "${clinicName}" موقوف حالياً. تواصل مع إدارة المنصة لإعادة التفعيل.`
            : `انتهت فترة اشتراك عيادة "${clinicName}". تواصل مع إدارة المنصة لتجديد الاشتراك.`}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-xs space-y-3"
      >
        {/* Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-bold">{clinicName}</p>
              <p className="text-xs text-muted-foreground">
                حالة الاشتراك: {status === 'suspended' ? 'موقوف' : 'منتهي'}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>تاريخ الانتهاء</span>
              <span className="font-mono">{subscription.endDate ? new Date(subscription.endDate).toLocaleDateString('ar-SA') : '—'}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>الأيام المتبقية</span>
              <span className={`font-bold ${daysRemaining > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                {daysRemaining > 0 ? daysRemaining : 0} يوم
              </span>
            </div>
          </div>
        </div>

        {/* Contact Admin - Professional Card */}
        <AnimatePresence>
          {showCallCard ? (
            <motion.div
              key="call-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 shadow-lg shadow-blue-500/20 relative"
            >
              <button
                onClick={() => setShowCallCard(false)}
                className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"
              >
                <X className="w-3 h-3 text-white" />
              </button>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">تواصل مع إدارة المنصة</p>
                  <p className="text-[10px] text-white/80">للتجديد أو الاستفسار أو إعادة التفعيل</p>
                </div>
              </div>

              {hasPhone ? (
                <div className="space-y-2">
                  {/* Call button */}
                  <a
                    href={`tel:+967${supportPhone}`}
                    className="flex items-center justify-center gap-2 h-11 bg-white text-blue-600 rounded-xl text-sm font-bold shadow-sm active:scale-[0.97] transition-transform"
                  >
                    <Phone className="w-4 h-4" />
                    اتصال: {supportPhone}
                  </a>

                  {/* WhatsApp button */}
                  {supportWhatsApp && (
                    <a
                      href={`https://wa.me/967${supportWhatsApp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 h-11 bg-green-500 text-white rounded-xl text-sm font-bold shadow-sm active:scale-[0.97] transition-transform"
                    >
                      <MessageCircle className="w-4 h-4" />
                      واتساب
                    </a>
                  )}
                </div>
              ) : (
                <div className="bg-white/20 rounded-xl p-3 text-center">
                  <p className="text-xs text-white/90">لم يتم إضافة رقم تواصل بعد</p>
                  <p className="text-[10px] text-white/70 mt-1">يرجى التواصل مع مشرف النظام</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.button
              key="contact-btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCallCard(true)}
              className="w-full bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 text-center active:scale-[0.98] transition-transform border border-blue-200 dark:border-blue-800"
            >
              <Phone className="w-5 h-5 text-blue-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
                للتجديد أو الاستفسار، تواصل مع إدارة المنصة
              </p>
              <p className="text-[10px] text-blue-500 dark:text-blue-400 mt-1">اضغط للتواصل</p>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full h-12 bg-gray-100 dark:bg-gray-800 text-foreground font-bold rounded-xl active:scale-[0.98] transition-all"
        >
          تسجيل الخروج
        </button>
      </motion.div>
    </div>
  );
}
