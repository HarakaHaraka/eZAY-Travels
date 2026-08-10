/**
 * Money. Integer minor units (pence) everywhere — never Float, never
 * Decimal-as-pounds. The only place a decimal appears is at the display or
 * parse boundary, and it is rounded back to an integer immediately.
 */

export function formatMoney(amountMinor: number, currency = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amountMinor / 100);
}

/** "£1,378" style — whole pounds, for headline prices in the design. */
export function formatMoneyWhole(amountMinor: number, currency = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amountMinor / 100));
}

/** Parses a human-typed major-unit amount ("1,240.50", "£99") to minor units. */
export function parseMajorToMinor(input: string): number {
  const normalised = input.replace(/[£,\s]/g, '');
  if (normalised === '') return 0;
  const value = Number(normalised);
  if (!Number.isFinite(value)) {
    throw new Error(`Not a valid amount: ${input}`);
  }
  return Math.round(value * 100);
}

/** Duffel returns decimal strings like "412.30". */
export function decimalStringToMinor(input: string): number {
  return parseMajorToMinor(input);
}
