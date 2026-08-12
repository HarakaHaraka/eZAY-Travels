import { randomUUID } from 'crypto';
import type {
  CreateOrderParams,
  CreateOrderResult,
  FlightGateway,
  RawOffer,
  RawStay,
  SearchQuery,
} from './types';

/**
 * Fixture-backed stand-in for Duffel, used only when DUFFEL_API_KEY is blank.
 * Lets the whole search → attach → book flow be exercised locally. Never
 * selected in production — see config.assertProductionReady.
 *
 * Offers are cached on globalThis because Next bundles route handlers and
 * page server components separately; a module-scoped cache would give each
 * its own copy and an offer id from a search would 404 on the detail page.
 */

const ROUTES: Record<string, { country: string; minutes: number; baseMinor: number; name: string }> = {
  LOS: { country: 'NG', minutes: 400, baseMinor: 48_900, name: 'Lagos' },
  ASR: { country: 'TR', minutes: 240, baseMinor: 35_200, name: 'Kayseri' },
  NBO: { country: 'KE', minutes: 525, baseMinor: 44_900, name: 'Nairobi' },
  ZNZ: { country: 'TZ', minutes: 860, baseMinor: 55_800, name: 'Zanzibar' },
  CNX: { country: 'TH', minutes: 1050, baseMinor: 58_800, name: 'Chiang Mai' },
  BKK: { country: 'TH', minutes: 945, baseMinor: 54_100, name: 'Bangkok' },
  FCO: { country: 'IT', minutes: 160, baseMinor: 13_400, name: 'Rome' },
  GVA: { country: 'CH', minutes: 100, baseMinor: 15_200, name: 'Geneva' },
  MNL: { country: 'PH', minutes: 1225, baseMinor: 63_600, name: 'Manila' },
  CDG: { country: 'FR', minutes: 75, baseMinor: 9_400, name: 'Paris' },
};

const CARRIERS = [
  { code: 'BA', name: 'British Airways', factor: 1.0 },
  { code: 'VS', name: 'Virgin Atlantic', factor: 1.08 },
  { code: 'KL', name: 'KLM', factor: 0.9 },
  { code: 'QR', name: 'Qatar Airways', factor: 0.97 },
];

const globalForOffers = globalThis as unknown as { __ezayMockOffers?: Map<string, RawOffer> };
const offerCache: Map<string, RawOffer> = (globalForOffers.__ezayMockOffers ??= new Map());

function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

export class MockFlightGateway implements FlightGateway {
  async searchOffers(query: SearchQuery): Promise<RawOffer[]> {
    const dest = query.destination.toUpperCase().slice(-3);
    const route = ROUTES[dest] ?? { country: 'US', minutes: 480, baseMinor: 45_000, name: dest };

    const offers = CARRIERS.map((carrier) => {
      const supplierOfferId = `off_mock_${randomUUID()}`;
      const outboundDepart = `${query.departureDate}T09:20:00.000Z`;
      const perPassenger = Math.round(route.baseMinor * carrier.factor);

      const slices = [
        {
          originIata: query.origin.toUpperCase().slice(-3),
          destinationIata: dest,
          destinationCountryCode: route.country,
          durationMinutes: route.minutes,
          segments: [
            {
              originIata: query.origin.toUpperCase().slice(-3),
              destinationIata: dest,
              departsAt: outboundDepart,
              arrivesAt: addMinutes(outboundDepart, route.minutes),
              marketingCarrier: carrier.code,
              marketingCarrierName: carrier.name,
              flightNumber: `${100 + Math.floor(Math.random() * 800)}`,
              durationMinutes: route.minutes,
            },
          ],
        },
      ];

      if (query.returnDate) {
        const returnDepart = `${query.returnDate}T17:45:00.000Z`;
        slices.push({
          originIata: dest,
          destinationIata: query.origin.toUpperCase().slice(-3),
          destinationCountryCode: 'GB',
          durationMinutes: route.minutes,
          segments: [
            {
              originIata: dest,
              destinationIata: query.origin.toUpperCase().slice(-3),
              departsAt: returnDepart,
              arrivesAt: addMinutes(returnDepart, route.minutes),
              marketingCarrier: carrier.code,
              marketingCarrierName: carrier.name,
              flightNumber: `${100 + Math.floor(Math.random() * 800)}`,
              durationMinutes: route.minutes,
            },
          ],
        });
      }

      const multiplier = query.returnDate ? 1.7 : 1;
      const offer: RawOffer = {
        supplierOfferId,
        costMinor: Math.round(perPassenger * multiplier) * query.passengerCount,
        currency: 'GBP',
        passengerCount: query.passengerCount,
        slices,
        expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      };
      offerCache.set(supplierOfferId, offer);
      return offer;
    });

    return offers.sort((a, b) => a.costMinor - b.costMinor);
  }

  async getOffer(supplierOfferId: string): Promise<RawOffer | null> {
    return offerCache.get(supplierOfferId) ?? null;
  }

  async searchStays(query: {
    destination: string;
    checkIn: string;
    checkOut: string;
  }): Promise<RawStay[]> {
    const nights = Math.max(
      1,
      Math.round(
        (new Date(query.checkOut).getTime() - new Date(query.checkIn).getTime()) / 86_400_000
      )
    );
    const city = query.destination.toUpperCase();
    // IDs must be DETERMINISTIC for the query, not random. The offer-detail
    // page searches stays and the customer picks one; the checkout route then
    // re-searches server-side to re-derive the price. With random ids that
    // second search returns different ids and the chosen hotel is silently
    // dropped from the order — a bug only an end-to-end run surfaces. Keying
    // the id on destination + dates + slot keeps the two searches in sync.
    const key = `${city}-${query.checkIn}-${query.checkOut}`;
    return [
      {
        supplierStayId: `stay_mock_${key}-0`,
        name: 'Central 4-star',
        location: `${city} city centre`,
        nights,
        ratingStars: 4,
        costMinor: 7_100 * nights,
        currency: 'GBP',
      },
      {
        supplierStayId: `stay_mock_${key}-1`,
        name: 'Boutique guesthouse',
        location: `${city}, quiet quarter`,
        nights,
        ratingStars: 3,
        costMinor: 4_800 * nights,
        currency: 'GBP',
      },
    ];
  }

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const lead = params.passengers[0];
    const initials = `${lead?.givenName?.[0] ?? 'X'}${lead?.familyName?.[0] ?? 'X'}`.toUpperCase();
    return {
      supplierOrderId: `ord_mock_${randomUUID()}`,
      bookingReference: `${initials}${Math.floor(1000 + Math.random() * 9000)}`,
    };
  }
}
