import crypto from 'node:crypto';

export interface SessionPayload {
  sub: string;
  iat: number;
  exp: number;
}

export const SESSION_COOKIE_NAME = 'acv_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 horas

export function hashPassword(password: string, existingSalt?: string): string {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHex, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(padLen), 'base64');
}

export function signSessionToken(
  username: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  ttlSeconds = SESSION_TTL_SECONDS
): string {
  const payload: SessionPayload = {
    sub: username,
    iat: nowSeconds,
    exp: nowSeconds + ttlSeconds,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(encodedPayload)
    .digest();
  return `${encodedPayload}.${base64UrlEncode(signature)}`;
}

export function verifySessionToken(
  token: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): SessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encodedPayload, encodedSignature] = parts;
  if (!encodedPayload || !encodedSignature) return null;

  try {
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(encodedPayload)
      .digest();
    const providedSig = base64UrlDecode(encodedSignature);
    if (expectedSig.length !== providedSig.length) return null;
    if (!crypto.timingSafeEqual(expectedSig, providedSig)) return null;

    const payload = JSON.parse(base64UrlDecode(encodedPayload).toString('utf8')) as SessionPayload;
    if (!payload || typeof payload.sub !== 'string' || typeof payload.exp !== 'number') {
      return null;
    }
    if (payload.exp <= nowSeconds) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function parseCookieHeader(headerValue: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!headerValue) return out;
  for (const part of headerValue.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const rawVal = part.slice(idx + 1).trim();
    try {
      out[key] = decodeURIComponent(rawVal);
    } catch {
      out[key] = rawVal;
    }
  }
  return out;
}
