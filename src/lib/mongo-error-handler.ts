// ═══════════════════════════════════════════════════════════
// 🍃 MongoDB Error Handler
// Detects MongoDB connection/network/timeout errors and returns
// user-friendly Arabic error messages
// ═══════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';

interface MongoError {
  code?: string | number;
  message?: string;
  name?: string;
  codeName?: string;
}

/**
 * Check if an error is a MongoDB connection/network/availability error
 * These errors mean the database is completely unavailable
 */
export function isMongoUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const err = error as MongoError;
  const code = err?.code;
  const message = err?.message || '';
  const name = err?.name || '';
  const codeName = err?.codeName || '';

  // Mongoose connection errors
  if (name === 'MongooseError' || name === 'MongoNetworkError' || name === 'MongoTimeoutError') return true;
  if (name === 'MongoServerError' && (code === 6 || codeName === 'HostUnreachable')) return true;
  if (name === 'MongoServerError' && (code === 89 || codeName === 'NetworkInterfaceExceededTimeLimit')) return true;
  if (name === 'MongoNetworkTimeoutError') return true;

  // Connection refused / unreachable
  if (message.includes('ECONNREFUSED') || message.includes('ECONNRESET')) return true;
  if (message.includes('ETIMEDOUT') || message.includes('timeout')) return true;
  if (message.includes('socket hang up')) return true;

  // MongoDB specific error codes
  // 6: HostUnreachable
  // 7: HostNotFound
  // 89: NetworkInterfaceExceededTimeLimit
  // 91: ShutdownInProgress
  // 189: PrimarySteppedDown
  // 262: ExceededTimeLimit
  if (code === 6 || code === 7 || code === 89 || code === 91 || code === 189 || code === 262) return true;

  // Replica set / cluster errors
  if (message.includes('not master') || message.includes('not primary')) return true;
  if (message.includes('ReplicaSetNoPrimary')) return true;
  if (message.includes('connection refused')) return true;

  // Authentication failures that indicate unavailable service
  if (name === 'MongoAuthenticationError') return true;

  // Topology errors
  if (name === 'MongoTopologyClosedError') return true;

  // Buffering errors (mongoose can't reach DB)
  if (message.includes('buffering timeout') || message.includes('Operation buffering timed out')) return true;

  // Generic Mongoose disconnected state
  if (message.includes('disconnected') || message.includes('not connected')) return true;

  return false;
}

/**
 * Create a user-friendly error response for MongoDB errors
 * Returns different messages based on the type of error
 */
export function handleMongoError(error: unknown, context: string = 'العملية'): NextResponse {
  console.error(`[MongoDB Error] ${context}:`, error);

  if (isMongoUnavailableError(error)) {
    // Database is completely unavailable
    return NextResponse.json(
      {
        error: 'خدمة قاعدة البيانات غير متاحة حالياً. يرجى المحاولة لاحقاً أو التواصل مع إدارة المنصة.',
        mongoDown: true,
        retryable: true,
      },
      { status: 503 }
    );
  }

  // Check for duplicate key error (unique constraint violation)
  const err = error as MongoError;
  if (err?.code === 11000 || (err?.message && err.message.includes('duplicate key'))) {
    return NextResponse.json(
      {
        error: 'البيانات موجودة مسبقاً. يرجى التحقق من عدم تكرار البيانات.',
        retryable: false,
      },
      { status: 409 }
    );
  }

  // Validation error
  if (err?.name === 'ValidationError') {
    return NextResponse.json(
      {
        error: 'البيانات المدخلة غير صحيحة. يرجى مراجعة البيانات والمحاولة مرة أخرى.',
        retryable: false,
      },
      { status: 400 }
    );
  }

  // Generic server error
  return NextResponse.json(
    {
      error: `خطأ في ${context}. يرجى المحاولة مرة أخرى.`,
      retryable: true,
    },
    { status: 500 }
  );
}

/**
 * Safely execute a MongoDB operation with error handling
 * Automatically catches MongoDB errors and returns appropriate responses
 */
export async function safeMongoOp<T>(
  op: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await op();
  } catch (error) {
    if (isMongoUnavailableError(error)) {
      console.error('[MongoDB] Database unavailable, returning fallback value');
      return fallback;
    }
    throw error;
  }
}
