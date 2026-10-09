import { NextResponse } from 'next/server';
import { z } from 'zod';
import { canSellFlights } from '@/lib/accreditation';
import { prisma } from '@/lib/db';
import { flightGateway } from '@/lib/duffel';
import { formatMoney } from '@/lib/money';
import { insuranceQuote, priceOffer, priceStay } from '@/lib/offers';
import { createOrder, type OrderItemInput } from '@/lib/orders';
import { payUrl } from '@/lib/payLink';
import { paymentProvider } from '@/lib/payments';

const checkoutSchema = z.object({
  offerId: z.string().min(1),
  passengers: z
    .array(
      z.object({
        givenName: z.string().trim().min(1, 'Every traveller needs a first name.'),
        familyName: z.string().trim().min(1, 'Every traveller needs a last name.'),
        // Airlines require a date of birth to issue a ticket. Collect it here
        // rather than discover it missing when Duffel rejects the order.
        bornOn: z
          .string()
          .trim()
          .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please give each traveller\u2019s date of birth.')
          .refine((value) => {
            const date = new Date(`${value}T00:00:00Z`);
            if (Number.isNaN(date.getTime())) return false;
            const now = Date.now();
            // A real date, in the past, and nobody is over 120.
            return date.getTime() < now && now - date.getTime() < 120 * 365.25 * 86_400_000;
          }, 'That date of birth does not look right.'),
      })
    )
    .min(1),
  contactEmail: z.string().trim().email('That email address does not look right.'),
  contactPhone: z.string().trim().max(40).optional(),
  stayId: z.string().nullable().optional(),
  wantsInsurance: z.boolean().default(false),
});

export async function POST(request: Request) {
  // THE BLANK-CONFIG GUARD. No accreditation ⇒ no licence to sell a flight
  // under ⇒ checkout is refused outright, a 409, not a soft UI hide.
  if (!canSellFlights()) {
    return NextResponse.json(
      {
        error:
          'Online flight booking is not available. Send us your trip and we will book it for you directly.',
      },
      { status: 409 }
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Please check the form.' },
      { status: 400 }
    );
  }

  const input = parsed.data;

  const raw = await flightGateway().getOffer(input.offerId);
  if (raw === null) {
    return NextResponse.json(
      { error: 'That fare has expired. Search again and we will re-price it.' },
      { status: 410 }
    );
  }

  const offer = priceOffer(raw);
  if (input.passengers.length !== offer.passengerCount) {
    return NextResponse.json(
      { error: 'The number of travellers does not match the fare. Please search again.' },
      { status: 400 }
    );
  }

  // Build order lines server-side. Add-on prices are always re-derived here,
  // never trusted from the client.
  const outbound = offer.slices[0];
  const items: OrderItemInput[] = [
    {
      itemType: 'flight',
      description: `${outbound?.originIata} → ${outbound?.destinationIata}${offer.slices[1] ? ' return' : ''}, ${outbound?.segments[0]?.marketingCarrierName ?? ''}`.trim(),
      supplier: 'duffel',
      supplierRef: offer.id,
      qty: 1,
      costMinor: offer.costMinor,
      markupMinor: offer.markupMinor,
      segments: offer.slices.flatMap((slice) =>
        slice.segments.map((segment) => ({
          marketingCarrier: segment.marketingCarrier,
          flightNumber: segment.flightNumber,
          originIata: segment.originIata,
          destinationIata: segment.destinationIata,
          departsAt: new Date(segment.departsAt),
          arrivesAt: new Date(segment.arrivesAt),
        }))
      ),
    },
  ];

  if (input.stayId) {
    const inbound = offer.slices[1];
    const checkIn = outbound?.segments[0]?.arrivesAt.slice(0, 10) ?? '';
    const checkOut =
      inbound?.segments[0]?.departsAt.slice(0, 10) ??
      new Date(new Date(checkIn).getTime() + 3 * 86_400_000).toISOString().slice(0, 10);
    const stays = await flightGateway().searchStays({
      destination: outbound?.destinationIata ?? '',
      checkIn,
      checkOut,
    });
    const chosen = stays.find((s) => s.supplierStayId === input.stayId);
    if (chosen) {
      const priced = priceStay(chosen);
      items.push({
        itemType: 'hotel',
        description: `${priced.name} — ${priced.nights} night${priced.nights > 1 ? 's' : ''}`,
        qty: 1,
        costMinor: priced.costMinor,
        markupMinor: priced.commissionMinor,
      });
    }
  }

  if (input.wantsInsurance) {
    const insurance = insuranceQuote(offer.passengerCount, offer.longHaul);
    items.push({
      itemType: 'insurance',
      description: insurance.description,
      qty: 1,
      costMinor: insurance.costMinor,
      markupMinor: insurance.sellMinor - insurance.costMinor,
    });
  }

  const order = await createOrder({
    orderType: 'api',
    supplier: 'duffel',
    customer: {
      name: `${input.passengers[0].givenName} ${input.passengers[0].familyName}`.trim(),
      email: input.contactEmail,
      phone: input.contactPhone,
    },
    passengers: input.passengers.map((p) => ({
      givenName: p.givenName,
      familyName: p.familyName,
      dateOfBirth: new Date(`${p.bornOn}T00:00:00Z`),
    })),
    items,
  });

  try {
    // Authorise, do not take. The customer stays on ezaytravels.co.uk and the
    // money is only captured once Duffel has issued the ticket, in
    // /api/fares/confirm.
    const auth = await paymentProvider().createPaymentIntent({
      orderRef: order.reference,
      amountMinor: order.totalMinor,
      currency: order.currency,
      customerEmail: input.contactEmail,
      description: `eZAY booking ${order.reference} — ${formatMoney(order.totalMinor, order.currency)}`,
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        kind: 'full',
        amountMinor: order.totalMinor,
        currency: order.currency,
        method: 'stripe',
        stripePaymentIntent: auth.paymentRef,
        status: 'pending',
      },
    });

    return NextResponse.json({
      reference: order.reference,
      offerId: offer.id,
      clientSecret: auth.clientSecret,
      publishableKey: auth.publishableKey,
      payUrl: payUrl(order.reference),
    });
  } catch (error) {
    console.error(`Checkout creation failed for ${order.reference}:`, error);
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'requires_attention' },
    });
    return NextResponse.json(
      { error: 'We could not start the payment. Nothing was charged — please try again.' },
      { status: 502 }
    );
  }
}
