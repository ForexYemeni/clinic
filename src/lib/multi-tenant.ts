// ═══════════════════════════════════════════════════════════
// 🏢 Multi-Tenant System
// Clinic context, subscription management, data isolation
// ═══════════════════════════════════════════════════════════

import { adminDb } from './firebase-admin';

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
    const clinicDoc = await adminDb.collection('clinics').doc(clinicId).get();
    if (!clinicDoc.exists) {
      return { valid: false, status: 'expired', endDate: '', daysRemaining: 0 };
    }

    const data = clinicDoc.data();
    const subscription = data?.subscription as ClinicSubscription;

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
      await adminDb.collection('clinics').doc(clinicId).update({
        'subscription.status': 'expired',
        updatedAt: new Date().toISOString(),
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
  const now = new Date();
  const days = options.days || 30;

  // Determine start point for calculation
  let startFrom = now;
  let originalStartDate = now.toISOString();

  if (options.extendFromExisting) {
    // When extending, add days to the existing end date (if still in the future)
    try {
      const clinicDoc = await adminDb.collection('clinics').doc(clinicId).get();
      if (clinicDoc.exists) {
        const existingSub = clinicDoc.data()?.subscription as ClinicSubscription;
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
    trialDays: options.type === 'trial' ? days : undefined,
  };

  await adminDb.collection('clinics').doc(clinicId).update({
    subscription,
    active: subscription.status !== 'suspended',
    updatedAt: now.toISOString(),
  });

  return subscription;
}

// ═══ Get Clinic by ID ═══
export async function getClinicById(clinicId: string): Promise<ClinicDocument | null> {
  try {
    const doc = await adminDb.collection('clinics').doc(clinicId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as ClinicDocument;
  } catch {
    return null;
  }
}

// ═══ Get All Clinics ═══
export async function getAllClinics(): Promise<ClinicDocument[]> {
  try {
    const snapshot = await adminDb.collection('clinics').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClinicDocument));
  } catch {
    // Fallback without ordering
    const snapshot = await adminDb.collection('clinics').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClinicDocument));
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
  const now = new Date();
  const trialDays = data.trialDays || 14;
  const endDate = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

  const clinicData: Omit<ClinicDocument, 'id'> = {
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
      trialDays: data.subscriptionType === 'trial' ? trialDays : undefined,
    },
    ownerPhone: data.ownerPhone,
    active: true,
    setupComplete: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const docRef = await adminDb.collection('clinics').add(clinicData);

  return {
    clinicId: docRef.id,
    clinic: { id: docRef.id, ...clinicData },
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
    await adminDb.collection('audit_logs').add({
      clinicId: data.clinicId || 'platform',
      userId: data.userId,
      action: data.action,
      details: data.details || '',
      severity: data.severity || 'info',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

// ═══ Platform Config ═══
export interface PlatformConfig {
  superAdminCreated: boolean;
  version: string;
  firebaseConfig?: Record<string, string>;
  defaultClinicId?: string;
  jwtSecret?: string;
}

export async function getPlatformConfig(): Promise<PlatformConfig | null> {
  try {
    const doc = await adminDb.collection('platform').doc('config').get();
    if (!doc.exists) return null;
    return doc.data() as PlatformConfig;
  } catch {
    return null;
  }
}

export async function setPlatformConfig(config: Partial<PlatformConfig>): Promise<void> {
  await adminDb.collection('platform').doc('config').set(
    { ...config, updatedAt: new Date().toISOString() },
    { merge: true }
  );
}
