import 'server-only';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import type { Prisma } from '@prisma/client';
import { protectionSnapshot } from './accreditation';
import { renderConfirmationPdf } from './confirmationPdf';
import { prisma } from './db';
import { sendEmail } from './email';
import { formatMoney } from './money';
import { REMITTANCE_DUE_DAYS, requiresRemittance, type PaymentEvent } from './payments';
import { generateOrderReference } from './references';

export const DOCUMENTS_DIR = path.join(process.cwd(), '.documents');

export function documentPath(reference: string): string {
  return path.join(DOCUMENTS_DIR, `${reference}.pdf`);
}

export interface OrderItemInput {
  itemType: 'flight' | 'hotel' | 'transfer' | 'ancillary' | 'insurance' | 'fee';
  description: string;
  supplier?: string;
  supplierRef?: string;
  qty?: number;
  costMinor: number;
  markupMinor: number;
  startsAt?: Date;
  endsAt?: Date;
  meta?: Prisma.InputJsonValue;
  segments?: Array<{
    leg?: number;
    marketingCarrier?: string;
    flightNumber?: string;
    originIata: string;
    destinationIata: string;
    departsAt: Date;
    arrivesAt: Date;
    cabinClass?: string;
    baggageIncluded?: string;
    duffelOfferId?: string;
    duffelOrderId?: string;
    pnr?: string;
  }>;
}

export interface PassengerInput {
  title?: string;
  givenName: string;
  familyName: string;
  dateOfBirth?: Date;
  paxType?: 'adult' | 'child' | 'infant';
}

export interface CreateOrderInput {
  orderType: 'api' | 'manual';
  supplier: string;
  supplierRef?: string;
  customer: { name: string; email: string; phone?: string; whatsapp?: string };
  passengers: PassengerInput[];
  items: OrderItemInput[];
  enquiryId?: string;
  notes?: string;
  currency?: string;
}

/**
 * The order total is always the sum of its items — never a figure passed in
 * alongside them. Deriving it here is what makes the totals-match invariant
 * true by construction rather than by discipline.
 */
export function totalsFromItems(items: OrderItemInput[]): {
  costMinor: number;
  markupMinor: number;
  totalMinor: number;
} {
  return items.reduce(
    (totals, item) => {
      const qty = item.qty ?? 1;
      const cost = item.costMinor * qty;
      const markup = item.markupMinor * qty;
      return {
        costMinor: totals.costMinor + cost,
        markupMinor: totals.markupMinor + markup,
        totalMinor: totals.totalMinor + cost + markup,
      };
    },
    { costMinor: 0, markupMinor: 0, totalMinor: 0 }
  );
}

/**
 * Creates an order of either type. API and MANUAL orders are identical
 * downstream — same record, same reference, same confirmation document.
 *
 * The accreditation values are frozen onto the order here, at the time of
 * sale, so a later config change never rewrites what this customer was told.
 */
export async function createOrder(input: CreateOrderInput) {
  const totals = totalsFromItems(input.items);
  const reference = generateOrderReference();
  const protection = protectionSnapshot();
  const currency = input.currency ?? 'GBP';

  const customer = await upsertCustomer(input.customer);

  return prisma.order.create({
    data: {
      reference,
      orderType: input.orderType,
      supplier: input.supplier,
      supplierRef: input.supplierRef,
      status: 'pending',
      currency,
      costMinor: totals.costMinor,
      markupMinor: totals.markupMinor,
      totalMinor: totals.totalMinor,
      customerId: customer.id,
      enquiryId: input.enquiryId,
      notes: input.notes,
      ...protection,
      passengers: {
        create: input.passengers.map((p) => ({
          title: p.title,
          givenName: p.givenName,
          familyName: p.familyName,
          dateOfBirth: p.dateOfBirth,
          paxType: p.paxType ?? 'adult',
        })),
      },
      items: {
        create: input.items.map((item) => ({
          itemType: item.itemType,
          description: item.description,
          supplier: item.supplier,
          supplierRef: item.supplierRef,
          qty: item.qty ?? 1,
          costMinor: item.costMinor,
          markupMinor: item.markupMinor,
          priceMinor: item.costMinor + item.markupMinor,
          startsAt: item.startsAt,
          endsAt: item.endsAt,
          meta: item.meta,
          segments: item.segments
            ? {
                create: item.segments.map((segment, index) => ({
                  leg: segment.leg ?? index + 1,
                  marketingCarrier: segment.marketingCarrier,
                  flightNumber: segment.flightNumber,
                  originIata: segment.originIata,
                  destinationIata: segment.destinationIata,
                  departsAt: segment.departsAt,
                  arrivesAt: segment.arrivesAt,
                  cabinClass: segment.cabinClass,
                  baggageIncluded: segment.baggageIncluded,
                  duffelOfferId: segment.duffelOfferId,
                  duffelOrderId: segment.duffelOrderId,
                  pnr: segment.pnr,
                })),
              }
            : undefined,
        })),
      },
    },
    include: { items: { include: { segments: true } }, passengers: true },
  });
}

