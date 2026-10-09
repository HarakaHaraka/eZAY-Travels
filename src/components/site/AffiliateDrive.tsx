'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

/**
 * Travelpayouts "Drive" — the affiliate network's own loader script, which
 * turns outbound hotel/booking links into tracked ones and is the network's
 * precondition for opening the account dashboard.
 *
 * Loaded ONLY on the public content pages. Never on /book (payment), /admin or
 * /status: no third-party script belongs on a page that handles a card or an
 * order. The id is the public account number (not a secret); blank disables.
 */
const BLOCKED = ['/book', '/admin', '/status', '/api'];

export function AffiliateDrive({ accountId }: { accountId: string }) {
  const pathname = usePathname() ?? '/';
  if (!accountId || BLOCKED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }
  const encoded = btoa(accountId).replace(/=+$/, '');
  return (
    <Script
      id="travelpayouts-drive"
      src={`https://tpembars.com/${encoded}.js?t=${encodeURIComponent(accountId)}`}
      strategy="lazyOnload"
      data-cmp-ab="2"
    />
  );
}
