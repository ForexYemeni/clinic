// ═══════════════════════════════════════════════════════════
// 🏢 Multi-Tenant System
// Clinic context, subscription management, data isolation
// Converted from Firebase Firestore to MongoDB/Mongoose
// ═══════════════════════════════════════════════════════════

import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import AuditLog from '@/models/AuditLog';
import PlatformConfig from '@/models/PlatformConfig';
import { toClient } from '@/lib/mongoose-helpers';

// ═══ Subscription Types ═══
export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'suspended';
export type SubscriptionType = 'trial' | 'monthly' | 'yearly' | 'lifetime';

export interface ClinicSubscription {
  status: SubscriptionStatus;
  type: SubscriptionType;
  startDate: string;
  endDate: string;
  trialDays?: number;
}

export interface ClinicDocument {
  id?: string;
  name: string;
  description: string;
  phone: string;
  address: string;
  logo: string;
  primaryColor: string;
  subscription: ClinicSubscription;
  ownerPhone: string;
  active: boolean;
  setupComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

// ═══ Trial Period Options ═══
export const TRIAL_OPTIONS = [
  { label: '7 أيام', value: 7 },
  { label: '14 يوم', value: 14 },
  { label: '30 يوم', value: 30 },
  { label: '60 يوم', value: 60 },
  { label: '90 يوم', value: 90 },
] as const;

export const SUBSCRIPTION_TYPE_LABELS: Record<SubscriptionType, string> = {
  trial: 'تجريبي',
  monthly: 'شهري',
  yearly: 'سنوي',
  lifetime: 'مدى الحياة',
};

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: 'نشط',
  trial: 'تجريبي',
  expired: 'منتهي',
  suspended: 'موقوف',
};

export const SUBSCRIPTION_STATUS_COLORS: Record<SubscriptionStatus, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  trial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  suspended: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

// ═══ Subscription Check ═══
export async function checkClinicSubscription(clinicId: string): Promise<{
  valid: boolean;
  status: SubscriptionStatus;
  endDate: string;
  daysRemaining: number;
}> {
  try {
    await dbConnect();
    const clinicDoc = await Clinic.findById(clinicId).lean();
    if (!clinicDoc) {
      return { valid: false, status: 'expired', endDate: '', daysRemaining: 0 };
    }

    const subscription = clinicDoc.subscription as unknown as ClinicSubscription;

    if (!subscription) {
      return { valid: false, status: 'expired', endDate: '', daysRemaining: 0 };
    }

    // Suspended is always invalid
    if (subscription.status === 'suspended') {
      return { valid: false, status: 'suspended', endDate: subscription.endDate, daysRemaining: 0 };
    }

    // Check if subscription has expired
    const endDate = new Date(subscription.endDate);
    const now = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0 && subscription.type !== 'lifetime') {
      // Auto-expire the subscription
      await Clinic.findByIdAndUpdate(clinicId, {
        $set: {
          'subscription.status': 'expired',
          updatedAt: new Date(),
        },
      });
      return { valid: false, status: 'expired', endDate: subscription.endDate, daysRemaining: 0 };
    }

    // Active or trial with time remaining
    return {
      valid: true,
      status: subscription.status,
      endDate: subscription.endDate,
      daysRemaining,
    };
  } catch (error) {
    console.error('Subscription check error:', error);
    return { valid: false, status: 'expired', endDate: '', daysRemaining: 0 };
  }
}

