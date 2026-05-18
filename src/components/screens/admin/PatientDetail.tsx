'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Phone, AlertCircle, MapPin, Activity, Shield, FileText, ClipboardList, User, Stethoscope, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppStore } from '@/lib/store';
import { useData } from '@/hooks/useData';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import {
  PatientItem, formatCurrency, formatDate, formatTime,
  statusColors, statusLabels, genderLabels,
} from '@/lib/constants';

interface PatientDetailProps {
  role: 'admin' | 'nurse';
}

const PatientDetail = React.memo(function PatientDetail({ role }: PatientDetailProps) {
  const { selectedPatientId, setScreen } = useAppStore();
  const { data: patient, loading } = useData<PatientItem>(selectedPatientId ? `/api/patients/${selectedPatientId}` : null);
  const [activeTab, setActiveTab] = useState<'info' | 'visits' | 'services' | 'medications'>('info');

  const tabs = useMemo(() => [
    { id: 'info' as const, label: 'المعلومات', icon: User },
    { id: 'visits' as const, label: 'الزيارات', icon: FileText },
    { id: 'services' as const, label: 'الخدمات', icon: Stethoscope },
    { id: 'medications' as const, label: 'الأدوية', icon: Activity },
  ], []);

  if (loading) return <SkeletonLoader type="patient-detail" />;
  if (!patient) return <EmptyState icon={User} title="لم يتم العثور على المريض" />;

  return (
    <div className="pb-24 pt-0">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 -mx-4 px-4 pt-2 pb-8 rounded-b-3xl relative overflow-hidden">
        {/* Decorative circles */}
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

      {/* Tabs with animated underline */}
      <div className="flex gap-1 px-4 -mt-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 ${
              activeTab === tab.id ? 'bg-white dark:bg-gray-800 shadow-sm text-emerald-600 dark:text-emerald-400' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-4 mt-4 space-y-3">
        {activeTab === 'info' && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-2.5">
            {[
              patient.phone && { icon: Phone, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30', label: 'الهاتف', value: patient.phone, dir: 'ltr' },
              patient.emergencyPhone && { icon: AlertCircle, color: 'text-red-500 bg-red-50 dark:bg-red-900/30', label: 'هاتف الطوارئ', value: patient.emergencyPhone, dir: 'ltr' },
              patient.address && { icon: MapPin, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30', label: 'العنوان', value: patient.address },
              patient.chronicDiseases && { icon: Activity, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30', label: 'الأمراض المزمنة', value: patient.chronicDiseases },
              patient.allergies && { icon: Shield, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30', label: 'الحساسية', value: patient.allergies },
              patient.medicalHistory && { icon: FileText, color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/30', label: 'التاريخ الطبي', value: patient.medicalHistory },
              patient.notes && { icon: ClipboardList, color: 'text-gray-500 bg-gray-50 dark:bg-gray-900/30', label: 'ملاحظات', value: patient.notes },
            ].filter(Boolean).map((item, i) => (
              item && (
                <Card key={i} className="border-0 shadow-sm">
                  <CardContent className="p-3.5 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color}`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium" dir={item.dir as 'ltr' | 'rtl' | undefined}>{item.value}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            ))}
          </motion.div>
        )}

        {activeTab === 'visits' && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
            {patient.visits?.length > 0 ? (
              <div className="space-y-2.5">
                {patient.visits.map((v, i) => (
                  <Card key={v.id} className="border-0 shadow-sm relative overflow-hidden">
                    {/* Timeline dot */}
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-400" />
                    <CardContent className="p-3.5 pr-5">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-semibold">{v.reason}</p>
                        <Badge className={`text-[9px] ${statusColors[v.status]}`}>{statusLabels[v.status]}</Badge>
                      </div>
                      {v.diagnosis && <p className="text-xs text-muted-foreground mb-1">{v.diagnosis}</p>}
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Activity className="w-3 h-3" /> {formatDate(v.visitDate)}
                      </p>
                      {v.notes && <p className="text-xs text-muted-foreground mt-2 bg-muted/50 p-2 rounded-lg">{v.notes}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : <EmptyState icon={FileText} title="لا توجد زيارات" />}
          </motion.div>
        )}

        {activeTab === 'services' && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
            {patient.services?.length > 0 ? (
              <div className="space-y-2.5">
                {patient.services.map((ps) => (
                  <Card key={ps.id} className="border-0 shadow-sm">
                    <CardContent className="p-3.5">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-semibold">{ps.service?.nameAr}</p>
                        <Badge className={`text-[9px] ${statusColors[ps.status]}`}>{statusLabels[ps.status]}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(ps.service?.price || 0)}</span>
                        <span>{ps.service?.duration} دقيقة</span>
                      </div>
                      {ps.nurse && <p className="text-[10px] text-muted-foreground mt-1">الممرض: {ps.nurse.name}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : <EmptyState icon={Stethoscope} title="لا توجد خدمات" />}
          </motion.div>
        )}

        {activeTab === 'medications' && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
            {patient.medications?.length > 0 ? (
              <div className="space-y-2.5">
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
            ) : <EmptyState icon={Activity} title="لا توجد أدوية" />}
          </motion.div>
        )}
      </div>

      {/* FAB */}
      {role === 'admin' && (
        <div className="fixed bottom-20 left-4 z-30 flex flex-col gap-2 animate-slide-up">
          <button
            className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 flex items-center justify-center touch-feedback"
            onClick={() => window.open(`tel:${patient.phone}`, '_self')}
          >
            <Phone className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
});

export { PatientDetail };
