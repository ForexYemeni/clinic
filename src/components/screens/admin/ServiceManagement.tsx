'use client';

import { useEffect, useState } from 'react';
import { ServiceCard } from '@/components/shared/ServiceCard';
import { SearchBar } from '@/components/shared/SearchBar';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ModalSheet } from '@/components/shared/ModalSheet';
import { FAB } from '@/components/shared/FAB';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, BriefcaseMedical } from 'lucide-react';
import { toast } from 'sonner';

interface ServiceItem {
  id: string;
  name: string;
  nameAr: string;
  description: string | null;
  price: number;
  duration: number;
  category: string | null;
  active: boolean;
  _count: { patientServices: number };
}

const categories = ['فحوصات', 'علاجات', 'جروح', 'إسعافات', 'خدمات خاصة'];

export function ServiceManagement() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [form, setForm] = useState({
    name: '', nameAr: '', description: '', price: '', duration: '15', category: '',
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      setServices(data.services || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          duration: parseInt(form.duration),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('تم إضافة الخدمة بنجاح');
        setShowAdd(false);
        setForm({ name: '', nameAr: '', description: '', price: '', duration: '15', category: '' });
        fetchServices();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('خطأ في إضافة الخدمة');
    }
  };

  const handleEdit = async () => {
    if (!selectedService) return;
    try {
      const res = await fetch(`/api/services/${selectedService.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          duration: parseInt(form.duration),
        }),
      });
      if (res.ok) {
        toast.success('تم تحديث الخدمة');
        setShowEdit(false);
        fetchServices();
      }
    } catch {
      toast.error('خطأ في التحديث');
    }
  };

  const handleToggle = async (service: ServiceItem) => {
    try {
      await fetch(`/api/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !service.active }),
      });
      toast.success(service.active ? 'تم تعطيل الخدمة' : 'تم تفعيل الخدمة');
      fetchServices();
    } catch {
      toast.error('خطأ في تحديث الحالة');
    }
  };

  const filtered = services.filter((s) => {
    const matchSearch = s.nameAr.includes(search) || s.name.includes(search);
    const matchCategory = filterCategory === 'all' || s.category === filterCategory;
    return matchSearch && matchCategory;
  });

  if (loading) return <LoadingSpinner text="جاري تحميل الخدمات..." />;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-foreground mb-4">إدارة الخدمات</h2>

      <SearchBar value={search} onChange={setSearch} placeholder="بحث عن خدمة..." />

      {/* Category filter */}
      <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
        <button onClick={() => setFilterCategory('all')}>
          <Badge variant={filterCategory === 'all' ? 'default' : 'outline'} className="cursor-pointer whitespace-nowrap">
            الكل
          </Badge>
        </button>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setFilterCategory(cat)}>
            <Badge variant={filterCategory === cat ? 'default' : 'outline'} className="cursor-pointer whitespace-nowrap">
              {cat}
            </Badge>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={BriefcaseMedical} title="لا توجد خدمات" description="قم بإضافة خدمة جديدة" />
      ) : (
        <div className="space-y-3 mt-4">
          {filtered.map((service) => (
            <div key={service.id} className="relative">
              <ServiceCard
                service={service}
                onClick={() => {
                  setSelectedService(service);
                  setForm({
                    name: service.name,
                    nameAr: service.nameAr,
                    description: service.description || '',
                    price: service.price.toString(),
                    duration: service.duration.toString(),
                    category: service.category || '',
                  });
                  setShowEdit(true);
                }}
              />
            </div>
          ))}
        </div>
      )}

      <FAB onClick={() => { setForm({ name: '', nameAr: '', description: '', price: '', duration: '15', category: '' }); setShowAdd(true); }} />

      <ModalSheet open={showAdd} onClose={() => setShowAdd(false)} title="إضافة خدمة جديدة">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>الاسم بالعربية *</Label>
            <Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} placeholder="اسم الخدمة بالعربية" className="h-12 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>الاسم بالإنجليزية *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Service name" dir="ltr" className="h-12 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>السعر (ر.س) *</Label>
              <Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} type="number" placeholder="0" className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>المدة (دقيقة)</Label>
              <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} type="number" placeholder="15" className="h-12 rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>التصنيف</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="اختر التصنيف" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>الوصف</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="وصف الخدمة" className="rounded-xl" />
          </div>
          <Button onClick={handleAdd} className="w-full h-12 rounded-xl" disabled={!form.nameAr || !form.name || !form.price}>
            إضافة الخدمة
          </Button>
        </div>
      </ModalSheet>

      <ModalSheet open={showEdit} onClose={() => setShowEdit(false)} title="تعديل الخدمة">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>الاسم بالعربية</Label>
            <Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} className="h-12 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>الاسم بالإنجليزية</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} dir="ltr" className="h-12 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>السعر (ر.س)</Label>
              <Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} type="number" className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>المدة (دقيقة)</Label>
              <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} type="number" className="h-12 rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>التصنيف</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleEdit} className="flex-1 h-12 rounded-xl">حفظ التعديلات</Button>
            <Button
              variant={selectedService?.active ? 'outline' : 'default'}
              onClick={() => { if (selectedService) handleToggle(selectedService); }}
              className="h-12 rounded-xl"
            >
              {selectedService?.active ? 'تعطيل' : 'تفعيل'}
            </Button>
          </div>
        </div>
      </ModalSheet>
    </div>
  );
}
