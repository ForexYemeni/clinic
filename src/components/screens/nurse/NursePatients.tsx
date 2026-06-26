'use client';

import { useEffect, useState } from 'react';
import { PatientCard } from '@/components/shared/PatientCard';
import { SearchBar } from '@/components/shared/SearchBar';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ModalSheet } from '@/components/shared/ModalSheet';
import { FAB } from '@/components/shared/FAB';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users, Heart, Droplets, Phone, FileText } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string | null;
  bloodType: string | null;
  chronicDiseases: string | null;
  allergies: string | null;
  _count: { visits: number; emergencies: number; appointments: number };
}

export function NursePatients() {
  const { setScreen } = useAppStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
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
      if (res.ok) {
        toast.success('تم إضافة المريض');
        setShowAdd(false);
        setForm({ name: '', age: '', gender: 'male', phone: '', emergencyPhone: '', address: '', bloodType: '', chronicDiseases: '', allergies: '', medicalHistory: '', notes: '' });
        fetchPatients();
      }
    } catch {
      toast.error('خطأ في إضافة المريض');
    }
  };

  const handleViewPatient = async (id: string) => {
    try {
      const res = await fetch(`/api/patients/${id}`);
      const data = await res.json();
      setSelectedPatient(data.patient);
      setShowDetail(true);
    } catch (error) {
      console.error(error);
    }
  };

  const filtered = patients.filter((p) =>
    p.name.includes(search) || (p.phone && p.phone.includes(search))
  );

  if (loading) return <LoadingSpinner text="جاري تحميل المرضى..." />;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-foreground mb-4">المرضى</h2>

      <SearchBar value={search} onChange={setSearch} placeholder="بحث عن مريض..." />

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="لا يوجد مرضى" description="قم بإضافة مريض جديد" />
      ) : (
        <div className="space-y-3 mt-4">
          {filtered.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onClick={() => handleViewPatient(patient.id)}
            />
          ))}
        </div>
      )}

      <FAB onClick={() => setShowAdd(true)} />

      <ModalSheet open={showAdd} onClose={() => setShowAdd(false)} title="إضافة مريض">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>الاسم *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-12 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>العمر *</Label>
              <Input value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} type="number" className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>الجنس</Label>
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">ذكر</SelectItem>
                  <SelectItem value="female">أنثى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>رقم الهاتف</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" className="h-12 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>فصيلة الدم</Label>
            <Select value={form.bloodType} onValueChange={(v) => setForm({ ...form, bloodType: v })}>
              <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="اختر" /></SelectTrigger>
              <SelectContent>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                  <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>الأمراض المزمنة</Label>
            <Input value={form.chronicDiseases} onChange={(e) => setForm({ ...form, chronicDiseases: e.target.value })} className="h-12 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>الحساسية</Label>
            <Input value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} className="h-12 rounded-xl" />
          </div>
          <Button onClick={handleAdd} className="w-full h-12 rounded-xl" disabled={!form.name || !form.age}>
            إضافة المريض
          </Button>
        </div>
      </ModalSheet>

      <ModalSheet open={showDetail} onClose={() => setShowDetail(false)} title="ملف المريض">
        {selectedPatient && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                selectedPatient.gender === 'male' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-pink-100 dark:bg-pink-900/30'
              }`}>
                <Users className={`w-6 h-6 ${selectedPatient.gender === 'male' ? 'text-blue-600' : 'text-pink-600'}`} />
              </div>
              <div>
                <h3 className="font-bold text-lg">{selectedPatient.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedPatient.age} سنة • {selectedPatient.gender === 'male' ? 'ذكر' : 'أنثى'}</p>
              </div>
            </div>

            {selectedPatient.bloodType && (
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-red-500" />
                <span className="text-sm">فصيلة الدم: {selectedPatient.bloodType}</span>
              </div>
            )}
            {selectedPatient.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm" dir="ltr">{selectedPatient.phone}</span>
              </div>
            )}
            {selectedPatient.chronicDiseases && (
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">أمراض مزمنة</p>
                <p className="text-sm">{selectedPatient.chronicDiseases}</p>
              </div>
            )}
            {selectedPatient.allergies && (
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400">حساسية</p>
                <p className="text-sm">{selectedPatient.allergies}</p>
              </div>
            )}
            {selectedPatient.medicalHistory && (
              <div className="bg-muted/50 p-3 rounded-xl">
                <p className="text-xs font-semibold text-muted-foreground">التاريخ المرضي</p>
                <p className="text-sm">{selectedPatient.medicalHistory}</p>
              </div>
            )}

            {/* Recent visits */}
            {selectedPatient.visits?.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">آخر الزيارات</h4>
                {selectedPatient.visits.slice(0, 3).map((v: any) => (
                  <div key={v.id} className="bg-muted/50 rounded-xl p-3 mb-2">
                    <p className="text-sm font-medium">{v.reason || 'زيارة'}</p>
                    {v.diagnosis && <p className="text-xs text-muted-foreground">التشخيص: {v.diagnosis}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </ModalSheet>
    </div>
  );
}
