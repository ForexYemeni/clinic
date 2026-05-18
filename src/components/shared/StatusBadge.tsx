'use client';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusMap: Record<string, { label: string; class: string }> = {
  // Emergency statuses
  active: { label: 'نشط', class: 'badge-active' },
  treated: { label: 'تم العلاج', class: 'badge-completed' },
  transferred: { label: 'تم التحويل', class: 'badge-high' },
  archived: { label: 'مؤرشف', class: 'badge-cancelled' },
  // Appointment statuses
  scheduled: { label: 'مجدول', class: 'badge-pending' },
  confirmed: { label: 'مؤكد', class: 'badge-active' },
  completed: { label: 'مكتمل', class: 'badge-completed' },
  cancelled: { label: 'ملغي', class: 'badge-cancelled' },
  // Service statuses
  pending: { label: 'قيد الانتظار', class: 'badge-pending' },
  'in-progress': { label: 'قيد التنفيذ', class: 'badge-active' },
  // Visit statuses
  'follow-up': { label: 'متابعة', class: 'badge-pending' },
  // Invoice statuses
  unpaid: { label: 'غير مدفوعة', class: 'badge-critical' },
  partial: { label: 'مدفوعة جزئياً', class: 'badge-moderate' },
  paid: { label: 'مدفوعة', class: 'badge-completed' },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusMap[status] || { label: status, class: 'badge-cancelled' };
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.class} ${sizeClasses}`}>
      {config.label}
    </span>
  );
}
