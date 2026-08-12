/**
 * The flight gateway interface.
 *
 * Only Duffel is programmable, so this is the one supply route with a live
 * client. Faremine and the ticketing partner are logged by hand in admin and
 * never touch this. A fixture-backed implementation stands in when
 * DUFFEL_API_KEY is blank, so the whole search → attach → book flow is
 * exercisable with no Duffel account.
 *
 * Everything here is supplier-side and pre-markup. Prices are integer minor
 * units (pence).
 */

export interface FlightSegment {
  originIata: string;
  destinationIata: string;
  departsAt: string;
  arrivesAt: string;
  marketingCarrier: string;
  marketingCarrierName: string;
  flightNumber: string;
  durationMinutes: number;
}

export interface FlightSlice {
  originIata: string;
  destinationIata: string;
  destinationCountryCode?: string;
  durationMinutes: number;
  segments: FlightSegment[];
}

/** A fare as the supplier returns it, before eZAY markup. */
export interface RawOffer {
  supplierOfferId: string;
  /** Supplier net fare for the whole booking, minor units. */
  costMinor: number;
  currency: string;
  passengerCount: number;
  slices: FlightSlice[];
  expiresAt: string;
}

export interface RawStay {
  supplierStayId: string;
  name: string;
  location: string;
  nights: number;
  ratingStars?: number;
  /** Net cost to eZAY, minor units. */
  costMinor: number;
  currency: string;
}

export interface SearchQuery {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengerCount: number;
}

export interface CreateOrderParams {
  supplierOfferId: string;
  passengers: Array<{ givenName: string; familyName: string; bornOn?: string }>;
  contactEmail: string;
  contactPhone?: string;
}

export interface CreateOrderResult {
  supplierOrderId: string;
  bookingReference: string;
}

export interface FlightGateway {
  searchOffers(query: SearchQuery): Promise<RawOffer[]>;
  getOffer(supplierOfferId: string): Promise<RawOffer | null>;
  searchStays(query: { destination: string; checkIn: string; checkOut: string }): Promise<RawStay[]>;
  createOrder(params: CreateOrderParams): Promise<CreateOrderResult>;
}
