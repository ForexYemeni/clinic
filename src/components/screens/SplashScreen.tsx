'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, RefreshCw, WifiOff } from 'lucide-react';
import { useAppStore } from '@/lib/store';

// Timeout wrapper for fetch calls - ensures they never hang forever
function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 6000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timeoutId);
  });
}

export function SplashScreen() {
  const { setSplashDone, setIsFirstSetup, setClinicSettings, clinicName, clinicSettings } = useAppStore();
  const logo = clinicSettings.logo;
  const primaryColor = clinicSettings.primaryColor || 'emerald';
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let hardTimeoutId: NodeJS.Timeout;

    // HARD TIMEOUT: Force splash to complete after 10 seconds no matter what
    hardTimeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('[Splash] Hard timeout reached - forcing splash done');
        setSplashDone(true);
      }
    }, 10000);

    const checkSetup = async () => {
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem('clinic-token') : null;

      // If we have a saved token, try to restore session
      if (savedToken) {
        try {
          const res = await fetchWithTimeout('/api/auth', {
            headers: { 'Authorization': `Bearer ${savedToken}` },
          }, 6000);
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              // Restore user session
              useAppStore.getState().setUser(data.user);
              if (data.subscription) {
                useAppStore.getState().setSubscription(data.subscription);
              }

              // Set clinicId in store for proper data isolation
              if (data.user.clinicId) {
                useAppStore.getState().setClinicId(data.user.clinicId);
              }

              // Load clinic settings (with timeout)
              try {
                const cRes = await fetchWithTimeout('/api/clinic', {
                  headers: { 'Authorization': `Bearer ${savedToken}` },
                }, 5000);
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

              clearTimeout(hardTimeoutId);
              if (isMounted) {
                setTimeout(() => setSplashDone(true), 1800);
              }
              return;
            }
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('clinic-token');
            useAppStore.getState().setToken(null);
          }
        } catch {
          // Network error or timeout, continue with setup check
          // Clear potentially corrupt token on network error too
          try {
            localStorage.removeItem('clinic-token');
            useAppStore.getState().setToken(null);
          } catch {}
        }
      }

      // No valid token - check if setup is needed
      try {
        // First, check if a super_admin exists (for migration from old system)
        try {
          const migrateRes = await fetchWithTimeout('/api/platform/migrate', {}, 5000);
          if (migrateRes.ok) {
            const migrateData = await migrateRes.json();
            if (migrateData.migrationNeeded) {
              // No super_admin exists - show migration/upgrade screen
              setIsFirstSetup(true);
              useAppStore.getState().setScreen('super-admin-setup');
              clearTimeout(hardTimeoutId);
              if (isMounted) {
                setTimeout(() => setSplashDone(true), 1800);
              }
              return;
            }
          }
          // If migrateRes is not ok (server error), DON'T trap on setup - fall through to login
        } catch {
          // Network error on migrate check - don't trap, fall through to login
        }

        // Check regular setup status
        try {
          const res = await fetchWithTimeout('/api/auth', {}, 5000);
          if (res.ok) {
            const data = await res.json();
            if (data.setupNeeded) {
              // If platform is set up (super_admin exists), go to login screen
              // Super admin creates clinics from the dashboard, not from a forced setup screen
              if (data.platformSetup) {
                // Platform is ready, user just needs to log in
                // Don't force any setup screen
              } else {
                // No super_admin exists yet - first time setup
                setIsFirstSetup(true);
                useAppStore.getState().setScreen('super-admin-setup');
              }
            }
          }
          // If res is not ok, fall through to login screen
        } catch {
          // Network error - fall through to login screen
        }
      } catch {}

      // Load clinic settings (with timeout)
      try {
        const cRes = await fetchWithTimeout('/api/clinic', {}, 4000);
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

      clearTimeout(hardTimeoutId);
      if (isMounted) {
        setTimeout(() => setSplashDone(true), 1800);
      }
    };

    checkSetup().catch(() => {
      // If checkSetup itself throws (shouldn't happen with all the try/catch inside),
      // still make sure splash completes
      clearTimeout(hardTimeoutId);
      if (isMounted) {
        setError(true);
        setTimeout(() => setSplashDone(true), 2000);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(hardTimeoutId);
    };
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
        {error ? (
          <div className="flex flex-col items-center gap-3">
            <WifiOff className="w-8 h-8 text-white/60" />
            <p className="text-white/60 text-xs">جاري المحاولة...</p>
          </div>
        ) : (
          <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
        )}
      </motion.div>
    </div>
  );
}
