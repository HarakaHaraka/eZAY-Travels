import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { config } from './config';

export const ADMIN_COOKIE = 'ezay_admin';
const SESSION_HOURS = 12;
export const ADMIN_SESSION_MAX_AGE = SESSION_HOURS * 3600;

function sign(value: string): string {
  return createHmac('sha256', config.admin.sessionSecret).update(value).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Constant-time comparison against ADMIN_PASSWORD. Blank never matches. */
export function passwordIsCorrect(candidate: string): boolean {
  if (config.admin.password === '') return false;
  return safeEqual(candidate, config.admin.password);
}

export function createSessionToken(): string {
  const expiresAt = Date.now() + SESSION_HOURS * 3_600_000;
  return `${expiresAt}.${sign(String(expiresAt))}`;
}

export function tokenIsValid(token: string | undefined): boolean {
  if (!token) return false;
  const [expiresAtRaw, signature] = token.split('.');
  if (!expiresAtRaw || !signature) return false;
  if (!safeEqual(signature, sign(expiresAtRaw))) return false;
  return Number(expiresAtRaw) > Date.now();
}

export function isAdminAuthenticated(): boolean {
  return tokenIsValid(cookies().get(ADMIN_COOKIE)?.value);
}
