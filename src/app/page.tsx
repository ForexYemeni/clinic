'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Users, Stethoscope, AlertTriangle, MoreHorizontal,
  Calendar, DollarSign, BarChart3, Bell, Settings, Plus,
  Search, ChevronLeft, ChevronRight, Moon, Sun, LogOut,
  UserPlus, Heart, Activity, Clock, Phone, MapPin,
  Droplets, Thermometer, Wind, Eye, Edit, Trash2,
  Filter, CheckCircle, XCircle, AlertCircle, Info,
  ArrowUpRight, ArrowDownRight, TrendingUp, User,
  FileText, CreditCard, Receipt, ClipboardList, Shield,
  Briefcase, ChevronDown, X, Save, Loader2
} from 'lucide-react';
import { useAppStore, ScreenType } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

// ==================== TYPES ====================
interface DashboardData {
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
  recentEmergencies: any[];
  recentPayments: any[];
  todaySchedule: any[];
}

// ==================== HELPERS ====================
const formatCurrency = (amount: number) => `${amount.toLocaleString('ar-SA')} ر.س`;
const formatDate = (date: string | Date) => new Date(date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
const formatTime = (date: string | Date) => new Date(date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

const severityColors: Record<string, string> = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  moderate: 'bg-yellow-500 text-black',
  low: 'bg-green-500 text-white',
};

const severityLabels: Record<string, string> = {
  critical: 'حرج',
  high: 'عالي',
  moderate: 'متوسط',
  low: 'منخفض',
};

const statusColors: Record<string, string> = {
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

const statusLabels: Record<string, string> = {
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

// ==================== FETCH HELPERS ====================
async function fetchData(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Fetch failed');
  return res.json();
}

// ==================== SPLASH SCREEN ====================
function SplashScreen() {
  const { setSplashDone } = useAppStore();
  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), 2200);
    return () => clearTimeout(timer);
  }, [setSplashDone]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 flex flex-col items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', duration: 0.8 }}
        className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-6"
      >
        <Heart className="w-14 h-14 text-emerald-600" fill="currentColor" />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-white text-2xl font-bold mb-2"
      >
        عيادة الإسعافات الأولية
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-emerald-100 text-sm mb-8"
      >
        نظام إدارة احترافي
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="flex gap-1"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, delay: i * 0.2, duration: 0.6 }}
            className="w-2 h-2 bg-white/60 rounded-full"
          />
        ))}
      </motion.div>
    </div>
  );
}

// ==================== LOGIN SCREEN ====================
function LoginScreen() {
  const { setUser, setScreen } = useAppStore();
  const [email, setEmail] = useState('admin@clinic.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) { setError('يرجى إدخال البريد وكلمة المرور'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setUser(data.user);
      setScreen(data.user.role === 'admin' ? 'admin-dashboard' : 'nurse-dashboard');
      toast.success(`مرحباً ${data.user.name}`);
    } catch {
      setError('خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12">
        <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-8">
          <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg mb-4 mx-auto">
            <Heart className="w-10 h-10 text-white" fill="currentColor" />
          </div>
          <h1 className="text-2xl font-bold text-center text-foreground">عيادة الإسعافات الأولية</h1>
          <p className="text-muted-foreground text-center text-sm mt-1">تسجيل الدخول للمتابعة</p>
        </motion.div>

        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="w-full max-w-sm">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@clinic.com" className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>كلمة المرور</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-12 rounded-xl" onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
              </div>
              <Button onClick={handleLogin} disabled={loading} className="w-full h-12 rounded-xl text-base font-semibold bg-emerald-600 hover:bg-emerald-700">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تسجيل الدخول'}
              </Button>
            </CardContent>
          </Card>

          <div className="mt-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur rounded-2xl p-4">
            <p className="text-xs text-muted-foreground mb-2 font-semibold">حسابات تجريبية:</p>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between items-center cursor-pointer touch-feedback p-1 rounded" onClick={() => { setEmail('admin@clinic.com'); setPassword('admin123'); }}>
                <span>المدير: admin@clinic.com</span>
                <Badge variant="outline" className="text-[10px]">مدير</Badge>
              </div>
              <div className="flex justify-between items-center cursor-pointer touch-feedback p-1 rounded" onClick={() => { setEmail('noura@clinic.com'); setPassword('nurse123'); }}>
                <span>الممرضة: noura@clinic.com</span>
                <Badge variant="outline" className="text-[10px]">ممرض</Badge>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ==================== TOP HEADER ====================
function TopHeader() {
  const { user, theme, toggleTheme, setScreen } = useAppStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetch(`/api/notifications?userId=${user.id}`)
        .then(r => r.json())
        .then((data: any[]) => setUnreadCount(data.filter(n => !n.read).length))
        .catch(() => {});
    }
  }, [user]);

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">عيادة الإسعافات</h1>
            <p className="text-[10px] text-muted-foreground">{user?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl touch-feedback" onClick={() => setScreen(user?.role === 'admin' ? 'admin-notifications' : 'nurse-notifications')}>
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -left-0.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl touch-feedback" onClick={toggleTheme}>
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </header>
  );
}

