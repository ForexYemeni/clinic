import { create } from 'zustand';

export type ScreenType = 
  | 'splash' | 'login' | 'admin-setup'
  | 'admin-dashboard' | 'admin-patients' | 'admin-services' | 'admin-emergencies' | 'admin-more'
  | 'admin-nurses' | 'admin-finance' | 'admin-reports' | 'admin-notifications' | 'admin-settings'
  | 'admin-patient-detail' | 'admin-add-patient' | 'admin-add-nurse' | 'admin-add-emergency'
  | 'admin-add-payment' | 'admin-add-service' | 'admin-clinic-settings' | 'admin-system-reset'
  | 'nurse-patients' | 'nurse-emergencies' | 'nurse-reports' | 'nurse-more' | 'nurse-finance'
  | 'nurse-patient-detail' | 'nurse-add-emergency' | 'nurse-add-visit' | 'nurse-change-password';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'admin' | 'nurse';
  active: boolean;
}

export interface ClinicSettings {
  name: string;
  description: string;
  phone: string;
  address: string;
  logo: string;
  primaryColor: string;
}

interface AppState {
  currentScreen: ScreenType;
  user: User | null;
  theme: 'light' | 'dark';
  isSplashDone: boolean;
  isFirstSetup: boolean;
  clinicName: string;
  clinicSettings: ClinicSettings;
  selectedPatientId: string | null;
  selectedEmergencyId: string | null;
  searchQuery: string;
  
  setScreen: (screen: ScreenType) => void;
  setUser: (user: User | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setSplashDone: (done: boolean) => void;
  setIsFirstSetup: (val: boolean) => void;
  setClinicName: (name: string) => void;
  setClinicSettings: (settings: Partial<ClinicSettings>) => void;
  setSelectedPatientId: (id: string | null) => void;
  setSelectedEmergencyId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  logout: () => void;
}

const DEFAULT_CLINIC_SETTINGS: ClinicSettings = {
  name: 'عيادتي',
  description: '',
  phone: '',
  address: '',
  logo: '',
  primaryColor: 'emerald',
};

export const useAppStore = create<AppState>((set) => ({
  currentScreen: 'splash',
  user: null,
  theme: 'light',
  isSplashDone: false,
  isFirstSetup: false,
  clinicName: 'عيادتي',
  clinicSettings: DEFAULT_CLINIC_SETTINGS,
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
  setIsFirstSetup: (val) => set({ isFirstSetup: val }),
  setClinicName: (name) => set({ clinicName: name, clinicSettings: (prev) => ({ ...prev, name }) }),
  setClinicSettings: (settings) => set((state) => {
    const newSettings = { ...state.clinicSettings, ...settings };
    return { clinicSettings: newSettings, clinicName: newSettings.name };
  }),
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
