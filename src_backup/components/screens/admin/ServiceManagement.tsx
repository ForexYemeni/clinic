'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pause, Play, Trash2, Edit3, Search, X, Check, DollarSign, Clock, Tag } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatCurrency, type ServiceItem, DEFAULT_SERVICES } from '@/lib/constants';
import { toast } from 'sonner';

export function ServiceManagement() {
  const { setScreen, user } = useAppStore();
  const clinicId = user?.clinicId || '';
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [newService, setNewService] = useState({ nameAr: '', price: '', duration: '', category: 'قياسات', description: '' });

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch(`/api/services?clinicId=${clinicId}`);
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const filteredServices = services.filter(s =>
    s.status !== 'deleted' && (s.nameAr.includes(search) || s.category.includes(search))
  );

  const categories = [...new Set(filteredServices.map(s => s.category))];

  const handleAddService = async () => {
    if (!newService.nameAr.trim() || !newService.price) {
      toast.error('أدخل اسم الخدمة والسعر');
      return;
    }
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameAr: newService.nameAr.trim(),
          price: Number(newService.price),
          duration: Number(newService.duration) || 15,
          category: newService.category,
          description: newService.description || newService.nameAr.trim(),
          clinicId,
        }),
      });
      if (res.ok) {
        toast.success('تمت إضافة الخدمة');
        setShowAddForm(false);
        setNewService({ nameAr: '', price: '', duration: '', category: 'قياسات', description: '' });
        fetchServices();
      } else {
        const data = await res.json();
        toast.error(data.error || 'خطأ في الإضافة');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    }
  };

  const handleTogglePause = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(newStatus === 'paused' ? 'تم إيقاف الخدمة' : 'تم تفعيل الخدمة');
        fetchServices();
      }
    } catch {
      toast.error('خطأ في التحديث');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذه الخدمة؟')) return;
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

  const handleUpdatePrice = async (id: string) => {
    if (!editPrice) return;
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: Number(editPrice) }),
      });
      if (res.ok) {
        toast.success('تم تحديث السعر');
        setEditingId(null);
        fetchServices();
      }
    } catch {
      toast.error('خطأ في التحديث');
    }
  };

  if (loading) {
    return <div className="p-4 space-y-3 pb-24">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>;
  }

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">إدارة الخدمات</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium active:scale-[0.97] transition-transform"
        >
          <Plus className="w-4 h-4" />
          إضافة خدمة
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث عن خدمة..."
          className="w-full h-10 pr-9 pl-4 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Add Service Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 mb-4 border border-emerald-200 dark:border-emerald-800 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm">خدمة جديدة</h3>
              <button onClick={() => setShowAddForm(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={newService.nameAr}
                onChange={(e) => setNewService(p => ({ ...p, nameAr: e.target.value }))}
                placeholder="اسم الخدمة"
                className="w-full h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <DollarSign className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    value={newService.price}
                    onChange={(e) => setNewService(p => ({ ...p, price: e.target.value }))}
                    placeholder="السعر (ر.ي)"
                    className="w-full h-10 pr-8 pl-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    dir="ltr"
                  />
                </div>
                <div className="relative">
                  <Clock className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    value={newService.duration}
                    onChange={(e) => setNewService(p => ({ ...p, duration: e.target.value }))}
                    placeholder="المدة (دقيقة)"
                    className="w-full h-10 pr-8 pl-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    dir="ltr"
                  />
                </div>
              </div>
              <select
                value={newService.category}
                onChange={(e) => setNewService(p => ({ ...p, category: e.target.value }))}
                className="w-full h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="قياسات">قياسات</option>
                <option value="إسعافات">إسعافات</option>
                <option value="علاج">علاج</option>
                <option value="رعاية">رعاية</option>
              </select>
              <input
                type="text"
                value={newService.description}
                onChange={(e) => setNewService(p => ({ ...p, description: e.target.value }))}
                placeholder="وصف الخدمة (اختياري)"
                className="w-full h-10 px-3 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={handleAddService}
                className="w-full h-10 bg-emerald-600 text-white font-medium rounded-xl active:scale-[0.97] transition-transform"
              >
                إضافة الخدمة
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Services by Category */}
      {categories.map(category => (
        <div key={category} className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-4 h-4 text-emerald-500" />
            <h3 className="font-bold text-sm">{category}</h3>
            <span className="text-xs text-muted-foreground">
              ({filteredServices.filter(s => s.category === category).length})
            </span>
          </div>
          <div className="space-y-2">
            {filteredServices.filter(s => s.category === category).map(service => (
              <motion.div
                key={service.id}
                layout
                className={`bg-white dark:bg-gray-800 rounded-xl p-3 border border-border ${
                  service.status === 'paused' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{service.nameAr}</p>
                      {service.status === 'paused' && (
                        <span className="text-[10px] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded-full">متوقف</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {editingId === service.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-20 h-7 px-2 text-xs bg-gray-50 dark:bg-gray-700 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            dir="ltr"
                            autoFocus
                          />
                          <button onClick={() => handleUpdatePrice(service.id)} className="p-1 text-emerald-600"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingId(null)} className="p-1 text-red-500"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium" onClick={() => { setEditingId(service.id); setEditPrice(String(service.price)); }}>
                          {formatCurrency(service.price)}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">{service.duration} دقيقة</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditingId(service.id); setEditPrice(String(service.price)); }}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="تعديل السعر"
                    >
                      <Edit3 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleTogglePause(service.id, service.status)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title={service.status === 'active' ? 'إيقاف' : 'تفعيل'}
                    >
                      {service.status === 'active' ? (
                        <Pause className="w-4 h-4 text-yellow-600" />
                      ) : (
                        <Play className="w-4 h-4 text-emerald-600" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">لا توجد خدمات</p>
        </div>
      )}
    </div>
  );
}
