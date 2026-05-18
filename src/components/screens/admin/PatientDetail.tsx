'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Phone, AlertCircle, MapPin, Activity, Shield, FileText, ClipboardList, User, Stethoscope, Heart, Receipt, DollarSign, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';
import { useData } from '@/hooks/useData';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import {
  PatientItem, formatCurrency, formatDate, formatTime,
  statusColors, statusLabels, genderLabels,
  paymentMethodLabels,
} from '@/lib/constants';
import { toast } from 'sonner';

interface PatientDetailProps {
  role: 'admin' | 'nurse';
}

const PatientDetail = React.memo(function PatientDetail({ role }: PatientDetailProps) {
  const { selectedPatientId, setScreen, user } = useAppStore();
  const patientUrl = selectedPatientId ? '/api/patients/' + selectedPatientId : null;
  const { data: patient, loading, refresh } = useData<PatientItem>(patientUrl);
  const [activeTab, setActiveTab] = useState<'visits' | 'services' | 'billing' | 'medical'>('visits');
  const [showAddService, setShowAddService] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'cash', description: '' });
  const [visitForm, setVisitForm] = useState({ reason: '', diagnosis: '', notes: '', bloodPressure: '', heartRate: '', temperature: '', oxygenLevel: '', sugarLevel: '' });
  const [serviceForm, setServiceForm] = useState({ serviceId: '' });
  const [saving, setSaving] = useState(false);

  const { data: services } = useData<Record<string, unknown>[]>('/api/services');

  const tabs = useMemo(() => [
    { id: 'visits' as const, label: 'الزيارات', icon: FileText },
    { id: 'services' as const, label: 'الخدمات', icon: Stethoscope },
    { id: 'billing' as const, label: 'الفواتير', icon: Receipt },
    { id: 'medical' as const, label: 'السجل الطبي', icon: Activity },
  ], []);

  const billingSummary = useMemo(() => {
    if (!patient) return { total: 0, paid: 0, remaining: 0 };
    const total = patient.invoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
    const paid = patient.invoices?.reduce((sum, inv) => sum + (inv.paid || 0), 0) || 0;
    return { total, paid, remaining: total - paid };
  }, [patient]);

  const handleAddService = async () => {
    if (!serviceForm.serviceId || !selectedPatientId) return;
    setSaving(true);
    try {
      await fetch('/api/patient-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientId,
          serviceId: serviceForm.serviceId,
          nurseId: user?.id,
          status: 'completed',
        }),
      });

      const service = (services || []).find((s: Record<string, unknown>) => s.id === serviceForm.serviceId);
      if (service) {
        const existingInvoices = patient?.invoices || [];
        const activeInvoice = existingInvoices.find((inv: any) => inv.status === 'unpaid' || inv.status === 'partial');

        if (activeInvoice) {
          const newItems = [...(activeInvoice.items || []), {
            serviceId: serviceForm.serviceId,
            serviceName: service.nameAr,
            price: service.price,
            quantity: 1,
            nurseName: user?.name,
            date: new Date().toISOString(),
          }];
          const newTotal = newItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
          await fetch('/api/invoices/' + activeInvoice.id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: newItems,
              total: newTotal,
              remaining: newTotal - (activeInvoice.paid || 0),
              status: (activeInvoice.paid || 0) >= newTotal ? 'paid' : (activeInvoice.paid || 0) > 0 ? 'partial' : 'unpaid',
            }),
          });
        } else {
          await fetch('/api/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patientId: selectedPatientId,
              items: [{
                serviceId: serviceForm.serviceId,
                serviceName: service.nameAr,
                price: service.price,
                quantity: 1,
                nurseName: user?.name,
                date: new Date().toISOString(),
              }],
              total: service.price,
              paid: 0,
              remaining: service.price,
              status: 'unpaid',
            }),
          });
        }
      }

      toast.success('تم إضافة الخدمة');
      setShowAddService(false);
      setServiceForm({ serviceId: '' });
      refresh();
    } catch {
      toast.error('خطأ في إضافة الخدمة');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPayment = async () => {
    if (!paymentForm.amount || !selectedPatientId) return;
    setSaving(true);
    try {
      const amount = parseFloat(paymentForm.amount);
      const methodLabel = paymentMethodLabels[paymentForm.method] || 'نقدي';
      const desc = paymentForm.description || ('دفع ' + methodLabel);

      await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientId,
          amount,
          type: 'payment',
          method: paymentForm.method,
          description: desc,
        }),
      });

      const activeInvoice = patient?.invoices?.find((inv: any) => inv.status === 'unpaid' || inv.status === 'partial');
      if (activeInvoice) {
        const newPaid = (activeInvoice.paid || 0) + amount;
        const total = activeInvoice.total || 0;
        await fetch('/api/invoices/' + activeInvoice.id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paid: newPaid,
            remaining: total - newPaid,
            status: newPaid >= total ? 'paid' : 'partial',
          }),
        });
      }

      toast.success('تم تسجيل الدفعة');
      setShowAddPayment(false);
      setPaymentForm({ amount: '', method: 'cash', description: '' });
      refresh();
    } catch {
      toast.error('خطأ في تسجيل الدفعة');
    } finally {
      setSaving(false);
    }
  };

  const handleAddVisit = async () => {
    if (!visitForm.reason || !selectedPatientId) return;
    setSaving(true);
    try {
      await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientId,
          ...visitForm,
          heartRate: visitForm.heartRate ? parseInt(visitForm.heartRate) : undefined,
          temperature: visitForm.temperature ? parseFloat(visitForm.temperature) : undefined,
          oxygenLevel: visitForm.oxygenLevel ? parseInt(visitForm.oxygenLevel) : undefined,
          sugarLevel: visitForm.sugarLevel ? parseInt(visitForm.sugarLevel) : undefined,
          status: 'completed',
          visitDate: new Date().toISOString(),
        }),
      });
      toast.success('تم إضافة الزيارة');
      setShowAddVisit(false);
      setVisitForm({ reason: '', diagnosis: '', notes: '', bloodPressure: '', heartRate: '', temperature: '', oxygenLevel: '', sugarLevel: '' });
      refresh();
    } catch {
      toast.error('خطأ في إضافة الزيارة');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SkeletonLoader type="patient-detail" />;
  if (!patient) return <EmptyState icon={User} title="لم يتم العثور على المريض" />;

  const handleCall = () => {
    if (patient.phone) window.open('tel:' + patient.phone, '_self');
  };

  return (
    <div className="pb-24 pt-0">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 -mx-4 px-4 pt-2 pb-8 rounded-b-3xl relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full border-4 border-white/5" />
        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full border-4 border-white/5" />
        <div className="flex items-center gap-3 mb-5">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-white hover:bg-white/20" onClick={() => setScreen(role === 'admin' ? 'admin-patients' : 'nurse-patients')}>
            <ChevronRight className="w-5 h-5" />
          </Button>
          <h2 className="text-white font-bold">ملف المريض</h2>
        </div>
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-white/30 ring-4 ring-white/10">
            <AvatarFallback className="bg-white/20 text-white text-xl font-bold backdrop-blur-sm">{patient.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-white">
            <h3 className="text-lg font-bold">{patient.name}</h3>
            <div className="flex items-center gap-3 mt-1 text-emerald-100 text-xs">
              <span>{patient.age} سنة</span>
              <span className="w-1 h-1 bg-emerald-200/50 rounded-full" />
              <span>{genderLabels[patient.gender] || patient.gender}</span>
              {patient.bloodType && (
                <Badge className="bg-white/20 text-white text-[10px] backdrop-blur-sm border border-white/10">🩸 {patient.bloodType}</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 -mt-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={'flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 ' + (activeTab === tab.id ? 'bg-white dark:bg-gray-800 shadow-sm text-emerald-600 dark:text-emerald-400' : 'bg-muted/50 text-muted-foreground hover:bg-muted')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-4 mt-4 space-y-3">
        {/* الزيارات - Visits Tab */}
        {activeTab === 'visits' && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">سجل الزيارات</h3>
              <Button size="sm" className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 h-8 text-xs" onClick={() => setShowAddVisit(true)}>
                <Plus className="w-3 h-3 ml-1" /> زيارة جديدة
              </Button>
            </div>
            {patient.visits?.length > 0 ? (
              <div className="space-y-2.5">
                {patient.visits.map((v) => (
                  <Card key={v.id} className="border-0 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-400" />
                    <CardContent className="p-3.5 pr-5">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-semibold">{v.reason}</p>
                        <Badge className={'text-[9px] ' + (statusColors[v.status] || statusColors.completed)}>{statusLabels[v.status] || 'مكتمل'}</Badge>
                      </div>
                      {v.diagnosis && <p className="text-xs text-muted-foreground mb-1">التشخيص: {v.diagnosis}</p>}
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Activity className="w-3 h-3" /> {formatDate(v.visitDate)}
                      </p>
                      {v.vitalSigns && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {v.vitalSigns.bloodPressure && <Badge className="text-[9px] bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">ضغط: {v.vitalSigns.bloodPressure}</Badge>}
                          {v.vitalSigns.heartRate && <Badge className="text-[9px] bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400">نبض: {v.vitalSigns.heartRate}</Badge>}
                          {v.vitalSigns.temperature && <Badge className="text-[9px] bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">حرارة: {v.vitalSigns.temperature}</Badge>}
                          {v.vitalSigns.oxygenLevel && <Badge className="text-[9px] bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">O₂: {v.vitalSigns.oxygenLevel}%</Badge>}
                          {v.vitalSigns.sugarLevel && <Badge className="text-[9px] bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">سكر: {v.vitalSigns.sugarLevel}</Badge>}
                        </div>
                      )}
                      {v.notes && <p className="text-xs text-muted-foreground mt-2 bg-muted/50 p-2 rounded-lg">{v.notes}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : <EmptyState icon={FileText} title="لا توجد زيارات" description="أضف زيارة جديدة للمريض" />}
          </motion.div>
        )}

        {/* الخدمات - Services Tab */}
        {activeTab === 'services' && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">الخدمات المقدمة</h3>
              {role === 'admin' && (
                <Button size="sm" className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 h-8 text-xs" onClick={() => setShowAddService(true)}>
                  <Plus className="w-3 h-3 ml-1" /> خدمة جديدة
                </Button>
              )}
            </div>
            {patient.services?.length > 0 ? (
              <div className="space-y-2.5">
                {patient.services.map((ps) => (
                  <Card key={ps.id} className="border-0 shadow-sm">
                    <CardContent className="p-3.5">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-semibold">{ps.service?.nameAr}</p>
                        <Badge className={'text-[9px] ' + (statusColors[ps.status] || statusColors.completed)}>{statusLabels[ps.status] || 'مكتمل'}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(ps.service?.price || 0)}</span>
                        <span>{ps.service?.duration} دقيقة</span>
                      </div>
                      {ps.nurse && <p className="text-[10px] text-muted-foreground mt-1">الممرض: {ps.nurse.name}</p>}
                      {ps.createdAt && <p className="text-[10px] text-muted-foreground">{formatDate(ps.createdAt)}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : <EmptyState icon={Stethoscope} title="لا توجد خدمات" description="أضف خدمة جديدة للمريض" />}
          </motion.div>
        )}

        {/* الفواتير - Billing Tab */}
        {activeTab === 'billing' && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">الإجمالي</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(billingSummary.total)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">المدفوع</p>
                  <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(billingSummary.paid)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">المتبقي</p>
                  <p className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(billingSummary.remaining)}</p>
                </CardContent>
              </Card>
            </div>
            {billingSummary.total > 0 && (
              <Progress value={(billingSummary.paid / billingSummary.total) * 100} className="h-2" />
            )}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">الفواتير</h3>
              {role === 'admin' && billingSummary.remaining > 0 && (
                <Button size="sm" className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 h-8 text-xs" onClick={() => setShowAddPayment(true)}>
                  <DollarSign className="w-3 h-3 ml-1" /> تسجيل دفعة
                </Button>
              )}
            </div>
            {patient.invoices?.length > 0 ? (
              <div className="space-y-2.5">
                {patient.invoices.map((inv) => (
                  <Card key={inv.id} className="border-0 shadow-sm">
                    <CardContent className="p-3.5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground">فاتورة - {formatDate(inv.createdAt)}</p>
                        <Badge className={'text-[9px] ' + statusColors[inv.status]}>{statusLabels[inv.status]}</Badge>
                      </div>
                      {inv.items && inv.items.length > 0 && (
                        <div className="space-y-1 mb-2">
                          {inv.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-xs bg-muted/50 p-2 rounded-lg">
                              <span className="truncate">{item.serviceName}</span>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(item.price)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
                        <span>الإجمالي: {formatCurrency(inv.total)}</span>
                        <span>المدفوع: {formatCurrency(inv.paid)}</span>
                        <span className="text-red-600 dark:text-red-400 font-semibold">المتبقي: {formatCurrency(inv.remaining || (inv.total - inv.paid))}</span>
                      </div>
                      {inv.total > inv.paid && (
                        <Progress value={(inv.paid / inv.total) * 100} className="h-1.5 mt-2" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState icon={Receipt} title="لا توجد فواتير" description="سيتم إنشاء فاتورة تلقائياً عند إضافة خدمات" />
            )}
            {patient.payments && patient.payments.length > 0 && (
              <React.Fragment>
                <h3 className="text-sm font-bold mt-4">آخر المدفوعات</h3>
                <div className="space-y-2">
                  {patient.payments.slice(0, 5).map((p) => (
                    <Card key={p.id} className="border-0 shadow-sm">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className={'w-8 h-8 rounded-lg flex items-center justify-center ' + (p.type === 'payment' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30')}>
                          <DollarSign className={'w-4 h-4 ' + (p.type === 'payment' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{p.description}</p>
                          <p className="text-[10px] text-muted-foreground">{formatDate(p.createdAt)} - {paymentMethodLabels[p.method || 'cash']}</p>
                        </div>
                        <span className={'text-sm font-bold ' + (p.type === 'payment' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                          {formatCurrency(p.amount)}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </React.Fragment>
            )}
          </motion.div>
        )}

        {/* السجل الطبي - Medical Record Tab */}
        {activeTab === 'medical' && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {patient.visits?.length > 0 && patient.visits[0]?.vitalSigns && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <h4 className="text-xs font-bold mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" /> آخر القراءات الحيوية
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {patient.visits[0].vitalSigns.bloodPressure && (
                      <div className="bg-red-50 dark:bg-red-900/10 p-2.5 rounded-xl">
                        <p className="text-[10px] text-muted-foreground">ضغط الدم</p>
                        <p className="text-sm font-bold text-red-600 dark:text-red-400" dir="ltr">{patient.visits[0].vitalSigns.bloodPressure}</p>
                      </div>
                    )}
                    {patient.visits[0].vitalSigns.heartRate && (
                      <div className="bg-pink-50 dark:bg-pink-900/10 p-2.5 rounded-xl">
                        <p className="text-[10px] text-muted-foreground">معدل النبض</p>
                        <p className="text-sm font-bold text-pink-600 dark:text-pink-400">{patient.visits[0].vitalSigns.heartRate} نبضة</p>
                      </div>
                    )}
                    {patient.visits[0].vitalSigns.temperature && (
                      <div className="bg-amber-50 dark:bg-amber-900/10 p-2.5 rounded-xl">
                        <p className="text-[10px] text-muted-foreground">الحرارة</p>
                        <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{patient.visits[0].vitalSigns.temperature}°C</p>
                      </div>
                    )}
                    {patient.visits[0].vitalSigns.oxygenLevel && (
                      <div className="bg-blue-50 dark:bg-blue-900/10 p-2.5 rounded-xl">
                        <p className="text-[10px] text-muted-foreground">الأكسجين</p>
                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{patient.visits[0].vitalSigns.oxygenLevel}%</p>
                      </div>
                    )}
                    {patient.visits[0].vitalSigns.sugarLevel && (
                      <div className="bg-purple-50 dark:bg-purple-900/10 p-2.5 rounded-xl">
                        <p className="text-[10px] text-muted-foreground">السكر</p>
                        <p className="text-sm font-bold text-purple-600 dark:text-purple-400">{patient.visits[0].vitalSigns.sugarLevel} mg/dL</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            {patient.phone && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground">الهاتف</p>
                    <p className="text-sm font-medium" dir="ltr">{patient.phone}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {patient.emergencyPhone && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-red-500 bg-red-50 dark:bg-red-900/30">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground">هاتف الطوارئ</p>
                    <p className="text-sm font-medium" dir="ltr">{patient.emergencyPhone}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {patient.address && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-blue-500 bg-blue-50 dark:bg-blue-900/30">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground">العنوان</p>
                    <p className="text-sm font-medium">{patient.address}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {patient.chronicDiseases && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-amber-500 bg-amber-50 dark:bg-amber-900/30">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground">الأمراض المزمنة</p>
                    <p className="text-sm font-medium">{patient.chronicDiseases}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {patient.allergies && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-purple-500 bg-purple-50 dark:bg-purple-900/30">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground">الحساسية</p>
                    <p className="text-sm font-medium">{patient.allergies}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {patient.medicalHistory && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-teal-500 bg-teal-50 dark:bg-teal-900/30">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground">التاريخ الطبي</p>
                    <p className="text-sm font-medium">{patient.medicalHistory}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {patient.notes && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 bg-gray-50 dark:bg-gray-900/30">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground">ملاحظات</p>
                    <p className="text-sm font-medium">{patient.notes}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {patient.medications && patient.medications.length > 0 && (
              <React.Fragment>
                <h4 className="text-xs font-bold mt-2">الأدوية الحالية</h4>
                <div className="space-y-2">
                  {patient.medications.map((med) => (
                    <Card key={med.id} className="border-0 shadow-sm">
                      <CardContent className="p-3.5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20 flex items-center justify-center">
                          <Heart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{med.name}</p>
                          <p className="text-xs text-muted-foreground">{med.dosage} - {med.frequency}</p>
                        </div>
                        {med.notes && <p className="text-[10px] text-muted-foreground max-w-[100px] text-left">{med.notes}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </React.Fragment>
            )}
          </motion.div>
        )}
      </div>

      {/* Add Visit Dialog */}
      <Dialog open={showAddVisit} onOpenChange={setShowAddVisit}>
        <DialogContent dir="rtl" className="rounded-2xl max-w-[90vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة زيارة جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs font-semibold">سبب الزيارة *</Label><Input value={visitForm.reason} onChange={(e) => setVisitForm({...visitForm, reason: e.target.value})} className="h-11 rounded-xl" placeholder="سبب الزيارة" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-semibold">التشخيص</Label><Input value={visitForm.diagnosis} onChange={(e) => setVisitForm({...visitForm, diagnosis: e.target.value})} className="h-11 rounded-xl" placeholder="التشخيص" /></div>
            <h4 className="text-xs font-bold text-muted-foreground pt-2">القراءات الحيوية</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5"><Label className="text-xs">ضغط الدم</Label><Input value={visitForm.bloodPressure} onChange={(e) => setVisitForm({...visitForm, bloodPressure: e.target.value})} className="h-10 rounded-xl text-xs" placeholder="120/80" dir="ltr" /></div>
              <div className="space-y-1.5"><Label className="text-xs">النبض</Label><Input type="number" value={visitForm.heartRate} onChange={(e) => setVisitForm({...visitForm, heartRate: e.target.value})} className="h-10 rounded-xl text-xs" placeholder="72" dir="ltr" /></div>
              <div className="space-y-1.5"><Label className="text-xs">الحرارة</Label><Input type="number" value={visitForm.temperature} onChange={(e) => setVisitForm({...visitForm, temperature: e.target.value})} className="h-10 rounded-xl text-xs" placeholder="37" dir="ltr" /></div>
              <div className="space-y-1.5"><Label className="text-xs">الأكسجين %</Label><Input type="number" value={visitForm.oxygenLevel} onChange={(e) => setVisitForm({...visitForm, oxygenLevel: e.target.value})} className="h-10 rounded-xl text-xs" placeholder="98" dir="ltr" /></div>
              <div className="space-y-1.5 col-span-2"><Label className="text-xs">السكر mg/dL</Label><Input type="number" value={visitForm.sugarLevel} onChange={(e) => setVisitForm({...visitForm, sugarLevel: e.target.value})} className="h-10 rounded-xl text-xs" placeholder="90" dir="ltr" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-semibold">ملاحظات</Label><Input value={visitForm.notes} onChange={(e) => setVisitForm({...visitForm, notes: e.target.value})} className="h-11 rounded-xl" placeholder="ملاحظات إضافية" /></div>
            <Button onClick={handleAddVisit} disabled={saving} className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600">
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'حفظ الزيارة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Service Dialog */}
      <Dialog open={showAddService} onOpenChange={setShowAddService}>
        <DialogContent dir="rtl" className="rounded-2xl max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>إضافة خدمة</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">الخدمة *</Label>
              <Select value={serviceForm.serviceId} onValueChange={(v) => setServiceForm({ serviceId: v })}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="اختر الخدمة" /></SelectTrigger>
                <SelectContent>
                  {(services || []).map((s: Record<string, unknown>) => (
                    <SelectItem key={s.id as string} value={s.id as string}>
                      {String(s.nameAr)} - {formatCurrency(Number(s.price))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddService} disabled={saving || !serviceForm.serviceId} className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600">
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'إضافة الخدمة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
        <DialogContent dir="rtl" className="rounded-2xl max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>تسجيل دفعة</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl">
              <p className="text-xs text-amber-700 dark:text-amber-400">المبلغ المتبقي: <span className="font-bold">{formatCurrency(billingSummary.remaining)}</span></p>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-semibold">المبلغ *</Label><Input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} className="h-11 rounded-xl" placeholder="0" dir="ltr" /></div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">طريقة الدفع</Label>
              <Select value={paymentForm.method} onValueChange={(v) => setPaymentForm({...paymentForm, method: v})}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقدي</SelectItem>
                  <SelectItem value="card">بطاقة</SelectItem>
                  <SelectItem value="transfer">تحويل بنكي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-semibold">ملاحظات</Label><Input value={paymentForm.description} onChange={(e) => setPaymentForm({...paymentForm, description: e.target.value})} className="h-11 rounded-xl" placeholder="ملاحظات" /></div>
            <Button onClick={handleAddPayment} disabled={saving || !paymentForm.amount} className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600">
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'تسجيل الدفعة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* FAB - Call */}
      {role === 'admin' && patient.phone && (
        <div className="fixed bottom-20 left-4 z-30">
          <button
            className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 flex items-center justify-center touch-feedback"
            onClick={handleCall}
          >
            <Phone className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
});

export { PatientDetail };
