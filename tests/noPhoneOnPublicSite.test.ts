import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The public site must never print a phone number.
 *
 * eZAY is contacted by WhatsApp and email. A phone number rendered on the page
 * was the owner's personal mobile, arriving through a config fallback, so this
 * is enforced mechanically rather than by memory: no public page or component
 * may read config.contact.phone, interpolate a phone prop, or emit a tel: link.
 *
 * The admin area and the booking form are exempt: the admin is behind a login,
 * and the booking form COLLECTS the customer's number rather than showing ours.
 */

const SRC = path.join(process.cwd(), 'src');
const EXEMPT = [
  path.join(SRC, 'app', 'admin'),
  path.join(SRC, 'components', 'admin'),
  path.join(SRC, 'components', 'fares', 'BookingFlow.tsx'),
  // Defines the value. The number is still needed for records, the admin area
  // and insurer/supplier paperwork — it simply must never reach a public page.
  path.join(SRC, 'lib', 'config.ts'),
];

const BANNED: Array<[name: string, pattern: RegExp]> = [
  ['config.contact.phone', /config\.contact\.phone/],
  ['company.phone', /company\.phone/],
  ['a tel: link', /href=\{?["'`]tel:/],
];

async function sourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      if (EXEMPT.some((e) => full === e || full.startsWith(e + path.sep))) return [];
      if (entry.isDirectory()) return sourceFiles(full);
      return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
    })
  );
  return nested.flat();
}

describe('no phone number on the public site', () => {
  it('has no banned phone usage outside the admin and the booking form', async () => {
    const files = await sourceFiles(SRC);
    expect(files.length).toBeGreaterThan(10);

    const offenders: string[] = [];
    for (const file of files) {
      const body = await readFile(file, 'utf8');
      for (const [name, pattern] of BANNED) {
        if (pattern.test(body)) {
          offenders.push(`${path.relative(process.cwd(), file)} uses ${name}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});

describe('no itemised fee beside a booking control', () => {
  it('no public page or component renders offer.breakdown', async () => {
    const files = await sourceFiles(SRC);
    const offenders: string[] = [];
    for (const file of files) {
      const body = await readFile(file, 'utf8');
      if (/\{offer\.breakdown\}|\{breakdown\}/.test(body)) {
        offenders.push(path.relative(process.cwd(), file));
      }
    }
    // CLAUDE.md rule 5: the price shown is the total; the fee is published on
    // /fees, never itemised next to a Book or Pay button.
    expect(offenders).toEqual([]);
  });
});
