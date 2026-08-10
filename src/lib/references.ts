import { randomInt } from 'crypto';

/**
 * Human-quotable references. The alphabet drops 0/O and 1/I so a reference
 * read down a phone line cannot come back ambiguous.
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function suffix(length: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}

/** ENQ-XXXXXX */
export function generateEnquiryReference(): string {
  return `ENQ-${suffix(6)}`;
}

/** EZY-XXXXXX — what the customer quotes on the phone. */
export function generateOrderReference(): string {
  return `EZY-${suffix(6)}`;
}
