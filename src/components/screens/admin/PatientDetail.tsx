'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Phone, User as UserIcon, Droplets, Calendar, FileText, CreditCard, ClipboardList, Stethoscope, Activity, ClipboardPlus, RefreshCw, AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatDate, formatTime, formatRelativeTime, genderLabels, statusColors, statusLabels, type PatientItem, type VisitItem, type InvoiceItem } from '@/lib/constants';
import { toast } from 'sonner';

interface Props {
  role?: 'admin' | 'nurse';
}

type Tab = 'visits' | 'services' | 'invoices' | 'medical';

export function PatientDetail({ role = 'admin' }: Props) {
  const { selectedPatientId, setScreen } = useAppStore();
  const [patient, setPatient] = useState<PatientItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('visits');

  const fetchPatient = async () => {
    if (!selectedPatientId) {
      setError('لم يتم تحديد مريض');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/patients/${selectedPatientId}`);
      if (res.ok) {
        const data = await res.json();
        setPatient(data);
      } else {
        setError('لم يتم العثور على المريض');
      }
    } catch {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatient(); }, [selectedPatientId]);

  if (loading) {
    return (
      <div className="p-4 space-y-3 pb-24">
        {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="p-4 pb-24">
        <button
          onClick={() => setScreen(role === 'admin' ? 'admin-patients' : 'nurse-patients')}
          className="flex items-center gap-2 mb-6 px-3 py-2 bg-white dark:bg-gray-800 rounded-xl border border-border shadow-sm active:scale-[0.97] transition-all"
        >
          <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-foreground" />
          </div>
          <span className="text-sm font-medium">رجوع</span>
        </button>
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <p className="text-lg font-bold text-foreground mb-2">{error || 'لم يتم العثور على المريض'}</p>
          <p className="text-sm text-muted-foreground mb-6">قد يكون المريض محذوفاً أو حدث خطأ في الاتصال</p>
          <button
            onClick={fetchPatient}
            className="inline-flex items-center gap-2 bg-clinic-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium active:scale-[0.97] transition-transform"
          >
            <RefreshCw className="w-4 h-4" /> إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const visits: VisitItem[] = (patient as any).visits || [];
  const invoices: InvoiceItem[] = (patient as any).invoices || [];
  const services = (patient as any).services || [];

  const tabs: { id: Tab; label: string; icon: any; count?: number }[] = [
    { id: 'visits', label: 'الزيارات', icon: Calendar, count: visits.length },
    { id: 'services', label: 'الخدمات', icon: Stethoscope, count: services.length },
    { id: 'invoices', label: 'الفواتير', icon: CreditCard, count: invoices.length },
    { id: 'medical', label: 'السجل الطبي', icon: ClipboardList },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'unpaid': return <XCircle className="w-3.5 h-3.5" />;
      case 'partial': return <Clock className="w-3.5 h-3.5" />;
      case 'completed': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'active': return <AlertCircle className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  return (
    <div className="pb-24">
      {/* Patient Header */}
      <div className="bg-gradient-to-l to-clinic-600 to-teal-600 text-white p-4 pb-6">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setScreen(role === 'admin' ? 'admin-patients' : 'nurse-patients')} className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 text-white/80 text-sm font-medium active:scale-[0.97] transition-all">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
              <ArrowRight className="w-4 h-4" />
            </div>
            <span>رجوع</span>
          </button>
          <button
            onClick={() => setScreen('nurse-add-visit')}
            className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm font-medium active:scale-[0.97] transition-transform"
          >
            <ClipboardPlus className="w-4 h-4" />
            إضافة زيارة
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <UserIcon className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold">{patient.name}</h2>
            <div className="flex items-center gap-3 mt-1 text-sm opacity-90">
              <span>{(patient as any).ageCategory === 'elderly' || (patient as any).ageCategory === 'infant' ? 'كبير' : (patient as any).ageCategory === 'child' ? 'طفل' : (patient as any).ageCategory === 'adult' ? 'بالغ' : patient.age ? `${patient.age} سنة` : 'بالغ'}</span>
              <span>{genderLabels[patient.gender]}</span>
              {patient.bloodType && (
                <span className="flex items-center gap-1"><Droplets className="w-3 h-3" />{patient.bloodType}</span>
              )}
            </div>
            {(patient as any).complaints && (patient as any).complaints.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(patient as any).complaints.map((c: string, i: number) => (
                  <span key={i} className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{c}</span>
                ))}
              </div>
            )}
            {patient.phone && (
              <p className="text-xs opacity-80 mt-0.5 flex items-center gap-1" dir="ltr">
                <Phone className="w-3 h-3" />{patient.phone}
              </p>
            )}
          </div>
        </div>
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-white/10 rounded-xl p-2 text-center backdrop-blur-sm">
            <p className="text-lg font-bold">{visits.length}</p>
            <p className="text-[10px] opacity-80">زيارة</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2 text-center backdrop-blur-sm">
            <p className="text-lg font-bold">{services.length}</p>
            <p className="text-[10px] opacity-80">خدمة</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2 text-center backdrop-blur-sm">
            <p className="text-lg font-bold">{invoices.length}</p>
            <p className="text-[10px] opacity-80">فاتورة</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 -mt-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-1 flex shadow-sm border border-border">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-clinic-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-[10px] ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'} px-1.5 rounded-full`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'visits' && (
            <motion.div key="visits" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {visits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">لا توجد زيارات</p>
                </div>
              ) : (
                visits.map((visit: VisitItem) => (
                  <div key={visit.id} className="bg-white dark:bg-gray-800 rounded-xl border border-border overflow-hidden">
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold">{visit.reason}</span>
                        <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[visit.status] || ''}`}>
                          {getStatusIcon(visit.status)}
                          {statusLabels[visit.status] || visit.status}
                        </span>
                      </div>
                      {(visit as any).complaints && (visit as any).complaints.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {(visit as any).complaints.map((c: string, i: number) => (
                            <span key={i} className="text-[10px] bg-clinic-50 dark:bg-clinic-900/20 text-clinic-700 dark:text-clinic-400 px-2 py-0.5 rounded-full">{c}</span>
                          ))}
                        </div>
                      )}
                      {visit.diagnosis && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 mb-2">
                          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">التشخيص: {visit.diagnosis}</p>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(visit.visitDate)} - {formatTime(visit.visitDate)}
                        </span>
                        {visit.nurseName && <span>الممرض: {visit.nurseName}</span>}
                      </div>
                      {visit.vitalSigns && (
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {visit.vitalSigns.bloodPressure && (
                            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-1.5 text-center">
                              <p className="text-[10px] text-red-600 dark:text-red-400">الضغط</p>
                              <p className="text-xs font-bold">{visit.vitalSigns.bloodPressure}</p>
                            </div>
                          )}
                          {visit.vitalSigns.temperature && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-1.5 text-center">
                              <p className="text-[10px] text-amber-600 dark:text-amber-400">الحرارة</p>
                              <p className="text-xs font-bold">{visit.vitalSigns.temperature}°</p>
                            </div>
                          )}
                          {visit.vitalSigns.oxygenLevel && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-1.5 text-center">
                              <p className="text-[10px] text-blue-600 dark:text-blue-400">الأكسجين</p>
                              <p className="text-xs font-bold">{visit.vitalSigns.oxygenLevel}%</p>
                            </div>
                          )}
                        </div>
                      )}
                      {visit.medications && visit.medications.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {visit.medications.map((med: string, i: number) => (
                            <span key={i} className="text-[10px] bg-clinic-50 dark:bg-clinic-900/20 text-clinic-700 dark:text-clinic-400 px-2 py-0.5 rounded-full">{med}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'services' && (
            <motion.div key="services" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {services.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Stethoscope className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">لا توجد خدمات مقدمة</p>
                </div>
              ) : (
                services.map((svc: any) => (
                  <div key={svc.id} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-clinic-50 dark:bg-clinic-900/20 rounded-xl flex items-center justify-center">
                          <Stethoscope className="w-5 h-5 text-clinic-600 dark:text-clinic-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{svc.nameAr || svc.serviceName || 'خدمة'}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            {svc.category && <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[10px]">{svc.category}</span>}
                            {svc.nurseName && <span>الممرض: {svc.nurseName}</span>}
                            {svc.createdAt && <span>{formatRelativeTime(svc.createdAt)}</span>}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-clinic-600 dark:text-clinic-400 bg-clinic-50 dark:bg-clinic-900/20 px-2 py-1 rounded-lg">
                        {formatCurrency(svc.price || svc.service?.price || 0)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'invoices' && (
            <motion.div key="invoices" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {invoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">لا توجد فواتير</p>
                </div>
              ) : (
                invoices.map((inv: InvoiceItem) => (
                  <div key={inv.id} className="bg-white dark:bg-gray-800 rounded-xl border border-border overflow-hidden">
                    {/* Invoice Header */}
                    <div className="p-3 border-b border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-bold">فاتورة #{inv.id.slice(-6)}</span>
                        </div>
                        <span className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-medium ${statusColors[inv.status] || ''}`}>
                          {getStatusIcon(inv.status)}
                          {statusLabels[inv.status] || inv.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{formatDate(inv.createdAt)}</p>
                    </div>
                    {/* Invoice Items */}
                    {inv.items && inv.items.length > 0 && (
                      <div className="px-3 py-2 space-y-1.5">
                        {inv.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{item.serviceName} × {item.quantity}</span>
                            <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Invoice Totals */}
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>الإجمالي</span>
                        <span className="font-bold">{formatCurrency(inv.total)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-clinic-600 dark:text-clinic-400">
                        <span>المدفوع</span>
                        <span className="font-medium">{formatCurrency(inv.paid)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-red-600 dark:text-red-400">
                        <span>المتبقي</span>
                        <span className="font-bold">{formatCurrency(inv.remaining)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'medical' && (
            <motion.div key="medical" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Medical Info */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-border">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-clinic-500" />
                  المعلومات الطبية
                </h3>
                <div className="space-y-2">
                  {patient.bloodType && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">فصيلة الدم</span>
                      <span className="text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-lg">{patient.bloodType}</span>
                    </div>
                  )}
                  {patient.chronicDiseases && (
                    <div className="flex items-start justify-between">
                      <span className="text-xs text-muted-foreground">أمراض مزمنة</span>
                      <span className="text-sm text-right max-w-[60%]">{patient.chronicDiseases}</span>
                    </div>
                  )}
                  {patient.allergies && (
                    <div className="flex items-start justify-between">
                      <span className="text-xs text-muted-foreground">حساسية</span>
                      <span className="text-sm text-right max-w-[60%]">{patient.allergies}</span>
                    </div>
                  )}
                  {patient.medicalHistory && (
                    <div className="flex items-start justify-between">
                      <span className="text-xs text-muted-foreground">التاريخ المرضي</span>
                      <span className="text-sm text-right max-w-[60%]">{patient.medicalHistory}</span>
                    </div>
                  )}
                  {!patient.bloodType && !patient.chronicDiseases && !patient.allergies && !patient.medicalHistory && (
                    <p className="text-xs text-muted-foreground text-center py-2">لا توجد معلومات طبية</p>
                  )}
                </div>
              </div>

              {/* Latest Vital Signs */}
              {visits.length > 0 && visits[0].vitalSigns && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-border">
                  <h3 className="font-bold text-sm mb-3">آخر القراءات الحيوية</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {visits[0].vitalSigns.bloodPressure && (
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-2 text-center">
                        <p className="text-[10px] text-red-600 dark:text-red-400 mb-1">ضغط الدم</p>
                        <p className="text-sm font-bold">{visits[0].vitalSigns.bloodPressure}</p>
                      </div>
                    )}
                    {visits[0].vitalSigns.heartRate && (
                      <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-2 text-center">
                        <p className="text-[10px] text-pink-600 dark:text-pink-400 mb-1">معدل النبض</p>
                        <p className="text-sm font-bold">{visits[0].vitalSigns.heartRate}</p>
                      </div>
                    )}
                    {visits[0].vitalSigns.temperature && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-2 text-center">
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 mb-1">الحرارة</p>
                        <p className="text-sm font-bold">{visits[0].vitalSigns.temperature}°</p>
                      </div>
                    )}
                    {visits[0].vitalSigns.oxygenLevel && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2 text-center">
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 mb-1">الأكسجين</p>
                        <p className="text-sm font-bold">{visits[0].vitalSigns.oxygenLevel}%</p>
                      </div>
                    )}
                    {visits[0].vitalSigns.sugarLevel && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-2 text-center">
                        <p className="text-[10px] text-purple-600 dark:text-purple-400 mb-1">السكر</p>
                        <p className="text-sm font-bold">{visits[0].vitalSigns.sugarLevel}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {patient.notes && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-border">
                  <h3 className="font-bold text-sm mb-2">ملاحظات</h3>
                  <p className="text-sm text-muted-foreground">{patient.notes}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
