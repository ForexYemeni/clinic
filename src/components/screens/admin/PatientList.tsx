'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Phone, User as UserIcon, ChevronLeft, Stethoscope, ClipboardPlus } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatRelativeTime, genderLabels, type PatientItem } from '@/lib/constants';
import { toast } from 'sonner';

interface Props {
  role?: 'admin' | 'nurse';
}

export function PatientList({ role = 'admin' }: Props) {
  const { setScreen, setSelectedPatientId } = useAppStore();
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const { user } = useAppStore();
  const clinicId = user?.clinicId || '';

  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch(`/api/patients${clinicId ? `?clinicId=${clinicId}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const filtered = patients.filter(p =>
    p.name.includes(search) || (p.phone && p.phone.includes(search))
  );

  const handleAddPatient = () => {
    setScreen('admin-add-patient');
  };

  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    setScreen(role === 'admin' ? 'admin-patient-detail' : 'nurse-patient-detail');
  };

  const handleAddVisit = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPatientId(id);
    setScreen('nurse-add-visit');
  };

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">المرضى</h2>
        <div className="flex items-center gap-2">
          {role === 'nurse' && (
            <button
              onClick={() => setScreen('nurse-add-visit')}
              className="flex items-center gap-1.5 bg-teal-600 text-white px-3 py-2 rounded-xl text-sm font-medium active:scale-[0.97] transition-transform"
            >
              <Stethoscope className="w-4 h-4" />
              زيارة
            </button>
          )}
          <button
            onClick={handleAddPatient}
            className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-xl text-sm font-medium active:scale-[0.97] transition-transform"
          >
            <Plus className="w-4 h-4" />
            مريض جديد
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث بالاسم أو رقم الهاتف..."
          className="w-full h-10 pr-9 pl-4 bg-white dark:bg-gray-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
        <span>{filtered.length} مريض</span>
      </div>

      {/* Patient List */}
      {loading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((patient, i) => (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-border overflow-hidden"
            >
              <button
                onClick={() => handleSelectPatient(patient.id)}
                className="w-full p-3 text-right active:bg-gray-50 dark:active:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{patient.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {patient.age} سنة - {genderLabels[patient.gender] || patient.gender}
                        </span>
                        {patient.phone && (
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5" dir="ltr">
                            <Phone className="w-3 h-3" />{patient.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {patient.bloodType && (
                      <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
                        {patient.bloodType}
                      </span>
                    )}
                    <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </button>
              {/* Nurse: Add Visit button */}
              {role === 'nurse' && (
                <button
                  onClick={(e) => handleAddVisit(patient.id, patient.name, e)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-50 dark:bg-emerald-900/20 border-t border-border text-emerald-700 dark:text-emerald-400 text-xs font-medium active:bg-emerald-100 dark:active:bg-emerald-900/40 transition-colors"
                >
                  <ClipboardPlus className="w-4 h-4" />
                  إضافة زيارة وخدمات
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12">
          <UserIcon className="w-12 h-12 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground mt-3">لا يوجد مرضى</p>
          <button onClick={handleAddPatient} className="mt-3 text-emerald-600 text-sm font-medium">
            إضافة أول مريض
          </button>
        </div>
      )}
    </div>
  );
}
