import * as crypto from 'crypto';
import { cookies } from 'next/headers';
import {
  SessionUser,
  AUTH_COOKIE_NAME,
  DISPLAY_COOKIE_NAME,
  signSessionToken,
  verifySessionToken,
} from './auth-token';

export * from './auth-token';

// ==========================================
// Password Hashing (scrypt + Salt + Legacy Fallback)
// ==========================================

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derivedKey}`;
}

export function verifyPassword(
  password: string,
  storedHash: string
): { valid: boolean; needsRehash: boolean } {
  if (!storedHash || typeof storedHash !== 'string') {
    return { valid: false, needsRehash: false };
  }

  // 1. Scrypt salted format (modern)
  if (storedHash.startsWith('scrypt:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 3) return { valid: false, needsRehash: false };
    const [, salt, originalKey] = parts;
    const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
    
    try {
      const valid = crypto.timingSafeEqual(
        Buffer.from(derivedKey, 'hex'),
        Buffer.from(originalKey, 'hex')
      );
      return { valid, needsRehash: false };
    } catch {
      return { valid: false, needsRehash: false };
    }
  }

  // 2. Legacy SHA-256 (for seamless migration without locking existing users out)
  const legacyHash = crypto.createHash('sha256').update(password).digest('hex');
  if (legacyHash === storedHash) {
    return { valid: true, needsRehash: true };
  }

  return { valid: false, needsRehash: false };
}

// ==========================================
// Server Cookie & Session Helpers (Route Handlers)
// ==========================================

export async function setSessionCookies(user: { id: string; nama: string; email: string; role: string }) {
  const cookieStore = await cookies();
  const token = await signSessionToken({
    id: user.id,
    nama: user.nama,
    email: user.email,
    role: user.role,
  });

  const isProd = process.env.NODE_ENV === 'production';
  const maxAge = 30 * 24 * 60 * 60; // 30 days

  // 1. Secure HTTP-Only cookie for authorization
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge,
  });

  // 2. Client-safe display cookie (for immediate UI without extra fetch)
  cookieStore.set(DISPLAY_COOKIE_NAME, encodeURIComponent(JSON.stringify({
    id: user.id,
    nama: user.nama,
    role: user.role,
  })), {
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge,
  });

  return token;
}

export async function clearSessionCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  cookieStore.delete(DISPLAY_COOKIE_NAME);
}

export async function getServerSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);
    if (!sessionCookie || !sessionCookie.value) return null;

    // Verify cryptographic token
    const user = await verifySessionToken(sessionCookie.value);
    if (user) return user;

    // Fallback: If legacy unencrypted session exists, parse it defensively
    try {
      const decoded = decodeURIComponent(sessionCookie.value);
      const parsed = JSON.parse(decoded);
      if (parsed && parsed.id) {
        return {
          id: parsed.id,
          nama: parsed.nama || 'Pengguna',
          email: parsed.email || '',
          role: parsed.role || 'ADMIN',
        };
      }
    } catch {
      // not legacy JSON
    }

    return null;
  } catch {
    return null;
  }
}

export async function requireServerSession(): Promise<SessionUser> {
  const session = await getServerSession();
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

export async function requireRole(allowedRoles: string[]): Promise<SessionUser> {
  const session = await requireServerSession();
  if (!allowedRoles.includes(session.role)) {
    throw new Error('FORBIDDEN');
  }
  return session;
}
