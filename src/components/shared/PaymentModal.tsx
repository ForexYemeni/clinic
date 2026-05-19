'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, CheckCircle, Clock, CreditCard, Banknote } from 'lucide-react';
import { formatCurrency } from '@/lib/constants';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (amount: number, method: string) => void;
  invoiceId: string;
  patientName: string;
  total: number;
  currentPaid: number;
  remaining: number;
  loading?: boolean;
}

export function PaymentModal({
  visible,
  onClose,
  onConfirm,
  invoiceId,
  patientName,
  total,
  currentPaid,
  remaining,
  loading = false,
}: PaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [quickAmount, setQuickAmount] = useState<'full' | 'half' | 'custom'>('full');

  const handleAmountChange = (val: string) => {
    const num = val.replace(/[^\d]/g, '');
    setAmount(num);
    setQuickAmount('custom');
  };

  const handleQuickAmount = (type: 'full' | 'half') => {
    setQuickAmount(type);
    if (type === 'full') {
      setAmount(String(remaining));
    } else if (type === 'half') {
      setAmount(String(Math.ceil(remaining / 2)));
    }
  };

  const handleConfirm = () => {
    const numAmount = Number(amount);
    if (numAmount <= 0) return;
    if (numAmount > remaining) {
      onConfirm(remaining, method);
    } else {
      onConfirm(numAmount, method);
    }
  };

  const paymentMethods = [
    { id: 'cash', label: 'نقدي', icon: Banknote, color: 'bg-clinic-50 dark:bg-clinic-900/20 text-clinic-700 dark:text-clinic-400 border-clinic-300 dark:border-clinic-700' },
    { id: 'card', label: 'بطاقة', icon: CreditCard, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700' },
    { id: 'transfer', label: 'تحويل', icon: DollarSign, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700' },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle Bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-4 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">تسديد فاتورة</h3>
                <p className="text-xs text-muted-foreground">{patientName} - #{invoiceId}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Invoice Summary */}
            <div className="mx-4 mb-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">الإجمالي</span>
                <span className="font-bold">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">المدفوع سابقاً</span>
                <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(currentPaid)}</span>
              </div>
              <div className="border-t border-dashed border-gray-200 dark:border-gray-600 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-red-600 dark:text-red-400">المتبقي</span>
                  <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(remaining)}</span>
                </div>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="px-4 mb-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">المبلغ</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  onClick={() => handleQuickAmount('full')}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                    quickAmount === 'full'
                      ? 'bg-clinic-600 text-white shadow-sm shadow-clinic-500/20'
                      : 'bg-gray-100 dark:bg-gray-700 text-muted-foreground'
                  }`}
                >
                  المبلغ الكامل
                  <br />
                  <span className="text-xs font-normal opacity-80">{formatCurrency(remaining)}</span>
                </button>
                <button
                  onClick={() => handleQuickAmount('half')}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                    quickAmount === 'half'
                      ? 'bg-clinic-600 text-white shadow-sm shadow-clinic-500/20'
                      : 'bg-gray-100 dark:bg-gray-700 text-muted-foreground'
                  }`}
                >
                  نصف المبلغ
                  <br />
                  <span className="text-xs font-normal opacity-80">{formatCurrency(Math.ceil(remaining / 2))}</span>
                </button>
              </div>

              {/* Custom Amount Input */}
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="أدخل مبلغ آخر"
                  className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-700 border border-border rounded-xl text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-clinic-500 focus:bg-white dark:focus:bg-gray-600"
                  dir="ltr"
                />
                {amount && (
                  <button
                    onClick={() => { setAmount(''); setQuickAmount('custom'); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="px-4 mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">طريقة الدفع</p>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => setMethod(pm.id)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all ${
                      method === pm.id ? pm.color : 'bg-gray-50 dark:bg-gray-700 border-transparent text-muted-foreground'
                    }`}
                  >
                    <pm.icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{pm.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Confirm Button */}
            <div className="px-4 pb-6">
              <button
                onClick={handleConfirm}
                disabled={!amount || Number(amount) <= 0 || loading}
                className="w-full h-12 bg-gradient-to-l to-clinic-600 to-clinic-600 text-white font-bold rounded-xl shadow-lg shadow-clinic-500/20 disabled:opacity-50 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    تسديد {amount ? formatCurrency(Math.min(Number(amount), remaining)) : ''}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
