'use client';

import React, { useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { TopHeader } from '@/components/layout/TopHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { SplashScreen } from '@/components/screens/SplashScreen';
import { LoginScreen } from '@/components/screens/LoginScreen';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';

// Lazy-loaded admin screens
const AdminDashboard = dynamic(() => import('@/components/screens/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })), { ssr: false });
const PatientList = dynamic(() => import('@/components/screens/admin/PatientList').then(m => ({ default: m.PatientList })), { ssr: false });
const PatientDetail = dynamic(() => import('@/components/screens/admin/PatientDetail').then(m => ({ default: m.PatientDetail })), { ssr: false });
const AddPatientForm = dynamic(() => import('@/components/screens/admin/AddPatientForm').then(m => ({ default: m.AddPatientForm })), { ssr: false });
const ServiceManagement = dynamic(() => import('@/components/screens/admin/ServiceManagement').then(m => ({ default: m.ServiceManagement })), { ssr: false });
const EmergencyManagement = dynamic(() => import('@/components/screens/admin/EmergencyManagement').then(m => ({ default: m.EmergencyManagement })), { ssr: false });
const AddEmergencyForm = dynamic(() => import('@/components/screens/admin/AddEmergencyForm').then(m => ({ default: m.AddEmergencyForm })), { ssr: false });
const AppointmentsScreen = dynamic(() => import('@/components/screens/admin/AppointmentsScreen').then(m => ({ default: m.AppointmentsScreen })), { ssr: false });
const AddAppointmentForm = dynamic(() => import('@/components/screens/admin/AddAppointmentForm').then(m => ({ default: m.AddAppointmentForm })), { ssr: false });
const FinanceManagement = dynamic(() => import('@/components/screens/admin/FinanceManagement').then(m => ({ default: m.FinanceManagement })), { ssr: false });
const NurseManagement = dynamic(() => import('@/components/screens/admin/NurseManagement').then(m => ({ default: m.NurseManagement })), { ssr: false });
const NotificationsScreen = dynamic(() => import('@/components/screens/admin/NotificationsScreen').then(m => ({ default: m.NotificationsScreen })), { ssr: false });
const SettingsScreen = dynamic(() => import('@/components/screens/admin/SettingsScreen').then(m => ({ default: m.SettingsScreen })), { ssr: false });
const AdminMoreMenu = dynamic(() => import('@/components/screens/admin/AdminMoreMenu').then(m => ({ default: m.AdminMoreMenu })), { ssr: false });

// Lazy-loaded nurse screens
const NurseDashboard = dynamic(() => import('@/components/screens/nurse/NurseDashboard').then(m => ({ default: m.NurseDashboard })), { ssr: false });
const NurseCases = dynamic(() => import('@/components/screens/nurse/NurseCases').then(m => ({ default: m.NurseCases })), { ssr: false });
const NurseProfile = dynamic(() => import('@/components/screens/nurse/NurseProfile').then(m => ({ default: m.NurseProfile })), { ssr: false });
const NurseDailyReport = dynamic(() => import('@/components/screens/nurse/NurseDailyReport').then(m => ({ default: m.NurseDailyReport })), { ssr: false });

function ScreenFallback() {
  return <SkeletonLoader type="dashboard" />;
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
  if (!user) return <LoginScreen />;

  // Determine if we need the app shell (header + bottom nav)
  const needsShell = !['splash', 'login'].includes(currentScreen);

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
      case 'admin-appointments': return <AppointmentsScreen />;
      case 'admin-add-appointment': return <AddAppointmentForm />;
      case 'admin-finance': return <FinanceManagement />;
      case 'admin-nurses': return <NurseManagement />;
      case 'admin-more': return <AdminMoreMenu />;
      case 'admin-notifications': return <NotificationsScreen />;
      case 'admin-settings': return <SettingsScreen />;

      // Nurse screens
      case 'nurse-dashboard': return <NurseDashboard />;
      case 'nurse-patients': return <PatientList role="nurse" />;
      case 'nurse-patient-detail': return <PatientDetail role="nurse" />;
      case 'nurse-cases': return <NurseCases />;
      case 'nurse-appointments': return <AppointmentsScreen />;
      case 'nurse-profile': return <NurseProfile />;
      case 'nurse-notifications': return <NotificationsScreen />;
      case 'nurse-settings': return <SettingsScreen />;
      case 'nurse-daily-report': return <NurseDailyReport />;

      default: return <AdminDashboard />;
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
