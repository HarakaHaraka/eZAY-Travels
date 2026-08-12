import { describe, expect, it } from 'vitest';
import { priceOffer, insuranceQuote, priceStay, HOTEL_COMMISSION_PCT } from '@/lib/offers';
import type { RawOffer, RawStay } from '@/lib/duffel/types';

function rawOffer(overrides: Partial<RawOffer> = {}): RawOffer {
  return {
    supplierOfferId: 'off_1',
    costMinor: 100_000,
    currency: 'GBP',
    passengerCount: 2,
    expiresAt: new Date().toISOString(),
    slices: [
      {
        originIata: 'LHR',
        destinationIata: 'LOS',
        destinationCountryCode: 'NG',
        durationMinutes: 400,
        segments: [
          {
            originIata: 'LHR',
            destinationIata: 'LOS',
            departsAt: '2026-12-18T09:20:00Z',
            arrivesAt: '2026-12-18T16:00:00Z',
            marketingCarrier: 'VS',
            marketingCarrierName: 'Virgin Atlantic',
            flightNumber: '411',
            durationMinutes: 400,
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe('priceOffer', () => {
  it('applies the long-haul markup and exposes the fee on the breakdown line', () => {
    // Lagos is long-haul (region), config long-haul is 8%.
    const priced = priceOffer(rawOffer());
    expect(priced.longHaul).toBe(true);
    expect(priced.markupMinor).toBe(8_000);
    expect(priced.totalMinor).toBe(108_000);
    // The breakdown line prints the fee — this is the positioning.
    expect(priced.breakdown).toContain('our fee');
    expect(priced.breakdown).toContain('£80.00');
  });

  it('splits the total across passengers for the per-person figure', () => {
    const priced = priceOffer(rawOffer({ passengerCount: 2, costMinor: 100_000 }));
    expect(priced.perPassengerMinor).toBe(54_000);
  });

  it('uses the short-haul rule for a European destination', () => {
    const priced = priceOffer(
      rawOffer({
        costMinor: 20_000,
        passengerCount: 1,
        slices: [
          {
            originIata: 'LGW',
            destinationIata: 'FCO',
            destinationCountryCode: 'IT',
            durationMinutes: 160,
            segments: [
              {
                originIata: 'LGW',
                destinationIata: 'FCO',
                departsAt: '2026-09-24T09:00:00Z',
                arrivesAt: '2026-09-24T11:40:00Z',
                marketingCarrier: 'AZ',
                marketingCarrierName: 'ITA Airways',
                flightNumber: '205',
                durationMinutes: 160,
              },
            ],
          },
        ],
      })
    );
    expect(priced.longHaul).toBe(false);
    // 5% of £200 = £10, above the £15 floor? No — £10 < £15, so the floor binds.
    expect(priced.markupMinor).toBe(1_500);
    expect(priced.ruleApplied).toBe('minimum_floor');
  });

  it('reports stops from the segment count', () => {
    const twoSeg = rawOffer({
      slices: [
        {
          originIata: 'LHR',
          destinationIata: 'CNX',
          destinationCountryCode: 'TH',
          durationMinutes: 1050,
          segments: [
            {
              originIata: 'LHR',
              destinationIata: 'DOH',
              departsAt: '2026-11-09T09:00:00Z',
              arrivesAt: '2026-11-09T18:00:00Z',
              marketingCarrier: 'QR',
              marketingCarrierName: 'Qatar Airways',
              flightNumber: '8',
              durationMinutes: 400,
            },
            {
              originIata: 'DOH',
              destinationIata: 'CNX',
              departsAt: '2026-11-09T20:00:00Z',
              arrivesAt: '2026-11-10T06:30:00Z',
              marketingCarrier: 'QR',
              marketingCarrierName: 'Qatar Airways',
              flightNumber: '832',
              durationMinutes: 420,
            },
          ],
        },
      ],
    });
    expect(priceOffer(twoSeg).stops).toBe(1);
  });
});

describe('insuranceQuote', () => {
  it('sells above cost, scaled by passengers', () => {
    const q = insuranceQuote(2, true);
    expect(q.sellMinor).toBeGreaterThan(q.costMinor);
    expect(q.sellMinor).toBe(4_200 * 2);
    expect(q.description).toContain('2 travellers');
  });
});

describe('priceStay', () => {
  it('adds the hotel commission on top of cost', () => {
    const stay: RawStay = {
      supplierStayId: 'stay_1',
      name: 'Central 4-star',
      location: 'LOS',
      nights: 5,
      costMinor: 35_500,
      currency: 'GBP',
    };
    const priced = priceStay(stay);
    expect(priced.sellMinor).toBe(Math.round(35_500 * (1 + HOTEL_COMMISSION_PCT / 100)));
    expect(priced.commissionMinor).toBe(priced.sellMinor - stay.costMinor);
    expect(priced.commissionMinor).toBeGreaterThan(0);
  });
});
