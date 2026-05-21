'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export function SplashScreen() {
  const { setSplashDone, setIsFirstSetup } = useAppStore();

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
        // If API fails, just show login screen - don't redirect to setup
      } catch {
        // Connection error - just show login screen
      }
      setTimeout(() => setSplashDone(true), 1800);
    };
    checkSetup();
  }, [setSplashDone, setIsFirstSetup]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="relative"
      >
        <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center shadow-2xl">
          <Heart className="w-14 h-14 text-white" fill="currentColor" />
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
        <h1 className="text-2xl font-bold text-white">عيادة الإسعافات الأولية</h1>
        <p className="text-emerald-100 text-sm mt-2">إدارة طبية احترافية</p>
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
