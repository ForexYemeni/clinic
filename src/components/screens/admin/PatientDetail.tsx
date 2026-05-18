'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Phone, User as UserIcon, Droplets, Calendar, FileText, CreditCard, ClipboardList, Stethoscope, Activity } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<Tab>('visits');

  useEffect(() => {
    if (!selectedPatientId) return;
    const fetchPatient = async () => {
      try {
        const res = await fetch(`/api/patients/${selectedPatientId}`);
        if (res.ok) {
          const data = await res.json();
          setPatient(data);
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [selectedPatientId]);

  if (loading) {
    return <div className="p-4 space-y-3 pb-24">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>;
  }

  if (!patient) {
    return <div className="p-4 text-center text-muted-foreground">لم يتم العثور على المريض</div>;
  }

  const visits: VisitItem[] = (patient as any).visits || [];
  const invoices: InvoiceItem[] = (patient as any).invoices || [];
  const services = (patient as any).services || [];

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'visits', label: 'الزيارات', icon: Calendar },
    { id: 'services', label: 'الخدمات', icon: Stethoscope },
    { id: 'invoices', label: 'الفواتير', icon: CreditCard },
    { id: 'medical', label: 'السجل الطبي', icon: ClipboardList },
  ];

  return (
    <div className="pb-24">
      {/* Patient Header */}
      <div className="bg-gradient-to-l from-emerald-600 to-teal-600 text-white p-4 pb-6">
        <button onClick={() => setScreen(role === 'admin' ? 'admin-patients' : 'nurse-patients')} className="flex items-center gap-1 text-white/80 mb-3 text-sm">
          <ArrowRight className="w-4 h-4" /> رجوع
        </button>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <UserIcon className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold">{patient.name}</h2>
            <div className="flex items-center gap-3 mt-1 text-sm opacity-90">
              <span>{patient.age} سنة</span>
              <span>{genderLabels[patient.gender]}</span>
              {patient.bloodType && (
                <span className="flex items-center gap-1"><Droplets className="w-3 h-3" />{patient.bloodType}</span>
              )}
            </div>
            {patient.phone && (
              <p className="text-xs opacity-80 mt-0.5 flex items-center gap-1" dir="ltr">
                <Phone className="w-3 h-3" />{patient.phone}
              </p>
            )}
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
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'visits' && (
          <div className="space-y-3">
            {visits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">لا توجد زيارات</p>
              </div>
            ) : (
              visits.map((visit: VisitItem) => (
                <div key={visit.id} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{visit.reason}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColors[visit.status] || ''}`}>
                      {statusLabels[visit.status] || visit.status}
                    </span>
                  </div>
                  {visit.diagnosis && <p className="text-xs text-muted-foreground mb-1">التشخيص: {visit.diagnosis}</p>}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatDate(visit.visitDate)} - {formatTime(visit.visitDate)}</span>
                    {visit.nurseName && <span>الممرض: {visit.nurseName}</span>}
                  </div>
                  {visit.vitalSigns && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {visit.vitalSigns.bloodPressure && (
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-1.5 text-center">
                          <p className="text-[10px] text-red-600 dark:text-red-400">الضغط</p>
                          <p className="text-xs font-medium">{visit.vitalSigns.bloodPressure}</p>
                        </div>
                      )}
                      {visit.vitalSigns.temperature && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-1.5 text-center">
                          <p className="text-[10px] text-amber-600 dark:text-amber-400">الحرارة</p>
                          <p className="text-xs font-medium">{visit.vitalSigns.temperature}°</p>
                        </div>
                      )}
                      {visit.vitalSigns.oxygenLevel && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-1.5 text-center">
                          <p className="text-[10px] text-blue-600 dark:text-blue-400">الأكسجين</p>
                          <p className="text-xs font-medium">{visit.vitalSigns.oxygenLevel}%</p>
                        </div>
                      )}
                    </div>
                  )}
                  {visit.medications && visit.medications.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {visit.medications.map((med: string, i: number) => (
                        <span key={i} className="text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">{med}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-3">
            {services.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Stethoscope className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">لا توجد خدمات مقدمة</p>
              </div>
            ) : (
              services.map((svc: any) => (
                <div key={svc.id} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{svc.serviceName || svc.service?.nameAr || 'خدمة'}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {svc.nurseName && <span>الممرض: {svc.nurseName}</span>}
                        {svc.createdAt && <span>{formatRelativeTime(svc.createdAt)}</span>}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(svc.price || svc.service?.price || 0)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="space-y-3">
            {invoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">لا توجد فواتير</p>
              </div>
            ) : (
              invoices.map((inv: InvoiceItem) => (
                <div key={inv.id} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">فاتورة #{inv.id.slice(-6)}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColors[inv.status] || ''}`}>
                      {statusLabels[inv.status] || inv.status}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {inv.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{item.serviceName} × {item.quantity}</span>
                        <span>{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border mt-2 pt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>الإجمالي</span>
                      <span className="font-bold">{formatCurrency(inv.total)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-emerald-600">
                      <span>المدفوع</span>
                      <span>{formatCurrency(inv.paid)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-red-600">
                      <span>المتبقي</span>
                      <span>{formatCurrency(inv.remaining)}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{formatDate(inv.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'medical' && (
          <div className="space-y-4">
            {/* Medical Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-border">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                المعلومات الطبية
              </h3>
              <div className="space-y-2">
                {patient.bloodType && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">فصيلة الدم</span>
                    <span className="text-sm font-medium">{patient.bloodType}</span>
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
          </div>
        )}
      </div>
    </div>
  );
}
