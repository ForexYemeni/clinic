'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Shield } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export function SplashScreen() {
  const { setSplashDone, setIsFirstSetup, setClinicSettings, clinicName, clinicSettings } = useAppStore();
  const logo = clinicSettings.logo;
  const primaryColor = clinicSettings.primaryColor || 'emerald';

  useEffect(() => {
    const checkSetup = async () => {
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem('clinic-token') : null;

      // If we have a saved token, try to restore session
      if (savedToken) {
        try {
          const res = await fetch('/api/auth', {
            headers: { 'Authorization': `Bearer ${savedToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              // Restore user session
              useAppStore.getState().setUser(data.user);
              if (data.subscription) {
                useAppStore.getState().setSubscription(data.subscription);
              }

              // Load clinic settings
              try {
                const cRes = await fetch('/api/clinic', {
                  headers: { 'Authorization': `Bearer ${savedToken}` },
                });
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

              // Route based on role
              if (data.user.role === 'super_admin') {
                useAppStore.getState().setScreen('super-admin-dashboard');
              } else if (!data.subscription?.valid) {
                useAppStore.getState().setScreen('subscription-expired');
              } else if (data.user.role === 'admin') {
                useAppStore.getState().setScreen('admin-dashboard');
              } else {
                useAppStore.getState().setScreen('nurse-patients');
              }

              setTimeout(() => setSplashDone(true), 1800);
              return;
            }
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('clinic-token');
            useAppStore.getState().setToken(null);
          }
        } catch {
          // Network error, continue with setup check
        }
      }

      // No valid token - check if setup is needed
      try {
        const res = await fetch('/api/auth');
        if (res.ok) {
          const data = await res.json();
          if (data.setupNeeded) {
            setIsFirstSetup(true);
            if (!data.platformSetup) {
              useAppStore.getState().setScreen('super-admin-setup');
            } else {
              useAppStore.getState().setScreen('admin-setup');
            }
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
        <p className="text-white/70 text-sm mt-2">منصة إدارة العيادات</p>
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
