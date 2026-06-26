'use client';

import { useEffect, useState } from 'react';
import { PatientCard } from '@/components/shared/PatientCard';
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
import { Plus, Users } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string | null;
  emergencyPhone: string | null;
  bloodType: string | null;
  _count: {
    visits: number;
    emergencies: number;
    appointments: number;
  };
}

export function PatientManagement() {
  const { setScreen } = useAppStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '', age: '', gender: 'male', phone: '', emergencyPhone: '',
    address: '', bloodType: '', chronicDiseases: '', allergies: '', medicalHistory: '', notes: '',
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patients');
      const data = await res.json();
      setPatients(data.patients || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          age: parseInt(form.age),
          registeredBy: useAppStore.getState().user?.id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('تم إضافة المريض بنجاح');
        setShowAdd(false);
        setForm({ name: '', age: '', gender: 'male', phone: '', emergencyPhone: '', address: '', bloodType: '', chronicDiseases: '', allergies: '', medicalHistory: '', notes: '' });
        fetchPatients();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('خطأ في إضافة المريض');
    }
  };

  const filtered = patients.filter((p) =>
    p.name.includes(search) || (p.phone && p.phone.includes(search)) || (p.bloodType && p.bloodType.includes(search))
  );

  if (loading) return <LoadingSpinner text="جاري تحميل بيانات المرضى..." />;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-foreground mb-4">إدارة المرضى</h2>

      <SearchBar value={search} onChange={setSearch} placeholder="بحث بالاسم أو الهاتف أو فصيلة الدم..." />

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="لا يوجد مرضى" description="قم بإضافة مريض جديد" />
      ) : (
        <div className="space-y-3 mt-4">
          {filtered.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onClick={() => {
                useAppStore.setState({ selectedPatientId: patient.id });
                setScreen('patient-detail');
              }}
            />
          ))}
        </div>
      )}

      <FAB onClick={() => setShowAdd(true)} />

      <ModalSheet open={showAdd} onClose={() => setShowAdd(false)} title="إضافة مريض جديد">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>الاسم الكامل *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="اسم المريض" className="h-12 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>العمر *</Label>
              <Input value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} type="number" placeholder="العمر" className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>الجنس *</Label>
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">ذكر</SelectItem>
                  <SelectItem value="female">أنثى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="05XXXXXXXX" dir="ltr" className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>رقم الطوارئ</Label>
              <Input value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} placeholder="05XXXXXXXX" dir="ltr" className="h-12 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>فصيلة الدم</Label>
              <Select value={form.bloodType} onValueChange={(v) => setForm({ ...form, bloodType: v })}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="اختر" />
                </SelectTrigger>
                <SelectContent>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                    <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>العنوان</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="العنوان" className="h-12 rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>الأمراض المزمنة</Label>
            <Input value={form.chronicDiseases} onChange={(e) => setForm({ ...form, chronicDiseases: e.target.value })} placeholder="مفصولة بفواصل" className="h-12 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>الحساسية</Label>
            <Input value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} placeholder="مفصولة بفواصل" className="h-12 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>التاريخ المرضي</Label>
            <Textarea value={form.medicalHistory} onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })} placeholder="التاريخ المرضي" className="rounded-xl min-h-[80px]" />
          </div>
          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="ملاحظات إضافية" className="rounded-xl min-h-[60px]" />
          </div>
          <Button onClick={handleAdd} className="w-full h-12 rounded-xl" disabled={!form.name || !form.age}>
            إضافة المريض
          </Button>
        </div>
      </ModalSheet>
    </div>
  );
}
