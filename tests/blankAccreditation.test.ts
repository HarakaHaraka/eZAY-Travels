import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  accreditationClaim,
  canSellFlights,
  canSellHotelOnly,
  canSellPackages,
  flightCheckoutBlockedReason,
  protectionSnapshot,
} from '@/lib/accreditation';

/**
 * The blank-config guard, which is the one test that keeps the business legal.
 *
 * eZAY ships with ATOL_HOLDER_NAME and ATOL_NUMBER blank and must, in that
 * state, make no protection claim anywhere and take no flight booking.
 */

const ORIGINAL = { ...process.env };

beforeEach(() => {
  process.env.ATOL_HOLDER_NAME = '';
  process.env.ATOL_NUMBER = '';
  process.env.ATOL_STATEMENT = '';
  process.env.ATOL_SCOPE = 'flight_only';
});

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe('blank config — the shipped default', () => {
  it('exposes no claim at all', () => {
    expect(accreditationClaim()).toBeNull();
  });

  it('disables flight checkout', () => {
    expect(canSellFlights()).toBe(false);
  });

  it('disables packages', () => {
    expect(canSellPackages()).toBe(false);
  });

  it('presents the enquiry form as the path forward', () => {
    const reason = flightCheckoutBlockedReason();
    expect(reason).not.toBeNull();
    expect(reason).toMatch(/quote|dates/i);
  });

  it('freezes nulls onto an order, recording that there was no claim', () => {
    expect(protectionSnapshot()).toEqual({
      protectionHolder: null,
      protectionNumber: null,
      protectionStatement: null,
    });
  });

  it('still allows hotel-only sales — gate the bundle, not the bed', () => {
    // Hotel-only sales are outside ATOL entirely.
    expect(canSellHotelOnly()).toBe(true);
  });
});

describe('partially populated config is still blank', () => {
  it('holder name without a number claims nothing', () => {
    process.env.ATOL_HOLDER_NAME = 'Partner Travel Ltd';
    process.env.ATOL_NUMBER = '';
    expect(accreditationClaim()).toBeNull();
    expect(canSellFlights()).toBe(false);
  });

  it('number without a holder name claims nothing', () => {
    process.env.ATOL_HOLDER_NAME = '';
    process.env.ATOL_NUMBER = '11223';
    expect(accreditationClaim()).toBeNull();
    expect(canSellFlights()).toBe(false);
  });

  it('whitespace does not count as populated', () => {
    process.env.ATOL_HOLDER_NAME = '   ';
    process.env.ATOL_NUMBER = '  ';
    expect(accreditationClaim()).toBeNull();
    expect(canSellFlights()).toBe(false);
  });
});

describe('populated config', () => {
  beforeEach(() => {
    process.env.ATOL_HOLDER_NAME = 'Partner Travel Ltd';
    process.env.ATOL_NUMBER = '11223';
    process.env.ATOL_STATEMENT = 'Your flight booking is protected under ATOL 11223.';
  });

  it('reads holder, number and statement from config, never from code', () => {
    const claim = accreditationClaim();
    expect(claim).not.toBeNull();
    expect(claim!.holderName).toBe('Partner Travel Ltd');
    expect(claim!.number).toBe('11223');
    expect(claim!.statement).toBe('Your flight booking is protected under ATOL 11223.');
  });

  it('enables flight checkout when flight_only is in scope', () => {
    process.env.ATOL_SCOPE = 'flight_only';
    expect(canSellFlights()).toBe(true);
    expect(flightCheckoutBlockedReason()).toBeNull();
  });

  it('still refuses flights when the scope excludes them', () => {
    process.env.ATOL_SCOPE = 'package';
    expect(canSellFlights()).toBe(false);
    expect(canSellPackages()).toBe(true);
    expect(flightCheckoutBlockedReason()).not.toBeNull();
  });

  it('refuses everything when the scope is empty', () => {
    process.env.ATOL_SCOPE = '';
    expect(canSellFlights()).toBe(false);
    expect(canSellPackages()).toBe(false);
  });

  it('freezes the live values onto an order', () => {
    expect(protectionSnapshot()).toEqual({
      protectionHolder: 'Partner Travel Ltd',
      protectionNumber: '11223',
      protectionStatement: 'Your flight booking is protected under ATOL 11223.',
    });
  });
});
