'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, CreditCard, Clock, CheckCircle, AlertCircle, User, Stethoscope, Banknote, Receipt } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatDate, formatRelativeTime, statusColors, statusLabels, paymentMethodLabels, type InvoiceItem } from '@/lib/constants';

export function FinanceManagement() {
  const { setScreen } = useAppStore();
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');
  const [stats, setStats] = useState({ totalRevenue: 0, paidAmount: 0, remainingAmount: 0, totalInvoices: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, repRes] = await Promise.all([
          fetch('/api/invoices'),
          fetch('/api/reports?type=daily'),
        ]);
        if (invRes.ok) {
          const invData = await invRes.json();
          setInvoices(invData);
          const totalRevenue = invData.reduce((s: number, i: InvoiceItem) => s + i.total, 0);
          const paidAmount = invData.reduce((s: number, i: InvoiceItem) => s + i.paid, 0);
          setStats({ totalRevenue, paidAmount, remainingAmount: totalRevenue - paidAmount, totalInvoices: invData.length });
        }
        if (repRes.ok) {
          const repData = await repRes.json();
          if (repData.todayRevenue) setStats(prev => ({ ...prev, totalRevenue: repData.todayRevenue }));
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePayInvoice = async (invoiceId: string, remaining: number) => {
    const amount = prompt(`أدخل المبلغ المدفوع (المتبقي: ${formatCurrency(remaining)}):`);
    if (!amount) return;
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paid: Number(amount) }),
      });
      if (res.ok) {
        setInvoices(prev => prev.map(inv => {
          if (inv.id === invoiceId) {
            const newPaid = inv.paid + Number(amount);
            const newRemaining = inv.total - newPaid;
            return { ...inv, paid: newPaid, remaining: newRemaining, status: newRemaining <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid' };
          }
          return inv;
        }));
      }
    } catch {}
  };

  const filteredInvoices = invoices.filter(i => filter === 'all' || i.status === filter);

  if (loading) {
    return <div className="p-4 space-y-3 pb-24">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>;
  }

  return (
    <div className="p-4 pb-24">
      <h2 className="text-lg font-bold mb-4">الإدارة المالية</h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-clinic-500 to-clinic-600 rounded-xl p-3 text-white text-center shadow-lg shadow-clinic-500/20">
          <DollarSign className="w-5 h-5 mx-auto mb-1" />
          <p className="text-xs opacity-80">الإجمالي</p>
          <p className="text-sm font-bold">{formatCurrency(stats.totalRevenue)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 text-white text-center shadow-lg shadow-green-500/20">
          <CheckCircle className="w-5 h-5 mx-auto mb-1" />
          <p className="text-xs opacity-80">المدفوع</p>
          <p className="text-sm font-bold">{formatCurrency(stats.paidAmount)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-3 text-white text-center shadow-lg shadow-red-500/20">
          <AlertCircle className="w-5 h-5 mx-auto mb-1" />
          <p className="text-xs opacity-80">المتبقي</p>
          <p className="text-sm font-bold">{formatCurrency(stats.remainingAmount)}</p>
        </motion.div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {[
          { id: 'all' as const, label: 'الكل' },
          { id: 'unpaid' as const, label: 'غير مدفوع' },
          { id: 'partial' as const, label: 'جزئي' },
          { id: 'paid' as const, label: 'مدفوع' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filter === f.id ? 'bg-clinic-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Invoices */}
      <div className="space-y-3">
        {filteredInvoices.map((inv, idx) => (
          <motion.div
            key={inv.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.03, 0.3) }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-border overflow-hidden shadow-sm"
          >
            {/* Header row: Patient + Status + Payment Method */}
            <div className="p-3.5 pb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-clinic-100 dark:bg-clinic-900/30 rounded-xl flex items-center justify-center">
                    <User className="w-4 h-4 text-clinic-600 dark:text-clinic-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{inv.patient?.name || 'مريض'}</p>
                    <p className="text-[10px] text-muted-foreground">{formatRelativeTime(inv.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {/* Payment method badge */}
                  {inv.paymentMethod && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-muted-foreground flex items-center gap-1">
                      {inv.paymentMethod === 'cash' ? <Banknote className="w-2.5 h-2.5" /> : 
                       inv.paymentMethod === 'card' ? <CreditCard className="w-2.5 h-2.5" /> : 
                       <Receipt className="w-2.5 h-2.5" />}
                      {paymentMethodLabels[inv.paymentMethod] || inv.paymentMethod}
                    </span>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[inv.status] || ''}`}>
                    {statusLabels[inv.status] || inv.status}
                  </span>
                </div>
              </div>

              {/* Nurse/Admin name - Professional badge */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-lg">
                  <div className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                    <Stethoscope className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">
                    {inv.nurseName || inv.nurseId || 'مدير العيادة'}
                  </span>
                </div>
                <span className="text-[9px] text-muted-foreground">مقدم الإجراء</span>
              </div>
            </div>

            {/* Service items */}
            {inv.items && inv.items.length > 0 && (
              <div className="px-3.5 pb-2">
                <div className="bg-gray-50 dark:bg-gray-750 dark:bg-gray-900/30 rounded-xl p-2.5 space-y-1.5">
                  {inv.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-clinic-500" />
                        {item.serviceName}
                      </span>
                      <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer: Payment info */}
            <div className="px-3.5 py-2.5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">الإجمالي</span>
                  <span className="font-bold">{formatCurrency(inv.total)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-green-600 dark:text-green-400">المدفوع</span>
                  <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(inv.paid)}</span>
                </div>
                {inv.remaining > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-red-600 dark:text-red-400">المتبقي</span>
                    <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(inv.remaining)}</span>
                  </div>
                )}
              </div>
              {inv.remaining > 0 && (
                <button
                  onClick={() => handlePayInvoice(inv.id, inv.remaining)}
                  className="px-3 py-1.5 bg-clinic-600 text-white text-xs font-bold rounded-lg active:scale-[0.97] transition-transform shadow-sm"
                >
                  تسديد
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredInvoices.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">لا توجد فواتير</p>
        </div>
      )}
    </div>
  );
}
