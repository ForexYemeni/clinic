'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, CreditCard, CheckCircle, AlertCircle, User, Stethoscope, Banknote, Receipt, TrendingUp, TrendingDown, Users, Activity, ChevronDown, Filter, X, RefreshCw, ArrowRightLeft, Wallet, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatRelativeTime, statusColors, statusLabels, paymentMethodLabels, type InvoiceItem } from '@/lib/constants';
import { apiGet } from '@/lib/api';
import { PaymentModal } from '@/components/shared/PaymentModal';
import { SuccessCard } from '@/components/shared/SuccessCard';
import { toast } from 'sonner';

interface NurseInfo {
  id: string;
  name: string;
  phone?: string;
  active: boolean;
}

interface NurseReportData {
  totalRevenue: number;
  totalInvoiced: number;
  totalPatients: number;
  totalServices: number;
  totalVisits: number;
  unpaidAmount: number;
  paidInvoices: number;
  unpaidInvoices: number;
}

export function FinanceManagement() {
  const { setScreen } = useAppStore();
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');
  const [stats, setStats] = useState({ totalRevenue: 0, paidAmount: 0, remainingAmount: 0, totalInvoices: 0 });

  // Nurse filter state
  const [nurses, setNurses] = useState<NurseInfo[]>([]);
  const [selectedNurseId, setSelectedNurseId] = useState<string>('');
  const [showNursePicker, setShowNursePicker] = useState(false);
  const [nurseReport, setNurseReport] = useState<NurseReportData | null>(null);
  const [loadingNurseReport, setLoadingNurseReport] = useState(false);

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

  // Debt assignment state
  const [showDebtAssign, setShowDebtAssign] = useState<InvoiceItem | null>(null);
  const [debtNurseId, setDebtNurseId] = useState<string>('');
  const [debtAmount, setDebtAmount] = useState('');
  const [assigningDebt, setAssigningDebt] = useState(false);

  // Fetch nurses list
  useEffect(() => {
    const fetchNurses = async () => {
      try {
        const res = await fetch('/api/users?role=nurse');
        if (res.ok) {
          const data = await res.json();
          setNurses(data);
        }
      } catch {}
    };
    fetchNurses();
  }, []);

  // Fetch invoices (optionally filtered by nurse)
  const fetchData = useCallback(async (nurseId?: string) => {
    setLoading(true);
    try {
      const nurseParam = nurseId ? `?nurseId=${nurseId}` : '';
      const invRes = await fetch(`/api/invoices${nurseParam}`);
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

  // Fetch nurse-specific report data
  const fetchNurseReport = useCallback(async (nurseId: string) => {
    setLoadingNurseReport(true);
    try {
      const data = await apiGet<NurseReportData>(`/api/reports?type=daily&nurseId=${nurseId}`);
      setNurseReport(data);
    } catch {
      setNurseReport(null);
    } finally {
      setLoadingNurseReport(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // When nurse selection changes
  const handleNurseSelect = (nurseId: string) => {
    setSelectedNurseId(nurseId);
    setShowNursePicker(false);
    if (nurseId) {
      fetchData(nurseId);
      fetchNurseReport(nurseId);
    } else {
      fetchData();
      setNurseReport(null);
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

        setInvoices(prev => prev.map(i => {
          if (i.id === inv.id) {
            return { ...i, paid: newPaid, remaining: Math.max(0, newRemaining), status: newStatus };
          }
          return i;
        }));

        const updatedInvoices = invoices.map(i => {
          if (i.id === inv.id) return { ...i, paid: newPaid, remaining: Math.max(0, newRemaining), status: newStatus };
          return i;
        });
        const totalRevenue = updatedInvoices.reduce((s, i) => s + i.total, 0);
        const paidAmount = updatedInvoices.reduce((s, i) => s + i.paid, 0);
        setStats({ totalRevenue, paidAmount, remainingAmount: totalRevenue - paidAmount, totalInvoices: updatedInvoices.length });

        setPaymentModal({ visible: false, invoice: null });

        setSuccessData({
          patientName: inv.patient?.name || 'مريض',
          total: inv.total,
          paid: newPaid,
          remaining: Math.max(0, newRemaining),
        });
        setShowSuccess(true);

        // Refresh nurse report if viewing a specific nurse
        if (selectedNurseId) {
          fetchNurseReport(selectedNurseId);
        }
      } else {
        toast.error('خطأ في تسجيل الدفع');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    } finally {
      setPaying(false);
    }
  };

  const handleAssignDebt = async () => {
    if (!showDebtAssign) return;
    if (!debtNurseId) { toast.error('يرجى اختيار الممرض'); return; }
    if (!debtAmount || Number(debtAmount) <= 0) { toast.error('أدخل مبلغ صحيح'); return; }
    if (Number(debtAmount) > showDebtAssign.remaining) { toast.error('المبلغ يتجاوز المتبقي في الفاتورة'); return; }

    setAssigningDebt(true);
    try {
      const res = await fetch('/api/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nurseId: debtNurseId,
          amount: Number(debtAmount),
          type: 'debt',
          description: `مديونية فاتورة - ${showDebtAssign.patient?.name || 'مريض'}`,
          isDebt: true,
          invoiceId: showDebtAssign.id,
          patientName: showDebtAssign.patient?.name || 'مريض',
          requestedBy: 'admin',
        }),
      });

      if (res.ok) {
        // Mark the invoice as fully paid since the amount is transferred to nurse
        try {
          await fetch(`/api/invoices/${showDebtAssign.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paid: showDebtAssign.total, status: 'paid' }),
          });
        } catch (e) {
          console.error('Failed to update invoice status:', e);
        }

        toast.success('تم تحويل المبلغ على حساب الممرض وتسديد الفاتورة بالكامل');
        setShowDebtAssign(null);
        setDebtNurseId('');
        setDebtAmount('');
        // Refresh data
        if (selectedNurseId) {
          fetchData(selectedNurseId);
        } else {
          fetchData();
        }
      } else {
        const data = await res.json();
        toast.error(data.error || 'خطأ في تحويل المبلغ');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    } finally {
      setAssigningDebt(false);
    }
  };

  const selectedNurse = nurses.find(n => n.id === selectedNurseId);
  const filteredInvoices = invoices.filter(i => filter === 'all' || i.status === filter);

  if (loading && invoices.length === 0) {
    return <div className="p-4 space-y-3 pb-24">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>;
  }

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">الإدارة المالية</h2>
        <button
          onClick={() => {
            if (selectedNurseId) {
              fetchData(selectedNurseId);
              fetchNurseReport(selectedNurseId);
            } else {
              fetchData();
            }
          }}
          className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center active:scale-95 transition-transform"
          title="تحديث"
        >
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Nurse Selector - Professional Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <button
          onClick={() => setShowNursePicker(!showNursePicker)}
          className="w-full bg-white dark:bg-gray-800 rounded-2xl border border-border p-3.5 shadow-sm active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">
                  {selectedNurse ? selectedNurse.name : 'جميع الموظفين'}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {selectedNurse ? `عرض تقارير وفواتير ${selectedNurse.name} فقط` : 'عرض تقارير وفواتير العيادة بالكامل'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedNurseId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNurseSelect('');
                  }}
                  className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-red-500" />
                </button>
              )}
              <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showNursePicker ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </button>

        {/* Nurse Picker Dropdown */}
        <AnimatePresence>
          {showNursePicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-2 bg-white dark:bg-gray-800 rounded-2xl border border-border overflow-hidden shadow-sm max-h-60 overflow-y-auto">
                {/* All option */}
                <button
                  onClick={() => handleNurseSelect('')}
                  className={`w-full px-4 py-3 flex items-center gap-3 border-b border-border active:bg-gray-50 dark:active:bg-gray-700 transition-colors ${
                    !selectedNurseId ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-clinic-100 dark:bg-clinic-900/30 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-clinic-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">جميع الموظفين</p>
                    <p className="text-[10px] text-muted-foreground">عرض تقارير العيادة بالكامل</p>
                  </div>
                  {!selectedNurseId && (
                    <CheckCircle className="w-4 h-4 text-clinic-600 mr-auto" />
                  )}
                </button>

                {/* Nurse list */}
                {nurses.map(nurse => (
                  <button
                    key={nurse.id}
                    onClick={() => handleNurseSelect(nurse.id)}
                    className={`w-full px-4 py-3 flex items-center gap-3 border-b border-border last:border-b-0 active:bg-gray-50 dark:active:bg-gray-700 transition-colors ${
                      selectedNurseId === nurse.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      nurse.active
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : 'bg-amber-100 dark:bg-amber-900/30'
                    }`}>
                      <User className={`w-4 h-4 ${
                        nurse.active
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`} />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold">{nurse.name}</p>
                        {!nurse.active && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">معطل</span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground" dir="ltr">{nurse.phone}</p>
                    </div>
                    {selectedNurseId === nurse.id && (
                      <CheckCircle className="w-4 h-4 text-blue-600 mr-auto" />
                    )}
                  </button>
                ))}

                {nurses.length === 0 && (
                  <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>لا يوجد ممرضين</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Nurse-Specific Financial Summary Card */}
      <AnimatePresence>
        {selectedNurse && nurseReport && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 text-white shadow-lg shadow-blue-600/20 overflow-hidden relative"
          >
            {/* Decorative circles */}
            <div className="absolute -top-6 -left-6 w-20 h-20 bg-white/5 rounded-full" />
            <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-white/5 rounded-full" />

            <div className="relative">
              {/* Nurse name header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-base">تقارير {selectedNurse.name}</p>
                  <p className="text-[11px] text-white/70">ملخص الأداء المالي</p>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-green-300" />
                    <span className="text-[10px] text-white/70">إجمالي الإيرادات</span>
                  </div>
                  <p className="text-lg font-bold">{formatCurrency(nurseReport.totalInvoiced)}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 mb-1">
                    <CheckCircle className="w-3.5 h-3.5 text-green-300" />
                    <span className="text-[10px] text-white/70">المبالغ المحصلة</span>
                  </div>
                  <p className="text-lg font-bold">{formatCurrency(nurseReport.totalRevenue)}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-white/10 rounded-lg p-2.5 backdrop-blur-sm text-center">
                  <Activity className="w-3.5 h-3.5 mx-auto mb-1 text-white/60" />
                  <p className="text-xs font-bold">{nurseReport.totalServices}</p>
                  <p className="text-[9px] text-white/60">خدمات</p>
                </div>
                <div className="bg-white/10 rounded-lg p-2.5 backdrop-blur-sm text-center">
                  <Users className="w-3.5 h-3.5 mx-auto mb-1 text-white/60" />
                  <p className="text-xs font-bold">{nurseReport.totalPatients}</p>
                  <p className="text-[9px] text-white/60">مرضى</p>
                </div>
                <div className="bg-white/10 rounded-lg p-2.5 backdrop-blur-sm text-center">
                  <CreditCard className="w-3.5 h-3.5 mx-auto mb-1 text-white/60" />
                  <p className="text-xs font-bold">{nurseReport.totalVisits}</p>
                  <p className="text-[9px] text-white/60">زيارات</p>
                </div>
              </div>

              {/* Profit/Loss Summary */}
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-white/80">صافي الأرباح والخسائر</span>
                  {nurseReport.totalInvoiced > 0 && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      nurseReport.totalRevenue >= nurseReport.totalInvoiced * 0.7
                        ? 'bg-green-400/20 text-green-200'
                        : nurseReport.totalRevenue >= nurseReport.totalInvoiced * 0.4
                        ? 'bg-yellow-400/20 text-yellow-200'
                        : 'bg-red-400/20 text-red-200'
                    }`}>
                      {Math.round((nurseReport.totalRevenue / (nurseReport.totalInvoiced || 1)) * 100)}% تحصيل
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-white/60">المتبقي غير المحصل</p>
                    <p className="text-sm font-bold text-red-200">{formatCurrency(nurseReport.unpaidAmount)}</p>
                  </div>
                  <div className="w-px h-8 bg-white/20" />
                  <div>
                    <p className="text-[10px] text-white/60">فواتير مدفوعة</p>
                    <p className="text-sm font-bold text-green-200">{nurseReport.paidInvoices}</p>
                  </div>
                  <div className="w-px h-8 bg-white/20" />
                  <div>
                    <p className="text-[10px] text-white/60">فواتير معلقة</p>
                    <p className="text-sm font-bold text-amber-200">{nurseReport.unpaidInvoices}</p>
                  </div>
                </div>

                {/* Collection progress bar */}
                {nurseReport.totalInvoiced > 0 && (
                  <div className="mt-3">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-l from-green-400 to-green-300 h-2 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min((nurseReport.totalRevenue / nurseReport.totalInvoiced) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-clinic-500 to-clinic-600 rounded-xl p-3 text-white text-center shadow-lg shadow-clinic-500/20">
          <DollarSign className="w-5 h-5 mx-auto mb-1" />
          <p className="text-[10px] opacity-80">{selectedNurseId ? `إجمالي ${selectedNurse?.name}` : 'الإجمالي'}</p>
          <p className="text-sm font-bold">{formatCurrency(stats.totalRevenue)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 text-white text-center shadow-lg shadow-green-500/20">
          <CheckCircle className="w-5 h-5 mx-auto mb-1" />
          <p className="text-[10px] opacity-80">المدفوع</p>
          <p className="text-sm font-bold">{formatCurrency(stats.paidAmount)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-3 text-white text-center shadow-lg shadow-red-500/20">
          <AlertCircle className="w-5 h-5 mx-auto mb-1" />
          <p className="text-[10px] opacity-80">المتبقي</p>
          <p className="text-sm font-bold">{formatCurrency(stats.remainingAmount)}</p>
        </motion.div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
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
              filter === f.id ? 'bg-clinic-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground'
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

      {/* Invoices */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredInvoices.map((inv, idx) => (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
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

                {/* Nurse/Admin name - Professional badge (only show when viewing all) */}
                {!selectedNurseId && (
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
                )}
              </div>

              {/* Service items */}
              {inv.items && inv.items.length > 0 && (
                <div className="px-3.5 pb-2">
                  <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-2.5 space-y-1.5">
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
                  <div className="flex items-center gap-1.5">
                    {(inv.status === 'unpaid' || inv.status === 'partial') && inv.nurseId && nurses.length > 0 && (
                      <button
                        onClick={() => {
                          setShowDebtAssign(inv);
                          setDebtAmount(String(inv.remaining));
                          setDebtNurseId(inv.nurseId || '');
                        }}
                        className="px-2.5 py-1.5 bg-amber-600 text-white text-[10px] font-bold rounded-lg active:scale-[0.97] transition-transform shadow-sm flex items-center gap-1"
                        title="تحويل على حساب الممرض"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        تحويل
                      </button>
                    )}
                    <button
                      onClick={() => handlePayClick(inv)}
                      className="px-3 py-1.5 bg-clinic-600 text-white text-xs font-bold rounded-lg active:scale-[0.97] transition-transform shadow-sm"
                    >
                      تسديد
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredInvoices.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">
            {selectedNurseId ? `لا توجد فواتير لـ${selectedNurse?.name}` : 'لا توجد فواتير'}
          </p>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal.invoice && (
        <PaymentModal
          visible={paymentModal.visible}
          onClose={() => setPaymentModal({ visible: false, invoice: null })}
          onConfirm={handlePaymentConfirm}
          invoiceId={paymentModal.invoice.id.slice(-6)}
          patientName={paymentModal.invoice.patient?.name || 'مريض'}
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

      {/* Debt Assignment Card */}
      <AnimatePresence>
        {showDebtAssign && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowDebtAssign(null)}
          >
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl p-5 pb-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle bar */}
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />

              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <ArrowRightLeft className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-base font-bold">تحويل على حساب الممرض</p>
                  <p className="text-xs text-muted-foreground">سيتم تسديد الفاتورة بالكامل وخصم المبلغ من راتب الممرض</p>
                </div>
              </div>

              {/* Invoice summary */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-clinic-600" />
                  <span className="text-sm font-bold">{showDebtAssign.patient?.name || 'مريض'}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${statusColors[showDebtAssign.status]}`}>
                    {statusLabels[showDebtAssign.status]}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">الإجمالي</p>
                    <p className="font-bold">{formatCurrency(showDebtAssign.total)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">المدفوع</p>
                    <p className="font-bold text-green-600">{formatCurrency(showDebtAssign.paid)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">المتبقي</p>
                    <p className="font-bold text-red-600">{formatCurrency(showDebtAssign.remaining)}</p>
                  </div>
                </div>
              </div>

              {/* Nurse info - auto-assigned */}
              <div className="mb-3">
                <label className="text-xs font-medium mb-1.5 block">الممرض المسؤول</label>
                <div className="flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <User className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                    {showDebtAssign.nurseName || nurses.find(n => n.id === showDebtAssign.nurseId)?.name || 'ممرض'}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300">تم تحديد الممرض تلقائياً</span>
                </div>
              </div>

              {/* Amount */}
              <div className="mb-4">
                <label className="text-xs font-medium mb-1.5 block">المبلغ المراد تحويله</label>
                <input
                  type="number"
                  value={debtAmount}
                  onChange={(e) => setDebtAmount(e.target.value)}
                  placeholder="المبلغ (ر.ي)"
                  className="w-full h-11 px-4 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                  dir="ltr"
                />
                <div className="flex gap-2 mt-1.5">
                  <button
                    onClick={() => setDebtAmount(String(showDebtAssign.remaining))}
                    className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-all ${
                      debtAmount === String(showDebtAssign.remaining)
                        ? 'bg-amber-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground'
                    }`}
                  >
                    المبلغ الكامل
                  </button>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-3 mb-4 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-[10px] text-amber-700 dark:text-amber-300">
                  <p className="font-bold mb-0.5">تنبيه</p>
                  <p>سيتم تسديد الفاتورة بالكامل وخصم المبلغ من راتب الممرض كمديونية. لن يظهر للممرض أي مبلغ متبقي على الفاتورة.</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleAssignDebt}
                  disabled={assigningDebt || !debtNurseId || !debtAmount}
                  className="flex-1 h-11 bg-amber-600 text-white rounded-xl text-sm font-bold active:scale-[0.97] transition-transform shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {assigningDebt ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ArrowRightLeft className="w-4 h-4" />
                  )}
                  تحويل على الحساب
                </button>
                <button
                  onClick={() => { setShowDebtAssign(null); setDebtNurseId(''); setDebtAmount(''); }}
                  className="flex-1 h-11 bg-gray-100 dark:bg-gray-800 text-muted-foreground rounded-xl text-sm font-medium active:scale-[0.97] transition-transform"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
