import { type LucideIcon, AlertTriangle, Calendar, Stethoscope, Info, Users, FileText, Activity } from 'lucide-react';

// ==================== TYPES ====================
export interface DashboardData {
  totalPatients: number;
  totalEmergencies: number;
  activeEmergencies: number;
  totalAppointments: number;
  todayAppointments: number;
  totalRevenue: number;
  totalServices: number;
  totalNurses: number;
  todayRevenue: number;
  pendingInvoices: number;
  servicesByCategory: { category: string; _count: { id: number } }[];
  recentEmergencies: EmergencyItem[];
  recentPayments: PaymentItem[];
  todaySchedule: AppointmentItem[];
}

export interface EmergencyItem {
  id: string;
  patientId?: string;
  nurseId?: string;
  severity: string;
  status: string;
  notes?: string;
  actions?: string;
  arrivalTime: string;
  patient?: { id?: string; name: string };
  nurse?: { id?: string; name: string };
  [key: string]: unknown;
}

export interface PaymentItem {
  id: string;
  patientId?: string;
  amount: number;
  type: string;
  method?: string;
  description?: string;
  createdAt: string;
  patient?: { id?: string; name: string };
  [key: string]: unknown;
}

export interface AppointmentItem {
  id: string;
  patientId?: string;
  nurseId?: string;
  date: string;
  duration?: number;
  type?: string;
  status: string;
  notes?: string;
  patient?: { id?: string; name: string };
  nurse?: { id?: string; name: string };
  [key: string]: unknown;
}

export interface InvoiceItem {
  id: string;
  patientId?: string;
  total: number;
  paid: number;
  status: string;
  patient?: { id?: string; name: string };
  [key: string]: unknown;
}

export interface PatientItem {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone?: string;
  emergencyPhone?: string;
  address?: string;
  bloodType?: string;
  chronicDiseases?: string;
  allergies?: string;
  medicalHistory?: string;
  notes?: string;
  visits?: VisitItem[];
  services?: PatientServiceItem[];
  medications?: MedicationItem[];
  _count?: { visits?: number; patientServices?: number };
  createdAt: string;
  [key: string]: unknown;
}

export interface VisitItem {
  id: string;
  reason: string;
  diagnosis?: string;
  status: string;
  visitDate: string;
  notes?: string;
  [key: string]: unknown;
}

export interface PatientServiceItem {
  id: string;
  serviceId?: string;
  status: string;
  service?: { nameAr: string; price: number; duration: number };
  nurse?: { name: string };
  [key: string]: unknown;
}

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  notes?: string;
  [key: string]: unknown;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  [key: string]: unknown;
}

export interface NurseItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  active: boolean;
  role: string;
  [key: string]: unknown;
}

// ==================== FORMAT HELPERS ====================
export const formatCurrency = (amount: number): string =>
  `${amount.toLocaleString('ar-SA')} ر.س`;

export const formatDate = (date: string | Date): string =>
  new Date(date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });

export const formatTime = (date: string | Date): string =>
  new Date(date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'أمس';
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  return formatDate(date);
};

// ==================== COLOR MAPS ====================
export const severityColors: Record<string, string> = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  moderate: 'bg-yellow-500 text-black',
  low: 'bg-green-500 text-white',
};

export const severityDotColors: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  moderate: 'bg-yellow-500',
  low: 'bg-green-500',
};

export const severityBorderColors: Record<string, string> = {
  critical: 'border-r-red-500',
  high: 'border-r-orange-500',
  moderate: 'border-r-yellow-500',
  low: 'border-r-green-500',
};

export const statusColors: Record<string, string> = {
  active: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  treated: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  transferred: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  archived: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  unpaid: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  partial: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export const statusLabels: Record<string, string> = {
  active: 'نشط',
  treated: 'تم العلاج',
  transferred: 'محول',
  archived: 'مؤرشف',
  scheduled: 'مجدول',
  confirmed: 'مؤكد',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  paid: 'مدفوع',
  unpaid: 'غير مدفوع',
  partial: 'مدفوع جزئياً',
  pending: 'قيد الانتظار',
  'in-progress': 'قيد التنفيذ',
};

export const severityLabels: Record<string, string> = {
  critical: 'حرج',
  high: 'عالي',
  moderate: 'متوسط',
  low: 'منخفض',
};

export const genderLabels: Record<string, string> = {
  male: 'ذكر',
  female: 'أنثى',
};

export const appointmentTypeLabels: Record<string, string> = {
  checkup: 'فحص عام',
  'follow-up': 'متابعة',
  treatment: 'علاج',
  emergency: 'طوارئ',
};

export const appointmentTypeColors: Record<string, string> = {
  checkup: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'follow-up': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  treatment: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  emergency: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export const notificationTypeIcons: Record<string, LucideIcon> = {
  emergency: AlertTriangle,
  appointment: Calendar,
  service: Stethoscope,
  system: Info,
};

export const notificationTypeColors: Record<string, string> = {
  emergency: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  appointment: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  service: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  system: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
};

// ==================== CHART COLORS ====================
export const CHART_COLORS = ['#059669', '#0d9488', '#0891b2', '#6366f1', '#8b5cf6'];
export const PIE_COLORS = ['#059669', '#0d9488', '#0891b2', '#6366f1', '#8b5cf6', '#ec4899'];

// ==================== GRADIENT CLASSES ====================
export const statGradients = {
  emerald: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
  red: 'bg-gradient-to-br from-red-500 to-red-600',
  blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
  amber: 'bg-gradient-to-br from-amber-500 to-amber-600',
  teal: 'bg-gradient-to-br from-teal-500 to-teal-600',
  purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
};

// ==================== BLOOD TYPES ====================
export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

// ==================== DEBOUNCE ====================
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
