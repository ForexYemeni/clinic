// ═══════════════════════════════════════════════════════════
// 🔥 Firebase Error Handler
// Detects Firebase quota/billing/network errors and returns
// user-friendly Arabic error messages
// ═══════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';

interface FirebaseError {
  code?: string;
  message?: string;
  status?: number;
  details?: string;
}

/**
 * Check if an error is a Firebase quota/billing/network error
 * These errors mean the database is completely unavailable
 */
export function isFirebaseUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const err = error as FirebaseError;
  const code = err?.code || '';
  const message = err?.message || '';
  const status = err?.status || 0;

  // RESOURCE_EXHAUSTED: Quota exceeded (most common)
  if (code === 8 || code === 'RESOURCE_EXHAUSTED') return true;
  if (message.includes('Quota exceeded') || message.includes('RESOURCE_EXHAUSTED')) return true;
  if (message.includes('quota')) return true;

  // PERMISSION_DENIED: Firestore rules changed or billing disabled
  if (code === 7 || code === 'PERMISSION_DENIED') return true;
  if (status === 403 && message.includes('permission')) return true;

  // UNAUTHENTICATED: Billing account issues
  if (code === 16 || code === 'UNAUTHENTICATED') return true;

  // NOT_FOUND: Database deleted
  if (code === 5 || code === 'NOT_FOUND') return true;

  // UNAVAILABLE: Server unreachable
  if (code === 14 || code === 'UNAVAILABLE') return true;
  if (message.includes('INTERNAL') || message.includes('internal')) return true;

  // DEADLINE_EXCEEDED: Request timeout
  if (code === 4 || code === 'DEADLINE_EXCEEDED') return true;

  // Cloud Firestore billing disabled
  if (message.includes('billing') || message.includes('Cloud Firestore')) return true;

  // Generic network/connection errors
  if (message.includes('ECONNREFUSED') || message.includes('ECONNRESET')) return true;
  if (message.includes('ETIMEDOUT') || message.includes('timeout')) return true;
  if (message.includes('socket hang up')) return true;

  return false;
}

/**
 * Create a user-friendly error response for Firebase errors
 * Returns different messages based on the type of error
 */
export function handleFirebaseError(error: unknown, context: string = 'العملية'): NextResponse {
  console.error(`[Firebase Error] ${context}:`, error);

  if (isFirebaseUnavailableError(error)) {
    // Database is completely unavailable
    return NextResponse.json({
      error: 'خدمة قاعدة البيانات غير متاحة حالياً. يرجى المحاولة لاحقاً أو التواصل مع إدارة المنصة.',
      firebaseDown: true,
      retryable: true,
    }, { status: 503 });
  }

  // Generic server error
  return NextResponse.json({
    error: `خطأ في ${context}. يرجى المحاولة مرة أخرى.`,
    retryable: true,
  }, { status: 500 });
}

/**
 * Safely execute a Firebase operation with error handling
 * Automatically catches Firebase errors and returns appropriate responses
 */
export async function safeFirebaseOp<T>(
  operation: () => Promise<T>,
  context: string = 'العملية'
): Promise<{ data: T | null; error: NextResponse | null }> {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleFirebaseError(err, context) };
  }
}
