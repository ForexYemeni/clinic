'use client';

import React, { useEffect, Suspense, Component, ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Building2, ScrollText, Settings, LogOut, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { installGlobalApiFetch } from '@/lib/api';
import '@/lib/pwa-install'; // Initialize PWA install prompt listener early
import { TopHeader } from '@/components/layout/TopHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { SplashScreen } from '@/components/screens/SplashScreen';
import { LoginScreen } from '@/components/screens/LoginScreen';
import { FirstSetupScreen } from '@/components/screens/FirstSetupScreen';
import { ThemeUpdater } from '@/components/shared/ThemeUpdater';
import { PwaInstallPrompt } from '@/components/shared/PwaInstallPrompt';
import { SubscriptionExpired } from '@/components/screens/SubscriptionExpired';
import { SuperAdminSetup } from '@/components/screens/SuperAdminSetup';

// Error Boundary - catches runtime errors and shows recovery UI
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[App ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    // Clear potentially corrupt state
    try {
      localStorage.removeItem('clinic-token');
    } catch {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">حدث خطأ غير متوقع</h2>
          <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
            يرجى إعادة تحميل الصفحة. إذا استمرت المشكلة، امسح بيانات التطبيق من إعدادات المتصفح.
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 h-12 px-6 bg-emerald-600 text-white font-bold rounded-xl active:scale-[0.98] transition-transform"
          >
            <RefreshCw className="w-5 h-5" />
            إعادة التحميل
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
const ClinicSettings = dynamic(() => import('@/components/screens/admin/ClinicSettings').then(m => ({ default: m.ClinicSettings })), { ssr: false });
const SystemReset = dynamic(() => import('@/components/screens/admin/SystemReset').then(m => ({ default: m.SystemReset })), { ssr: false });
const AdminNurseSalary = dynamic(() => import('@/components/screens/admin/AdminNurseSalary').then(m => ({ default: m.AdminNurseSalary })), { ssr: false });

// Lazy-loaded nurse screens
const NurseAddVisit = dynamic(() => import('@/components/screens/nurse/NurseAddVisit').then(m => ({ default: m.NurseAddVisit })), { ssr: false });
const NurseEmergencies = dynamic(() => import('@/components/screens/nurse/NurseEmergencies').then(m => ({ default: m.NurseEmergencies })), { ssr: false });
const NurseReports = dynamic(() => import('@/components/screens/nurse/NurseReports').then(m => ({ default: m.NurseReports })), { ssr: false });
const NurseAddCase = dynamic(() => import('@/components/screens/nurse/NurseAddCase').then(m => ({ default: m.NurseAddCase })), { ssr: false });
const NurseChangePassword = dynamic(() => import('@/components/screens/nurse/NurseChangePassword').then(m => ({ default: m.NurseChangePassword })), { ssr: false });
const NurseFinance = dynamic(() => import('@/components/screens/nurse/NurseFinance').then(m => ({ default: m.NurseFinance })), { ssr: false });
const NurseMoreMenu = dynamic(() => import('@/components/screens/nurse/NurseMoreMenu').then(m => ({ default: m.NurseMoreMenu })), { ssr: false });
const NurseSalary = dynamic(() => import('@/components/screens/nurse/NurseSalary').then(m => ({ default: m.NurseSalary })), { ssr: false });
const NurseDashboard = dynamic(() => import('@/components/screens/nurse/NurseDashboard').then(m => ({ default: m.NurseDashboard })), { ssr: false });

// Lazy-loaded super admin screens
const SuperAdminDashboard = dynamic(() => import('@/components/screens/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })), { ssr: false });
const SuperAdminClinicDetail = dynamic(() => import('@/components/screens/SuperAdminClinicDetail').then(m => ({ default: m.SuperAdminClinicDetail })), { ssr: false });
const SuperAdminAuditLogs = dynamic(() => import('@/components/screens/SuperAdminAuditLogs').then(m => ({ default: m.SuperAdminAuditLogs })), { ssr: false });

function ScreenFallback() {
  return (
    <div className="p-4 space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

// Super Admin bottom navigation
function SuperAdminBottomNav() {
  const { currentScreen, setScreen, logout } = useAppStore();

  const navItems = [
    { screen: 'super-admin-dashboard' as ScreenType, icon: Shield, label: 'المنصة' },
    { screen: 'super-admin-clinics' as ScreenType, icon: Building2, label: 'العيادات' },
    { screen: 'super-admin-audit-logs' as ScreenType, icon: ScrollText, label: 'السجل' },
    { screen: 'super-admin-settings' as ScreenType, icon: Settings, label: 'إعدادات' },
  ];

  const isActive = (screen: ScreenType) => {
    if (screen === 'super-admin-dashboard') {
      return currentScreen === 'super-admin-dashboard';
    }
    return currentScreen === screen;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-nav border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.screen);
          return (
            <button
              key={item.screen}
              onClick={() => setScreen(item.screen)}
              className="flex flex-col items-center justify-center py-1 px-2 rounded-xl touch-feedback"
            >
              <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-purple-50 dark:bg-purple-900/30 scale-110' : ''}`}>
                <item.icon className={`w-5 h-5 transition-colors ${active ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'}`} />
              </div>
              <span className={`text-[10px] mt-0.5 transition-colors ${active ? 'font-bold text-purple-600 dark:text-purple-400' : 'text-muted-foreground'}`}>{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={logout}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl touch-feedback"
        >
          <div className="p-1.5 rounded-xl bg-red-50 dark:bg-red-900/20">
            <LogOut className="w-5 h-5 text-red-500 dark:text-red-400" />
          </div>
          <span className="text-[10px] mt-0.5 text-red-500 dark:text-red-400 font-medium">خروج</span>
        </button>
      </div>
    </nav>
  );
}

export default function ClinicAppWrapper() {
  return (
    <ErrorBoundary>
      <ClinicApp />
    </ErrorBoundary>
  );
}

function ClinicApp() {
  const { currentScreen, isSplashDone, user, theme, subscription } = useAppStore();

  // Initialize theme and token from localStorage
  useEffect(() => {
    // Install global fetch interceptor that auto-adds JWT token to all /api/ requests
    installGlobalApiFetch();

    const saved = localStorage.getItem('clinic-theme') as 'light' | 'dark' | null;
    if (saved) {
      useAppStore.getState().setTheme(saved);
    }
    const savedToken = localStorage.getItem('clinic-token');
    if (savedToken) {
      useAppStore.getState().setToken(savedToken);
    }

    // Register service worker for PWA - force update check
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        // Force check for service worker updates on every page load
        registration.update().catch(() => {});
      }).catch(() => {
        // SW registration failed, not critical
      });
    }
  }, []);

  // Show splash first
  if (!isSplashDone) return <SplashScreen />;

  // Show login if not authenticated
  if (!user) {
    if (currentScreen === 'admin-setup') return <FirstSetupScreen />;
    if (currentScreen === 'super-admin-setup') return <SuperAdminSetup />;
    return <LoginScreen />;
  }

  // Check subscription for non-super_admin users
  if (user.role !== 'super_admin' && !subscription.valid && currentScreen === 'subscription-expired') {
    return <SubscriptionExpired />;
  }

  // Auto-redirect if subscription expired
  if (user.role !== 'super_admin' && !subscription.valid && currentScreen !== 'subscription-expired') {
    return <SubscriptionExpired />;
  }

  const isSuperAdmin = user.role === 'super_admin';
  const hideBottomNavScreens = ['splash', 'login', 'admin-setup', 'super-admin-setup', 'subscription-expired', 'nurse-add-visit', 'admin-add-patient'];
  const needsShell = !hideBottomNavScreens.includes(currentScreen) && !isSuperAdmin;

  // Super Admin screens
  if (isSuperAdmin) {
    const renderSuperAdminScreen = () => {
      switch (currentScreen) {
        case 'super-admin-clinic-detail':
          return <SuperAdminClinicDetail />;
        case 'super-admin-audit-logs':
          return <SuperAdminAuditLogs />;
        case 'super-admin-clinics':
          return <SuperAdminDashboard initialTab="clinics" />;
        case 'super-admin-add-clinic':
          return <SuperAdminDashboard initialTab="add" />;
        case 'super-admin-platform-config':
          return <SuperAdminDashboard initialTab="platform" />;
        case 'super-admin-settings':
          return <SuperAdminDashboard initialTab="settings" />;
        case 'super-admin-dashboard':
        default:
          return <SuperAdminDashboard initialTab="dashboard" />;
      }
    };

    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto relative">
        <ThemeUpdater />
        <PwaInstallPrompt />
        <main>
          <AnimatePresence mode="wait">
            <motion.div key={currentScreen} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18, ease: 'easeOut' }}>
              <Suspense fallback={<ScreenFallback />}>
                {renderSuperAdminScreen()}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
        <SuperAdminBottomNav />
      </div>
    );
  }

  // Regular user screens
  const renderScreen = () => {
    switch (currentScreen) {
      case 'admin-dashboard': return <AdminDashboard />;
      case 'admin-patients': return <PatientList role="admin" />;
      case 'admin-patient-detail': return <PatientDetail role="admin" />;
      case 'admin-add-patient': return <AddPatientForm />;
      case 'admin-services': return <ServiceManagement />;
      case 'admin-emergencies': return <EmergencyManagement />;
      case 'admin-add-emergency': return <AddEmergencyForm />;
      case 'admin-finance': return <FinanceManagement />;
      case 'admin-nurses': return <NurseManagement />;
      case 'admin-nurse-salary': return <AdminNurseSalary />;
      case 'admin-more': return <AdminMoreMenu />;
      case 'admin-notifications': return <NotificationsScreen />;
      case 'admin-settings': return <SettingsScreen />;
      case 'admin-reports': return <AdminReports />;
      case 'admin-clinic-settings': return <ClinicSettings />;
      case 'admin-system-reset': return <SystemReset />;
      case 'nurse-patients': return <PatientList role="nurse" />;
      case 'nurse-dashboard': return <NurseDashboard />;
      case 'nurse-patient-detail': return <PatientDetail role="nurse" />;
      case 'nurse-add-visit': return <NurseAddVisit />;
      case 'nurse-emergencies': return <NurseEmergencies />;
      case 'nurse-reports': return <NurseReports />;
      case 'nurse-add-emergency': return <NurseAddCase />;
      case 'nurse-change-password': return <NurseChangePassword />;
      case 'nurse-finance': return <NurseFinance />;
      case 'nurse-more': return <NurseMoreMenu />;
      case 'nurse-salary': return <NurseSalary />;
      case 'subscription-expired': return <SubscriptionExpired />;
      default: return user?.role === 'admin' ? <AdminDashboard /> : <NurseDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <ThemeUpdater />
      <PwaInstallPrompt />
      {needsShell && <TopHeader />}
      <main>
        <AnimatePresence mode="wait">
          <motion.div key={currentScreen} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18, ease: 'easeOut' }}>
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
