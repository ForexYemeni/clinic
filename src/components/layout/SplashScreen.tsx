'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Shield } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export function SplashScreen() {
  const { setSplashDone } = useAppStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashDone();
    }, 2500);
    return () => clearTimeout(timer);
  }, [setSplashDone]);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-teal-600 via-teal-700 to-emerald-800 flex flex-col items-center justify-center z-50">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 right-10 w-32 h-32 rounded-full border-4 border-white" />
        <div className="absolute bottom-32 left-8 w-24 h-24 rounded-full border-4 border-white" />
        <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full border-4 border-white" />
        <div className="absolute top-1/3 right-1/4 w-20 h-20 rounded-full border-2 border-white" />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10"
      >
        <div className="w-28 h-28 rounded-3xl bg-white/20 backdrop-blur-lg flex items-center justify-center shadow-2xl border border-white/30">
          <div className="relative">
            <Heart className="w-14 h-14 text-white fill-white/80" />
            <Shield className="w-6 h-6 text-teal-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="mt-8 text-center z-10"
      >
        <h1 className="text-3xl font-bold text-white">عيادة الإسعافات</h1>
        <h2 className="text-3xl font-bold text-white mt-1">الأولية</h2>
        <p className="text-teal-100 mt-3 text-base">نظام إدارة العيادة المتكامل</p>
      </motion.div>

      {/* Loading indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        className="mt-12 z-10"
      >
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-white/70"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Bottom text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 text-white/60 text-sm z-10"
      >
        First Aid Clinic v1.0
      </motion.p>
    </div>
  );
}
