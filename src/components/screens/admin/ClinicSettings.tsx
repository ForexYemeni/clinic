'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  ImagePlus,
  Phone,
  MapPin,
  FileText,
  Palette,
  Save,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

const COLOR_OPTIONS = [
  { key: 'emerald', label: 'زمردي', bg: 'bg-emerald-500', ring: 'ring-emerald-500' },
  { key: 'teal', label: 'سماوي', bg: 'bg-teal-500', ring: 'ring-teal-500' },
  { key: 'blue', label: 'أزرق', bg: 'bg-blue-500', ring: 'ring-blue-500' },
  { key: 'indigo', label: 'نيلي', bg: 'bg-indigo-500', ring: 'ring-indigo-500' },
  { key: 'purple', label: 'بنفسجي', bg: 'bg-purple-500', ring: 'ring-purple-500' },
  { key: 'red', label: 'أحمر', bg: 'bg-red-500', ring: 'ring-red-500' },
  { key: 'orange', label: 'برتقالي', bg: 'bg-orange-500', ring: 'ring-orange-500' },
  { key: 'amber', label: 'كهرماني', bg: 'bg-amber-500', ring: 'ring-amber-500' },
] as const;

export function ClinicSettings() {
  const { clinicName, clinicSettings, setClinicSettings, setClinicName, setScreen } = useAppStore();

  const [form, setForm] = useState({
    name: clinicSettings.name || '',
    description: clinicSettings.description || '',
    phone: clinicSettings.phone || '',
    address: clinicSettings.address || '',
    logo: clinicSettings.logo || '',
    primaryColor: clinicSettings.primaryColor || 'emerald',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/clinic');
        if (res.ok) {
          const data = await res.json();
          setForm({
            name: data.name || '',
            description: data.description || '',
            phone: data.phone || '',
            address: data.address || '',
            logo: data.logo || '',
            primaryColor: data.primaryColor || 'emerald',
          });
          setClinicSettings({
            name: data.name || '',
            description: data.description || '',
            phone: data.phone || '',
            address: data.address || '',
            logo: data.logo || '',
            primaryColor: data.primaryColor || 'emerald',
          });
          if (data.name) setClinicName(data.name);
        }
      } catch {
        toast.error('خطأ في جلب بيانات العيادة');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [setClinicSettings, setClinicName]);

  // Save handler
  const handleSave = useCallback(async (data?: Partial<typeof form>) => {
    const payload = data ? { ...form, ...data } : form;
    setSaving(true);
    try {
      const res = await fetch('/api/clinic', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const savedData = await res.json();
        setClinicSettings({
          name: savedData.name || '',
          description: savedData.description || '',
          phone: savedData.phone || '',
          address: savedData.address || '',
          logo: savedData.logo || '',
          primaryColor: savedData.primaryColor || 'emerald',
        });
        if (savedData.name) setClinicName(savedData.name);
        setDirty(false);
        toast.success('تم حفظ الإعدادات');
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('Save clinic settings error:', errData);
        toast.error(errData.error || 'خطأ في حفظ الإعدادات');
      }
    } catch (err) {
      console.error('Save clinic settings network error:', err);
      toast.error('خطأ في الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  }, [form, setClinicSettings, setClinicName]);

  // Auto-save on blur with debounce
  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (dirty) handleSave();
    }, 800);
  }, [dirty, handleSave]);

  // Update form field
  const updateField = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setDirty(true);
    // Live preview for clinic name
    if (field === 'name' && value.trim()) {
      setClinicName(value.trim());
    }
  };

  // Handle blur - auto save
  const handleBlur = () => {
    scheduleSave();
  };

  // Logo upload
  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  // Compress image to fit within Firestore limits (~900KB base64)
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        // Max dimensions for small logo
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let { width, height } = img;
        
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Start with quality 0.7 and reduce if needed
        let quality = 0.7;
        let base64 = canvas.toDataURL('image/jpeg', quality);
        
        // Reduce quality until under 800KB
        while (base64.length > 800000 && quality > 0.1) {
          quality -= 0.1;
          base64 = canvas.toDataURL('image/jpeg', quality);
        }
        
        resolve(base64);
        URL.revokeObjectURL(img.src);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة');
      return;
    }

    try {
      const base64 = await compressImage(file);
      updateField('logo', base64);
      setClinicSettings({ logo: base64 });
      handleSave({ ...form, logo: base64 });
    } catch {
      toast.error('خطأ في معالجة الصورة');
    }
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Remove logo
  const handleRemoveLogo = () => {
    updateField('logo', '');
    setClinicSettings({ logo: '' });
    handleSave({ ...form, logo: '' });
  };

  // Color selection
  const handleColorSelect = (colorKey: string) => {
    updateField('primaryColor', colorKey);
    setClinicSettings({ primaryColor: colorKey });
    handleSave({ ...form, primaryColor: colorKey });
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="p-4 pb-24">
        <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-6" />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-border mb-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      {/* Back Button */}
      <button
        onClick={() => setScreen('admin-settings')}
        className="flex items-center gap-2 mb-4 px-3 py-2 bg-white dark:bg-gray-800 rounded-xl border border-border shadow-sm active:scale-[0.97] transition-all"
      >
        <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <ArrowRight className="w-4 h-4 text-foreground" />
        </div>
        <span className="text-sm font-medium">رجوع</span>
      </button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-500" />
          إعدادات العيادة
        </h2>
        <p className="text-xs text-muted-foreground mt-1">تخصيص بيانات ومظهر العيادة</p>
      </motion.div>

      {/* Live Preview Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="bg-gradient-to-bl from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800 mb-4"
      >
        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mb-2">معاينة مباشرة</p>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-800 border border-border flex items-center justify-center overflow-hidden shadow-sm">
            {form.logo ? (
              <img src={form.logo} alt="شعار" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-7 h-7 text-emerald-400" />
            )}
          </div>
          <div>
            <p className="font-bold text-sm">{form.name || 'اسم العيادة'}</p>
            {form.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">{form.description}</p>
            )}
            {form.phone && (
              <p className="text-[11px] text-muted-foreground mt-0.5" dir="ltr">{form.phone}</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Clinic Name */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-border mb-3 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium">اسم العيادة</p>
            <p className="text-[11px] text-muted-foreground">الاسم المعروض في التطبيق</p>
          </div>
        </div>
        <input
          type="text"
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          onBlur={handleBlur}
          placeholder="أدخل اسم العيادة"
          className="w-full h-11 px-3 bg-gray-50 dark:bg-gray-700 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
        />
      </motion.div>

      {/* Logo Upload */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-border mb-3 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <ImagePlus className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium">شعار العيادة</p>
            <p className="text-[11px] text-muted-foreground">الصورة المعروضة كشعار (أقل من 2 ميجا)</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoChange}
          className="hidden"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogoClick}
            className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors group"
          >
            {form.logo ? (
              <img src={form.logo} alt="شعار" className="w-full h-full object-cover" />
            ) : (
              <ImagePlus className="w-7 h-7 text-gray-400 group-hover:text-emerald-500 transition-colors" />
            )}
          </button>
          <div className="flex-1">
            {form.logo ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogoClick}
                  className="text-xs text-emerald-600 dark:text-emerald-400 font-medium px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg"
                >
                  تغيير الشعار
                </button>
                <button
                  onClick={handleRemoveLogo}
                  className="text-xs text-red-500 font-medium px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> حذف
                </button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">اضغط لاختيار صورة</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Description */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-border mb-3 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium">وصف العيادة</p>
            <p className="text-[11px] text-muted-foreground">نبذة مختصرة عن العيادة</p>
          </div>
        </div>
        <textarea
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          onBlur={handleBlur}
          placeholder="أدخل وصف العيادة..."
          rows={3}
          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow resize-none"
        />
      </motion.div>

      {/* Phone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-border mb-3 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
            <Phone className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <p className="text-sm font-medium">هاتف العيادة</p>
            <p className="text-[11px] text-muted-foreground">رقم التواصل الرئيسي</p>
          </div>
        </div>
        <div className="relative">
          <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            onBlur={handleBlur}
            placeholder="رقم هاتف العيادة"
            className="w-full h-11 pr-10 pl-3 bg-gray-50 dark:bg-gray-700 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
            dir="ltr"
          />
        </div>
      </motion.div>

      {/* Address */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-border mb-3 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
            <MapPin className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-medium">عنوان العيادة</p>
            <p className="text-[11px] text-muted-foreground">الموقع الجغرافي للعيادة</p>
          </div>
        </div>
        <div className="relative">
          <MapPin className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
          <textarea
            value={form.address}
            onChange={(e) => updateField('address', e.target.value)}
            onBlur={handleBlur}
            placeholder="أدخل عنوان العيادة..."
            rows={2}
            className="w-full pr-10 pl-3 py-2 bg-gray-50 dark:bg-gray-700 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow resize-none"
          />
        </div>
      </motion.div>

      {/* Primary Color */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.35 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-border mb-3 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
            <Palette className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-medium">اللون الرئيسي</p>
            <p className="text-[11px] text-muted-foreground">لون السمة الأساسي للتطبيق</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color.key}
              onClick={() => handleColorSelect(color.key)}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                form.primaryColor === color.key
                  ? 'border-current shadow-sm scale-105 ' + color.ring + '/30'
                  : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="relative">
                <div className={`w-9 h-9 rounded-full ${color.bg} flex items-center justify-center`}>
                  {form.primaryColor === color.key && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      <Check className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </div>
                {form.primaryColor === color.key && (
                  <motion.div
                    layoutId="color-ring"
                    className={`absolute inset-0 w-9 h-9 rounded-full ring-2 ${color.ring} ring-offset-2 ring-offset-white dark:ring-offset-gray-800`}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">{color.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="mt-4"
      >
        <button
          onClick={() => handleSave()}
          disabled={saving || !dirty}
          className="w-full h-12 bg-gradient-to-l from-emerald-600 to-teal-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5" />
              حفظ الإعدادات
            </>
          )}
        </button>
        {dirty && !saving && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400 text-center mt-2">
            لديك تغييرات غير محفوظة
          </p>
        )}
      </motion.div>
    </div>
  );
}
