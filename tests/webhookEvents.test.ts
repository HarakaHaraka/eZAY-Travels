import { describe, expect, it } from 'vitest';
import { normaliseStripeEvent } from '@/lib/payments/stripeDirect';

/**
 * Since payment moved to PaymentIntents authorised on our own page, the old
 * checkout.session.* events never fire. If the normaliser had not been
 * updated with them, a dispute or a refund raised in the Stripe dashboard
 * would have been silently ignored.
 */

describe('payment_intent events', () => {
  it('records a successful capture against the order in its metadata', () => {
    const result = normaliseStripeEvent({
      id: 'evt_1',
      type: 'payment_intent.succeeded',
      created: 1_760_000_000,
      data: {
        object: {
          id: 'pi_123',
          amount: 41_254,
          amount_received: 41_254,
          currency: 'gbp',
          metadata: { orderRef: 'EZY-ABC123' },
        },
      },
    });

    expect(result).not.toBeNull();
    expect(result!.type).toBe('succeeded');
    expect(result!.orderRef).toBe('EZY-ABC123');
    expect(result!.paymentRef).toBe('pi_123');
    expect(result!.amountMinor).toBe(41_254);
    expect(result!.currency).toBe('GBP');
  });

  it('treats a failed and a cancelled intent as failures', () => {
    for (const type of ['payment_intent.payment_failed', 'payment_intent.canceled']) {
      const result = normaliseStripeEvent({
        id: `evt_${type}`,
        type,
        created: 1_760_000_000,
        data: { object: { id: 'pi_9', amount: 1000, currency: 'gbp', metadata: {} } },
      });
      expect(result, type).not.toBeNull();
      expect(result!.type, type).toBe('failed');
    }
  });
});

describe('charge events, which carry no order reference', () => {
  it('still reports the payment id so the order can be found from it', () => {
    const result = normaliseStripeEvent({
      id: 'evt_dispute',
      type: 'charge.dispute.created',
      created: 1_760_000_000,
      data: { object: { id: 'dp_1', payment_intent: 'pi_123', amount: 41_254, currency: 'gbp' } },
    });

    expect(result).not.toBeNull();
    expect(result!.type).toBe('disputed');
    expect(result!.orderRef).toBe('');
    expect(result!.paymentRef, 'the fallback lookup key').toBe('pi_123');
  });
});

describe('the order lookup fallback', () => {
  it('falls back to the payment id when the event has no order reference', async () => {
    const { readFile } = await import('node:fs/promises');
    const path = await import('node:path');
    const body = await readFile(path.join(process.cwd(), 'src', 'lib', 'orders.ts'), 'utf8');
    expect(body).toContain('stripePaymentIntent: event.paymentRef');
  });
});
