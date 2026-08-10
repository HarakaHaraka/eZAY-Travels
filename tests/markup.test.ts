import { describe, expect, it } from 'vitest';
import { calculateMarkup, isLongHaul, LONG_HAUL_MINUTES } from '@/lib/markup';

/**
 * Config under test (tests/setup.ts), matching .env.example:
 *   short-haul 0.05 (5%), long-haul 0.08 (8%), floor 1500 minor (£15/ticket)
 */

describe('rule 1 — short-haul percentage', () => {
  it('applies 5% of supplier cost', () => {
    const result = calculateMarkup({ costMinor: 100_000, ticketCount: 1, longHaul: false });
    expect(result.markupMinor).toBe(5_000);
    expect(result.totalMinor).toBe(105_000);
    expect(result.ruleApplied).toBe('short_haul_pct');
  });

  it('rounds a fractional pence markup to a whole integer', () => {
    // 99_999 * 0.05 = 4999.95
    const result = calculateMarkup({ costMinor: 99_999, ticketCount: 1, longHaul: false });
    expect(result.markupMinor).toBe(5_000);
    expect(Number.isInteger(result.markupMinor)).toBe(true);
    expect(Number.isInteger(result.totalMinor)).toBe(true);
  });
});

describe('rule 2 — long-haul percentage', () => {
  it('applies 8% of supplier cost', () => {
    const result = calculateMarkup({ costMinor: 100_000, ticketCount: 1, longHaul: true });
    expect(result.markupMinor).toBe(8_000);
    expect(result.totalMinor).toBe(108_000);
    expect(result.ruleApplied).toBe('long_haul_pct');
  });

  it('earns more than short-haul on the same cost', () => {
    const short = calculateMarkup({ costMinor: 80_000, ticketCount: 1, longHaul: false });
    const long = calculateMarkup({ costMinor: 80_000, ticketCount: 1, longHaul: true });
    expect(long.markupMinor).toBeGreaterThan(short.markupMinor);
  });
});

describe('rule 3 — minimum per-ticket floor, applied after the percentage', () => {
  it('lifts a cheap short-haul fare up to the floor', () => {
    // 5% of £120.00 is £6.00, below the £15.00 floor.
    const result = calculateMarkup({ costMinor: 12_000, ticketCount: 1, longHaul: false });
    expect(result.markupMinor).toBe(1_500);
    expect(result.totalMinor).toBe(13_500);
    expect(result.ruleApplied).toBe('minimum_floor');
  });

  it('applies PER TICKET, not per booking', () => {
    // 5% of £360 = £18.00; floor is 3 × £15.00 = £45.00 and must win.
    const result = calculateMarkup({ costMinor: 36_000, ticketCount: 3, longHaul: false });
    expect(result.markupMinor).toBe(4_500);
    expect(result.ruleApplied).toBe('minimum_floor');
  });

  it('does not bind once the percentage clears it', () => {
    // 5% of £400 = £20.00, above the £15.00 single-ticket floor.
    const result = calculateMarkup({ costMinor: 40_000, ticketCount: 1, longHaul: false });
    expect(result.markupMinor).toBe(2_000);
    expect(result.ruleApplied).toBe('short_haul_pct');
  });

  it('can bind on long-haul too when the fare is small and the party large', () => {
    // 8% of £100 = £8; floor is 4 × £15 = £60.
    const result = calculateMarkup({ costMinor: 10_000, ticketCount: 4, longHaul: true });
    expect(result.markupMinor).toBe(6_000);
    expect(result.ruleApplied).toBe('minimum_floor');
  });

  it('is a floor, never a cap — a large fare keeps its percentage', () => {
    const result = calculateMarkup({ costMinor: 500_000, ticketCount: 1, longHaul: true });
    expect(result.markupMinor).toBe(40_000);
    expect(result.markupMinor).toBeGreaterThan(1_500);
  });
});

describe('no floats reach an amount', () => {
  it('rejects a non-integer cost', () => {
    expect(() => calculateMarkup({ costMinor: 100.5, ticketCount: 1, longHaul: false })).toThrow();
  });

  it('rejects a negative cost', () => {
    expect(() => calculateMarkup({ costMinor: -1, ticketCount: 1, longHaul: false })).toThrow();
  });

  it('rejects a zero ticket count', () => {
    expect(() => calculateMarkup({ costMinor: 10_000, ticketCount: 0, longHaul: false })).toThrow();
  });

  it('always returns integers', () => {
    for (const cost of [1, 7, 999, 12_345, 987_654]) {
      for (const tickets of [1, 2, 5]) {
        const result = calculateMarkup({ costMinor: cost, ticketCount: tickets, longHaul: true });
        expect(Number.isInteger(result.markupMinor)).toBe(true);
        expect(Number.isInteger(result.totalMinor)).toBe(true);
        expect(result.totalMinor).toBe(result.costMinor + result.markupMinor);
      }
    }
  });
});

describe('long-haul detection', () => {
  it('detects by duration', () => {
    expect(isLongHaul({ durationMinutes: LONG_HAUL_MINUTES })).toBe(true);
    expect(isLongHaul({ durationMinutes: LONG_HAUL_MINUTES - 1 })).toBe(false);
  });

  it('detects by region when the destination is outside the short-haul set', () => {
    // A fare to Lagos behaves nothing like a fare to Lisbon.
    expect(isLongHaul({ durationMinutes: 300, destinationCountryCode: 'NG' })).toBe(true);
    expect(isLongHaul({ durationMinutes: 300, destinationCountryCode: 'PT' })).toBe(false);
  });

  it('falls back to short-haul when nothing is known', () => {
    expect(isLongHaul({})).toBe(false);
  });
});
