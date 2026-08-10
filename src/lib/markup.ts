import { config } from './config';

/**
 * The three markup rules, in this precedence:
 *
 *   1. Short-haul  -> MARKUP_SHORT_HAUL_PCT of supplier cost
 *   2. Long-haul   -> MARKUP_LONG_HAUL_PCT of supplier cost
 *   3. Floor       -> never less than MARKUP_MIN_PER_TICKET_MINOR per ticket,
 *                     applied AFTER the percentage
 *
 * Percentages are fractions (0.05 = 5%), matching .env.example.
 * All amounts are integer minor units. A percentage is applied and rounded
 * back to an integer immediately, so no float survives into a stored amount.
 */

/** At or above this journey duration, a fare is long-haul. */
export const LONG_HAUL_MINUTES = 360; // 6 hours

/**
 * Countries treated as short-haul by region when duration is unknown or
 * borderline. A fare to Lagos behaves nothing like a fare to Lisbon.
 */
const SHORT_HAUL_COUNTRIES = new Set([
  'GB', 'IE', 'FR', 'ES', 'PT', 'IT', 'DE', 'NL', 'BE', 'LU', 'CH', 'AT',
  'DK', 'SE', 'NO', 'FI', 'IS', 'PL', 'CZ', 'SK', 'HU', 'SI', 'HR', 'RO',
  'BG', 'GR', 'CY', 'MT', 'EE', 'LV', 'LT', 'RS', 'BA', 'AL', 'MK', 'ME',
  'MA', 'TN', 'TR',
]);

export interface HaulInput {
  /** Total journey duration in minutes, when known. */
  durationMinutes?: number;
  /** Destination ISO-3166 alpha-2, when known. */
  destinationCountryCode?: string;
}

export function isLongHaul(input: HaulInput): boolean {
  if (typeof input.durationMinutes === 'number' && input.durationMinutes >= LONG_HAUL_MINUTES) {
    return true;
  }
  const country = input.destinationCountryCode?.toUpperCase();
  if (country && country.length === 2) {
    return !SHORT_HAUL_COUNTRIES.has(country);
  }
  return false;
}

export type MarkupRule = 'short_haul_pct' | 'long_haul_pct' | 'minimum_floor';

export interface MarkupInput {
  /** What we pay the supplier, for the whole booking, in minor units. */
  costMinor: number;
  /** Ticket count — the floor is per ticket, not per booking. */
  ticketCount: number;
  longHaul: boolean;
}

export interface MarkupResult {
  costMinor: number;
  markupMinor: number;
  /** costMinor + markupMinor. What the customer pays. */
  totalMinor: number;
  ruleApplied: MarkupRule;
  /** The fraction actually used, for the admin margin view. */
  pctUsed: number;
}

export function calculateMarkup(input: MarkupInput): MarkupResult {
  const { costMinor, ticketCount, longHaul } = input;

  if (!Number.isInteger(costMinor) || costMinor < 0) {
    throw new Error('costMinor must be a non-negative integer (minor units)');
  }
  if (!Number.isInteger(ticketCount) || ticketCount < 1) {
    throw new Error('ticketCount must be a positive integer');
  }

  const pctUsed = longHaul ? config.markup.longHaulPct : config.markup.shortHaulPct;
  const pctMarkupMinor = Math.round(costMinor * pctUsed);
  const floorMinor = config.markup.minPerTicketMinor * ticketCount;

  // The floor is applied AFTER the percentage, and wins when it is higher.
  const floorWins = floorMinor > pctMarkupMinor;
  const markupMinor = floorWins ? floorMinor : pctMarkupMinor;

  return {
    costMinor,
    markupMinor,
    totalMinor: costMinor + markupMinor,
    ruleApplied: floorWins ? 'minimum_floor' : longHaul ? 'long_haul_pct' : 'short_haul_pct',
    pctUsed,
  };
}
