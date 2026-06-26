// ═══════════════════════════════════════════════════════════
// 🗄️ Database Error Handler
// Generic error handling for MongoDB/database operations
// ═══════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';

interface DatabaseError {
  code?: string | number;
  message?: string;
  name?: string;
}

/**
 * Check if an error is a database unavailable error
 */
export function isDatabaseUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const err = error as DatabaseError;
  const code = String(err?.code || '');
  const message = err?.message || '';
  const name = err?.name || '';

  // MongoDB connection errors
  if (name === 'MongooseError' || name === 'MongoError' || name === 'MongoServerError') return true;
  if (code === 'ECONNREFUSED' || code === 'ECONNRESET') return true;
  if (message.includes('ECONNREFUSED') || message.includes('ECONNRESET')) return true;
  if (message.includes('ETIMEDOUT') || message.includes('timeout')) return true;
  if (message.includes('socket hang up')) return true;
  if (message.includes('not connected')) return true;
  if (message.includes('connection timed out')) return true;
  if (message.includes('Topology is closed')) return true;

  // MongoDB auth errors
  if (code === 18 || message.includes('Authentication failed')) return true;

  return false;
}

/**
 * Create a user-friendly error response for database errors
 */
export function handleDatabaseError(error: unknown, context: string = 'العملية'): NextResponse {
  console.error(`[Database Error] ${context}:`, error);

  if (isDatabaseUnavailableError(error)) {
    return NextResponse.json({
      error: 'خدمة قاعدة البيانات غير متاحة حالياً. يرجى المحاولة لاحقاً أو التواصل مع إدارة المنصة.',
      databaseDown: true,
      retryable: true,
    }, { status: 503 });
  }

  return NextResponse.json({
    error: `خطأ في ${context}. يرجى المحاولة مرة أخرى.`,
    retryable: true,
  }, { status: 500 });
}

/**
 * Safely execute a database operation with error handling
 */
export async function safeDbOp<T>(
  operation: () => Promise<T>,
  context: string = 'العملية'
): Promise<{ data: T | null; error: NextResponse | null }> {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleDatabaseError(err, context) };
  }
}

// Backward compatibility aliases
export const isFirebaseUnavailableError = isDatabaseUnavailableError;
export const handleFirebaseError = handleDatabaseError;
export const safeFirebaseOp = safeDbOp;
