/*
 * Adapter for the Duffel SDK. Duffel's response types are wide and vary by
 * endpoint and API version, so this boundary reads them as `any` and maps
 * them onto our own narrow types (see ./types.ts). `any` stops at this file —
 * everything downstream consumes RawOffer/RawStay.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Duffel } from '@duffel/api';
import { config } from '../config';
import { decimalStringToMinor } from '../money';
import type {
  CreateOrderParams,
  CreateOrderResult,
  FlightGateway,
  RawOffer,
  RawStay,
  SearchQuery,
} from './types';

/** ISO 8601 duration ("PT7H35M") → minutes. */
function isoDurationToMinutes(duration: string | null | undefined): number {
  if (!duration) return 0;
  const match = /P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/.exec(duration);
  if (!match) return 0;
  const [, days, hours, minutes] = match;
  return Number(days ?? 0) * 1440 + Number(hours ?? 0) * 60 + Number(minutes ?? 0);
}

function toRawOffer(offer: any, passengerCount: number): RawOffer {
  const slices = (offer.slices ?? []).map((slice: any) => {
    const segments = (slice.segments ?? []).map((segment: any) => ({
      originIata: segment.origin?.iata_code ?? '',
      destinationIata: segment.destination?.iata_code ?? '',
      departsAt: segment.departing_at,
      arrivesAt: segment.arriving_at,
      marketingCarrier: segment.marketing_carrier?.iata_code ?? '',
      marketingCarrierName: segment.marketing_carrier?.name ?? '',
      flightNumber: segment.marketing_carrier_flight_number ?? '',
      durationMinutes: isoDurationToMinutes(segment.duration),
    }));
    return {
      originIata: slice.origin?.iata_code ?? '',
      destinationIata: slice.destination?.iata_code ?? '',
      destinationCountryCode: slice.destination?.iata_country_code ?? undefined,
      durationMinutes:
        isoDurationToMinutes(slice.duration) ||
        segments.reduce((total: number, s: any) => total + s.durationMinutes, 0),
      segments,
    };
  });

  return {
    supplierOfferId: offer.id,
    costMinor: decimalStringToMinor(offer.total_amount),
    currency: offer.total_currency,
    passengerCount,
    slices,
    expiresAt: offer.expires_at,
  };
}

export class DuffelFlightGateway implements FlightGateway {
  private client = new Duffel({ token: config.duffel.apiKey });

  async searchOffers(query: SearchQuery): Promise<RawOffer[]> {
    const slices = [
      {
        origin: query.origin,
        destination: query.destination,
        departure_date: query.departureDate,
        arrival_time: null,
        departure_time: null,
      },
      ...(query.returnDate
        ? [
            {
              origin: query.destination,
              destination: query.origin,
              departure_date: query.returnDate,
              arrival_time: null,
              departure_time: null,
            },
          ]
        : []),
    ];

    const offerRequest = await this.client.offerRequests.create({
      slices,
      passengers: Array.from({ length: query.passengerCount }, () => ({ type: 'adult' as const })),
      cabin_class: 'economy',
    });

    const { data } = await this.client.offers.list({
      offer_request_id: offerRequest.data.id,
      limit: 50,
    });
    return data.map((offer: any) => toRawOffer(offer, query.passengerCount));
  }

  async getOffer(supplierOfferId: string): Promise<RawOffer | null> {
    try {
      const { data } = await this.client.offers.get(supplierOfferId);
      const passengerCount = (data as any).passengers?.length ?? 1;
      return toRawOffer(data, passengerCount);
    } catch {
      return null;
    }
  }

  async searchStays(_query: {
    destination: string;
    checkIn: string;
    checkOut: string;
  }): Promise<RawStay[]> {
    // Duffel Stays needs a geographic search we cannot build without a
    // coordinate-lookup service. Returning none is honest — the attach step
    // then shows insurance only and says hotels are quoted by hand.
    return [];
  }

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const offer = await this.client.offers.get(params.supplierOfferId);
    const offerPassengers = (offer.data as any).passengers ?? [];

    const { data: order } = await this.client.orders.create({
      type: 'instant',
      selected_offers: [params.supplierOfferId],
      payments: [
        { type: 'balance', currency: offer.data.total_currency, amount: offer.data.total_amount },
      ],
      passengers: params.passengers.map((passenger, index) => ({
        id: offerPassengers[index]?.id,
        given_name: passenger.givenName,
        family_name: passenger.familyName,
        born_on: passenger.bornOn,
        email: params.contactEmail,
        phone_number: params.contactPhone,
      })) as any,
    });

    return { supplierOrderId: order.id, bookingReference: order.booking_reference };
  }
}
