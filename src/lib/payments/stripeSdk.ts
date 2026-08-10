/**
 * THE ONLY FILE IN THIS CODEBASE THAT MAY IMPORT THE STRIPE SDK.
 *
 * Everything else goes through PaymentProvider. Enforced by
 * tests/noStripeOutsidePayments.test.ts, which scans src/ and fails if any
 * file outside src/lib/payments/ imports 'stripe', and asserts that within
 * this module only this file does.
 */
import Stripe from 'stripe';
import { config } from '../config';

let client: Stripe | null = null;

export function stripeClient(): Stripe {
  if (config.payments.demoMode) {
    throw new Error('Stripe SDK requested while STRIPE_SECRET_KEY is blank');
  }
  if (client === null) {
    client = new Stripe(config.payments.stripeSecretKey);
  }
  return client;
}
