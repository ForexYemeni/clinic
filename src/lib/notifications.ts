// ═══════════════════════════════════════════════════════════
// 🔔 Notification Helper
// Create notifications for various events
// ═══════════════════════════════════════════════════════════

import { adminDb } from '@/lib/firebase-admin';

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
    const notifData = {
      userId: params.userId,
      clinicId: params.clinicId || '',
      type: params.type || 'system',
      title: params.title,
      message: params.message,
      read: false,
      priority: params.priority || 'normal',
      actionUrl: params.actionUrl || '',
      relatedId: params.relatedId || '',
      createdAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('notifications').add(notifData);
    return docRef.id;
  } catch (error) {
    console.error('Create notification error:', error);
    return '';
  }
}

// Create notification for all users in a clinic (except the trigger user)
export async function notifyClinicUsers(params: {
  clinicId: string;
  excludeUserId?: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  relatedId?: string;
}): Promise<void> {
  try {
    const usersSnapshot = await adminDb
      .collection('users')
      .where('clinicId', '==', params.clinicId)
      .where('active', '==', true)
      .get();

    const batch = adminDb.batch();
    const notifData = {
      clinicId: params.clinicId,
      type: params.type,
      title: params.title,
      message: params.message,
      read: false,
      priority: params.priority || 'normal',
      actionUrl: '',
      relatedId: params.relatedId || '',
      createdAt: new Date().toISOString(),
    };

    usersSnapshot.docs.forEach((doc) => {
      if (params.excludeUserId && doc.id === params.excludeUserId) return;
      const notifRef = adminDb.collection('notifications').doc();
      batch.set(notifRef, { ...notifData, userId: doc.id });
    });

    await batch.commit();
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
    const adminsSnapshot = await adminDb
      .collection('users')
      .where('role', '==', 'super_admin')
      .where('active', '==', true)
      .get();

    const batch = adminDb.batch();
    const notifData = {
      clinicId: 'platform',
      type: params.type,
      title: params.title,
      message: params.message,
      read: false,
      priority: params.priority || 'normal',
      actionUrl: '',
      relatedId: params.relatedId || '',
      createdAt: new Date().toISOString(),
    };

    adminsSnapshot.docs.forEach((doc) => {
      const notifRef = adminDb.collection('notifications').doc();
      batch.set(notifRef, { ...notifData, userId: doc.id });
    });

    await batch.commit();
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

    // Find clinics expiring within 3 days
    const clinicsSnapshot = await adminDb
      .collection('clinics')
      .where('subscription.endDate', '>=', now.toISOString())
      .get();

    for (const clinicDoc of clinicsSnapshot.docs) {
      const clinic = clinicDoc.data();
      const endDate = clinic.subscription?.endDate;

      if (!endDate) continue;

      const endDateObj = new Date(endDate);
      const clinicId = clinicDoc.id;
      const clinicName = clinic.name || 'عيادة';

      // 3 days warning
      if (endDateObj <= threeDaysFromNow && endDateObj > oneDayFromNow) {
        // Check if we already sent a 3-day warning today
        const existingWarning = await adminDb
          .collection('notifications')
          .where('relatedId', '==', clinicId)
          .where('type', '==', 'subscription')
          .where('message', '==', `اشتراك ${clinicName} ينتهي خلال 3 أيام`)
          .limit(1)
          .get();

        if (existingWarning.empty) {
          // Notify clinic admins
          const adminsSnapshot = await adminDb
            .collection('users')
            .where('clinicId', '==', clinicId)
            .where('role', '==', 'admin')
            .get();

          const batch = adminDb.batch();
          for (const adminDoc of adminsSnapshot.docs) {
            const notifRef = adminDb.collection('notifications').doc();
            batch.set(notifRef, {
              userId: adminDoc.id,
              clinicId,
              type: 'subscription',
              title: 'تنبيه انتهاء الاشتراك',
              message: `اشتراك ${clinicName} ينتهي خلال 3 أيام`,
              read: false,
              priority: 'high',
              relatedId: clinicId,
              createdAt: new Date().toISOString(),
            });
          }

          // Also notify super admins
          const superAdminsSnapshot = await adminDb
            .collection('users')
            .where('role', '==', 'super_admin')
            .get();

          for (const saDoc of superAdminsSnapshot.docs) {
            const notifRef = adminDb.collection('notifications').doc();
            batch.set(notifRef, {
              userId: saDoc.id,
              clinicId: 'platform',
              type: 'subscription',
              title: 'اشتراك ينتهي قريباً',
              message: `اشتراك ${clinicName} ينتهي خلال 3 أيام`,
              read: false,
              priority: 'high',
              relatedId: clinicId,
              createdAt: new Date().toISOString(),
            });
          }

          await batch.commit();
        }
      }

      // 1 day warning (urgent)
      if (endDateObj <= oneDayFromNow && endDateObj > now) {
        const existingWarning = await adminDb
          .collection('notifications')
          .where('relatedId', '==', clinicId)
          .where('type', '==', 'subscription')
          .where('message', '==', `اشتراك ${clinicName} ينتهي غداً!`)
          .limit(1)
          .get();

        if (existingWarning.empty) {
          const adminsSnapshot = await adminDb
            .collection('users')
            .where('clinicId', '==', clinicId)
            .where('role', '==', 'admin')
            .get();

          const batch = adminDb.batch();
          for (const adminDoc of adminsSnapshot.docs) {
            const notifRef = adminDb.collection('notifications').doc();
            batch.set(notifRef, {
              userId: adminDoc.id,
              clinicId,
              type: 'subscription',
              title: '⚠️ اشتراك ينتهي غداً!',
              message: `اشتراك ${clinicName} ينتهي غداً! تواصل مع الإدارة للتجديد`,
              read: false,
              priority: 'urgent',
              relatedId: clinicId,
              createdAt: new Date().toISOString(),
            });
          }

          const superAdminsSnapshot = await adminDb
            .collection('users')
            .where('role', '==', 'super_admin')
            .get();

          for (const saDoc of superAdminsSnapshot.docs) {
            const notifRef = adminDb.collection('notifications').doc();
            batch.set(notifRef, {
              userId: saDoc.id,
              clinicId: 'platform',
              type: 'subscription',
              title: '⚠️ اشتراك ينتهي غداً!',
              message: `اشتراك ${clinicName} ينتهي غداً!`,
              read: false,
              priority: 'urgent',
              relatedId: clinicId,
              createdAt: new Date().toISOString(),
            });
          }

          await batch.commit();
        }
      }
    }
  } catch (error) {
    console.error('Subscription expiry check error:', error);
  }
}
