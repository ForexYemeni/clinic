'use client';

import { TopHeader } from './TopHeader';
import { BottomNav } from './BottomNav';
import { useAppStore } from '@/lib/store';
import { AdminDashboard } from '@/components/screens/admin/AdminDashboard';
import { NurseManagement } from '@/components/screens/admin/NurseManagement';
import { PatientManagement } from '@/components/screens/admin/PatientManagement';
import { PatientDetail } from '@/components/screens/admin/PatientDetail';
import { ServiceManagement } from '@/components/screens/admin/ServiceManagement';
import { EmergencyManagement } from '@/components/screens/admin/EmergencyManagement';
import { AppointmentManagement } from '@/components/screens/admin/AppointmentManagement';
import { FinanceManagement } from '@/components/screens/admin/FinanceManagement';
import { ReportScreen } from '@/components/screens/admin/ReportScreen';
import { SettingsScreen } from '@/components/screens/admin/SettingsScreen';
import { NotificationScreen } from '@/components/screens/admin/NotificationScreen';
import { NurseDashboard } from '@/components/screens/nurse/NurseDashboard';
import { NursePatients } from '@/components/screens/nurse/NursePatients';
import { NurseCases } from '@/components/screens/nurse/NurseCases';
import { NurseServices } from '@/components/screens/nurse/NurseServices';
import { NurseAppointments } from '@/components/screens/nurse/NurseAppointments';
import { NurseProfile } from '@/components/screens/nurse/NurseProfile';
import { AnimatePresence, motion } from 'framer-motion';

export function MobileLayout() {
  const { user, currentScreen } = useAppStore();

  const renderScreen = () => {
    if (user?.role === 'admin') {
      switch (currentScreen) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'patients':
          return <PatientManagement />;
        case 'patient-detail':
          return <PatientDetail />;
        case 'services':
        case 'services-manage':
          return <ServiceManagement />;
        case 'emergencies':
        case 'emergency-detail':
          return <EmergencyManagement />;
        case 'more':
          return <MoreMenu />;
        case 'nurses':
          return <NurseManagement />;
        case 'appointments':
        case 'appointment-detail':
          return <AppointmentManagement />;
        case 'finance':
          return <FinanceManagement />;
        case 'reports':
          return <ReportScreen />;
        case 'settings':
          return <SettingsScreen />;
        case 'notifications':
          return <NotificationScreen />;
        default:
          return <AdminDashboard />;
      }
    } else {
      switch (currentScreen) {
        case 'dashboard':
          return <NurseDashboard />;
        case 'patients':
        case 'patient-detail':
          return <NursePatients />;
        case 'cases':
        case 'case-detail':
          return <NurseCases />;
        case 'services':
          return <NurseServices />;
        case 'appointments':
        case 'appointment-detail':
          return <NurseAppointments />;
        case 'profile':
        case 'nurse-daily-report':
        case 'settings':
        case 'notifications':
          return <NurseProfile />;
        default:
          return <NurseDashboard />;
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopHeader />
      <main className="flex-1 overflow-y-auto custom-scrollbar pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  );
}

// Admin More Menu
function MoreMenu() {
  const { setScreen } = useAppStore();

  const menuItems = [
    { id: 'nurses', label: 'إدارة التمريض', icon: '👨‍⚕️' },
    { id: 'appointments', label: 'المواعيد', icon: '📅' },
    { id: 'finance', label: 'المالية', icon: '💰' },
    { id: 'reports', label: 'التقارير', icon: '📊' },
    { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
    { id: 'notifications', label: 'الإشعارات', icon: '🔔' },
  ];

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-foreground mb-4">المزيد</h2>
      <div className="grid grid-cols-3 gap-3">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setScreen(item.id)}
            className="medical-card flex flex-col items-center justify-center p-4 gap-2 active:scale-95 transition-transform"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs font-medium text-foreground text-center">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
