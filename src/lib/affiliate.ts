import { config } from './config';

/**
 * Hotel links as a revenue line.
 *
 * eZAY sells flights only and takes no payment for accommodation. The hotel
 * buttons send travellers to book elsewhere — for free, until an affiliate
 * programme (Travelpayouts / Booking.com / Hotellook) is joined. Once it is,
 * AFFILIATE_LINK_TEMPLATE holds the network's tracking link with `{url}` where
 * the destination goes, e.g.
 *
 *   https://tp.media/r?marker=123456&trs=1&p=4&u={url}
 *
 * and every hotel link on the site is wrapped automatically. Blank template ⇒
 * plain links, no disclosure, exactly as before. The price the traveller pays
 * is unchanged either way — the commission comes from the hotel's side.
 *
 * Why it matters legally: linking is lawful; HOSTING a hotel's photo is not,
 * whether or not money changes hands. The affiliate programme is also what
 * licenses partner imagery, so the two go together.
 */

export function affiliateEnabled(): boolean {
  return config.affiliate.linkTemplate.includes('{url}');
}

/** Wrap a destination URL in the affiliate tracking link, or return it as is. */
export function affiliateLink(url: string): string {
  if (!affiliateEnabled()) return url;
  return config.affiliate.linkTemplate.replace('{url}', encodeURIComponent(url));
}

/** rel for an outbound hotel link: search engines must see paid links as such. */
export function affiliateRel(): string {
  return affiliateEnabled() ? 'sponsored noopener' : 'noopener';
}

/** One plain sentence beside the panels. Empty when nothing is earned. */
export function affiliateDisclosure(): string {
  return affiliateEnabled()
    ? 'Hotel links may earn eZAY a small commission from the booking site. The price you pay is the same, and we take no payment for accommodation ourselves.'
    : '';
}
