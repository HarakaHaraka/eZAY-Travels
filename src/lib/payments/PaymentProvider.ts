/**
 * The payment abstraction.
 *
 * Customer money flow depends on the ticketing-partner contract and is not
 * settled. Everything outside this module talks to a PaymentProvider and a
 * normalised PaymentEvent, never to a payment SDK, so the model can change
 * without touching the booking flow.
 *
 * Enforced mechanically: tests/noStripeOutsidePayments.test.ts scans the
 * source tree and fails the build if any file outside src/lib/payments/
 * imports Stripe.
 *
 * Hosted checkout only. There is no card form anywhere in this codebase and
 * there must never be one.
 */

export interface CheckoutOrder {
  orderRef: string;
  /** What the customer pays, integer minor units. */
  amountMinor: number;
  currency: string;
  customerEmail: string;
  description: string;
}

export interface CheckoutSession {
  /** Opaque provider session id, persisted against the Payment row. */
  sessionId: string;
  /** Where to send the browser. Hosted page — never our own card form. */
  redirectUrl: string;
}

export type PaymentEventType = 'succeeded' | 'failed' | 'refunded' | 'disputed';

/** Provider-agnostic shape the booking flow reacts to. */
export interface PaymentEvent {
  /** Provider event id. This is the idempotency key. */
  eventId: string;
  type: PaymentEventType;
  orderRef: string;
  sessionId: string | null;
  paymentRef: string | null;
  amountMinor: number;
  currency: string;
  occurredAt: Date;
}

export interface RefundResult {
  refundRef: string;
  amountMinor: number;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'unknown';

export interface PaymentProvider {
  readonly name: string;

  createCheckout(order: CheckoutOrder): Promise<CheckoutSession>;

  /**
   * Verifies the signature and returns a normalised event, or null for an
   * event type this application does not act on. Throws on an invalid
   * signature — an unverified payload is never acted on.
   */
  handleWebhook(rawBody: string | Buffer, signature: string | null): Promise<PaymentEvent | null>;

  refund(paymentRef: string, amountMinor: number, reason?: string): Promise<RefundResult>;

  getStatus(paymentRef: string): Promise<PaymentStatus>;
}