/**
 * Matches an existing customer on email or phone, otherwise creates one.
 * Neither column is unique in the schema (the same household can share a
 * number), so this is a find-then-create rather than an upsert.
 */
async function upsertCustomer(input: {
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
}) {
  const or = [
    ...(input.email ? [{ email: input.email }] : []),
    ...(input.phone ? [{ phone: input.phone }] : []),
  ];

  const existing = or.length > 0 ? await prisma.customer.findFirst({ where: { OR: or } }) : null;

  if (existing !== null) {
    return prisma.customer.update({
      where: { id: existing.id },
      data: { name: input.name, phone: input.phone ?? existing.phone },
    });
  }

  return prisma.customer.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      whatsapp: input.whatsapp,
    },
  });
}

/**
 * Issues the confirmation document and moves the order to confirmed.
 *
 * THE INVARIANT: an order reaches 'confirmed' only if the document was
 * issued AND delivered. If either fails the order goes to
 * 'requires_attention' and stays there until a human acts. It is never
 * silently confirmed.
 *
 * Idempotent via ConfirmationDocument.idempotencyKey, which is unique: a
 * replayed webhook reuses the existing document rather than sending a second.
 */
export async function issueConfirmation(
  orderId: string,
  idempotencyKey: string
): Promise<{ issued: boolean; alreadyIssued: boolean }> {
  const existing = await prisma.confirmationDocument.findUnique({
    where: { idempotencyKey },
  });
  if (existing !== null && existing.deliveryStatus === 'sent') {
    // Already done. Make sure the order reflects it, then stop.
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'confirmed' },
    });
    return { issued: false, alreadyIssued: true };
  }

  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      items: { include: { segments: true }, orderBy: { createdAt: 'asc' } },
      passengers: true,
      customer: true,
    },
  });

  const issuedAt = existing?.issuedAt ?? new Date();

  try {
    const pdf = await renderConfirmationPdf({
      reference: order.reference,
      issuedAt,
      passengerNames: order.passengers.map((p) => `${p.givenName} ${p.familyName}`.trim()),
      segments: order.items.flatMap((item) => item.segments),
      items: order.items.map((item) => ({
        description: item.description,
        qty: item.qty,
        priceMinor: item.priceMinor * item.qty,
      })),
      totalMinor: order.totalMinor,
      currency: order.currency,
      // Frozen at sale, not read from current config.
      protectionHolder: order.protectionHolder,
      protectionNumber: order.protectionNumber,
      protectionStatement: order.protectionStatement,
    });

    await mkdir(DOCUMENTS_DIR, { recursive: true });
    await writeFile(documentPath(order.reference), pdf);
    const documentUrl = `/api/documents/${encodeURIComponent(order.reference)}`;

    // Record the document before attempting delivery, so a failed send leaves
    // a durable trace rather than vanishing.
    await prisma.confirmationDocument.upsert({
      where: { idempotencyKey },
      create: {
        orderId: order.id,
        idempotencyKey,
        issuedAt,
        deliveryStatus: 'pending',
        documentUrl,
      },
      update: { documentUrl, deliveryStatus: 'pending' },
    });

    await sendEmail({
      to: order.customer.email,
      subject: `Your eZAY booking ${order.reference} is confirmed`,
      html: confirmationEmailHtml({
        reference: order.reference,
        name: order.customer.name,
        totalMinor: order.totalMinor,
        currency: order.currency,
        protectionHolder: order.protectionHolder,
        protectionNumber: order.protectionNumber,
        protectionStatement: order.protectionStatement,
      }),
      attachments: [{ filename: `eZAY-${order.reference}.pdf`, content: pdf }],
    });

    await prisma.$transaction([
      prisma.confirmationDocument.update({
        where: { idempotencyKey },
        data: { deliveryStatus: 'sent' },
      }),
      prisma.order.update({ where: { id: order.id }, data: { status: 'confirmed' } }),
    ]);

    return { issued: true, alreadyIssued: false };
  } catch (error) {
    console.error(`Confirmation failed for ${order.reference}:`, error);
    await prisma.confirmationDocument
      .update({ where: { idempotencyKey }, data: { deliveryStatus: 'failed' } })
      .catch(() => undefined);
    // NOT confirmed. Loud in admin instead.
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'requires_attention' },
    });
    return { issued: false, alreadyIssued: false };
  }
}

