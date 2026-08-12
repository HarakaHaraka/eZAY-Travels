import { calculateMarkup, isLongHaul } from './markup';
import { formatMoney } from './money';
import type { RawOffer, RawStay } from './duffel/types';

/** A supplier fare with eZAY markup applied — what a customer is shown. */
export interface PricedOffer {
  id: string;
  costMinor: number;
  markupMinor: number;
  totalMinor: number;
  perPassengerMinor: number;
  currency: string;
  passengerCount: number;
  longHaul: boolean;
  ruleApplied: string;
  slices: RawOffer['slices'];
  expiresAt: string;
  stops: number;
  totalDurationMinutes: number;
  /**
   * The breakdown line that prints our fee. This is the positioning — the
   * design brief says never remove it.
   */
  breakdown: string;
}

export function priceOffer(raw: RawOffer): PricedOffer {
  const outbound = raw.slices[0];
  const longHaul = isLongHaul({
    durationMinutes: outbound?.durationMinutes,
    destinationCountryCode: outbound?.destinationCountryCode,
  });

  const markup = calculateMarkup({
    costMinor: raw.costMinor,
    ticketCount: raw.passengerCount,
    longHaul,
  });

  const totalDuration = raw.slices.reduce((total, slice) => total + slice.durationMinutes, 0);
  const stops = Math.max(0, (raw.slices[0]?.segments.length ?? 1) - 1);

  return {
    id: raw.supplierOfferId,
    costMinor: markup.costMinor,
    markupMinor: markup.markupMinor,
    totalMinor: markup.totalMinor,
    perPassengerMinor: Math.round(markup.totalMinor / raw.passengerCount),
    currency: raw.currency,
    passengerCount: raw.passengerCount,
    longHaul,
    ruleApplied: markup.ruleApplied,
    slices: raw.slices,
    expiresAt: raw.expiresAt,
    stops,
    totalDurationMinutes: totalDuration,
    breakdown: `Fare ${formatMoney(markup.costMinor, raw.currency)} · our fee ${formatMoney(markup.markupMinor, raw.currency)}`,
  };
}

/** Insurance is eZAY's own line — a flat band by haul type. */
export function insuranceQuote(passengerCount: number, longHaul: boolean) {
  const sellPerPassengerMinor = longHaul ? 4_200 : 1_900;
  const costPerPassengerMinor = longHaul ? 2_950 : 1_250;
  return {
    description: `Travel insurance — ${passengerCount} traveller${passengerCount > 1 ? 's' : ''}`,
    sellMinor: sellPerPassengerMinor * passengerCount,
    costMinor: costPerPassengerMinor * passengerCount,
  };
}

/** Hotel commission — where thin flight margin becomes real profit. */
export const HOTEL_COMMISSION_PCT = 12;

export function priceStay(stay: RawStay) {
  const sellMinor = Math.round(stay.costMinor * (1 + HOTEL_COMMISSION_PCT / 100));
  return { ...stay, sellMinor, commissionMinor: sellMinor - stay.costMinor };
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
