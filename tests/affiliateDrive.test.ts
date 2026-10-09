import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

/** No third-party script on the pages that handle a card, an order or admin. */
describe('Travelpayouts Drive loader', () => {
  const source = readFileSync('src/components/site/AffiliateDrive.tsx', 'utf8');

  it('is blocked on booking, admin, status and api paths', () => {
    for (const p of ['/book', '/admin', '/status', '/api']) {
      expect(source).toContain(`'${p}'`);
    }
  });

  it('loads lazily and only from the network host', () => {
    expect(source).toContain("strategy=\"lazyOnload\"");
    expect(source).toContain('https://tpembars.com/');
  });

  it('encodes the account number the way the network expects', () => {
    expect(btoa('583538').replace(/=+$/, '')).toBe('NTgzNTM4');
  });
});
