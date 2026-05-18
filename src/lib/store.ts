import { create } from 'zustand';

export type ScreenType = 
  | 'splash' | 'login' 
  | 'admin-dashboard' | 'admin-patients' | 'admin-services' | 'admin-emergencies' | 'admin-more'
  | 'admin-nurses' | 'admin-appointments' | 'admin-finance' | 'admin-reports' | 'admin-notifications' | 'admin-settings'
  | 'admin-patient-detail' | 'admin-add-patient' | 'admin-add-nurse' | 'admin-add-emergency'
  | 'admin-add-appointment' | 'admin-add-payment' | 'admin-add-invoice'
  | 'nurse-dashboard' | 'nurse-patients' | 'nurse-cases' | 'nurse-appointments' | 'nurse-profile'
  | 'nurse-services' | 'nurse-daily-report' | 'nurse-notifications' | 'nurse-settings'
  | 'nurse-patient-detail' | 'nurse-add-case' | 'nurse-add-service';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'nurse';
  phone?: string;
  avatar?: string;
  active: boolean;
}

interface AppState {
  currentScreen: ScreenType;
  user: User | null;
  theme: 'light' | 'dark';
  isSplashDone: boolean;
  selectedPatientId: string | null;
  selectedEmergencyId: string | null;
  searchQuery: string;
  
  setScreen: (screen: ScreenType) => void;
  setUser: (user: User | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setSplashDone: (done: boolean) => void;
  setSelectedPatientId: (id: string | null) => void;
  setSelectedEmergencyId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentScreen: 'splash',
  user: null,
  theme: 'light',
  isSplashDone: false,
  selectedPatientId: null,
  selectedEmergencyId: null,
  searchQuery: '',

  setScreen: (screen) => set({ currentScreen: screen }),
  setUser: (user) => set({ user }),
  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('clinic-theme', theme);
    }
  },
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      localStorage.setItem('clinic-theme', newTheme);
    }
    return { theme: newTheme };
  }),
  setSplashDone: (done) => set({ isSplashDone: done }),
  setSelectedPatientId: (id) => set({ selectedPatientId: id }),
  setSelectedEmergencyId: (id) => set({ selectedEmergencyId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  logout: () => set({ 
    user: null, 
    currentScreen: 'login',
    selectedPatientId: null,
    selectedEmergencyId: null,
  }),
}));
