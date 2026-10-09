import { describe, expect, it, vi } from 'vitest';

async function load(template: string | undefined) {
  if (template === undefined) delete process.env.AFFILIATE_LINK_TEMPLATE;
  else process.env.AFFILIATE_LINK_TEMPLATE = template;
  vi.resetModules();
  return import('@/lib/affiliate');
}

describe('hotel affiliate links', () => {
  it('leaves links, rel and disclosure untouched when no programme is joined', async () => {
    const a = await load(undefined);
    expect(a.affiliateEnabled()).toBe(false);
    expect(a.affiliateLink('https://www.sankara.com')).toBe('https://www.sankara.com');
    expect(a.affiliateRel()).toBe('noopener');
    expect(a.affiliateDisclosure()).toBe('');
  });

  it('wraps the hotel URL, marks the link sponsored and discloses it', async () => {
    const a = await load('https://tp.media/r?marker=123&p=4&u={url}');
    expect(a.affiliateEnabled()).toBe(true);
    expect(a.affiliateLink('https://www.sankara.com/?x=1')).toBe(
      'https://tp.media/r?marker=123&p=4&u=https%3A%2F%2Fwww.sankara.com%2F%3Fx%3D1'
    );
    expect(a.affiliateRel()).toBe('sponsored noopener');
    expect(a.affiliateDisclosure()).toMatch(/commission/);
    expect(a.affiliateDisclosure()).toMatch(/price you pay is the same/);
  });

  it('ignores a template with no {url} slot rather than sending travellers nowhere', async () => {
    const a = await load('https://tp.media/r?marker=123');
    expect(a.affiliateEnabled()).toBe(false);
    expect(a.affiliateLink('https://www.sankara.com')).toBe('https://www.sankara.com');
  });
});
