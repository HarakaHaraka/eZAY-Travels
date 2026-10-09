import { randomUUID } from 'crypto';
import { config } from '../config';
import type {
  AuthorizationState,
  CheckoutOrder,
  CheckoutSession,
  PaymentAuthorization,
  PaymentEvent,
  PaymentProvider,
  PaymentStatus,
  RefundResult,
  WalletStatus,
} from './PaymentProvider';
import { stripeClient } from './stripeSdk';

/**
 * eZAY is merchant of record. Stripe hosted checkout; funds land in eZAY's
 * Stripe balance.
 *
 * With STRIPE_SECRET_KEY blank this degrades to a demo mode that issues a
 * local session id and points at an in-app payment page, so the booking flow
 * is exercisable without a Stripe account. That page emits the same
 * normalised PaymentEvent a real webhook does, through the same idempotency
 * check — it is not a shortcut around the real path. Never active in
 * production (see config.assertProductionReady).
 */
export class StripeDirectProvider implements PaymentProvider {
  readonly name: string = 'stripe_direct';

  async createCheckout(order: CheckoutOrder): Promise<CheckoutSession> {
    if (config.payments.demoMode) {
      const sessionId = `cs_demo_${randomUUID()}`;
      return {
        sessionId,
        redirectUrl: `${config.siteUrl}/book/demo-payment?session=${sessionId}&ref=${encodeURIComponent(order.orderRef)}`,
      };
    }

    const session = await stripeClient().checkout.sessions.create({
      mode: 'payment',
      customer_email: order.customerEmail,
      client_reference_id: order.orderRef,
      metadata: { orderRef: order.orderRef },
      success_url: `${config.siteUrl}/book/confirmation?ref=${encodeURIComponent(order.orderRef)}`,
      cancel_url: `${config.siteUrl}/book/cancelled?ref=${encodeURIComponent(order.orderRef)}`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: order.currency.toLowerCase(),
            unit_amount: order.amountMinor,
            product_data: { name: order.description },
          },
        },
      ],
    });

    return { sessionId: session.id, redirectUrl: session.url! };
  }

  /**
   * Authorise, do not take. capture_method 'manual' ring-fences the money on
   * the customer's card and leaves the intent in requires_capture, so the
   * booking can be attempted before a penny moves.
   *
   * Stripe holds a manual-capture authorisation for about 7 days. We capture
   * within seconds of the Duffel order, so that window is ample.
   */
  async createPaymentIntent(order: CheckoutOrder): Promise<PaymentAuthorization> {
    if (config.payments.demoMode) {
      const paymentRef = `pi_demo_${randomUUID()}`;
      return { paymentRef, clientSecret: `${paymentRef}_secret_demo`, publishableKey: '' };
    }

    const intent = await stripeClient().paymentIntents.create({
      amount: order.amountMinor,
      currency: order.currency.toLowerCase(),
      capture_method: 'manual',
      receipt_email: order.customerEmail,
      description: order.description,
      metadata: { orderRef: order.orderRef },
      // Let the Dashboard decide which methods appear (cards, Apple Pay,
      // Google Pay, Link). Wallets are charged at the underlying card rate.
      automatic_payment_methods: { enabled: true },
    });

    if (intent.client_secret === null) {
      throw new Error('Stripe returned a PaymentIntent with no client secret');
    }

    return {
      paymentRef: intent.id,
      clientSecret: intent.client_secret,
      publishableKey: config.payments.stripePublishableKey,
    };
  }

  async authorizationState(paymentRef: string): Promise<AuthorizationState> {
    if (config.payments.demoMode) return 'requires_capture';

    const intent = await stripeClient().paymentIntents.retrieve(paymentRef);
    switch (intent.status) {
      case 'requires_capture':
        return 'requires_capture';
      case 'succeeded':
        return 'captured';
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
      case 'processing':
        return 'incomplete';
      default:
        return 'dead';
    }
  }

  async resumeAuthorization(paymentRef: string): Promise<PaymentAuthorization | null> {
    if (config.payments.demoMode) {
      return { paymentRef, clientSecret: `${paymentRef}_secret_demo`, publishableKey: '' };
    }
    const intent = await stripeClient().paymentIntents.retrieve(paymentRef);
    // Only a payment still awaiting the customer can be resumed. One already
    // captured, or cancelled, must not reopen a payment screen.
    const resumable =
      intent.status === 'requires_payment_method' ||
      intent.status === 'requires_confirmation' ||
      intent.status === 'requires_action';
    if (!resumable || intent.client_secret === null) return null;
    return {
      paymentRef: intent.id,
      clientSecret: intent.client_secret,
      publishableKey: config.payments.stripePublishableKey,
    };
  }

  async capture(paymentRef: string): Promise<void> {
    if (config.payments.demoMode) return;
    await stripeClient().paymentIntents.capture(paymentRef);
  }

  async cancelAuthorization(paymentRef: string, reason?: string): Promise<void> {
    if (config.payments.demoMode) return;
    try {
      await stripeClient().paymentIntents.cancel(paymentRef, {
        cancellation_reason: reason === 'abandoned' ? 'abandoned' : 'requested_by_customer',
      });
    } catch (error) {
      // Never let a failed release mask the booking error that caused it.
      // An uncaptured authorisation expires on its own within about 7 days.
      console.error(`Could not cancel authorisation ${paymentRef}:`, error);
    }
  }

  async walletStatus(): Promise<WalletStatus | null> {
    if (config.payments.demoMode) return null;

    let host: string;
    try {
      host = new URL(config.siteUrl).host;
    } catch {
      return null;
    }

    const { data } = await stripeClient().paymentMethodDomains.list({
      domain_name: host,
      limit: 1,
    });
    const domain = data[0];

    if (domain === undefined) {
      return { domainName: host, registered: false, applePay: false, googlePay: false, link: false };
    }

    return {
      domainName: host,
      registered: domain.enabled,
      applePay: domain.apple_pay?.status === 'active',
      googlePay: domain.google_pay?.status === 'active',
      link: domain.link?.status === 'active',
    };
  }

  async handleWebhook(
    rawBody: string | Buffer,
    signature: string | null
  ): Promise<PaymentEvent | null> {
    if (signature === null) {
      throw new Error('Missing Stripe-Signature header');
    }
    if (config.payments.stripeWebhookSecret === '') {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    // Throws on a bad signature. An unverified payload is never acted on.
    const event = stripeClient().webhooks.constructEvent(
      rawBody,
      signature,
      config.payments.stripeWebhookSecret
    );

    return normaliseStripeEvent(event);
  }

  async refund(paymentRef: string, amountMinor: number, reason?: string): Promise<RefundResult> {
    const refund = await stripeClient().refunds.create({
      payment_intent: paymentRef,
      amount: amountMinor,
      ...(reason ? { metadata: { reason } } : {}),
    });
    return { refundRef: refund.id, amountMinor: refund.amount };
  }

  async getStatus(paymentRef: string): Promise<PaymentStatus> {
    const intent = await stripeClient().paymentIntents.retrieve(paymentRef);
    switch (intent.status) {
      case 'succeeded':
        return 'paid';
      case 'canceled':
        return 'failed';
      case 'processing':
      case 'requires_action':
      case 'requires_capture':
      case 'requires_confirmation':
      case 'requires_payment_method':
        return 'pending';
      default:
        return 'unknown';
    }
  }
}

