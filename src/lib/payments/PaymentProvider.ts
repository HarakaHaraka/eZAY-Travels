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
 * Card data never reaches this application. The card fields are Stripe's own
 * iframes (Payment Element), so this codebase has no card form of its own and
 * must never have one.
 *
 * THE MONEY ORDER MATTERS. eZAY is merchant of record and pays the airline
 * from its own Duffel balance, so a customer must never be charged for a
 * ticket that was not issued. The flow is therefore:
 *
 *   1. authorise  — ring-fence the money on the card, take nothing
 *   2. book       — create the order with Duffel; the ticket is issued
 *   3. capture    — take the money, but only once step 2 has succeeded
 *
 * If step 2 fails, the authorisation is cancelled and the customer is charged
 * nothing. This is why createPaymentIntent, capture and cancelAuthorization
 * exist alongside the older hosted-checkout call.
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

/** An authorisation held on the customer's card, not yet taken. */
export interface PaymentAuthorization {
  /** Provider payment id (Stripe PaymentIntent id). Persisted on the order. */
  paymentRef: string;
  /** Returned to the browser so Stripe's own fields can complete the card. */
  clientSecret: string;
  /** Safe to expose; the browser needs it to mount Stripe's fields. */
  publishableKey: string;
}

export type AuthorizationState =
  /** Money ring-fenced, nothing taken. Safe to book, then capture. */
  | 'requires_capture'
  /** The customer has not finished authorising yet. */
  | 'incomplete'
  /** Already captured. */
  | 'captured'
  /** Cancelled, failed, or unknown to the provider. */
  | 'dead';

/** Whether the wallets are actually live on our own domain. */
export interface WalletStatus {
  domainName: string;
  registered: boolean;
  applePay: boolean;
  googlePay: boolean;
  link: boolean;
}

export interface PaymentProvider {
  readonly name: string;

  createCheckout(order: CheckoutOrder): Promise<CheckoutSession>;

  /**
   * Creates an authorisation that must be captured separately. Nothing is
   * taken from the customer until capture() is called.
   */
  createPaymentIntent(order: CheckoutOrder): Promise<PaymentAuthorization>;

  /** What the provider currently thinks of this authorisation. */
  authorizationState(paymentRef: string): Promise<AuthorizationState>;

  /**
   * The client secret for an authorisation already created, so the same
   * payment can be completed on another device (the "finish on your phone"
   * link). Null when the payment can no longer be completed.
   */
  resumeAuthorization(paymentRef: string): Promise<PaymentAuthorization | null>;

  /** Takes the money. Only ever called after the ticket is issued. */
  capture(paymentRef: string): Promise<void>;

  /** Releases the hold. The customer is charged nothing. */
  cancelAuthorization(paymentRef: string, reason?: string): Promise<void>;

  /**
   * Verifies the signature and returns a normalised event, or null for an
   * event type this application does not act on. Throws on an invalid
   * signature — an unverified payload is never acted on.
   */
  handleWebhook(rawBody: string | Buffer, signature: string | null): Promise<PaymentEvent | null>;

  refund(paymentRef: string, amountMinor: number, reason?: string): Promise<RefundResult>;

  /**
   * Reports whether our domain is registered for wallet payments and which
   * wallets are live on it. Null when payments are not configured at all.
   * Exists so the owner can verify Apple Pay and Google Pay from /status
   * rather than guessing from whichever browser happens to be to hand —
   * a desktop that shows no wallet button looks identical to a broken
   * configuration, and that ambiguity has cost real time.
   */
  walletStatus(): Promise<WalletStatus | null>;

  getStatus(paymentRef: string): Promise<PaymentStatus>;
}
