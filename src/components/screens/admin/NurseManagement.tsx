'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SearchBar } from '@/components/shared/SearchBar';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ModalSheet } from '@/components/shared/ModalSheet';
import { FAB } from '@/components/shared/FAB';
import { Plus, UserCheck, UserX, Phone, Mail, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface NurseUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  active: boolean;
  createdAt: string;
  _count: {
    registeredPatients: number;
    emergencies: number;
    appointments: number;
    patientServices: number;
  };
}

export function NurseManagement() {
  const [nurses, setNurses] = useState<NurseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedNurse, setSelectedNurse] = useState<NurseUser | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });

  useEffect(() => {
    fetchNurses();
  }, []);

  const fetchNurses = async () => {
    try {
      const res = await fetch('/api/users?role=nurse');
      const data = await res.json();
      setNurses(data.users || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'nurse' }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('تم إضافة الممرض بنجاح');
        setShowAdd(false);
        setForm({ name: '', email: '', password: '', phone: '' });
        fetchNurses();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('خطأ في إضافة الممرض');
    }
  };

  const handleEdit = async () => {
    if (!selectedNurse) return;
    try {
      const res = await fetch(`/api/users/${selectedNurse.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone }),
      });
      if (res.ok) {
        toast.success('تم تحديث البيانات');
        setShowEdit(false);
        fetchNurses();
      }
    } catch {
      toast.error('خطأ في تحديث البيانات');
    }
  };

  const handleToggleActive = async (nurse: NurseUser) => {
    try {
      const res = await fetch(`/api/users/${nurse.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !nurse.active }),
      });
      if (res.ok) {
        toast.success(nurse.active ? 'تم تعطيل الحساب' : 'تم تفعيل الحساب');
        fetchNurses();
      }
    } catch {
      toast.error('خطأ في تحديث الحالة');
    }
  };

  const filtered = nurses.filter((n) =>
    n.name.includes(search) || n.email.includes(search)
  );

  if (loading) return <LoadingSpinner text="جاري تحميل بيانات التمريض..." />;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-foreground mb-4">إدارة التمريض</h2>

      <SearchBar value={search} onChange={setSearch} placeholder="بحث عن ممرض..." />

      {filtered.length === 0 ? (
        <EmptyState icon={UserCheck} title="لا يوجد ممرضون" description="قم بإضافة ممرض جديد" />
      ) : (
        <div className="space-y-3 mt-4">
          {filtered.map((nurse) => (
            <Card key={nurse.id} className="medical-card p-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground">{nurse.name}</h3>
                    <Badge variant={nurse.active ? 'default' : 'outline'}>
                      {nurse.active ? 'نشط' : 'معطل'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" />
                    <span dir="ltr" className="text-xs">{nurse.email}</span>
                  </div>
                  {nurse.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Phone className="w-3.5 h-3.5" />
                      <span dir="ltr">{nurse.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{nurse._count.registeredPatients} مريض</span>
                    <span>{nurse._count.emergencies} طوارئ</span>
                    <span>{nurse._count.patientServices} خدمة</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        setSelectedNurse(nurse);
                        setForm({ name: nurse.name, email: nurse.email, password: '', phone: nurse.phone || '' });
                        setShowEdit(true);
                      }}
                    >
                      تعديل
                    </Button>
                    <Button
                      variant={nurse.active ? 'outline' : 'default'}
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleToggleActive(nurse)}
                    >
                      {nurse.active ? (
                        <>
                          <UserX className="w-3 h-3 ml-1" /> تعطيل
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3 h-3 ml-1" /> تفعيل
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <FAB onClick={() => { setForm({ name: '', email: '', password: '', phone: '' }); setShowAdd(true); }} />

      {/* Add Nurse Sheet */}
      <ModalSheet open={showAdd} onClose={() => setShowAdd(false)} title="إضافة ممرض جديد">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>الاسم</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="اسم الممرض" className="h-12 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>البريد الإلكتروني</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@clinic.com" dir="ltr" className="h-12 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>كلمة المرور</Label>
            <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" placeholder="••••••" dir="ltr" className="h-12 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>رقم الهاتف</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="05XXXXXXXX" dir="ltr" className="h-12 rounded-xl" />
          </div>
          <Button onClick={handleAdd} className="w-full h-12 rounded-xl" disabled={!form.name || !form.email || !form.password}>
            إضافة الممرض
          </Button>
        </div>
      </ModalSheet>

      {/* Edit Nurse Sheet */}
      <ModalSheet open={showEdit} onClose={() => setShowEdit(false)} title="تعديل بيانات الممرض">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>الاسم</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-12 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>البريد الإلكتروني</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} dir="ltr" className="h-12 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>رقم الهاتف</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" className="h-12 rounded-xl" />
          </div>
          <Button onClick={handleEdit} className="w-full h-12 rounded-xl">
            حفظ التعديلات
          </Button>
        </div>
      </ModalSheet>
    </div>
  );
}
