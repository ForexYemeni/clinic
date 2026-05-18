'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmergencyBadge } from '@/components/shared/EmergencyBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAppStore } from '@/lib/store';
import { ArrowRight, User, Phone, MapPin, Droplets, Heart, AlertTriangle, Calendar, Clock, DollarSign, Pill, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface PatientDetailData {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string | null;
  emergencyPhone: string | null;
  address: string | null;
  bloodType: string | null;
  chronicDiseases: string | null;
  allergies: string | null;
  medicalHistory: string | null;
  notes: string | null;
  createdAt: string;
  registeredByUser: { name: string } | null;
  visits: Array<{
    id: string;
    visitDate: string;
    reason: string | null;
    diagnosis: string | null;
    vitals: string | null;
    status: string;
    notes: string | null;
  }>;
  services: Array<{
    id: string;
    status: string;
    notes: string | null;
    performedAt: string | null;
    service: { nameAr: string; price: number };
    nurse: { name: string } | null;
  }>;
  medications: Array<{
    id: string;
    name: string;
    dosage: string | null;
    frequency: string | null;
    startDate: string;
    endDate: string | null;
    notes: string | null;
  }>;
  emergencies: Array<{
    id: string;
    severity: string;
    arrivalTime: string;
    treatmentTime: string | null;
    status: string;
    notes: string | null;
    nurse: { name: string } | null;
  }>;
  appointments: Array<{
    id: string;
    date: string;
    duration: number;
    type: string | null;
    status: string;
    notes: string | null;
    nurse: { name: string } | null;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    type: string;
    description: string | null;
    createdAt: string;
  }>;
  invoices: Array<{
    id: string;
    total: number;
    paid: number;
    status: string;
    dueDate: string | null;
    createdAt: string;
  }>;
  _count: Record<string, number>;
}

export function PatientDetail() {
  const { goBack } = useAppStore();
  const [patient, setPatient] = useState<PatientDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const patientId = useAppStore.getState().selectedPatientId;

  useEffect(() => {
    if (patientId) fetchPatient();
  }, [patientId]);

  const fetchPatient = async () => {
    try {
      const res = await fetch(`/api/patients/${patientId}`);
      const data = await res.json();
      setPatient(data.patient);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="جاري تحميل بيانات المريض..." />;
  if (!patient) return null;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full" onClick={goBack}>
          <ArrowRight className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-bold text-foreground">ملف المريض</h2>
      </div>

      {/* Patient Info Card */}
      <Card className="medical-card p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            patient.gender === 'male' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-pink-100 dark:bg-pink-900/30'
          }`}>
            <User className={`w-7 h-7 ${
              patient.gender === 'male' ? 'text-blue-600 dark:text-blue-400' : 'text-pink-600 dark:text-pink-400'
            }`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground">{patient.name}</h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span>{patient.age} سنة</span>
              <span>•</span>
              <span>{patient.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
              {patient.bloodType && (
                <>
                  <span>•</span>
                  <Badge variant="outline" className="text-xs">
                    <Droplets className="w-3 h-3 ml-1 text-red-500" />
                    {patient.bloodType}
                  </Badge>
                </>
              )}
            </div>
            {patient.phone && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                <Phone className="w-3.5 h-3.5" />
                <span dir="ltr">{patient.phone}</span>
              </div>
            )}
            {patient.address && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{patient.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Medical alerts */}
        {(patient.allergies || patient.chronicDiseases) && (
          <div className="mt-4 space-y-2">
            {patient.allergies && (
              <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 rounded-lg p-2.5">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400">حساسية</p>
                  <p className="text-xs text-red-600 dark:text-red-300">{patient.allergies}</p>
                </div>
              </div>
            )}
            {patient.chronicDiseases && (
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2.5">
                <Heart className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">أمراض مزمنة</p>
                  <p className="text-xs text-amber-600 dark:text-amber-300">{patient.chronicDiseases}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="visits" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-11">
          <TabsTrigger value="visits" className="text-xs">
            <FileText className="w-3.5 h-3.5 ml-1" />
            الزيارات
          </TabsTrigger>
          <TabsTrigger value="services" className="text-xs">
            <Heart className="w-3.5 h-3.5 ml-1" />
            الخدمات
          </TabsTrigger>
          <TabsTrigger value="meds" className="text-xs">
            <Pill className="w-3.5 h-3.5 ml-1" />
            الأدوية
          </TabsTrigger>
          <TabsTrigger value="finance" className="text-xs">
            <DollarSign className="w-3.5 h-3.5 ml-1" />
            المالية
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visits" className="mt-3 space-y-3">
          {patient.visits.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">لا توجد زيارات</p>
          ) : (
            patient.visits.map((visit) => (
              <Card key={visit.id} className="medical-card p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{format(new Date(visit.visitDate), 'dd/MM/yyyy', { locale: ar })}</span>
                  </div>
                  <StatusBadge status={visit.status} size="sm" />
                </div>
                {visit.reason && <p className="text-sm font-medium">{visit.reason}</p>}
                {visit.diagnosis && <p className="text-xs text-muted-foreground mt-1">التشخيص: {visit.diagnosis}</p>}
                {visit.vitals && (
                  <div className="mt-2 bg-muted/50 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">العلامات الحيوية:</p>
                    {(() => {
                      try {
                        const vitals = JSON.parse(visit.vitals);
                        return (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {vitals.bp && <Badge variant="outline" className="text-xs">ضغط: {vitals.bp}</Badge>}
                            {vitals.pulse && <Badge variant="outline" className="text-xs">نبض: {vitals.pulse}</Badge>}
                            {vitals.temp && <Badge variant="outline" className="text-xs">حرارة: {vitals.temp}</Badge>}
                            {vitals.o2 && <Badge variant="outline" className="text-xs">أكسجين: {vitals.o2}%</Badge>}
                            {vitals.sugar && <Badge variant="outline" className="text-xs">سكر: {vitals.sugar}</Badge>}
                          </div>
                        );
                      } catch {
                        return null;
                      }
                    })()}
                  </div>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="services" className="mt-3 space-y-3">
          {patient.services.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">لا توجد خدمات</p>
          ) : (
            patient.services.map((ps) => (
              <Card key={ps.id} className="medical-card p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{ps.service.nameAr}</p>
                    <p className="text-xs text-muted-foreground">
                      {ps.nurse?.name || '-'} • {ps.service.price} ر.س
                    </p>
                  </div>
                  <StatusBadge status={ps.status} size="sm" />
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="meds" className="mt-3 space-y-3">
          {patient.medications.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">لا توجد أدوية</p>
          ) : (
            patient.medications.map((med) => (
              <Card key={med.id} className="medical-card p-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                    <Pill className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{med.name}</p>
                    {med.dosage && <p className="text-xs text-muted-foreground">الجرعة: {med.dosage}</p>}
                    {med.frequency && <p className="text-xs text-muted-foreground">التكرار: {med.frequency}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      من: {format(new Date(med.startDate), 'dd/MM/yyyy', { locale: ar })}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="finance" className="mt-3 space-y-3">
          {patient.payments.length === 0 && patient.invoices.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">لا توجد بيانات مالية</p>
          ) : (
            <>
              {patient.invoices.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">الفواتير</h4>
                  {patient.invoices.map((inv) => (
                    <Card key={inv.id} className="medical-card p-3 mb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{inv.total} ر.س</p>
                          <p className="text-xs text-muted-foreground">مدفوع: {inv.paid} ر.س</p>
                        </div>
                        <StatusBadge status={inv.status} size="sm" />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              {patient.payments.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">المدفوعات</h4>
                  {patient.payments.map((pay) => (
                    <Card key={pay.id} className="medical-card p-3 mb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{pay.description || pay.type === 'payment' ? 'دفعة' : 'استرداد'}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(pay.createdAt), 'dd/MM/yyyy', { locale: ar })} • {pay.method}
                          </p>
                        </div>
                        <span className={`text-sm font-bold ${pay.type === 'payment' ? 'text-emerald-600' : 'text-red-500'}`}>
                          {pay.type === 'payment' ? '+' : '-'}{pay.amount} ر.س
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
