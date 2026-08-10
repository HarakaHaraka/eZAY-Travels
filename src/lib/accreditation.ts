/**
 * Accreditation config and the blank-state guard.
 *
 * eZAY sells under a ticketing partner's accreditation, not its own. Every
 * protection claim, licence number and statement on the site, in email and on
 * documents reads from here. Nothing is hardcoded.
 *
 * THE GUARD: while ATOL_HOLDER_NAME or ATOL_NUMBER is blank —
 *   - accreditationClaim() returns null, so no claim can be rendered; there
 *     is no partially-populated claim to leak by accident, and
 *   - canSellFlights() returns false, so flight checkout is disabled and the
 *     enquiry form is presented as the path forward.
 *
 * Note what the guard does NOT block: hotel-only sales do not require ATOL.
 * Only flight-inclusive products do. Gate the bundle, not the bed.
 *
 * Ships blank.
 */

export type AtolScope = 'flight_only' | 'package';

export interface AccreditationClaim {
  holderName: string;
  number: string;
  statement: string;
  scope: AtolScope[];
}

function clean(name: string): string {
  return (process.env[name] ?? '')
    .replace(/\s+#.*$/, '')
    .trim()
    .replace(/^["']|["']$/g, '');
}

function parseScope(raw: string): AtolScope[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is AtolScope => s === 'flight_only' || s === 'package');
}

/**
 * The only way to obtain protection wording. Null unless BOTH the holder name
 * and the licence number are present, so a caller cannot render half a claim.
 */
export function accreditationClaim(): AccreditationClaim | null {
  const holderName = clean('ATOL_HOLDER_NAME');
  const number = clean('ATOL_NUMBER');
  if (holderName === '' || number === '') return null;
  return {
    holderName,
    number,
    statement: clean('ATOL_STATEMENT'),
    scope: parseScope(clean('ATOL_SCOPE')),
  };
}

/** A flight-only sale needs a complete claim that covers flight_only. */
export function canSellFlights(): boolean {
  const claim = accreditationClaim();
  return claim !== null && claim.scope.includes('flight_only');
}

/** A flight-inclusive package needs the package scope. */
export function canSellPackages(): boolean {
  const claim = accreditationClaim();
  return claim !== null && claim.scope.includes('package');
}

/**
 * Hotel-only sales are outside ATOL entirely, so they stay available even
 * with the config blank. This exists so the rule is stated once, in code,
 * rather than assumed at each call site.
 */
export function canSellHotelOnly(): boolean {
  return true;
}

/** Why flight checkout is unavailable, phrased for a customer. Null when it is. */
export function flightCheckoutBlockedReason(): string | null {
  if (canSellFlights()) return null;
  if (accreditationClaim() === null) {
    return 'We are not taking card payment for flights on this site yet. Send us your dates and we will come back with a written quote inside four working hours, and book it for you directly.';
  }
  return 'This fare type is not covered by our current accreditation, so we cannot sell it online. Send us your dates and we will quote it directly.';
}

/**
 * The values to freeze onto an Order at the moment of sale, so a later config
 * change never rewrites what a past customer was told. Returns nulls when
 * blank — an order sold with no claim records that it had none.
 */
export function protectionSnapshot(): {
  protectionHolder: string | null;
  protectionNumber: string | null;
  protectionStatement: string | null;
} {
  const claim = accreditationClaim();
  return {
    protectionHolder: claim?.holderName ?? null,
    protectionNumber: claim?.number ?? null,
    protectionStatement: claim?.statement ?? null,
  };
}
