import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { prisma } from '@/lib/db';
import { createOrder, issueConfirmation, type OrderItemInput } from '@/lib/orders';

const segmentSchema = z.object({
  marketingCarrier: z.string().trim().max(4).optional(),
  flightNumber: z.string().trim().max(6).optional(),
  originIata: z.string().trim().length(3),
  destinationIata: z.string().trim().length(3),
  departsAt: z.string().min(1),
  arrivesAt: z.string().min(1),
});

const itemSchema = z.object({
  itemType: z.enum(['flight', 'hotel', 'transfer', 'ancillary', 'insurance', 'fee']),
  description: z.string().trim().min(1, 'Every line needs a description.'),
  qty: z.number().int().min(1).max(99).default(1),
  costMinor: z.number().int().min(0),
  markupMinor: z.number().int(),
  /** Only used to block selling an unverified hotel rate. */
  hotelRateId: z.string().trim().optional(),
  segments: z.array(segmentSchema).optional(),
});

const manualOrderSchema = z.object({
  supplier: z.enum(['faremine', 'pta', 'duffel', 'direct']),
  supplierRef: z.string().trim().min(1, 'The supplier reference is required.'),
  customer: z.object({
    name: z.string().trim().min(2),
    email: z.string().trim().email('A valid customer email is required.'),
    phone: z.string().trim().max(40).optional(),
  }),
  passengers: z
    .array(
      z.object({
        givenName: z.string().trim().min(1),
        familyName: z.string().trim().min(1),
      })
    )
    .min(1, 'At least one passenger is required.'),
  items: z.array(itemSchema).min(1, 'At least one line is required.'),
  enquiryId: z.string().trim().optional(),
  notes: z.string().trim().max(2000).optional(),
  paymentTaken: z.boolean().default(true),
});

export async function POST(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = manualOrderSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' },
      { status: 400 }
    );
  }

  const input = parsed.data;

  // A rate with a null verifiedAt is a PLACEHOLDER. It must never be sold.
  const rateIds = input.items.map((i) => i.hotelRateId).filter((id): id is string => !!id);
  if (rateIds.length > 0) {
    const unverified = await prisma.hotelRate.findMany({
      where: { id: { in: rateIds }, verifiedAt: null },
      include: { hotel: true },
    });
    if (unverified.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot sell a placeholder rate: ${unverified
            .map((r) => `${r.hotel.name} (${r.roomType})`)
            .join(', ')}. Enter a verified quote on the hotel first.`,
        },
        { status: 409 }
      );
    }
  }

  const totalMarkup = input.items.reduce((sum, i) => sum + i.markupMinor * i.qty, 0);
  if (totalMarkup < 0) {
    return NextResponse.json(
      { error: 'Total markup is negative — that books a loss. Check the figures.' },
      { status: 400 }
    );
  }

  const items: OrderItemInput[] = input.items.map((item) => ({
    itemType: item.itemType,
    description: item.description,
    supplier: input.supplier,
    supplierRef: input.supplierRef,
    qty: item.qty,
    costMinor: item.costMinor,
    markupMinor: item.markupMinor,
    segments: item.segments?.map((segment, index) => ({
      leg: index + 1,
      marketingCarrier: segment.marketingCarrier,
      flightNumber: segment.flightNumber,
      originIata: segment.originIata.toUpperCase(),
      destinationIata: segment.destinationIata.toUpperCase(),
      departsAt: new Date(segment.departsAt),
      arrivesAt: new Date(segment.arrivesAt),
    })),
  }));

  try {
    const order = await createOrder({
      orderType: 'manual',
      supplier: input.supplier,
      supplierRef: input.supplierRef,
      customer: input.customer,
      passengers: input.passengers,
      items,
      enquiryId: input.enquiryId || undefined,
      notes: input.notes,
    });

    // A manual order is already paid for on the supplier's portal, so it goes
    // straight down the SAME confirmation path an online booking uses.
    if (input.paymentTaken) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          kind: 'full',
          amountMinor: order.totalMinor,
          currency: order.currency,
          method: 'bank_transfer',
          status: 'paid',
          paidAt: new Date(),
        },
      });
      await prisma.order.update({
        where: { id: order.id },
        data: { paidMinor: order.totalMinor },
      });
    }

    const result = await issueConfirmation(order.id, `manual:${order.id}`);

    return NextResponse.json({
      id: order.id,
      reference: order.reference,
      // Surfaced so the operator knows whether the customer actually got the
      // document, rather than assuming it worked.
      confirmationDelivered: result.issued || result.alreadyIssued,
    });
  } catch (error) {
    console.error('Manual order creation failed:', error);
    return NextResponse.json({ error: 'Could not save that order.' }, { status: 500 });
  }
}
