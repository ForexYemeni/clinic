'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, CreditCard, Clock, CheckCircle, AlertCircle, XCircle, Stethoscope, RefreshCw, Banknote } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatDate, statusColors, statusLabels, type InvoiceItem } from '@/lib/constants';
import { PaymentModal } from '@/components/shared/PaymentModal';
import { SuccessCard } from '@/components/shared/SuccessCard';
import { toast } from 'sonner';

export function NurseFinance() {
  const { user } = useAppStore();
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');
  const [stats, setStats] = useState({ totalRevenue: 0, paidAmount: 0, remainingAmount: 0, totalInvoices: 0 });

  // Payment modal state
  const [paymentModal, setPaymentModal] = useState<{
    visible: boolean;
    invoice: InvoiceItem | null;
  }>({ visible: false, invoice: null });
  const [paying, setPaying] = useState(false);

  // Success card state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{
    patientName: string;
    total: number;
    paid: number;
    remaining: number;
  }>({ patientName: '', total: 0, paid: 0, remaining: 0 });

  const fetchInvoices = useCallback(async () => {
    try {
      const invRes = await fetch('/api/invoices');
      if (invRes.ok) {
        const invData = await invRes.json();
        setInvoices(invData);
        const totalRevenue = invData.reduce((s: number, i: InvoiceItem) => s + i.total, 0);
        const paidAmount = invData.reduce((s: number, i: InvoiceItem) => s + i.paid, 0);
        setStats({ totalRevenue, paidAmount, remainingAmount: totalRevenue - paidAmount, totalInvoices: invData.length });
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const filteredInvoices = invoices.filter(i => filter === 'all' || i.status === filter);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'unpaid': return <XCircle className="w-4 h-4" />;
      case 'partial': return <Clock className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'paid': return 'from-green-500 to-emerald-600';
      case 'unpaid': return 'from-red-500 to-red-600';
      case 'partial': return 'from-yellow-500 to-amber-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const handlePayClick = (inv: InvoiceItem) => {
    setPaymentModal({ visible: true, invoice: inv });
  };

  const handlePaymentConfirm = async (amount: number, method: string) => {
    const inv = paymentModal.invoice;
    if (!inv) return;

    setPaying(true);
    try {
      const res = await fetch(`/api/invoices/${inv.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paid: amount }),
      });

      if (res.ok) {
        const newPaid = inv.paid + amount;
        const newRemaining = inv.total - newPaid;
        const newStatus = newRemaining <= 0 ? 'paid' : 'partial';

        // Update local state
        setInvoices(prev => prev.map(i => {
          if (i.id === inv.id) {
            return { ...i, paid: newPaid, remaining: Math.max(0, newRemaining), status: newStatus };
          }
          return i;
        }));

        // Recalculate stats
        const updatedInvoices = invoices.map(i => {
          if (i.id === inv.id) return { ...i, paid: newPaid, remaining: Math.max(0, newRemaining), status: newStatus };
          return i;
        });
        const totalRevenue = updatedInvoices.reduce((s, i) => s + i.total, 0);
        const paidAmount = updatedInvoices.reduce((s, i) => s + i.paid, 0);
        setStats({ totalRevenue, paidAmount, remainingAmount: totalRevenue - paidAmount, totalInvoices: updatedInvoices.length });

        // Close modal & show success
        setPaymentModal({ visible: false, invoice: null });

        setSuccessData({
          patientName: inv.patient?.name || 'مريض',
          total: inv.total,
          paid: newPaid,
          remaining: Math.max(0, newRemaining),
        });
        setShowSuccess(true);
      } else {
        toast.error('خطأ في تسجيل الدفع');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return <div className="p-4 space-y-3 pb-24">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>;
  }

  return (
    <div className="p-4 pb-24">
      <h2 className="text-lg font-bold mb-4">المالية</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-3 text-white text-center shadow-lg shadow-emerald-500/20">
          <DollarSign className="w-5 h-5 mx-auto mb-1 opacity-80" />
          <p className="text-[10px] opacity-80">الإجمالي</p>
          <p className="text-sm font-bold">{formatCurrency(stats.totalRevenue)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-3 text-white text-center shadow-lg shadow-green-500/20">
          <CheckCircle className="w-5 h-5 mx-auto mb-1 opacity-80" />
          <p className="text-[10px] opacity-80">المدفوع</p>
          <p className="text-sm font-bold">{formatCurrency(stats.paidAmount)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-3 text-white text-center shadow-lg shadow-red-500/20">
          <AlertCircle className="w-5 h-5 mx-auto mb-1 opacity-80" />
          <p className="text-[10px] opacity-80">المتبقي</p>
          <p className="text-sm font-bold">{formatCurrency(stats.remainingAmount)}</p>
        </motion.div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
        {[
          { id: 'all' as const, label: 'الكل', count: invoices.length },
          { id: 'unpaid' as const, label: 'غير مدفوع', count: invoices.filter(i => i.status === 'unpaid').length },
          { id: 'partial' as const, label: 'جزئي', count: invoices.filter(i => i.status === 'partial').length },
          { id: 'paid' as const, label: 'مدفوع', count: invoices.filter(i => i.status === 'paid').length },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filter === f.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground'
            }`}
          >
            {f.label}
            {f.count > 0 && (
              <span className={`text-[10px] px-1.5 rounded-full ${filter === f.id ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'}`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Invoice Cards */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredInvoices.map((inv, index) => (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-border overflow-hidden shadow-sm"
            >
              {/* Invoice Header with Status */}
              <div className={`bg-gradient-to-l ${getStatusBg(inv.status)} p-3 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(inv.status)}
                    <div>
                      <p className="font-bold text-sm">{inv.patient?.name || inv.patientName || 'مريض'}</p>
                      <p className="text-[10px] opacity-80">فاتورة #{inv.id.slice(-6)}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-medium bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
                      {statusLabels[inv.status] || inv.status}
                    </span>
                    <p className="text-[10px] opacity-80 mt-1">{formatDate(inv.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Invoice Items */}
              <div className="p-3">
                {inv.items && inv.items.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {inv.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
                            <Stethoscope className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-xs font-medium">{item.serviceName}</p>
                            <p className="text-[10px] text-muted-foreground">الكمية: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Totals */}
                <div className="border-t border-dashed border-border pt-2 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">الإجمالي</span>
                    <span className="font-bold text-foreground">{formatCurrency(inv.total)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">المدفوع</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(inv.paid)}</span>
                  </div>
                  {inv.remaining > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">المتبقي</span>
                      <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(inv.remaining)}</span>
                    </div>
                  )}
                </div>

                {/* Payment Progress Bar */}
                <div className="mt-2">
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        inv.status === 'paid' ? 'bg-green-500' : inv.status === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, inv.total > 0 ? (inv.paid / inv.total) * 100 : 0)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center mt-1">
                    {inv.total > 0 ? Math.round((inv.paid / inv.total) * 100) : 0}% مدفوع
                  </p>
                </div>

                {/* Pay Button */}
                {inv.remaining > 0 && (
                  <button
                    onClick={() => handlePayClick(inv)}
                    className="w-full mt-3 h-10 bg-gradient-to-l from-emerald-600 to-teal-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20 active:scale-[0.98] transition-transform"
                  >
                    <Banknote className="w-4 h-4" />
                    تسديد {formatCurrency(inv.remaining)}
                  </button>
                )}

                {/* Paid stamp */}
                {inv.status === 'paid' && (
                  <div className="mt-3 flex items-center justify-center gap-2 py-2 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">مدفوع بالكامل</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredInvoices.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="w-12 h-12 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground mt-3 text-sm">لا توجد فواتير</p>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal.invoice && (
        <PaymentModal
          visible={paymentModal.visible}
          onClose={() => setPaymentModal({ visible: false, invoice: null })}
          onConfirm={handlePaymentConfirm}
          invoiceId={paymentModal.invoice.id.slice(-6)}
          patientName={paymentModal.invoice.patient?.name || paymentModal.invoice.patientName || 'مريض'}
          total={paymentModal.invoice.total}
          currentPaid={paymentModal.invoice.paid}
          remaining={paymentModal.invoice.remaining}
          loading={paying}
        />
      )}

      {/* Payment Success Card */}
      <SuccessCard
        visible={showSuccess}
        onClose={() => setShowSuccess(false)}
        type="payment"
        title="تم تسجيل الدفع بنجاح"
        patientName={successData.patientName}
        total={successData.total}
        paid={successData.paid}
        remaining={successData.remaining}
      />
    </div>
  );
}
