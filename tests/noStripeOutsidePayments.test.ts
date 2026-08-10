import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Mechanical enforcement of the payments boundary (CLAUDE.md rule 3).
 *
 * No file outside src/lib/payments/ may import the Stripe SDK. This is the
 * whole point of the abstraction: the money-flow model is not settled, so the
 * booking flow must never bind itself to one provider.
 *
 * This scans the real source tree rather than trusting convention.
 */

const SRC = path.join(process.cwd(), 'src');
const PAYMENTS_DIR = path.join(SRC, 'lib', 'payments');

// Every way the module can actually be pulled in: static import, re-export,
// CommonJS require, and dynamic import — wherever they appear in the file.
const STRIPE_IMPORT =
  /(?:from\s*['"]stripe['"]|require\(\s*['"]stripe['"]\s*\)|import\(\s*['"]stripe['"]\s*\))/;

async function sourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return sourceFiles(full);
      return /\.(ts|tsx|js|jsx|mjs)$/.test(entry.name) ? [full] : [];
    })
  );
  return nested.flat();
}

describe('Stripe SDK isolation', () => {
  it('is not imported anywhere outside src/lib/payments/', async () => {
    const files = await sourceFiles(SRC);
    const offenders: string[] = [];

    for (const file of files) {
      if (file.startsWith(PAYMENTS_DIR + path.sep)) continue;
      const contents = await readFile(file, 'utf8');
      if (STRIPE_IMPORT.test(contents)) {
        offenders.push(path.relative(process.cwd(), file));
      }
    }

    expect(
      offenders,
      `These files import the Stripe SDK directly. Use the PaymentProvider abstraction from @/lib/payments instead:\n${offenders.join('\n')}`
    ).toEqual([]);
  });

  it('is confined to the single designated file inside the payments module', async () => {
    const files = await sourceFiles(PAYMENTS_DIR);
    const importers: string[] = [];

    for (const file of files) {
      const contents = await readFile(file, 'utf8');
      if (STRIPE_IMPORT.test(contents)) importers.push(path.basename(file));
    }

    expect(importers).toEqual(['stripeSdk.ts']);
  });

  it('detects a violation when one is introduced', () => {
    // Guards the guard: if the pattern stopped matching, the scans above
    // would pass vacuously and the boundary would be unenforced.
    expect(STRIPE_IMPORT.test(`import Stripe from 'stripe';`)).toBe(true);
    expect(STRIPE_IMPORT.test(`import { Stripe } from "stripe";`)).toBe(true);
    expect(STRIPE_IMPORT.test(`export * from 'stripe';`)).toBe(true);
    expect(STRIPE_IMPORT.test(`const Stripe = require('stripe');`)).toBe(true);
    expect(STRIPE_IMPORT.test(`const s = await import('stripe');`)).toBe(true);

    // Must not fire on the abstraction itself or unrelated identifiers.
    expect(STRIPE_IMPORT.test(`import { paymentProvider } from '@/lib/payments';`)).toBe(false);
    expect(STRIPE_IMPORT.test(`import { stripeClient } from './stripeSdk';`)).toBe(false);
    expect(STRIPE_IMPORT.test(`const mode = 'stripe_direct';`)).toBe(false);
  });
});

describe('no card form anywhere', () => {
  it('nothing renders a card-number input', async () => {
    const files = await sourceFiles(SRC);
    const offenders: string[] = [];
    // Hosted checkout only — a card field in our own markup would put us in
    // PCI scope, which CLAUDE.md rule 1 forbids outright.
    const CARD_FIELD = /autoComplete=["']cc-(number|csc|exp)|name=["']cardnumber|id=["']card-number/i;

    for (const file of files) {
      const contents = await readFile(file, 'utf8');
      if (CARD_FIELD.test(contents)) offenders.push(path.relative(process.cwd(), file));
    }

    expect(offenders, `Card fields found — hosted checkout only:\n${offenders.join('\n')}`).toEqual(
      []
    );
  });
});
