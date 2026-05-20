import { create } from 'zustand';

export type ScreenType =
  | 'splash' | 'login' | 'admin-setup' | 'super-admin-setup'
  | 'admin-dashboard' | 'admin-patients' | 'admin-services' | 'admin-emergencies' | 'admin-more'
  | 'admin-nurses' | 'admin-finance' | 'admin-reports' | 'admin-notifications' | 'admin-settings'
  | 'admin-patient-detail' | 'admin-add-patient' | 'admin-add-nurse' | 'admin-add-emergency'
  | 'admin-add-payment' | 'admin-add-service' | 'admin-clinic-settings' | 'admin-system-reset'
  | 'admin-nurse-salary'
  | 'nurse-patients' | 'nurse-emergencies' | 'nurse-reports' | 'nurse-more' | 'nurse-finance'
  | 'nurse-dashboard' | 'nurse-patient-detail' | 'nurse-add-emergency' | 'nurse-add-visit' | 'nurse-change-password'
  | 'nurse-salary'
  | 'subscription-expired'
  // Super Admin screens
  | 'super-admin-dashboard' | 'super-admin-clinics' | 'super-admin-clinic-detail'
  | 'super-admin-add-clinic' | 'super-admin-firebase-config' | 'super-admin-settings'
  | 'super-admin-audit-logs';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'super_admin' | 'admin' | 'nurse';
  active: boolean;
  clinicId?: string | null;
}

export interface ClinicSettings {
  name: string;
  description: string;
  phone: string;
  address: string;
  logo: string;
  primaryColor: string;
}

export interface SubscriptionInfo {
  valid: boolean;
  status: 'active' | 'trial' | 'expired' | 'suspended';
  endDate: string;
  daysRemaining: number;
}

interface AppState {
  currentScreen: ScreenType;
  user: User | null;
  theme: 'light' | 'dark';
  isSplashDone: boolean;
  isFirstSetup: boolean;
  clinicName: string;
  clinicSettings: ClinicSettings;
  clinicId: string | null;
  token: string | null;
  subscription: SubscriptionInfo;
  selectedPatientId: string | null;
  selectedEmergencyId: string | null;
  selectedClinicId: string | null; // For super admin viewing clinic details
  selectedNurseId: string | null; // For admin viewing nurse salary details
  searchQuery: string;

  setScreen: (screen: ScreenType) => void;
  setUser: (user: User | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setSplashDone: (done: boolean) => void;
  setIsFirstSetup: (val: boolean) => void;
  setClinicName: (name: string) => void;
  setClinicSettings: (settings: Partial<ClinicSettings>) => void;
  setClinicId: (id: string | null) => void;
  setToken: (token: string | null) => void;
  setSubscription: (sub: Partial<SubscriptionInfo>) => void;
  setSelectedPatientId: (id: string | null) => void;
  setSelectedEmergencyId: (id: string | null) => void;
  setSelectedClinicId: (id: string | null) => void;
  setSelectedNurseId: (id: string | null) => void;
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

const DEFAULT_SUBSCRIPTION: SubscriptionInfo = {
  valid: true,
  status: 'active',
  endDate: '',
  daysRemaining: 0,
};

export const useAppStore = create<AppState>((set) => ({
  currentScreen: 'splash',
  user: null,
  theme: 'light',
  isSplashDone: false,
  isFirstSetup: false,
  clinicName: 'عيادتي',
  clinicSettings: DEFAULT_CLINIC_SETTINGS,
  clinicId: null,
  token: null,
  subscription: DEFAULT_SUBSCRIPTION,
  selectedPatientId: null,
  selectedEmergencyId: null,
  selectedClinicId: null,
  selectedNurseId: null,
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
  setClinicId: (id) => set({ clinicId: id }),
  setToken: (token) => {
    set({ token });
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('clinic-token', token);
      else localStorage.removeItem('clinic-token');
    }
  },
  setSubscription: (sub) => set((state) => ({
    subscription: { ...state.subscription, ...sub },
  })),
  setSelectedPatientId: (id) => set({ selectedPatientId: id }),
  setSelectedEmergencyId: (id) => set({ selectedEmergencyId: id }),
  setSelectedClinicId: (id) => set({ selectedClinicId: id }),
  setSelectedNurseId: (id) => set({ selectedNurseId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('clinic-token');
    }
    set({
      user: null,
      currentScreen: 'login',
      selectedPatientId: null,
      selectedEmergencyId: null,
      selectedClinicId: null,
      selectedNurseId: null,
      token: null,
      clinicId: null,
      subscription: DEFAULT_SUBSCRIPTION,
    });
  },
}));
