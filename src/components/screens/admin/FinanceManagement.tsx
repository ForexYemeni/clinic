'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, CreditCard, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatDate, statusColors, statusLabels, type InvoiceItem } from '@/lib/constants';

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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-3 text-white text-center">
          <DollarSign className="w-5 h-5 mx-auto mb-1" />
          <p className="text-xs opacity-80">الإجمالي</p>
          <p className="text-sm font-bold">{formatCurrency(stats.totalRevenue)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 text-white text-center">
          <CheckCircle className="w-5 h-5 mx-auto mb-1" />
          <p className="text-xs opacity-80">المدفوع</p>
          <p className="text-sm font-bold">{formatCurrency(stats.paidAmount)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-3 text-white text-center">
          <AlertCircle className="w-5 h-5 mx-auto mb-1" />
          <p className="text-xs opacity-80">المتبقي</p>
          <p className="text-sm font-bold">{formatCurrency(stats.remainingAmount)}</p>
        </motion.div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
        {[
          { id: 'all' as const, label: 'الكل' },
          { id: 'unpaid' as const, label: 'غير مدفوع' },
          { id: 'partial' as const, label: 'جزئي' },
          { id: 'paid' as const, label: 'مدفوع' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              filter === f.id ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Invoices */}
      <div className="space-y-2">
        {filteredInvoices.map(inv => (
          <div key={inv.id} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-border">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium">{inv.patient?.name || 'مريض'}</p>
                <p className="text-[10px] text-muted-foreground">{formatDate(inv.createdAt)}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColors[inv.status] || ''}`}>
                {statusLabels[inv.status] || inv.status}
              </span>
            </div>
            {inv.items && inv.items.length > 0 && (
              <div className="space-y-1 mb-2">
                {inv.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{item.serviceName} × {item.quantity}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border pt-2">
              <div className="text-xs space-y-0.5">
                <div className="flex gap-3">
                  <span>الإجمالي: <b>{formatCurrency(inv.total)}</b></span>
                  <span className="text-emerald-600">المدفوع: {formatCurrency(inv.paid)}</span>
                </div>
                <span className="text-red-600">المتبقي: {formatCurrency(inv.remaining)}</span>
              </div>
              {inv.remaining > 0 && (
                <button
                  onClick={() => handlePayInvoice(inv.id, inv.remaining)}
                  className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg active:scale-[0.97] transition-transform"
                >
                  تسديد
                </button>
              )}
            </div>
          </div>
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
