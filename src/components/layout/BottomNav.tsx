'use client';

import { Home, Users, BriefcaseMedical, Siren, MoreHorizontal, ClipboardList, CalendarDays, UserCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface NavItem {
  id: string;
  label: string;
  icon: typeof Home;
}

const adminNavItems: NavItem[] = [
  { id: 'dashboard', label: 'الرئيسية', icon: Home },
  { id: 'patients', label: 'المرضى', icon: Users },
  { id: 'services', label: 'الخدمات', icon: BriefcaseMedical },
  { id: 'emergencies', label: 'الطوارئ', icon: Siren },
  { id: 'more', label: 'المزيد', icon: MoreHorizontal },
];

const nurseNavItems: NavItem[] = [
  { id: 'dashboard', label: 'الرئيسية', icon: Home },
  { id: 'patients', label: 'المرضى', icon: Users },
  { id: 'cases', label: 'الحالات', icon: ClipboardList },
  { id: 'appointments', label: 'المواعيد', icon: CalendarDays },
  { id: 'profile', label: 'الملف', icon: UserCircle },
];

export function BottomNav() {
  const { user, currentScreen, setScreen } = useAppStore();
  const items = user?.role === 'admin' ? adminNavItems : nurseNavItems;

  const handleNavClick = (id: string) => {
    setScreen(id);
  };

  // Determine active tab based on current screen
  const getActiveTab = () => {
    const adminMoreScreens = ['services-manage', 'finance', 'reports', 'settings', 'notifications', 'nurses'];
    const nurseProfileScreens = ['nurse-daily-report', 'settings', 'notifications'];
    
    if (currentScreen === 'dashboard') return 'dashboard';
    if (currentScreen === 'patients' || currentScreen === 'patient-detail') return 'patients';
    if (currentScreen === 'emergencies' || currentScreen === 'emergency-detail') return 'emergencies';
    if (currentScreen === 'services') return 'services';
    if (currentScreen === 'appointments' || currentScreen === 'appointment-detail') return 'appointments';
    if (currentScreen === 'cases' || currentScreen === 'case-detail') return 'cases';
    if (currentScreen === 'profile') return 'profile';
    if (user?.role === 'admin' && adminMoreScreens.includes(currentScreen)) return 'more';
    if (user?.role === 'nurse' && nurseProfileScreens.includes(currentScreen)) return 'profile';
    return 'dashboard';
  };

  const activeTab = getActiveTab();

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`bottom-nav-item flex-1 ${isActive ? 'active' : ''}`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-primary' : ''}`} />
              <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
