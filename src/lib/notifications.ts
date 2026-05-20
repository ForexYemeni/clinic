// ═══════════════════════════════════════════════════════════
// 🔔 Notification Helper
// Create notifications for various events
// ═══════════════════════════════════════════════════════════

import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import User from '@/models/User';
import Clinic from '@/models/Clinic';

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
    await dbConnect();

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
      createdAt: new Date(),
    };

    const doc = await Notification.create(notifData);
    return doc._id.toString();
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
    await dbConnect();

    const users = await User.find({
      clinicId: params.clinicId,
      active: true,
    }).lean();

    const notifDocs = users
      .filter((doc) => {
        if (params.excludeUserId && doc._id.toString() === params.excludeUserId) return false;
        return true;
      })
      .map((doc) => ({
        userId: doc._id.toString(),
        clinicId: params.clinicId,
        type: params.type,
        title: params.title,
        message: params.message,
        read: false,
        priority: params.priority || 'normal',
        actionUrl: '',
        relatedId: params.relatedId || '',
        createdAt: new Date(),
      }));

    if (notifDocs.length > 0) {
      await Notification.insertMany(notifDocs);
    }
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
    await dbConnect();

    const admins = await User.find({
      role: 'super_admin',
      active: true,
    }).lean();

    const notifDocs = admins.map((doc) => ({
      userId: doc._id.toString(),
      clinicId: 'platform',
      type: params.type,
      title: params.title,
      message: params.message,
      read: false,
      priority: params.priority || 'normal',
      actionUrl: '',
      relatedId: params.relatedId || '',
      createdAt: new Date(),
    }));

    if (notifDocs.length > 0) {
      await Notification.insertMany(notifDocs);
    }
  } catch (error) {
    console.error('Notify super admins error:', error);
  }
}

// Check subscription expiry and create warnings
export async function checkSubscriptionExpiry(): Promise<void> {
  try {
    await dbConnect();

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    // Find all clinics (since subscription may be embedded)
    const clinics = await Clinic.find().lean();

    for (const clinicDoc of clinics) {
      const clinic = clinicDoc as any;
      const endDate = clinic.subscription?.endDate;

      if (!endDate) continue;

      const endDateObj = new Date(endDate);
      const clinicId = clinicDoc._id.toString();
      const clinicName = clinic.name || 'عيادة';

      // 3 days warning
      if (endDateObj <= threeDaysFromNow && endDateObj > oneDayFromNow) {
        // Check if we already sent a 3-day warning today
        const existingWarning = await Notification.findOne({
          relatedId: clinicId,
          type: 'subscription',
          message: `اشتراك ${clinicName} ينتهي خلال 3 أيام`,
        }).lean();

        if (!existingWarning) {
          // Notify clinic admins
          const admins = await User.find({
            clinicId,
            role: 'admin',
          }).lean();

          const notifDocs = admins.map((adminDoc) => ({
            userId: adminDoc._id.toString(),
            clinicId,
            type: 'subscription',
            title: 'تنبيه انتهاء الاشتراك',
            message: `اشتراك ${clinicName} ينتهي خلال 3 أيام`,
            read: false,
            priority: 'high',
            relatedId: clinicId,
            createdAt: new Date(),
          }));

          // Also notify super admins
          const superAdmins = await User.find({
            role: 'super_admin',
          }).lean();

          for (const saDoc of superAdmins) {
            notifDocs.push({
              userId: saDoc._id.toString(),
              clinicId: 'platform',
              type: 'subscription',
              title: 'اشتراك ينتهي قريباً',
              message: `اشتراك ${clinicName} ينتهي خلال 3 أيام`,
              read: false,
              priority: 'high',
              relatedId: clinicId,
              createdAt: new Date(),
            });
          }

          if (notifDocs.length > 0) {
            await Notification.insertMany(notifDocs);
          }
        }
      }

      // 1 day warning (urgent)
      if (endDateObj <= oneDayFromNow && endDateObj > now) {
        const existingWarning = await Notification.findOne({
          relatedId: clinicId,
          type: 'subscription',
          message: `اشتراك ${clinicName} ينتهي غداً!`,
        }).lean();

        if (!existingWarning) {
          const admins = await User.find({
            clinicId,
            role: 'admin',
          }).lean();

          const notifDocs = admins.map((adminDoc) => ({
            userId: adminDoc._id.toString(),
            clinicId,
            type: 'subscription',
            title: '⚠️ اشتراك ينتهي غداً!',
            message: `اشتراك ${clinicName} ينتهي غداً! تواصل مع الإدارة للتجديد`,
            read: false,
            priority: 'urgent',
            relatedId: clinicId,
            createdAt: new Date(),
          }));

          const superAdmins = await User.find({
            role: 'super_admin',
          }).lean();

          for (const saDoc of superAdmins) {
            notifDocs.push({
              userId: saDoc._id.toString(),
              clinicId: 'platform',
              type: 'subscription',
              title: '⚠️ اشتراك ينتهي غداً!',
              message: `اشتراك ${clinicName} ينتهي غداً!`,
              read: false,
              priority: 'urgent',
              relatedId: clinicId,
              createdAt: new Date(),
            });
          }

          if (notifDocs.length > 0) {
            await Notification.insertMany(notifDocs);
          }
        }
      }
    }
  } catch (error) {
    console.error('Subscription expiry check error:', error);
  }
}
