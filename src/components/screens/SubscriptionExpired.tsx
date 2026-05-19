'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, Shield, Phone } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export function SubscriptionExpired() {
  const { clinicName, subscription, logout } = useAppStore();
  const status = subscription.status;
  const daysRemaining = subscription.daysRemaining;

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

        {/* Contact Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 text-center">
          <Phone className="w-5 h-5 text-blue-600 mx-auto mb-2" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            للتجديد أو الاستفسار، تواصل مع إدارة المنصة
          </p>
        </div>

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
