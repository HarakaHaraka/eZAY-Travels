import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';
import { config } from './config';

/**
 * A signed link that lets a booking be paid on another device.
 *
 * Why this is signed rather than just /book/pay/EZY-123456: an order
 * reference is short and sequential-looking, so an unsigned page would let
 * anyone walk the references and read other people's passenger names. The
 * token is an HMAC of the reference under a server secret — unguessable
 * without the secret, and derived rather than stored, so no migration and
 * nothing extra to leak.
 *
 * It is not a password. It only opens the payment page for one booking that
 * is already awaiting payment, and the card itself is still handled by
 * Stripe. Anyone holding the link can pay for that booking, which is the
 * point of handing it to yourself on your phone.
 */

function secret(): string {
  // Reuses the admin session secret, which is already required in production.
  return config.admin.sessionSecret;
}

export function payToken(reference: string): string {
  return createHmac('sha256', secret()).update(`pay:${reference}`).digest('base64url').slice(0, 32);
}

/** Constant-time comparison, so a wrong token leaks nothing by timing. */
export function verifyPayToken(reference: string, token: string | undefined): boolean {
  if (!token) return false;
  const expected = Buffer.from(payToken(reference));
  const given = Buffer.from(token);
  if (expected.length !== given.length) return false;
  return timingSafeEqual(expected, given);
}

export function payUrl(reference: string): string {
  return `${config.siteUrl}/book/pay/${encodeURIComponent(reference)}?t=${payToken(reference)}`;
}
