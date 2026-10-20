import { toBase64Url, fromBase64Url, getAuthSecret } from './auth-token';

export const CMS_AUTH_COOKIE_NAME = 'komuna_cms_session';

export interface CmsSessionUser {
  id: string;
  username: string;
  nama: string;
  role: 'CMS_SUPER_ADMIN';
  exp?: number;
  iat?: number;
}

// Kredensial Default CMS (Terisolasi 100% dari Database Warga RT)
const DEFAULT_CMS_USERNAME = process.env.CMS_ADMIN_USERNAME || 'superadmin';
const DEFAULT_CMS_PASSWORD = process.env.CMS_ADMIN_PASSWORD || 'komuna.admin2026!';

/**
 * Memvalidasi kredensial login CMS Admin.
 * Sama sekali TIDAK query ke database RT (Prisma).
 */
export function verifyCmsCredentials(username: string, password: string): boolean {
  if (!username || !password) return false;
  
  const targetUsername = (process.env.CMS_ADMIN_USERNAME || DEFAULT_CMS_USERNAME).trim().toLowerCase();
  const targetPassword = (process.env.CMS_ADMIN_PASSWORD || DEFAULT_CMS_PASSWORD).trim();

  const inputUsername = username.trim().toLowerCase();
  const inputPassword = password.trim();

  // Juga izinkan alternatif email superadmin@komuna.id
  const isUsernameMatch = inputUsername === targetUsername || inputUsername === 'admin@komuna.id';
  const isPasswordMatch = inputPassword === targetPassword;

  return isUsernameMatch && isPasswordMatch;
}

/**
 * Menandatangani token sesi CMS menggunakan Web Crypto (kompatibel Edge & Node).
 */
export async function signCmsSessionToken(
  user: Omit<CmsSessionUser, 'exp' | 'iat'>,
  maxAgeSeconds = 7 * 24 * 60 * 60 // 7 hari
): Promise<string> {
  const encoder = new TextEncoder();
  const now = Math.floor(Date.now() / 1000);

  const fullPayload: CmsSessionUser = {
    ...user,
    iat: now,
    exp: now + maxAgeSeconds,
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = toBase64Url(encoder.encode(JSON.stringify(header)));
  const encodedPayload = toBase64Url(encoder.encode(JSON.stringify(fullPayload)));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getAuthSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(dataToSign));
  const encodedSignature = toBase64Url(new Uint8Array(signatureBuffer));

  return `${dataToSign}.${encodedSignature}`;
}

/**
 * Memverifikasi validitas token sesi CMS.
 */
export async function verifyCmsSessionToken(token: string): Promise<CmsSessionUser | null> {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const dataToVerify = `${encodedHeader}.${encodedPayload}`;

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(getAuthSecret()),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = fromBase64Url(encodedSignature);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as unknown as ArrayBuffer,
      encoder.encode(dataToVerify)
    );

    if (!isValid) return null;

    const payloadJson = decoder.decode(fromBase64Url(encodedPayload));
    const payload = JSON.parse(payloadJson) as CmsSessionUser;

    if (payload.role !== 'CMS_SUPER_ADMIN') {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