function confirmationEmailHtml(input: {
  reference: string;
  name: string;
  totalMinor: number;
  currency: string;
  protectionHolder: string | null;
  protectionNumber: string | null;
  protectionStatement: string | null;
}): string {
  const hasProtection = input.protectionHolder !== null && input.protectionNumber !== null;
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;color:#16262d">
      <h1 style="font-size:20px;margin:0 0 12px">You're booked</h1>
      <p>Hi ${input.name.split(' ')[0]},</p>
      <p>Your booking reference is <strong>${input.reference}</strong>. Quote that if you call us.</p>
      <p>Total paid: <strong>${formatMoney(input.totalMinor, input.currency)}</strong></p>
      <p>Your confirmation is attached as a PDF.</p>
      ${
        hasProtection
          ? `<hr><p style="font-size:12px;color:#556974">${input.protectionHolder} — ${input.protectionNumber}<br>${input.protectionStatement ?? ''}</p>`
          : ''
      }
      <p style="font-size:12px;color:#718793">eZAY Travels and Tours Ltd · London</p>
    </div>
  `;
}

/**
 * Applies a payment event to an order. Idempotent by event id: a replayed
 * delivery records nothing new and issues no second document.
 */
export async function applyPaymentEvent(event: PaymentEvent): Promise<void> {
  const order = await prisma.order.findUnique({ where: { reference: event.orderRef } });
  if (order === null) {
    console.warn(`Payment event ${event.eventId} for unknown order ${event.orderRef}`);
    return;
  }

  if (event.type === 'succeeded') {
    // The Payment row is keyed on the provider's intent id, which is unique —
    // so a replay updates rather than inserts a duplicate.
    if (event.paymentRef) {
      await prisma.payment.upsert({
        where: { stripePaymentIntent: event.paymentRef },
        create: {
          orderId: order.id,
          kind: 'full',
          amountMinor: event.amountMinor,
          currency: event.currency,
          method: 'stripe',
          stripeSessionId: event.sessionId,
          stripePaymentIntent: event.paymentRef,
          status: 'paid',
          paidAt: event.occurredAt,
        },
        update: { status: 'paid', paidAt: event.occurredAt },
      });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { paidMinor: event.amountMinor },
    });

    if (requiresRemittance()) {
      await prisma.remittance.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          amountMinor: order.costMinor,
          dueAt: new Date(event.occurredAt.getTime() + REMITTANCE_DUE_DAYS * 86_400_000),
          reference: `REM-${order.reference}`,
        },
        update: {},
      });
    }

    // The event id is the idempotency key, so a replay reuses the document.
    await issueConfirmation(order.id, `payment:${event.eventId}`);
    return;
  }

  if (event.type === 'failed') {
    await prisma.order.update({ where: { id: order.id }, data: { status: 'pending' } });
    return;
  }

  if (event.type === 'refunded' || event.type === 'disputed') {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'requires_attention' },
    });
  }
}

/** Attach revenue: the markup on everything that is not the flight. */
export function attachRevenueMinor(
  items: Array<{ itemType: string; markupMinor: number; qty: number }>
): number {
  return items
    .filter((item) => item.itemType !== 'flight' && item.itemType !== 'fee')
    .reduce((total, item) => total + item.markupMinor * item.qty, 0);
}

