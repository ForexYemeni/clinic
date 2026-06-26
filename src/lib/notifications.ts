// ═══════════════════════════════════════════════════════════
// 🔔 Notification Helper (Prisma + PostgreSQL)
// ═══════════════════════════════════════════════════════════

import prisma from './db';

export type NotificationType = 'patient' | 'visit' | 'emergency' | 'subscription' | 'payment' | 'system' | 'nurse' | 'data_reset';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

interface CreateNotificationParams {
  userId: string;
  clinicId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  actionUrl?: string;
  relatedId?: string;
}

// Create a single notification
export async function createNotification(params: CreateNotificationParams): Promise<string> {
  try {
    const doc = await prisma.notification.create({
      data: {
        userId: params.userId,
        clinicId: params.clinicId || '',
        type: params.type || 'system',
        title: params.title,
        message: params.message,
        read: false,
        priority: params.priority || 'normal',
        actionUrl: params.actionUrl || '',
        relatedId: params.relatedId || '',
      },
    });
    return doc.id;
  } catch (error) {
    console.error('Create notification error:', error);
    return '';
  }
}

// Notify all active users of a clinic
export async function notifyClinicUsers(params: {
  clinicId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  relatedId?: string;
  excludeUserId?: string;
}): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      where: {
        clinicId: params.clinicId,
        active: true,
        ...(params.excludeUserId ? { NOT: { id: params.excludeUserId } } : {}),
      },
      select: { id: true },
    });

    if (users.length === 0) return;

    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        clinicId: params.clinicId,
        type: params.type,
        title: params.title,
        message: params.message,
        read: false,
        priority: params.priority || 'normal',
        actionUrl: '',
        relatedId: params.relatedId || '',
      })),
    });
  } catch (error) {
    console.error('Notify clinic users error:', error);
  }
}

// Notify super admins about important events
export async function notifySuperAdmins(params: {
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  relatedId?: string;
}): Promise<void> {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'super_admin', active: true },
      select: { id: true },
    });

    if (admins.length === 0) return;

    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        clinicId: 'platform',
        type: params.type,
        title: params.title,
        message: params.message,
        read: false,
        priority: params.priority || 'normal',
        actionUrl: '',
        relatedId: params.relatedId || '',
      })),
    });
  } catch (error) {
    console.error('Notify super admins error:', error);
  }
}

// Check subscription expiry and create warnings
export async function checkSubscriptionExpiry(): Promise<void> {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    const clinics = await prisma.clinic.findMany({
      where: { subEndDate: { not: null } },
    });

    for (const clinic of clinics) {
      if (!clinic.subEndDate) continue;

      const endDateObj = clinic.subEndDate;
      const clinicId = clinic.id;
      const clinicName = clinic.name || 'عيادة';

      // 3 days warning
      if (endDateObj <= threeDaysFromNow && endDateObj > oneDayFromNow) {
        const existingWarning = await prisma.notification.findFirst({
          where: {
            relatedId: clinicId,
            type: 'subscription',
            message: `اشتراك ${clinicName} ينتهي خلال 3 أيام`,
          },
          select: { id: true },
        });

        if (!existingWarning) {
          const admins = await prisma.user.findMany({
            where: { clinicId, role: 'admin' },
            select: { id: true },
          });
          const superAdmins = await prisma.user.findMany({
            where: { role: 'super_admin' },
            select: { id: true },
          });

          const recipients = [
            ...admins.map((a) => ({ userId: a.id, clinicId })),
            ...superAdmins.map((a) => ({ userId: a.id, clinicId: 'platform' })),
          ];

          if (recipients.length > 0) {
            await prisma.notification.createMany({
              data: recipients.map((r) => ({
                userId: r.userId,
                clinicId: r.clinicId,
                type: 'subscription',
                title: 'تنبيه انتهاء الاشتراك',
                message: `اشتراك ${clinicName} ينتهي خلال 3 أيام`,
                read: false,
                priority: 'high',
                relatedId: clinicId,
              })),
            });
          }
        }
      }

      // 1 day warning (urgent)
      if (endDateObj <= oneDayFromNow && endDateObj > now) {
        const existingWarning = await prisma.notification.findFirst({
          where: {
            relatedId: clinicId,
            type: 'subscription',
            message: `اشتراك ${clinicName} ينتهي غداً!`,
          },
          select: { id: true },
        });

        if (!existingWarning) {
          const admins = await prisma.user.findMany({
            where: { clinicId, role: 'admin' },
            select: { id: true },
          });
          const superAdmins = await prisma.user.findMany({
            where: { role: 'super_admin' },
            select: { id: true },
          });

          const recipients = [
            ...admins.map((a) => ({ userId: a.id, clinicId })),
            ...superAdmins.map((a) => ({ userId: a.id, clinicId: 'platform' })),
          ];

          if (recipients.length > 0) {
            await prisma.notification.createMany({
              data: recipients.map((r) => ({
                userId: r.userId,
                clinicId: r.clinicId,
                type: 'subscription',
                title: '⚠️ اشتراك ينتهي غداً!',
                message: `اشتراك ${clinicName} ينتهي غداً! تواصل مع الإدارة للتجديد`,
                read: false,
                priority: 'urgent',
                relatedId: clinicId,
              })),
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Subscription expiry check error:', error);
  }
}
