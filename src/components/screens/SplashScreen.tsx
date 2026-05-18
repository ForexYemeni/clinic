'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Shield, Activity } from 'lucide-react';
import { useAppStore } from '@/lib/store';

const SplashScreen = React.memo(function SplashScreen() {
  const { setSplashDone } = useAppStore();

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), 2400);
    return () => clearTimeout(timer);
  }, [setSplashDone]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 flex flex-col items-center justify-center z-50 overflow-hidden">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full border-4 border-white/10"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.08, 0.05] }}
          transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full border-4 border-white/10"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.03, 0.06, 0.03] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.5 }}
          className="absolute top-1/3 left-1/4 w-32 h-32 rounded-full border-2 border-white/10"
        />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', duration: 0.8, bounce: 0.4 }}
        className="relative z-10"
      >
        <div className="w-24 h-24 bg-white/15 backdrop-blur-lg rounded-3xl flex items-center justify-center shadow-2xl border border-white/20">
          <div className="relative">
            <Heart className="w-14 h-14 text-white" fill="currentColor" />
            <Shield className="w-5 h-5 text-emerald-700 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>
      </motion.div>

      {/* Pulse rings */}
      <motion.div
        animate={{ scale: [1, 2], opacity: [0.3, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
        className="absolute w-24 h-24 rounded-full border-2 border-white/20"
      />
      <motion.div
        animate={{ scale: [1, 2.5], opacity: [0.2, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeOut', delay: 0.5 }}
        className="absolute w-24 h-24 rounded-full border-2 border-white/10"
      />

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="text-white text-2xl font-bold mb-2 mt-6 z-10"
      >
        عيادة الإسعافات الأولية
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-emerald-100 text-sm mb-2 z-10"
      >
        نظام إدارة احترافي
      </motion.p>

      {/* Medical cross animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, type: 'spring' }}
        className="flex items-center gap-1 my-6 z-10"
      >
        <Activity className="w-4 h-4 text-emerald-200" />
        <div className="w-1 h-1 bg-emerald-200 rounded-full" />
        <div className="w-1 h-1 bg-emerald-200/50 rounded-full" />
        <div className="w-1 h-1 bg-emerald-200/30 rounded-full" />
      </motion.div>

      {/* Loading dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="flex gap-2 z-10"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, delay: i * 0.25, duration: 0.8, ease: 'easeInOut' }}
            className="w-2 h-2 bg-white/70 rounded-full"
          />
        ))}
      </motion.div>
    </div>
  );
});

export { SplashScreen };