// ==================== BOTTOM NAVIGATION ====================
function BottomNav() {
  const { currentScreen, setScreen, user } = useAppStore();
  const isAdmin = user?.role === 'admin';

  const adminTabs = [
    { id: 'admin-dashboard', label: 'الرئيسية', icon: Home },
    { id: 'admin-patients', label: 'المرضى', icon: Users },
    { id: 'admin-services', label: 'الخدمات', icon: Stethoscope },
    { id: 'admin-emergencies', label: 'الطوارئ', icon: AlertTriangle },
    { id: 'admin-more', label: 'المزيد', icon: MoreHorizontal },
  ];

  const nurseTabs = [
    { id: 'nurse-dashboard', label: 'الرئيسية', icon: Home },
    { id: 'nurse-patients', label: 'المرضى', icon: Users },
    { id: 'nurse-cases', label: 'الحالات', icon: ClipboardList },
    { id: 'nurse-appointments', label: 'المواعيد', icon: Calendar },
    { id: 'nurse-profile', label: 'الملف', icon: User },
  ];

  const tabs = isAdmin ? adminTabs : nurseTabs;

  const getActiveTab = () => {
    const screen = currentScreen as string;
    for (const tab of tabs) {
      if (screen.startsWith(tab.id)) return tab.id;
    }
    return tabs[0].id;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = getActiveTab() === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setScreen(tab.id as ScreenType)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all touch-feedback ${
                active ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-emerald-50 dark:bg-emerald-900/30' : ''}`}>
                <tab.icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] mt-0.5 ${active ? 'font-bold' : ''}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ==================== STAT CARD ====================
function StatCard({ icon: Icon, label, value, color, trend }: { icon: any; label: string; value: string | number; color: string; trend?: string }) {
  return (
    <Card className="border-0 shadow-sm touch-feedback">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <div className={`flex items-center text-xs font-semibold ${trend.startsWith('+') ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trend}
            </div>
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== SEARCH BAR ====================
function SearchInput({ value, onChange, placeholder = 'بحث...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-11 pr-10 pl-4 rounded-xl bg-muted/50 border-0" />
    </div>
  );
}

// ==================== EMPTY STATE ====================
function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground text-center mt-1">{description}</p>}
    </div>
  );
}

// ==================== ADMIN DASHBOARD ====================
function AdminDashboard() {
  const { setScreen } = useAppStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData('/api/dashboard').then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!data) return <EmptyState icon={AlertCircle} title="خطأ في تحميل البيانات" />;

  const chartData = data.servicesByCategory.map((s: any) => ({
    name: s.category,
    value: s._count.id,
  }));

  const revenueData = [
    { name: 'السبت', revenue: 450 },
    { name: 'الأحد', revenue: 680 },
    { name: 'الاثنين', revenue: 520 },
    { name: 'الثلاثاء', revenue: 890 },
    { name: 'الأربعاء', revenue: 750 },
    { name: 'الخميس', revenue: 960 },
  ];

  const pieColors = ['#059669', '#0d9488', '#0891b2', '#6366f1', '#8b5cf6'];

  return (
    <div className="px-4 pb-24 space-y-4 pt-2">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">مرحباً بك 👋</h2>
          <p className="text-sm text-muted-foreground">لوحة التحكم الرئيسية</p>
        </div>
        <Button size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-700" onClick={() => setScreen('admin-add-patient')}>
          <Plus className="w-4 h-4 ml-1" /> مريض
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users} label="إجمالي المرضى" value={data.totalPatients} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" trend="+12%" />
        <StatCard icon={AlertTriangle} label="حالات الطوارئ" value={data.activeEmergencies} color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" />
        <StatCard icon={Calendar} label="مواعيد اليوم" value={data.todayAppointments} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
        <StatCard icon={DollarSign} label="إيرادات اليوم" value={formatCurrency(data.todayRevenue)} color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" trend="+8%" />
      </div>

      {/* Revenue Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-bold">الإيرادات الأسبوعية</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="revenue" fill="#059669" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Services Distribution */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-bold">توزيع الخدمات</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={55} strokeWidth={0}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {chartData.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-semibold mr-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Emergencies */}
      {data.recentEmergencies.length > 0 && (
        <Card className="border-0 shadow-sm border-r-4 border-r-red-500">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" /> حالات الطوارئ النشطة
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setScreen('admin-emergencies')}>عرض الكل</Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            {data.recentEmergencies.slice(0, 3).map((em: any) => (
              <div key={em.id} className="flex items-center gap-3 p-2.5 bg-red-50 dark:bg-red-900/10 rounded-xl touch-feedback" onClick={() => { useAppStore.getState().setSelectedEmergencyId(em.id); setScreen('admin-emergencies'); }}>
                <div className={`w-2.5 h-2.5 rounded-full ${severityColors[em.severity]?.split(' ')[0]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{em.patient?.name}</p>
                  <p className="text-xs text-muted-foreground">{em.notes}</p>
                </div>
                <Badge className={`text-[10px] ${severityColors[em.severity]}`}>{severityLabels[em.severity]}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Today Schedule */}
      {data.todaySchedule.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" /> مواعيد اليوم
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setScreen('admin-appointments')}>عرض الكل</Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            {data.todaySchedule.slice(0, 4).map((appt: any) => (
              <div key={appt.id} className="flex items-center gap-3 p-2.5 bg-muted/50 rounded-xl touch-feedback" onClick={() => setScreen('admin-appointments')}>
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{formatTime(appt.date)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{appt.patient?.name}</p>
                  <p className="text-xs text-muted-foreground">{appt.notes}</p>
                </div>
                <Badge className={`text-[10px] ${statusColors[appt.status] || ''}`}>{statusLabels[appt.status]}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ==================== PATIENT LIST ====================
function PatientList({ role }: { role: 'admin' | 'nurse' }) {
  const { setScreen, setSelectedPatientId, searchQuery, setSearchQuery } = useAppStore();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchData('/api/patients').then((data) => { if (!cancelled) { setPatients(data); setLoading(false); } }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = patients.filter((p: any) =>
    p.name.includes(searchQuery) || p.phone?.includes(searchQuery) || p.bloodType?.includes(searchQuery)
  );

  return (
    <div className="px-4 pb-24 pt-2 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">المرضى</h2>
        {role === 'admin' && (
          <Button size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-700" onClick={() => setScreen('admin-add-patient')}>
            <Plus className="w-4 h-4 ml-1" /> إضافة
          </Button>
        )}
      </div>
      <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="بحث عن مريض..." />
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="لا يوجد مرضى" description="لم يتم العثور على نتائج" />
      ) : (
        <div className="space-y-2">
          {filtered.map((p: any) => (
            <Card key={p.id} className="border-0 shadow-sm touch-feedback" onClick={() => { setSelectedPatientId(p.id); setScreen(role === 'admin' ? 'admin-patient-detail' : 'nurse-patient-detail'); }}>
              <CardContent className="p-3.5">
                <div className="flex items-center gap-3">
                  <Avatar className="w-11 h-11">
                    <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      {p.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{p.name}</p>
                      {p.bloodType && <Badge variant="outline" className="text-[9px] h-4 px-1">{p.bloodType}</Badge>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">{p.age} سنة</span>
                      <span className="text-xs text-muted-foreground">{p.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <Badge className={`text-[9px] ${p.chronicDiseases ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                      {p.chronicDiseases ? 'أمراض مزمنة' : 'سليم'}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">{p._count?.visits || 0} زيارة</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== PATIENT DETAIL ====================
function PatientDetail({ role }: { role: 'admin' | 'nurse' }) {
  const { selectedPatientId, setScreen } = useAppStore();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'visits' | 'services' | 'medications'>('info');

  useEffect(() => {
    if (selectedPatientId) {
      fetchData(`/api/patients/${selectedPatientId}`).then(setPatient).catch(console.error).finally(() => setLoading(false));
    }
  }, [selectedPatientId]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;
  if (!patient) return <EmptyState icon={Users} title="لم يتم العثور على المريض" />;

  const tabs = [
    { id: 'info' as const, label: 'المعلومات', icon: User },
    { id: 'visits' as const, label: 'الزيارات', icon: FileText },
    { id: 'services' as const, label: 'الخدمات', icon: Stethoscope },
    { id: 'medications' as const, label: 'الأدوية', icon: Activity },
  ];

  return (
    <div className="pb-24 pt-0">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-600 -mx-4 px-4 pt-2 pb-6 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-white hover:bg-white/20" onClick={() => setScreen(role === 'admin' ? 'admin-patients' : 'nurse-patients')}>
            <ChevronRight className="w-5 h-5" />
          </Button>
          <h2 className="text-white font-bold">ملف المريض</h2>
        </div>
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-white/30">
            <AvatarFallback className="bg-white/20 text-white text-xl font-bold">{patient.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-white">
            <h3 className="text-lg font-bold">{patient.name}</h3>
            <div className="flex items-center gap-3 mt-1 text-emerald-100 text-xs">
              <span>{patient.age} سنة</span>
              <span>{patient.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
              {patient.bloodType && <Badge className="bg-white/20 text-white text-[10px]">{patient.bloodType}</Badge>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 -mt-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === tab.id ? 'bg-white dark:bg-gray-800 shadow-sm text-emerald-600 dark:text-emerald-400' : 'bg-muted/50 text-muted-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-4 mt-4 space-y-3">
        {activeTab === 'info' && (
          <div className="space-y-3">
            {patient.phone && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <div><p className="text-[10px] text-muted-foreground">الهاتف</p><p className="text-sm font-medium" dir="ltr">{patient.phone}</p></div>
                </CardContent>
              </Card>
            )}
            {patient.emergencyPhone && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <div><p className="text-[10px] text-muted-foreground">هاتف الطوارئ</p><p className="text-sm font-medium" dir="ltr">{patient.emergencyPhone}</p></div>
                </CardContent>
              </Card>
            )}
            {patient.address && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <div><p className="text-[10px] text-muted-foreground">العنوان</p><p className="text-sm font-medium">{patient.address}</p></div>
                </CardContent>
              </Card>
            )}
            {patient.chronicDiseases && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <Activity className="w-4 h-4 text-amber-500" />
                  <div><p className="text-[10px] text-muted-foreground">الأمراض المزمنة</p><p className="text-sm font-medium">{patient.chronicDiseases}</p></div>
                </CardContent>
              </Card>
            )}
            {patient.allergies && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <Shield className="w-4 h-4 text-purple-500" />
                  <div><p className="text-[10px] text-muted-foreground">الحساسية</p><p className="text-sm font-medium">{patient.allergies}</p></div>
                </CardContent>
              </Card>
            )}
            {patient.medicalHistory && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <FileText className="w-4 h-4 text-teal-500" />
                  <div><p className="text-[10px] text-muted-foreground">التاريخ الطبي</p><p className="text-sm font-medium">{patient.medicalHistory}</p></div>
                </CardContent>
              </Card>
            )}
            {patient.notes && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <ClipboardList className="w-4 h-4 text-gray-500" />
                  <div><p className="text-[10px] text-muted-foreground">ملاحظات</p><p className="text-sm font-medium">{patient.notes}</p></div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'visits' && (
          patient.visits?.length > 0 ? (
            <div className="space-y-2">
              {patient.visits.map((v: any) => (
                <Card key={v.id} className="border-0 shadow-sm">
                  <CardContent className="p-3.5">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-semibold">{v.reason}</p>
                      <Badge className={`text-[9px] ${statusColors[v.status]}`}>{statusLabels[v.status]}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{v.diagnosis}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{formatDate(v.visitDate)}</p>
                    {v.notes && <p className="text-xs text-muted-foreground mt-1 bg-muted/50 p-2 rounded-lg">{v.notes}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : <EmptyState icon={FileText} title="لا توجد زيارات" />
        )}

        {activeTab === 'services' && (
          patient.services?.length > 0 ? (
            <div className="space-y-2">
              {patient.services.map((ps: any) => (
                <Card key={ps.id} className="border-0 shadow-sm">
                  <CardContent className="p-3.5">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-semibold">{ps.service?.nameAr}</p>
                      <Badge className={`text-[9px] ${statusColors[ps.status]}`}>{statusLabels[ps.status]}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatCurrency(ps.service?.price || 0)}</span>
                      <span>{ps.service?.duration} دقيقة</span>
                    </div>
                    {ps.nurse && <p className="text-[10px] text-muted-foreground mt-1">الممرض: {ps.nurse.name}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : <EmptyState icon={Stethoscope} title="لا توجد خدمات" />
        )}

        {activeTab === 'medications' && (
          patient.medications?.length > 0 ? (
            <div className="space-y-2">
              {patient.medications.map((med: any) => (
                <Card key={med.id} className="border-0 shadow-sm">
                  <CardContent className="p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{med.name}</p>
                      <p className="text-xs text-muted-foreground">{med.dosage} - {med.frequency}</p>
                    </div>
                    {med.notes && <p className="text-[10px] text-muted-foreground max-w-[100px] text-left">{med.notes}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : <EmptyState icon={Activity} title="لا توجد أدوية" />
        )}
      </div>
    </div>
  );
}

// ==================== ADD PATIENT FORM ====================
function AddPatientForm() {
  const { setScreen } = useAppStore();
  const [form, setForm] = useState({ name: '', age: '', gender: 'male', phone: '', emergencyPhone: '', address: '', bloodType: '', chronicDiseases: '', allergies: '', medicalHistory: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.age) { toast.error('يرجى إدخال الاسم والعمر'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, age: parseInt(form.age) }),
      });
      if (res.ok) { toast.success('تم إضافة المريض بنجاح'); setScreen('admin-patients'); }
      else toast.error('خطأ في إضافة المريض');
    } catch { toast.error('خطأ في الاتصال'); }
    finally { setSaving(false); }
  };

  return (
    <div className="px-4 pb-24 pt-2 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setScreen('admin-patients')}>
          <ChevronRight className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold">إضافة مريض جديد</h2>
      </div>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">الاسم الكامل *</Label>
            <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="h-11 rounded-xl" placeholder="أدخل اسم المريض" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">العمر *</Label>
              <Input type="number" value={form.age} onChange={(e) => setForm({...form, age: e.target.value})} className="h-11 rounded-xl" placeholder="العمر" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">الجنس</Label>
              <Select value={form.gender} onValueChange={(v) => setForm({...form, gender: v})}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">ذكر</SelectItem>
                  <SelectItem value="female">أنثى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">رقم الهاتف</Label>
            <Input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="h-11 rounded-xl" placeholder="05XXXXXXXX" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">هاتف الطوارئ</Label>
            <Input value={form.emergencyPhone} onChange={(e) => setForm({...form, emergencyPhone: e.target.value})} className="h-11 rounded-xl" placeholder="05XXXXXXXX" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">العنوان</Label>
            <Input value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="h-11 rounded-xl" placeholder="العنوان" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">فصيلة الدم</Label>
            <Select value={form.bloodType} onValueChange={(v) => setForm({...form, bloodType: v})}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="اختر فصيلة الدم" /></SelectTrigger>
              <SelectContent>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt => (
                  <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">الأمراض المزمنة</Label>
            <Input value={form.chronicDiseases} onChange={(e) => setForm({...form, chronicDiseases: e.target.value})} className="h-11 rounded-xl" placeholder="مفصولة بفاصلة" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">الحساسية</Label>
            <Input value={form.allergies} onChange={(e) => setForm({...form, allergies: e.target.value})} className="h-11 rounded-xl" placeholder="مفصولة بفاصلة" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">التاريخ الطبي</Label>
            <Textarea value={form.medicalHistory} onChange={(e) => setForm({...form, medicalHistory: e.target.value})} className="rounded-xl min-h-[80px]" placeholder="التاريخ الطبي للمريض" />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-semibold">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 ml-1" /> حفظ المريض</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== SERVICE MANAGEMENT ====================
function ServiceManagement() {
  const { searchQuery, setSearchQuery } = useAppStore();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData('/api/services').then(setServices).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = services.filter((s: any) => s.nameAr.includes(searchQuery) || s.category?.includes(searchQuery));
  const categories = [...new Set(filtered.map((s: any) => s.category))];

  return (
    <div className="px-4 pb-24 pt-2 space-y-3">
      <h2 className="text-lg font-bold">الخدمات الطبية</h2>
      <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="بحث عن خدمة..." />
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat}>
              <p className="text-xs font-semibold text-muted-foreground mb-2">{cat}</p>
              <div className="space-y-2">
                {filtered.filter((s: any) => s.category === cat).map((s: any) => (
                  <Card key={s.id} className="border-0 shadow-sm touch-feedback">
                    <CardContent className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <Stethoscope className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{s.nameAr}</p>
                          <p className="text-xs text-muted-foreground">{s.description}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(s.price)}</p>
                          <p className="text-[10px] text-muted-foreground">{s.duration} دقيقة</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`text-[9px] ${s.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'}`}>
                          {s.active ? 'نشط' : 'معطل'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{s._count?.patientServices || 0} تنفيذ</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== EMERGENCY MANAGEMENT ====================
function EmergencyManagement() {
  const { setScreen } = useAppStore();
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData('/api/emergencies').then(setEmergencies).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? emergencies : emergencies.filter((e: any) => e.status === filter);
  const activeCount = emergencies.filter((e: any) => e.status === 'active').length;

  return (
    <div className="px-4 pb-24 pt-2 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">الطوارئ</h2>
        <Button size="sm" className="rounded-xl bg-red-600 hover:bg-red-700" onClick={() => setScreen('admin-add-emergency')}>
          <Plus className="w-4 h-4 ml-1" /> حالة جديدة
        </Button>
      </div>

      {activeCount > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl flex items-center gap-2 border border-red-200 dark:border-red-800">
          <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
          <span className="text-sm font-semibold text-red-700 dark:text-red-400">{activeCount} حالة طوارئ نشطة</span>
        </div>
      )}

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'active', label: 'نشطة' },
          { id: 'treated', label: 'تم العلاج' },
          { id: 'transferred', label: 'محولة' },
          { id: 'archived', label: 'مؤرشفة' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all ${
              filter === f.id ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="لا توجد حالات طوارئ" />
      ) : (
        <div className="space-y-2">
          {filtered.map((em: any) => (
            <Card key={em.id} className={`border-0 shadow-sm touch-feedback ${em.severity === 'critical' ? 'border-r-4 border-r-red-500' : em.severity === 'high' ? 'border-r-4 border-r-orange-500' : ''}`}>
              <CardContent className="p-3.5">
                <div className="flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full mt-1.5 ${severityColors[em.severity]?.split(' ')[0]} ${em.status === 'active' ? 'animate-pulse-slow' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold truncate">{em.patient?.name}</p>
                      <Badge className={`text-[9px] ${severityColors[em.severity]}`}>{severityLabels[em.severity]}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{em.notes}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(em.arrivalTime)}</span>
                      {em.nurse && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {em.nurse.name}</span>}
                    </div>
                    {em.actions && <p className="text-xs bg-muted/50 p-2 rounded-lg mt-2">{em.actions}</p>}
                  </div>
                  <Badge className={`text-[9px] ${statusColors[em.status]}`}>{statusLabels[em.status]}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== ADD EMERGENCY FORM ====================
function AddEmergencyForm() {
  const { setScreen, user } = useAppStore();
  const [patients, setPatients] = useState<any[]>([]);
  const [form, setForm] = useState({ patientId: '', severity: 'moderate', notes: '', actions: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData('/api/patients').then((data: any[]) => setPatients(data.map((p: any) => ({ id: p.id, name: p.name })))).catch(console.error);
  }, []);

  const handleSave = async () => {
    if (!form.patientId) { toast.error('يرجى اختيار المريض'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/emergencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, nurseId: user?.id }),
      });
      if (res.ok) { toast.success('تم تسجيل حالة الطوارئ'); setScreen('admin-emergencies'); }
      else toast.error('خطأ في التسجيل');
    } catch { toast.error('خطأ في الاتصال'); }
    finally { setSaving(false); }
  };

  return (
    <div className="px-4 pb-24 pt-2 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setScreen('admin-emergencies')}>
          <ChevronRight className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold">تسجيل حالة طوارئ</h2>
      </div>
      <Card className="border-0 shadow-sm border-r-4 border-r-red-500">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">المريض *</Label>
            <Select value={form.patientId} onValueChange={(v) => setForm({...form, patientId: v})}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="اختر المريض" /></SelectTrigger>
              <SelectContent>
                {patients.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">مستوى الخطورة</Label>
            <Select value={form.severity} onValueChange={(v) => setForm({...form, severity: v})}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">حرج</SelectItem>
                <SelectItem value="high">عالي</SelectItem>
                <SelectItem value="moderate">متوسط</SelectItem>
                <SelectItem value="low">منخفض</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">ملاحظات</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="rounded-xl min-h-[80px]" placeholder="وصف الحالة..." />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">الإجراءات المتخذة</Label>
            <Textarea value={form.actions} onChange={(e) => setForm({...form, actions: e.target.value})} className="rounded-xl min-h-[80px]" placeholder="الإجراءات..." />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 font-semibold">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><AlertTriangle className="w-4 h-4 ml-1" /> تسجيل الحالة</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== APPOINTMENTS ====================
function AppointmentsScreen() {
  const { setScreen, user } = useAppStore();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData('/api/appointments').then(setAppointments).catch(console.error).finally(() => setLoading(false));
  }, []);

  const today = new Date();
  const todayStr = today.toDateString();
  const todayAppts = appointments.filter((a: any) => new Date(a.date).toDateString() === todayStr);
  const upcomingAppts = appointments.filter((a: any) => new Date(a.date) > today && a.status === 'scheduled');
  const displayAppts = filter === 'all' ? appointments : filter === 'today' ? todayAppts : appointments.filter((a: any) => a.status === filter);

  return (
    <div className="px-4 pb-24 pt-2 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">المواعيد</h2>
        <Button size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-700" onClick={() => setScreen('admin-add-appointment')}>
          <Plus className="w-4 h-4 ml-1" /> موعد جديد
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-emerald-600">{todayAppts.length}</p>
            <p className="text-[10px] text-muted-foreground">اليوم</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-blue-600">{upcomingAppts.length}</p>
            <p className="text-[10px] text-muted-foreground">قادمة</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-amber-600">{appointments.filter((a: any) => a.status === 'scheduled').length}</p>
            <p className="text-[10px] text-muted-foreground">مجدولة</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'today', label: 'اليوم' },
          { id: 'all', label: 'الكل' },
          { id: 'scheduled', label: 'مجدول' },
          { id: 'confirmed', label: 'مؤكد' },
          { id: 'completed', label: 'مكتمل' },
          { id: 'cancelled', label: 'ملغي' },
        ].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all ${filter === f.id ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
      ) : displayAppts.length === 0 ? (
        <EmptyState icon={Calendar} title="لا توجد مواعيد" />
      ) : (
        <div className="space-y-2">
          {displayAppts.map((appt: any) => (
            <Card key={appt.id} className="border-0 shadow-sm touch-feedback">
              <CardContent className="p-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-12 text-center">
                    <p className="text-sm font-bold">{formatTime(appt.date)}</p>
                    <p className="text-[10px] text-muted-foreground">{appt.duration} د</p>
                  </div>
                  <div className="w-px h-10 bg-border" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{appt.patient?.name}</p>
                    <p className="text-xs text-muted-foreground">{appt.notes}</p>
                  </div>
                  <Badge className={`text-[9px] ${statusColors[appt.status]}`}>{statusLabels[appt.status]}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== ADD APPOINTMENT FORM ====================
function AddAppointmentForm() {
  const { setScreen, user } = useAppStore();
  const [patients, setPatients] = useState<any[]>([]);
  const [form, setForm] = useState({ patientId: '', date: '', time: '', type: 'checkup', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData('/api/patients').then((data: any[]) => setPatients(data.map((p: any) => ({ id: p.id, name: p.name })))).catch(console.error);
  }, []);

  const handleSave = async () => {
    if (!form.patientId || !form.date || !form.time) { toast.error('يرجى ملء جميع الحقول المطلوبة'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, date: new Date(`${form.date}T${form.time}`), nurseId: user?.id }),
      });
      if (res.ok) { toast.success('تم حجز الموعد بنجاح'); setScreen('admin-appointments'); }
      else toast.error('خطأ في حجز الموعد');
    } catch { toast.error('خطأ في الاتصال'); }
    finally { setSaving(false); }
  };

  return (
    <div className="px-4 pb-24 pt-2 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setScreen('admin-appointments')}>
          <ChevronRight className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold">حجز موعد جديد</h2>
      </div>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">المريض *</Label>
            <Select value={form.patientId} onValueChange={(v) => setForm({...form, patientId: v})}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="اختر المريض" /></SelectTrigger>
              <SelectContent>{patients.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">التاريخ *</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">الوقت *</Label>
              <Input type="time" value={form.time} onChange={(e) => setForm({...form, time: e.target.value})} className="h-11 rounded-xl" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">نوع الموعد</Label>
            <Select value={form.type} onValueChange={(v) => setForm({...form, type: v})}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="checkup">فحص عام</SelectItem>
                <SelectItem value="follow-up">متابعة</SelectItem>
                <SelectItem value="treatment">علاج</SelectItem>
                <SelectItem value="emergency">طوارئ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">ملاحظات</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="rounded-xl min-h-[60px]" placeholder="ملاحظات إضافية" />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-semibold">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Calendar className="w-4 h-4 ml-1" /> حجز الموعد</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== FINANCE MANAGEMENT ====================
function FinanceManagement() {
  const { setScreen } = useAppStore();
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'payments' | 'invoices'>('payments');

  useEffect(() => {
    Promise.all([fetchData('/api/payments'), fetchData('/api/invoices')])
      .then(([p, i]) => { setPayments(p); setInvoices(i); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = payments.reduce((sum: number, p: any) => sum + (p.type === 'payment' ? p.amount : -p.amount), 0);
  const unpaidTotal = invoices.filter((i: any) => i.status !== 'paid').reduce((sum: number, i: any) => sum + (i.total - i.paid), 0);

  return (
    <div className="px-4 pb-24 pt-2 space-y-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setScreen('admin-more')}>
          <ChevronRight className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold">النظام المالي</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={DollarSign} label="إجمالي الإيرادات" value={formatCurrency(totalRevenue)} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <StatCard icon={Receipt} label="مستحقات معلقة" value={formatCurrency(unpaidTotal)} color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" />
      </div>

      <div className="flex gap-1">
        <button onClick={() => setTab('payments')} className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all ${tab === 'payments' ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}>المدفوعات</button>
        <button onClick={() => setTab('invoices')} className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all ${tab === 'invoices' ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}>الفواتير</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
      ) : tab === 'payments' ? (
        <div className="space-y-2">
          {payments.map((p: any) => (
            <Card key={p.id} className="border-0 shadow-sm">
              <CardContent className="p-3.5 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.type === 'payment' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  <DollarSign className={`w-5 h-5 ${p.type === 'payment' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{p.patient?.name}</p>
                  <p className="text-xs text-muted-foreground">{p.description}</p>
                </div>
                <div className="text-left">
                  <p className={`text-sm font-bold ${p.type === 'payment' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {p.type === 'payment' ? '+' : '-'}{formatCurrency(p.amount)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{formatDate(p.createdAt)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv: any) => (
            <Card key={inv.id} className="border-0 shadow-sm">
              <CardContent className="p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">{inv.patient?.name}</p>
                  <Badge className={`text-[9px] ${statusColors[inv.status]}`}>{statusLabels[inv.status]}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">الإجمالي: {formatCurrency(inv.total)}</span>
                  <span className="text-muted-foreground">المدفوع: {formatCurrency(inv.paid)}</span>
                </div>
                {inv.total > inv.paid && (
                  <Progress value={(inv.paid / inv.total) * 100} className="h-1.5 mt-2" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== NURSE MANAGEMENT ====================
function NurseManagement() {
  const { setScreen } = useAppStore();
  const [nurses, setNurses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: 'nurse123', phone: '' });

  const loadNurses = () => {
    fetchData('/api/users').then((data: any[]) => { setNurses(data.filter((u: any) => u.role === 'nurse')); }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { loadNurses(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.email) { toast.error('يرجى ملء جميع الحقول'); return; }
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'nurse', active: true }),
      });
      if (res.ok) { toast.success('تم إضافة الممرض بنجاح'); setShowAdd(false); setForm({ name: '', email: '', password: 'nurse123', phone: '' }); loadNurses(); }
      else toast.error('خطأ في الإضافة');
    } catch { toast.error('خطأ في الاتصال'); }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !active }) });
      toast.success(!active ? 'تم تفعيل الممرض' : 'تم تعطيل الممرض');
      loadNurses();
    } catch { toast.error('خطأ في التحديث'); }
  };

  return (
    <div className="px-4 pb-24 pt-2 space-y-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setScreen('admin-more')}>
          <ChevronRight className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold">إدارة الممرضين</h2>
      </div>
      <Button className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowAdd(true)}>
        <UserPlus className="w-4 h-4 ml-1" /> إضافة ممرض جديد
      </Button>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent dir="rtl" className="rounded-2xl max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>إضافة ممرض جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs">الاسم *</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="h-11 rounded-xl" placeholder="اسم الممرض" /></div>
            <div className="space-y-1.5"><Label className="text-xs">البريد *</Label><Input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="h-11 rounded-xl" placeholder="email@clinic.com" dir="ltr" /></div>
            <div className="space-y-1.5"><Label className="text-xs">كلمة المرور</Label><Input value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="h-11 rounded-xl" /></div>
            <div className="space-y-1.5"><Label className="text-xs">الهاتف</Label><Input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="h-11 rounded-xl" dir="ltr" /></div>
            <Button onClick={handleAdd} className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700"><Save className="w-4 h-4 ml-1" /> حفظ</Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
      ) : (
        <div className="space-y-2">
          {nurses.map((n: any) => (
            <Card key={n.id} className="border-0 shadow-sm">
              <CardContent className="p-3.5 flex items-center gap-3">
                <Avatar className="w-11 h-11">
                  <AvatarFallback className="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 font-bold">{n.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{n.name}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">{n.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={n.active} onCheckedChange={() => handleToggle(n.id, n.active)} />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={async () => {
                    if (confirm('هل أنت متأكد من حذف الممرض؟')) {
                      await fetch(`/api/users/${n.id}`, { method: 'DELETE' });
                      toast.success('تم حذف الممرض');
                      loadNurses();
                    }
                  }}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== NOTIFICATIONS SCREEN ====================
function NotificationsScreen() {
  const { user, setScreen } = useAppStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData(`/api/notifications?userId=${user.id}`).then(setNotifications).catch(console.error).finally(() => setLoading(false));
    }
  }, [user]);

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ read: true }) });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => fetch(`/api/notifications/${n.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ read: true }) })));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('تم قراءة جميع الإشعارات');
  };

  const typeIcons: Record<string, any> = { emergency: AlertTriangle, appointment: Calendar, service: Stethoscope, system: Info };
  const typeColors: Record<string, string> = { emergency: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', appointment: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', service: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', system: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400' };

  return (
    <div className="px-4 pb-24 pt-2 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setScreen(user?.role === 'admin' ? 'admin-more' : 'nurse-profile')}>
            <ChevronRight className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-bold">الإشعارات</h2>
        </div>
        <Button variant="ghost" size="sm" className="text-xs" onClick={markAllRead}>قراءة الكل</Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="لا توجد إشعارات" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => {
            const Icon = typeIcons[n.type] || Info;
            return (
              <Card key={n.id} className={`border-0 shadow-sm touch-feedback ${!n.read ? 'border-r-4 border-r-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`} onClick={() => !n.read && markAsRead(n.id)}>
                <CardContent className="p-3.5 flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${typeColors[n.type]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? 'font-bold' : 'font-medium'}`}>{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{formatDate(n.createdAt)}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==================== SETTINGS SCREEN ====================
function SettingsScreen() {
  const { user, theme, toggleTheme, logout, setScreen } = useAppStore();

  return (
    <div className="px-4 pb-24 pt-2 space-y-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setScreen(user?.role === 'admin' ? 'admin-more' : 'nurse-profile')}>
          <ChevronRight className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold">الإعدادات</h2>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xl font-bold">
              {user?.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold text-base">{user?.name}</h3>
            <p className="text-sm text-muted-foreground" dir="ltr">{user?.email}</p>
            <Badge className="mt-1 text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              {user?.role === 'admin' ? 'مدير' : 'ممرض'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {theme === 'light' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-blue-500" />}
              <span className="text-sm font-medium">الوضع {theme === 'light' ? 'الفاتح' : 'الليلي'}</span>
            </div>
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          </div>
          <Separator />
          <button className="flex items-center gap-3 p-4 w-full touch-feedback" onClick={() => setScreen(user?.role === 'admin' ? 'admin-notifications' : 'nurse-notifications')}>
            <Bell className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium">الإشعارات</span>
            <ChevronLeft className="w-4 h-4 mr-auto text-muted-foreground" />
          </button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="p-4">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">معلومات التطبيق</h4>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p>عيادة الإسعافات الأولية - الإصدار 1.0</p>
              <p>نظام إدارة احترافي لعيادات الإسعافات</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button variant="destructive" className="w-full h-12 rounded-xl font-semibold" onClick={logout}>
        <LogOut className="w-4 h-4 ml-1" /> تسجيل الخروج
      </Button>
    </div>
  );
}

// ==================== MORE MENU (ADMIN) ====================
function AdminMoreMenu() {
  const { setScreen, logout } = useAppStore();
  const menuItems = [
    { id: 'admin-nurses', label: 'إدارة الممرضين', icon: Briefcase, color: 'text-teal-600 bg-teal-100 dark:bg-teal-900/30 dark:text-teal-400' },
    { id: 'admin-appointments', label: 'المواعيد', icon: Calendar, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
    { id: 'admin-finance', label: 'النظام المالي', icon: DollarSign, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { id: 'admin-notifications', label: 'الإشعارات', icon: Bell, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' },
    { id: 'admin-settings', label: 'الإعدادات', icon: Settings, color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400' },
  ];

  return (
    <div className="px-4 pb-24 pt-2 space-y-3">
      <h2 className="text-lg font-bold">المزيد</h2>
      <div className="space-y-2">
        {menuItems.map((item) => (
          <Card key={item.id} className="border-0 shadow-sm touch-feedback" onClick={() => setScreen(item.id as ScreenType)}>
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold">{item.label}</span>
              <ChevronLeft className="w-4 h-4 mr-auto text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Button variant="destructive" className="w-full h-12 rounded-xl font-semibold mt-6" onClick={logout}>
        <LogOut className="w-4 h-4 ml-1" /> تسجيل الخروج
      </Button>
    </div>
  );
}

// ==================== NURSE DASHBOARD ====================
function NurseDashboard() {
  const { setScreen, user } = useAppStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData('/api/dashboard').then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;
  if (!data) return <EmptyState icon={AlertCircle} title="خطأ في تحميل البيانات" />;

  return (
    <div className="px-4 pb-24 pt-2 space-y-4">
      <div>
        <h2 className="text-lg font-bold">مرحباً {user?.name} 👋</h2>
        <p className="text-sm text-muted-foreground">لوحة التحكم</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users} label="إجمالي المرضى" value={data.totalPatients} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <StatCard icon={AlertTriangle} label="طوارئ نشطة" value={data.activeEmergencies} color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" />
        <StatCard icon={Calendar} label="مواعيد اليوم" value={data.todayAppointments} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
        <StatCard icon={Stethoscope} label="خدمات اليوم" value={data.totalServices} color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
      </div>

      {/* Today's Schedule */}
      {data.todaySchedule.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" /> مواعيد اليوم
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            {data.todaySchedule.slice(0, 4).map((appt: any) => (
              <div key={appt.id} className="flex items-center gap-3 p-2.5 bg-muted/50 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{formatTime(appt.date)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{appt.patient?.name}</p>
                  <p className="text-xs text-muted-foreground">{appt.notes}</p>
                </div>
                <Badge className={`text-[9px] ${statusColors[appt.status]}`}>{statusLabels[appt.status]}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-bold">إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'مريض جديد', icon: UserPlus, screen: 'nurse-patients' as ScreenType, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
              { label: 'حالة طوارئ', icon: AlertTriangle, screen: 'nurse-cases' as ScreenType, color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
              { label: 'تقرير يومي', icon: FileText, screen: 'nurse-daily-report' as ScreenType, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
            ].map((item) => (
              <button key={item.screen} onClick={() => setScreen(item.screen)} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl touch-feedback ${item.color}`}>
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== NURSE CASES ====================
function NurseCases() {
  const { setScreen } = useAppStore();
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData('/api/emergencies').then(setEmergencies).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-4 pb-24 pt-2 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">الحالات</h2>
        <Button size="sm" className="rounded-xl bg-red-600 hover:bg-red-700" onClick={() => setScreen('nurse-add-case')}>
          <Plus className="w-4 h-4 ml-1" /> حالة جديدة
        </Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
      ) : emergencies.length === 0 ? (
        <EmptyState icon={ClipboardList} title="لا توجد حالات" />
      ) : (
        <div className="space-y-2">
          {emergencies.map((em: any) => (
            <Card key={em.id} className={`border-0 shadow-sm ${em.status === 'active' ? 'border-r-4 border-r-red-500' : ''}`}>
              <CardContent className="p-3.5">
                <div className="flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full mt-1.5 ${severityColors[em.severity]?.split(' ')[0]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold">{em.patient?.name}</p>
                      <Badge className={`text-[9px] ${severityColors[em.severity]}`}>{severityLabels[em.severity]}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{em.notes}</p>
                  </div>
                  <Badge className={`text-[9px] ${statusColors[em.status]}`}>{statusLabels[em.status]}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== NURSE PROFILE ====================
function NurseProfile() {
  const { user, setScreen, logout, theme, toggleTheme } = useAppStore();

  const menuItems = [
    { id: 'nurse-notifications', label: 'الإشعارات', icon: Bell, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' },
    { id: 'nurse-daily-report', label: 'التقارير اليومية', icon: FileText, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
    { id: 'nurse-settings', label: 'الإعدادات', icon: Settings, color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400' },
  ];

  return (
    <div className="px-4 pb-24 pt-2 space-y-4">
      <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-600 to-teal-600">
        <CardContent className="p-6 flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-white/30">
            <AvatarFallback className="bg-white/20 text-white text-xl font-bold">{user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-white">
            <h3 className="text-lg font-bold">{user?.name}</h3>
            <p className="text-emerald-100 text-sm" dir="ltr">{user?.email}</p>
            <Badge className="mt-1 bg-white/20 text-white text-[10px]">ممرض</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {menuItems.map((item) => (
          <Card key={item.id} className="border-0 shadow-sm touch-feedback" onClick={() => setScreen(item.id as ScreenType)}>
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}><item.icon className="w-5 h-5" /></div>
              <span className="text-sm font-semibold">{item.label}</span>
              <ChevronLeft className="w-4 h-4 mr-auto text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="destructive" className="w-full h-12 rounded-xl font-semibold" onClick={logout}>
        <LogOut className="w-4 h-4 ml-1" /> تسجيل الخروج
      </Button>
    </div>
  );
}

// ==================== NURSE DAILY REPORT ====================
function NurseDailyReport() {
  const { user, setScreen } = useAppStore();
  const [form, setForm] = useState({ patientsCount: 0, servicesCount: 0, emergenciesCount: 0, notes: '' });

  return (
    <div className="px-4 pb-24 pt-2 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setScreen('nurse-profile')}>
          <ChevronRight className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold">التقرير اليومي</h2>
      </div>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">عدد المرضى</Label>
              <Input type="number" value={form.patientsCount} onChange={(e) => setForm({...form, patientsCount: parseInt(e.target.value) || 0})} className="h-11 rounded-xl text-center" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">الخدمات</Label>
              <Input type="number" value={form.servicesCount} onChange={(e) => setForm({...form, servicesCount: parseInt(e.target.value) || 0})} className="h-11 rounded-xl text-center" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">الطوارئ</Label>
              <Input type="number" value={form.emergenciesCount} onChange={(e) => setForm({...form, emergenciesCount: parseInt(e.target.value) || 0})} className="h-11 rounded-xl text-center" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">ملاحظات</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="rounded-xl min-h-[100px]" placeholder="ملاحظات اليوم..." />
          </div>
          <Button className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700" onClick={() => toast.success('تم حفظ التقرير اليومي')}>
            <Save className="w-4 h-4 ml-1" /> حفظ التقرير
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== MAIN APP ====================
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
      <main className={needsShell ? '' : ''}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.15 }}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>
      {needsShell && <BottomNav />}
    </div>
  );
}
