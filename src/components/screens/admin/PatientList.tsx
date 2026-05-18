'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Phone, User as UserIcon, ChevronLeft } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatRelativeTime, genderLabels, type PatientItem } from '@/lib/constants';
import { toast } from 'sonner';

interface Props {
  role?: 'admin' | 'nurse';
}

export function PatientList({ role = 'admin' }: Props) {
  const { setScreen, setSelectedPatientId, user } = useAppStore();
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch('/api/patients');
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const filtered = patients.filter(p =>
    p.name.includes(search) || (p.phone && p.phone.includes(search))
  );

  const handleAddPatient = () => {
    if (role === 'admin') {
      setScreen('admin-add-patient');
    } else {
      setScreen('nurse-add-visit');
    }
  };

  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    setScreen(role === 'admin' ? 'admin-patient-detail' : 'nurse-patient-detail');
  };

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">المرضى</h2>
        <button
          onClick={handleAddPatient}
          className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium active:scale-[0.97] transition-transform"
        >
          <Plus className="w-4 h-4" />
          مريض جديد
        </button>
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
            <motion.button
              key={patient.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => handleSelectPatient(patient.id)}
              className="w-full bg-white dark:bg-gray-800 rounded-xl p-3 border border-border text-right active:scale-[0.98] transition-transform"
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
            </motion.button>
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
