// ═══════════════════════════════════════════════════════════
// 🗄️ Database Connection Shim (Prisma → MongoDB-compatible API)
//
// This file preserves the old `dbConnect()` API used across all routes
// but underneath it just returns the Prisma singleton. Real DB access
// happens via the `prisma` export from `@/lib/db`.
//
// Migration path: API routes can keep `await dbConnect();` at the top
// while switching their queries from Mongoose models to `prisma.*`.
// ═══════════════════════════════════════════════════════════

import prisma from './db';

/**
 * No-op kept for backward compatibility with API routes that
 * still call `await dbConnect()` at the top of their handlers.
 * Prisma connects lazily on first query, so this is a safe no-op.
 */
async function dbConnect() {
  return prisma;
}

export default dbConnect;
export { prisma };
