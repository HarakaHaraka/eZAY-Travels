import { config } from '../config';
import { StripeDirectProvider } from './stripeDirect';
import type { PaymentProvider } from './PaymentProvider';

/**
 * CollectAndRemit: eZAY collects through the same hosted checkout, but the
 * money is not eZAY's to keep. Collection mechanics are identical, so they
 * are inherited; what differs is that each licensable order also gets a
 * Remittance row recording what is owed onward, when it is due and whether
 * it has been paid.
 *
 * The remittance record is created by the booking flow (src/lib/orders.ts)
 * rather than here, because it is a fact about the order rather than a
 * payment concern. The onward bank transfer is deliberately NOT automated —
 * it is a human step, surfaced in admin.
 */
class CollectAndRemitProvider extends StripeDirectProvider {
  override readonly name = 'collect_and_remit';
}

/** Days after payment by which the onward remittance is due. */
export const REMITTANCE_DUE_DAYS = 7;

let provider: PaymentProvider | null = null;

/** The active provider, selected by PAYMENT_MODE. */
export function paymentProvider(): PaymentProvider {
  if (provider === null) {
    provider =
      config.payments.mode === 'collect_and_remit'
        ? new CollectAndRemitProvider()
        : new StripeDirectProvider();
  }
  return provider;
}

/** True when the active mode owes money onward and needs remittance records. */
export function requiresRemittance(): boolean {
  return config.payments.mode === 'collect_and_remit';
}

export * from './PaymentProvider';
