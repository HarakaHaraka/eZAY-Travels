import { randomUUID } from 'crypto';
import { config } from '../config';
import type {
  CheckoutOrder,
  CheckoutSession,
  PaymentEvent,
  PaymentProvider,
  PaymentStatus,
  RefundResult,
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