/**
 * Maps a Stripe event onto the provider-agnostic PaymentEvent.
 *
 * Typed loosely on purpose: Stripe's event union is enormous and
 * version-dependent, and narrowing it to our own type is this function's
 * entire job. Callers only ever see a PaymentEvent.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normaliseStripeEvent(event: any): PaymentEvent | null {
  const occurredAt = new Date((event.created ?? Date.now() / 1000) * 1000);
  const object = event?.data?.object ?? {};

  const refOf = () => object.client_reference_id ?? object.metadata?.orderRef ?? '';
  const intentOf = () =>
    typeof object.payment_intent === 'string'
      ? object.payment_intent
      : (object.payment_intent?.id ?? null);

  switch (event.type) {
    // The live path since 9 October: payment is a PaymentIntent authorised on
    // our own page and captured after the Duffel order. The confirm route
    // already records all of this synchronously, so these events are a
    // backstop for the case where our response was lost in flight.
    case 'payment_intent.succeeded':
      return {
        eventId: event.id,
        type: 'succeeded',
        orderRef: object.metadata?.orderRef ?? '',
        sessionId: null,
        paymentRef: object.id ?? null,
        amountMinor: object.amount_received ?? object.amount ?? 0,
        currency: (object.currency ?? 'gbp').toUpperCase(),
        occurredAt,
      };

    case 'payment_intent.payment_failed':
    case 'payment_intent.canceled':
      return {
        eventId: event.id,
        type: 'failed',
        orderRef: object.metadata?.orderRef ?? '',
        sessionId: null,
        paymentRef: object.id ?? null,
        amountMinor: object.amount ?? 0,
        currency: (object.currency ?? 'gbp').toUpperCase(),
        occurredAt,
      };

    // Kept for the older hosted-checkout path and for any session still open.
    case 'checkout.session.completed':
      return {
        eventId: event.id,
        type: 'succeeded',
        orderRef: refOf(),
        sessionId: object.id ?? null,
        paymentRef: intentOf(),
        amountMinor: object.amount_total ?? 0,
        currency: (object.currency ?? 'gbp').toUpperCase(),
        occurredAt,
      };

    case 'checkout.session.async_payment_failed':
      return {
        eventId: event.id,
        type: 'failed',
        orderRef: refOf(),
        sessionId: object.id ?? null,
        paymentRef: null,
        amountMinor: object.amount_total ?? 0,
        currency: (object.currency ?? 'gbp').toUpperCase(),
        occurredAt,
      };

    case 'charge.refunded':
      return {
        eventId: event.id,
        type: 'refunded',
        orderRef: object.metadata?.orderRef ?? '',
        sessionId: null,
        paymentRef: intentOf(),
        amountMinor: object.amount_refunded ?? 0,
        currency: (object.currency ?? 'gbp').toUpperCase(),
        occurredAt,
      };

    case 'charge.dispute.created':
      return {
        eventId: event.id,
        type: 'disputed',
        orderRef: object.metadata?.orderRef ?? '',
        sessionId: null,
        paymentRef: intentOf(),
        amountMinor: object.amount ?? 0,
        currency: (object.currency ?? 'gbp').toUpperCase(),
        occurredAt,
      };

    default:
      return null;
  }
}
