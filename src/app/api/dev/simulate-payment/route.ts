import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { prisma } from '@/lib/db';
import { applyPaymentEvent } from '@/lib/orders';

/**
 * Dev-only stand-in for the Stripe webhook, used when STRIPE_SECRET_KEY is
 * blank. It builds the same normalised PaymentEvent a real webhook produces
 * and pushes it through the identical code path — including the idempotency
 * check — so the demo flow exercises the real logic, not a shortcut.
 */
export async function POST(request: Request) {
  if (!config.payments.demoMode) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const sessionId = body?.sessionId;
  if (typeof sessionId !== 'string') {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }

  const payment = await prisma.payment.findFirst({
    where: { stripeSessionId: sessionId },
    include: { order: true },
  });
  if (payment === null) {
    return NextResponse.json({ error: 'No order for that session' }, { status: 404 });
  }

  await applyPaymentEvent({
    eventId: `evt_demo_${sessionId}`,
    type: 'succeeded',
    orderRef: payment.order.reference,
    sessionId,
    paymentRef: `pi_demo_${sessionId}`,
    amountMinor: payment.order.totalMinor,
    currency: payment.order.currency,
    occurredAt: new Date(),
  });

  const updated = await prisma.order.findUniqueOrThrow({
    where: { id: payment.orderId },
    include: { documents: true },
  });

  return NextResponse.json({
    reference: updated.reference,
    status: updated.status,
    confirmationIssued: updated.documents.length > 0,
  });
}
