'use client';

import React, { useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { TopHeader } from '@/components/layout/TopHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { SplashScreen } from '@/components/screens/SplashScreen';
import { LoginScreen } from '@/components/screens/LoginScreen';
import { FirstSetupScreen } from '@/components/screens/FirstSetupScreen';

// Lazy-loaded admin screens
const AdminDashboard = dynamic(() => import('@/components/screens/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })), { ssr: false });
const PatientList = dynamic(() => import('@/components/screens/admin/PatientList').then(m => ({ default: m.PatientList })), { ssr: false });
const PatientDetail = dynamic(() => import('@/components/screens/admin/PatientDetail').then(m => ({ default: m.PatientDetail })), { ssr: false });
const AddPatientForm = dynamic(() => import('@/components/screens/admin/AddPatientForm').then(m => ({ default: m.AddPatientForm })), { ssr: false });
const ServiceManagement = dynamic(() => import('@/components/screens/admin/ServiceManagement').then(m => ({ default: m.ServiceManagement })), { ssr: false });
const EmergencyManagement = dynamic(() => import('@/components/screens/admin/EmergencyManagement').then(m => ({ default: m.EmergencyManagement })), { ssr: false });
const AddEmergencyForm = dynamic(() => import('@/components/screens/admin/AddEmergencyForm').then(m => ({ default: m.AddEmergencyForm })), { ssr: false });
const FinanceManagement = dynamic(() => import('@/components/screens/admin/FinanceManagement').then(m => ({ default: m.FinanceManagement })), { ssr: false });
const NurseManagement = dynamic(() => import('@/components/screens/admin/NurseManagement').then(m => ({ default: m.NurseManagement })), { ssr: false });
const NotificationsScreen = dynamic(() => import('@/components/screens/admin/NotificationsScreen').then(m => ({ default: m.NotificationsScreen })), { ssr: false });
const SettingsScreen = dynamic(() => import('@/components/screens/admin/SettingsScreen').then(m => ({ default: m.SettingsScreen })), { ssr: false });
const AdminMoreMenu = dynamic(() => import('@/components/screens/admin/AdminMoreMenu').then(m => ({ default: m.AdminMoreMenu })), { ssr: false });
const AdminReports = dynamic(() => import('@/components/screens/admin/AdminReports').then(m => ({ default: m.AdminReports })), { ssr: false });

// Lazy-loaded nurse screens
const NurseAddVisit = dynamic(() => import('@/components/screens/nurse/NurseAddVisit').then(m => ({ default: m.NurseAddVisit })), { ssr: false });
const NurseEmergencies = dynamic(() => import('@/components/screens/nurse/NurseEmergencies').then(m => ({ default: m.NurseEmergencies })), { ssr: false });
const NurseReports = dynamic(() => import('@/components/screens/nurse/NurseReports').then(m => ({ default: m.NurseReports })), { ssr: false });
const NurseAddCase = dynamic(() => import('@/components/screens/nurse/NurseAddCase').then(m => ({ default: m.NurseAddCase })), { ssr: false });
const NurseChangePassword = dynamic(() => import('@/components/screens/nurse/NurseChangePassword').then(m => ({ default: m.NurseChangePassword })), { ssr: false });

function ScreenFallback() {
  return (
    <div className="p-4 space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

export default function ClinicApp() {
  const { currentScreen, isSplashDone, user, theme } = useAppStore();

  // Initialize theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('clinic-theme') as 'light' | 'dark' | null;
    if (saved) {
      useAppStore.getState().setTheme(saved);
    }
  }, []);

  // Show splash first
  if (!isSplashDone) return <SplashScreen />;

  // Show login if not authenticated
  if (!user) {
    if (currentScreen === 'admin-setup') return <FirstSetupScreen />;
    return <LoginScreen />;
  }

  // Determine if we need the app shell (header + bottom nav)
  const needsShell = !['splash', 'login', 'admin-setup'].includes(currentScreen);

  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      // Admin screens
      case 'admin-dashboard': return <AdminDashboard />;
      case 'admin-patients': return <PatientList role="admin" />;
      case 'admin-patient-detail': return <PatientDetail role="admin" />;
      case 'admin-add-patient': return <AddPatientForm />;
      case 'admin-services': return <ServiceManagement />;
      case 'admin-emergencies': return <EmergencyManagement />;
      case 'admin-add-emergency': return <AddEmergencyForm />;
      case 'admin-finance': return <FinanceManagement />;
      case 'admin-nurses': return <NurseManagement />;
      case 'admin-more': return <AdminMoreMenu />;
      case 'admin-notifications': return <NotificationsScreen />;
      case 'admin-settings': return <SettingsScreen />;
      case 'admin-reports': return <AdminReports />;

      // Nurse screens (no dashboard, no appointments)
      case 'nurse-patients': return <PatientList role="nurse" />;
      case 'nurse-patient-detail': return <PatientDetail role="nurse" />;
      case 'nurse-add-visit': return <NurseAddVisit />;
      case 'nurse-emergencies': return <NurseEmergencies />;
      case 'nurse-reports': return <NurseReports />;
      case 'nurse-add-emergency': return <NurseAddCase />;
      case 'nurse-change-password': return <NurseChangePassword />;

      default: return user?.role === 'admin' ? <AdminDashboard /> : <PatientList role="nurse" />;
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      {needsShell && <TopHeader />}
      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <Suspense fallback={<ScreenFallback />}>
              {renderScreen()}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      {needsShell && <BottomNav />}
    </div>
  );
}
