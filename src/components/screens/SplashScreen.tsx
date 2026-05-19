'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export function SplashScreen() {
  const { setSplashDone, setIsFirstSetup, setClinicSettings, clinicName, clinicSettings } = useAppStore();
  const logo = clinicSettings.logo;
  const primaryColor = clinicSettings.primaryColor || 'emerald';

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await fetch('/api/auth');
        if (res.ok) {
          const data = await res.json();
          if (data.setupNeeded) {
            setIsFirstSetup(true);
            useAppStore.getState().setScreen('admin-setup');
          }
        }
      } catch {}
      // Load clinic settings
      try {
        const cRes = await fetch('/api/clinic');
        if (cRes.ok) {
          const cData = await cRes.json();
          useAppStore.getState().setClinicSettings({
            name: cData.name || 'عيادتي',
            description: cData.description || '',
            phone: cData.phone || '',
            address: cData.address || '',
            logo: cData.logo || '',
            primaryColor: cData.primaryColor || 'emerald',
          });
        }
      } catch {}
      setTimeout(() => setSplashDone(true), 1800);
    };
    checkSetup();
  }, [setSplashDone, setIsFirstSetup]);

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-clinic-600 via-clinic-500 to-clinic-700`}>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="relative"
      >
        <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center shadow-2xl overflow-hidden">
          {logo ? (
            <img src={logo} alt="شعار" className="w-16 h-16 object-contain" />
          ) : (
            <Heart className="w-14 h-14 text-white" fill="currentColor" />
          )}
        </div>
        <motion.div
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-400 rounded-full"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <h1 className="text-2xl font-bold text-white">{clinicName}</h1>
        <p className="text-white/70 text-sm mt-2">إدارة طبية احترافية</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-12"
      >
        <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
      </motion.div>
    </div>
  );
}
