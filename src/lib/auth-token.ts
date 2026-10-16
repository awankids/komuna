export interface SessionUser {
  id: string;
  nama: string;
  email: string;
  role: string;
  exp?: number;
  iat?: number;
}

export const AUTH_COOKIE_NAME = 'komuna_session';
export const DISPLAY_COOKIE_NAME = 'komuna_user';
const DEFAULT_SECRET = 'komuna_fallback_secret_key_8256e2e29160ff2c1b3a2b1e05c9d73e';

export function getAuthSecret(): string {
  return process.env.AUTH_SECRET || DEFAULT_SECRET;
}

// ==========================================
// Base64URL Universal Helpers (Edge & Node)
// ==========================================

export function toBase64Url(uint8Array: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ==========================================
// Web Crypto JWT / Signed Token (Edge & Node)
// ==========================================

export async function signSessionToken(
  payload: Omit<SessionUser, 'exp' | 'iat'>,
  maxAgeSeconds = 30 * 24 * 60 * 60 // 30 days
): Promise<string> {
  const encoder = new TextEncoder();
  const now = Math.floor(Date.now() / 1000);
  
  const fullPayload: SessionUser = {
    ...payload,
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

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
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
    const payload = JSON.parse(payloadJson) as SessionUser;

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
