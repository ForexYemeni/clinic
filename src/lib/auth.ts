// ═══════════════════════════════════════════════════════════
// 🔐 Authentication & Security System
// JWT tokens, bcrypt password hashing, auth middleware
// ═══════════════════════════════════════════════════════════

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// JWT secret - in production this should be from environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'clinic-saas-platform-secret-key-2024-ultra-secure';
const JWT_EXPIRES_IN = '7d'; // 7 days

export interface TokenPayload {
  userId: string;
  role: 'super_admin' | 'admin' | 'nurse';
  clinicId: string | null;
  clinicName?: string;
}

export interface AuthResult {
  userId: string;
  role: 'super_admin' | 'admin' | 'nurse';
  clinicId: string | null;
  clinicName?: string;
}

// ═══ Password Hashing ═══
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  // Support legacy plaintext passwords for migration
  if (!hashedPassword.startsWith('$2a$') && !hashedPassword.startsWith('$2b$')) {
    // Legacy plaintext comparison
    return password === hashedPassword;
  }
  return bcrypt.compare(password, hashedPassword);
}

// ═══ JWT Token Management ═══
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): AuthResult | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return {
      userId: decoded.userId,
      role: decoded.role,
      clinicId: decoded.clinicId,
      clinicName: decoded.clinicName,
    };
  } catch {
    return null;
  }
}

// ═══ Auth Header Extraction ═══
export function extractAuthFromRequest(request: Request): AuthResult | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  return verifyToken(token);
}

// ═══ Effective ClinicId Extraction ═══
// For super_admin: reads clinicId from query parameter (set by apiFetch)
// For regular users: uses JWT's clinicId
// Returns { auth, effectiveClinicId }
export function extractAuthAndClinicId(request: Request): {
  auth: AuthResult | null;
  effectiveClinicId: string | null;
} {
  const auth = extractAuthFromRequest(request);

  // Check for clinicId query parameter (used by super_admin)
  const url = new URL(request.url);
  const queryClinicId = url.searchParams.get('clinicId');

  let effectiveClinicId: string | null = null;

  if (auth?.role === 'super_admin' && queryClinicId) {
    // Super admin explicitly viewing a specific clinic
    effectiveClinicId = queryClinicId;
  } else if (auth?.clinicId) {
    // Regular user - use their assigned clinicId
    effectiveClinicId = auth.clinicId;
  }

  return { auth, effectiveClinicId };
}

// ═══ Recovery Code Generation ═══
export function generateRecoveryCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ═══ OTP Generation ═══
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
