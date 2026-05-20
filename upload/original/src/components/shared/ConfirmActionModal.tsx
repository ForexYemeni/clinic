'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, PlusCircle, Trash2, Loader2, type LucideIcon } from 'lucide-react';

interface ConfirmActionModalProps {
  visible: boolean;
  type: 'suspend' | 'activate' | 'extend' | 'delete' | 'danger';
  title: string;
  subtitle?: string;
  details?: { label: string; value: string }[];
  message?: string;
  messageIcon?: LucideIcon;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  processing?: boolean;
  icon?: LucideIcon;
}

const typeConfig: Record<string, {
  gradient: string;
  shadow: string;
  iconBg: string;
  confirmBg: string;
  confirmText: string;
  defaultIcon: LucideIcon;
  messageTitleColor: string;
  messageIconBg: string;
}> = {
  suspend: {
    gradient: 'bg-gradient-to-br from-yellow-500 to-amber-600',
    shadow: 'shadow-yellow-500/30',
    iconBg: 'bg-yellow-200/20',
    confirmBg: 'bg-white text-yellow-700',
    confirmText: 'نعم، إيقاف',
    defaultIcon: AlertTriangle,
    messageTitleColor: 'text-yellow-100',
    messageIconBg: 'bg-yellow-200/20',
  },
  activate: {
    gradient: 'bg-gradient-to-br from-green-500 to-emerald-600',
    shadow: 'shadow-green-500/30',
    iconBg: 'bg-green-200/20',
    confirmBg: 'bg-white text-green-700',
    confirmText: 'نعم، تفعيل',
    defaultIcon: CheckCircle,
    messageTitleColor: 'text-green-100',
    messageIconBg: 'bg-green-200/20',
  },
  extend: {
    gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    shadow: 'shadow-blue-500/30',
    iconBg: 'bg-blue-200/20',
    confirmBg: 'bg-white text-blue-700',
    confirmText: 'نعم، تمديد',
    defaultIcon: PlusCircle,
    messageTitleColor: 'text-blue-100',
    messageIconBg: 'bg-blue-200/20',
  },
  delete: {
    gradient: 'bg-gradient-to-br from-red-500 to-red-600',
    shadow: 'shadow-red-500/30',
    iconBg: 'bg-red-200/20',
    confirmBg: 'bg-white text-red-700',
    confirmText: 'نعم، حذف',
    defaultIcon: Trash2,
    messageTitleColor: 'text-red-100',
    messageIconBg: 'bg-red-200/20',
  },
  danger: {
    gradient: 'bg-gradient-to-br from-red-500 to-orange-600',
    shadow: 'shadow-red-500/30',
    iconBg: 'bg-orange-200/20',
    confirmBg: 'bg-white text-red-700',
    confirmText: 'تأكيد',
    defaultIcon: AlertTriangle,
    messageTitleColor: 'text-orange-100',
    messageIconBg: 'bg-orange-200/20',
  },
};

export function ConfirmActionModal({
  visible,
  type,
  title,
  subtitle,
  details,
  message,
  messageIcon,
  confirmLabel,
  onConfirm,
  onCancel,
  processing = false,
  icon,
}: ConfirmActionModalProps) {
  const config = typeConfig[type] || typeConfig.danger;
  const IconComponent = icon || config.defaultIcon;
  const MessageIcon = messageIcon || config.defaultIcon;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => !processing && onCancel()}
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
              <div className={`rounded-3xl shadow-2xl relative overflow-hidden ${config.gradient} ${config.shadow}`}>
                {/* Decorative circles */}
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
                <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full" />
                <div className="absolute top-1/2 -right-4 w-16 h-16 bg-white/5 rounded-full" />

                {/* Close button */}
                <button
                  onClick={onCancel}
                  disabled={processing}
                  className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center z-10 backdrop-blur-sm disabled:opacity-50"
                >
                  <X className="w-4 h-4 text-white" />
                </button>

                <div className="relative p-5">
                  {/* Header with icon and title */}
                  <div className="flex flex-col items-center text-center mb-5">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-3 bg-white/20">
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-lg font-bold text-white">{title}</p>
                    {subtitle && (
                      <p className="text-xs text-white/70 mt-0.5">{subtitle}</p>
                    )}
                  </div>

                  {/* Details card */}
                  {details && details.length > 0 && (
                    <div className="bg-white/10 rounded-2xl p-4 mb-4 backdrop-blur-sm space-y-2">
                      {details.map((detail, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-white/70">{detail.label}</span>
                          <span className="font-bold text-white">{detail.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Warning/success/info message */}
                  {message && (
                    <div className="bg-white/10 rounded-2xl p-4 mb-4 backdrop-blur-sm">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-xl ${config.messageIconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <MessageIcon className="w-4 h-4 text-white/80" />
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${config.messageTitleColor}`}>{title}</p>
                          <p className="text-xs text-white/80 leading-relaxed">{message}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={onConfirm}
                      disabled={processing}
                      className={`flex-1 h-12 rounded-xl text-sm font-bold active:scale-[0.97] transition-transform shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 ${config.confirmBg}`}
                    >
                      {processing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <IconComponent className="w-5 h-5" />
                      )}
                      {confirmLabel || config.confirmText}
                    </button>
                    <button
                      onClick={onCancel}
                      disabled={processing}
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
  );
}
