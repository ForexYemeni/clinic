import { type LucideIcon, AlertTriangle, Stethoscope, Info } from 'lucide-react';

// ==================== TYPES ====================
export interface DashboardData {
  totalPatients: number;
  totalEmergencies: number;
  activeEmergencies: number;
  todayServices: number;
  totalRevenue: number;
  totalServices: number;
  totalNurses: number;
  todayRevenue: number;
  pendingInvoices: number;
  monthlyRevenue: number;
  monthlyPatients: number;
  servicesByCategory: { category: string; count: number }[];
  recentEmergencies: EmergencyItem[];
  recentPayments: PaymentItem[];
  topServices: { name: string; count: number }[];
  dailyRevenue: { date: string; revenue: number }[];
}

export interface EmergencyItem {
  id: string;
  patientId?: string;
  nurseId?: string;
  severity: string;
  status: string;
  notes?: string;
  actions?: string;
  procedures?: string;
  arrivalTime: string;
  patientName?: string;
  nurseName?: string;
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

export interface InvoiceItem {
  id: string;
  patientId?: string;
  visitId?: string;
  nurseName?: string;
  nurseId?: string;
  patientName?: string;
  items: InvoiceLineItem[];
  total: number;
  paid: number;
  remaining: number;
  status: string;
  paymentMethod?: string;
  patient?: { id?: string; name: string; phone?: string };
  createdAt: string;
  [key: string]: unknown;
}

export interface InvoiceLineItem {
  serviceId?: string;
  serviceName: string;
  price: number;
  quantity: number;
  nurseName?: string;
  date?: string;
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
  invoices?: InvoiceItem[];
  payments?: PaymentItem[];
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
  nurseId?: string;
  nurseName?: string;
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    oxygenLevel?: number;
    sugarLevel?: number;
  };
  medications?: string[];
  [key: string]: unknown;
}

export interface PatientServiceItem {
  id: string;
  serviceId?: string;
  serviceName?: string;
  price?: number;
  status: string;
  service?: { nameAr: string; price: number; duration: number };
  nurse?: { name: string };
  nurseName?: string;
  createdAt?: string;
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
  phone?: string;
  password?: string;
  active: boolean;
  role: string;
  salary?: number;
  [key: string]: unknown;
}

export interface ServiceItem {
  id: string;
  nameAr: string;
  price: number;
  duration: number;
  category: string;
  description: string;
  active: boolean;
  status: 'active' | 'paused' | 'deleted';
  createdAt: string;
  [key: string]: unknown;
}

export interface BillingItem {
  id: string;
  patientId: string;
  services: { name: string; price: number; date: string }[];
  total: number;
  paid: number;
  remaining: number;
  status: 'paid' | 'unpaid' | 'partial';
  createdAt: string;
  [key: string]: unknown;
}

export interface DefaultService {
  nameAr: string;
  price: number;
  duration: number;
  category: string;
  description: string;
}

// ==================== DEFAULT SERVICES (14) ====================
export const DEFAULT_SERVICES: DefaultService[] = [
  { nameAr: 'قياس الضغط', price: 500, duration: 10, category: 'قياسات', description: 'قياس ضغط الدم' },
  { nameAr: 'قياس السكر', price: 500, duration: 10, category: 'قياسات', description: 'قياس مستوى السكر في الدم' },
  { nameAr: 'قياس الحرارة', price: 300, duration: 5, category: 'قياسات', description: 'قياس درجة حرارة الجسم' },
  { nameAr: 'قياس الأكسجين', price: 500, duration: 10, category: 'قياسات', description: 'قياس مستوى الأكسجين في الدم' },
  { nameAr: 'تضميد الجروح', price: 1500, duration: 20, category: 'إسعافات', description: 'تنظيف وتضميد الجروح' },
  { nameAr: 'الحروق', price: 2000, duration: 25, category: 'إسعافات', description: 'علاج الحروق البسيطة والمتوسطة' },
  { nameAr: 'الكسور البسيطة', price: 3000, duration: 30, category: 'إسعافات', description: 'تثبيت وعلاج الكسور البسيطة' },
  { nameAr: 'الأكسجين العلاجي', price: 1500, duration: 30, category: 'علاج', description: 'إعطاء الأكسجين العلاجي' },
  { nameAr: 'الحقن', price: 800, duration: 15, category: 'علاج', description: 'إعطاء الحقن العضلية والوريدية' },
  { nameAr: 'المحاليل', price: 1500, duration: 45, category: 'علاج', description: 'إعطاء المحاليل الوريدية' },
  { nameAr: 'الأدوية', price: 500, duration: 10, category: 'علاج', description: 'صرف وتقديم الأدوية' },
  { nameAr: 'الرذاذ الاستنشاقي', price: 800, duration: 15, category: 'علاج', description: 'علاج بالرذاذ والاستنشاق' },
  { nameAr: 'تغيير الضمادات', price: 1000, duration: 15, category: 'رعاية', description: 'تغيير وتجديد الضمادات' },
  { nameAr: 'الإسعافات الأولية العامة', price: 3000, duration: 30, category: 'إسعافات', description: 'إسعافات أولية شاملة' },
];

// ==================== FORMAT HELPERS ====================
export const formatCurrency = (amount: number): string =>
  `${amount.toLocaleString('ar-YE')} ر.ي`;

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
  completed: 'bg-clinic-100 text-clinic-700 dark:bg-clinic-900/30 dark:text-clinic-400',
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

export const paymentMethodLabels: Record<string, string> = {
  cash: 'نقدي',
  card: 'بطاقة',
  transfer: 'تحويل',
};

export const paymentMethodColors: Record<string, string> = {
  cash: 'bg-clinic-100 text-clinic-700 dark:bg-clinic-900/30 dark:text-clinic-400',
  card: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  transfer: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export const serviceStatusLabels: Record<string, string> = {
  active: 'نشط',
  paused: 'متوقف',
  deleted: 'محذوف',
};

export const serviceStatusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  deleted: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export const notificationTypeIcons: Record<string, LucideIcon> = {
  emergency: AlertTriangle,
  service: Stethoscope,
  system: Info,
};

export const notificationTypeColors: Record<string, string> = {
  emergency: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  service: 'bg-clinic-100 text-clinic-600 dark:bg-clinic-900/30 dark:text-clinic-400',
  system: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
};

// ==================== CHART COLORS ====================
export const CHART_COLORS = ['#059669', '#0d9488', '#0891b2', '#6366f1', '#8b5cf6'];
export const PIE_COLORS = ['#059669', '#0d9488', '#0891b2', '#6366f1', '#8b5cf6', '#ec4899'];

// ==================== GRADIENT CLASSES ====================
export const statGradients = {
  emerald: 'bg-gradient-to-br from-clinic-500 to-clinic-600',
  red: 'bg-gradient-to-br from-red-500 to-red-600',
  teal: 'bg-gradient-to-br from-teal-500 to-teal-600',
  amber: 'bg-gradient-to-br from-amber-500 to-amber-600',
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