// ═══ Create/Update Subscription ═══
export async function setClinicSubscription(
  clinicId: string,
  options: {
    type: SubscriptionType;
    days?: number;
    status?: SubscriptionStatus;
    extendFromExisting?: boolean;
  }
): Promise<ClinicSubscription> {
  await dbConnect();
  const now = new Date();
  const days = options.days || 30;

  // Determine start point for calculation
  let startFrom = now;
  let originalStartDate = now.toISOString();

  if (options.extendFromExisting) {
    // When extending, add days to the existing end date (if still in the future)
    try {
      const clinicDoc = await Clinic.findById(clinicId).lean();
      if (clinicDoc) {
        const existingSub = clinicDoc.subscription as unknown as ClinicSubscription;
        if (existingSub) {
          // Preserve original start date
          if (existingSub.startDate) {
            originalStartDate = existingSub.startDate;
          }
          // If existing end date is in the future, extend from there
          if (existingSub.endDate && existingSub.type !== 'lifetime') {
            const existingEndDate = new Date(existingSub.endDate);
            if (existingEndDate > now) {
              startFrom = existingEndDate;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error reading existing subscription for extension:', error);
    }
  }

  const endDate = new Date(startFrom.getTime() + days * 24 * 60 * 60 * 1000);

  const subscription: ClinicSubscription = {
    status: options.status || (options.type === 'trial' ? 'trial' : 'active'),
    type: options.type,
    startDate: options.extendFromExisting ? originalStartDate : now.toISOString(),
    endDate: options.type === 'lifetime' ? '9999-12-31T23:59:59.999Z' : endDate.toISOString(),
    ...(options.type === 'trial' ? { trialDays: days } : {}),
  };

  await Clinic.findByIdAndUpdate(clinicId, {
    $set: {
      subscription,
      active: subscription.status !== 'suspended',
      updatedAt: now,
    },
  });

  return subscription;
}

// ═══ Get Clinic by ID ═══
export async function getClinicById(clinicId: string): Promise<ClinicDocument | null> {
  try {
    await dbConnect();
    const doc = await Clinic.findById(clinicId).lean();
    if (!doc) return null;
    return toClient(doc) as ClinicDocument;
  } catch {
    return null;
  }
}

// ═══ Get All Clinics ═══
export async function getAllClinics(): Promise<ClinicDocument[]> {
  try {
    await dbConnect();
    const docs = await Clinic.find({}).sort({ createdAt: -1 }).lean();
    return docs.map((doc) => toClient(doc) as ClinicDocument);
  } catch {
    // Fallback without ordering
    try {
      await dbConnect();
      const docs = await Clinic.find({}).lean();
      return docs.map((doc) => toClient(doc) as ClinicDocument);
    } catch {
      return [];
    }
  }
}

// ═══ Create New Clinic ═══
export async function createClinic(data: {
  name: string;
  phone: string;
  ownerPhone: string;
  subscriptionType: SubscriptionType;
  trialDays?: number;
  description?: string;
  address?: string;
}): Promise<{ clinicId: string; clinic: ClinicDocument }> {
  await dbConnect();
  const now = new Date();
  const trialDays = data.trialDays || 14;
  const endDate = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

  const clinicData = {
    name: data.name,
    description: data.description || '',
    phone: data.phone,
    address: data.address || '',
    logo: '',
    primaryColor: 'emerald',
    subscription: {
      status: data.subscriptionType === 'trial' ? 'trial' : 'active',
      type: data.subscriptionType,
      startDate: now.toISOString(),
      endDate: data.subscriptionType === 'lifetime' ? '9999-12-31T23:59:59.999Z' : endDate.toISOString(),
      ...(data.subscriptionType === 'trial' ? { trialDays: trialDays } : {}),
    },
    ownerPhone: data.ownerPhone,
    active: true,
    setupComplete: false,
    createdAt: now,
    updatedAt: now,
  };

  const created = await Clinic.create(clinicData);
  const clinicId = created._id.toString();

  return {
    clinicId,
    clinic: { id: clinicId, ...toClient(created.toObject()) } as ClinicDocument,
  };
}

// ═══ Audit Logging ═══
export async function createAuditLog(data: {
  clinicId: string | null;
  userId: string;
  action: string;
  details?: string;
  severity?: 'info' | 'warning' | 'critical';
}): Promise<void> {
  try {
    await dbConnect();
    await AuditLog.create({
      clinicId: data.clinicId || 'platform',
      userId: data.userId,
      action: data.action,
      details: data.details || '',
      severity: data.severity || 'info',
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

// ═══ Platform Config ═══
export interface PlatformConfig {
  superAdminCreated: boolean;
  version: string;
  platformConfig?: Record<string, string>;
  defaultClinicId?: string;
  jwtSecret?: string;
  supportPhone?: string;
  supportWhatsApp?: string;
}

export async function getPlatformConfig(): Promise<PlatformConfig | null> {
  try {
    await dbConnect();
    const doc = await PlatformConfig.findOne({ configKey: 'config' }).lean();
    if (!doc) return null;
    // Remove internal fields and return as PlatformConfig
    const { configKey, updatedAt, _id, __v, ...config } = doc as any;
    return config as PlatformConfig;
  } catch {
    return null;
  }
}

export async function setPlatformConfig(config: Partial<PlatformConfig>): Promise<void> {
  await dbConnect();
  await PlatformConfig.findOneAndUpdate(
    { configKey: 'config' },
    { ...config, configKey: 'config', updatedAt: new Date() },
    { upsert: true, new: true }
  );
}
