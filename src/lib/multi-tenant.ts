// ═══════════════════════════════════════════════════════════
// 🏢 Multi-Tenant System (Prisma + PostgreSQL)
// Clinic context, subscription management, data isolation
// ═══════════════════════════════════════════════════════════

import prisma from './db';
import type { Clinic, AuditLog, PlatformConfig } from '@prisma/client';

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

// ═══ Helpers: map Prisma Clinic row → ClinicDocument (with embedded subscription) ═══
function mapClinicToDoc(c: Clinic): ClinicDocument {
  const endDate = c.subEndDate ? c.subEndDate.toISOString() : '';
  const startDate = c.subStartDate ? c.subStartDate.toISOString() : '';
  const type = (c.subType || 'trial') as SubscriptionType;
  const status = (c.subStatus || 'active') as SubscriptionStatus;

  return {
    id: c.id,
    name: c.name,
    description: c.description || '',
    phone: c.phone || '',
    address: c.address || '',
    logo: c.logo || '',
    primaryColor: c.primaryColor || 'emerald',
    subscription: {
      status,
      type,
      startDate,
      endDate,
      ...(type === 'trial' ? { trialDays: c.subTrialDays || 0 } : {}),
    },
    ownerPhone: c.ownerPhone || c.adminPhone || c.phone || '',
    active: c.active,
    setupComplete: c.setupComplete,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

// ═══ Subscription Check ═══
export async function checkClinicSubscription(clinicId: string): Promise<{
  valid: boolean;
  status: SubscriptionStatus;
  endDate: string;
  daysRemaining: number;
}> {
  try {
    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic) {
      return { valid: false, status: 'expired', endDate: '', daysRemaining: 0 };
    }

    const status = (clinic.subStatus || 'active') as SubscriptionStatus;
    const type = (clinic.subType || 'trial') as SubscriptionType;

    if (status === 'suspended') {
      return { valid: false, status: 'suspended', endDate: clinic.subEndDate?.toISOString() || '', daysRemaining: 0 };
    }

    if (!clinic.subEndDate) {
      return { valid: false, status: 'expired', endDate: '', daysRemaining: 0 };
    }

    const now = new Date();
    const daysRemaining = Math.ceil((clinic.subEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0 && type !== 'lifetime') {
      await prisma.clinic.update({
        where: { id: clinicId },
        data: { subStatus: 'expired', updatedAt: new Date() },
      });
      return { valid: false, status: 'expired', endDate: clinic.subEndDate.toISOString(), daysRemaining: 0 };
    }

    return {
      valid: true,
      status,
      endDate: clinic.subEndDate.toISOString(),
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

  let startFrom = now;
  let originalStartDate = now;

  if (options.extendFromExisting) {
    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
    if (clinic) {
      if (clinic.subStartDate) originalStartDate = clinic.subStartDate;
      if (clinic.subEndDate && clinic.subType !== 'lifetime') {
        if (clinic.subEndDate > now) startFrom = clinic.subEndDate;
      }
    }
  }

  const endDate = new Date(startFrom.getTime() + days * 24 * 60 * 60 * 1000);

  const subscription: ClinicSubscription = {
    status: options.status || (options.type === 'trial' ? 'trial' : 'active'),
    type: options.type,
    startDate: options.extendFromExisting ? originalStartDate.toISOString() : now.toISOString(),
    endDate: options.type === 'lifetime' ? '9999-12-31T23:59:59.999Z' : endDate.toISOString(),
    ...(options.type === 'trial' ? { trialDays: days } : {}),
  };

  await prisma.clinic.update({
    where: { id: clinicId },
    data: {
      subType: subscription.type,
      subStatus: subscription.status,
      subStartDate: options.extendFromExisting ? originalStartDate : now,
      subEndDate: options.type === 'lifetime' ? new Date('9999-12-31T23:59:59.999Z') : endDate,
      subTrialDays: options.type === 'trial' ? days : 0,
      subTrial: options.type === 'trial',
      subMonthly: options.type === 'monthly',
      subYearly: options.type === 'yearly',
      subLifetime: options.type === 'lifetime',
      active: subscription.status !== 'suspended',
      updatedAt: now,
    },
  });

  return subscription;
}

// ═══ Get Clinic by ID ═══
export async function getClinicById(clinicId: string): Promise<ClinicDocument | null> {
  try {
    const c = await prisma.clinic.findUnique({ where: { id: clinicId } });
    if (!c) return null;
    return mapClinicToDoc(c);
  } catch {
    return null;
  }
}

// ═══ Get All Clinics ═══
export async function getAllClinics(): Promise<ClinicDocument[]> {
  try {
    const docs = await prisma.clinic.findMany({ orderBy: { createdAt: 'desc' } });
    return docs.map(mapClinicToDoc);
  } catch (error) {
    console.error('getAllClinics error:', error);
    return [];
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

  const created = await prisma.clinic.create({
    data: {
      name: data.name,
      description: data.description || '',
      phone: data.phone,
      address: data.address || '',
      logo: '',
      primaryColor: 'emerald',
      ownerPhone: data.ownerPhone,
      active: true,
      setupComplete: false,
      subPlan: data.subscriptionType === 'trial' ? 'free' : data.subscriptionType,
      subType: data.subscriptionType,
      subTrial: data.subscriptionType === 'trial',
      subMonthly: data.subscriptionType === 'monthly',
      subYearly: data.subscriptionType === 'yearly',
      subLifetime: data.subscriptionType === 'lifetime',
      subStatus: data.subscriptionType === 'trial' ? 'trial' : 'active',
      subStartDate: now,
      subEndDate: data.subscriptionType === 'lifetime' ? new Date('9999-12-31T23:59:59.999Z') : endDate,
      subTrialDays: data.subscriptionType === 'trial' ? trialDays : 0,
    },
  });

  return {
    clinicId: created.id,
    clinic: mapClinicToDoc(created),
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
    await prisma.auditLog.create({
      data: {
        clinicId: data.clinicId || 'platform',
        userId: data.userId,
        action: data.action,
        details: data.details || '',
        severity: data.severity || 'info',
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

// ═══ Platform Config ═══
export interface PlatformConfigData {
  superAdminCreated: boolean;
  version: string;
  platformConfig?: Record<string, unknown> | null;
  defaultClinicId?: string;
  jwtSecret?: string;
  supportPhone?: string;
  supportWhatsApp?: string;
}

export async function getPlatformConfig(): Promise<PlatformConfigData | null> {
  try {
    const doc = await prisma.platformConfig.findFirst({
      where: { configKey: 'config' },
    });
    if (!doc) return null;
    return {
      superAdminCreated: doc.superAdminCreated,
      version: doc.version,
      platformConfig: doc.platformConfig as Record<string, unknown> | null,
      defaultClinicId: doc.defaultClinicId || undefined,
      jwtSecret: doc.jwtSecret || undefined,
      supportPhone: doc.supportPhone || undefined,
      supportWhatsApp: doc.supportWhatsApp || undefined,
    };
  } catch {
    return null;
  }
}

export async function setPlatformConfig(config: Partial<PlatformConfigData>): Promise<void> {
  const data: any = { updatedAt: new Date() };
  if (config.superAdminCreated !== undefined) data.superAdminCreated = config.superAdminCreated;
  if (config.version !== undefined) data.version = config.version;
  if (config.defaultClinicId !== undefined) data.defaultClinicId = config.defaultClinicId;
  if (config.platformConfig !== undefined) data.platformConfig = config.platformConfig as any;
  if (config.jwtSecret !== undefined) data.jwtSecret = config.jwtSecret;
  if (config.supportPhone !== undefined) data.supportPhone = config.supportPhone;
  if (config.supportWhatsApp !== undefined) data.supportWhatsApp = config.supportWhatsApp;

  await prisma.platformConfig.upsert({
    where: { configKey: 'config' },
    create: { configKey: 'config', ...data },
    update: data,
  });
}
