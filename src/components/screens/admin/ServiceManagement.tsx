'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, X, Check, Clock, DollarSign,
  Pause, Play, Trash2, Edit3, RefreshCw, Stethoscope,
  ChevronDown, Activity, ToggleLeft, ToggleRight, Loader2,
  Package, Eye, EyeOff, Tag
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatCurrency, type ServiceItem } from '@/lib/constants';
import { CATEGORIES, type CategoryInfo } from '@/lib/services-data';
import { toast } from 'sonner';

// ─── Helpers ────────────────────────────────────────────────
function getCategoryInfo(categoryKey: string): CategoryInfo | undefined {
  return CATEGORIES.find(c => c.key === categoryKey);
}

function getServiceIcon(service: ServiceItem): string {
  const cat = getCategoryInfo(service.category);
  return (service as any).icon || cat?.icon || '🩺';
}

function getServiceColor(service: ServiceItem): string {
  const cat = getCategoryInfo(service.category);
  return (service as any).color || cat?.color || 'emerald';
}

// Maps color name → tailwind bg classes for the emoji circle
const colorCircleMap: Record<string, string> = {
  red: 'bg-red-100 dark:bg-red-900/30',
  blue: 'bg-blue-100 dark:bg-blue-900/30',
  pink: 'bg-pink-100 dark:bg-pink-900/30',
  orange: 'bg-orange-100 dark:bg-orange-900/30',
  amber: 'bg-amber-100 dark:bg-amber-900/30',
  cyan: 'bg-cyan-100 dark:bg-cyan-900/30',
  rose: 'bg-rose-100 dark:bg-rose-900/30',
  violet: 'bg-violet-100 dark:bg-violet-900/30',
  emerald: 'bg-clinic-100 dark:bg-clinic-900/30',
  sky: 'bg-sky-100 dark:bg-sky-900/30',
  teal: 'bg-teal-100 dark:bg-teal-900/30',
  indigo: 'bg-indigo-100 dark:bg-indigo-900/30',
};

const colorBorderMap: Record<string, string> = {
  red: 'border-r-red-400',
  blue: 'border-r-blue-400',
  pink: 'border-r-pink-400',
  orange: 'border-r-orange-400',
  amber: 'border-r-amber-400',
  cyan: 'border-r-cyan-400',
  rose: 'border-r-rose-400',
  violet: 'border-r-violet-400',
  emerald: 'border-r-clinic-400',
  sky: 'border-r-sky-400',
  teal: 'border-r-teal-400',
  indigo: 'border-r-indigo-400',
};

const colorBadgeBg: Record<string, string> = {
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  emerald: 'bg-clinic-100 text-clinic-700 dark:bg-clinic-900/30 dark:text-clinic-300',
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
};

const colorTabActive: Record<string, string> = {
  red: 'bg-red-600 text-white shadow-red-200 dark:shadow-red-900/40',
  blue: 'bg-blue-600 text-white shadow-blue-200 dark:shadow-blue-900/40',
  pink: 'bg-pink-600 text-white shadow-pink-200 dark:shadow-pink-900/40',
  orange: 'bg-orange-600 text-white shadow-orange-200 dark:shadow-orange-900/40',
  amber: 'bg-amber-600 text-white shadow-amber-200 dark:shadow-amber-900/40',
  cyan: 'bg-cyan-600 text-white shadow-cyan-200 dark:shadow-cyan-900/40',
  rose: 'bg-rose-600 text-white shadow-rose-200 dark:shadow-rose-900/40',
  violet: 'bg-violet-600 text-white shadow-violet-200 dark:shadow-violet-900/40',
  emerald: 'bg-clinic-600 text-white shadow-clinic-200 dark:shadow-clinic-900/40',
  sky: 'bg-sky-600 text-white shadow-sky-200 dark:shadow-sky-900/40',
  teal: 'bg-teal-600 text-white shadow-teal-200 dark:shadow-teal-900/40',
  indigo: 'bg-indigo-600 text-white shadow-indigo-200 dark:shadow-indigo-900/40',
};

// ─── Form State ─────────────────────────────────────────────
interface ServiceFormData {
  nameAr: string;
  price: string;
  duration: string;
  category: string;
  description: string;
  icon: string;
}

const emptyForm: ServiceFormData = {
  nameAr: '',
  price: '',
  duration: '15',
  category: CATEGORIES[0]?.key || '',
  description: '',
  icon: '🩺',
};

