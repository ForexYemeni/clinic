// ═══════════════════════════════════════════════════════════
// 🗄️ Prisma Client Singleton
// Connects to Neon PostgreSQL via DATABASE_URL
// ═══════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Convert any object with potential `id` field into a clean client-safe object.
 * Prisma already returns plain objects (no _id, no __v), so this is mostly a no-op,
 * but kept for backward compatibility with API routes that used Mongoose's `toClient`.
 */
export function toClient<T extends { id?: string } | null>(doc: T | null): T | null {
  if (!doc) return null;
  return doc;
}

export function toClientList<T extends { id?: string }>(docs: T[]): T[] {
  return docs;
}

/**
 * Convert a Date or ISO string to ISO string (for consistent client serialization).
 */
export function toISO(date: Date | string | null | undefined): string {
  if (!date) return '';
  if (typeof date === 'string') return date;
  return date.toISOString();
}

export default prisma;
