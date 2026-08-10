import { NextResponse } from 'next/server';
import { applyPaymentEvent } from '@/lib/orders';
import { paymentProvider } from '@/lib/payments';

/**
 * Raw body is required for signature verification — do not parse it first.
 * The provider throws on an invalid signature, and we answer 400 without
 * touching any order.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event;
  try {
    event = await paymentProvider().handleWebhook(rawBody, signature);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event === null) {
    // An event type we do not act on. Acknowledge so it is not retried.
    return NextResponse.json({ received: true });
  }

  try {
    await applyPaymentEvent(event);
  } catch (error) {
    console.error(`Failed to apply payment event ${event.eventId}:`, error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
