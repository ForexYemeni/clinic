'use client';

import React, { useState, useCallback } from 'react';
import { Briefcase, UserPlus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';
import { useData } from '@/hooks/useData';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { NurseItem } from '@/lib/constants';
import { toast } from 'sonner';

const NurseManagement = React.memo(function NurseManagement() {
  const { setScreen } = useAppStore();
  const { data: users, loading, refresh } = useData<NurseItem[]>('/api/users');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: 'nurse123', phone: '' });

  const nurses = React.useMemo(() => (users || []).filter((u) => u.role === 'nurse'), [users]);

  const handleAdd = async () => {
    if (!form.name || !form.email) { toast.error('يرجى ملء جميع الحقول'); return; }
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'nurse', active: true }),
      });
      if (res.ok) { toast.success('تم إضافة الممرض بنجاح'); setShowAdd(false); setForm({ name: '', email: '', password: 'nurse123', phone: '' }); refresh(); }
      else toast.error('خطأ في الإضافة');
    } catch { toast.error('خطأ في الاتصال'); }
  };

  const handleToggle = useCallback(async (id: string, active: boolean) => {
    try {
      await fetch(`/api/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !active }) });
      toast.success(!active ? 'تم تفعيل الممرض' : 'تم تعطيل الممرض');
      refresh();
    } catch { toast.error('خطأ في التحديث'); }
  }, [refresh]);

  if (loading && !users) return <SkeletonLoader type="card-list" />;

  return (
    <div className="px-4 pb-24 pt-2 space-y-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setScreen('admin-more')}>
          <Briefcase className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold">إدارة الممرضين</h2>
      </div>
      <Button className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 shadow-sm" onClick={() => setShowAdd(true)}>
        <UserPlus className="w-4 h-4 ml-1" /> إضافة ممرض جديد
      </Button>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent dir="rtl" className="rounded-2xl max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>إضافة ممرض جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs font-semibold">الاسم *</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="h-11 rounded-xl" placeholder="اسم الممرض" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-semibold">البريد *</Label><Input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="h-11 rounded-xl" placeholder="email@clinic.com" dir="ltr" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-semibold">كلمة المرور</Label><Input value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="h-11 rounded-xl" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-semibold">الهاتف</Label><Input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="h-11 rounded-xl" dir="ltr" /></div>
            <Button onClick={handleAdd} className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 shadow-sm">حفظ</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        {nurses.map((n) => (
          <Card key={n.id} className="border-0 shadow-sm">
            <CardContent className="p-3.5 flex items-center gap-3">
              <Avatar className="w-11 h-11 ring-2 ring-teal-100 dark:ring-teal-900/30">
                <AvatarFallback className="bg-gradient-to-br from-teal-100 to-teal-50 dark:from-teal-900/30 dark:to-teal-800/20 text-teal-600 dark:text-teal-400 font-bold">{n.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{n.name}</p>
                <p className="text-xs text-muted-foreground" dir="ltr">{n.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={n.active} onCheckedChange={() => handleToggle(n.id, n.active)} />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={async () => {
                  if (confirm('هل أنت متأكد من حذف الممرض؟')) {
                    await fetch(`/api/users/${n.id}`, { method: 'DELETE' });
                    toast.success('تم حذف الممرض');
                    refresh();
                  }
                }}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
});

export { NurseManagement };