// ─── Component ──────────────────────────────────────────────
export function ServiceManagement() {
  const { setScreen } = useAppStore();

  // Data
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('الكل');

  // Modals
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [quickEditPrice, setQuickEditPrice] = useState('');

  // Form
  const [form, setForm] = useState<ServiceFormData>(emptyForm);

  // Ref for tabs scroll container
  const tabsRef = useRef<HTMLDivElement>(null);

  // ─── Fetch ──────────────────────────────────────────────
  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch('/api/services');
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch {
      toast.error('خطأ في تحميل الخدمات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  // ─── Derived ───────────────────────────────────────────
  const activeServices = useMemo(
    () => services.filter(s => s.status !== 'deleted'),
    [services]
  );

  const filteredServices = useMemo(() => {
    let result = activeServices;
    if (activeCategory !== 'الكل') {
      result = result.filter(s => s.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.trim();
      result = result.filter(
        s => s.nameAr.includes(q) || s.category.includes(q) || s.description?.includes(q)
      );
    }
    return result;
  }, [activeServices, activeCategory, search]);

  const stats = useMemo(() => {
    const total = activeServices.length;
    const active = activeServices.filter(s => s.status === 'active').length;
    const paused = activeServices.filter(s => s.status === 'paused').length;
    return { total, active, paused };
  }, [activeServices]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeServices.forEach(s => {
      if (s.status === 'active') {
        counts[s.category] = (counts[s.category] || 0) + 1;
      }
    });
    return counts;
  }, [activeServices]);

  // ─── Add Service ───────────────────────────────────────
  const handleAddService = async () => {
    if (!form.nameAr.trim()) { toast.error('أدخل اسم الخدمة'); return; }
    if (!form.price || Number(form.price) <= 0) { toast.error('أدخل سعر صحيح'); return; }

    setSubmitting(true);
    try {
      const catInfo = getCategoryInfo(form.category);
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameAr: form.nameAr.trim(),
          price: Number(form.price),
          duration: Number(form.duration) || 15,
          category: form.category,
          description: form.description || form.nameAr.trim(),
          icon: form.icon || catInfo?.icon || '🩺',
          color: catInfo?.color || 'emerald',
        }),
      });
      if (res.ok) {
        toast.success('تمت إضافة الخدمة بنجاح');
        setShowAddSheet(false);
        setForm(emptyForm);
        fetchServices();
      } else {
        const data = await res.json();
        toast.error(data.error || 'خطأ في الإضافة');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Edit Service ──────────────────────────────────────
  const handleEditService = async () => {
    if (!editingService) return;
    if (!form.nameAr.trim()) { toast.error('أدخل اسم الخدمة'); return; }
    if (!form.price || Number(form.price) <= 0) { toast.error('أدخل سعر صحيح'); return; }

    setSubmitting(true);
    try {
      const catInfo = getCategoryInfo(form.category);
      const res = await fetch(`/api/services/${editingService.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameAr: form.nameAr.trim(),
          price: Number(form.price),
          duration: Number(form.duration) || 15,
          category: form.category,
          description: form.description || form.nameAr.trim(),
          icon: form.icon || catInfo?.icon || '🩺',
          color: catInfo?.color || 'emerald',
        }),
      });
      if (res.ok) {
        toast.success('تم تحديث الخدمة');
        setShowEditSheet(false);
        setEditingService(null);
        setForm(emptyForm);
        fetchServices();
      } else {
        const data = await res.json();
        toast.error(data.error || 'خطأ في التحديث');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Toggle Pause ──────────────────────────────────────
  const handleTogglePause = async (service: ServiceItem) => {
    const newStatus = service.status === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(newStatus === 'paused' ? 'تم إيقاف الخدمة مؤقتاً' : 'تم تفعيل الخدمة');
        fetchServices();
      }
    } catch {
      toast.error('خطأ في التحديث');
    }
  };

  // ─── Delete ────────────────────────────────────────────
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل تريد حذف خدمة "${name}"؟`)) return;
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('تم حذف الخدمة');
        fetchServices();
      }
    } catch {
      toast.error('خطأ في الحذف');
    }
  };

  // ─── Quick Price Edit ──────────────────────────────────
  const handleQuickPriceSave = async (id: string) => {
    if (!quickEditPrice || Number(quickEditPrice) <= 0) return;
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: Number(quickEditPrice) }),
      });
      if (res.ok) {
        toast.success('تم تحديث السعر');
        setQuickEditId(null);
        fetchServices();
      }
    } catch {
      toast.error('خطأ في التحديث');
    }
  };

  // ─── Re-seed Defaults (add missing services) ──────────
  const handleReseedDefaults = async () => {
    if (!confirm('سيتم إضافة الخدمات المفقودة فقط دون حذف الخدمات الموجودة. هل أنت متأكد؟')) return;
    try {
      setSubmitting(true);
      const res = await fetch('/api/services/reseed', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message);
        setLoading(true);
        fetchServices();
      } else {
        toast.error(data.error || 'خطأ في إعادة التحميل');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Full Reset Services (delete all + re-seed) ───────
  const handleFullResetServices = async () => {
    if (!confirm('⚠️ سيتم حذف جميع الخدمات الحالية وإعادة تحميل الخدمات الافتراضية. هذا الإجراء لا يمكن التراجع عنه!')) return;
    try {
      setSubmitting(true);
      const res = await fetch('/api/services/reseed', { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message);
        setLoading(true);
        fetchServices();
      } else {
        toast.error(data.error || 'خطأ في إعادة التهيئة');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Open Edit Modal ───────────────────────────────────
  const openEditModal = (service: ServiceItem) => {
    setEditingService(service);
    setForm({
      nameAr: service.nameAr,
      price: String(service.price),
      duration: String(service.duration),
      category: service.category,
      description: service.description || '',
      icon: getServiceIcon(service),
    });
    setShowEditSheet(true);
  };

  // ─── Loading Skeleton ──────────────────────────────────
  if (loading) {
    return (
      <div className="p-4 pb-24">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-7 w-36 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
          ))}
        </div>
        {/* Tabs skeleton */}
        <div className="flex gap-2 mb-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse flex-shrink-0" />
          ))}
        </div>
        {/* Cards skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────
  return (
    <div className="p-4 pb-24">

      {/* ═══════ Header ═══════ */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-clinic-100 dark:bg-clinic-900/30 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-clinic-600 dark:text-clinic-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold leading-tight">إدارة الخدمات</h2>
            <p className="text-[11px] text-muted-foreground">{stats.total} خدمة مسجلة</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReseedDefaults}
            disabled={submitting}
            className="h-9 px-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center gap-1.5 active:scale-95 transition-transform"
            title="إضافة الخدمات المفقودة"
          >
            <RefreshCw className={`w-4 h-4 text-blue-600 dark:text-blue-400 ${submitting ? 'animate-spin' : ''}`} />
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">تحميل</span>
          </button>
          <button
            onClick={() => { setForm(emptyForm); setShowAddSheet(true); }}
            className="flex items-center gap-1.5 bg-clinic-600 hover:bg-clinic-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium active:scale-[0.97] transition-all shadow-lg shadow-clinic-600/20"
          >
            <Plus className="w-4 h-4" />
            إضافة خدمة
          </button>
        </div>
      </div>

      {/* ═══════ Stats Bar ═══════ */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-gradient-to-br from-clinic-500 to-clinic-600 rounded-2xl p-3 text-white shadow-lg shadow-clinic-600/20"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Package className="w-3.5 h-3.5 opacity-80" />
            <span className="text-[10px] opacity-80 font-medium">الإجمالي</span>
          </div>
          <p className="text-2xl font-bold leading-none">{stats.total}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-3 text-white shadow-lg shadow-teal-600/20"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Activity className="w-3.5 h-3.5 opacity-80" />
            <span className="text-[10px] opacity-80 font-medium">نشطة</span>
          </div>
          <p className="text-2xl font-bold leading-none">{stats.active}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-3 text-white shadow-lg shadow-amber-600/20"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Pause className="w-3.5 h-3.5 opacity-80" />
            <span className="text-[10px] opacity-80 font-medium">متوقفة</span>
          </div>
          <p className="text-2xl font-bold leading-none">{stats.paused}</p>
        </motion.div>
      </div>

      {/* ═══════ Search ═══════ */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن خدمة بالاسم أو التصنيف..."
          className="w-full h-11 pr-10 pl-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500 focus:border-transparent shadow-sm transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center"
          >
            <X className="w-3 h-3 text-gray-500 dark:text-gray-300" />
          </button>
        )}
      </div>

      {/* ═══════ Category Tabs ═══════ */}
      <div
        ref={tabsRef}
        className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* "All" tab */}
        <button
          onClick={() => setActiveCategory('الكل')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
            activeCategory === 'الكل'
              ? 'bg-clinic-600 text-white shadow-lg shadow-clinic-600/20'
              : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <span>📋</span>
          <span>الكل</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
            activeCategory === 'الكل'
              ? 'bg-white/20 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-muted-foreground'
          }`}>
            {activeServices.length}
          </span>
        </button>

        {/* Category tabs */}
        {CATEGORIES.map(cat => {
          const count = categoryCounts[cat.key] || 0;
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                isActive
                  ? colorTabActive[cat.color] || 'bg-clinic-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-700'
              } ${isActive ? 'shadow-lg' : ''}`}
            >
              <span className="text-sm">{cat.icon}</span>
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                isActive
                  ? 'bg-white/20 text-white'
                  : count > 0
                    ? 'bg-gray-200 dark:bg-gray-700 text-muted-foreground'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ═══════ Service Cards ═══════ */}
      <AnimatePresence mode="popLayout">
        {filteredServices.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">
              {search ? 'لا توجد نتائج' : 'لا توجد خدمات'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {search
                ? `لم يتم العثور على خدمات تطابق "${search}"`
                : activeCategory !== 'الكل'
                  ? `لا توجد خدمات في تصنيف "${activeCategory}"`
                  : 'أضف خدمات جديدة للبدء'
              }
            </p>
            {!search && (
              <button
                onClick={() => { setForm(emptyForm); setShowAddSheet(true); }}
                className="mt-4 inline-flex items-center gap-1.5 bg-clinic-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium active:scale-[0.97] transition-transform"
              >
                <Plus className="w-4 h-4" />
                إضافة خدمة جديدة
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredServices.map((service, index) => {
              const color = getServiceColor(service);
              const icon = getServiceIcon(service);
              const catInfo = getCategoryInfo(service.category);
              const isPaused = service.status === 'paused';

              return (
                <motion.div
                  key={service.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, scale: 0.95 }}
                  transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.25 }}
                  className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden ${
                    isPaused ? 'opacity-70' : ''
                  }`}
                >
                  {/* Color accent bar */}
                  <div className={`flex border-r-4 ${colorBorderMap[color] || 'border-r-clinic-400'}`}>
                    {/* Icon circle */}
                    <div className="flex items-center px-3 py-3.5">
                      <div className={`w-12 h-12 rounded-xl ${colorCircleMap[color] || 'bg-clinic-100 dark:bg-clinic-900/30'} flex items-center justify-center text-xl flex-shrink-0`}>
                        {icon}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 py-3 pr-2 pl-3">
                      {/* Row 1: Name + Status */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm leading-tight truncate">{service.nameAr}</h3>
                          {service.description && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{service.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {isPaused ? (
                            <span className="flex items-center gap-1 text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                              <EyeOff className="w-3 h-3" />
                              متوقف
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                              <Eye className="w-3 h-3" />
                              نشط
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Row 2: Category badge + Price + Duration */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {catInfo && (
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${colorBadgeBg[color] || 'bg-gray-100 text-gray-700'}`}>
                            {catInfo.icon} {catInfo.label}
                          </span>
                        )}

                        {/* Price - inline editable */}
                        {quickEditId === service.id ? (
                          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700 rounded-lg px-1.5 py-0.5">
                            <DollarSign className="w-3 h-3 text-clinic-500" />
                            <input
                              type="number"
                              value={quickEditPrice}
                              onChange={(e) => setQuickEditPrice(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleQuickPriceSave(service.id);
                                if (e.key === 'Escape') setQuickEditId(null);
                              }}
                              className="w-16 h-6 text-xs font-semibold bg-transparent text-clinic-600 dark:text-clinic-400 focus:outline-none"
                              dir="ltr"
                              autoFocus
                            />
                            <button
                              onClick={() => handleQuickPriceSave(service.id)}
                              className="p-0.5 text-clinic-600 hover:text-clinic-700"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setQuickEditId(null)}
                              className="p-0.5 text-red-400 hover:text-red-500"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setQuickEditId(service.id);
                              setQuickEditPrice(String(service.price));
                            }}
                            className="flex items-center gap-1 text-xs font-bold text-clinic-600 dark:text-clinic-400 hover:underline"
                            title="انقر لتعديل السعر"
                          >
                            <DollarSign className="w-3 h-3" />
                            {formatCurrency(service.price)}
                          </button>
                        )}

                        <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {service.duration} دقيقة
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-center justify-center gap-0.5 px-2 py-2 border-r border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => openEditModal(service)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="تعديل"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleTogglePause(service)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title={isPaused ? 'تفعيل' : 'إيقاف مؤقت'}
                      >
                        {isPaused ? (
                          <Play className="w-3.5 h-3.5 text-clinic-500" />
                        ) : (
                          <Pause className="w-3.5 h-3.5 text-amber-500" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(service.id, service.nameAr)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* ═══════ Add Service Sheet ═══════ */}
      <AnimatePresence>
        {showAddSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddSheet(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl z-50 shadow-2xl max-h-[90vh] flex flex-col"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-clinic-100 dark:bg-clinic-900/30 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-clinic-600 dark:text-clinic-400" />
                  </div>
                  <h3 className="font-bold text-base">إضافة خدمة جديدة</h3>
                </div>
                <button
                  onClick={() => setShowAddSheet(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Form */}
              <div className="overflow-y-auto p-5 space-y-4 custom-scrollbar">
                {/* Icon + Name */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">الأيقونة</label>
                    <input
                      type="text"
                      value={form.icon}
                      onChange={(e) => setForm(p => ({ ...p, icon: e.target.value }))}
                      className="w-14 h-11 text-center text-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinic-500"
                      maxLength={2}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">اسم الخدمة *</label>
                    <input
                      type="text"
                      value={form.nameAr}
                      onChange={(e) => setForm(p => ({ ...p, nameAr: e.target.value }))}
                      placeholder="مثال: قياس ضغط الدم"
                      className="w-full h-11 px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500"
                    />
                  </div>
                </div>

                {/* Price + Duration */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">السعر (ر.ي) *</label>
                    <div className="relative">
                      <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="number"
                        value={form.price}
                        onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))}
                        placeholder="0"
                        className="w-full h-11 pr-9 pl-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">المدة (دقيقة)</label>
                    <div className="relative">
                      <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="number"
                        value={form.duration}
                        onChange={(e) => setForm(p => ({ ...p, duration: e.target.value }))}
                        placeholder="15"
                        className="w-full h-11 pr-9 pl-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">التصنيف</label>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))}
                      className="w-full h-11 px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500 appearance-none"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.key} value={cat.key}>{cat.icon} {cat.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">الوصف (اختياري)</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="وصف مختصر للخدمة..."
                    rows={2}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500 resize-none"
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={handleAddService}
                  disabled={submitting}
                  className="w-full h-12 bg-clinic-600 hover:bg-clinic-700 text-white font-bold rounded-xl active:scale-[0.98] transition-all shadow-lg shadow-clinic-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      إضافة الخدمة
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══════ Edit Service Sheet ═══════ */}
      <AnimatePresence>
        {showEditSheet && editingService && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowEditSheet(false); setEditingService(null); }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl z-50 shadow-2xl max-h-[90vh] flex flex-col"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Edit3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">تعديل الخدمة</h3>
                    <p className="text-[11px] text-muted-foreground">{editingService.nameAr}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowEditSheet(false); setEditingService(null); }}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Form */}
              <div className="overflow-y-auto p-5 space-y-4 custom-scrollbar">
                {/* Icon + Name */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">الأيقونة</label>
                    <input
                      type="text"
                      value={form.icon}
                      onChange={(e) => setForm(p => ({ ...p, icon: e.target.value }))}
                      className="w-14 h-11 text-center text-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={2}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">اسم الخدمة *</label>
                    <input
                      type="text"
                      value={form.nameAr}
                      onChange={(e) => setForm(p => ({ ...p, nameAr: e.target.value }))}
                      placeholder="مثال: قياس ضغط الدم"
                      className="w-full h-11 px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Price + Duration */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">السعر (ر.ي) *</label>
                    <div className="relative">
                      <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="number"
                        value={form.price}
                        onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))}
                        placeholder="0"
                        className="w-full h-11 pr-9 pl-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">المدة (دقيقة)</label>
                    <div className="relative">
                      <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="number"
                        value={form.duration}
                        onChange={(e) => setForm(p => ({ ...p, duration: e.target.value }))}
                        placeholder="15"
                        className="w-full h-11 pr-9 pl-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">التصنيف</label>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))}
                      className="w-full h-11 px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.key} value={cat.key}>{cat.icon} {cat.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">الوصف</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="وصف مختصر للخدمة..."
                    rows={2}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Status toggle */}
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <div>
                    <p className="text-sm font-medium">حالة الخدمة</p>
                    <p className="text-[11px] text-muted-foreground">
                      {editingService.status === 'active' ? 'الخدمة متاحة للمرضى' : 'الخدمة متوقفة مؤقتاً'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleTogglePause(editingService)}
                    className="p-1"
                  >
                    {editingService.status === 'active' ? (
                      <ToggleRight className="w-10 h-6 text-clinic-500" />
                    ) : (
                      <ToggleLeft className="w-10 h-6 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Submit */}
                <button
                  onClick={handleEditService}
                  disabled={submitting}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl active:scale-[0.98] transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      حفظ التعديلات
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
