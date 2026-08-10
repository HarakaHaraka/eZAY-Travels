import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/db';
import {
  applyPaymentEvent,
  createOrder,
  issueConfirmation,
  totalsFromItems,
  type CreateOrderInput,
} from '@/lib/orders';
import type { PaymentEvent } from '@/lib/payments';

const FLIGHT_SEGMENTS = [
  {
    marketingCarrier: 'VS',
    flightNumber: '411',
    originIata: 'LHR',
    destinationIata: 'LOS',
    departsAt: new Date('2026-12-18T12:00:00Z'),
    arrivesAt: new Date('2026-12-18T18:30:00Z'),
  },
];

function manualOrderInput(overrides: Partial<CreateOrderInput> = {}): CreateOrderInput {
  return {
    orderType: 'manual',
    supplier: 'faremine',
    supplierRef: 'FM-88213',
    customer: { name: 'Amara Okafor', email: 'amara@example.com', phone: '+447700900123' },
    passengers: [
      { givenName: 'Amara', familyName: 'Okafor' },
      { givenName: 'Chidi', familyName: 'Okafor' },
    ],
    items: [
      {
        itemType: 'flight',
        description: 'LHR → LOS return, Virgin Atlantic',
        supplier: 'faremine',
        qty: 2,
        costMinor: 48_900,
        markupMinor: 3_100,
        segments: FLIGHT_SEGMENTS,
      },
      {
        itemType: 'hotel',
        description: 'Eko Hotel & Suites — 5 nights',
        qty: 1,
        costMinor: 26_000,
        markupMinor: 3_000,
      },
      {
        itemType: 'insurance',
        description: 'Travel insurance — 2 travellers',
        qty: 1,
        costMinor: 4_200,
        markupMinor: 2_100,
      },
    ],
    ...overrides,
  };
}

function succeededEvent(overrides: Partial<PaymentEvent> = {}): PaymentEvent {
  return {
    eventId: 'evt_test_1',
    type: 'succeeded',
    orderRef: 'REPLACE',
    sessionId: 'cs_test_1',
    paymentRef: 'pi_test_1',
    amountMinor: 0,
    currency: 'GBP',
    occurredAt: new Date(),
    ...overrides,
  };
}

beforeEach(async () => {
  // FK order matters.
  await prisma.confirmationDocument.deleteMany();
  await prisma.remittance.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.orderHotel.deleteMany();
  await prisma.passenger.deleteMany();
  await prisma.order.deleteMany();
  await prisma.enquiryEvent.deleteMany();
  await prisma.enquiry.deleteMany();
  await prisma.customer.deleteMany();
  vi.restoreAllMocks();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('booking total always equals the sum of its items', () => {
  it('derives the totals rather than trusting a supplied figure', () => {
    const totals = totalsFromItems(manualOrderInput().items);
    // flight 2 × (48_900 + 3_100) + hotel 29_000 + insurance 6_300
    expect(totals.costMinor).toBe(48_900 * 2 + 26_000 + 4_200);
    expect(totals.markupMinor).toBe(3_100 * 2 + 3_000 + 2_100);
    expect(totals.totalMinor).toBe(totals.costMinor + totals.markupMinor);
  });

  it('holds on the persisted order, per item and in aggregate', async () => {
    const order = await createOrder(manualOrderInput());

    const persisted = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { items: true },
    });

    const summed = persisted.items.reduce(
      (acc, item) => ({
        cost: acc.cost + item.costMinor * item.qty,
        markup: acc.markup + item.markupMinor * item.qty,
        price: acc.price + item.priceMinor * item.qty,
      }),
      { cost: 0, markup: 0, price: 0 }
    );

    expect(persisted.costMinor).toBe(summed.cost);
    expect(persisted.markupMinor).toBe(summed.markup);
    expect(persisted.totalMinor).toBe(summed.price);
    expect(persisted.totalMinor).toBe(persisted.costMinor + persisted.markupMinor);

    // Every line stores cost, markup and price separately, so margin is a
    // write-time fact rather than a report-time reconstruction.
    for (const item of persisted.items) {
      expect(item.priceMinor).toBe(item.costMinor + item.markupMinor);
    }
  });

  it('is all integers — no float has touched an amount', async () => {
    const order = await createOrder(manualOrderInput());
    const persisted = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { items: true },
    });
    for (const value of [persisted.costMinor, persisted.markupMinor, persisted.totalMinor]) {
      expect(Number.isInteger(value)).toBe(true);
    }
    for (const item of persisted.items) {
      expect(Number.isInteger(item.priceMinor)).toBe(true);
    }
  });
});

