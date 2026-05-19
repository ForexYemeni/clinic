'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, Stethoscope, CreditCard, User as UserIcon, Banknote } from 'lucide-react';
import { formatCurrency } from '@/lib/constants';

interface SuccessCardService {
  name: string;
  price: number;
}

interface SuccessCardProps {
  visible: boolean;
  onClose: () => void;
  type: 'visit' | 'emergency' | 'payment';
  title: string;
  patientName?: string;
  services?: SuccessCardService[];
  total?: number;
  paid?: number;
  remaining?: number;
  invoiceId?: string;
  message?: string;
}

export function SuccessCard({
  visible,
  onClose,
  type,
  title,
  patientName,
  services = [],
  total,
  paid,
  remaining,
  invoiceId,
  message,
}: SuccessCardProps) {
  const headerGradient = type === 'payment'
    ? 'from-green-500 to-clinic-500'
    : type === 'emergency'
    ? 'from-red-500 to-orange-500'
    : 'from-clinic-500 to-clinic-500';

  const isPaidInFull = remaining !== undefined && remaining <= 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Header */}
            <div className={`bg-gradient-to-l ${headerGradient} p-5 text-center text-white relative`}>
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-7 h-7 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
              >
                <X className="w-4 h-4" />
              </button>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.15, damping: 12 }}
                className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm"
              >
                {type === 'payment' ? (
                  <Banknote className="w-9 h-9" />
                ) : (
                  <CheckCircle className="w-9 h-9" />
                )}
              </motion.div>
              <h3 className="text-lg font-bold">{title}</h3>
              {message && <p className="text-xs opacity-80 mt-1">{message}</p>}
              {type === 'payment' && isPaidInFull && (
                <div className="mt-2 inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-bold">مدفوع بالكامل</span>
                </div>
              )}
            </div>

            {/* Card Content */}
            <div className="p-4 space-y-3">
              {/* Patient */}
              {patientName && (
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  <div className="w-10 h-10 bg-clinic-100 dark:bg-clinic-900/30 rounded-xl flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-clinic-600 dark:text-clinic-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">المريض</p>
                    <p className="text-sm font-bold">{patientName}</p>
                  </div>
                </div>
              )}

              {/* Services */}
              {services.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Stethoscope className="w-4 h-4 text-clinic-600 dark:text-clinic-400" />
                    <p className="text-xs font-bold">الخدمات ({services.length})</p>
                  </div>
                  <div className="space-y-1.5">
                    {services.map((svc, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{svc.name}</span>
                        <span className="font-medium">{formatCurrency(svc.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoice / Payment Info */}
              {total !== undefined && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-clinic-600 dark:text-clinic-400" />
                    <p className="text-xs font-bold">{type === 'payment' ? 'تفاصيل الدفع' : 'الفاتورة'}</p>
                    {invoiceId && (
                      <span className="text-[10px] text-muted-foreground mr-auto" dir="ltr">#{invoiceId}</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>الإجمالي</span>
                      <span className="font-bold text-foreground">{formatCurrency(total)}</span>
                    </div>
                    {paid !== undefined && (
                      <div className="flex justify-between text-xs">
                        <span>المدفوع</span>
                        <span className="font-medium text-green-600">{formatCurrency(paid)}</span>
                      </div>
                    )}
                    {remaining !== undefined && remaining > 0 && (
                      <div className="flex justify-between text-xs">
                        <span>المتبقي</span>
                        <span className="font-bold text-red-600">{formatCurrency(remaining)}</span>
                      </div>
                    )}
                  </div>
                  {/* Payment Progress */}
                  <div className="mt-2">
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isPaidInFull ? 'bg-green-500' : 'bg-clinic-500'}`}
                        style={{ width: `${total > 0 ? Math.min(100, ((paid || 0) / total) * 100) : 0}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-center mt-1 text-muted-foreground">
                      {total > 0 ? Math.round(((paid || 0) / total) * 100) : 0}% مدفوع
                    </p>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-full h-11 bg-gradient-to-l to-clinic-600 to-clinic-600 text-white font-bold rounded-xl shadow-lg shadow-clinic-500/20 active:scale-[0.98] transition-transform"
              >
                تم
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
