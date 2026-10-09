import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { flightGateway } from '@/lib/duffel';
import { issueConfirmation } from '@/lib/orders';
import { paymentProvider } from '@/lib/payments';

/**
 * Book the ticket, then take the money. Never the other way round.
 *
 * The browser calls this once Stripe reports the card authorised. By then the
 * money is ring-fenced on the customer's card but NOT taken. This route:
 *
 *   1. checks with the provider that the authorisation really is held here —
 *      the browser's word is not evidence, and a client could call this with
 *      any order reference;
 *   2. creates the order with Duffel, which issues the ticket;
 *   3. captures the payment only if step 2 succeeded.
 *
 * If Duffel fails, the authorisation is released and the customer is charged
 * nothing. If Duffel succeeds but the capture fails, the ticket exists and is
 * unpaid: that order is flagged requires_attention and NEVER silently
 * cancelled, because a cancelled ticket is a refund fight and a stranded
 * traveller. A human settles that one.
 */

const schema = z.object({
  orderRef: z.string().trim().min(1),
  offerId: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing booking reference.' }, { status: 400 });
  }
  const { orderRef, offerId } = parsed.data;

  const order = await prisma.order.findUnique({
    where: { reference: orderRef },
    include: { passengers: true, customer: true, payments: true },
  });

  if (order === null) {
    return NextResponse.json({ error: 'We could not find that booking.' }, { status: 404 });
  }

  // Already booked: answer success rather than double-book. The browser may
  // retry after a dropped connection, and a second Duffel order would be a
  // second ticket on a card that was only authorised once.
  if (order.supplierRef) {
    return NextResponse.json({ ok: true, reference: order.reference, bookingRef: order.supplierRef });
  }

  const pending = order.payments.find(
    (p: { stripePaymentIntent: string | null }) => p.stripePaymentIntent !== null
  );
  const paymentRef = pending?.stripePaymentIntent ?? null;
  if (paymentRef === null) {
    return NextResponse.json({ error: 'No payment is attached to that booking.' }, { status: 409 });
  }

  const provider = paymentProvider();

  const state = await provider.authorizationState(paymentRef);
  if (state !== 'requires_capture') {
    return NextResponse.json(
      {
        error:
          state === 'incomplete'
            ? 'The card payment has not completed. Please try again.'
            : 'That payment is no longer valid. Please start the booking again.',
      },
      { status: 409 }
    );
  }

  // ── Step 2: issue the ticket ──
  let booking: { supplierOrderId: string; bookingReference: string };
  try {
    booking = await flightGateway().createOrder({
      supplierOfferId: offerId,
      passengers: order.passengers.map(
        (p: { givenName: string; familyName: string; dateOfBirth: Date | null }) => ({
          givenName: p.givenName,
          familyName: p.familyName,
          bornOn: p.dateOfBirth ? p.dateOfBirth.toISOString().slice(0, 10) : undefined,
        })
      ),
      contactEmail: order.customer.email,
      contactPhone: order.customer.phone ?? undefined,
    });
  } catch (error) {
    console.error(`Duffel booking failed for ${orderRef}:`, error);
    await provider.cancelAuthorization(paymentRef, 'failed');
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'cancelled' },
    });
    await prisma.payment.updateMany({
      where: { orderId: order.id, stripePaymentIntent: paymentRef },
      data: { status: 'failed' },
    });
    return NextResponse.json(
      {
        error:
          'The airline would not confirm that fare just now, so we have not taken any payment. Nothing has left your account. Send us the trip and we will book it for you directly.',
      },
      { status: 502 }
    );
  }

  // ── Step 3: take the money ──
  try {
    await provider.capture(paymentRef);
  } catch (error) {
    // The ticket is issued and we are unpaid. Do not cancel it from here.
    console.error(
      `CAPTURE FAILED after Duffel order ${booking.supplierOrderId} for ${orderRef}. ` +
        `The ticket is issued and unpaid — settle this by hand.`,
      error
    );
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'requires_attention', supplierRef: booking.bookingReference },
    });
    return NextResponse.json(
      {
        ok: true,
        reference: order.reference,
        bookingRef: booking.bookingReference,
        warning:
          'Your flight is booked. There was a problem taking the payment, so we will contact you to settle it.',
      },
      { status: 200 }
    );
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'confirmed',
      supplierRef: booking.bookingReference,
      paidMinor: order.totalMinor,
    },
  });
  await prisma.payment.updateMany({
    where: { orderId: order.id, stripePaymentIntent: paymentRef },
    data: { status: 'paid', paidAt: new Date() },
  });

  try {
    await issueConfirmation(order.id, `confirm:${order.reference}:${paymentRef}`);
  } catch (error) {
    // The booking and the money are both fine; only the email failed.
    console.error(`Confirmation email failed for ${orderRef}:`, error);
  }

  return NextResponse.json({
    ok: true,
    reference: order.reference,
    bookingRef: booking.bookingReference,
  });
}