describe('manual order creation', () => {
  it('logs a trade-portal order as a first-class citizen', async () => {
    const order = await createOrder(manualOrderInput());

    expect(order.orderType).toBe('manual');
    expect(order.supplier).toBe('faremine');
    expect(order.supplierRef).toBe('FM-88213');
    // Same reference shape as an API order — the customer cannot tell.
    expect(order.reference).toMatch(/^EZY-[A-Z2-9]{6}$/);
    expect(order.passengers).toHaveLength(2);
    expect(order.items).toHaveLength(3);
    expect(order.items.find((i) => i.itemType === 'flight')?.segments).toHaveLength(1);
  });

  it('runs the SAME confirmation path as an API order', async () => {
    const order = await createOrder(manualOrderInput());
    const result = await issueConfirmation(order.id, `manual:${order.id}`);

    expect(result.issued).toBe(true);

    const confirmed = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { documents: true },
    });
    expect(confirmed.status).toBe('confirmed');
    expect(confirmed.documents).toHaveLength(1);
    expect(confirmed.documents[0].deliveryStatus).toBe('sent');
  });

  it('freezes the accreditation values onto the order at sale time', async () => {
    // Blank in .env.test, so a sale made now records that there was no claim.
    const order = await createOrder(manualOrderInput());
    expect(order.protectionHolder).toBeNull();
    expect(order.protectionNumber).toBeNull();
  });

  it('links to the enquiry it came from', async () => {
    const enquiry = await prisma.enquiry.create({
      data: {
        reference: 'ENQ-LINK01',
        name: 'Amara Okafor',
        email: 'amara@example.com',
        phone: '+447700900123',
        tripType: 'flight_hotel',
      },
    });
    const order = await createOrder(manualOrderInput({ enquiryId: enquiry.id }));
    expect(order.enquiryId).toBe(enquiry.id);
  });
});

describe('webhook idempotency', () => {
  it('confirms the order and issues exactly one document', async () => {
    const order = await createOrder(manualOrderInput({ orderType: 'api', supplier: 'duffel' }));
    await applyPaymentEvent(
      succeededEvent({ orderRef: order.reference, amountMinor: order.totalMinor })
    );

    const confirmed = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { documents: true, payments: true },
    });
    expect(confirmed.status).toBe('confirmed');
    expect(confirmed.documents).toHaveLength(1);
    expect(confirmed.payments).toHaveLength(1);
    expect(confirmed.paidMinor).toBe(order.totalMinor);
  });

  it('a replayed event sends no second confirmation email', async () => {
    const order = await createOrder(manualOrderInput({ orderType: 'api', supplier: 'duffel' }));
    const emailModule = await import('@/lib/email');
    const sendSpy = vi.spyOn(emailModule, 'sendEmail');

    const event = succeededEvent({ orderRef: order.reference, amountMinor: order.totalMinor });
    await applyPaymentEvent(event);
    const callsAfterFirst = sendSpy.mock.calls.length;

    // Exactly as Stripe would retry it.
    await applyPaymentEvent(event);

    expect(sendSpy.mock.calls.length).toBe(callsAfterFirst);

    const documents = await prisma.confirmationDocument.findMany({
      where: { orderId: order.id },
    });
    expect(documents).toHaveLength(1);
  });

  it('a replay does not change issuedAt or duplicate the payment', async () => {
    const order = await createOrder(manualOrderInput({ orderType: 'api', supplier: 'duffel' }));
    const event = succeededEvent({ orderRef: order.reference, amountMinor: order.totalMinor });

    await applyPaymentEvent(event);
    const first = await prisma.confirmationDocument.findFirstOrThrow({
      where: { orderId: order.id },
    });

    await applyPaymentEvent(event);
    const after = await prisma.confirmationDocument.findFirstOrThrow({
      where: { orderId: order.id },
    });

    expect(after.issuedAt.getTime()).toBe(first.issuedAt.getTime());
    expect(await prisma.payment.count({ where: { orderId: order.id } })).toBe(1);
  });

  it('ignores an event for an unknown order reference', async () => {
    await applyPaymentEvent(succeededEvent({ orderRef: 'EZY-NOSUCH' }));
    expect(await prisma.confirmationDocument.count()).toBe(0);
  });
});

describe('the confirmation invariant', () => {
  it('an order whose document cannot be delivered is NEVER confirmed', async () => {
    const order = await createOrder(manualOrderInput());

    const emailModule = await import('@/lib/email');
    vi.spyOn(emailModule, 'sendEmail').mockRejectedValue(new Error('smtp down'));

    const result = await issueConfirmation(order.id, `manual:${order.id}`);
    expect(result.issued).toBe(false);

    const after = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { documents: true },
    });

    expect(after.status).toBe('requires_attention');
    expect(after.status).not.toBe('confirmed');
    expect(after.documents[0].deliveryStatus).toBe('failed');
  });

  it('the same applies on the payment path', async () => {
    const order = await createOrder(manualOrderInput({ orderType: 'api', supplier: 'duffel' }));
    const emailModule = await import('@/lib/email');
    vi.spyOn(emailModule, 'sendEmail').mockRejectedValue(new Error('smtp down'));

    await applyPaymentEvent(
      succeededEvent({ orderRef: order.reference, amountMinor: order.totalMinor })
    );

    const after = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(after.status).toBe('requires_attention');
  });

  it('a retry after the cause is fixed does confirm, reusing the same document', async () => {
    const order = await createOrder(manualOrderInput());
    const emailModule = await import('@/lib/email');
    const spy = vi.spyOn(emailModule, 'sendEmail').mockRejectedValue(new Error('smtp down'));

    await issueConfirmation(order.id, `manual:${order.id}`);
    spy.mockRestore();

    const retry = await issueConfirmation(order.id, `manual:${order.id}`);
    expect(retry.issued).toBe(true);

    const after = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { documents: true },
    });
    expect(after.status).toBe('confirmed');
    expect(after.documents).toHaveLength(1);
  });
});
